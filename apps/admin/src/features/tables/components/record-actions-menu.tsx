import { useState } from "react"
import { MoreVertical, Pencil, Play, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
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
          <Button onClick={submit}><Play />Chạy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
          <Button size="icon-sm" variant="ghost" aria-label="Record actions" className={className}><MoreVertical /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onEdit}><Pencil />Cập nhật bản ghi</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 />Xoá bản ghi</DropdownMenuItem>
          {custom.length > 0 && <DropdownMenuSeparator />}
          {custom.map((a) => (
            <DropdownMenuItem key={a.actionId} onSelect={() => (a.inputFields.length ? setRunning(a) : onRun(a, {}))}><Play />{a.name}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionRunDialog action={running} onOpenChange={(o) => !o && setRunning(null)} onRun={onRun} />
    </>
  )
}
