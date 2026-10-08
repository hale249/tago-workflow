import { ArrowDown, ArrowUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, EyeOff, X } from "lucide-react"

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { useCustomersTableStore } from "../store/customers-table.store"
import type { CustomerColumn } from "./columns"

export function ColumnHeader({ column }: { column: CustomerColumn }) {
  const { sort, setSort, moveColumn, toggleColumn } = useCustomersTableStore()
  const active = sort?.columnId === column.id ? sort.direction : null
  const SortIcon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-full w-full items-center gap-1.5 px-3 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground",
          active && "text-foreground",
        )}
      >
        <column.icon className="size-3.5 shrink-0" />
        <span className="truncate">{column.label}</span>
        {SortIcon && <SortIcon className="ml-auto size-3.5 text-brand" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {column.sortValue && (
          <>
            <DropdownMenuItem onSelect={() => setSort({ columnId: column.id, direction: "asc" })}><ArrowUp /> Ascending</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort({ columnId: column.id, direction: "desc" })}><ArrowDown /> Descending</DropdownMenuItem>
            <DropdownMenuItem disabled={!active} onSelect={() => setSort(null)}><X /> No sorting</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "right")}><ChevronRight /> Move right</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "left")}><ChevronLeft /> Move left</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "end")}><ChevronsRight /> Move to right end</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "start")}><ChevronsLeft /> Move to left end</DropdownMenuItem>
        {column.id !== "account" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toggleColumn(column.id)}><EyeOff /> Hide column</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

