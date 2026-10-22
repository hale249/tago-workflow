# @workspace/spec

Hợp đồng chung giữa backend Go (`apps/backend`) và frontend TS (`apps/admin`):

- `schemas/` — JSON Schema cho cấu hình bảng, kiểu trường, cây bộ lọc, YAML workflow… Backend validate bằng chúng; frontend import để sinh kiểu/validate form.
- `vectors/` — bộ ca kiểm thử dạng JSON (bộ lọc, công thức "Số tự tính", chuyển đổi giá trị trường). Test Go (`apps/backend/internal/query`, `internal/formula`) và test TS cùng chạy các file này để hai bên cho cùng kết quả.

Hợp đồng REST nằm ở `apps/backend/api/openapi.yaml`.
