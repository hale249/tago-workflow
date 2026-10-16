import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ImportStatus = "completed" | "failed"

export type ImportHistoryEntry = {
  id: string
  tableId: string
  fileName: string
  at: string
  total: number
  created: number
  updated: number
  failed: number
  status: ImportStatus
}

/** Mock of the backend's import jobs: past Excel imports per table, newest first, kept in localStorage. */
type ImportHistoryState = {
  entries: ImportHistoryEntry[]
  add: (entry: ImportHistoryEntry) => void
}

const MAX_ENTRIES = 200

export const useImportHistoryStore = create<ImportHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) => set((s) => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) })),
    }),
    { name: "tago-table-imports", version: 1 },
  ),
)
