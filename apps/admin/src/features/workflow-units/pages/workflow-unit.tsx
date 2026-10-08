import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Calendar, ChevronRight, MoreHorizontal, Pencil, Plus, Terminal, Trash2, Workflow } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useDeleteEvent, useDeleteUnit, useEvents, useSaveEvent, useUnit } from "../api/workflow.queries"
import { EventDialog } from "../components/event-dialog"
import { UnitDialog } from "../components/unit-dialog"
import { TRIGGERS } from "../data/node-types"
import type { WorkflowEvent } from "../types/workflow"

const day = new Intl.DateTimeFormat("vi-VN")

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-brand" : "bg-input"}`}>
      <span className={`inline-block size-4 rounded-full bg-background shadow transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  )
}

export function WorkflowUnitPage() {
  const { unitId = "" } = useParams()
  const navigate = useNavigate()
  const { data: unit, error } = useUnit(unitId)
  const { data: events = [], isLoading } = useEvents(unitId)
  const saveEvent = useSaveEvent()
  const delEvent = useDeleteEvent()
  const delUnit = useDeleteUnit()
  const [unitOpen, setUnitOpen] = useState(false)
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event?: WorkflowEvent }>({ open: false })

  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Workflow không tồn tại. <Link to="/workflow-units" className="text-brand hover:underline">Quay lại</Link></p>
  if (!unit) return <Skeleton className="h-full w-full rounded-lg" />

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Workspace</Link><ChevronRight className="size-3.5" />
        <Link to="/workflow-units" className="hover:text-foreground">Cloud Logic (Workflow)</Link><ChevronRight className="size-3.5" />
        <span className="text-foreground">{unit.name}</span>
      </nav>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand"><Workflow className="size-5" /></span>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold">{unit.name}</h1>
        <Button size="sm" variant="outline" onClick={() => setUnitOpen(true)}><Pencil />Sửa</Button>
        <Button size="sm" variant="outline" onClick={() => window.confirm(`Xoá workflow “${unit.name}”?`) && delUnit.mutate(unit.id, { onSuccess: () => navigate("/workflow-units", { replace: true }) })}><Trash2 />Xóa</Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-b pb-5 text-xs text-muted-foreground">
        <span className="rounded border border-brand/40 px-1.5 py-0.5 text-brand">Cloud Logic (Workflow)</span>
        <span>•</span><span className="flex items-center gap-1"><Calendar className="size-3.5" />Tạo lúc {day.format(new Date(unit.createdAt))}</span>
        <span>•</span><span>Cập nhật {day.format(new Date(unit.updatedAt))}</span>
      </div>
      {unit.description && <p className="mt-3 text-sm text-muted-foreground">{unit.description}</p>}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sự kiện quy trình</h2>
        <Button size="sm" onClick={() => setEventDialog({ open: true })}><Plus />Tạo sự kiện</Button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Tên</th><th className="px-3 py-2 font-medium">Loại kích hoạt</th><th className="w-24 px-3 py-2 font-medium">Trạng thái</th><th className="w-12" /></tr></thead>
          <tbody>
            {events.map((e) => {
              const T = TRIGGERS[e.trigger.type]
              return (
                <tr key={e.id} className="border-t hover:bg-muted/40">
                  <td className="px-3 py-2">
                    <Link to={`/workflow-units/${unit.id}/events/${e.id}/edit`} className="flex items-center gap-2.5 font-medium hover:underline">
                      <span className="grid size-8 place-items-center rounded-md" style={{ backgroundColor: `${T.color}1a`, color: T.color }}><T.icon className="size-4" /></span>{e.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{T.label}</td>
                  <td className="px-3 py-2"><Toggle on={e.active} label={e.active ? "Hoạt động" : "Tạm dừng"} onChange={(active) => saveEvent.mutate({ ...e, active })} /></td>
                  <td className="px-2 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Open menu"><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/workflow-units/${unit.id}/events/${e.id}/edit`)}><Workflow />Mở trình dựng</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate(`/workflow-units/${unit.id}/events/${e.id}/console`)}><Terminal />Console</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEventDialog({ open: true, event: e })}><Pencil />Chỉnh sửa</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá sự kiện “${e.name}”?`) && delEvent.mutate(e.id)}><Trash2 />Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
            {!isLoading && !events.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Chưa có sự kiện nào</td></tr>}
          </tbody>
        </table>
      </div>
      <UnitDialog open={unitOpen} unit={unit} onOpenChange={setUnitOpen} />
      <EventDialog open={eventDialog.open} event={eventDialog.event} unitId={unit.id} onOpenChange={(open) => setEventDialog((s) => ({ ...s, open }))}
        onSaved={(e) => !eventDialog.event && navigate(`/workflow-units/${unit.id}/events/${e.id}/edit`)} />
    </section>
  )
}
