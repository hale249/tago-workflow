import type { FieldOption, FieldType, ItemsConfig, RecordData, RecordValue, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { evaluateExpression } from "./formula"
import { htmlToText } from "./rich-text"

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const nowIso = () => new Date().toISOString()

export const FIELD_GROUPS = [
  "Các trường văn bản",
  "Các trường tệp tin",
  "Các trường thời gian",
  "Các trường số",
  "Các trường lựa chọn",
  "Các trường tham chiếu",
  "Các trường người dùng",
] as const

type FieldGroup = (typeof FIELD_GROUPS)[number]

/** Picker entries — order, labels and descriptions as in the reference. TEXTAREA (legacy alias of TEXT) is not offered. */
export const FIELD_TYPES: { type: FieldType; label: string; group: FieldGroup; description: string }[] = [
  { type: "SHORT_TEXT", label: "Văn bản ngắn", group: "Các trường văn bản", description: "Trường một dòng cho nội dung ngắn như tên, mã hoặc tiêu đề" },
  { type: "TEXT", label: "Văn bản dài", group: "Các trường văn bản", description: "Trường nhiều dòng phù hợp cho mô tả hoặc ghi chú dài" },
  { type: "RICH_TEXT", label: "Văn bản có định dạng", group: "Các trường văn bản", description: "Trường soạn thảo có hỗ trợ định dạng, liên kết và nội dung phong phú" },
  { type: "PHONE", label: "Số điện thoại", group: "Các trường văn bản", description: "Lưu số điện thoại đã được làm sạch để hỗ trợ kiểm tra dữ liệu và tìm kiếm theo đầu hoặc đuôi số" },
  { type: "EMAIL", label: "Email", group: "Các trường văn bản", description: "Lưu địa chỉ email và hỗ trợ kiểm tra định dạng cơ bản" },
  { type: "URL", label: "URL", group: "Các trường văn bản", description: "Lưu liên kết website hoặc tài nguyên trực tuyến" },
  { type: "AUTO_GENERATED_CODE", label: "Mã tự sinh", group: "Các trường văn bản", description: "Tự động sinh mã theo template định sẵn với biến thời gian hoặc bộ đếm" },
  { type: "ATTACHMENT", label: "Tệp đính kèm", group: "Các trường tệp tin", description: "Đính kèm và quản lý tệp trong bản ghi" },
  { type: "DATE", label: "Ngày", group: "Các trường thời gian", description: "Lưu ngày theo lịch mà không bao gồm thời gian" },
  { type: "DATETIME", label: "Ngày & giờ", group: "Các trường thời gian", description: "Lưu đầy đủ ngày và thời gian trong cùng một trường" },
  { type: "TIME", label: "Giờ", group: "Các trường thời gian", description: "Lưu thời gian trong ngày mà không có ngày tháng" },
  { type: "YEAR", label: "Năm", group: "Các trường thời gian", description: "Lưu riêng một giá trị năm" },
  { type: "MONTH", label: "Tháng", group: "Các trường thời gian", description: "Lưu riêng giá trị tháng" },
  { type: "DAY", label: "Ngày trong tháng", group: "Các trường thời gian", description: "Lưu riêng giá trị ngày trong tháng" },
  { type: "HOUR", label: "Giờ", group: "Các trường thời gian", description: "Lưu riêng giá trị giờ" },
  { type: "MINUTE", label: "Phút", group: "Các trường thời gian", description: "Lưu riêng giá trị phút" },
  { type: "SECOND", label: "Giây", group: "Các trường thời gian", description: "Lưu riêng giá trị giây" },
  { type: "INTEGER", label: "Số nguyên", group: "Các trường số", description: "Lưu số nguyên không có phần thập phân" },
  { type: "NUMERIC", label: "Số thập phân", group: "Các trường số", description: "Lưu số có phần thập phân cho tiền tệ, tỷ lệ hoặc số đo" },
  { type: "NUMERIC_SUMMARY", label: "Số tự tính", group: "Các trường số", description: "Trường số được tính tự động, hiển thị chỉ đọc trong form nhưng vẫn được lưu và gửi khi submit" },
  { type: "CHECKBOX_YES_NO", label: "Có/Không", group: "Các trường lựa chọn", description: "Lựa chọn nhị phân đơn giản giữa có và không" },
  { type: "CHECKBOX_ONE", label: "Một ô chọn", group: "Các trường lựa chọn", description: "Ô chọn đơn để bật hoặc tắt một trạng thái" },
  { type: "CHECKBOX_LIST", label: "Nhiều ô chọn", group: "Các trường lựa chọn", description: "Cho phép chọn nhiều giá trị từ danh sách ô chọn" },
  { type: "SELECT_ONE", label: "Chọn một", group: "Các trường lựa chọn", description: "Chọn một giá trị từ danh sách tùy chọn" },
  { type: "SELECT_LIST", label: "Chọn nhiều", group: "Các trường lựa chọn", description: "Chọn nhiều giá trị từ danh sách tùy chọn" },
  { type: "SELECT_ONE_RECORD", label: "Tham chiếu một bản ghi", group: "Các trường tham chiếu", description: "Liên kết đến một bản ghi từ bảng khác" },
  { type: "SELECT_LIST_RECORD", label: "Tham chiếu nhiều bản ghi", group: "Các trường tham chiếu", description: "Liên kết đến nhiều bản ghi từ bảng khác" },
  { type: "FIRST_REFERENCE_RECORD", label: "Bản ghi tham chiếu đầu tiên", group: "Các trường tham chiếu", description: "Hiển thị bản ghi đầu tiên tham chiếu ngược về bản ghi hiện tại" },
  { type: "SELECT_ONE_WORKSPACE_USER", label: "Một người dùng", group: "Các trường người dùng", description: "Chọn một thành viên trong workspace" },
  { type: "SELECT_LIST_WORKSPACE_USER", label: "Nhiều người dùng", group: "Các trường người dùng", description: "Chọn nhiều thành viên trong workspace" },
]

export const fieldTypeLabel = (t: FieldType) => FIELD_TYPES.find((f) => f.type === (t === "TEXTAREA" ? "TEXT" : t))?.label ?? t

/** Values stored as string[]. */
export const isMulti = (t: FieldType) =>
  t === "SELECT_LIST" || t === "SELECT_LIST_WORKSPACE_USER" || t === "SELECT_LIST_RECORD" || t === "CHECKBOX_LIST" || t === "ATTACHMENT"
/** Fields whose values form a finite set — usable as kanban columns and dropdown filters. */
export const isGroupable = (t: FieldType) => t === "SELECT_ONE" || t === "SELECT_ONE_WORKSPACE_USER" || t === "CHECKBOX_YES_NO"
export const isTextual = (t: FieldType) => ["SHORT_TEXT", "TEXT", "TEXTAREA", "RICH_TEXT", "EMAIL", "PHONE", "URL", "AUTO_GENERATED_CODE"].includes(t)
/** Multi-line text — shown full width in forms and stacked in the detail view. */
export const isLongText = (t: FieldType) => t === "TEXT" || t === "TEXTAREA" || t === "RICH_TEXT"
/** Number fields usable in totals, gantt progress, pivots and objective cards. */
export const isNumber = (t: FieldType) => t === "INTEGER" || t === "NUMERIC" || t === "NUMERIC_SUMMARY"
/** Field types configured with an options list. */
export const hasOptions = (t: FieldType) => t === "SELECT_ONE" || t === "SELECT_LIST" || t === "CHECKBOX_ONE" || t === "CHECKBOX_LIST"
/** Values computed by the system — read-only in forms and inline editing. */
export const isComputed = (t: FieldType) => t === "AUTO_GENERATED_CODE" || t === "NUMERIC_SUMMARY" || t === "FIRST_REFERENCE_RECORD"
export const isRecordRef = (t: FieldType) => t === "SELECT_ONE_RECORD" || t === "SELECT_LIST_RECORD" || t === "FIRST_REFERENCE_RECORD"

/** Standalone date / time parts: integer value with an allowed range. */
export const TIME_PART_RANGE: Partial<Record<FieldType, [number, number]>> = {
  YEAR: [1, 9999],
  MONTH: [1, 12],
  DAY: [1, 31],
  HOUR: [0, 23],
  MINUTE: [0, 59],
  SECOND: [0, 59],
}
export const isTimePart = (t: FieldType) => t in TIME_PART_RANGE
/** Stored as number | null. */
export const isNumericValue = (t: FieldType) => isNumber(t) || isTimePart(t)
/** Values compared in time / numeric order by advanced filters. */
export const isOrdered = (t: FieldType) => isNumericValue(t) || t === "DATE" || t === "DATETIME" || t === "TIME"

export const formatTimePart = (t: FieldType, n: number) => (t === "YEAR" ? String(n) : String(n).padStart(2, "0"))

export const OPTION_COLORS = [
  { textColor: "#0c4a6e", backgroundColor: "#e0f2fe" },
  { textColor: "#713f12", backgroundColor: "#fef9c3" },
  { textColor: "#14532d", backgroundColor: "#dcfce7" },
  { textColor: "#7f1d1d", backgroundColor: "#fee2e2" },
  { textColor: "#4c1d95", backgroundColor: "#ede9fe" },
  { textColor: "#7c2d12", backgroundColor: "#ffedd5" },
  { textColor: "#1f2937", backgroundColor: "#f3f4f6" },
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
  const d = field.defaultValue?.trim()
  if (field.type === "SELECT_LIST" || field.type === "CHECKBOX_LIST") return d ? d.split(",").map((x) => x.trim()).filter(Boolean) : []
  if (isMulti(field.type)) return []
  if (field.type === "CHECKBOX_YES_NO") return d === "true"
  if (field.type === "FIRST_REFERENCE_RECORD") return ""
  if (isNumericValue(field.type)) return d && Number.isFinite(Number(d)) ? Number(d) : null
  return field.defaultValue ?? ""
}

/** Recomputes every Số tự tính field of `record` in field order (later formulas may use earlier results). */
export function computeSummaries(fields: TableField[], record: RecordData): RecordData {
  const out = { ...record }
  for (const f of fields) {
    if (f.type !== "NUMERIC_SUMMARY") continue
    let v: number | null
    try {
      v = f.formula?.trim() ? evaluateExpression(f.formula, out) : null
      if (v != null && f.min != null) v = Math.max(f.min, v)
      if (v != null && f.max != null) v = Math.min(f.max, v)
      if (v != null && f.decimalPlaces != null) v = Number(v.toFixed(f.decimalPlaces))
    } catch {
      v = null
    }
    if (v == null && f.defaultValue?.trim() && Number.isFinite(Number(f.defaultValue))) v = Number(f.defaultValue)
    out[f.name] = v
  }
  return out
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
  ctx: { users: WorkspaceUser[]; recordLabel?: (tableId: string, id: string) => string; fileName?: (id: string) => string | undefined },
): string {
  if (isBlank(v)) return ""
  const list = Array.isArray(v) ? v : [v]
  switch (field.type) {
    case "SELECT_ONE":
    case "SELECT_LIST":
    case "CHECKBOX_ONE":
    case "CHECKBOX_LIST":
      return list.map((x) => field.options?.find((o) => o.value === x)?.text ?? String(x)).join(", ")
    case "SELECT_ONE_WORKSPACE_USER":
    case "SELECT_LIST_WORKSPACE_USER":
      return list.map((x) => ctx.users.find((u) => u.id === x)?.fullName ?? String(x)).join(", ")
    case "SELECT_ONE_RECORD":
    case "SELECT_LIST_RECORD":
    case "FIRST_REFERENCE_RECORD":
      return list.map((x) => (ctx.recordLabel && field.referenceTableId ? ctx.recordLabel(field.referenceTableId, String(x)) : String(x))).join(", ")
    case "ATTACHMENT":
      return ctx.fileName ? list.map((x) => ctx.fileName!(String(x)) ?? "").filter(Boolean).join(", ") : `${list.length} tệp`
    case "RICH_TEXT":
      return htmlToText(String(v))
    case "CHECKBOX_YES_NO":
      return v ? "Có" : "Không"
    case "INTEGER":
      return formatNumber(Number(v), 0, field.unit)
    case "YEAR":
    case "MONTH":
    case "DAY":
    case "HOUR":
    case "MINUTE":
    case "SECOND":
      return formatTimePart(field.type, Number(v))
    case "NUMERIC":
    case "NUMERIC_SUMMARY":
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
    if (isComputed(f.type)) continue
    if (f.required && isBlank(v)) {
      errors[f.name] = `${f.label} là bắt buộc`
      continue
    }
    if (isBlank(v)) continue
    if (f.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errors[f.name] = "Email không hợp lệ"
    if (f.type === "PHONE" && !/^[+\d][\d\s.-]{6,}$/.test(String(v))) errors[f.name] = "Số điện thoại không hợp lệ"
    if (f.type === "URL" && !/^https?:\/\/\S+$/.test(String(v))) errors[f.name] = "Đường dẫn phải bắt đầu bằng http(s)://"
    if (f.maxLength && isTextual(f.type)) {
      const len = (f.type === "RICH_TEXT" ? htmlToText(String(v)) : String(v)).length
      if (len > f.maxLength) errors[f.name] = `Tối đa ${f.maxLength} ký tự`
    }
    if (f.type === "NUMERIC" || f.type === "INTEGER") {
      const n = Number(v)
      if (Number.isNaN(n)) errors[f.name] = "Phải là số"
      else if (f.type === "INTEGER" && !Number.isInteger(n)) errors[f.name] = "Phải là số nguyên"
      else if (f.min != null && n < f.min) errors[f.name] = `Tối thiểu ${f.min}`
      else if (f.max != null && n > f.max) errors[f.name] = `Tối đa ${f.max}`
    }
    const range = TIME_PART_RANGE[f.type]
    if (range) {
      const n = Number(v)
      if (!Number.isInteger(n) || n < range[0] || n > range[1]) errors[f.name] = `Giá trị từ ${range[0]} đến ${range[1]}`
    }
    if (f.type === "TIME" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) errors[f.name] = "Giờ không hợp lệ (HH:mm)"
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
