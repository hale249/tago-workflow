import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { tablesListQuery } from "@/features/tables"
import { formsListQuery } from "@/features/workflow-forms"
import { useSaveEvent } from "../api/workflow.queries"
import { TRIGGERS } from "../data/node-types"
import type { TriggerType, WorkflowEvent } from "../types/workflow"

const select = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"

/** Create / edit an event: name + trigger configuration. Steps are edited in the canvas. */
export function EventDialog({ open, onOpenChange, unitId, event, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; unitId: string; event?: WorkflowEvent; onSaved?: (e: WorkflowEvent) => void }) {
  const save = useSaveEvent()
  const { data: tables = [] } = useQuery(tablesListQuery())
  const { data: forms = [] } = useQuery(formsListQuery())
  const [name, setName] = useState("")
  const [type, setType] = useState<TriggerType>("ACTIVE_TABLE")
  const [params, setParams] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!open) return
    setName(event?.name ?? "")
    setType(event?.trigger.type ?? "ACTIVE_TABLE")
    setParams(event?.trigger.params ?? {})
  }, [open, event])
  const set = (k: string, v: string) => setParams({ ...params, [k]: v })
  const valid = name.trim() && (type !== "ACTIVE_TABLE" || params.tableId) && (type !== "SCHEDULE" || params.expression) && (type !== "FORM" || params.formId)

  const submit = () =>
    save.mutate(
      { ...(event ?? { unitId, active: false, startPosition: { x: 40, y: 160 }, steps: [] }), id: event?.id, name: name.trim(), trigger: { type, params } },
      { onSuccess: (e) => { onSaved?.(e); onOpenChange(false) } },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Sửa sự kiện" : "Tạo sự kiện mới"}</DialogTitle>
          <DialogDescription>Sự kiện chạy chuỗi bước khi điều kiện kích hoạt xảy ra.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          <label className="grid gap-1.5"><span className="font-medium">Tên sự kiện <span className="text-destructive">*</span></span><Input value={name} autoFocus onChange={(e) => setName(e.target.value)} /></label>
          <div className="grid gap-1.5">
            <span className="font-medium">Cấu hình kích hoạt</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TRIGGERS) as TriggerType[]).map((t) => {
                const T = TRIGGERS[t]
                return (
                  <button key={t} type="button" onClick={() => { setType(t); setParams({}) }}
                    className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-left", type === t && "border-brand ring-1 ring-brand")}>
                    <span className="grid size-7 place-items-center rounded-md" style={{ backgroundColor: `${T.color}1a`, color: T.color }}><T.icon className="size-4" /></span>
                    {T.label}
                  </button>
                )
              })}
            </div>
          </div>
          {type === "ACTIVE_TABLE" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5"><span>Bảng</span>
                <select className={select} value={params.tableId ?? ""} onChange={(e) => set("tableId", e.target.value)}>
                  <option value="">Chọn bảng…</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5"><span>Khi bản ghi được</span>
                <select className={select} value={params.action ?? "create"} onChange={(e) => set("action", e.target.value)}>
                  <option value="create">Tạo mới</option><option value="update">Cập nhật</option><option value="delete">Xoá</option><option value="action">Chạy hành động tuỳ chỉnh</option>
                </select>
              </label>
            </div>
          )}
          {type === "SCHEDULE" && (
            <label className="grid gap-1.5"><span>Biểu thức cron</span>
              <Input className="font-mono" placeholder="0 8 * * *" value={params.expression ?? ""} onChange={(e) => set("expression", e.target.value)} />
              <span className="text-xs text-muted-foreground">phút giờ ngày tháng thứ — vd “0 8 * * *” = 8:00 mỗi ngày</span>
            </label>
          )}
          {type === "WEBHOOK" && (
            <label className="grid gap-1.5"><span>Đường dẫn nhận</span><Input className="font-mono" placeholder="/hooks/ten-su-kien" value={params.path ?? ""} onChange={(e) => set("path", e.target.value)} /></label>
          )}
          {type === "FORM" && (
            <label className="grid gap-1.5"><span>Biểu mẫu</span>
              <select className={select} value={params.formId ?? ""} onChange={(e) => set("formId", e.target.value)}>
                <option value="">{forms.length ? "Chọn biểu mẫu…" : "Chưa có biểu mẫu — tạo ở mục Biểu mẫu"}</option>{forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
          )}
          {save.error && <p className="text-destructive">{save.error.message}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!valid || save.isPending} onClick={submit}>{event ? "Lưu" : "Tạo sự kiện"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
