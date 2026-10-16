import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Database01Icon, Delete02Icon, MoreVerticalIcon, PackageIcon, PencilIcon, PlayIcon, SentIcon, UserSettings01Icon, WorkflowSquare01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { useWorkspaceUsers } from "../api/tables.queries"
import type { ActiveTable, RecordData, TableAction } from "../types/table"
import { emptyValue, validateRecord } from "../utils/fields"
import { FieldInput } from "./field-input"
import { FormRow } from "./form-controls"

/** Collects a custom action's input fields. Execution is delegated to `onRun` (workflow backend later). */
function ActionRunDialog({ action, onOpenChange, onRun }: { action: TableAction | null; onOpenChange: (o: boolean) => void; onRun: (a: TableAction, input: RecordData) => void }) {
  const { data: users = [] } = useWorkspaceUsers()
  const [values, setValues] = useState<RecordData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (!action) return null
  const fields = action.inputFields
  const submit = () => {
    const e = validateRecord(fields, values)
    setErrors(e)
    if (Object.keys(e).length) return
    onRun(action, values)
    onOpenChange(false)
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) { setValues({}); setErrors({}) } onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action.name}</DialogTitle>
          <DialogDescription>Điền thông tin rồi bấm Chạy.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {fields.map((f) => (
            <FormRow key={f.name} label={f.label} required={f.required} error={errors[f.name]}>
              <FieldInput field={f} value={values[f.name] ?? emptyValue(f)} users={users} onChange={(v) => setValues({ ...values, [f.name]: v })} />
            </FormRow>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={submit}><HugeiconsIcon icon={PlayIcon} />Chạy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Reference record menu item: top-aligned icon, label wraps to two lines. */
/** Custom action icon keys (same set as the action settings icon picker). */
const CUSTOM_ICON: Record<string, typeof PlayIcon> = {
  play: PlayIcon,
  workflow: WorkflowSquare01Icon,
  package: PackageIcon,
  send: SentIcon,
  "user-cog": UserSettings01Icon,
  database: Database01Icon,
}
const ITEM = "items-start gap-2 py-2"
const ICON = "mt-0.5 h-4 w-4 shrink-0"
function Label({ text }: { text: string }) {
  return <span className="line-clamp-2 min-w-0 flex-1 leading-5 break-words whitespace-normal" title={text}>{text}</span>
}

type Props = {
  table: ActiveTable
  onEdit: () => void
  onDelete: () => void
  onRun: (a: TableAction, input: RecordData) => void
  /** Kanban cards only offer update/delete. */
  withCustom?: boolean
  className?: string
}

/** "⋮ Record actions": update, delete and the table's custom actions. */
export function RecordActionsMenu({ table, onEdit, onDelete, onRun, withCustom = true, className }: Props) {
  const [running, setRunning] = useState<TableAction | null>(null)
  const custom = withCustom ? table.config.actions.filter((a) => a.type === "custom") : []
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" aria-label="Record actions" className={className}><HugeiconsIcon icon={MoreVerticalIcon} /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[60] w-64 max-w-[calc(100vw-2rem)]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem className={ITEM} onSelect={onEdit}><HugeiconsIcon icon={PencilIcon} className={cn(ICON, "text-muted-foreground")} /><Label text="Cập nhật bản ghi" /></DropdownMenuItem>
          <DropdownMenuItem className={ITEM} variant="destructive" onSelect={onDelete}><HugeiconsIcon icon={Delete02Icon} className={cn(ICON, "text-inherit")} /><Label text="Xoá bản ghi" /></DropdownMenuItem>
          {custom.map((a) => (
            <DropdownMenuItem className={ITEM} key={a.actionId} onSelect={() => (a.inputFields.length ? setRunning(a) : onRun(a, {}))}><HugeiconsIcon icon={CUSTOM_ICON[a.icon] ?? PlayIcon} className={cn(ICON, "text-muted-foreground")} /><Label text={a.name} /></DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionRunDialog action={running} onOpenChange={(o) => !o && setRunning(null)} onRun={onRun} />
    </>
  )
}
