import { create } from "zustand"
import { persist } from "zustand/middleware"

import { DEFAULT_COLUMN_ORDER } from "../components/columns"
import type { SortState } from "../types/customer"

type CustomersTableState = {
  columnOrder: string[]
  hiddenColumns: string[]
  sort: SortState
  search: string
  selectedIds: string[]
  activeCustomerId: string | null
  setSort: (sort: SortState) => void
  setSearch: (search: string) => void
  moveColumn: (id: string, to: "left" | "right" | "start" | "end") => void
  toggleColumn: (id: string) => void
  toggleRow: (id: string) => void
  setSelection: (ids: string[]) => void
  openCustomer: (id: string | null) => void
  resetView: () => void
}

export const useCustomersTableStore = create<CustomersTableState>()(
  persist(
    (set) => ({
      columnOrder: DEFAULT_COLUMN_ORDER,
      hiddenColumns: [],
      sort: null,
      search: "",
      selectedIds: [],
      activeCustomerId: null,
      setSort: (sort) => set({ sort }),
      setSearch: (search) => set({ search }),
      moveColumn: (id, to) =>
        set(({ columnOrder }) => {
          const order = columnOrder.filter((c) => c !== id)
          const idx = columnOrder.indexOf(id)
          const target = to === "start" ? 0 : to === "end" ? order.length : to === "left" ? Math.max(0, idx - 1) : Math.min(order.length, idx + 1)
          order.splice(target, 0, id)
          return { columnOrder: order }
        }),
      toggleColumn: (id) =>
        set(({ hiddenColumns }) => ({
          hiddenColumns: hiddenColumns.includes(id) ? hiddenColumns.filter((c) => c !== id) : [...hiddenColumns, id],
        })),
      toggleRow: (id) =>
        set(({ selectedIds }) => ({
          selectedIds: selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id],
        })),
      setSelection: (selectedIds) => set({ selectedIds }),
      openCustomer: (activeCustomerId) => set({ activeCustomerId }),
      resetView: () => set({ columnOrder: DEFAULT_COLUMN_ORDER, hiddenColumns: [], sort: null }),
    }),
    {
      name: "tago-customers-table",
      partialize: (s) => ({ columnOrder: s.columnOrder, hiddenColumns: s.hiddenColumns, sort: s.sort }),
    },
  ),
)
