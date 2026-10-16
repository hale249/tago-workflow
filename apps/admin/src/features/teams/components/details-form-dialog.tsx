import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import type { LabelKind, TeamInput } from "../types/team"
import { LabelCombobox } from "./label-combobox"
import { DIALOG_CONTENT, DialogField, TEXTAREA } from "./team-ui"

export type DetailsTexts = {
  title: string
  description: string
  nameLabel: string
  namePlaceholder: string
  descPlaceholder: string
  labelPlaceholder: string
  submit: string
  /** Subject used in the validation messages ("Tên đội nhóm", "Tên vai trò"). */
  subject: string
}

const blank: TeamInput = { name: "", description: "", labelIds: [] }

/** Name + description + labels form shared by the team and role dialogs (same layout in the reference). */
export function DetailsFormDialog({ open, onOpenChange, kind, texts, initial, pending, error, onSubmit }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  kind: LabelKind
  texts: DetailsTexts
  initial?: TeamInput
  pending?: boolean
  error?: string
  onSubmit: (v: TeamInput) => void
}) {
  const [v, setV] = useState<TeamInput>(blank)
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  useEffect(() => { if (open) { setV(initial ?? blank); setErrors({}) } }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: !v.name.trim() ? `${texts.subject} không được để trống` : v.name.trim().length > 100 ? `${texts.subject} không được quá 100 ký tự` : undefined,
      description: v.description.length > 500 ? "Mô tả không được quá 500 ký tự" : undefined,
    }
    setErrors(next)
    if (!next.name && !next.description) onSubmit(v)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${DIALOG_CONTENT} sm:max-w-[500px]`}>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <DialogField label={texts.nameLabel} required error={errors.name}>
            <Input autoFocus value={v.name} placeholder={texts.namePlaceholder} onChange={(e) => { setV({ ...v, name: e.target.value }); setErrors({ ...errors, name: undefined }) }} />
          </DialogField>
          <DialogField label="Mô tả (Tùy chọn)" error={errors.description}>
            <textarea rows={4} value={v.description} placeholder={texts.descPlaceholder} className={TEXTAREA} onChange={(e) => { setV({ ...v, description: e.target.value }); setErrors({ ...errors, description: undefined }) }} />
          </DialogField>
          <DialogField label="Nhãn (Tùy chọn)">
            <LabelCombobox kind={kind} value={v.labelIds} onChange={(labelIds) => setV({ ...v, labelIds })} placeholder={texts.labelPlaceholder} />
          </DialogField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3" disabled={pending}>{texts.submit}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
