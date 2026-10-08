import { useMemo } from "react"

import { COLUMN_MAP } from "../components/columns"
import { useCustomersTableStore } from "../store/customers-table.store"
import type { Customer } from "../types/customer"

/** Applies search + sort + column visibility from the table store to raw data. */
export function useCustomersView(data: Customer[] = []) {
  const { search, sort, columnOrder, hiddenColumns } = useCustomersTableStore()

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = q
      ? data.filter((c) => [c.account, c.email, c.location, c.website, c.lead.name].some((v) => v.toLowerCase().includes(q)))
      : data
    const getter = sort && COLUMN_MAP[sort.columnId]?.sortValue
    if (sort && getter) {
      const dir = sort.direction === "asc" ? 1 : -1
      result = [...result].sort((a, b) => {
        const va = getter(a), vb = getter(b)
        return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir
      })
    }
    return result
  }, [data, search, sort])

  const columns = useMemo(
    () => columnOrder.filter((id) => !hiddenColumns.includes(id)).map((id) => COLUMN_MAP[id]!).filter(Boolean),
    [columnOrder, hiddenColumns],
  )

  return { rows, columns }
}
