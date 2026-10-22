// Package config loads runtime settings from environment variables.
//
// Load validates everything up front so a misconfigured process fails at boot instead of at the first
// request. In prod, settings that have no safe default (DSNs, secrets) are required.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

// Environments accepted in TAGO_ENV.
const (
	EnvDev  = "dev"
	EnvTest = "test"
	EnvProd = "prod"
)

// Config is the validated runtime configuration. Never log it as a whole: it carries DSNs.
type Config struct {
	Env             string        // TAGO_ENV: dev | test | prod
	HTTPAddr        string        // TAGO_HTTP_ADDR: listen address of the api / realtime roles
	DatabaseURL     string        // TAGO_DATABASE_URL: Postgres DSN (pgx); required in prod
	RedisURL        string        // TAGO_REDIS_URL: queue, pub/sub, cache, locks; required in prod
	LogLevel        slog.Level    // TAGO_LOG_LEVEL: debug | info | warn | error
	ShutdownTimeout time.Duration // TAGO_SHUTDOWN_TIMEOUT: graceful shutdown budget, e.g. "15s"
	MaxBodyBytes    int64         // TAGO_MAX_BODY_BYTES: default request body limit for JSON endpoints
}

// IsProd reports whether the process runs with production settings.
func (c Config) IsProd() bool { return c.Env == EnvProd }

// Load reads the process environment.
func Load() (Config, error) { return LoadFrom(os.LookupEnv) }

// LookupFunc matches os.LookupEnv; tests pass a map-backed lookup.
type LookupFunc func(key string) (string, bool)

// LoadFrom reads settings through lookup and validates them. All problems are reported at once.
func LoadFrom(lookup LookupFunc) (Config, error) {
	get := func(key, fallback string) string {
		if v, ok := lookup(key); ok && strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
		return fallback
	}

	var errs []error
	cfg := Config{
		Env:         strings.ToLower(get("TAGO_ENV", EnvDev)),
		HTTPAddr:    get("TAGO_HTTP_ADDR", ":8080"),
		DatabaseURL: get("TAGO_DATABASE_URL", ""),
		RedisURL:    get("TAGO_REDIS_URL", ""),
	}

	switch cfg.Env {
	case EnvDev, EnvTest, EnvProd:
	default:
		errs = append(errs, fmt.Errorf("TAGO_ENV: %q is not one of dev|test|prod", cfg.Env))
	}

	if err := cfg.LogLevel.UnmarshalText([]byte(get("TAGO_LOG_LEVEL", "info"))); err != nil {
		errs = append(errs, fmt.Errorf("TAGO_LOG_LEVEL: %w", err))
	}

	d, err := time.ParseDuration(get("TAGO_SHUTDOWN_TIMEOUT", "15s"))
	switch {
	case err != nil:
		errs = append(errs, fmt.Errorf("TAGO_SHUTDOWN_TIMEOUT: %w", err))
	case d <= 0 || d > 5*time.Minute:
		errs = append(errs, fmt.Errorf("TAGO_SHUTDOWN_TIMEOUT: %s must be in (0, 5m]", d))
	default:
		cfg.ShutdownTimeout = d
	}

	n, err := strconv.ParseInt(get("TAGO_MAX_BODY_BYTES", "1048576"), 10, 64)
	switch {
	case err != nil:
		errs = append(errs, fmt.Errorf("TAGO_MAX_BODY_BYTES: %w", err))
	case n <= 0:
		errs = append(errs, fmt.Errorf("TAGO_MAX_BODY_BYTES: %d must be positive", n))
	default:
		cfg.MaxBodyBytes = n
	}

	if cfg.IsProd() {
		required := []struct{ key, val string }{
			{"TAGO_DATABASE_URL", cfg.DatabaseURL},
			{"TAGO_REDIS_URL", cfg.RedisURL},
		}
		for _, r := range required {
			if r.val == "" {
				errs = append(errs, fmt.Errorf("%s: required when TAGO_ENV=prod", r.key))
			}
		}
	}

	if len(errs) > 0 {
		return Config{}, fmt.Errorf("invalid config: %w", errors.Join(errs...))
	}
	return cfg, nil
}
