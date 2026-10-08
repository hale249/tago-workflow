import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, Workflow } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">Cloud Logic (Workflow)</h1>
          <p className="text-sm text-muted-foreground">Tự động hoá quy trình bằng các sự kiện và bước xử lý</p>
        </div>
        <div className="relative w-full max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm workflow..." className="h-9 pl-8" />
        </div>
        <Button size="icon" variant="outline" aria-label="Làm mới" onClick={() => qc.invalidateQueries({ queryKey: workflowKeys.all })}><RefreshCw className={cn(isFetching && "animate-spin")} /></Button>
        <Button onClick={() => setDialog({ open: true })}><Plus />Tạo mới</Button>
      </header>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="overflow-hidden rounded-lg border">
          <p className="border-b px-3 py-2 text-xs text-muted-foreground">{list.length} workflow</p>
          {isLoading && <div className="space-y-2 p-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
          {list.map((u) => (
            <div key={u.id} className="group flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/40">
              <span className="grid size-8 place-items-center rounded-md bg-brand/10 text-brand"><Workflow className="size-4" /></span>
              <Link to={`/workflow-units/${u.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{u.name}</Link>
              <span className="text-sm text-muted-foreground max-sm:hidden">{stamp.format(new Date(u.updatedAt))}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Mở menu"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate(`/workflow-units/${u.id}`)}>Xem chi tiết</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog({ open: true, unit: u })}><Pencil />Chỉnh sửa</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá workflow “${u.name}” và toàn bộ sự kiện?`) && del.mutate(u.id)}><Trash2 />Xoá</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {!isLoading && !list.length && <p className="p-10 text-center text-sm text-muted-foreground">{q ? "Không tìm thấy workflow" : "Chưa có workflow nào"}</p>}
        </div>
      </div>
      <UnitDialog open={dialog.open} unit={dialog.unit} onOpenChange={(open) => setDialog((s) => ({ ...s, open }))} onSaved={(u) => !dialog.unit && navigate(`/workflow-units/${u.id}`)} />
    </section>
  )
}
