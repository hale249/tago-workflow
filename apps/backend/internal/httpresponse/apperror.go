package httpresponse

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppError is an error a service or handler returns to choose the HTTP status and the client-safe
// envelope. Cause is internal (driver error, DSN host…): kept on the gin context, never sent.
type AppError struct {
	Status  int
	Code    string
	Message string
	Fields  map[string]string
	Cause   error
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return e.Code + ": " + e.Message + ": " + e.Cause.Error()
	}
	return e.Code + ": " + e.Message
}

func (e *AppError) Unwrap() error { return e.Cause }

// NewError builds an AppError; cause may be nil.
func NewError(status int, code, message string, cause error) *AppError {
	return &AppError{Status: status, Code: code, Message: message, Cause: cause}
}

// Common errors. Messages are shown to clients: keep them free of internal detail.
func BadRequest(message string) *AppError {
	return NewError(http.StatusBadRequest, "BAD_REQUEST", message, nil)
}

func Validation(fields map[string]string) *AppError {
	return &AppError{Status: http.StatusUnprocessableEntity, Code: "VALIDATION", Message: "invalid input", Fields: fields}
}

func Unauthorized() *AppError {
	return NewError(http.StatusUnauthorized, "UNAUTHORIZED", "authentication required", nil)
}

func Forbidden() *AppError {
	return NewError(http.StatusForbidden, "FORBIDDEN", "permission denied", nil)
}

func NotFound(message string) *AppError {
	return NewError(http.StatusNotFound, "NOT_FOUND", message, nil)
}

func Conflict(code, message string) *AppError {
	return NewError(http.StatusConflict, code, message, nil)
}

// Handle adapts a handler that returns (data, error) to gin: data is written as 200 JSON (nil → 204),
// an error through Fail. Mount every feature endpoint with it: r.GET("/x", httpresponse.Handle(h.x)).
func Handle(fn func(c *gin.Context) (any, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		data, err := fn(c)
		switch {
		case err != nil:
			Fail(c, err)
		case c.Writer.Written():
			// fn wrote its own response (stream, file, custom status).
		case data == nil:
			c.Status(http.StatusNoContent)
		default:
			c.JSON(http.StatusOK, data)
		}
	}
}

// Fail writes err as the error envelope: an *AppError with its status and code, anything else as a
// generic 500. The internal cause is attached to the gin context (c.Error) for a future logger to
// pick up; it never reaches the client.
func Fail(c *gin.Context, err error) {
	var ae *AppError
	if !errors.As(err, &ae) {
		_ = c.Error(err)
		Error(c, http.StatusInternalServerError, "INTERNAL", "internal server error", nil)
		return
	}
	if ae.Cause != nil {
		_ = c.Error(ae.Cause)
	}
	Error(c, ae.Status, ae.Code, ae.Message, ae.Fields)
}
