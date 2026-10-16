import { useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"

export type ConnectorInfo = { name: string; description: string }

const field = "w-full rounded-md border border-input bg-background text-sm transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
const label = "text-sm leading-none font-medium"
const btn = "h-8 gap-1.5 px-3 py-1.5 has-[>svg]:px-2.5"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initial: ConnectorInfo
  title: string
  pending: boolean
  onSubmit: (info: ConnectorInfo) => void
}

/** Name + description dialog shared by "Tạo {type} Connector" and "Chỉnh sửa Connector" (reference markup). */
export function ConnectorInfoDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto p-4 sm:max-w-[500px] sm:p-6 [&>[data-slot=dialog-close]]:rounded-sm">
        {/* Mounted only while open, so the fields reset to `initial` on every open. */}
        <InfoForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

function InfoForm({ onOpenChange, mode, initial, title, pending, onSubmit }: Props) {
  const [info, setInfo] = useState(initial)
  const [error, setError] = useState("")
  const create = mode === "create"
  const idSuffix = create ? "" : "-edit"
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = info.name.trim()
    if (!name) return setError("Tên connector là bắt buộc")
    if (name.length > 100) return setError("Tối đa 100 ký tự")
    onSubmit({ name, description: info.description.trim() })
  }
  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader className="gap-0 space-y-1.5"><DialogTitle className="tracking-tight">{title}</DialogTitle><DialogDescription>{create ? "Nhập tên định danh và mô tả cho connector mới" : "Cập nhật thông tin connector"}</DialogDescription></DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className={label} htmlFor={`connector-name${idSuffix}`}>Tên định danh <span className="text-destructive">*</span></label>
          <Input id={`connector-name${idSuffix}`} type="text" value={info.name} aria-invalid={!!error || undefined} placeholder="Ví dụ: Email Marketing" onChange={(e) => { setInfo({ ...info, name: e.target.value }); setError("") }} className={`${field} h-8 px-3 py-1.5 shadow-none`} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="space-y-2">
          <label className={label} htmlFor={`connector-description${idSuffix}`}>Mô tả</label>
          <textarea id={`connector-description${idSuffix}`} rows={3} maxLength={500} value={info.description} placeholder="Mô tả mục đích sử dụng connector này..." onChange={(e) => setInfo({ ...info, description: e.target.value })} className={`${field} flex min-h-[80px] px-3 py-2`} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className={`${btn} border-input`} onClick={() => onOpenChange(false)}>Hủy</Button>
        <Button type="submit" className={`${btn} shadow-xs`} disabled={pending}>{pending ? (create ? "Đang tạo..." : "Đang lưu...") : create ? "Tạo Connector" : "Lưu thay đổi"}</Button>
      </div>
    </form>
  )
}
