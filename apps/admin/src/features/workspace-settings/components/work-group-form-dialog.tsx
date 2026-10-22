import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DialogField } from "@workspace/ui/components/dialog-field"
import { Input } from "@workspace/ui/components/input"
import { DIALOG_CONTENT } from "@workspace/ui/lib/styles"
import { useCreateWorkGroup, useUpdateWorkGroup, type WorkGroup } from "@/features/tables"

const TEXTAREA = "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:bg-input/30"

/** Create (no `group`) or rename a work group. */
export function WorkGroupFormDialog({ open, onOpenChange, group }: { open: boolean; onOpenChange: (o: boolean) => void; group?: WorkGroup | null }) {
  const create = useCreateWorkGroup()
  const update = useUpdateWorkGroup()
  const m = group ? update : create
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string>()
  useEffect(() => { if (open) { setName(group?.name ?? ""); setDescription(group?.description ?? ""); setError(undefined); m.reset() } }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError("Tên nhóm là bắt buộc")
    if (name.trim().length > 100) return setError("Tên nhóm không được quá 100 ký tự")
    const done = { onSuccess: () => onOpenChange(false) }
    if (group) update.mutate({ id: group.id, name, description }, done)
    else create.mutate({ name, description }, done)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${DIALOG_CONTENT} sm:max-w-[450px]`}>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">{group ? "Chỉnh sửa nhóm công việc" : "Tạo nhóm công việc"}</DialogTitle>
          <DialogDescription>Gom các bảng theo nhóm để dễ quản lý</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <DialogField label="Tên" required error={error}>
            <Input autoFocus value={name} placeholder="Ví dụ: Bán hàng" onChange={(e) => { setName(e.target.value); setError(undefined) }} />
          </DialogField>
          <DialogField label="Mô tả">
            <textarea rows={4} value={description} placeholder="Nhóm này dùng cho…" className={TEXTAREA} onChange={(e) => setDescription(e.target.value)} />
          </DialogField>
          {m.error && <p className="text-sm text-destructive">{m.error.message}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3" disabled={m.isPending}>{group ? "Cập nhật" : "Tạo mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
