import { buildTemplateConfig, TEMPLATES } from "../data/table-templates"
import { CURRENT_USER_ID, WORKSPACE_TEAMS, WORKSPACE_USERS } from "../data/seed"
import { useTablesDb } from "../store/tables-db.store"
import type {
  ActiveTable, DateRange, RecordComment, RecordData, RecordItem, RecordQuery, TableConfig, TableRecord, TableTemplate, WorkGroup,
} from "../types/table"
import { evaluateFormula } from "../utils/formula"
import { matchCondition, rangeBounds } from "../utils/filters"
import { deriveUsers } from "../utils/people"
import { sanitizeHtml } from "../utils/rich-text"
import { computeSummaries, emptyValue, isBlank, isComputed, isMulti, isNumericValue, nowIso, renderCodeTemplate, uid, validateRecord, valueToText } from "../utils/fields"
import { attachmentsApi } from "./attachments.api"

// Swap these for real HTTP calls when the backend is ready — keep the signatures.
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const db = () => useTablesDb.getState()
const write = useTablesDb.setState

export class ApiError extends Error {
  constructor(message: string, public fieldErrors: Record<string, string> = {}) {
    super(message)
  }
}

function requireTable(id: string) {
  const t = db().tables.find((x) => x.id === id)
  if (!t) throw new ApiError("Không tìm thấy bảng")
  return t
}

// Id → row indexes, rebuilt only when the store's arrays change (labels are looked up per option per render).
const indexCache = new WeakMap<object, Map<string, unknown>>()
function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  let m = indexCache.get(rows) as Map<string, T> | undefined
  if (!m) indexCache.set(rows, (m = new Map(rows.map((r) => [r.id, r]))))
  return m
}
const tableById = (id: string) => byId(db().tables).get(id)
const recordById = (id: string) => byId(db().records).get(id)

/** Title of a record; `displayField` (a reference field's "Trường hiển thị") wins when it has a value. */
export function recordLabel(tableId: string, recordId: string, displayField?: string) {
  const t = tableById(tableId)
  const r = recordById(recordId)
  if (!t || !r) return recordId
  const shown = displayField ? t.config.fields.find((f) => f.name === displayField) : undefined
  const text = shown ? valueToText(shown, r.record[shown.name], { users: WORKSPACE_USERS, recordLabel }) : ""
  if (text) return text
  const labelField = t.config.recordDetail.headTitleField || t.config.fields[0]?.name
  return String(r.record[labelField] ?? recordId)
}

/** How a record reads in another table's record picker: the table's lookup fields win over the reference field's label field. */
export function lookupLabel(tableId: string, recordId: string, fallbackField?: string) {
  const t = tableById(tableId)
  const r = recordById(recordId)
  if (!t || !r) return { primary: recordId, secondary: [] as string[] }
  const ctx = { users: WORKSPACE_USERS, recordLabel }
  const text = (name: string) => {
    const f = t.config.fields.find((x) => x.name === name)
    return f ? valueToText(f, r.record[name], ctx) : ""
  }
  const primaryField = t.config.lookupPrimaryField || fallbackField
  const primary = (primaryField && text(primaryField)) || recordLabel(tableId, recordId)
  const secondary = (t.config.lookupSecondaryFields ?? []).filter((n) => n !== primaryField).map(text).filter(Boolean)
  return { primary, secondary }
}

const fileName = (id: string) => attachmentsApi.get(id)?.name
const textCtx = { users: WORKSPACE_USERS, recordLabel, fileName }

/**
 * Fills derived values that are never stored: FIRST_REFERENCE_RECORD = id of the earliest-created record in the
 * source table whose reference field (single or multi) points at the record.
 */
function deriveRecords(table: ActiveTable, rows: TableRecord[]): TableRecord[] {
  const firstRefs = table.config.fields.filter((f) => f.type === "FIRST_REFERENCE_RECORD" && f.referenceTableId && f.referenceField)
  if (!firstRefs.length) return rows
  const maps = firstRefs.map((f) => {
    const m = new Map<string, string>()
    const source = db().records.filter((r) => r.tableId === f.referenceTableId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    for (const r of source) {
      const v = r.record[f.referenceField!]
      for (const target of Array.isArray(v) ? v : isBlank(v) ? [] : [String(v)]) if (!m.has(target)) m.set(target, r.id)
    }
    return [f.name, m] as const
  })
  return rows.map((r) => {
    const record = { ...r.record }
    for (const [name, m] of maps) record[name] = m.get(r.id) ?? ""
    return { ...r, record }
  })
}

/** Field comparison for sorting (blanks handled by the caller). */
function compareRecords(table: ActiveTable, field: string, a: TableRecord, b: TableRecord) {
  const f = table.config.fields.find((x) => x.name === field)
  const av = a.record[field], bv = b.record[field]
  if (typeof av === "number" && typeof bv === "number") return av - bv
  const ctx = textCtx
  const at = f ? valueToText(f, av, ctx) : String(av)
  const bt = f ? valueToText(f, bv, ctx) : String(bv)
  return at.localeCompare(bt, "vi", { numeric: true })
}

function matches(table: ActiveTable, r: TableRecord, q: RecordQuery) {
  for (const [name, want] of Object.entries(q.filters ?? {})) {
    if (!want) continue
    const v = r.record[name]
    const field = table.config.fields.find((f) => f.name === name)
    if (!field) continue
    if (want === "__empty__") {
      if (!isBlank(v)) return false
    } else if (Array.isArray(v)) {
      if (!v.includes(want)) return false
    } else if (field.type === "CHECKBOX_YES_NO") {
      if (String(Boolean(v)) !== want) return false
    } else if ((field.type === "DATE" || field.type === "DATETIME") && want.startsWith("{")) {
      // Date quick filter: a JSON-encoded DateRange (preset or custom from/to).
      let range: DateRange | null = null
      try { range = JSON.parse(want) as DateRange } catch { /* malformed → ignore filter */ }
      if (range) {
        const t = Date.parse(String(v ?? "").length === 10 ? `${v}T00:00:00` : String(v ?? ""))
        const [from, to] = rangeBounds(range)
        if (Number.isNaN(t) || t < from || t >= to) return false
      }
    } else if (field.type === "SHORT_TEXT" || field.type === "AUTO_GENERATED_CODE" || field.type === "DATE") {
      if (!String(v ?? "").toLowerCase().includes(want.toLowerCase())) return false
    } else if (String(v ?? "") !== want) return false
  }
  for (const c of q.conditions ?? []) {
    const field = table.config.fields.find((f) => f.name === c.field)
    if (field && !matchCondition(field, r.record[c.field], c)) return false
  }
  if (q.createdBy && r.createdBy !== q.createdBy) return false
  if (q.mine === "assigned" && !(r.assignedUserIds ?? []).includes(CURRENT_USER_ID)) return false
  if (q.mine === "related" && !(r.relatedUserIds ?? []).includes(CURRENT_USER_ID)) return false
  if (q.createdAt) {
    const [from, to] = rangeBounds(q.createdAt)
    const t = Date.parse(r.createdAt)
    if (t < from || t >= to) return false
  }
  const s = q.search?.trim().toLowerCase()
  if (!s) return true
  const ctx = textCtx
  const only = table.config.searchableFields ?? []
  const fields = only.length ? table.config.fields.filter((f) => only.includes(f.name)) : table.config.fields
  return fields.some((f) => valueToText(f, r.record[f.name], ctx).toLowerCase().includes(s))
}

function checkUnique(table: ActiveTable, data: RecordData, exceptId?: string) {
  const errors: Record<string, string> = {}
  for (const f of table.config.fields.filter((x) => x.isUnique)) {
    const v = data[f.name]
    if (isBlank(v)) continue
    const dup = db().records.some(
      (r) => r.tableId === table.id && r.id !== exceptId && String(r.record[f.name]).toLowerCase() === String(v).toLowerCase(),
    )
    if (dup) errors[f.name] = `${f.label} đã tồn tại`
  }
  return errors
}

/** Keeps only known fields and normalises types (numbers, arrays). */
function sanitize(table: ActiveTable, data: RecordData): RecordData {
  const out: RecordData = {}
  for (const f of table.config.fields) {
    if (!(f.name in data)) continue
    const v = data[f.name]
    // Computed by the system (Số tự tính is recomputed after sanitising; first reference is derived on read).
    if (f.type === "NUMERIC_SUMMARY" || f.type === "FIRST_REFERENCE_RECORD") continue
    if (isNumericValue(f.type)) out[f.name] = isBlank(v) ? null : Number(v)
    else if (isMulti(f.type)) out[f.name] = Array.isArray(v) ? v : isBlank(v) ? [] : [String(v)]
    else if (f.type === "CHECKBOX_YES_NO") out[f.name] = Boolean(v)
    else if (f.type === "RICH_TEXT") out[f.name] = sanitizeHtml(String(v ?? ""))
    else out[f.name] = v ?? ""
  }
  return out
}

/** Attachment ids a record holds across its ATTACHMENT fields. */
const attachmentIds = (table: ActiveTable, record: RecordData) =>
  table.config.fields.filter((f) => f.type === "ATTACHMENT").flatMap((f) => (Array.isArray(record[f.name]) ? (record[f.name] as string[]) : []))

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const copyValue = <T,>(v: T): T => (Array.isArray(v) ? (v.slice() as T) : v)

/**
 * "Tự động điền từ liên kết": when `linkField` (a SELECT_ONE_RECORD field) changes from `record[linkField]`
 * to `nextLinkId`, returns the values to copy into every field whose `autoFill` points at that link.
 * A target is only (re)filled while it is empty or still holds what the previous linked record would have
 * put there — a value the user typed by hand is never overwritten. Clearing the link clears auto-filled values.
 */
export function autoFillPatch(tableId: string, record: RecordData, linkField: string, nextLinkId: unknown): RecordData {
  const t = tableById(tableId)
  const link = t?.config.fields.find((f) => f.name === linkField)
  if (!t || !link?.referenceTableId) return {}
  const targets = t.config.fields.filter((f) => f.autoFill?.linkField === linkField && f.autoFill.sourceField && f.name !== linkField)
  if (!targets.length) return {}
  const sourceOf = (id: unknown) => {
    const r = typeof id === "string" && id ? recordById(id) : undefined
    return r && r.tableId === link.referenceTableId ? r : undefined
  }
  const prev = sourceOf(record[linkField])
  const next = sourceOf(nextLinkId)
  const patch: RecordData = {}
  for (const f of targets) {
    const src = f.autoFill!.sourceField
    const current = record[f.name]
    const wasAutoFilled = !!prev && !isBlank(current) && sameValue(current, prev.record[src])
    if (!isBlank(current) && !wasAutoFilled) continue
    const value = next ? next.record[src] : undefined
    patch[f.name] = isBlank(value) ? emptyValue(f) : copyValue(value!)
  }
  return patch
}

/** Builds line items (and copied roll-ups) for a new record from the trigger record, per the auto-init mappings. */
export function autoInitItems(table: ActiveTable, sourceRecordId: string): { items: RecordItem[]; sums: RecordData } | null {
  const ai = table.config.items.autoInit
  if (!table.config.items.enabled || !ai?.enabled || !sourceRecordId) return null
  const src = db().records.find((r) => r.id === sourceRecordId)
  if (!src) return null
  const items = (src.items ?? []).map((it) => {
    const row: RecordItem = { id: uid() }
    for (const f of table.config.items.fields) row[f.name] = emptyValue(f)
    for (const m of ai.itemMappings) if (m.source && m.target) row[m.target] = it[m.source] ?? null
    return row
  })
  const sums: RecordData = {}
  for (const m of ai.sumMappings) if (m.source && m.target) sums[m.target] = src.record[m.source] ?? null
  return { items, sums }
}

/** Normalises line items and writes their roll-ups into the parent record. */
function applyItems(table: ActiveTable, record: RecordData, items: RecordItem[] | undefined): RecordItem[] | undefined {
  const cfg = table.config.items
  if (!cfg.enabled || !items) return undefined
  const clean = items.map((it) => {
    const row: RecordItem = { id: it.id || uid() }
    for (const f of cfg.fields) {
      const v = it[f.name]
      row[f.name] = isNumericValue(f.type) ? (isBlank(v) ? null : Number(v)) : v ?? ""
    }
    return { ...row, ...computeSummaries(cfg.fields, row) } as RecordItem
  })
  for (const s of cfg.sums) if (s.sumField) record[s.sumField] = evaluateFormula(s.formula, clean)
  return clean
}

export const tablesApi = {
  async listWorkGroups(): Promise<WorkGroup[]> {
    await delay()
    return db().workGroups
  },
  async createWorkGroup(input: { name: string; description?: string }): Promise<WorkGroup> {
    await delay()
    const g = { id: uid(), name: input.name.trim(), description: input.description ?? "" }
    write((s) => ({ workGroups: [...s.workGroups, g] }))
    return g
  },
  async updateWorkGroup(id: string, input: { name: string; description?: string }): Promise<WorkGroup> {
    await delay()
    if (!input.name.trim()) throw new ApiError("Tên nhóm là bắt buộc")
    const cur = db().workGroups.find((g) => g.id === id)
    if (!cur) throw new ApiError("Không tìm thấy nhóm công việc")
    const next = { ...cur, name: input.name.trim(), description: input.description ?? cur.description }
    write((s) => ({ workGroups: s.workGroups.map((g) => (g.id === id ? next : g)) }))
    return next
  },
  /** Only empty groups can be removed (tables must be moved out first). */
  async deleteWorkGroup(id: string) {
    await delay()
    if (db().tables.some((t) => t.workGroupId === id)) throw new ApiError("Không thể xóa nhóm còn chứa bảng")
    write((s) => ({ workGroups: s.workGroups.filter((g) => g.id !== id) }))
  },
  /** Workspace-wide order of work groups = array order (sidebar tree, tables page, settings). */
  async reorderWorkGroups(ids: string[]) {
    await delay(60)
    write((s) => {
      const rank = new Map(ids.map((id, i) => [id, i]))
      return { workGroups: [...s.workGroups].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)) }
    })
  },
  /** Reorders the tables of one group in place; other tables keep their slots. */
  async reorderTables(workGroupId: string, ids: string[]) {
    await delay(60)
    write((s) => {
      const rank = new Map(ids.map((id, i) => [id, i]))
      const inGroup = s.tables.filter((t) => t.workGroupId === workGroupId).sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
      let i = 0
      return { tables: s.tables.map((t) => (t.workGroupId === workGroupId ? inGroup[i++]! : t)) }
    })
  },
  async listTeams() {
    await delay(60)
    return WORKSPACE_TEAMS
  },
  async listUsers() {
    await delay(60)
    return WORKSPACE_USERS
  },

  async listTables(): Promise<ActiveTable[]> {
    await delay()
    return db().tables
  },
  async recordCounts(): Promise<Record<string, number>> {
    await delay(60)
    const out: Record<string, number> = {}
    for (const r of db().records) out[r.tableId] = (out[r.tableId] ?? 0) + 1
    return out
  },
  async getTable(id: string): Promise<ActiveTable> {
    await delay(80)
    return requireTable(id)
  },
  async createTable(input: { name: string; description?: string; workGroupId: string; template: TableTemplate }): Promise<ActiveTable> {
    await delay()
    if (!input.name.trim()) throw new ApiError("Tên bảng là bắt buộc", { name: "Tên bảng là bắt buộc" })
    const tpl = TEMPLATES.find((t) => t.id === input.template) ?? TEMPLATES[0]
    const t: ActiveTable = {
      id: uid(),
      name: input.name.trim(),
      description: input.description ?? "",
      icon: tpl.icon,
      iconColor: tpl.iconColor,
      workGroupId: input.workGroupId,
      tableType: tpl.id,
      config: buildTemplateConfig(tpl.id),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    write((s) => ({ tables: [...s.tables, t] }))
    return t
  },
  async updateTable(id: string, patch: Partial<Pick<ActiveTable, "name" | "description" | "workGroupId" | "icon" | "iconColor">> & { config?: TableConfig }): Promise<ActiveTable> {
    await delay()
    const cur = requireTable(id)
    if (patch.name !== undefined && !patch.name.trim()) throw new ApiError("Tên bảng là bắt buộc")
    if (patch.config) {
      const names = patch.config.fields.map((f) => f.name)
      if (new Set(names).size !== names.length) throw new ApiError("Mã trường bị trùng")
      // Drop references to removed fields so views never point at nothing.
      const keep = (n: string) => names.includes(n)
      const c = patch.config
      patch.config = {
        ...c,
        quickFilters: c.quickFilters.filter(keep),
        searchableFields: c.searchableFields?.filter(keep),
        lookupPrimaryField: c.lookupPrimaryField && keep(c.lookupPrimaryField) ? c.lookupPrimaryField : "",
        lookupSecondaryFields: c.lookupSecondaryFields?.filter(keep),
        recordList: {
          ...c.recordList,
          displayFields: c.recordList.displayFields.filter(keep),
          sortField: c.recordList.sortField && keep(c.recordList.sortField) ? c.recordList.sortField : "",
        },
        recordDetail: {
          ...c.recordDetail,
          headTitleField: keep(c.recordDetail.headTitleField) ? c.recordDetail.headTitleField : names[0] ?? "",
          headSubLineFields: c.recordDetail.headSubLineFields.filter(keep),
          rowTailFields: c.recordDetail.rowTailFields.filter(keep),
          leftFields: c.recordDetail.leftFields?.filter(keep),
          rightFields: c.recordDetail.rightFields?.filter(keep),
        },
        kanbanConfigs: c.kanbanConfigs
          .filter((k) => keep(k.statusField))
          .map((k) => ({ ...k, displayFields: k.displayFields.filter(keep), headlineField: keep(k.headlineField) ? k.headlineField : names[0] ?? "" })),
      }
    }
    const next = { ...cur, ...patch, updatedAt: nowIso() }
    write((s) => ({ tables: s.tables.map((t) => (t.id === id ? next : t)) }))
    // Formulas may have changed: restore every Số tự tính value of the table.
    if (patch.config?.fields.some((f) => f.type === "NUMERIC_SUMMARY")) {
      const fields = patch.config.fields
      write((s) => ({ records: s.records.map((r) => (r.tableId === id ? { ...r, record: computeSummaries(fields, r.record) } : r)) }))
    }
    return next
  },
  async deleteTable(id: string): Promise<void> {
    await delay()
    write((s) => {
      const recordIds = new Set(s.records.filter((r) => r.tableId === id).map((r) => r.id))
      return {
        tables: s.tables.filter((t) => t.id !== id),
        records: s.records.filter((r) => r.tableId !== id),
        comments: s.comments.filter((c) => !recordIds.has(c.recordId)),
      }
    })
  },

  async listRecords(tableId: string, q: RecordQuery = {}): Promise<TableRecord[]> {
    await delay()
    const table = requireTable(tableId)
    const { sortOrder = "asc" } = table.config.recordList
    // A clicked column header (q.sortBy) wins over the configured field; q.sort is its direction.
    const sortField = q.sortBy || table.config.recordList.sortField
    const dir = (q.sort ?? (sortField ? sortOrder : table.config.defaultSort)) === "asc" ? 1 : -1
    const byCreated = (a: TableRecord, b: TableRecord) => dir * a.createdAt.localeCompare(b.createdAt)
    const byField = (a: TableRecord, b: TableRecord) => {
      const ab = isBlank(a.record[sortField!]), bb = isBlank(b.record[sortField!])
      if (ab || bb) return ab === bb ? byCreated(a, b) : ab ? 1 : -1 // blanks always last
      return dir * compareRecords(table, sortField!, a, b) || byCreated(a, b)
    }
    return deriveRecords(table, db().records.filter((r) => r.tableId === tableId))
      .filter((r) => matches(table, r, q))
      .sort(sortField ? byField : byCreated)
  },
  async getRecord(tableId: string, recordId: string): Promise<TableRecord> {
    await delay(80)
    const r = db().records.find((x) => x.tableId === tableId && x.id === recordId)
    if (!r) throw new ApiError("Không tìm thấy bản ghi")
    return deriveRecords(requireTable(tableId), [r])[0]
  },
  async createRecord(tableId: string, data: RecordData, items?: RecordItem[]): Promise<TableRecord> {
    await delay()
    const table = requireTable(tableId)
    const record: RecordData = {}
    for (const f of table.config.fields) record[f.name] = emptyValue(f)
    Object.assign(record, sanitize(table, data))
    const ai = table.config.items.autoInit
    const auto = ai?.enabled && !items?.length ? autoInitItems(table, String(record[ai.triggerField] ?? "")) : null
    const lineItems = applyItems(table, record, auto?.items ?? items)
    // Copied roll-ups win over recomputed ones (they carry the source's real totals).
    if (ai?.enabled && ai.triggerField && record[ai.triggerField]) {
      const src = db().records.find((r) => r.id === record[ai.triggerField])
      for (const m of ai.sumMappings) if (src && m.source && m.target) record[m.target] = src.record[m.source] ?? null
    }
    Object.assign(record, computeSummaries(table.config.fields, record))
    const errors = { ...validateRecord(table.config.fields, record), ...checkUnique(table, record) }
    if (Object.keys(errors).length) throw new ApiError("Dữ liệu không hợp lệ", errors)

    const counters = { ...db().counters }
    for (const f of table.config.fields.filter((x) => x.type === "AUTO_GENERATED_CODE")) {
      const key = `${tableId}:${f.name}`
      counters[key] = (counters[key] ?? 0) + 1
      record[f.name] = renderCodeTemplate(f.codeTemplate ?? "{{auto.increment}}", counters[key])
    }
    const at = nowIso()
    const r: TableRecord = { id: uid(), tableId, record, items: lineItems, ...deriveUsers(table.config.fields, record), createdBy: CURRENT_USER_ID, createdAt: at, updatedAt: null, valueUpdatedAt: {} }
    write((s) => ({ records: [...s.records, r], counters }))
    return r
  },
  async updateRecord(tableId: string, recordId: string, patch: RecordData, items?: RecordItem[]): Promise<TableRecord> {
    await delay()
    const table = requireTable(tableId)
    const cur = db().records.find((x) => x.id === recordId && x.tableId === tableId)
    if (!cur) throw new ApiError("Không tìm thấy bản ghi")
    const clean = sanitize(table, patch)
    for (const f of table.config.fields) if (isComputed(f.type) || f.isLocked) delete clean[f.name]
    const merged = { ...cur.record, ...clean }
    const lineItems = applyItems(table, merged, items) ?? cur.items
    const record = computeSummaries(table.config.fields, merged)
    const errors = { ...validateRecord(table.config.fields, record), ...checkUnique(table, record, recordId) }
    if (Object.keys(errors).length) throw new ApiError("Dữ liệu không hợp lệ", errors)
    const at = nowIso()
    const valueUpdatedAt = { ...cur.valueUpdatedAt }
    for (const k of Object.keys(clean)) if (JSON.stringify(cur.record[k]) !== JSON.stringify(clean[k])) valueUpdatedAt[k] = at
    for (const f of table.config.fields) if (f.type === "NUMERIC_SUMMARY" && cur.record[f.name] !== record[f.name]) valueUpdatedAt[f.name] = at
    const next = { ...cur, record, items: lineItems, ...deriveUsers(table.config.fields, record), updatedAt: at, valueUpdatedAt }
    write((s) => ({ records: s.records.map((r) => (r.id === recordId ? next : r)) }))
    // Files taken off the record are dropped from the mock storage.
    const kept = new Set(attachmentIds(table, record))
    attachmentsApi.remove(attachmentIds(table, cur.record).filter((x) => !kept.has(x)))
    return deriveRecords(table, [next])[0]
  },
  async deleteRecords(tableId: string, ids: string[]): Promise<void> {
    await delay()
    const set = new Set(ids)
    const table = db().tables.find((t) => t.id === tableId)
    if (table) attachmentsApi.remove(db().records.filter((r) => r.tableId === tableId && set.has(r.id)).flatMap((r) => attachmentIds(table, r.record)))
    write((s) => ({
      records: s.records.filter((r) => !(r.tableId === tableId && set.has(r.id))),
      comments: s.comments.filter((c) => !set.has(c.recordId)),
    }))
  },

  async listComments(recordId: string): Promise<RecordComment[]> {
    await delay(60)
    return db().comments.filter((c) => c.recordId === recordId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
  async createComment(recordId: string, content: string): Promise<RecordComment> {
    await delay(60)
    if (!content.trim()) throw new ApiError("Nội dung trống")
    const c: RecordComment = { id: uid(), recordId, content: content.trim(), createdBy: CURRENT_USER_ID, createdAt: nowIso(), updatedAt: null }
    write((s) => ({ comments: [...s.comments, c] }))
    return c
  },
  async updateComment(id: string, content: string): Promise<void> {
    await delay(60)
    write((s) => ({ comments: s.comments.map((c) => (c.id === id ? { ...c, content, updatedAt: nowIso() } : c)) }))
  },
  async deleteComment(id: string): Promise<void> {
    await delay(60)
    write((s) => ({ comments: s.comments.filter((c) => c.id !== id) }))
  },
}
