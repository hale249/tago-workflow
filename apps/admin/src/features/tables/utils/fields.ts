import type { FieldOption, FieldType, ItemsConfig, RecordData, RecordValue, TableField, TableRecord, WorkspaceUser } from "../types/table"

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const nowIso = () => new Date().toISOString()

export const FIELD_GROUPS = ["Văn bản", "Thời gian", "Số", "Lựa chọn", "Tham chiếu", "Người dùng"] as const

export const FIELD_TYPES: { type: FieldType; label: string; group: (typeof FIELD_GROUPS)[number]; description: string }[] = [
  { type: "SHORT_TEXT", label: "Văn bản ngắn", group: "Văn bản", description: "Một dòng chữ: tên, tiêu đề, mã…" },
  { type: "RICH_TEXT", label: "Văn bản dài", group: "Văn bản", description: "Nhiều dòng, dùng cho ghi chú hoặc mô tả" },
  { type: "PHONE", label: "Số điện thoại", group: "Văn bản", description: "Kiểm tra định dạng số điện thoại khi nhập" },
  { type: "EMAIL", label: "Email", group: "Văn bản", description: "Địa chỉ email, có kiểm tra hợp lệ" },
  { type: "URL", label: "URL", group: "Văn bản", description: "Đường dẫn bắt đầu bằng http(s)://" },
  { type: "AUTO_GENERATED_CODE", label: "Mã tự sinh", group: "Văn bản", description: "Hệ thống tự cấp mã theo mẫu khi tạo bản ghi" },
  { type: "DATE", label: "Ngày", group: "Thời gian", description: "Chỉ ngày/tháng/năm" },
  { type: "DATETIME", label: "Ngày & giờ", group: "Thời gian", description: "Ngày kèm giờ phút" },
  { type: "NUMERIC", label: "Số", group: "Số", description: "Số nguyên hoặc thập phân, có đơn vị và giới hạn" },
  { type: "CHECKBOX_YES_NO", label: "Có/Không", group: "Lựa chọn", description: "Công tắc bật/tắt" },
  { type: "SELECT_ONE", label: "Chọn một", group: "Lựa chọn", description: "Chọn đúng một giá trị trong danh sách có màu" },
  { type: "SELECT_LIST", label: "Chọn nhiều", group: "Lựa chọn", description: "Chọn nhiều giá trị trong danh sách có màu" },
  { type: "SELECT_ONE_RECORD", label: "Tham chiếu một bản ghi", group: "Tham chiếu", description: "Liên kết tới một bản ghi của bảng khác" },
  { type: "SELECT_ONE_WORKSPACE_USER", label: "Một người dùng", group: "Người dùng", description: "Gán một thành viên workspace" },
  { type: "SELECT_LIST_WORKSPACE_USER", label: "Nhiều người dùng", group: "Người dùng", description: "Gán nhiều thành viên workspace" },
]

export const fieldTypeLabel = (t: FieldType) => FIELD_TYPES.find((f) => f.type === t)?.label ?? t

export const isMulti = (t: FieldType) => t === "SELECT_LIST" || t === "SELECT_LIST_WORKSPACE_USER"
/** Fields whose values form a finite set — usable as kanban columns and dropdown filters. */
export const isGroupable = (t: FieldType) => t === "SELECT_ONE" || t === "SELECT_ONE_WORKSPACE_USER" || t === "CHECKBOX_YES_NO"
export const isTextual = (t: FieldType) => ["SHORT_TEXT", "RICH_TEXT", "EMAIL", "PHONE", "URL", "AUTO_GENERATED_CODE"].includes(t)

export const OPTION_COLORS = [
  { textColor: "#0c4a6e", backgroundColor: "#e0f2fe" },
  { textColor: "#713f12", backgroundColor: "#fef9c3" },
  { textColor: "#14532d", backgroundColor: "#dcfce7" },
  { textColor: "#7f1d1d", backgroundColor: "#fee2e2" },
  { textColor: "#4c1d95", backgroundColor: "#ede9fe" },
  { textColor: "#7c2d12", backgroundColor: "#ffedd5" },
  { textColor: "#374151", backgroundColor: "#e5e7eb" },
  { textColor: "#831843", backgroundColor: "#fce7f3" },
]

export function makeOption(text: string, i: number, value?: string): FieldOption {
  return { text, value: value ?? slugify(text), ...OPTION_COLORS[i % OPTION_COLORS.length] }
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

/** Renders a code template: "KH{{auto.increment.padLeft(5,0)}}-{{date.yyyy}}". */
export function renderCodeTemplate(template: string, n: number, at = new Date()) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr: string) => {
    const pad = expr.match(/^auto\.increment(?:\.padLeft\((\d+)\s*,\s*(\w)\))?$/)
    if (pad) return pad[1] ? String(n).padStart(Number(pad[1]), pad[2]) : String(n)
    if (expr === "date.yyyy") return String(at.getFullYear())
    if (expr === "date.yy") return String(at.getFullYear()).slice(-2)
    if (expr === "date.mm") return String(at.getMonth() + 1).padStart(2, "0")
    if (expr === "date.dd") return String(at.getDate()).padStart(2, "0")
    return ""
  })
}

export function emptyValue(field: TableField): RecordValue {
  if (isMulti(field.type)) return []
  if (field.type === "CHECKBOX_YES_NO") return field.defaultValue === "true"
  if (field.type === "NUMERIC") return field.defaultValue ? Number(field.defaultValue) : null
  return field.defaultValue ?? ""
}

export const isBlank = (v: RecordValue | undefined) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)

const numberFmt = (decimals?: number | null) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: decimals ?? 2, minimumFractionDigits: decimals ?? 0 })
const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export const formatNumber = (v: number, decimals?: number | null, unit?: string | null) =>
  `${numberFmt(decimals).format(v)}${unit ? ` ${unit}` : ""}`

export function formatDateValue(v: string, withTime = false) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : (withTime ? dateTimeFmt : dateFmt).format(d)
}

/** Plain-text representation — used for search, sorting labels and CSV export. */
export function valueToText(
  field: TableField,
  v: RecordValue | undefined,
  ctx: { users: WorkspaceUser[]; recordLabel?: (tableId: string, id: string) => string },
): string {
  if (isBlank(v)) return ""
  const list = Array.isArray(v) ? v : [v]
  switch (field.type) {
    case "SELECT_ONE":
    case "SELECT_LIST":
      return list.map((x) => field.options?.find((o) => o.value === x)?.text ?? String(x)).join(", ")
    case "SELECT_ONE_WORKSPACE_USER":
    case "SELECT_LIST_WORKSPACE_USER":
      return list.map((x) => ctx.users.find((u) => u.id === x)?.fullName ?? String(x)).join(", ")
    case "SELECT_ONE_RECORD":
      return ctx.recordLabel && field.referenceTableId ? ctx.recordLabel(field.referenceTableId, String(v)) : String(v)
    case "CHECKBOX_YES_NO":
      return v ? "Có" : "Không"
    case "NUMERIC":
      return formatNumber(Number(v), field.decimalPlaces, field.unit)
    case "DATE":
      return formatDateValue(String(v))
    case "DATETIME":
      return formatDateValue(String(v), true)
    default:
      return String(v)
  }
}

export function validateRecord(fields: TableField[], data: RecordData): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const v = data[f.name]
    if (f.type === "AUTO_GENERATED_CODE") continue
    if (f.required && isBlank(v)) {
      errors[f.name] = `${f.label} là bắt buộc`
      continue
    }
    if (isBlank(v)) continue
    if (f.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errors[f.name] = "Email không hợp lệ"
    if (f.type === "PHONE" && !/^[+\d][\d\s.-]{6,}$/.test(String(v))) errors[f.name] = "Số điện thoại không hợp lệ"
    if (f.type === "URL" && !/^https?:\/\/\S+$/.test(String(v))) errors[f.name] = "Đường dẫn phải bắt đầu bằng http(s)://"
    if (f.type === "NUMERIC") {
      const n = Number(v)
      if (Number.isNaN(n)) errors[f.name] = "Phải là số"
      else if (f.min != null && n < f.min) errors[f.name] = `Tối thiểu ${f.min}`
      else if (f.max != null && n > f.max) errors[f.name] = `Tối đa ${f.max}`
    }
  }
  return errors
}

/** Evaluates a summary formula over records: COUNT(*), SUM(f), AVG(f), MIN(f), MAX(f). */
export function evaluateSummary(formula: string, records: TableRecord[]): number | null {
  const m = formula.trim().match(/^(COUNT|SUM|AVG|MIN|MAX)\(\s*([\w*]+)\s*\)$/i)
  if (!m) return null
  const fn = m[1].toUpperCase()
  if (fn === "COUNT") return m[2] === "*" ? records.length : records.filter((r) => !isBlank(r.record[m[2]])).length
  const all = records.map((r) => r.record[m[2]]).filter((v) => !isBlank(v)).map(Number).filter((n) => !Number.isNaN(n))
  if (fn === "SUM") return all.reduce((a, b) => a + b, 0)
  if (!all.length) return null
  if (fn === "AVG") return all.reduce((a, b) => a + b, 0) / all.length
  if (fn === "MIN") return Math.min(...all)
  return Math.max(...all)
}

/** Roll-up fields whose value is copied from the trigger record (only when a trigger record is set). */
export const pinnedSumsOf = (cfg: ItemsConfig, record: RecordData) =>
  cfg.enabled && cfg.autoInit?.enabled && record[cfg.autoInit.triggerField] ? cfg.autoInit.sumMappings.map((m) => m.target) : []
