import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, MoreVerticalIcon, PencilEdit01Icon, Search01Icon, Shield01Icon, UserMultipleIcon, ViewIcon } from "@hugeicons/core-free-icons"
import { WORKSPACES } from "@/config/navigation"

import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { SMALL_BTN } from "@workspace/ui/lib/styles"
import { useDeleteTeam, useTeams } from "../api/teams.queries"
import { TeamFormDialog } from "../components/team-form-dialog"
import { Chip } from "../components/team-ui"
import type { TeamSummary } from "../types/team"

export function TeamsPage() {
  const navigate = useNavigate()
  const { data: teams = [], isLoading } = useTeams()
  const del = useDeleteTeam()
  const [q, setQ] = useState("")
  // `team: null` = create; the target is kept while closing so the title does not flip mid-animation.
  const [form, setForm] = useState<{ open: boolean; team: TeamSummary | null }>({ open: false, team: null })
  const [deleting, setDeleting] = useState<TeamSummary | null>(null)
  const s = q.trim().toLowerCase()
  const list = teams.filter((t) => !s || `${t.name} ${t.description}`.toLowerCase().includes(s))
  const roleCount = teams.reduce((n, t) => n + t.roleCount, 0)
  const open = (id: string) => navigate(`/team/${id}`)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-6">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">Quản lý đội nhóm</h1>
            <p className="text-xs leading-[18px] text-muted-foreground">Workspace • {WORKSPACES[0]!.name}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm đội nhóm..." className="h-10 rounded-lg border-border/60 pl-8" />
            </div>
            <Button size="sm" className={SMALL_BTN} onClick={() => setForm({ open: true, team: null })}><HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />Tạo đội nhóm mới</Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-5">
          <Chip icon={UserMultipleIcon}>{teams.length} đội nhóm</Chip>
          <Chip icon={Shield01Icon}>{roleCount} vai trò</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><Chip dashed>{list.length} đội nhóm</Chip></div>

        {isLoading && <Skeleton className="h-40" />}
        {!isLoading && !teams.length && <EmptyState icon={UserMultipleIcon} title="Chưa có đội nhóm nào" description="Tạo đội nhóm đầu tiên để tổ chức thành viên workspace và phân công vai trò." />}
        {!isLoading && teams.length > 0 && !list.length && <p className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy đội nhóm nào</p>}
        {list.length > 0 && (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {list.map((t) => (
              <div key={t.id} role="button" tabIndex={0} onClick={() => open(t.id)} onKeyDown={(e) => e.target === e.currentTarget && e.key === "Enter" && open(t.id)}
                className="group flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-blue-subtle text-accent-blue"><HugeiconsIcon icon={UserMultipleIcon} className="size-4" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-foreground">{t.name}</div></div>
                <div className="hidden shrink-0 items-center gap-3 text-[13px] text-muted-foreground sm:flex">
                  <span>Đội nhóm</span>
                  <span className="inline-flex items-center gap-1 tabular-nums"><HugeiconsIcon icon={Shield01Icon} className="size-3" />{t.roleCount} vai trò</span>
                </div>
                <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 has-[[data-state=open]]:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground hover:bg-accent/50" aria-label="Mở menu"><HugeiconsIcon icon={MoreVerticalIcon} /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setForm({ open: true, team: t })}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => open(t.id)}><HugeiconsIcon icon={ViewIcon} />Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(t)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeamFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} team={form.team} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa đội nhóm?"
        description={deleting && `Đội nhóm “${deleting.name}” cùng các vai trò và thành viên của đội sẽ bị xóa. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa đội nhóm"
        pending={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </section>
  )
}
