package middleware

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

func discard() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func serve(r *gin.Engine, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestRequestID(t *testing.T) {
	var seen string
	r := gin.New()
	r.Use(RequestID())
	r.GET("/", func(c *gin.Context) { seen = RequestIDFrom(c.Request.Context()) })

	for _, tt := range []struct {
		in   string
		keep bool
	}{
		{"abc-123_x.y", true},
		{"", false},
		{"has space", false},
		{"inject\r\nX-Evil: 1", false},
		{strings.Repeat("a", 65), false},
	} {
		req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
		if tt.in != "" {
			req.Header.Set(HeaderRequestID, tt.in)
		}
		got := serve(r, req).Header().Get(HeaderRequestID)
		if got == "" || got != seen {
			t.Fatalf("in %q: header %q ctx %q", tt.in, got, seen)
		}
		if (got == tt.in) != tt.keep {
			t.Fatalf("in %q: got %q, keep=%v", tt.in, got, tt.keep)
		}
	}
}

func TestRecover(t *testing.T) {
	var buf bytes.Buffer
	r := gin.New()
	r.Use(Recover(slog.New(slog.NewJSONHandler(&buf, nil))))
	r.GET("/", func(*gin.Context) { panic("boom") })
	w := serve(r, httptest.NewRequest(http.MethodGet, "/", http.NoBody))
	if w.Code != http.StatusInternalServerError || strings.Contains(w.Body.String(), "boom") {
		t.Fatalf("got %d %q", w.Code, w.Body.String())
	}
	if !strings.Contains(buf.String(), "boom") {
		t.Fatalf("panic not logged: %s", buf.String())
	}
}

func TestRecoverRepanicsAbortHandler(t *testing.T) {
	r := gin.New()
	r.Use(Recover(discard()))
	r.GET("/", func(*gin.Context) { panic(http.ErrAbortHandler) })
	defer func() {
		if v := recover(); v != http.ErrAbortHandler { //nolint:errorlint // sentinel identity is the point
			t.Fatalf("recovered %v, want ErrAbortHandler", v)
		}
	}()
	serve(r, httptest.NewRequest(http.MethodGet, "/", http.NoBody))
}

func TestSecurityHeaders(t *testing.T) {
	for _, hsts := range []bool{false, true} {
		r := gin.New()
		r.Use(SecurityHeaders(hsts))
		r.GET("/", func(*gin.Context) {})
		w := serve(r, httptest.NewRequest(http.MethodGet, "/", http.NoBody))
		if w.Header().Get("X-Content-Type-Options") != "nosniff" {
			t.Fatal("nosniff missing")
		}
		if (w.Header().Get("Strict-Transport-Security") != "") != hsts {
			t.Fatalf("hsts=%v header=%q", hsts, w.Header().Get("Strict-Transport-Security"))
		}
	}
}

func TestMaxBody(t *testing.T) {
	r := gin.New()
	r.Use(MaxBody(8))
	r.POST("/", func(c *gin.Context) {
		if _, err := io.ReadAll(c.Request.Body); err != nil {
			c.Status(http.StatusRequestEntityTooLarge)
		}
	})
	for _, chunked := range []bool{false, true} {
		var body io.Reader = strings.NewReader(strings.Repeat("x", 32))
		if chunked {
			body = io.MultiReader(body) // hides the length from httptest
		}
		req := httptest.NewRequest(http.MethodPost, "/", body)
		if chunked {
			req.ContentLength = -1
		}
		if w := serve(r, req); w.Code != http.StatusRequestEntityTooLarge {
			t.Fatalf("chunked=%v: got %d", chunked, w.Code)
		}
	}
}
