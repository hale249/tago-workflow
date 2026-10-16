import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Search01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"
import { Select } from "@/components/select"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useRemoveFromRole, useTeamMembers } from "../api/teams.queries"
import type { Team, TeamRole } from "../types/team"
import { AddMemberDialog } from "./add-member-dialog"
import { ConfirmDialog } from "./confirm-dialog"
import { Chip, EmptyState, MemberAvatar, SMALL_BTN, TABLE_CARD, TD, TH, TR } from "./team-ui"

type Removal = { roleId: string; userIds: string[] }

export function MembersTab({ team, roles }: { team: Team; roles: TeamRole[] }) {
  const { data: members = [], isLoading } = useTeamMembers(team.id)
  const remove = useRemoveFromRole()
  const [q, setQ] = useState("")
  const [roleId, setRoleId] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [removal, setRemoval] = useState<Removal | null>(null)

  const s = q.trim().toLowerCase()
  const list = members.filter((m) => (!roleId || m.roles.some((r) => r.id === roleId)) && (!s || `${m.fullName} ${m.username} ${m.email}`.toLowerCase().includes(s)))
  const shownPicked = picked.filter((id) => list.some((m) => m.id === id))
  const allOn = list.length > 0 && shownPicked.length === list.length
  const toggle = (id: string, on: boolean) => setPicked((p) => (on ? [...p, id] : p.filter((x) => x !== id)))

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-64">
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm thành viên..." className="pl-8" />
          </div>
          <Select value={roleId} onChange={(e) => { setRoleId(e.target.value); setPicked([]) }} className="w-full sm:w-[200px]" aria-label="Lọc theo vai trò">
            <option value="">Tất cả vai trò</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {shownPicked.length > 0 && (
            <>
              {!roleId && <span className="text-[13px] text-muted-foreground">Vui lòng chọn vai trò để thực hiện xóa hàng loạt</span>}
              <Button variant="outline" size="sm" className={cn(SMALL_BTN, "text-destructive hover:text-destructive")} disabled={!roleId} onClick={() => setRemoval({ roleId, userIds: shownPicked })}>
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />Xóa khỏi vai trò ({shownPicked.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className={SMALL_BTN} onClick={() => setAdding(true)}><HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />Thêm thành viên</Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-32" />}
      {!isLoading && !members.length && <EmptyState icon={UserMultipleIcon} title="Đội này chưa có thành viên nào" description="Thêm thành viên vào đội này để phân công công việc." />}
      {!isLoading && members.length > 0 && (
        <div className={TABLE_CARD}>
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className={TR}>
                  <th className={cn(TH, "w-[50px] pr-0")}>
                    <Checkbox aria-label="Select all" className="translate-y-[2px]" checked={allOn ? true : shownPicked.length ? "indeterminate" : false} onCheckedChange={(c) => setPicked(c === true ? list.map((m) => m.id) : [])} />
                  </th>
                  <th className={TH}>Tên</th>
                  <th className={cn(TH, "hidden md:table-cell")}>Tên đăng nhập</th>
                  <th className={cn(TH, "text-right")}>Vai trò</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {list.map((m) => {
                  const on = picked.includes(m.id)
                  return (
                    <tr key={m.id} className={TR} data-state={on ? "selected" : undefined}>
                      <td className={cn(TD, "pr-0")}><Checkbox aria-label={`Select ${m.fullName}`} className="translate-y-[2px]" checked={on} onCheckedChange={(c) => toggle(m.id, c === true)} /></td>
                      <td className={TD}><div className="flex items-center gap-3"><MemberAvatar /><div className="font-medium">{m.fullName}</div></div></td>
                      <td className={cn(TD, "hidden md:table-cell")}><div className="text-sm">{m.username}</div></td>
                      <td className={cn(TD, "text-right")}>
                        <div className="flex flex-col items-end gap-1">
                          {m.roles.map((r) => (
                            <div key={r.id} className="group/item flex items-center gap-2">
                              <Chip>{r.name}</Chip>
                              <Button variant="ghost" size="icon-xs" title="Xóa bỏ" aria-label={`Xóa ${m.fullName} khỏi ${r.name}`} className="opacity-0 transition-opacity group-hover/item:opacity-100 hover:bg-accent/50 focus-visible:opacity-100" onClick={() => setRemoval({ roleId: r.id, userIds: [m.id] })}>
                                <HugeiconsIcon icon={Delete02Icon} className="size-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy thành viên nào</p>}
          </div>
        </div>
      )}

      <AddMemberDialog open={adding} onOpenChange={setAdding} team={team} roles={roles} />
      <ConfirmDialog
        open={!!removal}
        onOpenChange={(o) => !o && setRemoval(null)}
        title="Xóa thành viên khỏi vai trò?"
        description={removal && `${removal.userIds.length} thành viên sẽ bị xóa khỏi vai trò “${roles.find((r) => r.id === removal.roleId)?.name ?? ""}”.`}
        confirmLabel="Xóa khỏi vai trò"
        pending={remove.isPending}
        onConfirm={() => removal && remove.mutate(removal, { onSuccess: () => { setPicked((p) => p.filter((id) => !removal.userIds.includes(id))); setRemoval(null) } })}
      />
    </div>
  )
}
