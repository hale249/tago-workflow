import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon, PencilEdit01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { TYPE } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import { ApiError, autoFillPatch } from "../api/tables.api"
import { useUpdateRecord } from "../api/tables.queries"
import type { RecordValue, TableField, TableRecord, WorkspaceUser } from "../types/table"
import { isBlank, isLongText } from "../utils/fields"
import { AttachmentInput } from "./attachment-field"
import { FieldInput } from "./field-input"
import { FieldValue, UserChip } from "./field-value"

type Props = { tableId: string; record: TableRecord; field: TableField; users: WorkspaceUser[]; readOnly?: boolean }

const initialsOf = (name: string) => name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()

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
    // Reference: 24px avatar · 12/18 name · faded 20px × · faded 24px + (16px glyphs), 6px apart.
    <div className="flex flex-wrap items-center justify-start gap-[var(--space-075)]">
      {ids.map((id) => {
        const u = users.find((x) => x.id === id)
        if (!u) return null
        return (
          <span key={id} className="contents">
            <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full" title={u.fullName}>
              <span className="grid size-full place-items-center text-[10px] font-semibold text-white" style={{ backgroundColor: u.color }}>{initialsOf(u.fullName)}</span>
            </span>
            <span className="text-foreground" style={TYPE.small}>{u.fullName}</span>
            {!readOnly && (
              <Button size="icon-xs" variant="ghost" aria-label={`Gỡ ${u.fullName}`} disabled={field.required && ids.length === 1} onClick={() => save(ids.filter((x) => x !== id))} className="size-5 opacity-60 hover:bg-accent/50 hover:opacity-100 disabled:opacity-60 dark:hover:bg-white/5">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </Button>
            )}
          </span>
        )
      })}
      {!ids.length && <span className="text-muted-foreground/50">—</span>}
      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label={`Thêm ${field.label}`} className="size-6 opacity-60 hover:bg-accent/50 hover:opacity-100 dark:hover:bg-white/5"><HugeiconsIcon icon={Add01Icon} className="size-4" /></Button>
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
  // Files: upload / remove saves straight away (no edit mode).
  if (field.type === "ATTACHMENT" && !readOnly) {
    const v = record.record[field.name]
    return (
      <div className="space-y-1">
        <AttachmentInput field={field} value={Array.isArray(v) ? v : []} onChange={(next) => update.mutate({ id: record.id, patch: { [field.name]: next } }, { onError: (e) => setError(e instanceof ApiError ? e.fieldErrors[field.name] ?? e.message : "Không lưu được") })} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  const start = () => {
    if (readOnly) return
    setDraft(record.record[field.name] ?? null)
    setError("")
    setEditing(true)
  }
  const save = () =>
    update.mutate(
      // Linking a record also fills the fields set to "Tự động điền từ liên kết".
      { id: record.id, patch: { ...autoFillPatch(tableId, record.record, field.name, draft), [field.name]: draft } },
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
        <span className="min-w-0 flex-1"><FieldValue size="md" field={field} value={record.record[field.name]} users={users} className="whitespace-pre-line" /></span>
        {!readOnly && <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/inline:opacity-100" />}
      </div>
    )

  return (
    <div
      className="space-y-1"
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false)
        if (e.key === "Enter" && !isLongText(field.type)) {
          e.preventDefault()
          save()
        }
      }}
    >
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1"><FieldInput field={field} value={draft} users={users} invalid={!!error} onChange={setDraft} record={{ ...record.record, [field.name]: draft }} /></div>
        <Button size="icon-sm" aria-label="Lưu" disabled={update.isPending} onClick={save}><HugeiconsIcon icon={Tick02Icon} /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="Huỷ" onClick={() => setEditing(false)}><HugeiconsIcon icon={Cancel01Icon} /></Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
