// Package middleware holds the gin middleware every HTTP role runs, outermost first:
// RequestID → Recover → SecurityHeaders → MaxBody.
package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"

	"github.com/hale249/tago-workflow/apps/backend/internal/httpresponse"
)

// HeaderRequestID is read from trusted proxies and echoed back on every response.
const HeaderRequestID = "X-Request-ID"

type ctxKey struct{}

// RequestIDFrom returns the request ID stored by RequestID, or "". It reads the request context so
// services and loggers below the handler can use it too.
func RequestIDFrom(ctx context.Context) string {
	id, _ := ctx.Value(ctxKey{}).(string)
	return id
}

// RequestID keeps a well-formed incoming X-Request-ID (≤64 chars of [A-Za-z0-9._-]) or generates one,
// stores it in the request context and sets it on the response.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader(HeaderRequestID)
		if !validRequestID(id) {
			id = newRequestID()
		}
		c.Header(HeaderRequestID, id)
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), ctxKey{}, id))
		c.Next()
	}
}

func validRequestID(id string) bool {
	if id == "" || len(id) > 64 {
		return false
	}
	for i := range len(id) {
		c := id[i]
		ok := c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-' || c == '_' || c == '.'
		if !ok {
			return false
		}
	}
	return true
}

func newRequestID() string {
	var b [16]byte
	_, _ = rand.Read(b[:]) // crypto/rand.Read never returns an error (Go 1.24+).
	return hex.EncodeToString(b[:])
}

// Recover turns a handler panic into a logged 500 with the error envelope instead of a dropped
// connection, without leaking the panic value to the client. http.ErrAbortHandler is re-panicked so
// net/http aborts the response as intended.
func Recover(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			v := recover()
			if v == nil {
				return
			}
			if err, ok := v.(error); ok && errors.Is(err, http.ErrAbortHandler) {
				panic(v)
			}
			logger.ErrorContext(c.Request.Context(), "http panic",
				"request_id", RequestIDFrom(c.Request.Context()),
				"method", c.Request.Method,
				"path", c.Request.URL.Path,
				"panic", v,
				"stack", string(debug.Stack()),
			)
			if c.Writer.Written() {
				c.Abort() // response already started; nothing better can be done mid-response.
				return
			}
			httpresponse.Error(c, http.StatusInternalServerError, "INTERNAL", "internal server error", nil)
		}()
		c.Next()
	}
}

// SecurityHeaders sets baseline headers for a JSON API. hsts should be true only behind TLS (prod).
func SecurityHeaders(hsts bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		h.Set("Cross-Origin-Resource-Policy", "same-origin")
		h.Set("Cache-Control", "no-store")
		if hsts {
			h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		}
		c.Next()
	}
}

// MaxBody caps the request body for every request passing through. Handlers that accept uploads
// must not sit behind it (uploads go to S3 via presigned URLs anyway). Use httpresponse.DecodeJSON
// for a tighter per-endpoint limit.
func MaxBody(n int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > n {
			httpresponse.Error(c, http.StatusRequestEntityTooLarge, "BODY_TOO_LARGE", "request body too large", nil)
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, n)
		c.Next()
	}
}
