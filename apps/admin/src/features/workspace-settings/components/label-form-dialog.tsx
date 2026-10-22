import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DialogField } from "@workspace/ui/components/dialog-field"
import { Input } from "@workspace/ui/components/input"
import { DIALOG_CONTENT } from "@workspace/ui/lib/styles"
import { useCreateLabel, useUpdateLabel, type Label, type LabelType } from "@/features/teams"
import { labelTypeName } from "../data/labels"

/** "Tạo nhãn mới" / "Cập nhật nhãn": the type is the active tab, shown as a disabled input (as in the reference); only the name is editable. */
export function LabelFormDialog({ open, onOpenChange, label, defaultType }: { open: boolean; onOpenChange: (o: boolean) => void; label?: Label | null; defaultType: LabelType }) {
  const create = useCreateLabel()
  const update = useUpdateLabel()
  const m = label ? update : create
  const [name, setName] = useState("")
  const [error, setError] = useState<string>()
  const kind = label?.kind ?? defaultType
  useEffect(() => { if (open) { setName(label?.name ?? ""); setError(undefined); m.reset() } }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError("Tên nhãn không được để trống")
    if (name.trim().length > 100) return setError("Tên nhãn không được quá 100 ký tự")
    const done = { onSuccess: () => onOpenChange(false) }
    if (label) update.mutate({ id: label.id, name }, done)
    else create.mutate({ kind, name }, done)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${DIALOG_CONTENT} sm:max-w-[460px]`}>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">{label ? "Cập nhật nhãn" : "Tạo nhãn mới"}</DialogTitle>
          <DialogDescription>{label ? "Bạn chỉ có thể cập nhật tên nhãn." : `Nhãn mới sẽ được tạo trong nhóm "${labelTypeName(kind)}".`}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <DialogField label="Loại nhãn">
            <Input disabled value={labelTypeName(kind)} />
          </DialogField>
          <DialogField label="Tên nhãn" required error={error}>
            <Input autoFocus value={name} placeholder="Nhập tên nhãn" onChange={(e) => { setName(e.target.value); setError(undefined) }} />
          </DialogField>
          {m.error && <p className="text-sm text-destructive">{m.error.message}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3" disabled={m.isPending}>{label ? "Cập nhật nhãn" : "Tạo nhãn"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
