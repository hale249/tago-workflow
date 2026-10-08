import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Plus, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { formatDate, formatRelative } from "@/lib/format"
import { recordLabel } from "../api/tables.api"
import { useDeleteRecords, useRecord, useTable, useWorkspaceUsers } from "../api/tables.queries"
import { CommentsPanel } from "./comments-panel"
import { ConfirmDialog } from "./confirm-dialog"
import { UserChip } from "./field-value"
import { InlineField } from "./inline-field"
import { ItemsEditor } from "./items-editor"
import { RecordActionsMenu } from "./record-actions-menu"
import { RelatedRecords } from "./related-records"
import type { TableAction, TableField } from "../types/table"
import { pinnedSumsOf, valueToText } from "../utils/fields"

type Props = {
  tableId: string
  recordId: string
  /** "page" = full route with breadcrumb; "drawer" = quick view inside the records list. */
  mode: "page" | "drawer"
  onClose?: () => void
  /** Drawer navigation through the current list (↑ / ↓). */
  nav?: { index: number; total: number; prev?: () => void; next?: () => void }
}

/** Record header + fields / related tabs + comments, shared by the detail page and the quick-view drawer. */
export function RecordDetailView({ tableId, recordId, mode, onClose, nav }: Props) {
  const drawer = mode === "drawer"
  const navigate = useNavigate()
  const { data: table } = useTable(tableId)
  const { data: record, error } = useRecord(tableId, recordId)
  const { data: users = [] } = useWorkspaceUsers()
  const remove = useDeleteRecords(tableId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState("detail")
  const [flash, setFlash] = useState("")
  useEffect(() => { setTab("detail") }, [recordId])
  const fullUrl = `/tables/${tableId}/records/${recordId}`

  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Bản ghi không tồn tại hoặc đã bị xoá. {drawer ? <button type="button" onClick={onClose} className="text-brand hover:underline">Đóng</button> : <Link to={`/tables/${tableId}`} className="text-brand hover:underline">Quay lại bảng</Link>}</p>
  if (!table || !record) return <div className="space-y-3 p-6"><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-64 w-full" /></div>

  const byName = (n: string) => table.config.fields.find((f) => f.name === n)
  const detail = table.config.recordDetail
  const title = String(record.record[detail.headTitleField] || "(Không tiêu đề)")
  const subLine = detail.headSubLineFields.map(byName).filter((f): f is TableField => !!f)
  // Sub-line is plain text like the reference ("KH00006 · Tiếp cận · Honda Air Blade 160").
  const subText = subLine.map((f) => valueToText(f, record.record[f.name], { users, recordLabel })).filter(Boolean)
  const rows = (detail.rowTailFields.length ? detail.rowTailFields : table.config.fields.map((f) => f.name)).map(byName).filter((f): f is TableField => !!f)
  const sumTargets = new Set(table.config.items.enabled ? table.config.items.sums.map((s) => s.sumField) : [])
  const readOnly = (f: TableField) => f.type === "AUTO_GENERATED_CODE" || !!f.isLocked || sumTargets.has(f.name)
  const tabs = [{ id: "detail", title: "Chi tiết" }, ...detail.refRecords.map((r, i) => ({ id: `ref${i}`, title: r.title }))]
  const ref = detail.refRecords[Number(tab.replace("ref", ""))]
  const runAction = (a: TableAction) => {
    setFlash(`Đã gửi yêu cầu chạy “${a.name}” cho ${recordLabel(table.id, record.id)}`)
    setTimeout(() => setFlash(""), 3500)
  }

  const heading = (
    <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
      <h1 className={cn("truncate font-semibold", drawer ? "text-base leading-6" : "text-xl leading-7")}>{title}</h1>
      {subText.length > 0 && (
        <p className="truncate text-[13px] text-muted-foreground">
          {subText.map((t, i) => (
            <span key={i} className="inline-flex max-w-[200px] items-center align-bottom">
              {i > 0 && <span className="mx-1 text-muted-foreground/60">·</span>}
              <span className="truncate">{t}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  )
  const actions = <RecordActionsMenu table={table} onEdit={() => navigate(`${fullUrl}/edit`)} onDelete={() => setConfirmOpen(true)} onRun={runAction} />

  const fields = (
    <div className="min-w-0 flex-1">
      <div role="tablist" className="no-scrollbar mb-4 flex overflow-x-auto border-b">
        {tabs.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn("relative -mb-px inline-flex h-10 max-w-[200px] shrink-0 items-center border-b-2 px-3 text-sm transition-colors", tab === t.id ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <span className="truncate">{t.title}</span>
          </button>
        ))}
      </div>
      {flash && <p className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="size-4" />{flash}</p>}

      {tab === "detail" ? (
        <div className="space-y-6">
          {/* Container query: label beside value when there is room, stacked in the narrow drawer column. */}
          <dl className="@container -mx-2 flex flex-col gap-0.5">
            {rows.map((f) => (
              <div key={f.name} className={cn("grid min-h-9 grid-cols-1 items-start gap-x-3 gap-y-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50", f.type !== "RICH_TEXT" && "@xl:grid-cols-[minmax(104px,180px)_minmax(0,1fr)] @xl:gap-y-0")}>
                <dt className="text-[13px] leading-5 font-medium text-muted-foreground @xl:truncate">{f.label}{f.required && <span className="ml-1 text-destructive" aria-label="bắt buộc">*</span>}</dt>
                <dd className="min-w-0 text-sm"><InlineField tableId={table.id} record={record} field={f} users={users} readOnly={readOnly(f)} /></dd>
              </div>
            ))}
          </dl>
          {table.config.items.enabled && (
            <div className="border-t pt-6"><ItemsEditor config={table.config.items} items={record.items ?? []} users={users} parent={record.record} pinnedSums={pinnedSumsOf(table.config.items, record.record)} /></div>
          )}
          {(record.assignedUserIds?.length || record.relatedUserIds?.length) ? (
            <div className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
              {[["Người được giao", record.assignedUserIds ?? []], ["Người liên quan", record.relatedUserIds ?? []]].map(([label, ids]) => (
                <div key={label as string}>
                  <p className="mb-1 text-[13px] font-medium text-muted-foreground">{label as string}</p>
                  <div className="flex flex-wrap gap-2">
                    {(ids as string[]).length ? (ids as string[]).map((id) => <UserChip key={id} user={users.find((u) => u.id === id)} />) : <span className="text-muted-foreground/60">—</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <p className="flex flex-wrap items-center gap-1 border-t pt-3 text-xs text-muted-foreground">
            Tạo bởi <UserChip user={users.find((u) => u.id === record.createdBy)} /> · {formatDate(record.createdAt)}
            {record.updatedAt && <> · cập nhật {formatRelative(record.updatedAt)}</>}
          </p>
        </div>
      ) : ref ? (
        <RelatedRecords config={ref} recordId={record.id} users={users} />
      ) : null}
    </div>
  )

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Xoá bản ghi này?"
      description="Bản ghi và bình luận sẽ bị xoá vĩnh viễn."
      pending={remove.isPending}
      onConfirm={() => remove.mutate([record.id], { onSuccess: () => (drawer ? onClose?.() : navigate(`/tables/${table.id}`, { replace: true })) })}
    />
  )

  if (drawer)
    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <header className="flex min-w-0 items-start gap-2 border-b px-4 py-3">
          {heading}
          <div className="flex shrink-0 items-center gap-1">
            {nav && nav.total > 1 && (
              <div className="mr-1 flex items-center gap-0.5 text-xs text-muted-foreground">
                <Button size="icon-sm" variant="ghost" className="size-7" disabled={!nav.prev} onClick={nav.prev} title="Bản ghi trước (↑)" aria-label="Bản ghi trước"><ChevronUp /></Button>
                <Button size="icon-sm" variant="ghost" className="size-7" disabled={!nav.next} onClick={nav.next} title="Bản ghi sau (↓)" aria-label="Bản ghi sau"><ChevronDown /></Button>
                <span className="tabular-nums">{nav.index + 1}/{nav.total}</span>
              </div>
            )}
            <Button asChild variant="outline" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2 max-sm:size-7 max-sm:px-0" title="Mở trang chi tiết (giữ Ctrl/⌘ để mở tab mới)">
              <Link to={fullUrl}><ArrowUpRight className="size-3.5" /><span className="max-sm:sr-only">Mở trang chi tiết</span></Link>
            </Button>
            {actions}
            <Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground" onClick={onClose} aria-label="Đóng" title="Đóng (Esc)"><X /></Button>
          </div>
        </header>
        <div className="flex min-h-0 max-md:flex-col max-md:overflow-y-auto">
          <div className="min-w-0 flex-1 overflow-y-auto p-4 max-md:overflow-visible">{fields}</div>
          <aside className="flex min-h-[420px] flex-col border-t md:w-[400px] md:shrink-0 md:border-t-0 md:border-l">
            <CommentsPanel recordId={record.id} users={users} />
          </aside>
        </div>
        {confirm}
      </div>
    )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl min-w-0 items-start gap-3 px-4 py-3">
          <Button asChild size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Quay lại"><Link to={`/tables/${table.id}`}><ChevronLeft /></Link></Button>
          {heading}
          <div className="flex shrink-0 items-center gap-2">
            <Button className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2 max-sm:size-7 max-sm:px-0" onClick={() => navigate(`/tables/${table.id}/records/new`)} aria-label="Tạo mới">
              <Plus className="size-3.5" /><span className="max-sm:sr-only">Tạo mới</span>
            </Button>
            {actions}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 py-2 text-[13px]">
          <Link to="/tables" className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"><Home className="size-3.5" /><span className="text-foreground">Apps</span></Link>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Link to={`/tables/${table.id}`} aria-current="page" className="font-medium hover:underline">{table.name}</Link>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row">
          {fields}
          <aside className="w-full scroll-mt-20 lg:w-[400px] lg:shrink-0">
            <div className="flex h-[480px] flex-col rounded-lg border lg:sticky lg:top-[88px] lg:h-[calc(100svh-168px)] lg:rounded-none lg:border-y-0 lg:border-r-0">
              <CommentsPanel recordId={record.id} users={users} />
            </div>
          </aside>
        </div>
      </div>
      {confirm}
    </div>
  )
}
