import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { FIELD_TYPES } from "../data/templates"
import type { FormField } from "../types/form"

const toName = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toLowerCase())

export function FormFieldDialog({ open, onOpenChange, field, taken, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; field?: FormField; taken: string[]; onSave: (f: FormField) => void }) {
  const [f, setF] = useState<FormField>({ type: "text", label: "", name: "" })
  const [nameTouched, setNameTouched] = useState(false)
  useEffect(() => { if (open) { setF(field ?? { type: "text", label: "", name: "", required: false }); setNameTouched(!!field) } }, [open, field])
  const set = (p: Partial<FormField>) => setF((s) => ({ ...s, ...p }))
  const dup = f.name && f.name !== field?.name && taken.includes(f.name)
  const ok = f.label.trim() && f.name && !dup && (f.type !== "select" || (f.options?.length ?? 0) > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{field ? "Chỉnh sửa Field" : "Thêm Field"}</DialogTitle><DialogDescription>Cấu hình thông tin cho field của form.</DialogDescription></DialogHeader>
        <div className="grid max-h-[60svh] gap-3 overflow-y-auto text-sm">
          <label className="grid gap-1"><span className="font-medium">Loại Field</span>
            <select className="h-9 rounded-md border border-input bg-transparent px-3" value={f.type} onChange={(e) => set({ type: e.target.value as FormField["type"], options: e.target.value === "select" ? f.options ?? [] : undefined })}>
              {FIELD_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="font-medium">Nhãn Field <span className="text-destructive">*</span></span>
            <Input value={f.label} placeholder="VD: Họ và tên, Số điện thoại" onChange={(e) => set({ label: e.target.value, ...(nameTouched ? {} : { name: toName(e.target.value) }) })} />
          </label>
          <label className="grid gap-1"><span className="font-medium">Tên biến (name)</span>
            <Input className="font-mono" value={f.name} onChange={(e) => { setNameTouched(true); set({ name: e.target.value }) }} />
            <span className={dup ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{dup ? "Tên biến đã tồn tại trong form" : "Tự tạo từ nhãn; dùng trong workflow như {{ .workflowData.<name> }}"}</span>
          </label>
          {f.type !== "checkbox" && <label className="grid gap-1"><span className="font-medium">Placeholder</span><Input value={f.placeholder ?? ""} onChange={(e) => set({ placeholder: e.target.value })} /></label>}
          <label className="grid gap-1"><span className="font-medium">Giá trị mặc định</span><Input value={f.defaultValue ?? ""} placeholder="Giá trị khi form vừa mở (tuỳ chọn)" onChange={(e) => set({ defaultValue: e.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.required} onChange={(e) => set({ required: e.target.checked })} />Bắt buộc — người dùng phải điền trường này</label>
          {f.type === "select" && (
            <div className="grid gap-2">
              <span className="font-medium">Tuỳ chọn</span>
              {(f.options ?? []).map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                  <Input value={o.text} placeholder="Tên tuỳ chọn" onChange={(e) => set({ options: f.options!.map((x, j) => (j === i ? { ...x, text: e.target.value, value: x.value || toName(e.target.value) } : x)) })} />
                  <Input value={o.value} placeholder="Giá trị" className="font-mono" onChange={(e) => set({ options: f.options!.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá tuỳ chọn" onClick={() => set({ options: f.options!.filter((_, j) => j !== i) })}><Trash2 /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="justify-self-start" onClick={() => set({ options: [...(f.options ?? []), { value: "", text: "" }] })}><Plus />Thêm tuỳ chọn</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!ok} onClick={() => { onSave({ ...f, label: f.label.trim() }); onOpenChange(false) }}>{field ? "Cập nhật" : "Thêm Field"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
