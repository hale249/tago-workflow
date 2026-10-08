import { useQuery } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { Children, isValidElement, type ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { ComboSelect, tablesListQuery } from "@/features/tables"
import { connectorsListQuery } from "@/features/workflow-connectors"
import { INTEGRATION_ACTIONS } from "../data/node-types"
import type { WorkflowStep } from "../types/workflow"

type Config = Record<string, unknown>
type Props = { step: WorkflowStep; steps: WorkflowStep[]; onChange: (c: Config) => void }

const area = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"

/** Field block like the reference panel: 14px label, control, 12px hint underneath. */
function Row({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}{required && <span className="ml-1 text-destructive">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Drop-in for `<select>` with `<option>` children, rendered as the reference-style dropdown. */
function Pick({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  const opts: { value: string; text: string }[] = []
  Children.forEach(children, (ch) => {
    const walk = (c: ReactNode) => {
      if (Array.isArray(c)) return c.forEach(walk)
      if (isValidElement<{ value?: string; children?: ReactNode }>(c) && c.type === "option") {
        const t = c.props.children
        opts.push({ value: String(c.props.value ?? ""), text: Array.isArray(t) ? t.join("") : String(t ?? "") })
      }
    }
    walk(ch)
  })
  const placeholder = opts.find((o) => o.value === "")?.text ?? "Chọn"
  return <ComboSelect value={value} onChange={onChange} options={opts.filter((o) => o.value !== "")} placeholder={placeholder} />
}

const STATE_ACTIONS = [
  ["set", "Gán giá trị mới"], ["increment", "Cộng thêm 1"], ["decrement", "Trừ đi 1"], ["add", "Cộng"], ["subtract", "Trừ"], ["multiply", "Nhân"],
  ["divide", "Chia"], ["round", "Làm tròn"], ["push", "Thêm vào cuối mảng"], ["pop", "Bỏ phần tử cuối"], ["unshift", "Thêm vào đầu mảng"],
  ["shift", "Bỏ phần tử đầu"], ["concat", "Nối chuỗi vào cuối"], ["prepend", "Nối chuỗi vào đầu"], ["uppercase", "Chữ hoa"], ["lowercase", "Chữ thường"],
  ["trim", "Bỏ khoảng trắng hai đầu"], ["set_key", "Gán giá trị cho key"], ["merge", "Gộp object"], ["reset", "Đặt lại giá trị khởi tạo"],
] as const
const NO_VALUE = new Set(["increment", "decrement", "pop", "shift", "uppercase", "lowercase", "trim", "reset", "round"])

/** Node types that have a dedicated form below (others fall back to the JSON editor). */
export const FORM_TYPES = new Set([
  "table_operation", "delay", "condition", "loop", "loop_control", "smtp_email", "notification", "table_comment_create", "log",
  "api_call", "webhook", "math", "definition", "state_init", "state_update", "validation", "stop_with_error", "think_agent",
  "table_comment_get_one", "active_table_html_upload", "image_generation", "toast_notification", "dock_message", "user_operation", "object_lookup", "collection_union",
  ...Object.keys(INTEGRATION_ACTIONS),
])

/** Integration action lists are keyed by service; a few node types use a different key. */
const ACTION_KEY: Record<string, string> = { google_task: "google_tasks", facebook_page_messaging: "facebook_messaging" }
/** "Hành động <service>" label + hint, as on the reference panel. */
const SERVICE_NAME: Record<string, string> = {
  google_sheet: "Google Sheets", google_calendar: "Google Calendar", google_drive: "Google Drive", google_task: "Google Tasks",
  google_gmail: "Gmail", google_photos: "Google Photos", google_contacts: "Google Contacts",
}
const UNARY_MATH = new Set(["abs", "round", "floor", "ceil", "sqrt", "log", "exp", "negate"])
const NO_RIGHT = new Set(["is_empty", "is_not_empty"])

/** Typed config form per node type (labels, hints and options follow the reference). Returns null when there is none. */
export function NodeConfigForm({ step, steps, onChange }: Props) {
  const { data: tables = [] } = useQuery(tablesListQuery())
  const { data: connectors = [] } = useQuery(connectorsListQuery())
  const c = step.config
  const v = (k: string) => (c[k] == null ? "" : String(c[k]))
  const set = (k: string, val: unknown) => onChange({ ...c, [k]: val })
  type Opt = { required?: boolean; mono?: boolean; type?: string }
  const text = (k: string, label: string, hint?: string, placeholder?: string, o: Opt = {}) => (
    <Row label={label} hint={hint} required={o.required}>
      <Input type={o.type} value={v(k)} placeholder={placeholder} className={o.mono ? "font-mono" : undefined}
        onChange={(e) => set(k, o.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} />
    </Row>
  )
  const textarea = (k: string, label: string, hint?: string, placeholder?: string, o: Opt = {}) => (
    <Row label={label} hint={hint} required={o.required}>
      <textarea rows={4} className={cn(area, o.mono && "font-mono text-xs")} value={v(k)} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
    </Row>
  )
  const pick = (k: string, label: string, options: [string, string][], o: { hint?: string; required?: boolean; fallback?: string; placeholder?: string } = {}) => (
    <Row label={label} hint={o.hint} required={o.required}>
      <Pick value={v(k) || (o.fallback ?? "")} onChange={(val) => set(k, val)}>
        {o.placeholder !== undefined && <option value="">{o.placeholder}</option>}
        {options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
      </Pick>
    </Row>
  )
  const connector = (label: string, hint: string, required = false) =>
    pick("connector", label, connectors.map((x) => [x.id, `${x.name} (${x.connectorType})`]), {
      hint: connectors.length ? hint : `${hint} — chưa có kết nối, tạo ở mục Kết nối`, required, placeholder: "Nhập ID kết nối",
    })
  const tablePick = () => pick("tableId", "Kết nối Bảng", tables.map((t) => [t.id, t.name]), { hint: "Chọn hoặc tạo kết nối Active Table", required: true, placeholder: "Nhập ID bảng" })
  const recordId = (hint?: string) => text("record", "ID Bản ghi", hint, "Nhập ID bản ghi", { required: true, mono: true })

  switch (step.type) {
    case "table_operation": {
      const action = v("action") || "get_one"
      return (
        <>
          {tablePick()}
          {pick("action", "Hành động", [["get_list", "Lấy danh sách"], ["get_one", "Lấy một"], ["create", "Tạo mới"], ["update", "Cập nhật"], ["delete", "Xóa"]], { hint: "Thao tác CRUD cần thực hiện", required: true, fallback: "get_one" })}
          {["get_one", "update", "delete"].includes(action) && recordId("Bản ghi cần thao tác, vd: {{ .trigger.record_id }}")}
          {action === "get_list" && textarea("query", "Truy vấn", "Tham số lọc và sắp xếp", '{ "filtering": {}, "limit": 50 }', { mono: true })}
          {["create", "update"].includes(action) && textarea("data", "Dữ liệu", "Dữ liệu bản ghi để tạo/cập nhật (JSON, hỗ trợ biến)", '{ "status": "done" }', { mono: true })}
        </>
      )
    }
    case "active_table_html_upload": {
      const target = v("target") || "comment"
      return (
        <>
          {tablePick()}
          {recordId()}
          {pick("target", "Đính kèm vào", [["comment", "Bình luận của bản ghi"], ["record", "Field đính kèm của bản ghi"]], { hint: "Nơi đính kèm file được tạo", required: true, fallback: "comment" })}
          {target === "record" && text("field", "Field đính kèm", "Tên field kiểu ATTACHMENT của bản ghi", "attachments", { required: true, mono: true })}
          {pick("fileType", "Loại file", [["html", "HTML"], ["pdf", "PDF"]], { hint: "Định dạng file đầu ra (HTML hoặc PDF)", required: true, fallback: "html" })}
          {text("fileName", "Tên file (Tùy chọn)", "Tên file đầu ra, không cần phần mở rộng", "report")}
          {textarea("inputHtml", "Nội dung HTML", "Mã HTML nguồn dùng để tạo file", "<html><body><h1>Hello</h1></body></html>", { required: true, mono: true })}
          {target === "comment" && textarea("content", "Nội dung bình luận (Tùy chọn)", "Nội dung văn bản của bình luận chứa file đính kèm", "Đính kèm file vào comment")}
        </>
      )
    }
    case "table_comment_create":
      return (
        <>
          {tablePick()}
          {recordId()}
          {textarea("content", "Nội dung bình luận", "Nội dung bình luận cần tạo", "Nhập nội dung bình luận...", { required: true })}
          {text("parentId", "ID Bình luận cha (Tùy chọn)", "Cho phản hồi, nhập ID bình luận cha", "Nhập ID bình luận cha (tùy chọn)", { mono: true })}
        </>
      )
    case "table_comment_get_one":
      return (
        <>
          {tablePick()}
          {recordId()}
          {text("commentId", "ID Bình luận", "ID của bình luận cần lấy", "Nhập ID bình luận", { required: true, mono: true })}
        </>
      )
    case "smtp_email":
      return (
        <>
          {connector("Kết nối SMTP", "Chọn hoặc tạo kết nối SMTP")}
          {text("to", "Người nhận", undefined, "nguoi-nhan@example.com", { required: true })}
          {text("toName", "Tên người nhận", "Tên hiển thị của người nhận", "Recipient Name")}
          {text("cc", "CC", "Người nhận bản sao (phân cách bằng dấu phẩy)", "cc1@example.com, cc2@example.com")}
          {text("bcc", "BCC", "Người nhận bản sao ẩn", "bcc@example.com")}
          {text("subject", "Tiêu đề", "Dòng tiêu đề email", "Xác nhận đơn hàng của bạn", { required: true })}
          {textarea("body", "Nội dung", "Nội dung email (hỗ trợ HTML)", "Xin chào [tên người nhận],\n\nCảm ơn bạn đã đặt hàng...", { required: true })}
          {text("noOpenDays", "Sau bao nhiêu ngày không mở", "Trigger nhánh 'Không mở' sau X ngày không mở email", "3", { type: "number" })}
          {text("noClickDays", "Sau bao nhiêu ngày không click", "Trigger nhánh 'Không click' sau X ngày không click link trong email", "3", { type: "number" })}
        </>
      )
    case "think_agent":
      return (
        <>
          {connector("Kết nối AI Provider", "Chọn hoặc tạo kết nối AI Provider (OpenAI, Anthropic, Gemini...)", true)}
          {text("goal", "Mục tiêu", "Mô tả ngắn gọn việc agent cần hoàn thành", "Tóm tắt cuộc hội thoại", { required: true })}
          {text("context", "Ngữ cảnh", "Biểu thức dữ liệu đầu vào cho agent, ví dụ .workflowData.chatMessages", "{{ .workflowData.chatMessages }}", { mono: true })}
          {textarea("steps", "Các bước suy luận", "Danh sách các bước agent thực hiện theo thứ tự (mỗi dòng một bước)", "Ví dụ: Đọc toàn bộ tin nhắn")}
          {textarea("userPrompt", "Thông tin đầu vào", "Hướng dẫn thêm cho agent về định dạng và nội dung kết quả", "Viết tóm tắt bằng tiếng Việt, không quá 3 câu.")}
          {textarea("responseSchema", "Schema kết quả", "JSON Schema định nghĩa cấu trúc kết quả trả về (tùy chọn)", undefined, { mono: true })}
        </>
      )
    case "image_generation":
      return (
        <>
          {connector("Kết nối AI Provider", "Chọn hoặc tạo kết nối AI Provider (OpenAI, Anthropic, Gemini...)", true)}
          {textarea("prompt", "Mô tả ảnh (prompt)", "Mô tả ảnh cần tạo, hỗ trợ biểu thức mẫu như .workflowData.xxx", "A futuristic city at sunset, cyberpunk style, neon lights", { required: true })}
          {text("size", "Kích thước", "Kích thước ảnh, ví dụ 1024x1024, 1792x1024, 1024x1792 (mặc định 1024x1024)", "1024x1024")}
          {pick("quality", "Chất lượng", [["standard", "Tiêu chuẩn (standard)"], ["hd", "Cao (hd)"]], { hint: "Chất lượng ảnh xuất ra (mặc định standard)", fallback: "standard" })}
          {text("n", "Số lượng ảnh", "Số ảnh tạo trong một yêu cầu (mặc định 1)", "1", { type: "number" })}
          {pick("responseFormat", "Định dạng phản hồi", [["url", "url"], ["b64_json", "b64_json"]], { hint: "Cách trả về ảnh: url hoặc b64_json (mặc định url)", fallback: "url" })}
          {text("outputFormat", "Định dạng ảnh", "Định dạng output: png, jpg, webp (để trống: theo model)", "png, jpg, webp")}
          {text("background", "Nền ảnh", "Nền ảnh: transparent, opaque (để trống: theo model)", "transparent, opaque")}
        </>
      )
    case "api_call":
    case "webhook":
      return (
        <>
          {pick("method", "Phương thức", ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => [m, m]), { hint: "Phương thức HTTP request", required: true, fallback: "POST" })}
          {text("url", "URL", "URL endpoint đầy đủ", "https://api.example.com/endpoint", { required: true, mono: true })}
          {pick("requestType", "Loại Request", [["json", "JSON"], ["form_params", "Form Data"], ["multipart", "Multipart"]], { hint: "Content-Type cho body request", fallback: "json" })}
          {pick("responseFormat", "Định dạng Response", [["json", "JSON"], ["text", "Text"], ["base64", "Base64"]], { hint: "Định dạng response mong đợi", fallback: "json" })}
          {textarea("headers", "Headers", "Headers request tùy chọn", "Authorization: Bearer {{ .token }}", { mono: true })}
          {textarea("payload", "Payload", "Dữ liệu body request", '{ "id": "{{ .workflowData.id }}" }', { mono: true })}
        </>
      )
    case "user_operation": {
      const action = v("action") || "get"
      return (
        <>
          {pick("action", "Hành động", [["get_list", "Lấy danh sách"], ["get", "Lấy một"]], { hint: "Thao tác người dùng cần thực hiện", required: true, fallback: "get" })}
          {action === "get" ? text("userId", "ID Người dùng", undefined, "Nhập ID người dùng", { required: true, mono: true }) : textarea("query", "Truy vấn (JSON)", "Tham số lọc để liệt kê người dùng", '{\n  "teamId": ""\n}', { mono: true })}
        </>
      )
    }
    case "notification":
      return (
        <>
          {pick("notificationType", "Loại thông báo", [["general", "Chung"], ["active_table", "Active Table"], ["work_group", "Work Group"], ["workflow_connector", "Workflow Connector"], ["workflow_form", "Workflow Form"], ["workflow_unit", "Workflow Unit"]], { hint: "Chọn ngữ cảnh thông báo cho bước này", required: true, fallback: "general" })}
          {text("title", "Tiêu đề thông báo", "Tiêu đề hiển thị cho người nhận. Hỗ trợ biến workflow.", "Đơn hàng {record.code} đã được duyệt", { required: true })}
          {textarea("message", "Nội dung thông báo", "Nội dung chính của thông báo. Hỗ trợ biến workflow.", "Người dùng {user.name} vừa tạo đơn hàng mới.", { required: true })}
          {textarea("metaContents", "Thông tin phụ", "Các dòng thông tin bổ sung hiển thị kèm thông báo.", "Ví dụ: Tổng tiền: record.total_amount")}
          {textarea("target", "Mục tiêu điều hướng", "JSON điều hướng. Có thể chèn biến vào các giá trị chuỗi.", '{ "type": "record", "id": "{{ .workflowData.id }}" }', { mono: true })}
          {text("recipientUserIds", "Người nhận", "Chọn người dùng trực tiếp hoặc nhập biểu thức biến workflow.", "Chọn người dùng trong workspace")}
          {text("taggedUserIds", "Nhắc tên", "Danh sách người dùng được nhắc trong thông báo.", "Chọn người dùng trong workspace")}
          {text("labelIds", "Nhãn thông báo", "Nhãn dùng để phân loại thông báo.", "Chọn nhãn thông báo")}
        </>
      )
    case "toast_notification":
      return (
        <>
          {text("title", "Tiêu đề", "Tiêu đề của thông báo nổi (không bắt buộc)", "Thành công")}
          {textarea("message", "Nội dung", "Nội dung của thông báo nổi (bắt buộc)", "Dữ liệu đã được xử lý", { required: true })}
          {pick("variant", "Loại", [["success", "Thành công"], ["info", "Thông tin"], ["warning", "Cảnh báo"], ["error", "Lỗi"]], { hint: "Kiểu hiển thị của thông báo nổi", required: true, fallback: "success" })}
        </>
      )
    case "dock_message":
      return (
        <>
          {text("title", "Tiêu đề", "Tiêu đề của dock (không bắt buộc)", "Công việc")}
          {textarea("message", "Nội dung", "Nội dung trạng thái hiển thị trên dock (không bắt buộc)", "Đang xử lý yêu cầu của bạn, vui lòng chờ trong giây lát...")}
          {pick("dockType", "Loại", [["info", "Thông tin"], ["success", "Thành công"], ["warning", "Cảnh báo"], ["error", "Lỗi"]], { hint: "Màu và trạng thái ngữ nghĩa của dock", fallback: "info" })}
          {pick("icon", "Biểu tượng", [["none", "Không có"], ["loading", "Đang xử lý"], ["retrying", "Đang thử lại"], ["failed", "Thất bại"], ["success", "Thành công"]], { hint: "Biểu tượng trạng thái hiển thị cạnh tiêu đề", fallback: "none" })}
          {text("progress", "Tiến trình (%)", "Giá trị tiến trình từ 0 đến 100", "0", { type: "number" })}
          {text("hideAfter", "Tự ẩn sau (ms)", "Để trống để giữ dock đến khi có node đóng dock", "3000", { type: "number" })}
        </>
      )
    case "delay":
      return (
        <>
          {text("durationValue", "Thời lượng", "Giá trị thời gian chờ", "1", { required: true, type: "number" })}
          {pick("durationUnit", "Đơn vị", [["minutes", "Phút"], ["hours", "Giờ"], ["days", "Ngày"], ["weeks", "Tuần"], ["months", "Tháng"]], { hint: "Đơn vị thời gian", required: true, fallback: "minutes" })}
          {text("targetTime", "Thời gian mục tiêu (Tùy chọn)", "Hết thời lượng thì đợi tới giờ này trong ngày rồi mới chạy tiếp", undefined, { type: "time" })}
        </>
      )
    case "log":
      return (
        <>
          {textarea("message", "Thông điệp", "Thông điệp log với hỗ trợ biến", "Processing order {{ .trigger.order_id }}...", { required: true })}
          {pick("level", "Mức độ", [["debug", "Debug"], ["info", "Info"], ["warning", "Cảnh báo"], ["error", "Lỗi"]], { hint: "Mức độ nghiêm trọng log", required: true, fallback: "info" })}
          {textarea("context", "Ngữ cảnh", "Dữ liệu bổ sung đính kèm log", '{ "orderId": "{{ .trigger.order_id }}" }', { mono: true })}
        </>
      )
    case "condition": {
      // Seed / older configs only carry `expression`, so they open in the advanced mode.
      const mode = v("mode") || (c.expression ? "advanced" : "simple")
      return (
        <>
          <Row label="Chế độ">
            <Pick value={mode} onChange={(val) => set("mode", val)}><option value="simple">Đơn giản</option><option value="advanced">Biểu thức</option></Pick>
          </Row>
          {mode === "simple" ? (
            <>
              {pick("operator", "Toán tử", [["equals", "Bằng (==)"], ["not_equals", "Không bằng (!=)"], ["greater_than", "Lớn hơn (>)"], ["less_than", "Nhỏ hơn (<)"], ["greater_equal", "Lớn hơn hoặc bằng (>=)"], ["less_equal", "Nhỏ hơn hoặc bằng (<=)"], ["contains", "Chứa"], ["not_contains", "Không chứa"], ["starts_with", "Bắt đầu bằng"], ["ends_with", "Kết thúc bằng"], ["is_empty", "Rỗng"], ["is_not_empty", "Không rỗng"]], { hint: "Loại so sánh", required: true, fallback: "equals" })}
              {text("left", "Toán hạng trái", undefined, "{{ .trigger.status }}", { required: true, mono: true })}
              {!NO_RIGHT.has(v("operator")) && text("right", "Toán hạng phải", "Giá trị để so sánh với", "active", { required: true, mono: true })}
            </>
          ) : (
            textarea("expression", "Biểu thức", "Biểu thức boolean tùy chỉnh", "{{ .trigger.amount }} > 100 && {{ .trigger.status }} == 'pending'", { required: true, mono: true })
          )}
        </>
      )
    }
    case "loop":
      return (
        <>
          {text("items", "Bộ sưu tập", "Mảng cần lặp qua", "{{ .trigger.items }}", { required: true, mono: true })}
          {text("iterator", "Biến lặp", "Biến phần tử hiện tại", "item", { required: true, mono: true })}
          {text("maxIterations", "Số lần lặp tối đa", "Giới hạn (0 = tất cả)", "1000", { type: "number" })}
        </>
      )
    case "loop_control":
      return pick("action", "Hành động", [["break", "Dừng vòng lặp (break)"], ["continue", "Bỏ qua lượt hiện tại (continue)"]], { required: true, fallback: "break" })
    case "math": {
      const op = v("operation") || "add"
      return (
        <>
          {pick("operation", "Phép tính", [["add", "Cộng (+)"], ["subtract", "Trừ (-)"], ["multiply", "Nhân (*)"], ["divide", "Chia (/)"], ["modulo", "Chia lấy dư (%)"], ["power", "Lũy thừa (^)"], ["min", "Giá trị nhỏ nhất"], ["max", "Giá trị lớn nhất"], ["abs", "Giá trị tuyệt đối"], ["round", "Làm tròn"], ["floor", "Làm tròn xuống"], ["ceil", "Làm tròn lên"], ["sqrt", "Căn bậc hai"], ["log", "Logarit"], ["exp", "Mũ tự nhiên"], ["negate", "Đảo dấu"]], { hint: "Phép tính toán học cần thực hiện", required: true, fallback: "add" })}
          {text("operandA", UNARY_MATH.has(op) ? "Toán hạng" : "Toán hạng thứ nhất", "Giá trị số hoặc tham chiếu biến", "{{ .trigger.quantity }}", { required: true, mono: true })}
          {!UNARY_MATH.has(op) && text("operandB", "Toán hạng thứ hai", "Giá trị số hoặc tham chiếu biến", "{{ .trigger.price }}", { required: true, mono: true })}
          {text("precision", "Độ chính xác thập phân", "Số chữ số thập phân trong kết quả", "2", { type: "number" })}
        </>
      )
    }
    case "definition": {
      const dataType = v("dataType") || "object"
      const vars = (Array.isArray(c.variables) ? c.variables : []) as { name: string; value: string }[]
      const put = (next: typeof vars) => set("variables", next)
      return (
        <>
          {pick("dataType", "Kiểu dữ liệu", [["object", "Đối tượng (khóa → giá trị)"], ["collection", "Mảng (collection)"]], { hint: "Đối tượng trả về cặp khóa → giá trị; mảng trả về danh sách phần tử theo schema trường", fallback: "object" })}
          {dataType === "collection" ? (
            textarea("collectionSchema", "Schema trường", "Tên các trường mà mỗi phần tử trong mảng sẽ có (mỗi dòng một trường)", "field_name", { required: true, mono: true })
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Biến</p>
              {vars.map((x, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-1.5">
                  <Input value={x.name} placeholder="khóa" className="font-mono" onChange={(e) => put(vars.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
                  <Input value={x.value} placeholder="giá trị / biểu thức" onChange={(e) => put(vars.map((y, j) => (j === i ? { ...y, value: e.target.value } : y)))} />
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá biến" onClick={() => put(vars.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => put([...vars, { name: "", value: "" }])}><Plus />Thêm biến</Button>
            </div>
          )}
        </>
      )
    }
    case "object_lookup":
      return (
        <>
          {text("object", "Đối tượng", "Đối tượng nguồn cần tra cứu", "{{ .trigger.data }}", { required: true, mono: true })}
          {text("key", "Đường dẫn khóa", "Đường dẫn theo ký hiệu dấu chấm, vd: user.profile.name", "user.profile.name", { required: true, mono: true })}
          {text("default", "Giá trị mặc định", "Giá trị sử dụng nếu không tìm thấy đường dẫn", "null", { mono: true })}
        </>
      )
    case "collection_union": {
      const mode = v("outputMode") || "simple"
      return (
        <>
          {pick("outputMode", "Kiểu kết quả", [["simple", "Đơn giản (gộp trực tiếp)"], ["mapping", "Ánh xạ (chuẩn hóa theo schema)"]], { hint: "Đơn giản: gộp trực tiếp các mảng. Ánh xạ: chuẩn hóa mỗi nguồn theo một schema chung.", fallback: "simple" })}
          {textarea("collections", "Danh sách mảng", "Các biểu thức trả về mảng sẽ được hợp nhất thành một (mỗi dòng một mảng)", "{{ .table_operation_1 }}", { required: true, mono: true })}
          {mode === "mapping" && textarea("schema", "Cấu trúc kết quả", "Tên các trường của kết quả hợp nhất; mỗi nguồn sẽ ánh xạ giá trị vào các trường này", "field_name", { required: true, mono: true })}
          {text("distinctFields", "Trường loại trùng", "Đường dẫn trường dùng để loại bỏ bản ghi trùng lặp trong kết quả hợp nhất", "id", { mono: true })}
        </>
      )
    }
    case "validation":
      return textarea("rules", "Quy tắc", "Mỗi dòng một điều kiện phải đúng, vd {{ .order.total }} > 0", undefined, { mono: true })
    case "stop_with_error":
      return (
        <>
          {textarea("message", "Thông điệp lỗi", "Thông điệp được trả về khi workflow dừng lại.", "Record is not allowed.", { required: true })}
          {textarea("errors", "Lỗi theo trường", "Ánh xạ tên trường với thông điệp lỗi tương ứng.", '{ "email": "Email không hợp lệ" }', { mono: true })}
        </>
      )
    case "state_init":
      return (
        <>
          <Row label="Loại state" hint="Đổi loại sẽ xoá giá trị khởi tạo hiện tại." required>
            <Pick value={v("stateType") || "number"} onChange={(val) => onChange({ ...c, stateType: val, initialValue: "" })}>
              <option value="number">Số</option><option value="string">Chuỗi</option><option value="array">Mảng</option><option value="object">Đối tượng</option><option value="boolean">Đúng/Sai</option>
            </Pick>
          </Row>
          {text("initialValue", "Giá trị khởi tạo", `Các bước sau đọc giá trị mới nhất qua {{ .state.${step.id} }}`, undefined, { mono: true })}
        </>
      )
    case "state_update": {
      const inits = steps.filter((s) => s.type === "state_init")
      const action = v("action")
      return (
        <>
          {pick("stateRef", "State cần cập nhật", inits.map((s) => [s.id, `${s.name} (${s.id})`]), { required: true, placeholder: "counter", hint: !inits.length ? "Chưa có node Khởi tạo state nào." : undefined })}
          {pick("action", "Hành động", STATE_ACTIONS.map(([k, l]) => [k, `${l} (${k})`]), { required: true, placeholder: "Chọn hành động" })}
          {action === "set_key" && text("key", "Tên key", undefined, undefined, { mono: true })}
          {action && !NO_VALUE.has(action) && text("value", action === "set_key" ? "Giá trị của key" : "Giá trị", undefined, undefined, { mono: true })}
        </>
      )
    }
    default: {
      const actions = INTEGRATION_ACTIONS[ACTION_KEY[step.type] ?? step.type]
      if (!actions) return null
      const service = SERVICE_NAME[step.type]
      return (
        <>
          {connector("Kết nối", "Chọn hoặc tạo kết nối", true)}
          {pick("action", service ? `Hành động ${service}` : "Hành động", actions, { hint: service ? `Chọn thao tác sẽ thực hiện với ${service}` : "Loại hành động cần thực hiện", required: true, fallback: actions[0][0] })}
          {step.type.endsWith("_chat") || step.type === "facebook_page_messaging" ? (
            <>
              {text(step.type === "facebook_page_messaging" ? "recipientId" : "conversationId", step.type === "facebook_page_messaging" ? "Người nhận (PSID)" : "ID hội thoại", undefined, undefined, { required: true, mono: true })}
              {textarea("message", "Nội dung tin nhắn", undefined, "Xin chào từ workflow", { required: true })}
            </>
          ) : (
            textarea("params", "Tham số", "JSON tham số cho thao tác đã chọn; hỗ trợ biến", undefined, { mono: true })
          )}
        </>
      )
    }
  }
}
