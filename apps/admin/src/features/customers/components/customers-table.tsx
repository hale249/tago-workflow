import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useCustomersTableStore } from "../store/customers-table.store"
import type { Customer } from "../types/customer"
import { ColumnHeader } from "./column-header"
import type { CustomerColumn } from "./columns"

type Props = { rows: Customer[]; columns: CustomerColumn[]; isLoading?: boolean }

export function CustomersTable({ rows, columns, isLoading }: Props) {
  const { selectedIds, toggleRow, setSelection, activeCustomerId, openCustomer } = useCustomersTableStore()
  const gridTemplateColumns = ["52px", ...columns.map((c) => c.width)].join(" ")
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))
  const someSelected = !allSelected && rows.some((r) => selectedIds.includes(r.id))

  return (
    <div className="relative flex-1 overflow-auto">
      <div role="table" className="min-w-max text-sm">
        <div role="row" className="sticky top-0 z-20 grid h-9 border-b bg-background" style={{ gridTemplateColumns }}>
          <div className="sticky left-0 z-10 flex items-center justify-center border-r bg-background">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(v) => setSelection(v ? rows.map((r) => r.id) : [])}
            />
          </div>
          {columns.map((col, i) => (
            <div
              key={col.id}
              role="columnheader"
              className={cn("border-r", i === 0 && "sticky left-[52px] z-10 bg-background")}
            >
              <ColumnHeader column={col} />
            </div>
          ))}
        </div>

        {isLoading
          ? Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="grid h-11 items-center border-b px-3" style={{ gridTemplateColumns }}>
                <Skeleton className="col-span-full h-4" />
              </div>
            ))
          : rows.map((row, index) => {
              const selected = selectedIds.includes(row.id)
              const active = activeCustomerId === row.id
              return (
                <div
                  key={row.id}
                  role="row"
                  onClick={() => openCustomer(row.id)}
                  className={cn(
                    "group grid h-11 cursor-pointer border-b hover:bg-muted/60",
                    (selected || active) && "bg-brand/5 dark:bg-brand/10",
                  )}
                  style={{ gridTemplateColumns }}
                >
                  <div
                    className="sticky left-0 z-10 flex items-center justify-center border-r bg-background group-hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={cn("text-xs text-muted-foreground tabular-nums group-hover:hidden", selected && "hidden")}>
                      {index + 1}
                    </span>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleRow(row.id)}
                      className={cn("hidden group-hover:flex", selected && "flex")}
                    />
                  </div>
                  {columns.map((col, i) => (
                    <div
                      key={col.id}
                      role="cell"
                      className={cn(
                        "flex min-w-0 items-center overflow-hidden border-r px-3 whitespace-nowrap",
                        i === 0 && "sticky left-[52px] z-10 bg-background group-hover:bg-muted",
                      )}
                    >
                      {col.cell(row)}
                    </div>
                  ))}
                </div>
              )
            })}

        {!isLoading && rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">Không có khách hàng phù hợp.</div>
        )}
      </div>
    </div>
  )
}
