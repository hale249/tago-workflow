import { useState } from "react"
import { Check, Pencil, Plus, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { ApiError } from "../api/tables.api"
import { useUpdateRecord } from "../api/tables.queries"
import type { RecordValue, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { isBlank } from "../utils/fields"
import { FieldInput } from "./field-input"
import { FieldValue, UserChip } from "./field-value"

type Props = { tableId: string; record: TableRecord; field: TableField; users: WorkspaceUser[]; readOnly?: boolean }

/** User fields: chips with × to remove and + to add, saved immediately. */
function UserChips({ tableId, record, field, users, readOnly }: Props) {
  const update = useUpdateRecord(tableId)
  const [open, setOpen] = useState(false)
  const multi = field.type === "SELECT_LIST_WORKSPACE_USER"
  const v = record.record[field.name]
  const ids = Array.isArray(v) ? v : isBlank(v) ? [] : [String(v)]
  const save = (next: string[]) => update.mutate({ id: record.id, patch: { [field.name]: multi ? next : next[0] ?? "" } })
  const available = users.filter((u) => !ids.includes(u.id))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <span key={id} className="inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-0.5 text-[13px]">
          <UserChip user={users.find((u) => u.id === id)} />
          {!readOnly && (
            <button type="button" aria-label="Gỡ" disabled={field.required && ids.length === 1} onClick={() => save(ids.filter((x) => x !== id))} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {!ids.length && <span className="text-muted-foreground/60">—</span>}
      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label={`Thêm ${field.label}`}><Plus /></Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            {available.map((u) => (
              <button key={u.id} type="button" className="flex w-full rounded px-2 py-1.5 hover:bg-muted" onClick={() => { save(multi ? [...ids, u.id] : [u.id]); setOpen(false) }}>
                <UserChip user={u} />
              </button>
            ))}
            {!available.length && <p className="px-2 py-1.5 text-xs text-muted-foreground">Đã chọn hết thành viên</p>}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

/** Click-to-edit value: shows the value; on click swaps to an input with save / cancel. */
export function InlineField(props: Props) {
  const { tableId, record, field, users, readOnly } = props
  const update = useUpdateRecord(tableId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<RecordValue>(null)
  const [error, setError] = useState("")

  if (field.type === "SELECT_ONE_WORKSPACE_USER" || field.type === "SELECT_LIST_WORKSPACE_USER") return <UserChips {...props} />

  const start = () => {
    if (readOnly) return
    setDraft(record.record[field.name] ?? null)
    setError("")
    setEditing(true)
  }
  const save = () =>
    update.mutate(
      { id: record.id, patch: { [field.name]: draft } },
      {
        onSuccess: () => setEditing(false),
        onError: (e) => setError(e instanceof ApiError ? e.fieldErrors[field.name] ?? e.message : "Không lưu được"),
      },
    )

  if (!editing)
    return (
      // div (not button): the value may contain links, which can't nest inside a <button>.
      <div
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly ? undefined : 0}
        onClick={start}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), start())}
        className={cn("group/inline -mx-2 flex min-h-5 w-full items-center gap-2 rounded px-2 text-left leading-5", !readOnly && "cursor-pointer hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none")}
      >
        <span className="min-w-0 flex-1"><FieldValue field={field} value={record.record[field.name]} users={users} className="whitespace-pre-line" /></span>
        {!readOnly && <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/inline:opacity-100" />}
      </div>
    )

  return (
    <div
      className="space-y-1"
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false)
        if (e.key === "Enter" && field.type !== "RICH_TEXT") {
          e.preventDefault()
          save()
        }
      }}
    >
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1"><FieldInput field={field} value={draft} users={users} invalid={!!error} onChange={setDraft} /></div>
        <Button size="icon-sm" aria-label="Lưu" disabled={update.isPending} onClick={save}><Check /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="Huỷ" onClick={() => setEditing(false)}><X /></Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
