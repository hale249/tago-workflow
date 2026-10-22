package system

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/hale249/tago-workflow/apps/backend/internal/httpresponse"
)

// Deps lists what the feature needs; cmd/ fills it from the shared clients.
type Deps struct {
	Pingers []Pinger // checked by /readyz: the pgx pool and Redis client once they land
}

// Handler serves the feature's HTTP endpoints. Handlers return (data, error) and are mounted through
// httpresponse.Handle, which writes the JSON or the error envelope.
type Handler struct{ svc *Service }

// New wires service → handler.
func New(d Deps) *Handler { return &Handler{svc: &Service{pingers: d.Pingers}} }

// RegisterRoutes mounts the probes at the root (no /api prefix, no auth).
func RegisterRoutes(r gin.IRouter, h *Handler) {
	r.GET("/livez", httpresponse.Handle(h.live))
	r.GET("/readyz", httpresponse.Handle(h.ready))
}

type statusResponse struct {
	Status string `json:"status"`
}

func (h *Handler) live(*gin.Context) (any, error) { return statusResponse{Status: "ok"}, nil }

func (h *Handler) ready(c *gin.Context) (any, error) {
	if err := h.svc.Ready(c.Request.Context()); err != nil {
		// The cause (DSN host, driver error…) stays server side, never goes to the caller.
		return nil, httpresponse.NewError(http.StatusServiceUnavailable, "NOT_READY", "service not ready", err)
	}
	return statusResponse{Status: "ready"}, nil
}
