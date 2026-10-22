package httpresponse

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

type payload struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func TestDecodeJSON(t *testing.T) {
	tests := []struct {
		name, ct, body string
		wantStatus     int // 0 = success
	}{
		{"ok", "application/json", `{"name":"a","age":1}`, 0},
		{"ok charset", "application/json; charset=utf-8", `{"name":"a"}`, 0},
		{"unknown field", "application/json", `{"name":"a","admin":true}`, http.StatusBadRequest},
		{"trailing data", "application/json", `{"name":"a"}{"name":"b"}`, http.StatusBadRequest},
		{"empty", "application/json", ``, http.StatusBadRequest},
		{"syntax", "application/json", `{"name":`, http.StatusBadRequest},
		{"wrong type", "application/json", `{"age":"x"}`, http.StatusBadRequest},
		{"too large", "application/json", `{"name":"` + strings.Repeat("x", 100) + `"}`, http.StatusRequestEntityTooLarge},
		{"wrong content type", "text/plain", `{"name":"a"}`, http.StatusUnsupportedMediaType},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			c.Request.Header.Set("Content-Type", tt.ct)
			var dst payload
			err := DecodeJSON(c, 64, &dst)
			if tt.wantStatus == 0 {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				return
			}
			var ae *AppError
			if !errors.As(err, &ae) || ae.Status != tt.wantStatus {
				t.Fatalf("got %v, want status %d", err, tt.wantStatus)
			}
		})
	}
}

func TestErrorEnvelope(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	Error(c, http.StatusBadRequest, "VALIDATION", "bad", map[string]string{"name": "required"})
	var got ErrorBody
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if w.Code != http.StatusBadRequest || got.Code != "VALIDATION" || got.Errors["name"] != "required" || !c.IsAborted() {
		t.Fatalf("got %d %+v aborted=%v", w.Code, got, c.IsAborted())
	}
}

func TestHandle(t *testing.T) {
	r := gin.New()
	r.GET("/ok", Handle(func(*gin.Context) (any, error) { return map[string]int{"n": 1}, nil }))
	r.GET("/empty", Handle(func(*gin.Context) (any, error) { return nil, nil }))
	r.GET("/missing", Handle(func(*gin.Context) (any, error) { return nil, NotFound("record not found") }))
	r.GET("/wrapped", Handle(func(*gin.Context) (any, error) {
		return nil, fmt.Errorf("svc: %w", NewError(http.StatusServiceUnavailable, "NOT_READY", "not ready", errors.New("dsn=secret")))
	}))
	r.GET("/boom", Handle(func(*gin.Context) (any, error) { return nil, errors.New("password=secret") }))

	for _, tt := range []struct {
		path   string
		status int
		want   string
	}{
		{"/ok", http.StatusOK, `{"n":1}`},
		{"/empty", http.StatusNoContent, ""},
		{"/missing", http.StatusNotFound, `"code":"NOT_FOUND"`},
		{"/wrapped", http.StatusServiceUnavailable, `"code":"NOT_READY"`},
		{"/boom", http.StatusInternalServerError, `"code":"INTERNAL"`},
	} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequestWithContext(t.Context(), http.MethodGet, tt.path, nil))
		if w.Code != tt.status || !strings.Contains(w.Body.String(), tt.want) || strings.Contains(w.Body.String(), "secret") {
			t.Errorf("%s = %d %s", tt.path, w.Code, w.Body.String())
		}
	}
}
