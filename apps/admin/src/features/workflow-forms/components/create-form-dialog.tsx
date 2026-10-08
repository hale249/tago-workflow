import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateForm } from "../api/forms.queries"
import { FORM_TYPES } from "../data/templates"
import type { FormType } from "../types/form"

/** Two steps: pick a template, then name + description. */
export function CreateFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const create = useCreateForm()
  const [type, setType] = useState<FormType | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  useEffect(() => { if (open) { setType(null); setStep(1); setName(""); setDescription("") } }, [open])
  const tpl = FORM_TYPES.find((t) => t.type === type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo Form</DialogTitle>
          <DialogDescription>{step === 1 ? "Chọn một mẫu để bắt đầu." : `Thông tin form · ${tpl?.name}`}</DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {FORM_TYPES.map((t) => (
              <button key={t.type} type="button" onClick={() => setType(t.type)} onDoubleClick={() => { setType(t.type); setStep(2) }}
                className={cn("grid gap-2 rounded-lg border p-3 text-left hover:bg-muted/50", type === t.type && "border-brand ring-1 ring-brand")}>
                <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand"><t.icon className="size-5" /></span>
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 text-sm">
            <label className="grid gap-1.5"><span className="font-medium">Tên Form <span className="text-destructive">*</span></span><Input autoFocus value={name} placeholder="Nhập tên form" onChange={(e) => setName(e.target.value)} /></label>
            <label className="grid gap-1.5"><span className="font-medium">Mô tả</span>
              <textarea rows={3} value={description} placeholder="Mô tả (tuỳ chọn)" onChange={(e) => setDescription(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 shadow-xs" />
            </label>
            {create.error && <p className="text-destructive">{create.error.message}</p>}
          </div>
        )}
        <DialogFooter>
          {step === 2 && <Button variant="ghost" className="mr-auto" onClick={() => setStep(1)}><ChevronLeft />Quay lại</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          {step === 1 ? (
            <Button disabled={!type} onClick={() => setStep(2)}>Tiếp tục</Button>
          ) : (
            <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name, description, formType: type! }, { onSuccess: (f) => { onOpenChange(false); navigate(`/workflow-forms/${f.id}`) } })}>
              {create.isPending ? "Đang tạo..." : "Tạo Form"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
