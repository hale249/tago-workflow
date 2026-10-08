import { NavLink } from "react-router"
import { ChevronRight, Folder } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { useUiStore } from "@/stores/ui.store"
import { useTables, useWorkGroups } from "../api/tables.queries"
import { TableIcon } from "./table-icon"

const ROW =
  "relative flex h-8 w-full shrink-0 items-center gap-2 rounded-md pr-2 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-150 outline-none select-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"

/** Sidebar tree under "Apps": work group → tables, each linking to its records. */
export function TablesNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const { data: tables = [] } = useTables()
  const { data: groups = [] } = useWorkGroups()
  const { closedTree, toggleTree } = useUiStore()

  const tree = groups.map((g) => ({ group: g, tables: tables.filter((t) => t.workGroupId === g.id) })).filter((x) => x.tables.length)
  if (!tree.length) return null

  return (
    <div className="mt-0.5 flex flex-col space-y-0.5">
      {tree.map(({ group, tables: list }) => {
        const key = `group:${group.id}`
        const open = !closedTree.includes(key)
        return (
          <div key={group.id} className="flex flex-col">
            <div className="group/row relative flex items-center">
              <button type="button" onClick={() => toggleTree(key)} aria-expanded={open} className={cn(ROW, "pl-6 text-left")}>
                <Folder strokeWidth={1.5} className="size-4 shrink-0 text-sidebar-foreground/60 transition-colors group-hover/row:text-sidebar-foreground" />
                <span className="flex-1 truncate">{group.name}</span>
              </button>
              <ChevronRight
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-sidebar-foreground/40 opacity-0 transition-[opacity,transform] duration-200 group-hover/row:opacity-100",
                  open && "rotate-90",
                )}
              />
            </div>
            {open && (
              <div className="mt-0.5 flex flex-col space-y-0.5">
                {list.map((t) => (
                  <NavLink
                    key={t.id}
                    to={`/tables/${t.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) => cn(ROW, "pl-10", isActive && "bg-brand/8 text-brand hover:bg-brand/10 hover:text-brand")}
                  >
                    <TableIcon icon={t.icon} color={t.iconColor} plain />
                    <span className="truncate">{t.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
