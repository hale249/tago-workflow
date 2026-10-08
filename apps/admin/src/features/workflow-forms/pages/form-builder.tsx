import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowDown, ArrowUp, Check, ChevronLeft, Copy, Pencil, Plus, Save, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useDeleteForm, useForm, useUpdateForm } from "../api/forms.queries"
import { FormFieldDialog } from "../components/form-field-dialog"
import { FIELD_TYPES, FORM_TYPES } from "../data/templates"
import type { FormConfig, FormField, WorkflowForm } from "../types/form"

const control = "w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"

function Preview({ config }: { config: FormConfig }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="mx-auto w-full max-w-md space-y-4 rounded-xl border bg-background p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{config.title || "Không có tiêu đề"}</h2>
      {config.fields.map((f) => (
        <label key={f.name} className="grid gap-1.5 text-sm">
          {f.type !== "checkbox" && <span className="font-medium">{f.label}{f.required && <span className="text-destructive"> *</span>}</span>}
          {f.type === "textarea" ? <textarea rows={3} className={`${control} py-2`} placeholder={f.placeholder} defaultValue={f.defaultValue} />
            : f.type === "select" ? (
              <select className={`${control} h-9`} defaultValue={f.defaultValue ?? ""}>
                <option value="">{f.placeholder || "Chọn một tuỳ chọn"}</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
              </select>
            ) : f.type === "checkbox" ? <span className="flex items-center gap-2"><input type="checkbox" defaultChecked={f.defaultValue === "true"} />{f.label}{f.required && <span className="text-destructive">*</span>}</span>
            : <input className={`${control} h-9`} type={f.type === "datetime" ? "datetime-local" : f.type} placeholder={f.placeholder} defaultValue={f.defaultValue} />}
        </label>
      ))}
      <Button type="submit" className="w-full">{config.submitButton.text || "Gửi"}</Button>
    </form>
  )
}

function CopyRow({ label, value, area }: { label: string; value: string; area?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <div className="grid gap-1 text-sm">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-start gap-1.5">
        {area ? <textarea readOnly rows={3} value={value} className="flex-1 rounded-md border bg-muted/40 p-2 font-mono text-[11px]" /> : <Input readOnly value={value} className="bg-muted/40 font-mono text-xs" />}
        <Button size="icon-sm" variant="outline" aria-label={`Sao chép ${label}`} onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) })}>{done ? <Check /> : <Copy />}</Button>
      </div>
    </div>
  )
}

export function FormBuilderPage() {
  const { formId = "" } = useParams()
  const navigate = useNavigate()
  const { data: saved, error } = useForm(formId)
  const update = useUpdateForm(formId)
  const del = useDeleteForm()
  const [draft, setDraft] = useState<WorkflowForm | null>(null)
  const [dialog, setDialog] = useState<{ open: boolean; index?: number }>({ open: false })
  const [msg, setMsg] = useState("")
  useEffect(() => { if (saved) setDraft(saved) }, [saved])

  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Form không tồn tại. <Link to="/workflow-forms" className="text-brand hover:underline">Quay lại</Link></p>
  if (!draft || !saved) return <Skeleton className="h-full w-full rounded-lg" />

  const c = draft.config
  const setC = (p: Partial<FormConfig>) => setDraft({ ...draft, config: { ...c, ...p } })
  const setFields = (fields: FormField[]) => setC({ fields })
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const move = (i: number, d: -1 | 1) => { const n = [...c.fields]; [n[i], n[i + d]] = [n[i + d], n[i]]; setFields(n) }
  const save = () => update.mutate({ name: draft.name, description: draft.description, formType: draft.formType, config: draft.config }, { onSuccess: () => { setMsg("Lưu form thành công"); setTimeout(() => setMsg(""), 2500) } })

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to="/workflow-forms"><ChevronLeft /></Link></Button>
        <h1 className="min-w-0 flex-1 truncate font-semibold">{saved.name}</h1>
        <span className={`text-xs ${update.error ? "text-destructive" : "text-muted-foreground"}`}>{update.error?.message || msg || (dirty ? "Có thay đổi chưa lưu" : "")}</span>
        <Button size="sm" variant="outline" className="h-8 text-destructive" onClick={() => window.confirm(`Xoá form “${saved.name}”?`) && del.mutate(saved.id, { onSuccess: () => navigate("/workflow-forms", { replace: true }) })}>
          <Trash2 />{del.isPending ? "Đang xóa..." : "Xóa"}
        </Button>
        <Button size="sm" className="h-8" disabled={!dirty || update.isPending || !draft.name.trim()} onClick={save}><Save />Lưu</Button>
      </div>

      <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto">
        <aside className="w-72 shrink-0 space-y-3 overflow-y-auto border-r p-3 max-lg:w-full max-lg:border-r-0 max-lg:border-b">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">Danh sách Fields</p><Button size="xs" onClick={() => setDialog({ open: true })}><Plus />Thêm Field</Button></div>
          {!c.fields.length && (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Chưa có field nào</p>Thêm field đầu tiên để xây dựng form
            </div>
          )}
          {c.fields.map((f, i) => (
            <div key={f.name} className="group rounded-md border p-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="min-w-0 flex-1 truncate font-medium">{f.label}</span>
                <Button size="icon-xs" variant="ghost" disabled={i === 0} aria-label="Lên" onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button size="icon-xs" variant="ghost" disabled={i === c.fields.length - 1} aria-label="Xuống" onClick={() => move(i, 1)}><ArrowDown /></Button>
                <Button size="icon-xs" variant="ghost" aria-label={`Sửa ${f.label}`} onClick={() => setDialog({ open: true, index: i })}><Pencil /></Button>
                <Button size="icon-xs" variant="ghost" aria-label={`Xoá ${f.label}`} onClick={() => setFields(c.fields.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{f.name}</span> · {FIELD_TYPES.find((t) => t.type === f.type)?.label.split(" ")[0]}{f.required && <span className="ml-1 rounded bg-muted px-1">Bắt buộc</span>}
              </p>
            </div>
          ))}
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-6"><Preview config={c} /></div>

        <aside className="w-80 shrink-0 space-y-5 overflow-y-auto border-l p-4 text-sm max-lg:w-full max-lg:border-l-0">
          <div className="space-y-3">
            <p className="font-semibold">Cài đặt Form</p>
            <label className="grid gap-1"><span className="text-xs font-medium">Tên Form *</span><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            {!draft.name.trim() && <p className="text-xs text-destructive">Tên form không được để trống</p>}
            <label className="grid gap-1"><span className="text-xs font-medium">Mô tả</span>
              <textarea rows={2} value={draft.description} placeholder="Mô tả (tuỳ chọn)" onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="rounded-md border border-input bg-transparent px-3 py-2 shadow-xs" />
            </label>
          </div>
          <div className="space-y-3 border-t pt-4">
            <label className="grid gap-1"><span className="text-xs font-medium">Loại Form</span>
              <select className="h-9 rounded-md border border-input bg-transparent px-3" value={draft.formType} onChange={(e) => setDraft({ ...draft, formType: e.target.value as WorkflowForm["formType"] })}>
                {FORM_TYPES.map((t) => <option key={t.type} value={t.type}>{t.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1"><span className="text-xs font-medium">Tiêu đề hiển thị</span><Input value={c.title} onChange={(e) => setC({ title: e.target.value })} /></label>
            <label className="grid gap-1"><span className="text-xs font-medium">Nút Gửi</span><Input value={c.submitButton.text} placeholder="Nhập text cho nút gửi" onChange={(e) => setC({ submitButton: { text: e.target.value } })} /></label>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold">Chia sẻ</p>
            <CopyRow label="Đường dẫn biểu mẫu" value={draft.formLink} />
            <CopyRow label="Mã nhúng" value={draft.formEmbedCode} area />
            <p className="text-[11px] text-muted-foreground">Dùng form này làm kích hoạt trong Cloud Logic (loại “Form”) để chạy workflow mỗi khi có người gửi.</p>
          </div>
        </aside>
      </div>
      <FormFieldDialog
        open={dialog.open}
        field={dialog.index != null ? c.fields[dialog.index] : undefined}
        taken={c.fields.map((f) => f.name)}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        onSave={(f) => setFields(dialog.index != null ? c.fields.map((x, j) => (j === dialog.index ? f : x)) : [...c.fields, f])}
      />
    </section>
  )
}
