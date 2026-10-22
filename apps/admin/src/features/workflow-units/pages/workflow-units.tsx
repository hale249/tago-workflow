import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, MoreVerticalIcon, PencilEdit01Icon, RefreshIcon, Search01Icon } from "@hugeicons/core-free-icons"
import { WorkflowUnitIcon } from "@/components/icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { headingStyle } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteUnit, useUnits, workflowKeys } from "../api/workflow.queries"
import { UnitDialog } from "../components/unit-dialog"
import type { WorkflowUnit } from "../types/workflow"

const stamp = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" })

export function WorkflowUnitsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: units = [], isLoading, isFetching } = useUnits()
  const del = useDeleteUnit()
  const [q, setQ] = useState("")
  const [dialog, setDialog] = useState<{ open: boolean; unit?: WorkflowUnit }>({ open: false })
  const list = units.filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-[var(--space-300)]">
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-200)]">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-foreground" style={headingStyle(1)}>Cloud Logic (Workflow)</h1>
            <p className="text-[13px] text-muted-foreground">Quản lý các workflow tự động hóa quy trình công việc</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Tìm kiếm workflow..." placeholder="Tìm kiếm workflow..." className="h-8 pl-8" />
            </div>
            <Button size="icon-sm" variant="outline" aria-label="Làm mới" onClick={() => qc.invalidateQueries({ queryKey: workflowKeys.all })}><HugeiconsIcon icon={RefreshIcon} className={cn("size-4", isFetching && "animate-spin")} /></Button>
            <Button size="sm" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" onClick={() => setDialog({ open: true })}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />Tạo mới</Button>
          </div>
        </header>
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          <p className="flex h-9 items-center px-3 text-xs text-muted-foreground tabular-nums">{list.length} workflow</p>
          {isLoading && <div className="space-y-2 p-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
          {list.map((u) => (
            <div key={u.id} role="button" tabIndex={0} onClick={() => navigate(`/workflow-units/${u.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/workflow-units/${u.id}`)}
              className="group flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-blue-subtle text-accent-blue"><HugeiconsIcon icon={WorkflowUnitIcon} className="size-4" /></span>
              <Link to={`/workflow-units/${u.id}`} onClick={(e) => e.stopPropagation()} className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{u.name}</Link>
              <span className="hidden shrink-0 text-[13px] text-muted-foreground tabular-nums sm:block">{stamp.format(new Date(u.updatedAt))}</span>
              <div className="shrink-0 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground"><HugeiconsIcon icon={MoreVerticalIcon} className="size-4" /><span className="sr-only">Mở menu</span></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate(`/workflow-units/${u.id}`)}>Xem chi tiết</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDialog({ open: true, unit: u })}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá workflow “${u.name}” và toàn bộ sự kiện?`) && del.mutate(u.id)}><HugeiconsIcon icon={Delete02Icon} />Xoá</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {!isLoading && !list.length && <p className="p-10 text-center text-sm text-muted-foreground">{q ? "Không tìm thấy workflow" : "Chưa có workflow nào"}</p>}
        </div>
      </div>
      <UnitDialog open={dialog.open} unit={dialog.unit} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))} onSaved={(u) => !dialog.unit && navigate(`/workflow-units/${u.id}`)} />
    </section>
  )
}
