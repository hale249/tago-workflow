// Package system is the reference feature (liveness / readiness probes) and the template to copy for a
// new feature. Files of a feature, in the order a request flows:
//
//	routes.go      Deps, New (wires repository → service → handler) and RegisterRoutes
//	handler.go     HTTP layer: func(c) (any, error) mounted via httpresponse.Handle; decode with
//	               httpresponse.DecodeJSON, call the service, return data (no business rules)
//	service.go     business rules + permission checks; the only API other features may call
//	repository.go  data access (sqlc store under ./store once the feature has queries)
//	types.go       domain + request/response types; errors.go for sentinel errors
//
// Services return *httpresponse.AppError (NotFound, Forbidden, Validation…) for client-visible
// failures; any other error becomes a 500 with the cause logged. Tiny features may merge files:
// system keeps Deps/New/RegisterRoutes in handler.go and its repository is the Pinger list.
package system

import (
	"context"
	"time"
)

// readyTimeout bounds a readiness probe so a hung dependency cannot pile up probe goroutines.
const readyTimeout = 2 * time.Second

// Pinger checks one dependency (Postgres pool, Redis client…).
type Pinger interface {
	Ping(ctx context.Context) error
}

// Service is what other features may depend on.
type Service struct{ pingers []Pinger }

// Ready reports whether every dependency is reachable.
func (s *Service) Ready(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, readyTimeout)
	defer cancel()
	for _, p := range s.pingers {
		if err := p.Ping(ctx); err != nil {
			return err
		}
	}
	return nil
}
