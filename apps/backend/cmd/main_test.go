package main

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/hale249/tago-workflow/apps/backend/internal/config"
)

func init() { gin.SetMode(gin.TestMode) }

func TestRunAllStopsOthersOnFailure(t *testing.T) {
	boom := errors.New("boom")
	done := make(chan error, 1)
	go func() {
		done <- runAll(t.Context(),
			func(context.Context) error { return boom },
			func(ctx context.Context) error { <-ctx.Done(); return nil },
		)
	}()
	select {
	case err := <-done:
		if !errors.Is(err, boom) {
			t.Fatalf("got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("runAll did not stop the remaining roles")
	}
}

func TestRunGracefulShutdown(t *testing.T) {
	cfg, err := config.LoadFrom(func(k string) (string, bool) {
		v, ok := map[string]string{"TAGO_HTTP_ADDR": "127.0.0.1:0", "TAGO_SHUTDOWN_TIMEOUT": "2s"}[k]
		return v, ok
	})
	if err != nil {
		t.Fatal(err)
	}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	for _, role := range []string{"api", "realtime", "worker", "scheduler", "all"} {
		t.Run(role, func(t *testing.T) {
			ctx, cancel := context.WithCancel(t.Context())
			done := make(chan error, 1)
			go func() { done <- run(ctx, role, cfg, logger) }()
			time.Sleep(50 * time.Millisecond)
			cancel()
			select {
			case err := <-done:
				if err != nil {
					t.Fatalf("role %s: %v", role, err)
				}
			case <-time.After(5 * time.Second):
				t.Fatalf("role %s did not shut down", role)
			}
		})
	}
}

func TestRunUnknownRole(t *testing.T) {
	if err := run(t.Context(), "nope", config.Config{}, slog.Default()); err == nil {
		t.Fatal("expected error for unknown role")
	}
}

func TestRouterEnvelopeAndHeaders(t *testing.T) {
	cfg, err := config.LoadFrom(func(string) (string, bool) { return "", false })
	if err != nil {
		t.Fatal(err)
	}
	r := newRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	for _, tt := range []struct {
		method, path string
		status       int
		code         string
	}{
		{http.MethodGet, "/livez", http.StatusOK, ""},
		{http.MethodGet, "/nope", http.StatusNotFound, "NOT_FOUND"},
		{http.MethodPost, "/livez", http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED"},
	} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequestWithContext(t.Context(), tt.method, tt.path, nil))
		if w.Code != tt.status || !strings.Contains(w.Body.String(), tt.code) {
			t.Errorf("%s %s = %d %s", tt.method, tt.path, w.Code, w.Body.String())
		}
		if w.Header().Get("X-Content-Type-Options") != "nosniff" || w.Header().Get("X-Request-ID") == "" {
			t.Errorf("%s %s: security headers / request id missing", tt.method, tt.path)
		}
	}
}
