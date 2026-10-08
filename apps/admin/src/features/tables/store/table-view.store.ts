import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AdvancedCondition, DateRange } from "../types/table"

/** Per-table UI state: open screen, quick filters, advanced conditions, created-at / creator filters. */
type TableViewState = {
  screens: Record<string, string>
  filters: Record<string, Record<string, string>>
  conditions: Record<string, AdvancedCondition[]>
  createdAt: Record<string, DateRange | null>
  createdBy: Record<string, string>
  mine: Record<string, "" | "assigned" | "related">
  setMine: (tableId: string, v: "" | "assigned" | "related") => void
  setScreen: (tableId: string, screen: string) => void
  setFilter: (tableId: string, field: string, value: string) => void
  clearFilters: (tableId: string) => void
  setConditions: (tableId: string, conditions: AdvancedCondition[]) => void
  setCreatedAt: (tableId: string, range: DateRange | null) => void
  setCreatedBy: (tableId: string, userId: string) => void
}

export const useTableViewStore = create<TableViewState>()(
  persist(
    (set) => ({
      screens: {},
      filters: {},
      conditions: {},
      createdAt: {},
      createdBy: {},
      mine: {},
      setMine: (tableId, v) => set((s) => ({ mine: { ...s.mine, [tableId]: v } })),
      setScreen: (tableId, screen) => set((s) => ({ screens: { ...s.screens, [tableId]: screen } })),
      setFilter: (tableId, field, value) =>
        set((s) => ({ filters: { ...s.filters, [tableId]: { ...s.filters[tableId], [field]: value } } })),
      clearFilters: (tableId) =>
        set((s) => ({ filters: { ...s.filters, [tableId]: {} }, conditions: { ...s.conditions, [tableId]: [] }, createdAt: { ...s.createdAt, [tableId]: null }, createdBy: { ...s.createdBy, [tableId]: "" }, mine: { ...s.mine, [tableId]: "" } })),
      setConditions: (tableId, conditions) => set((s) => ({ conditions: { ...s.conditions, [tableId]: conditions } })),
      setCreatedAt: (tableId, range) => set((s) => ({ createdAt: { ...s.createdAt, [tableId]: range } })),
      setCreatedBy: (tableId, userId) => set((s) => ({ createdBy: { ...s.createdBy, [tableId]: userId } })),
    }),
    { name: "tago-table-view", version: 3, migrate: (p) => ({ conditions: {}, createdAt: {}, createdBy: {}, mine: {}, ...(p as object) }) as TableViewState },
  ),
)
