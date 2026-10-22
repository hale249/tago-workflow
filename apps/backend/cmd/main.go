// Command tago is the single backend binary (go build -o bin/tago ./cmd). The first argument picks the role:
//
//	tago api        HTTP API (REST + incoming webhooks)
//	tago worker     queue consumers: workflow executor, Excel import, social send, outbox relay
//	tago realtime   WebSocket gateway
//	tago scheduler  cron triggers, delayed workflow jobs, date reminders
//	tago all        every role in one process (local dev, small installs)
//	tago migrate    apply database migrations
//
// Every role stops gracefully on SIGINT/SIGTERM within TAGO_SHUTDOWN_TIMEOUT; a second signal kills
// the process immediately.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/gin-gonic/gin"

	"github.com/hale249/tago-workflow/apps/backend/internal/config"
)

const roles = "api|worker|realtime|scheduler|all|migrate"

func main() {
	role := "all"
	if len(os.Args) > 1 {
		role = os.Args[1]
	}

	gin.SetMode(gin.ReleaseMode) // no debug route dump on stdout; logs stay JSON-only.

	cfg, err := config.Load()
	if err != nil {
		slog.New(slog.NewJSONHandler(os.Stderr, nil)).Error("tago: config", "err", err)
		os.Exit(2)
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel})).
		With("role", role, "env", cfg.Env)
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	// Restore default signal handling once shutdown starts so a second Ctrl-C / SIGTERM kills hard.
	context.AfterFunc(ctx, stop)

	err = run(ctx, role, cfg, logger)
	stop()
	if err != nil {
		logger.Error("tago stopped", "err", err)
		os.Exit(1)
	}
	logger.Info("tago stopped cleanly")
}

func run(ctx context.Context, role string, cfg config.Config, logger *slog.Logger) error {
	switch role {
	case "api", "realtime":
		// TODO(realtime): serve the WebSocket gateway on its own mux; WebSocket handlers must clear the
		// server WriteTimeout per connection via http.ResponseController.SetWriteDeadline(time.Time{}).
		return serveHTTP(ctx, cfg, logger)
	case "worker":
		return idleRole(ctx, logger, "worker")
	case "scheduler":
		return idleRole(ctx, logger, "scheduler")
	case "all":
		return runAll(ctx,
			func(ctx context.Context) error { return serveHTTP(ctx, cfg, logger) },
			func(ctx context.Context) error { return idleRole(ctx, logger, "worker") },
			func(ctx context.Context) error { return idleRole(ctx, logger, "scheduler") },
		)
	case "migrate":
		return errors.New("migrate: not implemented yet (goose, see migrations/)")
	default:
		return fmt.Errorf("unknown role %q (%s)", role, roles)
	}
}

// runAll runs every role concurrently. The first role to fail (or ctx being cancelled) stops the
// others; it returns once all have returned, joining their errors.
func runAll(ctx context.Context, fns ...func(context.Context) error) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var (
		wg   sync.WaitGroup
		mu   sync.Mutex
		errs []error
	)
	for _, fn := range fns {
		wg.Go(func() {
			if err := fn(ctx); err != nil {
				mu.Lock()
				errs = append(errs, err)
				mu.Unlock()
			}
			cancel() // one role ending (error or not) ends the process.
		})
	}
	wg.Wait()
	return errors.Join(errs...)
}

// idleRole is a placeholder for roles without consumers yet; it honours shutdown like a real one.
func idleRole(ctx context.Context, logger *slog.Logger, name string) error {
	logger.Info("role not implemented yet, idling", "component", name)
	<-ctx.Done()
	return nil
}
