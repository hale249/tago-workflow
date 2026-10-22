import { useEffect, useState, type CSSProperties } from "react"
import { Link, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUpRight01Icon, Cancel01Icon, CheckmarkCircle02Icon, FileQuestionMarkIcon, Home01Icon, Message01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { TYPE, typeStyle } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import { recordLabel } from "../api/tables.api"
import { useDeleteRecords, useRecord, useTable, useWorkspaceUsers } from "../api/tables.queries"
import { CommentsPanel } from "./comments-panel"
import { UserChip } from "./field-value"
import { InlineField } from "./inline-field"
import { ItemsEditor } from "./items-editor"
import { RecordActionsMenu } from "./record-actions-menu"
import { RelatedActions, RelatedRecords } from "./related-records"
import type { TableAction, TableField } from "../types/table"
import { isComputed, isLongText, pinnedSumsOf, valueToText } from "../utils/fields"

const H3_STYLE = typeStyle("heading-h3")

type Props = {
  tableId: string
  recordId: string
  /** "page" = full route with breadcrumb; "drawer" = quick view inside the records list. */
  mode: "page" | "drawer"
  onClose?: () => void
}

/** Record header + fields / related tabs + comments, shared by the detail page and the quick-view drawer. */
export function RecordDetailView({ tableId, recordId, mode, onClose }: Props) {
  const drawer = mode === "drawer"
  const navigate = useNavigate()
  const { data: table } = useTable(tableId)
  const { data: record, error } = useRecord(tableId, recordId)
  const { data: users = [] } = useWorkspaceUsers()
  const remove = useDeleteRecords(tableId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState("detail")
  const [flash, setFlash] = useState("")
  const [relCreate, setRelCreate] = useState(false)
  // null = default: the full page starts collapsed like the reference ("Hiện bình luận"), the drawer follows
  // the table's "Vị trí bình luận"; the header button overrides it for this view.
  const [commentsOverride, setCommentsOverride] = useState<boolean | null>(null)
  useEffect(() => { setTab("detail") }, [recordId])
  const fullUrl = `/tables/${tableId}/records/${recordId}`

  if (error && drawer) return <p className="p-8 text-center text-sm text-muted-foreground">Bản ghi không tồn tại hoặc đã bị xoá. <button type="button" onClick={onClose} className="text-brand hover:underline">Đóng</button></p>
  if (error)
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10"><HugeiconsIcon icon={FileQuestionMarkIcon} className="size-8 text-destructive" /></div>
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-xl leading-7 font-semibold text-foreground">Không tìm thấy bản ghi</h2>
              <p className="text-sm text-muted-foreground">Bản ghi bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            </div>
            <div className="flex flex-nowrap items-center gap-4">
              <Button variant="outline" className="h-8 gap-2 px-3 has-[>svg]:px-2.5" onClick={() => navigate(-1)}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />Quay lại</Button>
              <Button asChild className="h-8 gap-1.5 px-3"><Link to={`/tables/${tableId}`}>Quay lại bảng</Link></Button>
            </div>
          </div>
        </div>
      </div>
    )
  if (!table || !record) return <div className="space-y-3 p-6"><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-64 w-full" /></div>

  const byName = (n: string) => table.config.fields.find((f) => f.name === n)
  const detail = table.config.recordDetail
  const title = String(record.record[detail.headTitleField] || "(Không tiêu đề)")
  const subLine = detail.headSubLineFields.map(byName).filter((f): f is TableField => !!f)
  // Sub-line is plain text like the reference ("KH00006 · Tiếp cận · Honda Air Blade 160").
  const subText = subLine.map((f) => valueToText(f, record.record[f.name], { users, recordLabel })).filter(Boolean)
  const pick = (names: string[]) => names.map(byName).filter((f): f is TableField => !!f)
  const rows = pick(detail.rowTailFields.length ? detail.rowTailFields : table.config.fields.map((f) => f.name))
  // Two-column layout splits fields left / right; the narrow drawer always stacks them.
  const left = pick(detail.leftFields ?? []), right = pick(detail.rightFields ?? [])
  // Two columns with nothing assigned yet: split the one-column list instead of showing no fields.
  const columns = detail.layout !== "two-column" ? [rows] : left.length || right.length ? [left, right] : [rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))]
  const showComments = commentsOverride ?? (!drawer ? false : detail.commentsPosition !== "hidden")
  const commentsToggle = (
    <Button size="icon" variant="ghost" className={cn("shrink-0 hover:bg-accent/50 dark:hover:bg-white/5", drawer ? "size-7" : "mt-0.5 size-8")} aria-pressed={showComments}
      aria-label={showComments ? "Ẩn bình luận" : "Hiện bình luận"} title={showComments ? "Ẩn bình luận" : "Hiện bình luận"} onClick={() => setCommentsOverride(!showComments)}>
      <HugeiconsIcon icon={Message01Icon} className={cn("size-4", showComments ? "text-primary" : "text-muted-foreground")} />
    </Button>
  )
  // "Có mặt": workspace members allowed to view this record (by permission, not online status).
  const viewers = users
  const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
  const handle = (n: string) => `@${n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]/g, "")}`
  const presence = viewers.length > 0 && (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Xem ${viewers.length} người có quyền xem bản ghi`} className="flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <span>Có mặt</span>
          <span className="flex items-center -space-x-1.5">
            {viewers.slice(0, 3).map((u) => (
              <span key={u.id} className="relative flex size-6 shrink-0 overflow-hidden rounded-full ring-2 ring-background">
                <span className="grid size-full place-items-center text-[10px] font-semibold text-white" style={{ backgroundColor: u.color }}>{initials(u.fullName)}</span>
              </span>
            ))}
            {viewers.length > 3 && <span className="relative grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">+{viewers.length - 3}</span>}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium text-foreground">{viewers.length} người có quyền xem</p>
          <p className="text-xs text-muted-foreground">Danh sách theo quyền xem bản ghi, không phải trạng thái online.</p>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {viewers.map((u) => (
            <li key={u.id} className="flex items-center gap-2.5 px-3 py-1.5">
              <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: u.color }}>{initials(u.fullName)}</span>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{u.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{handle(u.fullName)}</p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
  const sumTargets = new Set(table.config.items.enabled ? table.config.items.sums.map((s) => s.sumField) : [])
  const readOnly = (f: TableField) => isComputed(f.type) || !!f.isLocked || sumTargets.has(f.name)
  const tabs = [{ id: "detail", title: "Chi tiết" }, ...detail.refRecords.map((r, i) => ({ id: `ref${i}`, title: r.title }))]
  const ref = detail.refRecords[Number(tab.replace("ref", ""))]
  const runAction = (a: TableAction) => {
    setFlash(`Đã gửi yêu cầu chạy “${a.name}” cho ${recordLabel(table.id, record.id)}`)
    setTimeout(() => setFlash(""), 3500)
  }

  const heading = (
    <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-050)] overflow-hidden">
      <h1 className="block truncate font-semibold text-foreground" style={drawer ? H3_STYLE : TYPE.h2}>{title}</h1>
      {subText.length > 0 && (
        <p className="truncate text-[13px] text-muted-foreground">
          {subText.map((t, i) => (
            <span key={i} className="inline-flex max-w-[200px] items-center gap-1 align-bottom">
              {i > 0 && <span className="mx-1 text-muted-foreground/60">·</span>}
              <span className="truncate">{t}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  )
  const actions = <RecordActionsMenu table={table} className="size-7 text-muted-foreground" onEdit={() => navigate(`${fullUrl}/edit`)} onDelete={() => setConfirmOpen(true)} onRun={runAction} />

  const fields = (
    <div className="min-w-0 flex-1">
      <div className="mb-4 border-b">
        <div className="relative flex items-center justify-between gap-2">
          <div role="tablist" className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.id} role="tab" type="button" title={t.title} aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={cn("relative -mb-px inline-flex h-10 max-w-[200px] shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm whitespace-nowrap transition-colors", tab === t.id ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
          {ref && <RelatedActions config={ref} onCreate={() => setRelCreate(true)} />}
        </div>
      </div>
      {flash && <p className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />{flash}</p>}

      {tab === "detail" ? (
        <div className="flex flex-col">
          {/* Container query: label beside value when there is room, stacked in the narrow drawer column. */}
          <div className={cn("grid gap-x-6 gap-y-0.5", columns.length > 1 && !drawer && "lg:grid-cols-2")}>
            {columns.map((col, i) => (
              <dl key={i} className="@container -mx-2 flex flex-col gap-0.5">
                {col.map((f) => (
                  <div key={f.name} className={cn("grid min-h-9 grid-cols-1 items-start gap-x-3 gap-y-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50", !isLongText(f.type) && f.type !== "ATTACHMENT" && "@md:grid-cols-[minmax(104px,180px)_minmax(0,1fr)] @md:gap-y-0")}>
                    <dt className="text-[13px] leading-5 font-medium text-muted-foreground @md:truncate">{f.label}{f.required && <span className="ml-1 text-destructive" aria-label="bắt buộc">*</span>}</dt>
                    <dd className="min-w-0 text-sm"><InlineField tableId={table.id} record={record} field={f} users={users} readOnly={readOnly(f)} /></dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
          {table.config.items.enabled && (
            <div className="mt-8 border-t pt-6"><ItemsEditor config={table.config.items} items={record.items ?? []} users={users} parent={record.record} pinnedSums={pinnedSumsOf(table.config.items, record.record)} /></div>
          )}
          {(record.assignedUserIds?.length || record.relatedUserIds?.length) ? (
            <div className="mt-6 grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
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
        </div>
      ) : ref ? (
        <RelatedRecords config={ref} recordId={record.id} users={users} createOpen={relCreate} onCreateOpenChange={setRelCreate} />
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
        <header className="border-b border-border px-4 py-3 text-left">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            {heading}
            <div className="flex shrink-0 items-start gap-1.5">
              {presence}
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Button asChild variant="outline" className="h-7 gap-1.5 border-input px-2.5 shadow-xs has-[>svg]:px-2" title="Mở trang chi tiết (giữ Ctrl/⌘ để mở tab mới)">
                  <Link to={fullUrl}><HugeiconsIcon icon={ArrowUpRight01Icon} className="h-4 w-4" />Mở trang chi tiết</Link>
                </Button>
                {actions}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                <Button asChild variant="outline" size="icon-sm" className="border-input shadow-xs" aria-label="Mở trang chi tiết" title="Mở trang chi tiết">
                  <Link to={fullUrl}><HugeiconsIcon icon={ArrowUpRight01Icon} className="h-4 w-4" /></Link>
                </Button>
                {actions}
              </div>
              <Button size="icon-sm" variant="ghost" className="shrink-0 text-muted-foreground hover:bg-accent/50 dark:hover:bg-white/5" onClick={onClose} aria-label="Đóng" title="Đóng (Esc)"><HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>
        <div className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 xl:[container-type:size]" style={{ "--comments-panel-width": "400px" } as CSSProperties}>
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="min-w-0 flex-1 space-y-5">{fields}</div>
            {showComments && (
              <aside className="relative w-full min-w-0 scroll-mt-4 rounded-lg border border-border bg-card xl:sticky xl:top-0 xl:-my-4 xl:-mr-4 xl:flex xl:h-[calc(100cqh+2rem)] xl:w-[var(--comments-panel-width)] xl:shrink-0 xl:flex-col xl:rounded-none xl:border-y-0 xl:border-r-0 xl:bg-transparent">
                <CommentsPanel recordId={record.id} users={users} />
              </aside>
            )}
          </div>
        </div>
        {confirm}
      </div>
    )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl min-w-0 items-start gap-3 px-4 py-3">
          <Button asChild size="icon" variant="ghost" className="mt-0.5 size-8 shrink-0 hover:bg-accent/50 dark:hover:bg-white/5" aria-label="Quay lại" title="Quay lại"><Link to={`/tables/${table.id}`}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /></Link></Button>
          {heading}
          {presence}
          {commentsToggle}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Button className="h-7 gap-1.5 px-2.5 shadow-xs has-[>svg]:px-2" onClick={() => navigate(`/tables/${table.id}/records/new`)}>
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" />Tạo mới
            </Button>
            {actions}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            <Button size="icon-sm" className="shadow-xs" onClick={() => navigate(`/tables/${table.id}/records/new`)} aria-label="Tạo bản ghi" title="Tạo bản ghi">
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
            </Button>
            {actions}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-[var(--space-100)] py-2">
            <Link to="/tables" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"><HugeiconsIcon icon={Home01Icon} className="size-3.5" /><span className="text-foreground" style={TYPE.small}>Apps</span></Link>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-muted-foreground" />
            <Link to={`/tables/${table.id}`} aria-current="page" className="text-foreground hover:underline" style={TYPE.small}>{table.name}</Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {fields}
          {showComments && (
            <aside className="w-full scroll-mt-20 lg:w-[400px] lg:shrink-0">
              <div className="flex h-[480px] flex-col rounded-lg border lg:sticky lg:top-[88px] lg:h-[calc(100svh-168px)] lg:rounded-none lg:border-y-0 lg:border-r-0">
                <CommentsPanel recordId={record.id} users={users} />
              </div>
            </aside>
          )}
        </div>
      </div>
      {confirm}
    </div>
  )
}
