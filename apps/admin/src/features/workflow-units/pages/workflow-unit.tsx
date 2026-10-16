import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowRight01Icon, Calendar01Icon, ComputerTerminal01Icon, Delete01Icon, Delete02Icon, Edit01Icon, MoreHorizontalIcon, PencilEdit01Icon, WorkflowCircle01Icon } from "@hugeicons/core-free-icons"
import { WorkflowUnitIcon } from "@/components/icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteEvent, useDeleteUnit, useEvents, useSaveEvent, useUnit } from "../api/workflow.queries"
import { EventDialog } from "../components/event-dialog"
import { UnitDialog } from "../components/unit-dialog"
import { TRIGGERS } from "../data/node-types"
import type { WorkflowEvent } from "../types/workflow"
import { bodyStyle, headingStyle } from "../utils/typography"

const day = new Intl.DateTimeFormat("vi-VN")
const small = bodyStyle("small")

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none", on ? "bg-primary" : "bg-input")}>
      <span className={cn("pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform", on ? "translate-x-5" : "translate-x-0")} />
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
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-[var(--space-300)]">
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-300)]">
        <nav aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5">
            <li className="inline-flex items-center gap-1.5"><Link to="/" className="transition-colors hover:text-foreground">Workspace</Link></li>
            <li role="presentation" aria-hidden><HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" /></li>
            <li className="inline-flex items-center gap-1.5"><Link to="/workflow-units" className="transition-colors hover:text-foreground">Cloud Logic (Workflow)</Link></li>
            <li role="presentation" aria-hidden><HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" /></li>
            <li className="inline-flex items-center gap-1.5"><span role="link" aria-disabled="true" aria-current="page" className="font-normal text-foreground">{unit.name}</span></li>
          </ol>
        </nav>

        <div className="flex flex-col items-stretch justify-start gap-[var(--space-200)]">
          <div className="flex flex-nowrap items-center justify-between gap-0">
            <div className="flex min-w-0 flex-nowrap items-center justify-start gap-[var(--space-150)]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue-subtle"><HugeiconsIcon icon={WorkflowUnitIcon} className="size-5 text-accent-blue" /></div>
              <h1 className="text-2xl text-foreground" style={headingStyle(1)}>{unit.name}</h1>
            </div>
            <div className="flex shrink-0 flex-nowrap items-center justify-start gap-[var(--space-100)]">
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" onClick={() => setUnitOpen(true)}><HugeiconsIcon icon={Edit01Icon} className="size-4" />Sửa</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" onClick={() => window.confirm(`Xoá workflow “${unit.name}”?`) && delUnit.mutate(unit.id, { onSuccess: () => navigate("/workflow-units", { replace: true }) })}><HugeiconsIcon icon={Delete01Icon} className="size-4" />Xóa</Button>
            </div>
          </div>
          <div className="flex flex-nowrap items-center justify-start gap-[var(--space-200)] text-sm text-muted-foreground">
            <span className="inline-flex h-[22px] items-center rounded-md border border-accent-blue/30 bg-background px-1.5 text-xs font-medium whitespace-nowrap text-accent-blue">Cloud Logic (Workflow)</span>
            <p className="text-muted-foreground" style={small}>•</p>
            <div className="flex flex-nowrap items-center justify-start gap-[var(--space-050)]"><HugeiconsIcon icon={Calendar01Icon} className="size-3.5" /><p className="text-muted-foreground" style={small}>Tạo lúc {day.format(new Date(unit.createdAt))}</p></div>
            <p className="text-muted-foreground" style={small}>•</p>
            <p className="text-muted-foreground" style={small}>Cập nhật {day.format(new Date(unit.updatedAt))}</p>
          </div>
          {unit.description && <p className="text-muted-foreground" style={bodyStyle("default")}>{unit.description}</p>}
        </div>

        <div className="border-t border-border" />

        <div>
          <div className="mb-4 flex flex-nowrap items-center justify-between gap-0">
            <h2 className="text-foreground" style={headingStyle(2)}>Sự kiện quy trình</h2>
            <Button size="sm" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" onClick={() => setEventDialog({ open: true })}><HugeiconsIcon icon={Add01Icon} className="size-4" />Tạo sự kiện</Button>
          </div>
          <div className="rounded-md border">
            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-border/70 transition-colors hover:bg-muted/60 [&>th]:h-9 [&>th]:px-3 [&>th]:text-left [&>th]:align-middle [&>th]:text-[13px] [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground">
                    <th className="w-[300px]">Tên</th><th>Loại kích hoạt</th><th className="w-[100px]">Trạng thái</th><th className="w-[70px]" />
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {events.map((e) => {
                    const T = TRIGGERS[e.trigger.type]
                    const open = () => navigate(`/workflow-units/${unit.id}/events/${e.id}/edit`)
                    return (
                      <tr key={e.id} onClick={open} className="cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/50 [&>td]:h-9 [&>td]:px-3 [&>td]:py-1.5 [&>td]:align-middle">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={cn("flex size-8 items-center justify-center rounded-md transition-colors", T.chip)}><HugeiconsIcon icon={T.icon} className="size-4" /></div>
                            <div className="flex flex-col">
                              <Link to={`/workflow-units/${unit.id}/events/${e.id}/edit`} onClick={(ev) => ev.stopPropagation()} className="font-medium">{e.name}</Link>
                              <span className="text-xs text-muted-foreground lg:hidden">{e.trigger.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted-foreground"><span className="text-sm font-medium">{T.label}</span></td>
                        <td onClick={(ev) => ev.stopPropagation()}><Toggle on={e.active} label={e.active ? "Hoạt động" : "Tạm dừng"} onChange={(active) => saveEvent.mutate({ ...e, active })} /></td>
                        <td className="text-right" onClick={(ev) => ev.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Open menu"><HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={open}><HugeiconsIcon icon={WorkflowCircle01Icon} />Mở trình dựng</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => navigate(`/workflow-units/${unit.id}/events/${e.id}/console`)}><HugeiconsIcon icon={ComputerTerminal01Icon} />Console</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEventDialog({ open: true, event: e })}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá sự kiện “${e.name}”?`) && delEvent.mutate(e.id)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>
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
          </div>
        </div>
      </div>
      <UnitDialog open={unitOpen} unit={unit} onOpenChange={setUnitOpen} />
      <EventDialog open={eventDialog.open} event={eventDialog.event} unitId={unit.id} onOpenChange={(open) => setEventDialog((s) => ({ ...s, open }))}
        onSaved={(e) => !eventDialog.event && navigate(`/workflow-units/${unit.id}/events/${e.id}/edit`)} />
    </section>
  )
}
