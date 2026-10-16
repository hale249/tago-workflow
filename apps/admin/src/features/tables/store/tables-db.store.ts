import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_COMMENTS, SEED_COUNTERS, SEED_RECORDS, SEED_TABLES, SEED_WORK_GROUPS } from "../data/seed"
import type { ActiveTable, RecordComment, TableField, TableRecord, WorkGroup } from "../types/table"

/**
 * Local stand-in for the backend: the whole workspace lives in localStorage.
 * Only `tables.api.ts` should touch this store — UI goes through the API + queries.
 */
type TablesDbState = {
  workGroups: WorkGroup[]
  tables: ActiveTable[]
  records: TableRecord[]
  comments: RecordComment[]
  /** `${tableId}:${fieldName}` -> last issued number for AUTO_GENERATED_CODE. */
  counters: Record<string, number>
  reset: () => void
}

const toText = (f: TableField): TableField => (f.type === "RICH_TEXT" ? { ...f, type: "TEXT" } : f)
const migrateLongText = (t: ActiveTable): ActiveTable => ({
  ...t,
  config: {
    ...t.config,
    fields: t.config.fields.map(toText),
    items: t.config.items ? { ...t.config.items, fields: t.config.items.fields.map(toText) } : t.config.items,
    actions: (t.config.actions ?? []).map((a) => ({ ...a, inputFields: (a.inputFields ?? []).map(toText) })),
  },
})

const seed = () => ({
  workGroups: SEED_WORK_GROUPS,
  tables: SEED_TABLES,
  records: SEED_RECORDS,
  comments: SEED_COMMENTS,
  counters: SEED_COUNTERS,
})

export const useTablesDb = create<TablesDbState>()(
  persist((set) => ({ ...seed(), reset: () => set(seed()) }), {
    name: "tago-tables-db",
    version: 6,
    // v3–v5 reshaped templates (line items, gantt, objective, conversion, stock-out auto-init): demo data is reseeded.
    // Later versions should migrate in place, e.g. `{ ...extraConfigDefaults(), ...t.config }`.
    migrate: (persisted, version) => {
      if (version < 5) return { ...(persisted as object), ...seed() } as TablesDbState
      const state = persisted as TablesDbState
      // v6: "Văn bản dài" became its own TEXT type; RICH_TEXT now means formatted text. Old values are plain text.
      if (version < 6) state.tables = state.tables.map(migrateLongText)
      return state
    },
  }),
)
