import { connectorType } from "./connector-types"

/** Markdown docs shown in the "Tài liệu" card (ACTIVE_TABLE mirrors the reference text). */
const TABLE_DOC = `Dưới đây là tài liệu hướng dẫn sử dụng block \`type: table\` dưới dạng Markdown, trình bày đầy đủ cú pháp, các action hỗ trợ, ví dụ minh hoạ và giải thích chi tiết.

---

# 📄 Hướng Dẫn Sử Dụng Block \`type: table\`

## 1. Mục đích

Block \`type: table\` cho phép thao tác với bảng dữ liệu trong workflow, bao gồm:

- Truy vấn danh sách bản ghi
- Truy vấn một bản ghi
- Tạo mới bản ghi
- Cập nhật bản ghi
- Xoá bản ghi

---

## 2. Cấu trúc tổng quan

\`\`\`
- type: table
  name: <tên block>
  input:
    table: <ID bảng dữ liệu>
    action: <get_list | get_one | create | update | delete>
    # Tùy theo action sẽ có các tham số khác nhau
  output: <biến lưu kết quả>
\`\`\`

---

## 3. Các action hỗ trợ

| Action | Mô tả | Tham số bắt buộc |
| get_list | Lấy danh sách bản ghi | query |
| get_one | Lấy một bản ghi | query |
| create | Tạo mới bản ghi | data |
| update | Cập nhật bản ghi theo ID | record, data |
| delete | Xoá bản ghi theo ID | record |

---

## 4. Chi tiết tham số

### ✅ \`table\`

- ID hoặc tên của bảng dữ liệu.
- Có thể sử dụng biến từ context (ví dụ: \`$[config.table_id]\`).

### ✅ \`action\`

- Một trong các hành động: \`get_list\`, \`get_one\`, \`create\`, \`update\`, \`delete\`.

### ✅ \`query\` (dùng cho \`get_list\` và \`get_one\`)

\`\`\`
query:
  filter:
    field1: value1
    field2: value2
  offset: 0     # Tuỳ chọn
  limit: 10     # Tuỳ chọn
\`\`\`

### ✅ \`data\` (dùng cho \`create\` và \`update\`)

\`\`\`
data:
  field1: value1
  field2: value2
\`\`\`

### ✅ \`record\` (dùng cho \`update\` và \`delete\`)

- ID của bản ghi cần cập nhật hoặc xoá.

---

## 5. Ví dụ chi tiết

### 📌 Truy vấn danh sách bản ghi

\`\`\`
- type: table
  name: get_users
  input:
    table: $[config.table_id]
    action: get_list
    query:
      filter:
        active: true
        role: customer
      offset: 0
      limit: 5
  output: users
\`\`\`

### 📌 Truy vấn một bản ghi

\`\`\`
- type: table
  name: get_user
  input:
    table: $[config.table_id]
    action: get_one
    query:
      filter:
        email: "example@gmail.com"
  output: user
\`\`\`

### 📌 Tạo mới bản ghi

\`\`\`
- type: table
  name: create_user
  input:
    table: $[config.table_id]
    action: create
    data:
      name: "Nguyễn Văn A"
      email: "nguyenvana@example.com"
      active: true
  output: new_user
\`\`\`

### 📌 Cập nhật bản ghi

\`\`\`
- type: table
  name: update_user
  input:
    table: $[config.table_id]
    action: update
    record: $[user.id]
    data:
      active: false
  output: updated_user
\`\`\`

### 📌 Xoá bản ghi

\`\`\`
- type: table
  name: delete_user
  input:
    table: $[config.table_id]
    action: delete
    record: $[user.id]
  output: delete_result
\`\`\`

---

## 6. Output

Tất cả các action đều trả về biến \`output\` với kết quả phù hợp:

- \`get_list\`: Danh sách các bản ghi.
- \`get_one\`: Một bản ghi đơn.
- \`create\`: Bản ghi vừa tạo với ID mới.
- \`update\`: Bản ghi đã cập nhật.
- \`delete\`: \`true\` nếu xoá thành công.

---

## 7. Lưu ý

- Các biến có thể được truyền từ các block trước bằng cú pháp: \`$[tên_biến]\`.
- Nếu \`get_one\` không tìm thấy dữ liệu sẽ báo lỗi \`Record not found\`.
- Khi update, nếu không truyền đúng \`record\` ID sẽ báo lỗi.

---

## 8. Gợi ý mở rộng

- Hỗ trợ thêm \`bulk_update\` và \`bulk_delete\`.
- Hỗ trợ thêm \`order_by\` trong query để sắp xếp kết quả.
- Cho phép truyền các toán tử so sánh như \`>\`, \`<\`, \`!=\` trong query nâng cao.

---

Nếu bạn muốn tôi giúp bạn viết thêm tài liệu phần callback hoặc ví dụ workflow phức tạp hơn, bạn cho tôi biết nhé! 😊`

/** Generic doc for types without a dedicated one: purpose + setup steps. */
const genericDoc = (type: string) => {
  const t = connectorType(type)
  if (!t) return ""
  const steps = t.oauth
    ? ["Bấm “Kết nối OAuth” và đăng nhập tài khoản dịch vụ.", "Chọn trang / tài khoản cần cấp quyền.", "Quay lại đây, trạng thái chuyển “Đang hoạt động”."]
    : ["Lấy thông tin truy cập từ trang quản trị của dịch vụ.", "Điền các ô bắt buộc (*) rồi bấm “Lưu cấu hình”.", "Dùng connector này trong các node Cloud Logic."]
  return `${t.description}\n\n---\n\n## Thiết lập\n\n${steps.map((s, i) => `- ${i + 1}. ${s}`).join("\n")}`
}

export const connectorDoc = (type: string) => (type === "ACTIVE_TABLE" ? TABLE_DOC : genericDoc(type))
