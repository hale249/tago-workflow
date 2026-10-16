import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { useSaveUnit } from "../api/workflow.queries"
import type { WorkflowUnit } from "../types/workflow"
import { dialogHeader, dialogShell, dialogTitle, inputClass, textareaClass } from "../utils/dialog-styles"

const label = "text-sm leading-none font-medium"

export function UnitDialog({ open, onOpenChange, unit, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; unit?: WorkflowUnit; onSaved?: (u: WorkflowUnit) => void }) {
  const save = useSaveUnit()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [invalid, setInvalid] = useState(false)
  useEffect(() => { if (open) { setName(unit?.name ?? ""); setDescription(unit?.description ?? ""); setInvalid(false) } }, [open, unit])
  const prefix = unit ? "edit-" : ""

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setInvalid(true)
    save.mutate({ id: unit?.id, name: name.trim(), description }, { onSuccess: (u) => { onSaved?.(u); onOpenChange(false) } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShell, "sm:max-w-[500px]")}>
        <DialogHeader className={dialogHeader}>
          <DialogTitle className={dialogTitle}>{unit ? "Chỉnh sửa workflow" : "Tạo workflow mới"}</DialogTitle>
          <DialogDescription>{unit ? "Cập nhật tên và mô tả của workflow" : "Tạo workflow mới để tổ chức các quy trình tự động"}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <label className={label} htmlFor={`${prefix}name`}>Tên <span className="text-destructive">*</span></label>
            <input id={`${prefix}name`} name="name" type="text" autoFocus maxLength={100} placeholder="Nhập tên workflow" aria-invalid={invalid} className={inputClass}
              value={name} onChange={(e) => { setName(e.target.value); setInvalid(false) }} />
          </div>
          <div className="space-y-2">
            <label className={label} htmlFor={`${prefix}description`}>Mô tả</label>
            <textarea id={`${prefix}description`} name="description" rows={3} maxLength={500} placeholder="Nhập mô tả (tùy chọn)" className={textareaClass}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {save.error && <p className="text-sm text-destructive">{unit ? "Không thể cập nhật workflow" : "Không thể tạo workflow"}: {save.error.message}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" size="sm" variant="ghost" className="py-1.5 hover:bg-accent/50" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="py-1.5 shadow-xs" disabled={save.isPending}>{unit ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
