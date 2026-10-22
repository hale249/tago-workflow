// Package httpresponse writes API responses: JSON bodies, the error envelope { code, message, errors },
// typed errors (AppError), the Handle adapter and strict JSON request decoding. Every handler goes
// through it so the wire format stays the same everywhere.
package httpresponse

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorBody is the API error envelope { code, message, errors } (same shape the frontend already handles).
type ErrorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Errors  map[string]string `json:"errors,omitempty"`
}

// JSON writes v with the given status.
func JSON(c *gin.Context, status int, v any) { c.JSON(status, v) }

// Error aborts the request with the error envelope. message is shown to clients: never put internal
// error text in it; log the cause with the request ID instead.
func Error(c *gin.Context, status int, code, message string, fieldErrors map[string]string) {
	c.AbortWithStatusJSON(status, ErrorBody{Code: code, Message: message, Errors: fieldErrors})
}

// DecodeJSON decodes exactly one JSON object from the request body into dst. It rejects a non-JSON
// Content-Type, bodies larger than maxBytes, unknown fields and trailing data, so clients cannot
// smuggle fields the handler silently ignores. The error is an *AppError whose message is safe to
// show to clients: return it from a Handle handler. Use it instead of c.ShouldBindJSON, which
// accepts unknown fields and trailing data.
func DecodeJSON(c *gin.Context, maxBytes int64, dst any) error {
	r := c.Request
	if ct := r.Header.Get("Content-Type"); ct != "" {
		mt, _, err := mime.ParseMediaType(ct)
		if err != nil || mt != "application/json" {
			return NewError(http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json", nil)
		}
	}

	r.Body = http.MaxBytesReader(c.Writer, r.Body, maxBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	tooLarge := NewError(http.StatusRequestEntityTooLarge, "BODY_TOO_LARGE", fmt.Sprintf("request body must not exceed %d bytes", maxBytes), nil)
	if err := dec.Decode(dst); err != nil {
		var (
			syntaxErr *json.SyntaxError
			typeErr   *json.UnmarshalTypeError
			maxErr    *http.MaxBytesError
		)
		switch {
		case errors.As(err, &maxErr):
			return tooLarge
		case errors.Is(err, io.EOF):
			return BadRequest("request body must not be empty")
		case errors.As(err, &syntaxErr), errors.Is(err, io.ErrUnexpectedEOF):
			return BadRequest("request body is not valid JSON")
		case errors.As(err, &typeErr):
			return BadRequest(fmt.Sprintf("field %q has the wrong type", typeErr.Field))
		default:
			// DisallowUnknownFields reports `json: unknown field "x"`; the field name comes from the client.
			return BadRequest(err.Error())
		}
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			return tooLarge
		}
		return BadRequest("request body must contain a single JSON object")
	}
	return nil
}
