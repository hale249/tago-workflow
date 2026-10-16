import type { RecordValue, TableField, WorkspaceUser } from "../types/table"
import { isMulti, slugify } from "./fields"

/**
 * Excel import helpers. The xlsx libraries are loaded on demand (dynamic import) so they
 * stay out of the records page chunk until someone actually reads or writes a file.
 */

export type Cell = string | number | boolean | Date | null
/** One data row of the sheet; `line` is the 1-based Excel row number (header = 1). */
export type SheetRow = { line: number; cells: Cell[] }
export type SheetRows = { headers: string[]; rows: SheetRow[] }

export const XLSX_ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
export const MAX_FILE_BYTES = 100 * 1024 * 1024
/** Column added to error reports; skipped automatically when the report is imported again. */
export const ERROR_COLUMN = "error"

export class ExcelImportError extends Error {}

const pad = (n: number) => String(n).padStart(2, "0")

/** Excel column letter: 0 → A, 25 → Z, 26 → AA. */
export function columnLetter(i: number) {
  let s = ""
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

// Excel cells carry no timezone: read-excel-file returns them as UTC dates holding the wall-clock value.
const hasTime = (d: Date) => d.getUTCHours() + d.getUTCMinutes() + d.getUTCSeconds() > 0

export function cellText(c: Cell | undefined): string {
  if (c === null || c === undefined) return ""
  if (c instanceof Date) {
    const date = `${pad(c.getUTCDate())}/${pad(c.getUTCMonth() + 1)}/${c.getUTCFullYear()}`
    return hasTime(c) ? `${date} ${pad(c.getUTCHours())}:${pad(c.getUTCMinutes())}` : date
  }
  if (typeof c === "boolean") return c ? "TRUE" : "FALSE"
  return String(c)
}

const isEmptyCell = (c: Cell | undefined) => c === null || c === undefined || (typeof c === "string" && !c.trim())

/** Reads the first sheet: first row = column headers, fully empty rows dropped. */
export async function readFirstSheet(file: File): Promise<SheetRows> {
  if (file.size > MAX_FILE_BYTES) throw new ExcelImportError("File lớn hơn 100 MB. Hãy chia nhỏ file rồi nhập từng phần.")
  let data: Cell[][]
  try {
    const { readSheet } = await import("read-excel-file/browser")
    data = (await readSheet(file)) as unknown as Cell[][]
  } catch {
    throw new ExcelImportError("Không đọc được file. Hãy chọn file .xlsx hợp lệ.")
  }
  const [head = [], ...body] = data
  const headers = head.map((c) => cellText(c).trim())
  if (!headers.some(Boolean)) throw new ExcelImportError("Dòng đầu tiên của file đang trống. Hãy thêm tiêu đề cột.")
  const rows = body.map((cells, i) => ({ line: i + 2, cells })).filter((r) => r.cells.some((c) => !isEmptyCell(c)))
  // Keep every headed column, plus unheaded ones that actually hold data.
  const width = Math.max(headers.length, ...rows.map((r) => r.cells.length))
  const keep = Array.from({ length: width }, (_, i) => i).filter((i) => headers[i] || rows.some((r) => !isEmptyCell(r.cells[i])))
  return {
    headers: keep.map((i) => headers[i] ?? ""),
    rows: rows.map((r) => ({ line: r.line, cells: keep.map((i) => r.cells[i] ?? null) })),
  }
}

async function saveXlsx(rows: Cell[][], fileName: string, widths?: number[]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser")
  const [head = [], ...body] = rows
  const data = [head.map((value) => ({ value: cellText(value), fontWeight: "bold" as const })), ...body]
  await writeXlsxFile(data, { stickyRowsCount: 1, columns: widths?.map((width) => ({ width })), dateFormat: "dd/mm/yyyy" }).toFile(fileName)
}

/** Empty workbook whose header row is the table's fields (auto-generated codes are issued by the system). */
export function downloadTemplate(tableName: string, fields: TableField[]) {
  const cols = fields.filter((f) => f.type !== "AUTO_GENERATED_CODE")
  return saveXlsx([cols.map((f) => f.label)], `${tableName} - mẫu nhập.xlsx`, cols.map((f) => Math.max(14, f.label.length + 4)))
}

/** The failed rows as they were in the file, with the reason in a trailing `error` column. */
export function downloadErrorReport(fileName: string, headers: string[], rows: { cells: Cell[]; message: string }[]) {
  const base = fileName.replace(/\.xlsx$/i, "")
  return saveXlsx([[...headers, ERROR_COLUMN], ...rows.map((r) => [...headers.map((_, i) => r.cells[i] ?? null), r.message])], `${base} - lỗi.xlsx`)
}

/** Header → field name ("" = skip), matching labels and field codes accent/case-insensitively. */
export function autoMatch(headers: string[], fields: TableField[]): string[] {
  const used = new Set<string>()
  return headers.map((h) => {
    const key = slugify(h)
    if (!key || key === ERROR_COLUMN) return ""
    const f = fields.find((x) => !used.has(x.name) && (slugify(x.label) === key || slugify(x.name) === key))
    if (!f) return ""
    used.add(f.name)
    return f.name
  })
}

// ---------- value coercion ----------

export type CoerceContext = {
  users: WorkspaceUser[]
  /** referenceTableId → normalised record label (or id) → record id */
  recordIds: Record<string, Map<string, string>>
}
export type Coerced = { ok: true; value: RecordValue } | { ok: false; error: string }

export const normKey = (s: string) => s.normalize("NFC").trim().toLowerCase()
const ok = (value: RecordValue): Coerced => ({ ok: true, value })
const fail = (error: string): Coerced => ({ ok: false, error })
const splitList = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)

/** "1.234.567,5" / "1,234,567.5" / "12,5" / "12.5" / "1 000 đ" → number. */
function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s ]/g, "").replace(/[^\d.,+-]/g, "")
  if (!/\d/.test(s)) return null
  const lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",")
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? "." : ","
    s = s.split(dec === "." ? "," : ".").join("").replace(",", ".")
  } else if (lastComma >= 0) {
    s = /^[+-]?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".")
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, "")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

type Parts = [y: number, m: number, d: number, h: number, min: number, sec: number]

function dateParts(c: Cell): Parts | null {
  if (c instanceof Date) return [c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate(), c.getUTCHours(), c.getUTCMinutes(), c.getUTCSeconds()]
  if (typeof c === "number") return dateParts(new Date(Math.round((c - 25569) * 86400000))) // Excel serial date
  const s = String(c).trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  const vi = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  const p = iso ? [iso[1], iso[2], iso[3], iso[4], iso[5], iso[6]] : vi ? [vi[3], vi[2], vi[1], vi[4], vi[5], vi[6]] : null
  if (!p) return null
  const [y, m, d, h, min, sec] = p.map((x) => Number(x ?? 0)) as Parts
  const check = new Date(Date.UTC(y, m - 1, d))
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || h > 23 || min > 59 || sec > 59) return null
  return [y, m, d, h, min, sec]
}

const YES = ["có", "co", "yes", "y", "true", "1", "x", "đúng", "dung"]
const NO = ["không", "khong", "no", "n", "false", "0", "sai"]

/** Converts one Excel cell into the value a field stores. Blank cells return null (= leave as default). */
export function coerceCell(field: TableField, cell: Cell, ctx: CoerceContext): Coerced | null {
  if (isEmptyCell(cell)) return null
  const text = cellText(cell).trim()
  switch (field.type) {
    case "NUMERIC": {
      const n = typeof cell === "number" ? cell : parseNumber(text)
      return n === null ? fail(`“${text}” không phải số`) : ok(n)
    }
    case "DATE":
    case "DATETIME": {
      const p = dateParts(cell)
      if (!p) return fail(`“${text}” không phải ngày hợp lệ`)
      const [y, m, d, h, min, sec] = p
      return field.type === "DATE" ? ok(`${y}-${pad(m)}-${pad(d)}`) : ok(new Date(y, m - 1, d, h, min, sec).toISOString())
    }
    case "CHECKBOX_YES_NO": {
      if (typeof cell === "boolean") return ok(cell)
      const k = normKey(text)
      return YES.includes(k) ? ok(true) : NO.includes(k) ? ok(false) : fail(`“${text}” không phải Có/Không`)
    }
    case "SELECT_ONE":
    case "SELECT_LIST": {
      const values: string[] = []
      for (const part of field.type === "SELECT_LIST" ? splitList(text) : [text]) {
        const o = field.options?.find((x) => normKey(x.text) === normKey(part) || normKey(x.value) === normKey(part))
        if (!o) return fail(`Không có lựa chọn “${part}”`)
        values.push(o.value)
      }
      return ok(isMulti(field.type) ? values : values[0] ?? "")
    }
    case "SELECT_ONE_WORKSPACE_USER":
    case "SELECT_LIST_WORKSPACE_USER": {
      const ids: string[] = []
      for (const part of isMulti(field.type) ? splitList(text) : [text]) {
        const u = ctx.users.find((x) => x.id === part || normKey(x.fullName) === normKey(part))
        if (!u) return fail(`Không tìm thấy người dùng “${part}”`)
        ids.push(u.id)
      }
      return ok(isMulti(field.type) ? ids : ids[0] ?? "")
    }
    case "SELECT_ONE_RECORD": {
      const id = field.referenceTableId ? ctx.recordIds[field.referenceTableId]?.get(normKey(text)) : undefined
      return id ? ok(id) : fail(`Không tìm thấy bản ghi “${text}”`)
    }
    default:
      return ok(text)
  }
}
