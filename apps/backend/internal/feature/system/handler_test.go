package system

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

type fakePinger struct{ err error }

func (f fakePinger) Ping(ctx context.Context) error {
	if _, ok := ctx.Deadline(); !ok {
		return errors.New("ping called without a deadline")
	}
	return f.err
}

func do(t *testing.T, p Pinger, method, path string) (int, map[string]any) {
	t.Helper()
	r := gin.New()
	r.HandleMethodNotAllowed = true
	RegisterRoutes(r, New(Deps{Pingers: []Pinger{p}}))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequestWithContext(t.Context(), method, path, nil))
	var body map[string]any
	if strings.HasPrefix(w.Header().Get("Content-Type"), "application/json") {
		if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
			t.Fatalf("decode body: %v", err)
		}
	}
	return w.Code, body
}

func TestLive(t *testing.T) {
	status, body := do(t, fakePinger{err: errors.New("db down")}, http.MethodGet, "/livez") // liveness ignores deps
	if status != http.StatusOK || body["status"] != "ok" {
		t.Fatalf("got %d %v", status, body)
	}
}

func TestReady(t *testing.T) {
	status, body := do(t, fakePinger{}, http.MethodGet, "/readyz")
	if status != http.StatusOK || body["status"] != "ready" {
		t.Fatalf("got %d %v", status, body)
	}
}

func TestReadyFailureDoesNotLeakCause(t *testing.T) {
	status, body := do(t, fakePinger{err: errors.New("dial tcp 10.0.0.5:5432: password=secret")}, http.MethodGet, "/readyz")
	if status != http.StatusServiceUnavailable || body["code"] != "NOT_READY" {
		t.Fatalf("got %d %v", status, body)
	}
	if msg, _ := body["message"].(string); strings.Contains(msg, "10.0.0.5") || strings.Contains(msg, "secret") {
		t.Fatalf("internal error leaked to client: %q", msg)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	if status, _ := do(t, fakePinger{}, http.MethodPost, "/livez"); status != http.StatusMethodNotAllowed {
		t.Fatalf("POST /livez = %d, want 405", status)
	}
}
