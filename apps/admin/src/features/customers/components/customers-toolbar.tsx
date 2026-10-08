import { ArrowUpDown, Columns3, LayoutGrid, ListFilter, RotateCcw, Search, SlidersHorizontal } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { useCustomersTableStore } from "../store/customers-table.store"
import { CUSTOMER_COLUMNS } from "./columns"

export function CustomersToolbar({ total }: { total: number }) {
  const { search, setSearch, hiddenColumns, toggleColumn, sort, setSort, resetView } = useCustomersTableStore()
  const sortable = CUSTOMER_COLUMNS.filter((c) => c.sortValue)

  return (
    <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
      <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" size="sm" className="pl-8" />
      </div>
      <Button variant="outline" size="sm" className="h-8 border-dashed">
        <ListFilter /><span className="max-sm:sr-only">Filter (0)</span>
      </Button>
      <span className="hidden text-xs text-muted-foreground sm:inline">{total} accounts</span>

      <div className="flex items-center gap-1 sm:ml-auto sm:gap-2">
        <Button variant="ghost" size="sm" className="h-8 max-sm:hidden"><LayoutGrid /> Layout</Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8"><ArrowUpDown /><span className="max-sm:sr-only">Sort</span></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
            {sortable.map((col) => (
              <DropdownMenuItem
                key={col.id}
                onSelect={() =>
                  setSort({ columnId: col.id, direction: sort?.columnId === col.id && sort.direction === "asc" ? "desc" : "asc" })
                }
              >
                <col.icon /> <span className="flex-1">{col.label}</span>
                {sort?.columnId === col.id && <span className="text-xs text-muted-foreground">{sort.direction}</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8"><SlidersHorizontal /><span className="max-sm:sr-only">View Settings</span></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground"><Columns3 className="size-3.5" /> Columns</DropdownMenuLabel>
            {CUSTOMER_COLUMNS.filter((c) => c.id !== "account").map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={!hiddenColumns.includes(col.id)}
                onCheckedChange={() => toggleColumn(col.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={resetView}><RotateCcw /> Reset view</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

