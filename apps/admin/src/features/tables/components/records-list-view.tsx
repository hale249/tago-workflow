import { ArrowUpRight, Sigma } from "lucide-react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import type { ActiveTable, RecordData, TableAction, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { evaluateSummary, formatNumber } from "../utils/fields"
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
  onSelectionChange: (ids: string[]) => void
  onOpen: (r: TableRecord, e?: { metaKey?: boolean; ctrlKey?: boolean }) => void
  onEdit: (r: TableRecord) => void
  onDelete: (r: TableRecord) => void
  onRun: (r: TableRecord, a: TableAction, input: RecordData) => void
}

// Reference widths: first column 220px, people 200px, everything else 150px.
const columnWidth = (f: TableField, first: boolean) =>
  f.columnWidth ? `${f.columnWidth}px` : first ? "220px" : f.type.includes("WORKSPACE_USER") ? "200px" : f.type === "RICH_TEXT" ? "260px" : "150px"

/** Totals use two decimals like the reference ("1.000,00"). */
const fmtTotal = (v: number) => formatNumber(v, 2)

export function RecordsListView({ table, records, users, isLoading, activeId, selectedIds, onSelectionChange, onOpen, onEdit, onDelete, onRun }: Props) {
  const fieldMap = new Map(table.config.fields.map((f) => [f.name, f]))
  const columns = table.config.recordList.displayFields.map((n) => fieldMap.get(n)).filter((f): f is TableField => !!f)
  const gridTemplateColumns = ["40px", ...columns.map((c, i) => columnWidth(c, i === 0)), "48px"].join(" ")
  const allSelected = records.length > 0 && records.every((r) => selectedIds.includes(r.id))
  const someSelected = !allSelected && records.some((r) => selectedIds.includes(r.id))
  const summaries = table.config.recordList.totalSumFields

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 overflow-auto rounded-lg border bg-background">
        <div role="table" className="min-w-full text-sm" style={{ width: "max-content" }}>
          <div role="row" className="sticky top-0 z-20 grid h-9 border-b bg-background" style={{ gridTemplateColumns }}>
            <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/70 bg-background">
              <Checkbox aria-label="Chọn tất cả" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(v) => onSelectionChange(v ? records.map((r) => r.id) : [])} />
            </div>
            {columns.map((c) => (
              <div key={c.name} role="columnheader" className="flex min-w-0 items-center gap-1.5 border-r border-border/70 px-3 text-[13px] font-medium text-muted-foreground">
                <FieldTypeIcon type={c.type} className="size-3.5 shrink-0" />
                <span className="truncate">{c.label}</span>
              </div>
            ))}
            <div className="sticky right-0 z-10 bg-background" />
          </div>

          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="grid h-9 items-center border-b border-border/70 px-3"><Skeleton className="h-4 w-full" /></div>)
            : records.map((r) => {
                const selected = selectedIds.includes(r.id)
                return (
                  <div key={r.id} role="row" onClick={(e) => onOpen(r, e)} onAuxClick={(e) => e.button === 1 && onOpen(r, { metaKey: true })} className={cn("group grid h-9 cursor-pointer border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/60", (selected || r.id === activeId) && "bg-brand/6")} style={{ gridTemplateColumns }}>
                    <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/70 bg-background" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label="Chọn bản ghi" checked={selected} onCheckedChange={(v) => onSelectionChange(v ? [...selectedIds, r.id] : selectedIds.filter((x) => x !== r.id))} />
                    </div>
                    {columns.map((c, i) => (
                      <div key={c.name} role="cell" className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden border-r border-border/70 px-3 whitespace-nowrap", i === 0 && "font-medium")}>
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
                            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 text-xs font-medium text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100"
                          >
                            <ArrowUpRight className="size-3" />Mở
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
        <div className="flex h-10 shrink-0 items-center border-t bg-background/95 px-4">
          <span className="mr-4 flex shrink-0 items-center gap-2 border-r pr-4 text-muted-foreground"><Sigma className="size-3.5" /><span className="text-xs font-medium">Tổng hợp</span></span>
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-6 overflow-x-auto whitespace-nowrap">
            {summaries.map((s, i) => {
              const v = evaluateSummary(s.formula, records)
              return (
                <span key={i} className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{s.label}:</span>
                  <span className="text-[13px] font-semibold tabular-nums select-text">{v == null ? "—" : fmtTotal(v)}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
