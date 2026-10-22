package config

import (
	"log/slog"
	"strings"
	"testing"
	"time"
)

func lookup(m map[string]string) LookupFunc {
	return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
}

func TestLoadFromDefaults(t *testing.T) {
	cfg, err := LoadFrom(lookup(nil))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Env != EnvDev || cfg.HTTPAddr != ":8080" || cfg.ShutdownTimeout != 15*time.Second ||
		cfg.LogLevel != slog.LevelInfo || cfg.MaxBodyBytes != 1<<20 || cfg.IsProd() {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadFromOverrides(t *testing.T) {
	cfg, err := LoadFrom(lookup(map[string]string{
		"TAGO_ENV":              " PROD ",
		"TAGO_HTTP_ADDR":        "127.0.0.1:9000",
		"TAGO_DATABASE_URL":     "postgres://db/tago",
		"TAGO_REDIS_URL":        "redis://cache:6379",
		"TAGO_LOG_LEVEL":        "debug",
		"TAGO_SHUTDOWN_TIMEOUT": "30s",
		"TAGO_MAX_BODY_BYTES":   "2048",
	}))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !cfg.IsProd() || cfg.HTTPAddr != "127.0.0.1:9000" || cfg.LogLevel != slog.LevelDebug ||
		cfg.ShutdownTimeout != 30*time.Second || cfg.MaxBodyBytes != 2048 {
		t.Fatalf("overrides not applied: %+v", cfg)
	}
}

func TestLoadFromInvalid(t *testing.T) {
	tests := []struct {
		name string
		env  map[string]string
		want []string
	}{
		{"prod requires DSNs", map[string]string{"TAGO_ENV": "prod"},
			[]string{"TAGO_DATABASE_URL: required", "TAGO_REDIS_URL: required"}},
		{"prod blank DSN counts as missing", map[string]string{"TAGO_ENV": "prod", "TAGO_DATABASE_URL": "  ", "TAGO_REDIS_URL": "redis://x"},
			[]string{"TAGO_DATABASE_URL: required"}},
		{"unknown env", map[string]string{"TAGO_ENV": "staging"}, []string{"TAGO_ENV"}},
		{"bad duration", map[string]string{"TAGO_SHUTDOWN_TIMEOUT": "soon"}, []string{"TAGO_SHUTDOWN_TIMEOUT"}},
		{"duration out of range", map[string]string{"TAGO_SHUTDOWN_TIMEOUT": "1h"}, []string{"TAGO_SHUTDOWN_TIMEOUT"}},
		{"bad log level", map[string]string{"TAGO_LOG_LEVEL": "loud"}, []string{"TAGO_LOG_LEVEL"}},
		{"bad body limit", map[string]string{"TAGO_MAX_BODY_BYTES": "-1"}, []string{"TAGO_MAX_BODY_BYTES"}},
		{"all errors reported at once", map[string]string{"TAGO_ENV": "prod", "TAGO_LOG_LEVEL": "loud"},
			[]string{"TAGO_LOG_LEVEL", "TAGO_DATABASE_URL", "TAGO_REDIS_URL"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := LoadFrom(lookup(tt.env))
			if err == nil {
				t.Fatal("expected an error")
			}
			for _, w := range tt.want {
				if !strings.Contains(err.Error(), w) {
					t.Errorf("error %q does not mention %q", err, w)
				}
			}
		})
	}
}

func TestLoadReadsProcessEnv(t *testing.T) {
	t.Setenv("TAGO_ENV", "test")
	t.Setenv("TAGO_HTTP_ADDR", ":0")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Env != EnvTest || cfg.HTTPAddr != ":0" {
		t.Fatalf("env not read: %+v", cfg)
	}
}
