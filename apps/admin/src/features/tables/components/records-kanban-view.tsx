import { useState } from "react"
import { ChevronDown, ChevronsLeftRight, Plus } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { useUpdateRecord } from "../api/tables.queries"
import type { ActiveTable, DateRange, KanbanConfig, RecordData, TableAction, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { rangeBounds } from "../utils/filters"
import { DateRangeFilter } from "./created-filters"
import { RecordActionsMenu } from "./record-actions-menu"
import { FieldValue, UserChip } from "./field-value"

type Column = { key: string; title: React.ReactNode; value: string | boolean; color: string }

const EMPTY = "__empty__"

function buildColumns(field: TableField, users: WorkspaceUser[]): Column[] {
  const none = { key: EMPTY, title: "Chưa phân loại", value: "", color: "#9ca3af" }
  if (field.type === "SELECT_ONE") return [...(field.options ?? []).map((o) => ({ key: o.value, title: o.text, value: o.value, color: o.textColor })), none]
  if (field.type === "SELECT_ONE_WORKSPACE_USER") return [...users.map((u) => ({ key: u.id, title: <UserChip user={u} />, value: u.id, color: u.color })), { ...none, title: "Chưa gán" }]
  return [{ key: "true", title: "Có", value: true, color: "#16a34a" }, { key: "false", title: "Không", value: false, color: "#9ca3af" }]
}

const keyOf = (field: TableField, v: unknown) =>
  field.type === "CHECKBOX_YES_NO" ? String(Boolean(v)) : v === null || v === undefined || v === "" ? EMPTY : String(v)

type Props = {
  table: ActiveTable
  config: KanbanConfig
  records: TableRecord[]
  users: WorkspaceUser[]
  onOpen: (r: TableRecord, e?: { metaKey?: boolean; ctrlKey?: boolean }) => void
  onCreate: (initial: RecordData) => void
  onEdit: (r: TableRecord) => void
  onDelete: (r: TableRecord) => void
  onRun: (r: TableRecord, a: TableAction, input: RecordData) => void
}

export function RecordsKanbanView({ table, config, records, users, onOpen, onCreate, onEdit, onDelete, onRun }: Props) {
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [colRange, setColRange] = useState<Record<string, DateRange | null>>({})
  const update = useUpdateRecord(table.id)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const fieldMap = new Map(table.config.fields.map((f) => [f.name, f]))
  const statusField = fieldMap.get(config.statusField)
  const headline = fieldMap.get(config.headlineField)
  const extras = config.displayFields.map((n) => fieldMap.get(n)).filter((f): f is TableField => !!f && f.name !== config.statusField)

  if (!statusField) return <p className="p-8 text-center text-sm text-muted-foreground">Trường trạng thái của màn hình kanban không còn tồn tại.</p>

  const columns = buildColumns(statusField, users)
  const drop = (col: Column) => {
    setOverKey(null)
    const r = records.find((x) => x.id === dragId)
    setDragId(null)
    if (!r || keyOf(statusField, r.record[statusField.name]) === col.key) return
    update.mutate({ id: r.id, patch: { [statusField.name]: col.value } })
  }

  return (
    <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto">
      {columns.map((col) => {
        const range = colRange[col.key]
        const inCol = records.filter((r) => keyOf(statusField, r.record[statusField.name]) === col.key)
        // Column time filter looks at when the card entered this column (falls back to creation).
        const items = range
          ? inCol.filter((r) => { const [a, b] = rangeBounds(range); const t = Date.parse(r.valueUpdatedAt[statusField.name] ?? r.createdAt); return t >= a && t < b })
          : inCol
        if (col.key === EMPTY && !inCol.length) return null
        const isCollapsed = collapsed.includes(col.key)
        const toggle = () => setCollapsed((c) => (c.includes(col.key) ? c.filter((k) => k !== col.key) : [...c, col.key]))
        if (isCollapsed)
          return (
            <button key={col.key} type="button" onClick={toggle} aria-label="Mở rộng cột" className="flex w-10 shrink-0 flex-col items-center gap-2 rounded-lg bg-muted/60 py-3 text-xs">
              <ChevronsLeftRight className="size-3.5" />
              <span className="size-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="[writing-mode:vertical-rl]">{typeof col.title === "string" ? col.title : ""} · {inCol.length}</span>
            </button>
          )
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault()
              setOverKey(col.key)
            }}
            onDragLeave={() => setOverKey((k) => (k === col.key ? null : k))}
            onDrop={() => drop(col)}
            className={cn("flex min-h-40 w-[280px] shrink-0 flex-col overflow-hidden rounded-lg bg-muted/60 text-xs ring-2 ring-transparent transition-all", overKey === col.key && "bg-brand/10 ring-brand/40")}
          >
            <div className="flex h-10 items-center gap-2 px-3">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="min-w-0 truncate text-sm font-semibold">{col.title}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{range ? `${items.length}/${inCol.length}` : items.length}</span>
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <button type="button" onClick={() => onCreate({ [statusField.name]: col.value })} aria-label="Thêm bản ghi vào cột" className="grid size-7 place-items-center rounded-md transition-colors hover:bg-accent"><Plus className="size-4" /></button>
                <DateRangeFilter compact value={range ?? null} onChange={(v) => setColRange({ ...colRange, [col.key]: v })} />
                <button type="button" onClick={toggle} aria-label="Thu gọn cột" className="grid size-7 place-items-center rounded-md transition-colors hover:bg-accent"><ChevronDown className="size-4" /></button>
              </span>
            </div>
            <div className="flex max-h-[calc(100vh-300px)] flex-col gap-2 overflow-y-auto p-2">
              {items.map((r) => {
                return (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move"
                      setDragId(r.id)
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={(e) => onOpen(r, e)}
                    className={cn("cursor-pointer space-y-2 overflow-hidden rounded-lg border bg-card p-3 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-foreground/14 hover:shadow-sm", dragId === r.id && "opacity-50")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold break-words">{headline ? String(r.record[headline.name] || "(Không tiêu đề)") : r.id}</p>
                      <span onClick={(e) => e.stopPropagation()}>
                        <RecordActionsMenu table={table} withCustom={false} className="-mt-1 -mr-1 size-6" onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onRun={(a, input) => onRun(r, a, input)} />
                      </span>
                    </div>
                    {extras.length > 0 && (
                      <dl className="m-0 grid grid-cols-[minmax(0,88px)_minmax(0,1fr)] gap-x-2 gap-y-1">
                        {extras.map((f) => (
                          <div key={f.name} className="contents">
                            <dt className="truncate text-xs leading-5 text-muted-foreground" title={f.label}>{f.label}</dt>
                            <dd className="m-0 flex min-w-0 items-center truncate text-[13px] leading-5"><FieldValue field={f} value={r.record[f.name]} users={users} className="min-w-0 truncate" /></dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
