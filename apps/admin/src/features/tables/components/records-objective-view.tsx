import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, ExternalLink, RotateCw, Target } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { formatDate } from "@/lib/format"
import { recordsQuery, tableQuery } from "../api/tables.queries"
import type { ActiveTable, ObjectiveCardConfig, ObjectiveList, TableRecord, WorkspaceUser } from "../types/table"
import { formatNumber, isBlank } from "../utils/fields"
import { FieldValue, UserChip } from "./field-value"
import { EmptyBox } from "./settings-card"

type Props = { table: ActiveTable; config: ObjectiveCardConfig; records: TableRecord[]; users: WorkspaceUser[]; onOpen: (r: TableRecord) => void }

function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", v >= 100 ? "bg-emerald-500" : "bg-brand")} style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{formatNumber(v, 0)}%</span>
    </div>
  )
}

const fmtDate = (v: unknown) => (isBlank(v as string) ? "—" : formatDate(String(v)))

/** One collapsible related list; data loads only once it is opened. */
function RelatedSection({ list, objectiveId, users }: { list: ObjectiveList; objectiveId: string; users: WorkspaceUser[] }) {
  const [open, setOpen] = useState(false)
  const { data: t } = useQuery({ ...tableQuery(list.tableId), enabled: open })
  const q = useQuery({ ...recordsQuery(list.tableId, { filters: { [list.relationField]: objectiveId } }), enabled: open })
  const field = (n: string) => t?.config.fields.find((f) => f.name === n)
  const items = (q.data ?? []).slice(0, list.limit)
  const title = (r: TableRecord) => String(r.record[list.titleField || t?.config.recordDetail.headTitleField || ""] || "(Không tiêu đề)")

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Thu gọn mục liên quan" : "Mở mục liên quan"}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="flex-1 font-medium">{list.name || "Chưa đặt tên"}</span>
        {open && q.data && <span className="text-xs text-muted-foreground">{q.data.length}</span>}
        {!open && <span className="text-xs text-muted-foreground">Mở để tải dữ liệu liên quan</span>}
      </button>
      {open && (
        <div className="border-t">
          {q.isLoading ? (
            <div className="space-y-2 p-3"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
          ) : q.error ? (
            <div className="flex items-center justify-between p-3 text-sm text-destructive">
              Không thể tải mục liên quan.
              <Button size="xs" variant="outline" onClick={() => q.refetch()}><RotateCw />Thử tải lại</Button>
            </div>
          ) : !items.length ? (
            <p className="p-3 text-center text-xs text-muted-foreground">Chưa có bản ghi liên quan.</p>
          ) : (
            <ul className="divide-y">
              {items.map((r) => {
                const status = field(list.statusField)
                const cur = list.currentField ? Number(r.record[list.currentField]) : NaN
                const target = list.targetField ? Number(r.record[list.targetField]) : NaN
                const unit = list.unitField && field(list.unitField) ? r.record[list.unitField] : null
                const progress = list.progressField ? Number(r.record[list.progressField]) || 0 : !Number.isNaN(cur) && target ? (cur / target) * 100 : null
                return (
                  <li key={r.id} className="space-y-1.5 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{title(r)}</span>
                      {status && <FieldValue field={status} value={r.record[status.name]} users={users} />}
                      <Button asChild size="icon-xs" variant="ghost" aria-label="Mở bản ghi liên quan">
                        <Link to={`/tables/${list.tableId}/records/${r.id}`}><ExternalLink /></Link>
                      </Button>
                    </div>
                    {progress != null && <Progress value={progress} />}
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {!Number.isNaN(cur) && (
                        <span>
                          {formatNumber(cur, 0)}{!Number.isNaN(target) && ` / ${formatNumber(target, 0)}`} {unit ? String(unit) : ""}
                        </span>
                      )}
                      {(list.startField || list.endField) && <span>{fmtDate(r.record[list.startField])} → {fmtDate(r.record[list.endField])}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** Objective cards: one per record of the current table, with lazily loaded Key Result lists. */
export function RecordsObjectiveView({ table, config, records, users, onOpen }: Props) {
  const o = config.objective
  const field = (n: string) => table.config.fields.find((f) => f.name === n)
  const statusField = field(o.statusField)

  if (!records.length) return <div className="p-6"><EmptyBox icon={<Target className="size-8" />} title="Không có mục tiêu nào phù hợp với bộ lọc hiện tại." /></div>

  return (
    <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4 xl:grid-cols-2">
      {records.map((r) => {
        const title = o.titleField ? String(r.record[o.titleField] || "(Không tiêu đề)") : "Chưa chọn field tiêu đề"
        const progress = o.progressField ? Number(r.record[o.progressField]) || 0 : null
        return (
          <article key={r.id} className="flex flex-col rounded-xl border bg-background">
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Target className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onOpen(r)} className="text-left font-semibold hover:underline">{title}</button>
                  {o.descriptionField && !isBlank(r.record[o.descriptionField]) && <p className="line-clamp-2 text-sm text-muted-foreground">{String(r.record[o.descriptionField])}</p>}
                </div>
                {statusField && <FieldValue field={statusField} value={r.record[statusField.name]} users={users} />}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                {o.ownerField && field(o.ownerField) && (
                  <span className="flex items-center gap-1.5">Người phụ trách <FieldValue field={field(o.ownerField)!} value={r.record[o.ownerField]} users={users} /></span>
                )}
                {(o.startField || o.endField) && <span>{fmtDate(r.record[o.startField])} → {fmtDate(r.record[o.endField])}</span>}
              </div>
              {progress != null && <Progress value={progress} />}
            </div>
            {config.lists.length > 0 && (
              <div className="space-y-2 border-t p-4">
                {config.lists.map((l) => <RelatedSection key={l.id} list={l} objectiveId={r.id} users={users} />)}
              </div>
            )}
            <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground sm:grid-cols-4">
              <div><dt>ID</dt><dd className="truncate font-mono text-foreground">{r.id}</dd></div>
              <div><dt>Người tạo</dt><dd><UserChip user={users.find((u) => u.id === r.createdBy)} /></dd></div>
              <div><dt>Tạo lúc</dt><dd className="text-foreground">{formatDate(r.createdAt)}</dd></div>
              <div><dt>Cập nhật lúc</dt><dd className="text-foreground">{r.updatedAt ? formatDate(r.updatedAt) : "—"}</dd></div>
            </dl>
          </article>
        )
      })}
    </div>
  )
}
