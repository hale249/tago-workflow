import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { ApiError } from "../api/tables.api"
import { useCreateRecord, useUpdateRecord, useWorkspaceUsers } from "../api/tables.queries"
import type { ActiveTable, RecordData, RecordItem, TableRecord } from "../types/table"
import { emptyValue, validateRecord } from "../utils/fields"
import { FieldInput } from "./field-input"
import { FormRow } from "./form-controls"
import { ItemsEditor } from "./items-editor"

type Props = {
  table: ActiveTable
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Edit mode when set. */
  record?: TableRecord
  /** Pre-filled values for create mode (e.g. kanban column, related record). */
  initial?: RecordData
  onSaved?: (r: TableRecord) => void
}

export function RecordFormDialog({ table, open, onOpenChange, record, initial, onSaved }: Props) {
  const { data: users = [] } = useWorkspaceUsers()
  const create = useCreateRecord(table.id)
  const update = useUpdateRecord(table.id)
  const [values, setValues] = useState<RecordData>({})
  const [items, setItems] = useState<RecordItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const fields = table.config.fields
  const sumTargets = new Set(table.config.items.enabled ? table.config.items.sums.map((s) => s.sumField) : [])

  useEffect(() => {
    if (!open) return
    const base: RecordData = {}
    for (const f of fields) base[f.name] = emptyValue(f)
    setValues({ ...base, ...(record?.record ?? initial ?? {}) })
    setItems(record?.items ?? [])
    setErrors({})
    setFormError("")
  }, [open, record, initial, fields])

  const pending = create.isPending || update.isPending

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const local = validateRecord(fields, values)
    setErrors(local)
    if (Object.keys(local).length) return
    try {
      const saved = record
        ? await update.mutateAsync({ id: record.id, patch: values, items: table.config.items.enabled ? items : undefined })
        : await create.mutateAsync({ data: values, items: table.config.items.enabled ? items : undefined })
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setFormError(Object.keys(err.fieldErrors).length ? "" : err.message)
      } else setFormError("Có lỗi xảy ra, vui lòng thử lại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`flex max-h-[90svh] flex-col gap-0 p-0 ${table.config.items.enabled ? "sm:max-w-4xl" : "sm:max-w-xl"}`}>
        <DialogHeader className="border-b p-5">
          <DialogTitle>{record ? "Cập nhật bản ghi" : "Tạo mới bản ghi"}</DialogTitle>
          <DialogDescription>{table.name}</DialogDescription>
        </DialogHeader>
        <form id="record-form" onSubmit={submit} className="grid gap-4 overflow-y-auto p-5">
          {fields.filter((f) => !sumTargets.has(f.name)).map((f) => (
            <FormRow key={f.name} label={f.label} required={f.required} error={errors[f.name]}>
              <FieldInput
                field={f}
                value={values[f.name]}
                users={users}
                invalid={!!errors[f.name]}
                disabled={!!record && f.isLocked}
                onChange={(v) => {
                  setValues((s) => ({ ...s, [f.name]: v }))
                  if (errors[f.name]) setErrors(({ [f.name]: _, ...rest }) => rest)
                }}
              />
            </FormRow>
          ))}
          {table.config.items.enabled && <ItemsEditor config={table.config.items} items={items} users={users} onChange={setItems} />}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </form>
        <DialogFooter className="border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Huỷ</Button>
          <Button type="submit" form="record-form" disabled={pending}>{pending ? "Đang lưu…" : record ? "Lưu thay đổi" : "Tạo bản ghi"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
