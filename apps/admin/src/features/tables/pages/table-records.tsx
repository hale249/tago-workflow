import { useDeferredValue, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowDataTransferHorizontalIcon, ArrowLeft01Icon, Cancel01Icon, ChartGanttIcon, CheckmarkCircle02Icon, Delete02Icon, Download01Icon, FlashIcon, KanbanIcon, ListViewIcon, Search01Icon, Settings02Icon, SortByDown01Icon, SortByUp01Icon, Target01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { recordLabel } from "../api/tables.api"
import { useDeleteRecords, useRecords, useTable, useWorkspaceUsers } from "../api/tables.queries"
import { AdvancedFilterButton } from "../components/advanced-filter-dialog"
import { ConfirmDialog } from "../components/confirm-dialog"
import { CreatorFilter, DateRangeFilter } from "../components/created-filters"
import { NativeSelect } from "../components/form-controls"
import { QuickFilters } from "../components/quick-filters"
import { RecordQuickView } from "../components/record-quick-view"
import { RecordsConversionView } from "../components/records-conversion-view"
import { RecordsGanttView } from "../components/records-gantt-view"
import { RecordsKanbanView } from "../components/records-kanban-view"
import { RecordsListView } from "../components/records-list-view"
import { RecordsObjectiveView } from "../components/records-objective-view"
import { RecordsPivotView } from "../components/records-pivot-view"
import { PivotIcon } from "@/components/icons"
import { TableIcon } from "../components/table-icon"
import { useTableViewStore } from "../store/table-view.store"
import type { ActiveTable, RecordData, TableAction, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { valueToText } from "../utils/fields"

function exportCsv(table: ActiveTable, records: TableRecord[], users: WorkspaceUser[]) {
  const fields = table.config.fields
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const rows = [fields.map((f) => esc(f.label)).join(",")]
  for (const r of records) rows.push(fields.map((f) => esc(valueToText(f, r.record[f.name], { users, recordLabel }))).join(","))
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${table.name}.csv` })
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Short-lived confirmation banner (e.g. after running a custom action). */
function useFlash() {
  const [msg, setMsg] = useState("")
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(""), 3500)
    return () => clearTimeout(t)
  }, [msg])
  return [msg, setMsg] as const
}

const BTN7 = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2"

export function TableRecordsPage() {
  const { tableId = "" } = useParams()
  const navigate = useNavigate()
  const { data: table, isLoading: tableLoading, error } = useTable(tableId)
  const { data: users = [] } = useWorkspaceUsers()
  const view = useTableViewStore()
  const screen = view.screens[tableId] ?? table?.config.defaultScreen.screenId ?? "list"
  const filters = view.filters[tableId] ?? {}
  const conditions = view.conditions[tableId] ?? []
  const createdAt = view.createdAt[tableId] ?? null
  const createdBy = view.createdBy[tableId] ?? ""
  const mine = view.mine[tableId] ?? ""
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"asc" | "desc" | undefined>()
  const deferredSearch = useDeferredValue(search)
  const { data: records = [], isLoading } = useRecords(tableId, { search: deferredSearch, filters, conditions, createdAt, createdBy, mine, sort })
  const deleteRecords = useDeleteRecords(tableId)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toDelete, setToDelete] = useState<string[] | null>(null)
  const [flash, setFlash] = useFlash()
  // Quick view lives in the URL (?preview=<id>): shareable, and browser Back closes it.
  const [params, setParams] = useSearchParams()
  const previewId = params.get("preview")
  const setPreview = (id: string | null, replace = false) =>
    setParams((p) => { const n = new URLSearchParams(p); if (id) n.set("preview", id); else n.delete("preview"); return n }, { replace })
  // Opened from this list → closing just steps back, so Back/Forward never re-open a closed drawer.
  const pushedPreview = useRef(false)
  useEffect(() => { if (!previewId) pushedPreview.current = false }, [previewId])
  const closePreview = () => (pushedPreview.current ? navigate(-1) : setPreview(null, true))

  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy bảng. <Link to="/tables" className="text-brand hover:underline">Quay lại</Link></p>
  if (tableLoading || !table) return <Skeleton className="h-full w-full rounded-lg" />

  const c = table.config
  const kanban = c.kanbanConfigs.find((k) => k.id === screen)
  const gantt = c.ganttCharts.find((k) => k.id === screen)
  const pivot = c.pivotConfigs.find((k) => k.id === screen)
  const objective = c.objectiveCards.find((k) => k.id === screen)
  const conversion = c.conversions.find((k) => k.id === screen)
  const special = kanban ?? gantt ?? pivot ?? objective ?? conversion
  const sortField = c.fields.find((f) => f.name === c.recordList.sortField)
  const activeSort = sort ?? (sortField ? c.recordList.sortOrder ?? "asc" : c.defaultSort)
  const hasPeopleRoles = c.fields.some((f) => f.isAssignedUser || f.isRelatedUser)
  const quickFields = c.quickFilters.map((n) => c.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const activeCount = Object.values(filters).filter(Boolean).length + conditions.length + (createdAt ? 1 : 0) + (createdBy ? 1 : 0) + (mine ? 1 : 0)

  // Plain click opens the quick-view drawer; Ctrl/⌘-click opens the full page in a new tab.
  const openRecord = (r: TableRecord, e?: { metaKey?: boolean; ctrlKey?: boolean }) => {
    if (e?.metaKey || e?.ctrlKey) window.open(`/tables/${table.id}/records/${r.id}`, "_blank")
    else {
      if (!previewId) pushedPreview.current = true
      setPreview(r.id, !!previewId)
    }
  }
  const editRecord = (r: TableRecord) => navigate(`/tables/${table.id}/records/${r.id}/edit`)
  const createRecord = (initial?: RecordData) => navigate(`/tables/${table.id}/records/new${initial ? `?init=${encodeURIComponent(JSON.stringify(initial))}` : ""}`)
  const runAction = (r: TableRecord, a: TableAction) => setFlash(`Đã gửi yêu cầu chạy “${a.name}” cho bản ghi ${recordLabel(table.id, r.id)}`)
  const runBulk = (a: TableAction) => setFlash(`Đã gửi yêu cầu chạy “${a.name}” cho ${selectedIds.length} bản ghi`)
  const rowHandlers = { onEdit: editRecord, onDelete: (r: TableRecord) => setToDelete([r.id]), onRun: runAction }

  // Screens are grouped by kind like the reference: one tab per kind, then a picker for the concrete screen.
  const kinds = [
    { id: "list", name: "Danh sách", icon: ListViewIcon, items: [{ id: "list", name: "Danh sách" }] },
    { id: "kanban", name: "Kanban", icon: KanbanIcon, items: c.kanbanConfigs },
    { id: "gantt", name: "Gantt", icon: ChartGanttIcon, items: c.ganttCharts },
    { id: "pivot", name: "Ma trận", icon: PivotIcon, items: c.pivotConfigs },
    { id: "objective", name: "Mục tiêu", icon: Target01Icon, items: c.objectiveCards },
    { id: "conversion", name: "Chuyển đổi", icon: ArrowDataTransferHorizontalIcon, items: c.conversions },
  ].filter((k) => k.items.length > 0)
  const activeKind = kinds.find((k) => k.items.some((i) => i.id === special?.id)) ?? kinds[0]!

  const tab = (active: boolean) =>
    cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors", active ? "bg-brand/8 text-brand" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <header className="flex shrink-0 items-center gap-2">
        <Button asChild size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Quay lại"><Link to="/tables"><HugeiconsIcon icon={ArrowLeft01Icon} /></Link></Button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <TableIcon icon={table.icon} color={table.iconColor} className="size-7 rounded-md [&_svg]:size-4" />
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em] sm:text-2xl">{table.name}</h1>
          </div>
          {table.description && <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground sm:line-clamp-1">{table.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2 max-sm:size-7 max-sm:px-0" aria-label="Cài đặt">
            <Link to={`/tables/${table.id}/settings`}><HugeiconsIcon icon={Settings02Icon} className="size-3.5" /><span className="max-sm:sr-only">Cài đặt</span></Link>
          </Button>
          <Button className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2 max-sm:size-7 max-sm:px-0" onClick={() => createRecord()} aria-label="Tạo mới">
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" /><span className="max-sm:sr-only">Tạo mới</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 items-center gap-3 border-b pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div role="tablist" className="no-scrollbar flex min-w-0 gap-0.5 overflow-x-auto">
              {kinds.map((k) => (
                <button key={k.id} type="button" role="tab" aria-selected={k === activeKind} onClick={() => k !== activeKind && view.setScreen(table.id, k.items[0]!.id)} className={tab(k === activeKind)}>
                  <HugeiconsIcon icon={k.icon} className="size-4" />{k.name}
                </button>
              ))}
            </div>
            {activeKind.id !== "list" && (
              <>
                <span className="h-4 w-px shrink-0 bg-border max-sm:hidden" aria-hidden />
                <NativeSelect className="h-8 w-auto max-w-56 bg-background px-2.5 text-sm" value={special?.id} onChange={(e) => view.setScreen(table.id, e.target.value)} aria-label={`Chọn màn hình ${activeKind.name}`}>
                  {activeKind.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </NativeSelect>
              </>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2.5" onClick={() => exportCsv(table, records, users)}><HugeiconsIcon icon={Download01Icon} /><span className="max-sm:sr-only">Tải xuống</span></Button>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm" className="h-8 pl-8" />
            </div>
            <AdvancedFilterButton fields={c.fields} users={users} value={conditions} onApply={(v) => view.setConditions(table.id, v)} />
            <DateRangeFilter value={createdAt} onChange={(v) => view.setCreatedAt(table.id, v)} />
            <CreatorFilter users={users} value={createdBy} onChange={(v) => view.setCreatedBy(table.id, v)} />
            {hasPeopleRoles && (
              <NativeSelect className={cn("h-8 w-auto bg-background px-2.5 text-sm", mine && "border-brand bg-brand/5")} value={mine} onChange={(e) => view.setMine(table.id, e.target.value as typeof mine)} aria-label="Của tôi">
                <option value="">Tất cả bản ghi</option>
                <option value="assigned">Được giao cho tôi</option>
                <option value="related">Liên quan đến tôi</option>
              </NativeSelect>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 font-normal text-muted-foreground" onClick={() => setSort(activeSort === "desc" ? "asc" : "desc")} title={sortField ? `Sắp xếp theo ${sortField.label}` : "Sắp xếp theo ngày tạo"}>
                {activeSort === "desc" ? <HugeiconsIcon icon={SortByDown01Icon} /> : <HugeiconsIcon icon={SortByUp01Icon} />}
                <span className="max-sm:sr-only">{sortField ? (activeSort === "desc" ? "Giảm dần" : "Tăng dần") : activeSort === "desc" ? "Mới nhất" : "Cũ nhất"}</span>
              </Button>
            </div>
          </div>
          {(quickFields.length > 0 || activeCount > 0) && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bộ lọc nhanh">
              <QuickFilters fields={quickFields} values={filters} users={users} onChange={(f, v) => view.setFilter(table.id, f, v)} />
              {activeCount > 0 && <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => view.clearFilters(table.id)}><HugeiconsIcon icon={Cancel01Icon} />Xoá lọc ({activeCount})</Button>}
            </div>
          )}
        </div>

        {flash && (
          <p className="flex shrink-0 items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />{flash}
          </p>
        )}

        <div className="flex min-h-[400px] flex-1 flex-col">
          {objective ? (
            <RecordsObjectiveView table={table} config={objective} records={records} users={users} onOpen={openRecord} />
          ) : conversion ? (
            <RecordsConversionView table={table} config={conversion} records={records} filters={filters} />
          ) : gantt ? (
            <RecordsGanttView table={table} config={gantt} records={records} onOpen={openRecord} />
          ) : pivot ? (
            <RecordsPivotView table={table} config={pivot} records={records} users={users} />
          ) : kanban ? (
            <RecordsKanbanView table={table} config={kanban} records={records} users={users} onOpen={openRecord} onCreate={createRecord} {...rowHandlers} />
          ) : (
            <>
              {selectedIds.length > 0 && (
                // Bulk bar (reference): count · delete · one button per custom action · clear on the right.
                <div className="mb-3">
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm duration-200 animate-in slide-in-from-bottom-2">
                    <span className="min-w-0 text-sm font-medium text-foreground">Đã chọn {selectedIds.length} bản ghi</span>
                    <div className="hidden h-4 w-px bg-border sm:block" />
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      <Button size="sm" variant="destructive" className={cn(BTN7, "w-full sm:w-auto")} onClick={() => setToDelete(selectedIds)}><HugeiconsIcon icon={Delete02Icon} className="size-4" />Xóa hàng loạt</Button>
                      {c.actions.filter((a) => a.type === "custom").map((a) => (
                        <Button key={a.actionId} size="sm" variant="outline" className={cn(BTN7, "w-full sm:w-auto")} onClick={() => runBulk(a)}><HugeiconsIcon icon={FlashIcon} className="size-4" />{a.name}</Button>
                      ))}
                    </div>
                    <div className="w-full sm:ml-auto sm:w-auto">
                      <Button size="sm" variant="ghost" className={cn(BTN7, "w-full sm:w-auto")} onClick={() => setSelectedIds([])}><HugeiconsIcon icon={Cancel01Icon} className="size-4" />Bỏ chọn</Button>
                    </div>
                  </div>
                </div>
              )}
              <RecordsListView table={table} records={records} activeId={previewId} users={users} isLoading={isLoading} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onOpen={openRecord} {...rowHandlers} />
            </>
          )}
        </div>
      </div>

      <RecordQuickView tableId={table.id} recordId={previewId} records={records} onOpen={(id) => setPreview(id, true)} onClose={closePreview} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Xoá ${toDelete?.length ?? 0} bản ghi?`}
        description="Bản ghi và bình luận liên quan sẽ bị xoá vĩnh viễn."
        pending={deleteRecords.isPending}
        onConfirm={() =>
          toDelete &&
          deleteRecords.mutate(toDelete, {
            onSuccess: () => {
              setSelectedIds((s) => s.filter((id) => !toDelete.includes(id)))
              setToDelete(null)
            },
          })
        }
      />
    </section>
  )
}
