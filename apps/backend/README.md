# Tago backend (Go)

Một binary Go duy nhất (`cmd/`, build ra `bin/tago`), dùng **Gin** cho HTTP cho toàn bộ backend của Tago. Thiết kế chi tiết: [`docs/backend-go-design.md`](../../docs/backend-go-design.md).

## Chạy

Yêu cầu: Go 1.27+. Tuỳ chọn: `golangci-lint` v2 (build bằng Go ≥ 1.27), `govulncheck`.

```sh
make run                  # mọi vai trò trong một tiến trình (= go run ./cmd all)
go run ./cmd api          # chỉ HTTP API
make test                 # go test -race ./...
make lint                 # golangci-lint theo .golangci.yml
make vulncheck            # govulncheck
make ci                   # fmt-check + vet + test + lint + vulncheck (giống CI)
make build                # bin/tago, build tĩnh
make docker               # image distroless, non-root
```

Từ gốc monorepo: `pnpm --filter backend test|lint|ci`. `pnpm lint` ở gốc chỉ chạy `gofmt` + `go vet` cho backend (không cần cài thêm công cụ); `lint:strict` chạy golangci-lint.

Kiểm tra nhanh: `curl localhost:8080/livez` và `curl localhost:8080/readyz`.

### Biến môi trường

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `TAGO_ENV` | `dev` | `dev` \| `test` \| `prod` |
| `TAGO_HTTP_ADDR` | `:8080` | địa chỉ lắng nghe của `api` / `realtime` |
| `TAGO_DATABASE_URL` | — | DSN Postgres (pgx). **Bắt buộc khi `prod`** |
| `TAGO_REDIS_URL` | — | Redis. **Bắt buộc khi `prod`** |
| `TAGO_LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `TAGO_SHUTDOWN_TIMEOUT` | `15s` | thời gian tối đa để dừng êm, trong khoảng (0, 5m] |
| `TAGO_MAX_BODY_BYTES` | `1048576` | giới hạn body mặc định cho mọi request |

Cấu hình được kiểm tra toàn bộ lúc khởi động; sai hoặc thiếu biến bắt buộc thì tiến trình thoát ngay (mã 2) và liệt kê **mọi** lỗi một lần.

## Vai trò (role)

Tham số đầu tiên của binary chọn vai trò; mặc định `all`.

| Role | Việc |
|---|---|
| `api` | HTTP API (REST + webhook đến) |
| `worker` | consumer hàng đợi: chạy workflow, import Excel, gửi social, outbox relay *(chưa có)* |
| `realtime` | cổng WebSocket *(hiện dùng chung router với api)* |
| `scheduler` | cron, job trễ, nhắc theo ngày *(chưa có)* |
| `all` | tất cả trong một tiến trình (dev, cài đặt nhỏ); một vai trò lỗi sẽ dừng các vai trò còn lại |
| `migrate` | chạy migration (goose) *(chưa có)* |

Mọi vai trò dừng êm khi nhận SIGINT/SIGTERM trong `TAGO_SHUTDOWN_TIMEOUT`; tín hiệu thứ hai giết tiến trình ngay.

## Cấu trúc thư mục

Theo cùng khuôn với các dự án Go khác của team (scoring-service, notification, zo-backend): `cmd/` + `internal/{config,middleware,httpresponse,feature/<tên>}` + `migrations/`.

```
cmd/
  main.go              chọn vai trò, tín hiệu dừng, runAll
  http.go              gin engine + chuỗi middleware + http.Server; registerRoutes() = danh sách tính năng
api/openapi.yaml       hợp đồng REST (nguồn gốc)
migrations/            migration goose (SQL thuần)
internal/
  config/              đọc + kiểm tra biến môi trường TAGO_*
  middleware/          RequestID, Recover, SecurityHeaders, MaxBody (gin)
  httpresponse/        envelope lỗi, AppError, Handle(fn), DecodeJSON chặt
  feature/<tên>/       mỗi tính năng một thư mục phẳng (system là mẫu)
sqlc.yaml              mỗi tính năng một khối
Dockerfile             build tĩnh → distroless, non-root
```

Thư mục chỉ được tạo khi có code thật. Dự kiến thêm (theo `docs/backend-go-design.md`):

- `internal/clients/{db,redis,s3}` — client hạ tầng (pgx pool, Redis…), `internal/worker`, `internal/shared` (ID có kiểu, cursor, actor).
- `internal/engine/{field,query,formula,command}` — động cơ dùng chung của Active Tables.
- `internal/feature/`: `auth`, `workspace`, `team`, `permission`, `table`, `record`, `comment`, `attachment`, `importx`, `exportx`, `workflow`, `connector`, `form`, `social`, `notification`, `realtime`, `audit`.

Schema JSON + test vector dùng chung Go/TS nằm ở `packages/spec` (gốc repo).

## Thêm một tính năng

1. Tạo `internal/feature/<tên>` (viết thường, không gạch; hậu tố `x` nếu trùng từ khoá Go, vd `importx`). Bố cục phẳng, đúng thứ tự request đi qua:

   | File | Nội dung |
   |---|---|
   | `routes.go` | `Deps` (client cần dùng), `New(Deps) *Handler` (ghép repository → service → handler), `RegisterRoutes(r gin.IRouter, h *Handler)` |
   | `handler.go` | `func (h *Handler) x(c *gin.Context) (any, error)`: `httpresponse.DecodeJSON` → gọi service → trả data. Không nghiệp vụ |
   | `service.go` | nghiệp vụ + kiểm quyền; API **duy nhất** tính năng khác được gọi |
   | `repository.go` | truy cập dữ liệu (dùng `./store` do sqlc sinh) |
   | `types.go`, `errors.go` | kiểu domain/request/response; lỗi sentinel |
   | `*_test.go` | test handler bằng `httptest` + `gin.New()` (xem `feature/system/handler_test.go`) |

   Tính năng nhỏ được gộp file (system gộp `routes.go` vào `handler.go`).
2. Mount mọi endpoint qua `httpresponse.Handle(h.x)`: trả data → 200 JSON (nil → 204); trả lỗi → envelope `{code, message, errors}`. Lỗi cho client dùng `*httpresponse.AppError` (`NotFound`, `Forbidden`, `Validation(fields)`, `NewError(status, code, msg, cause)`); lỗi khác thành 500 chung. `cause` chỉ giữ phía server (gắn vào `c.Error`), không bao giờ ra client.
3. Đăng ký trong `registerRoutes()` ở `cmd/http.go`: `<tên>.RegisterRoutes(api, <tên>.New(<tên>.Deps{...}))`. Gin panic lúc khởi động nếu trùng route.
4. Có truy vấn SQL: thêm khối vào `sqlc.yaml` (queries `internal/feature/<tên>/queries`, out `internal/feature/<tên>/store`, package `store`, `sql_package: pgx/v5`). Bảng có tiền tố theo tính năng.
5. Thêm đường dẫn vào `api/openapi.yaml`.
6. Body JSON: luôn `httpresponse.DecodeJSON(c, limit, &req)` (chặn field lạ, dữ liệu thừa, body quá lớn) — **không** dùng `c.ShouldBindJSON`/`c.BindJSON`.

## Quy tắc phụ thuộc (giữ bằng review)

- Không gói nào import `cmd/*` (việc ghép tính năng nằm ở `cmd/http.go`).
- Gói hạ tầng (`config`, `middleware`, `httpresponse`, sau này `clients/*`, `worker`…) không import `feature/*` hay `engine/*`.
- `engine/*` không import `feature/*`; `shared` không import gì khác trong `internal/`.
- Một tính năng chỉ được import **gói gốc** của tính năng khác (`feature/table`), không được import `feature/table/store`, `…/repository`, `…/internal/…` hay gói con nào khác.
- Giao tiếp bất đồng bộ giữa tính năng đi qua sự kiện outbox; không JOIN sang bảng của tính năng khác.

## Ghi chú bảo mật

- HTTP server có `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`, `MaxHeaderBytes` (chống slowloris). WebSocket sau này phải tự gỡ write deadline theo từng kết nối qua `http.ResponseController`.
- Gin chạy `ReleaseMode`, `gin.New()` (không dùng logger/recovery mặc định), `SetTrustedProxies(nil)` (không tin `X-Forwarded-For` giả), 404/405 trả envelope JSON.
- Chuỗi middleware: `RequestID` → `Recover` → `SecurityHeaders` → `MaxBody` → route.
  - `X-Request-ID` từ client chỉ được giữ nếu hợp lệ (≤64 ký tự `[A-Za-z0-9._-]`), ngược lại sinh mới.
  - Chưa có access log; khi thêm lại thì chỉ ghi path (không query string, header hay body) để không lộ token.
  - Panic → log kèm stack, trả 500 với envelope chung, không lộ nội dung panic.
  - Header bảo mật cho API JSON (`nosniff`, `DENY`, CSP `default-src 'none'`, `Cache-Control: no-store`); HSTS chỉ bật khi `prod`.
- Không bao giờ đưa `err.Error()` nội bộ vào `message` trả cho client; trả `AppError` với `cause`, `Handle` gắn cause vào `c.Error` (giữ phía server).
- Không log nguyên `config.Config` (chứa DSN).
- Container chạy distroless, non-root. Mọi thư viện mới phải qua review và `govulncheck` (CI).
