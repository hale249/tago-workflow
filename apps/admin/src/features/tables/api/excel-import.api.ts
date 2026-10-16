import { useImportHistoryStore, type ImportStatus } from "../store/import-history.store"
import type { ActiveTable, RecordData, TableField } from "../types/table"
import { coerceCell, normKey, type Cell, type CoerceContext, type SheetRows } from "../utils/excel"
import { nowIso, uid } from "../utils/fields"
import { ApiError, lookupLabel, recordLabel, tablesApi } from "./tables.api"

export type ImportOptions = {
  /** Column index → field name ("" = skipped column). */
  mapping: string[]
  /** Unique field used to find existing records; with `update`, matching rows update instead of create. */
  identifier: string
  update: boolean
}
export type ImportRowError = { line: number; message: string; cells: Cell[] }
export type ImportResult = { total: number; created: number; updated: number; failed: number; errors: ImportRowError[]; status: ImportStatus }

/** Rows written concurrently. Each API call does its reads + write synchronously after its delay, so batches stay consistent. */
const BATCH = 10

/** Fields that can identify an existing record. */
export const identifierFields = (fields: TableField[]) => fields.filter((f) => f.isUnique || f.type === "AUTO_GENERATED_CODE")

async function coerceContext(fields: TableField[]): Promise<CoerceContext> {
  const users = await tablesApi.listUsers()
  const recordIds: CoerceContext["recordIds"] = {}
  for (const refId of new Set(fields.filter((f) => f.type === "SELECT_ONE_RECORD" && f.referenceTableId).map((f) => f.referenceTableId!))) {
    const m = new Map<string, string>()
    const ref = fields.find((f) => f.referenceTableId === refId)
    for (const r of await tablesApi.listRecords(refId)) {
      m.set(normKey(r.id), r.id)
      m.set(normKey(recordLabel(refId, r.id)), r.id)
      m.set(normKey(lookupLabel(refId, r.id, ref?.referenceLabelField).primary), r.id)
    }
    recordIds[refId] = m
  }
  return { users, recordIds }
}

function errorText(e: unknown, fields: TableField[]) {
  if (e instanceof ApiError && Object.keys(e.fieldErrors).length)
    return Object.entries(e.fieldErrors)
      .map(([name, msg]) => {
        const label = fields.find((f) => f.name === name)?.label ?? name
        return msg.includes(label) ? msg : `${label}: ${msg}`
      })
      .join("; ")
  return e instanceof Error ? e.message : "Không thể nhập dữ liệu. Vui lòng thử lại."
}

/** Creates (or updates, by identifier) one record per sheet row; per-row failures are collected, never thrown. */
export async function importSheet(
  table: ActiveTable,
  fileName: string,
  sheet: SheetRows,
  opts: ImportOptions,
  onProgress: (done: number, total: number) => void,
): Promise<ImportResult> {
  const fields = table.config.fields
  const cols = opts.mapping.map((name, i) => ({ i, field: fields.find((f) => f.name === name) })).filter((c): c is { i: number; field: TableField } => !!c.field)
  const ctx = await coerceContext(cols.map((c) => c.field))
  const existing = new Map<string, string>()
  const idField = opts.update ? fields.find((f) => f.name === opts.identifier) : undefined
  if (idField) for (const r of await tablesApi.listRecords(table.id)) existing.set(normKey(String(r.record[idField.name] ?? "")), r.id)

  const result: ImportResult = { total: sheet.rows.length, created: 0, updated: 0, failed: 0, errors: [], status: "completed" }
  const fail = (row: SheetRows["rows"][number], message: string) => {
    result.failed++
    result.errors.push({ line: row.line, message, cells: row.cells })
  }

  const importRow = async (row: SheetRows["rows"][number]) => {
    const data: RecordData = {}
    const problems: string[] = []
    for (const { i, field } of cols) {
      const v = coerceCell(field, row.cells[i] ?? null, ctx)
      if (!v) continue
      if (v.ok) data[field.name] = v.value
      else problems.push(`${field.label}: ${v.error}`)
    }
    if (problems.length) return fail(row, problems.join("; "))
    const key = idField ? normKey(String(data[idField.name] ?? "")) : ""
    const targetId = key ? existing.get(key) : undefined
    try {
      if (targetId) {
        await tablesApi.updateRecord(table.id, targetId, data)
        result.updated++
      } else {
        const r = await tablesApi.createRecord(table.id, data)
        if (idField) existing.set(normKey(String(r.record[idField.name] ?? "")), r.id)
        result.created++
      }
    } catch (e) {
      fail(row, errorText(e, fields))
    }
  }

  onProgress(0, result.total)
  for (let start = 0; start < sheet.rows.length; start += BATCH) {
    await Promise.all(sheet.rows.slice(start, start + BATCH).map(importRow))
    onProgress(Math.min(start + BATCH, result.total), result.total)
  }
  result.errors.sort((a, b) => a.line - b.line)
  if (result.created + result.updated === 0 && result.total > 0) result.status = "failed"
  recordHistory(table.id, fileName, result)
  return result
}

export function recordHistory(tableId: string, fileName: string, r: Pick<ImportResult, "total" | "created" | "updated" | "failed" | "status">) {
  useImportHistoryStore.getState().add({ id: uid(), tableId, fileName, at: nowIso(), total: r.total, created: r.created, updated: r.updated, failed: r.failed, status: r.status })
}
