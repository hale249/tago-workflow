import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUpDown, ChevronDown, ChevronUp, LayoutGrid, List, MoreHorizontal, Plus, RefreshCw, Rows3, Search, Settings, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { WORKSPACES } from "@/config/navigation"
import { tableKeys, useDeleteTable, useTables, useWorkGroups, useWorkspaceUsers } from "../api/tables.queries"
import { CURRENT_USER_ID } from "../data/seed"
import { ConfirmDialog } from "../components/confirm-dialog"
import { CreateTableDialog } from "../components/create-table-dialog"
import { TableIcon } from "../components/table-icon"
import type { ActiveTable, TableTemplate, WorkspaceUser } from "../types/table"

type ViewMode = "list" | "table" | "grid"
const VIEW_KEY = "tago-apps-view"
const VIEWS: { id: ViewMode; label: string; icon: typeof List }[] = [
  { id: "list", label: "Danh sách", icon: List },
  { id: "table", label: "Bảng", icon: Rows3 },
  { id: "grid", label: "Lưới", icon: LayoutGrid },
]
/** Template label shown under each app, as on the reference. */
const TEMPLATE_LABEL: Record<TableTemplate, string> = {
  BLANK: "Blank",
  CUSTOMER_PIPELINE: "Customer Pipeline",
  TASK_EISENHOWER: "Task Eisenhower",
  INVENTORY: "Inventory",
}

/** Creator's round initials avatar (orange gradient fallback like the reference). */
function CreatorAvatar({ user }: { user?: WorkspaceUser }) {
  const initials = (user?.fullName ?? "?").split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
  return (
    <span
      title={user?.fullName}
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white uppercase"
      style={{ background: user ? user.color : "linear-gradient(135deg, #fb923c, #f97316)" }}
    >
      {initials}
    </span>
  )
}

function TableMenu({ table, onDelete }: { table: ActiveTable; onDelete: () => void }) {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
        <Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100" aria-label="Tuỳ chọn">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => navigate(`/tables/${table.id}/settings`)}><Settings />Cài đặt bảng</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 />Xoá bảng</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TablesPage() {
  const qc = useQueryClient()
  const { data: tables, isLoading, isFetching } = useTables()
  const { data: groups = [] } = useWorkGroups()
  const deleteTable = useDeleteTable()
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [view, setView] = useState<ViewMode>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid" } catch { return "grid" }
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ActiveTable | null>(null)
  const [sort, setSort] = useState<"name" | "fields">("name")
  const [asc, setAsc] = useState(true)
  const { data: users = [] } = useWorkspaceUsers()
  const navigate = useNavigate()
  const changeView = (v: ViewMode) => {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* storage unavailable */ }
  }

  const all = tables ?? []
  const countIn = (gid: string) => all.filter((t) => t.workGroupId === gid).length
  const grouped = useMemo(() => {
    const s = search.trim().toLowerCase()
    const list = all.filter((t) => (!s || t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)) && (!groupFilter || t.workGroupId === groupFilter))
    return groups.map((g) => ({ group: g, tables: list.filter((t) => t.workGroupId === g.id) })).filter((x) => x.tables.length || (!s && !groupFilter))
  }, [all, groups, search, groupFilter])

  const creator = (t: ActiveTable) => users.find((u) => u.id === (t.createdBy ?? CURRENT_USER_ID))
  const tab = (active: boolean) =>
    cn(
      "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
      active ? "bg-brand/8 font-medium text-brand" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
    )
  const sorted = useMemo(
    () =>
      grouped
        .flatMap(({ group, tables: list }) => list.map((t) => ({ t, group })))
        .sort((a, b) => (sort === "fields" ? a.t.config.fields.length - b.t.config.fields.length : a.t.name.localeCompare(b.t.name, "vi")) * (asc ? 1 : -1)),
    [grouped, sort, asc],
  )
  const sortBy = (k: "name" | "fields") => {
    if (sort === k) setAsc(!asc)
    else {
      setSort(k)
      setAsc(true)
    }
  }
  const SortIcon = ({ k }: { k: "name" | "fields" }) =>
    sort !== k ? <ArrowUpDown className="size-3.5 opacity-60" /> : asc ? <ChevronUp className="size-3.5 text-foreground" /> : <ChevronDown className="size-3.5 text-foreground" />

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl leading-8 font-semibold">Apps</h1>
          <p className="text-[13px] text-muted-foreground">Workspace · {WORKSPACES[0]!.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm apps..." className="h-8 pl-8" />
          </div>
          <Button size="icon-sm" variant="outline" aria-label="Làm mới" onClick={() => qc.invalidateQueries({ queryKey: tableKeys.all })}>
            <RefreshCw className={cn(isFetching && "animate-spin")} />
          </Button>
          <Button className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5" onClick={() => setCreateOpen(true)}>
            <Plus />Tạo mới
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-2 border-b pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex flex-nowrap items-center gap-0.5 overflow-x-auto lg:flex-wrap">
          {[{ id: "", name: "Tất cả nhóm", n: all.length }, ...groups.map((g) => ({ id: g.id, name: g.name, n: countIn(g.id) }))].map((g) => (
            <button key={g.id} type="button" onClick={() => setGroupFilter(g.id)} className={tab(groupFilter === g.id)}>
              <span>{g.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{g.n}</span>
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Kiểu hiển thị" className="inline-flex shrink-0 items-center gap-0.5 self-start lg:self-auto">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={view === v.id} title={v.label} onClick={() => changeView(v.id)} className={tab(view === v.id)}>
              <v.icon className="size-3.5" />
              <span className="max-sm:sr-only">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
      {!isLoading && grouped.every((g) => !g.tables.length) && search && <p className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy app nào khớp “{search}”.</p>}

      {!isLoading && view === "table" && sorted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-foreground/8 bg-background">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="h-9 px-3 text-left text-[13px] font-medium whitespace-nowrap text-muted-foreground">
                    <button type="button" onClick={() => sortBy("name")} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">Tên<SortIcon k="name" /></button>
                  </th>
                  <th className="h-9 px-3 text-left text-[13px] font-medium whitespace-nowrap text-muted-foreground max-sm:hidden">Nhóm</th>
                  <th className="h-9 px-3 text-right text-[13px] font-medium whitespace-nowrap text-muted-foreground">
                    <button type="button" onClick={() => sortBy("fields")} className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground">Số trường<SortIcon k="fields" /></button>
                  </th>
                  <th className="h-9 px-3 text-right text-[13px] font-medium whitespace-nowrap text-muted-foreground">Người tạo</th>
                  <th className="h-9 w-10 px-1" />
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {sorted.map(({ t, group }) => (
                  <tr key={t.id} onClick={() => navigate(`/tables/${t.id}`)} className="group cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/60">
                    <td className="h-9 px-3 py-1.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <TableIcon icon={t.icon} color={t.iconColor} className="size-7 rounded-md [&_svg]:size-4" />
                        <span className="truncate font-semibold">{t.name}</span>
                      </div>
                    </td>
                    <td className="h-9 px-3 py-1.5 max-sm:hidden">
                      <span className="inline-flex h-[22px] items-center rounded-md border bg-background px-1.5 text-xs whitespace-nowrap text-muted-foreground">{group.name}</span>
                    </td>
                    <td className="h-9 px-3 py-1.5 text-right tabular-nums">{t.config.fields.length}</td>
                    <td className="h-9 px-3 py-1.5"><div className="flex justify-end"><CreatorAvatar user={creator(t)} /></div></td>
                    <td className="h-9 px-1 py-1.5 text-right" onClick={(e) => e.stopPropagation()}><TableMenu table={t} onDelete={() => setToDelete(t)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && view !== "table" && (
        <div className="flex flex-col gap-6">
          {grouped.map(({ group, tables: list }) => (
            <section key={group.id}>
              <div className={cn("flex items-center justify-between", view === "list" ? "mb-1.5 px-3" : "mb-3")}>
                <h2 className="text-sm font-semibold">{group.name}</h2>
                <span className="text-xs text-muted-foreground">{list.length} app</span>
              </div>

              {view === "list" ? (
                <>
                  <div className="grid grid-cols-[minmax(0,1fr)_80px_56px_32px] items-center gap-3 border-b border-border/60 px-3 pb-2 text-xs font-medium text-muted-foreground">
                    <span>Tên</span>
                    <span className="text-right">Số trường</span>
                    <span className="text-right">Người tạo</span>
                    <span />
                  </div>
                  <div className="mt-1 flex flex-col">
                    {list.map((t) => (
                      <Link key={t.id} to={`/tables/${t.id}`} className="group grid w-full grid-cols-[minmax(0,1fr)_80px_56px_32px] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        <div className="flex min-w-0 items-center gap-3">
                          <TableIcon icon={t.icon} color={t.iconColor} className="size-7 rounded-md [&_svg]:size-4" />
                          <span className="truncate text-sm font-medium">{t.name}</span>
                        </div>
                        <span className="text-right text-sm tabular-nums">{t.config.fields.length}</span>
                        <div className="flex justify-end"><CreatorAvatar user={creator(t)} /></div>
                        <TableMenu table={t} onDelete={() => setToDelete(t)} />
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((t) => (
                    <Link key={t.id} to={`/tables/${t.id}`} className="group flex w-full items-center gap-3 rounded-lg border border-foreground/8 bg-card p-3 transition-colors duration-150 hover:border-foreground/14 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                      <TableIcon icon={t.icon} color={t.iconColor} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-medium">{t.name}</span>
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <span className="truncate">{TEMPLATE_LABEL[t.tableType] ?? t.tableType}</span>
                          <span aria-hidden>·</span>
                          <span className="shrink-0 tabular-nums">{t.config.fields.length} trường</span>
                        </div>
                      </div>
                      <TableMenu table={t} onDelete={() => setToDelete(t)} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <CreateTableDialog open={createOpen} onOpenChange={setCreateOpen} defaultGroupId={groupFilter || undefined} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Xoá bảng “${toDelete?.name}”?`}
        description="Toàn bộ bản ghi và bình luận trong bảng sẽ bị xoá vĩnh viễn."
        pending={deleteTable.isPending}
        onConfirm={() => toDelete && deleteTable.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </section>
  )
}
