# Thiết kế backend Tago bằng Go

Phiên bản nháp 2026-10-22. Dựa trên: kiểu dữ liệu frontend hiện có (`apps/admin/src/features/**/types`), API bản tham khảo (`docs/beqeek-api-2026-10-22.md`), thiết kế 6 dự án mã nguồn mở (`docs/opensource-architecture.md`) và quyết định chọn Go (`docs/tech-stack-decision.md`).

## 1. Nguyên tắc

1. **DB hệ thống `tago` tách khỏi các shard dữ liệu**; mặc định nhiều workspace dùng chung một shard (mọi bảng có `workspace_id` đứng đầu khoá chính), khách lớn/cần cách ly được chuyển sang shard riêng (chi tiết và nghiên cứu: `docs/database-multi-tenant-design.md`). Bản ghi lưu JSONB, cấu hình bảng là JSON có `version` → thêm/sửa trường không cần DDL (giống bản tham khảo và APITable).
2. **Lọc, sắp xếp, phân trang chạy trong DB** (không tải cả bảng vào RAM): cây bộ lọc dịch sang SQL có tham số, index theo trường hay lọc, phân trang cursor.
3. **Một đường ghi duy nhất**: mọi thay đổi (UI, REST, workflow, import) → `command` → thay đổi theo ô → `changeset` có `revision` → outbox → realtime / workflow / audit / undo.
4. **Server là nguồn đúng** cho phân quyền, bộ lọc, công thức; frontend chỉ hiển thị và xem trước.
5. **Hợp đồng chung**: OpenAPI 3.1 + JSON Schema là nguồn gốc; sinh kiểu Go và client TS; bộ ca kiểm thử JSON dùng chung.
6. **Ít phụ thuộc, bảo mật mặc định**: thư viện chuẩn trước, module ngoài phải review; bí mật mã hoá; chạy image distroless.
7. **Modular monolith** trước, tách service sau khi đo: một repo, một binary, nhiều "role" chạy (api / worker / realtime / scheduler).

## 2. Kiến trúc tổng thể

```
               ┌──────────────── Frontend (React + TanStack) ────────────────┐
               │  REST (OpenAPI client sinh tự động)        WebSocket        │
               └───────────────┬──────────────────────────────┬──────────────┘
                               │                              │
                      ┌────────▼────────┐            ┌────────▼────────┐
  Webhook Zalo/FB/ ──►│   tago api      │            │ tago realtime   │◄─┐
  WA/IG, form public  │ (HTTP, chi)     │            │ (WS gateway)    │  │
                      └───┬───────┬─────┘            └────────▲────────┘  │
                          │       │ outbox                     │ pub/sub  │
                          │  ┌────▼─────────┐   ┌──────────────┴──┐       │
                          │  │ tago worker  │◄──┤ Redis / NATS    ├───────┘
                          │  │ workflow,    │   │ (queue, pubsub, │
                          │  │ import, send │   │  cache, lock)   │
                          │  └────┬─────────┘   └─────────────────┘
                          │       │      ┌───────────────┐
                          │       │      │ tago scheduler│ (cron, delay, nhắc ngày)
                          ▼       ▼      └───────┬───────┘
                    ┌────────────────────┐       │        ┌──────────────┐
                    │ PostgreSQL 16+     │◄──────┘        │ S3 / MinIO   │ tệp đính kèm
                    └────────────────────┘                └──────────────┘
                    KMS / Vault: khoá master mã hoá bí mật
```

Cả 4 role là **cùng một binary** `tago`, chọn bằng cờ: `tago api`, `tago worker`, `tago realtime`, `tago scheduler`. Giai đoạn đầu có thể chạy `tago all` trên một máy.

## 3. Cấu trúc thư mục (theo tính năng)

Nằm trong monorepo này, chia **theo tính năng** (vertical slice) để scale: mỗi tính năng tự chứa route, xử lý, nghiệp vụ, truy vấn, sự kiện; có thể tách thành service riêng mà không sửa tính năng khác. Bố cục theo cùng khuôn với các dự án Go khác của team (`cmd/` + `internal/{config,middleware,httpresponse,clients,feature}` + `migrations/`, HTTP bằng Gin). Thư mục chỉ được tạo khi có code thật; phần đánh dấu *(dự kiến)* chưa có.

```
tago-workflow/
├── apps/admin/                 # frontend React (TanStack)
├── packages/spec/              # @workspace/spec — JSON Schema + test vectors dùng chung Go & TS
└── apps/backend/               # Go module github.com/hale249/tago-workflow/apps/backend
    ├── cmd/
    │   ├── main.go             # một binary `tago`; vai trò: api | worker | realtime | scheduler | all | migrate
    │   └── http.go             # gin engine + middleware + http.Server; registerRoutes() = danh sách tính năng
    ├── api/openapi.yaml        # hợp đồng REST (nguồn gốc) → sinh kiểu Go + client TS
    ├── migrations/             # goose, SQL thuần: system/ (tago) và data/ (mọi shard dữ liệu)
    ├── internal/
    │   ├── config/             # biến môi trường TAGO_*, kiểm tra hết lúc khởi động
    │   ├── middleware/         # gin: RequestID, Recover, SecurityHeaders, MaxBody
    │   ├── httpresponse/       # envelope lỗi, AppError, Handle(fn), DecodeJSON chặt
    │   ├── clients/            # (dự kiến) db (pgx: System pool + shards.Router, mỗi shard một pool), redis, s3, kms — client hạ tầng
    │   ├── worker/             # (dự kiến) consumer hàng đợi, outbox relay
    │   ├── shared/             # (dự kiến) kernel nhỏ: ID có kiểu, cursor phân trang, actor
    │   ├── engine/             # (dự kiến) động cơ Active Tables: field/ query/ formula/ command/
    │   └── feature/
    │       ├── system/         # tính năng mẫu (health) — khuôn để tạo tính năng mới
    │       └── …               # (dự kiến) auth workspace team permission table record comment attachment
    │                           #   importx exportx workflow connector form social notification realtime audit
    ├── sqlc.yaml               # mỗi tính năng một khối: queries + store riêng
    ├── Dockerfile              # build tĩnh → distroless, non-root
    └── Makefile, package.json
```

Bên trong **mỗi tính năng** (phẳng, xem `internal/feature/system`; tính năng nhỏ được gộp file):

```
feature/<tên>/
├── routes.go       # Deps, New(Deps) *Handler (repository → service → handler), RegisterRoutes(r gin.IRouter, h)
├── handler.go      # func (h *Handler) x(c *gin.Context) (any, error), mount qua httpresponse.Handle; không nghiệp vụ
├── service.go      # nghiệp vụ + kiểm quyền; là API DUY NHẤT tính năng khác được gọi; lỗi cho client = *httpresponse.AppError
├── repository.go   # truy cập dữ liệu (dùng ./store)
├── types.go  errors.go
├── events.go       # sự kiện tính năng phát ra / lắng nghe (qua outbox)
├── queries/*.sql   # truy vấn sqlc của riêng tính năng
├── store/          # code sinh bởi sqlc (không sửa tay)
└── *_test.go
```

Quy tắc phụ thuộc (để scale và tách service về sau; giữ bằng review, kèm: không ai import `cmd/*`, gói hạ tầng `config`/`middleware`/`httpresponse`/`clients`… không import `feature/*`/`engine/*`):
1. `feature/*` được import `engine/*`, gói hạ tầng, `shared/*` và **Service** (gói gốc) của tính năng khác; **không** import `store`/`repository` hay gói con của tính năng khác.
2. `engine/*` không import `feature/*`; `shared` không import gì trong `internal`.
3. Giao tiếp không đồng bộ giữa tính năng đi qua **sự kiện outbox** (vd `record.updated` → workflow, audit, realtime, notification).
4. Mỗi tính năng sở hữu bảng của mình (tiền tố tên bảng theo tính năng); không JOIN sang bảng tính năng khác trong truy vấn của mình — cần dữ liệu thì gọi Service.
5. Thêm tính năng: tạo `internal/feature/<tên>` theo khuôn `system`, đăng ký trong `registerRoutes()` ở `cmd/http.go`, thêm khối vào `sqlc.yaml`, thêm đường dẫn vào `api/openapi.yaml`.

## 4. Mô hình dữ liệu (Postgres)

ID: **ULID / UUIDv7** dạng text có tiền tố (`ws_`, `tbl_`, `rec_`, `fld_`, `wu_`, `we_`…) — sắp xếp được theo thời gian, an toàn khi lộ ra URL.

> **Đã đổi (2026-10-23):** dữ liệu tách thành DB `tago` (control plane) + các shard dữ liệu — xem `docs/database-multi-tenant-design.md` §3–§5. Nhóm tài khoản/workspace/thành viên/lời mời chuyển sang DB `tago`; bảng còn lại nằm trong shard, **giữ `workspace_id` và đặt nó đứng đầu khoá chính** `(workspace_id, id)` cùng mọi index.

```sql
-- Tài khoản & workspace
users(id, username unique, email unique, full_name, avatar_key, password_hash, locale, created_at, ...)
workspaces(id, name, namespace unique, owner_id, timezone, limits jsonb, system_config jsonb, created_at)
workspace_members(workspace_id, user_id, status, joined_at, PRIMARY KEY(workspace_id, user_id))
invitations(id, workspace_id, email|user_id, team_id, role_id, status, expires_at, created_by)

-- Đội nhóm, vai trò, nhãn, quyền
teams(id, workspace_id, name, description, label_ids text[], created_at)
team_roles(id, workspace_id, team_id, code, name, description, label_ids text[], is_default)
team_members(workspace_id, team_id, role_id, user_id, PRIMARY KEY(team_id, role_id, user_id))
labels(id, workspace_id, kind /* notification|role|team */, name, created_at, updated_at)
permissions(workspace_id, team_id, role_id, subject /* 'TABLE'|'FORM'|... */, action, scope /* none|all|own|team|... */,
            can_grant bool, PRIMARY KEY(role_id, subject, action))

-- Apps / Active Tables
work_groups(id, workspace_id, name, sort_order numeric)
tables(id, workspace_id, work_group_id, name, description, icon, icon_color, table_type,
       config jsonb not null,         -- fields, actions, quickFilters, kanbanConfigs, ganttCharts, pivotConfigs,
                                      -- objectiveCardConfigs, conversionConfigs, calendarConfigs, recordListConfig,
                                      -- recordDetailConfig, permissionsConfig, defaultSort, defaultScreen, itemsConfig…
       config_version int not null,   -- tăng mỗi lần sửa cấu hình (khoá lạc quan)
       record_limit int, e2ee bool, created_by, created_at, updated_at, deleted_at)
records(id, workspace_id, table_id,
        data jsonb not null,           -- { "<field_name>": value }  (giống bản tham khảo)
        items jsonb,                   -- danh sách chi tiết (dòng hàng)
        sort_key numeric not null,     -- thứ tự kéo thả (fractional index)
        revision bigint not null,      -- tăng mỗi lần sửa bản ghi
        created_by, updated_by, created_at, updated_at, deleted_at,
        search tsvector)               -- tìm kiếm toàn văn (cập nhật bất đồng bộ)
record_refs(workspace_id, table_id, record_id, field_name, ref_table_id, ref_record_id)
        -- chỉ mục ngược cho SELECT_ONE_RECORD / SELECT_LIST_RECORD / FIRST_REFERENCE_RECORD
record_comments(id, workspace_id, table_id, record_id, author_id, body, mentions text[], created_at, updated_at, deleted_at)
record_history(id, workspace_id, table_id, record_id, actor_id, changes jsonb /*{field:{before,after}}*/, created_at)
attachments(id, workspace_id, storage_key, file_name, mime, size, sha256, created_by, created_at)
import_jobs(id, workspace_id, table_id, file_name, status, total, created, updated, failed, error_file_key, created_by, created_at)

-- Đường ghi
changesets(id, workspace_id, resource_type, resource_id, revision, actor_id, session_id, command, changes jsonb, created_at)
outbox(id bigserial, workspace_id, topic, payload jsonb, created_at, published_at)   -- transactional outbox

-- Cloud Logic
workflow_units(id, workspace_id, name, description, created_at, updated_at)
workflow_events(id, workspace_id, unit_id, name, description, enabled bool,
                trigger jsonb,                 -- {type: ACTIVE_TABLE|SCHEDULE|WEBHOOK|FORM, params}
                definition_yaml text, definition jsonb, version int, updated_at)
workflow_executions(id, workspace_id, event_id, event_version, status, trigger_payload jsonb,
                    idempotency_key unique, started_at, finished_at, error)
workflow_jobs(id, execution_id, node_id, status, input jsonb, output jsonb, attempts, resume_at, error, started_at, finished_at)
workflow_logs(id bigserial, execution_id, level, message, data jsonb, created_at)    -- console sự kiện (TTL)

-- Biểu mẫu, kết nối, Social, thông báo
forms(id, workspace_id, name, type, config jsonb, public_slug unique, created_at)
connectors(id, workspace_id, type, name, description, config jsonb /*không bí mật*/,
           secret_ciphertext bytea, secret_key_id, status, oauth_expires_at, created_at)
social_settings(workspace_id, channel, active_table_id, assignable_user_ids text[], templates jsonb, tags jsonb)
conversations(id, workspace_id, channel, connector_id, external_id, customer jsonb, assignee_id,
              label_ids text[], record_id, last_message_at, unread int)
messages(id, workspace_id, conversation_id, direction, external_id unique, body jsonb, status, sent_at)
notifications(id, workspace_id, user_id, type, title, content, meta jsonb, is_read, created_at)
audit_logs(id bigserial, workspace_id, actor_id, action, resource, resource_id, ip, user_agent, details jsonb, created_at)
```

`records` phân vùng `HASH (workspace_id)` ngay từ đầu; bảng nối dài (`record_history`, `workflow_logs`, `messages`, `audit_logs`) phân vùng theo thời gian (`docs/database-multi-tenant-design.md` I10).

## 5. Kiểu trường (field registry)

Mỗi loại trường của frontend (SHORT_TEXT, TEXT, RICH_TEXT, EMAIL, PHONE, URL, AUTO_GENERATED_CODE, ATTACHMENT, DATE, DATETIME, TIME, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, INTEGER, NUMERIC, NUMERIC_SUMMARY, CHECKBOX_YES_NO, CHECKBOX_ONE, CHECKBOX_LIST, SELECT_ONE, SELECT_LIST, SELECT_ONE_RECORD, SELECT_LIST_RECORD, FIRST_REFERENCE_RECORD, SELECT_ONE_WORKSPACE_USER, SELECT_LIST_WORKSPACE_USER) là một implementation:

```go
type FieldType interface {
    Code() string                                         // "SELECT_ONE"
    ValidateConfig(cfg FieldConfig, t *Table) error       // kiểm tra cấu hình trường (JSON Schema + nghiệp vụ)
    Coerce(raw any, cfg FieldConfig) (any, error)         // chuẩn hoá giá trị (từ API, Excel, workflow)
    Validate(v any, cfg FieldConfig) error                // bắt buộc, min/max, không trùng…
    SQLExpr(cfg FieldConfig) string                       // biểu thức đọc từ JSONB, vd (data->>'amount')::numeric
    Operators() []query.Operator                          // toán tử lọc hỗ trợ
    BuildFilter(op query.Operator, val any, cfg FieldConfig, b *query.Builder) error
    Computed() bool                                       // NUMERIC_SUMMARY, FIRST_REFERENCE_RECORD, AUTO_GENERATED_CODE
}
```

- Đăng ký trong `field.Registry` lúc khởi động; thêm loại trường mới = thêm một file, không sửa core.
- `AUTO_GENERATED_CODE`: bộ đếm `sequences(table_id, field_name, value)` + `UPDATE … RETURNING` trong cùng transaction; mẫu `{{auto.increment.padLeft(n,0)}}`, `{{date.*}}`.
- `NUMERIC_SUMMARY` (Số tự tính): lưu sẵn kết quả vào `data` (mục 7).
- `SELECT_*_RECORD`: lưu id bản ghi trong `data`, đồng thời ghi `record_refs` để tra ngược / kiểm tra toàn vẹn khi xoá.
- `ATTACHMENT`: `data` chỉ chứa id trong bảng `attachments`; tệp nằm S3.

## 6. Truy vấn: lọc, sắp xếp, phân trang

Cây bộ lọc (dùng chung frontend, định nghĩa bằng JSON Schema):

```json
{ "and": [
  { "field": "trang_thai", "op": "eq", "value": "chot" },
  { "or": [ { "field": "gia_tri", "op": "gte", "value": 1000000 },
            { "field": "created_at", "op": "within", "value": { "preset": "this_month" } } ] } ] }
```

- `query.Compile(tree, table, actor)` → `WHERE` có tham số (`$1, $2…`), không bao giờ ghép chuỗi giá trị. Tên trường được kiểm tra với cấu hình bảng; mỗi điều kiện do `FieldType.BuildFilter` sinh.
- Luôn cộng thêm: `workspace_id = $ws AND table_id = $t AND deleted_at IS NULL` (+ RLS dự phòng) + **data scope** từ phân quyền (mục 9) + bộ lọc của màn xem.
- Index: `GIN (data jsonb_path_ops)` cho `@>`; **expression index** cho trường hay lọc/sắp xếp, tạo tự động khi cấu hình bảng đánh dấu trường "có thể tìm kiếm"/"hiển thị chính", vd `CREATE INDEX CONCURRENTLY … ON records (table_id, ((data->>'trang_thai')))`.
- Phân trang **cursor (keyset)** theo `(sort_value, id)`: `next_id` / `previous_id` giống bản tham khảo; không dùng OFFSET cho danh sách lớn.
- Tổng hợp (COUNT/SUM/AVG/MIN/MAX cho thanh "Tổng hợp", Pivot) chạy bằng SQL `GROUP BY` trên cùng `WHERE`.
- Tìm kiếm: cột `search tsvector` (cập nhật bởi worker từ các trường được đánh dấu tìm kiếm), dùng `unaccent` cho tiếng Việt.

## 7. Trường tính toán và phụ thuộc

- Khi lưu cấu hình bảng, `formula` dựng **đồ thị phụ thuộc** giữa các trường (kể cả qua tham chiếu bảng khác) và kiểm tra vòng lặp.
- Khi bản ghi đổi các trường gốc, trong cùng transaction: tính lại `NUMERIC_SUMMARY` của bản ghi đó theo thứ tự topo, ghi vào `data`.
- Ảnh hưởng sang bảng khác (FIRST_REFERENCE_RECORD, tổng item) → đẩy việc vào outbox, worker tính lại theo lô (`record_refs` để tìm bản ghi bị ảnh hưởng).
- Khi sửa biểu thức → job nền tính lại toàn bảng theo lô 1.000 bản ghi, có tiến độ.
- Parser công thức viết tay (Pratt parser) hỗ trợ `+ - * /`, so sánh, `&& || !`, `IF(…)`; cùng bộ `spec/vectors/formula/*.json` chạy ở Go và TS để hai bên tính giống nhau.

## 8. Đường ghi, realtime, undo

```
HTTP/WS/workflow/import ──► command.Execute(ctx, cmd)
   1. kiểm quyền (permission.Check)
   2. BEGIN; SELECT … FOR UPDATE (bản ghi) / kiểm config_version (bảng)
   3. áp thay đổi, tính trường tính toán, ghi record_history
   4. INSERT changesets (revision+1), INSERT outbox(topic, payload)
   5. COMMIT
outbox relay (worker) ──► Redis/NATS pub/sub ──► realtime gateway ──► client đang mở bảng/bản ghi
                     └──► workflow trigger (ACTIVE_TABLE create/update/delete) ──► hàng đợi workflow
                     └──► audit, notification, search index
```

- **Transactional outbox** đảm bảo không mất sự kiện khi Redis/NATS lỗi; relay đánh dấu `published_at`.
- Xung đột ghi: **theo từng ô (last-write-wins)** + `revision` của bản ghi; cấu hình bảng dùng `config_version` (sai version → 409, frontend tải lại).
- Sự kiện kèm `session_id` để client gây ra thay đổi bỏ qua; client mất kết nối thì gọi API lấy changeset từ `revision` đã biết.
- **Undo/redo**: mỗi command sinh "lệnh đảo ngược" lưu theo `(user, table, session)` trong Redis (giới hạn 50 bước); undo = chạy lệnh đảo ngược qua đúng đường ghi.
- Workflow ghi dữ liệu cũng đi qua `command.Execute` với actor là workflow → có audit, có phân quyền, không lặp vô hạn (chặn bằng `depth` trong context).

## 9. Phân quyền

- Vai trò theo **đội nhóm × vai trò** (bảng `permissions`), giống tab Quyền trong Cài đặt workspace; hành động: `access/create/update/delete`, `invite_member/remove_member`, hành động tuỳ chỉnh của bảng, hành động bình luận…
- Phạm vi (`scope`): `none`, `all`, `own` (do mình tạo), `team` (do thành viên nhóm tạo), `own_12h` (do mình tạo trong 12 giờ đầu), `assigned`… → `permission.Scope()` trả về **điều kiện SQL** ghép vào truy vấn (data scope kiểu NocoBase), không lọc sau khi đọc.
- Quyền theo trường (ẩn/chỉ đọc) áp ở lớp serialize và khi ghi.
- Quyền được cache theo `(workspace, user)` trong Redis, xoá cache khi đổi đội/vai trò/quyền (sự kiện outbox).
- Mọi handler gọi `permission.Check` qua middleware khai báo, ví dụ `route.With(perm.Require("record", "update"))`.

## 10. Cloud Logic (workflow)

- **Định nghĩa**: YAML (như tab YAML của trình dựng) → parse + validate theo JSON Schema → lưu `definition jsonb` + `version`. Mỗi lần lưu tăng `version`; lượt chạy ghi `event_version` để chạy đúng phiên bản.
- **Trigger**: `ACTIVE_TABLE` (từ outbox: create/update/delete, lọc theo trường đổi và điều kiện), `SCHEDULE` (scheduler, cron + múi giờ), `WEBHOOK` (endpoint có khoá bí mật), `FORM` (submit biểu mẫu).
- **Node registry** (giống field registry):

```go
type Node interface {
    Type() string                                  // "condition", "table_operation", "send_email", "zalo_oa", "think_agent"…
    Validate(cfg json.RawMessage) error
    Run(ctx context.Context, in NodeInput) (NodeOutput, error)   // output có nhánh: true/false, đã mở/đã click…
}
```

- **Thực thi bền**: mỗi lượt chạy là `workflow_executions` + `workflow_jobs`; worker lấy job từ hàng đợi, chạy node, ghi output, đẩy job kế tiếp. Node **Trì hoãn** → ghi `resume_at`, scheduler đánh thức → không giữ goroutine khi chờ ngày/tháng.
- Thử lại có backoff cho lỗi tạm thời, `idempotency_key` chống chạy trùng; giới hạn thời gian và số bước mỗi lượt chạy; giới hạn đồng thời theo workspace.
- **Console**: `workflow_logs` + đẩy realtime tới trang console; giữ 7–30 ngày.
- **Gọi API ngoài an toàn**: HTTP client chung có timeout, giới hạn kích thước phản hồi, **chặn SSRF** (không cho gọi IP nội bộ/metadata cloud), log đã che bí mật.

## 11. Kết nối và bí mật

- `connectors.config` chỉ chứa phần không nhạy cảm; token/mật khẩu/khoá API nằm trong `secret_ciphertext` mã hoá **AES-256-GCM theo kiểu envelope**: mỗi workspace một khoá dữ liệu (DEK), DEK được mã hoá bằng khoá master trong Vault/OpenBao tự vận hành (Transit engine), vì chạy trên server vật lý.
- OAuth (Google, Facebook, Zalo OA): luồng authorization code + PKCE, `state` ký HMAC, callback `/workflow-connectors/oauth-callback`; worker tự làm mới token trước khi hết hạn, cập nhật `status` (hoạt động / cần kết nối lại / lỗi).
- Bí mật chỉ được giải mã trong worker khi chạy node, không bao giờ trả về API (API chỉ trả `"<redacted>"`).

## 12. Social Inbox

- Webhook vào: `/webhooks/{channel}/{connectorId}` → **xác minh chữ ký** (Facebook/Instagram/WhatsApp `X-Hub-Signature-256`, Zalo OA `mac`) → ghi `messages` (chống trùng bằng `external_id`) → cập nhật `conversations` → realtime + trigger workflow.
- Gửi tin: qua hàng đợi theo connector (tôn trọng giới hạn tốc độ của từng nền tảng), trạng thái gửi/đã đọc cập nhật qua webhook.
- Liên kết hội thoại với bản ghi trong bảng (`social_settings.active_table_id`, `conversations.record_id`).

## 13. API

- REST JSON, **OpenAPI 3.1 là nguồn gốc**; sinh kiểu Go (`oapi-codegen`) và client TS (`openapi-typescript`) cho frontend dùng với TanStack Query.
- Đường dẫn theo tài nguyên: `/v1/workspaces/{ws}/tables/{tableId}/records`, `/v1/workspaces/{ws}/tables/{tableId}/records:query` (POST, body là cây bộ lọc + sort + cursor), `/v1/workspaces/{ws}/workflow-units/{id}/events`…
- Thao tác hàng loạt: `records:batchCreate`, `records:batchUpdate`, `records:batchDelete` (tối đa 200 bản ghi/lần).
- Phản hồi danh sách: `{ data: [...], next_id, previous_id }`; lỗi: `{ code, message, errors: { "field": "…" } }` (giữ giống bản tham khảo để frontend ít đổi).
- `Idempotency-Key` cho các POST tạo dữ liệu; `ETag/If-Match` theo `config_version`/`revision`.
- Xác thực: access token JWT (10–15 phút, ký Ed25519) + refresh token xoay vòng lưu băm trong DB; API token cho tích hợp có phạm vi (workspace, bảng, quyền đọc/ghi).

## 14. Bảo mật (tóm tắt, chi tiết ở `docs/tech-stack-decision.md` mục 8)

- Mật khẩu `argon2id`; giới hạn đăng nhập sai; reset mật khẩu bằng token một lần, hết hạn.
- Cách ly tenant: mọi truy vấn có `workspace_id`, RLS (`SET LOCAL tago.ws`) làm lưới an toàn, khách gói riêng nằm ở shard riêng — có test tự động chứng minh request của workspace A không đọc/ghi được dữ liệu của B (`docs/database-multi-tenant-design.md` §3, §5).
- Rate limit theo IP + user + API token (Redis); giới hạn kích thước body, số bản ghi, số trường.
- Tệp: tải lên qua presigned URL, kiểm tra MIME + kích thước, quét mã độc (ClamAV) ở worker, tải xuống bằng URL ký có hạn.
- Header bảo mật, CORS chỉ cho domain frontend, cookie `HttpOnly; Secure; SameSite`.
- E2EE bảng (tuỳ chọn, giống bản tham khảo): khoá ở phía người dùng; server chỉ lưu bản mã + băm từ khoá để vẫn tìm kiếm được.

## 15. Vận hành và chi phí

- Log `slog` dạng JSON, trace/metric OpenTelemetry → SigNoz; health `/livez`, `/readyz`.
- Migration chạy bằng `tago migrate system` và `tago migrate shards` (canary rồi lần lượt từng shard, kiểu expand/contract) trong pipeline, không tự chạy khi khởi động production.
- Image: build tĩnh `CGO_ENABLED=0`, distroless, user không phải root, filesystem chỉ đọc.
- Cấu hình khởi điểm (ước lượng, cần đo lại): 1 máy 2 vCPU / 4 GB chạy `tago all` + cụm Postgres tự vận hành trên server vật lý (Patroni, pgBackRest — `docs/database-multi-tenant-design.md` §13) + Redis nhỏ đủ cho giai đoạn đầu; khi tải tăng thì tách `worker` và `realtime` ra máy riêng và scale ngang (stateless).

## 16. Kiểm thử

- Unit test cho field registry, query compiler, formula (dùng `spec/vectors`, chạy cả bên TS).
- Test tích hợp với Postgres thật (testcontainers-go) cho store/sqlc, phân quyền, cách ly tenant.
- Contract test: phản hồi API khớp `api/openapi.yaml`.
- Test tải cho `records:query` và worker workflow trước khi lên production.

## 17. Lộ trình

| Giai đoạn | Nội dung | Thay mock ở frontend |
|---|---|---|
| 1 | Nền tảng: config, DB, auth, workspace, thành viên, đội nhóm, vai trò, nhãn, OpenAPI + client TS | Đăng nhập, Cài đặt workspace, Đội nhóm, Lời mời |
| 2 | Apps: bảng, cấu hình, field registry, bản ghi, query (lọc/sort/cursor/tổng hợp), bình luận, tệp, lịch sử | Apps, bản ghi, cài đặt bảng |
| 3 | Đường ghi đầy đủ: changeset, outbox, realtime, undo; nhập/xuất Excel; trường tính toán | Realtime, Nhập Excel |
| 4 | Cloud Logic: unit/event/YAML, trigger, executor, node cơ bản (điều kiện, bảng, email, HTTP, trì hoãn), console | Cloud Logic |
| 5 | Kết nối (OAuth, bí mật), Biểu mẫu, Social Inbox (webhook + gửi tin), thông báo | Kết nối, Biểu mẫu, Social, Thông báo |
| 6 | Phân quyền đầy đủ (data scope, quyền theo trường), E2EE, tối ưu index/partition, test tải | — |

## 18. Thư viện Go đề xuất (giữ ít)

| Việc | Thư viện |
|---|---|
| HTTP router | `github.com/go-chi/chi/v5` |
| Postgres | `github.com/jackc/pgx/v5` + `sqlc` (sinh code) |
| Migration | `github.com/pressly/goose/v3` |
| Redis | `github.com/redis/go-redis/v9` (hoặc NATS `github.com/nats-io/nats.go`) |
| WebSocket | `github.com/coder/websocket` |
| JWT | `github.com/golang-jwt/jwt/v5` |
| Crypto | thư viện chuẩn + `golang.org/x/crypto` (argon2id) |
| YAML | `gopkg.in/yaml.v3` |
| JSON Schema | `github.com/santhosh-tekuri/jsonschema/v6` |
| Excel | `github.com/xuri/excelize/v2` |
| S3 | `github.com/minio/minio-go/v7` |
| OpenAPI | `github.com/oapi-codegen/oapi-codegen` (sinh code) |
| OTel | `go.opentelemetry.io/otel` |
| Test | `github.com/testcontainers/testcontainers-go` |

Mỗi thư viện thêm vào phải qua review và `govulncheck` trong CI.
