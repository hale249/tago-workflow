import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown02Icon, ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon, ArrowUp02Icon, Cancel01Icon, ViewOffIcon } from "@hugeicons/core-free-icons"

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { useCustomersTableStore } from "../store/customers-table.store"
import type { CustomerColumn } from "./columns"

export function ColumnHeader({ column }: { column: CustomerColumn }) {
  const { sort, setSort, moveColumn, toggleColumn } = useCustomersTableStore()
  const active = sort?.columnId === column.id ? sort.direction : null
  const SortIcon = active === "asc" ? ArrowUp02Icon : active === "desc" ? ArrowDown02Icon : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-full w-full items-center gap-1.5 px-3 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground",
          active && "text-foreground",
        )}
      >
        <HugeiconsIcon icon={column.icon} className="size-3.5 shrink-0" />
        <span className="truncate">{column.label}</span>
        {SortIcon && <HugeiconsIcon icon={SortIcon} className="ml-auto size-3.5 text-brand" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {column.sortValue && (
          <>
            <DropdownMenuItem onSelect={() => setSort({ columnId: column.id, direction: "asc" })}><HugeiconsIcon icon={ArrowUp02Icon} /> Ascending</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort({ columnId: column.id, direction: "desc" })}><HugeiconsIcon icon={ArrowDown02Icon} /> Descending</DropdownMenuItem>
            <DropdownMenuItem disabled={!active} onSelect={() => setSort(null)}><HugeiconsIcon icon={Cancel01Icon} /> No sorting</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "right")}><HugeiconsIcon icon={ArrowRight01Icon} /> Move right</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "left")}><HugeiconsIcon icon={ArrowLeft01Icon} /> Move left</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "end")}><HugeiconsIcon icon={ArrowRightDoubleIcon} /> Move to right end</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => moveColumn(column.id, "start")}><HugeiconsIcon icon={ArrowLeftDoubleIcon} /> Move to left end</DropdownMenuItem>
        {column.id !== "account" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toggleColumn(column.id)}><HugeiconsIcon icon={ViewOffIcon} /> Hide column</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

