import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, MoreVerticalIcon, PencilEdit01Icon, Shield01Icon, UserMultipleIcon, ViewIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { ConfirmDialog, EmptyState, LabelCombobox, SMALL_BTN, TeamFormDialog, useDeleteTeam, useTeams, type TeamSummary } from "@/features/teams"
import { SearchBox, SectionHeader } from "./settings-ui"

/** Same data, dialogs and rows as /team; a row opens /team/:teamId. */
export function TeamsTab() {
  const navigate = useNavigate()
  const { data: teams = [], isLoading } = useTeams()
  const del = useDeleteTeam()
  const [q, setQ] = useState("")
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [form, setForm] = useState<{ open: boolean; team: TeamSummary | null }>({ open: false, team: null })
  const [deleting, setDeleting] = useState<TeamSummary | null>(null)
  const s = q.trim().toLowerCase()
  const list = teams.filter((t) => (!s || `${t.name} ${t.description}`.toLowerCase().includes(s)) && (!labelIds.length || t.labelIds.some((id) => labelIds.includes(id))))
  const open = (id: string) => navigate(`/team/${id}`)

  return (
    <div className="space-y-6">
      <SectionHeader title="Quản lý nhóm" description="Tạo và quản lý các nhóm trong workspace. Mỗi nhóm có thể có nhiều vai trò và thành viên." layout="lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <SearchBox value={q} onChange={setQ} placeholder="Tìm kiếm nhóm..." />
          <div className="w-full sm:w-[240px]"><LabelCombobox kind="team" value={labelIds} onChange={setLabelIds} placeholder="Lọc theo nhãn" /></div>
          <Button size="sm" className={cn(SMALL_BTN, "w-full shadow-xs sm:w-auto [&_svg:not([class*='size-'])]:size-3.5")} onClick={() => setForm({ open: true, team: null })}><HugeiconsIcon icon={Add01Icon} />Tạo nhóm mới</Button>
        </div>
      </SectionHeader>

      {isLoading && <Skeleton className="h-40" />}
      {!isLoading && !teams.length && <EmptyState icon={UserMultipleIcon} title="Chưa có nhóm nào" description="Tạo nhóm đầu tiên để tổ chức thành viên workspace và phân công vai trò." />}
      {!isLoading && teams.length > 0 && !list.length && <p className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy nhóm nào</p>}
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
              <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 has-[[data-state=open]]:opacity-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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

      <TeamFormDialog open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} team={form.team} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa nhóm"
        description={deleting && `Nhóm “${deleting.name}” cùng các vai trò và thành viên của nhóm sẽ bị xóa. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        pending={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
