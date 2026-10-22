import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Select } from "@workspace/ui/components/select"
import { DIALOG_CONTENT, INPUT_FIELD, TEXTAREA_FIELD } from "@workspace/ui/lib/styles"
import { cn } from "@workspace/ui/lib/utils"
import { tablesListQuery } from "@/features/tables"
import { formsListQuery } from "@/features/workflow-forms"
import { useSaveEvent } from "../api/workflow.queries"
import type { TriggerType, WorkflowEvent } from "../types/workflow"

/** Same order and labels as the reference "Loại kích hoạt" select. */
const TRIGGER_OPTIONS: [TriggerType, string][] = [["SCHEDULE", "Lịch trình (Cron)"], ["WEBHOOK", "Webhook"], ["FORM", "Gửi biểu mẫu"], ["ACTIVE_TABLE", "Sự kiện bảng"]]
const DEFAULT_PARAMS: Partial<Record<TriggerType, Record<string, string>>> = { SCHEDULE: { expression: "0 9 * * 1" } }

const label = "text-xs font-medium tracking-wide text-foreground uppercase"
const hint = "ml-1 text-[10px] text-muted-foreground"
const footerButton = "h-7 gap-1.5 px-2.5 py-0 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5"

function Field({ title, htmlFor, children }: { title: string; htmlFor?: string; children: ReactNode }) {
  return <div className="space-y-1.5"><label className={label} htmlFor={htmlFor}>{title}</label>{children}</div>
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="relative flex w-full items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-primary">
      <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 shrink-0" />
      <div className="text-xs text-foreground/80 [&_p]:leading-relaxed">{children}</div>
    </div>
  )
}

/** Create / edit an event: name, description + trigger configuration. Steps are edited in the canvas. */
export function EventDialog({ open, onOpenChange, unitId, event, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; unitId: string; event?: WorkflowEvent; onSaved?: (e: WorkflowEvent) => void }) {
  const save = useSaveEvent()
  const { data: tables = [] } = useQuery(tablesListQuery())
  const { data: forms = [] } = useQuery(formsListQuery())
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<TriggerType>("SCHEDULE")
  const [params, setParams] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!open) return
    setName(event?.name ?? "")
    setDescription(event?.description ?? "")
    setType(event?.trigger.type ?? "SCHEDULE")
    setParams(event?.trigger.params ?? { ...DEFAULT_PARAMS.SCHEDULE })
  }, [open, event])
  const set = (k: string, v: string) => setParams({ ...params, [k]: v })
  const valid = name.trim() && (type !== "ACTIVE_TABLE" || params.tableId) && (type !== "SCHEDULE" || params.expression?.trim()) && (type !== "FORM" || params.formId)

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!valid) return
    save.mutate(
      { ...(event ?? { unitId, active: false, startPosition: { x: 40, y: 160 }, steps: [] }), id: event?.id, name: name.trim(), description: description.trim(), trigger: { type, params } },
      { onSuccess: (e) => { onSaved?.(e); onOpenChange(false) } },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CONTENT, "max-w-lg sm:max-w-lg")}>
        <DialogHeader className="gap-0 space-y-1.5">
          <DialogTitle className="tracking-tight">{event ? "Chỉnh sửa sự kiện workflow" : "Tạo sự kiện mới"}</DialogTitle>
          <DialogDescription className="text-xs">Tạo sự kiện mới để kích hoạt quy trình tự động</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <Field title="Tên sự kiện *" htmlFor="event-name">
            <input id="event-name" type="text" required maxLength={100} autoFocus placeholder="Đồng bộ khách hàng hàng ngày" className={cn(INPUT_FIELD, "h-9")}
              value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field title="Mô tả (tùy chọn)" htmlFor="event-description">
            <textarea id="event-description" rows={2} maxLength={500} placeholder="Đồng bộ dữ liệu khách hàng từ CRM lúc 9h sáng mỗi ngày" className={cn(TEXTAREA_FIELD, "resize-none")}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cấu hình kích hoạt</h3>
            <div className="space-y-4">
              <Field title="Loại kích hoạt">
                <Select className="w-full hover:bg-muted/50" aria-label="Loại kích hoạt" value={type} onChange={(e) => { const t = e.target.value as TriggerType; setType(t); setParams({ ...DEFAULT_PARAMS[t] }) }}>
                  {TRIGGER_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <div className="space-y-4">
                {type === "SCHEDULE" && (
                  <>
                    <Field title="Biểu thức Cron" htmlFor="cron-expression">
                      <input id="cron-expression" type="text" placeholder="0 9 * * 1" className={cn(INPUT_FIELD, "h-9 font-mono")} value={params.expression ?? ""} onChange={(e) => set("expression", e.target.value)} />
                      <p className={hint}>Ví dụ: "0 9 * * 1" chạy mỗi thứ Hai lúc 9 giờ sáng</p>
                    </Field>
                    <Note>Trình tạo cron nâng cao với tùy chọn múi giờ sẽ có trong bản cập nhật tương lai.</Note>
                  </>
                )}
                {type === "WEBHOOK" && (
                  <>
                    <Field title="ID Webhook" htmlFor="webhook-id">
                      <input id="webhook-id" type="text" className={cn(INPUT_FIELD, "h-9 font-mono")} value={params.path ?? ""} onChange={(e) => set("path", e.target.value)} />
                      <p className={hint}>ID này sẽ được sử dụng để tạo URL webhook</p>
                    </Field>
                    <Note>Hiển thị URL webhook, quản lý token bảo mật và chọn phương thức HTTP sẽ có trong bản cập nhật tương lai.</Note>
                  </>
                )}
                {type === "FORM" && (
                  <>
                    <Field title="Chọn biểu mẫu">
                      <Select className="w-full" aria-label="Chọn biểu mẫu" value={params.formId ?? ""} onChange={(e) => set("formId", e.target.value)}>
                        <option value="">Chọn một biểu mẫu</option>{forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </Select>
                    </Field>
                    <Note>Danh sách chọn biểu mẫu, checkbox hành động (gửi/duyệt/từ chối) và điều kiện trường sẽ có trong bản cập nhật tương lai.</Note>
                  </>
                )}
                {type === "ACTIVE_TABLE" && (
                  <>
                    <Field title="Chọn bảng">
                      <Select className="w-full" aria-label="Chọn bảng" value={params.tableId ?? ""} onChange={(e) => set("tableId", e.target.value)}>
                        <option value="">{tables.length ? "Chọn một bảng" : "Không có bảng nào trong workspace này"}</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Select>
                    </Field>
                    <Field title="Hành động">
                      <Select className="w-full" aria-label="Hành động" value={params.action ?? "create"} onChange={(e) => set("action", e.target.value)}>
                        <option value="create">Tạo mới</option><option value="update">Cập nhật</option><option value="delete">Xoá</option><option value="action">Chạy hành động tuỳ chỉnh</option>
                      </Select>
                    </Field>
                  </>
                )}
              </div>
            </div>
          </div>
          {save.error && <p className="text-sm text-destructive">{event ? "Không thể cập nhật sự kiện" : "Không thể tạo sự kiện"}: {save.error.message}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" size="sm" variant="outline" className={cn(footerButton, "border-input")} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className={cn(footerButton, "shadow-xs")} disabled={!valid || save.isPending}>{event ? "Lưu thay đổi" : "Tạo sự kiện"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
