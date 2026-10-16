import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpRight01Icon, CalculatorIcon } from "@hugeicons/core-free-icons"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import type { ActiveTable, RecordData, TableAction, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { evaluateSummary, formatNumber, isLongText } from "../utils/fields"
import { FieldTypeIcon } from "./field-type-icon"
import { FieldValue } from "./field-value"
import { RecordActionsMenu } from "./record-actions-menu"

type Props = {
  table: ActiveTable
  records: TableRecord[]
  users: WorkspaceUser[]
  isLoading?: boolean
  /** Record open in the quick-view drawer (highlighted). */
  activeId?: string | null
  selectedIds: string[]
  /** Column-header sort (click a header to sort by that field). */
  sort?: { field: string; dir: "asc" | "desc" } | null
  onSort?: (field: string) => void
  onSelectionChange: (ids: string[]) => void
  onOpen: (r: TableRecord, e?: { metaKey?: boolean; ctrlKey?: boolean }) => void
  onEdit: (r: TableRecord) => void
  onDelete: (r: TableRecord) => void
  onRun: (r: TableRecord, a: TableAction, input: RecordData) => void
}

// Reference widths: first column 220px, people 200px, everything else 150px.
/** Minimum width per column type; a width set in the field config is kept exact. */
const minWidth = (f: TableField, first: boolean) =>
  first ? 220 : f.type.includes("WORKSPACE_USER") ? 200 : isLongText(f.type) ? 260 : f.type === "ATTACHMENT" || f.type === "SELECT_LIST_RECORD" ? 200 : f.type === "DATETIME" ? 170 : f.type === "DATE" ? 130 : 150
// Data columns share any spare width (like the reference's table-fixed at 100%), so the ⋮ column stays a narrow 48px at the edge.
const columnWidth = (f: TableField, first: boolean) => (f.columnWidth ? `${f.columnWidth}px` : `minmax(${minWidth(f, first)}px, 1fr)`)

/** Native-looking checkbox like the reference (#767676 frame, 2px radius). */
const CHECKBOX = "rounded-[3px] border-[#767676] shadow-none dark:border-[#858585] dark:not-data-[state=checked]:bg-[#3b3b3b]"

const CARD_LABEL = "text-[11px] font-medium tracking-wide text-muted-foreground uppercase"

/** Totals use two decimals like the reference ("1.000,00"). */
const fmtTotal = (v: number) => formatNumber(v, 2)

export function RecordsListView({ table, records, users, isLoading, activeId, selectedIds, sort, onSort, onSelectionChange, onOpen, onEdit, onDelete, onRun }: Props) {
  const fieldMap = new Map(table.config.fields.map((f) => [f.name, f]))
  const columns = table.config.recordList.displayFields.map((n) => fieldMap.get(n)).filter((f): f is TableField => !!f)
  const gridTemplateColumns = ["40px", ...columns.map((c, i) => columnWidth(c, i === 0)), "48px"].join(" ")
  // Fill the container; scroll horizontally only when the minimum widths don't fit.
  const minTotal = 40 + 48 + columns.reduce((n, c, i) => n + (c.columnWidth ?? minWidth(c, i === 0)), 0)
  const allSelected = records.length > 0 && records.every((r) => selectedIds.includes(r.id))
  const someSelected = !allSelected && records.some((r) => selectedIds.includes(r.id))
  const summaries = table.config.recordList.totalSumFields
  const totals = summaries.map((s, i) => {
    const v = evaluateSummary(s.formula, records)
    return (
      <span key={i} className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground">{s.label}:</span>
        <span className="text-[13px] font-semibold text-foreground tabular-nums select-text">{v == null ? "—" : fmtTotal(v)}</span>
      </span>
    )
  })

  return (
    <div className="relative flex min-h-0 flex-1 flex-col max-md:pb-32">
      {/* Mobile (reference): a select-all card, then one card per record (title + three fields). */}
      <div className="space-y-3 md:hidden">
        <div className="sticky top-0 z-10 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <label className="flex min-w-0 cursor-pointer items-center gap-3">
            <Checkbox className={CHECKBOX} aria-label="Chọn bản ghi" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(v) => onSelectionChange(v ? records.map((r) => r.id) : [])} />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Chọn bản ghi</span>
              <span className="block text-xs text-muted-foreground">Chọn tất cả {records.length} bản ghi</span>
            </span>
          </label>
        </div>
        {isLoading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
        {!isLoading && records.map((r) => {
          const selected = selectedIds.includes(r.id)
          const [head, ...rest] = columns
          return (
            <div key={r.id} role="button" tabIndex={0} onClick={(e) => onOpen(r, e)} onKeyDown={(e) => e.key === "Enter" && onOpen(r)}
              className={cn("group relative cursor-pointer rounded-lg border border-border bg-card p-3 text-card-foreground transition-colors hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none", (selected || r.id === activeId) && "bg-primary/[0.06]")}>
              <div className="absolute top-2 right-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button type="button" aria-label="Mở xem nhanh" title="Mở xem nhanh" onClick={(e) => onOpen(r, e)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none">
                  <HugeiconsIcon icon={ArrowUpRight01Icon} className="h-3.5 w-3.5" />
                </button>
                <RecordActionsMenu table={table} className="size-7 text-muted-foreground" onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onRun={(a, input) => onRun(r, a, input)} />
              </div>
              <div className="flex items-start gap-3 pr-[4.5rem]">
                <span onClick={(e) => e.stopPropagation()} className="mt-0.5 flex">
                  <Checkbox className={CHECKBOX} aria-label="Chọn bản ghi" checked={selected} onCheckedChange={(v) => onSelectionChange(v ? [...selectedIds, r.id] : selectedIds.filter((x) => x !== r.id))} />
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  {head && (
                    <div className="space-y-1">
                      <div className={CARD_LABEL}>{head.label}</div>
                      <div className="min-w-0 truncate text-sm leading-tight font-semibold text-foreground"><FieldValue field={head} value={r.record[head.name]} users={users} className="min-w-0 truncate" /></div>
                    </div>
                  )}
                  {rest.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {rest.slice(0, 3).map((c) => (
                        <div key={c.name} className="min-w-0 space-y-1">
                          <div className={cn(CARD_LABEL, "truncate")}>{c.label}</div>
                          <div className="min-w-0 truncate text-sm leading-snug text-foreground"><FieldValue field={c} value={r.record[c.name]} users={users} className="min-w-0 truncate" /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {!isLoading && !records.length && <div className="py-16 text-center text-sm text-muted-foreground">Chưa có bản ghi nào</div>}
      </div>

      <div className="min-h-0 overflow-auto rounded-lg border bg-background max-md:hidden">
        <div role="table" className="text-sm" style={{ width: `max(100%, ${minTotal}px)` }}>
          <div role="row" className="sticky top-0 z-20 grid h-[37px] border-b border-border bg-background" style={{ gridTemplateColumns }}>
            <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/70 bg-background">
              <Checkbox className={CHECKBOX} aria-label="Chọn tất cả" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(v) => onSelectionChange(v ? records.map((r) => r.id) : [])} />
            </div>
            {columns.map((c) => (
              <div key={c.name} role="columnheader" aria-sort={sort?.field === c.name ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className="flex min-w-0 items-center border-r border-border/70 px-3 text-[13px] font-medium text-muted-foreground">
                <button type="button" onClick={() => onSort?.(c.name)} disabled={!onSort} className="-ml-2 flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none">
                  <span className="flex w-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-left">
                    <FieldTypeIcon type={c.type} className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{c.label}</span>
                  </span>
                  {sort?.field === c.name && <HugeiconsIcon icon={sort.dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon} className="size-3.5 shrink-0 text-foreground" />}
                </button>
              </div>
            ))}
            <div className="sticky right-0 z-10 bg-background" />
          </div>

          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="grid h-[37px] items-center border-b border-border/70 px-3"><Skeleton className="h-4 w-full" /></div>)
            : records.map((r) => {
                const selected = selectedIds.includes(r.id)
                return (
                  <div key={r.id} role="row" onClick={(e) => onOpen(r, e)} onAuxClick={(e) => e.button === 1 && onOpen(r, { metaKey: true })} className={cn("group grid h-[37px] cursor-pointer border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/60", (selected || r.id === activeId) && "bg-primary/[0.06]")} style={{ gridTemplateColumns }}>
                    <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/70 bg-background" onClick={(e) => e.stopPropagation()}>
                      <Checkbox className={CHECKBOX} aria-label="Chọn bản ghi" checked={selected} onCheckedChange={(v) => onSelectionChange(v ? [...selectedIds, r.id] : selectedIds.filter((x) => x !== r.id))} />
                    </div>
                    {columns.map((c, i) => (
                      <div key={c.name} role="cell" className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden border-r border-border/70 px-3 py-1 whitespace-nowrap", i === 0 && "font-medium")}>
                        <FieldValue field={c} value={r.record[c.name]} users={users} className="min-w-0 truncate" />
                        {i === 0 && (
                          <button
                            type="button"
                            title="Xem nhanh (Ctrl/⌘ + click: mở trang chi tiết ở tab mới)"
                            aria-label="Mở xem nhanh"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpen(r, e)
                            }}
                            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 text-xs font-medium text-muted-foreground opacity-0 shadow-surface transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none [@media(hover:none)]:opacity-100"
                          >
                            <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3 shrink-0" /><span>Mở</span>
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="sticky right-0 z-10 flex items-center justify-center bg-background" onClick={(e) => e.stopPropagation()}>
                      <RecordActionsMenu table={table} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onRun={(a, input) => onRun(r, a, input)} />
                    </div>
                  </div>
                )
              })}

          {!isLoading && !records.length && <div className="sticky left-0 w-[min(100vw,100%)] py-16 text-center text-sm text-muted-foreground">Chưa có bản ghi nào</div>}
        </div>
      </div>

      {summaries.length > 0 && (
        <div className="flex h-10 shrink-0 items-center border-t bg-background/95 px-4 max-md:hidden">
          <span className="mr-4 flex shrink-0 items-center gap-2 border-r pr-4 text-muted-foreground"><HugeiconsIcon icon={CalculatorIcon} className="size-3.5" /><span className="text-xs font-medium">Tổng hợp</span></span>
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-6 overflow-x-auto whitespace-nowrap">{totals}</div>
        </div>
      )}
      {/* Mobile: totals dock fixed to the bottom of the screen. */}
      {summaries.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-w-[100vw] overflow-hidden border-t border-border bg-background/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-[0_-8px_24px_rgb(0_0_0/0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
          <div className="flex min-w-0 flex-col gap-3 px-4 py-3">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/70 pb-2 text-muted-foreground"><HugeiconsIcon icon={CalculatorIcon} className="h-3.5 w-3.5" /><span className="text-xs font-medium">Tổng hợp</span></div>
            <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
              <div className="grid min-w-max gap-3 sm:grid-cols-2">{totals}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
