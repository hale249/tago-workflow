import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router"

import { cn } from "@workspace/ui/lib/utils"
import { SearchIcon } from "@/components/icons"
import { useTables, useWorkGroups } from "../api/tables.queries"
import { TableIcon } from "./table-icon"

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()

/** Sidebar search box: "/" focuses it, matches tables by name and opens their records. */
export function TablesQuickSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { data: tables = [] } = useTables()
  const { data: groups = [] } = useWorkGroups()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState("")
  // -1 = nothing highlighted until hover / arrow keys (like the reference); Enter then opens the first hit.
  const [active, setActive] = useState(-1)

  const results = useMemo(() => {
    const needle = fold(q.trim())
    if (!needle) return []
    const groupName = new Map(groups.map((g) => [g.id, g.name]))
    return tables
      .filter((t) => fold(t.name).includes(needle))
      .slice(0, 8)
      .map((t) => ({ table: t, group: groupName.get(t.workGroupId) }))
  }, [q, tables, groups])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== "/" || e.metaKey || e.ctrlKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const open = (tableId: string) => {
    navigate(`/tables/${tableId}`)
    setQ("")
    inputRef.current?.blur()
    onNavigate?.()
  }

  return (
    <div className="group relative">
      <HugeiconsIcon icon={SearchIcon} className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-sidebar-foreground/45 transition-colors group-focus-within:text-sidebar-foreground/70" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(-1)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQ("")
            e.currentTarget.blur()
          } else if (e.key === "ArrowDown" && results.length) {
            e.preventDefault()
            setActive((i) => (i + 1) % results.length)
          } else if (e.key === "ArrowUp" && results.length) {
            e.preventDefault()
            setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
          } else if (e.key === "Enter" && results.length) {
            open(results[Math.max(active, 0)].table.id)
          }
        }}
        placeholder="Tìm kiếm trong không gian làm việc..."
        aria-label="Tìm kiếm trong không gian làm việc"
        className="h-8 w-full rounded-md border border-sidebar-border bg-background pr-10 pl-8 text-sm text-sidebar-foreground transition-colors outline-none placeholder:text-sidebar-foreground/40 focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/30"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 inline-flex h-5 -translate-y-1/2 items-center rounded border border-sidebar-border px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/50">
        /
      </kbd>

      {q.trim() && (
        <div role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {results.length ? (
            results.map(({ table, group }, i) => (
              <button
                key={table.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                // mousedown keeps the input from blurring before the click lands
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => open(table.id)}
                className={cn("flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left", i === active && "bg-accent")}
              >
                <TableIcon icon={table.icon} color={table.iconColor} plain />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{table.name}</span>
                  {group && <span className="block truncate text-xs text-muted-foreground">{group}</span>}
                </span>
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">Không tìm thấy kết quả</p>
          )}
        </div>
      )}
    </div>
  )
}
