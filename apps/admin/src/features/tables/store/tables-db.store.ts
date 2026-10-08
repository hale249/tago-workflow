import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_COMMENTS, SEED_COUNTERS, SEED_RECORDS, SEED_TABLES, SEED_WORK_GROUPS } from "../data/seed"
import type { ActiveTable, RecordComment, TableRecord, WorkGroup } from "../types/table"

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
    version: 5,
    // v3–v5 reshaped templates (line items, gantt, objective, conversion, stock-out auto-init): demo data is reseeded.
    // Later versions should migrate in place, e.g. `{ ...extraConfigDefaults(), ...t.config }`.
    migrate: (persisted, version) => (version < 5 ? { ...(persisted as object), ...seed() } : persisted) as TablesDbState,
  }),
)
