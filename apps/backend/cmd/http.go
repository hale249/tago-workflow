package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/hale249/tago-workflow/apps/backend/internal/config"
	"github.com/hale249/tago-workflow/apps/backend/internal/feature/system"
	"github.com/hale249/tago-workflow/apps/backend/internal/httpresponse"
	"github.com/hale249/tago-workflow/apps/backend/internal/middleware"
)

// registerRoutes mounts every feature compiled into this binary. Add each new feature here:
// <name>.RegisterRoutes(api, <name>.New(<name>.Deps{...})). Gin panics at boot on a duplicate route.
func registerRoutes(r *gin.Engine) {
	system.RegisterRoutes(r, system.New(system.Deps{}))
	// Feature APIs mount on the "/api" group once the first one lands.
}

// newRouter builds the gin engine with the security middleware chain and JSON 404/405 envelopes.
func newRouter(cfg config.Config, logger *slog.Logger) *gin.Engine {
	r := gin.New()
	r.HandleMethodNotAllowed = true
	// No proxy is trusted until deploy config says so: ClientIP() must not honour spoofed X-Forwarded-For.
	_ = r.SetTrustedProxies(nil)
	r.Use(
		middleware.RequestID(),
		middleware.Recover(logger),
		middleware.SecurityHeaders(cfg.IsProd()),
		middleware.MaxBody(cfg.MaxBodyBytes),
	)
	r.NoRoute(func(c *gin.Context) { httpresponse.Error(c, http.StatusNotFound, "NOT_FOUND", "not found", nil) })
	r.NoMethod(func(c *gin.Context) {
		httpresponse.Error(c, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed", nil)
	})
	registerRoutes(r)
	return r
}

func serveHTTP(ctx context.Context, cfg config.Config, logger *slog.Logger) error {
	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           newRouter(cfg, logger), //nolint:contextcheck // middleware log with each request's own context
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelWarn),
	}

	// Listen synchronously so a bad address / port in use fails the role immediately.
	ln, err := (&net.ListenConfig{}).Listen(ctx, "tcp", cfg.HTTPAddr)
	if err != nil {
		return fmt.Errorf("http listen %s: %w", cfg.HTTPAddr, err)
	}
	logger.Info("http listening", "addr", ln.Addr().String())

	errCh := make(chan error, 1)
	go func() { errCh <- srv.Serve(ln) }()

	select {
	case err := <-errCh:
		return fmt.Errorf("http serve: %w", err)
	case <-ctx.Done():
	}

	// In-flight requests are not cancelled by the signal: Shutdown stops accepting and lets them
	// finish within the budget, then Close force-drops what is left.
	logger.Info("http shutting down", "timeout", cfg.ShutdownTimeout)
	shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), cfg.ShutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		_ = srv.Close()
		return fmt.Errorf("http shutdown: %w", err)
	}
	if err := <-errCh; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("http serve: %w", err)
	}
	return nil
}
