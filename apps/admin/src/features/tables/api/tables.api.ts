import { buildTemplateConfig, TEMPLATES } from "../data/table-templates"
import { CURRENT_USER_ID, WORKSPACE_TEAMS, WORKSPACE_USERS } from "../data/seed"
import { useTablesDb } from "../store/tables-db.store"
import type {
  ActiveTable, RecordComment, RecordData, RecordItem, RecordQuery, TableConfig, TableRecord, TableTemplate, WorkGroup,
} from "../types/table"
import { evaluateFormula } from "../utils/formula"
import { matchCondition, rangeBounds } from "../utils/filters"
import { deriveUsers } from "../utils/people"
import { emptyValue, isBlank, isMulti, nowIso, renderCodeTemplate, uid, validateRecord, valueToText } from "../utils/fields"

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

export function recordLabel(tableId: string, recordId: string) {
  const t = db().tables.find((x) => x.id === tableId)
  const r = db().records.find((x) => x.id === recordId)
  if (!t || !r) return recordId
  const labelField = t.config.recordDetail.headTitleField || t.config.fields[0]?.name
  return String(r.record[labelField] ?? recordId)
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
  const ctx = { users: WORKSPACE_USERS, recordLabel }
  return table.config.fields.some((f) => valueToText(f, r.record[f.name], ctx).toLowerCase().includes(s))
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
    if (f.type === "NUMERIC") out[f.name] = isBlank(v) ? null : Number(v)
    else if (isMulti(f.type)) out[f.name] = Array.isArray(v) ? v : isBlank(v) ? [] : [String(v)]
    else if (f.type === "CHECKBOX_YES_NO") out[f.name] = Boolean(v)
    else out[f.name] = v ?? ""
  }
  return out
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
      row[f.name] = f.type === "NUMERIC" ? (isBlank(v) ? null : Number(v)) : v ?? ""
    }
    return row
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
        recordList: { ...c.recordList, displayFields: c.recordList.displayFields.filter(keep) },
        recordDetail: {
          ...c.recordDetail,
          headTitleField: keep(c.recordDetail.headTitleField) ? c.recordDetail.headTitleField : names[0] ?? "",
          headSubLineFields: c.recordDetail.headSubLineFields.filter(keep),
          rowTailFields: c.recordDetail.rowTailFields.filter(keep),
        },
        kanbanConfigs: c.kanbanConfigs
          .filter((k) => keep(k.statusField))
          .map((k) => ({ ...k, displayFields: k.displayFields.filter(keep), headlineField: keep(k.headlineField) ? k.headlineField : names[0] ?? "" })),
      }
    }
    const next = { ...cur, ...patch, updatedAt: nowIso() }
    write((s) => ({ tables: s.tables.map((t) => (t.id === id ? next : t)) }))
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
    const sort = q.sort ?? table.config.defaultSort
    return db()
      .records.filter((r) => r.tableId === tableId && matches(table, r, q))
      .sort((a, b) => (sort === "asc" ? 1 : -1) * a.createdAt.localeCompare(b.createdAt))
  },
  async getRecord(tableId: string, recordId: string): Promise<TableRecord> {
    await delay(80)
    const r = db().records.find((x) => x.tableId === tableId && x.id === recordId)
    if (!r) throw new ApiError("Không tìm thấy bản ghi")
    return r
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
    for (const f of table.config.fields) if (f.type === "AUTO_GENERATED_CODE" || f.isLocked) delete clean[f.name]
    const record = { ...cur.record, ...clean }
    const lineItems = applyItems(table, record, items) ?? cur.items
    const errors = { ...validateRecord(table.config.fields, record), ...checkUnique(table, record, recordId) }
    if (Object.keys(errors).length) throw new ApiError("Dữ liệu không hợp lệ", errors)
    const at = nowIso()
    const valueUpdatedAt = { ...cur.valueUpdatedAt }
    for (const k of Object.keys(clean)) if (JSON.stringify(cur.record[k]) !== JSON.stringify(clean[k])) valueUpdatedAt[k] = at
    const next = { ...cur, record, items: lineItems, ...deriveUsers(table.config.fields, record), updatedAt: at, valueUpdatedAt }
    write((s) => ({ records: s.records.map((r) => (r.id === recordId ? next : r)) }))
    return next
  },
  async deleteRecords(tableId: string, ids: string[]): Promise<void> {
    await delay()
    const set = new Set(ids)
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
