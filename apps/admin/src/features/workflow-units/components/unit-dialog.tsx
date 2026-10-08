import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { useSaveUnit } from "../api/workflow.queries"
import type { WorkflowUnit } from "../types/workflow"

export function UnitDialog({ open, onOpenChange, unit, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; unit?: WorkflowUnit; onSaved?: (u: WorkflowUnit) => void }) {
  const save = useSaveUnit()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  useEffect(() => { if (open) { setName(unit?.name ?? ""); setDescription(unit?.description ?? "") } }, [open, unit])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{unit ? "Sửa workflow" : "Tạo workflow"}</DialogTitle>
          <DialogDescription>Mỗi workflow gom nhiều sự kiện tự động hoá liên quan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Tên <span className="text-destructive">*</span></span><Input value={name} autoFocus maxLength={100} onChange={(e) => setName(e.target.value)} /></label>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Mô tả</span>
            <textarea value={description} maxLength={500} rows={3} onChange={(e) => setDescription(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />
          </label>
          {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate({ id: unit?.id, name, description }, { onSuccess: (u) => { onSaved?.(u); onOpenChange(false) } })}>{unit ? "Lưu" : "Tạo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
