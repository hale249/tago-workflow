import type { AdvancedCondition, DateRange, FilterOperator, RecordValue, TableField } from "../types/table"
import { isBlank } from "./fields"

export const OPERATORS: { op: FilterOperator; label: string }[] = [
  { op: "eq", label: "Bằng" },
  { op: "neq", label: "Không bằng" },
  { op: "gt", label: "Lớn hơn" },
  { op: "gte", label: "Lớn hơn hoặc bằng" },
  { op: "lt", label: "Nhỏ hơn" },
  { op: "lte", label: "Nhỏ hơn hoặc bằng" },
  { op: "in", label: "Nằm trong danh sách" },
  { op: "notIn", label: "Không nằm trong danh sách" },
  { op: "startsWith", label: "Bắt đầu bằng" },
]

/** Operators that make sense for a field type. */
export function operatorsFor(f: TableField): FilterOperator[] {
  if (f.type === "NUMERIC" || f.type === "DATE" || f.type === "DATETIME") return ["eq", "neq", "gt", "gte", "lt", "lte"]
  if (f.type === "CHECKBOX_YES_NO") return ["eq", "neq"]
  if (f.type.startsWith("SELECT_")) return ["eq", "neq", "in", "notIn"]
  return ["eq", "neq", "startsWith", "in", "notIn"]
}

/** `in` / `notIn` values are stored comma-separated. */
export const splitList = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean)

function compare(a: RecordValue | undefined, b: string, f: TableField): number {
  if (f.type === "NUMERIC") return Number(a ?? 0) - Number(b)
  if (f.type === "DATE" || f.type === "DATETIME") return Date.parse(String(a ?? "")) - Date.parse(b)
  return String(a ?? "").localeCompare(b, "vi")
}

export function matchCondition(f: TableField, v: RecordValue | undefined, c: AdvancedCondition): boolean {
  const values = Array.isArray(v) ? v.map(String) : isBlank(v) ? [] : [f.type === "CHECKBOX_YES_NO" ? String(Boolean(v)) : String(v)]
  const lower = (s: string) => s.toLowerCase()
  switch (c.op) {
    case "eq":
      return f.type === "NUMERIC" || f.type.startsWith("DATE") ? values.length > 0 && compare(v, c.value, f) === 0 : values.some((x) => lower(x) === lower(c.value))
    case "neq":
      return !(f.type === "NUMERIC" || f.type.startsWith("DATE") ? values.length > 0 && compare(v, c.value, f) === 0 : values.some((x) => lower(x) === lower(c.value)))
    case "gt": return values.length > 0 && compare(v, c.value, f) > 0
    case "gte": return values.length > 0 && compare(v, c.value, f) >= 0
    case "lt": return values.length > 0 && compare(v, c.value, f) < 0
    case "lte": return values.length > 0 && compare(v, c.value, f) <= 0
    case "in": return values.some((x) => splitList(c.value).includes(x))
    case "notIn": return !values.some((x) => splitList(c.value).includes(x))
    case "startsWith": return values.some((x) => lower(x).startsWith(lower(c.value)))
  }
}

export const DATE_PRESETS: { id: DateRange["preset"]; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "yesterday", label: "Hôm qua" },
  { id: "thisWeek", label: "Tuần này" },
  { id: "thisMonth", label: "Tháng này" },
  { id: "thisQuarter", label: "Quý này" },
  { id: "custom", label: "Tùy chọn" },
]

/** Resolves a preset to [from, to) in local time. */
export function rangeBounds(r: DateRange, now = new Date()): [number, number] {
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = 86_400_000
  switch (r.preset) {
    case "today": return [d0.getTime(), d0.getTime() + day]
    case "yesterday": return [d0.getTime() - day, d0.getTime()]
    case "thisWeek": {
      const start = d0.getTime() - ((d0.getDay() + 6) % 7) * day
      return [start, start + 7 * day]
    }
    case "thisMonth": return [new Date(now.getFullYear(), now.getMonth(), 1).getTime(), new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()]
    case "thisQuarter": {
      const q = Math.floor(now.getMonth() / 3) * 3
      return [new Date(now.getFullYear(), q, 1).getTime(), new Date(now.getFullYear(), q + 3, 1).getTime()]
    }
    case "custom": {
      const from = r.from ? new Date(r.from + "T00:00:00").getTime() : -Infinity
      const to = r.to ? new Date(r.to + "T00:00:00").getTime() + day : Infinity
      return [from, to]
    }
  }
}

export const rangeLabel = (r: DateRange) =>
  r.preset === "custom" ? `${r.from ?? "…"} → ${r.to ?? "…"}` : DATE_PRESETS.find((p) => p.id === r.preset)!.label
