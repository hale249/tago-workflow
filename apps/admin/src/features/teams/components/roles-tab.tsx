import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, PencilEdit01Icon, Shield01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { SMALL_BTN, TABLE_CARD, TD, TH, TR } from "@workspace/ui/lib/styles"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteRole, useLabels } from "../api/teams.queries"
import type { TeamRole } from "../types/team"
import { LabelCombobox } from "./label-combobox"
import { RoleFormDialog } from "./role-form-dialog"
import { LabelPill } from "./team-ui"

export function RolesTab({ teamId, roles, isLoading }: { teamId: string; roles: TeamRole[]; isLoading?: boolean }) {
  const { data: labels = [] } = useLabels("role")
  const del = useDeleteRole()
  const [labelIds, setLabelIds] = useState<string[]>([])
  // `role: null` = create; the target is kept while closing so the title does not flip mid-animation.
  const [form, setForm] = useState<{ open: boolean; role: TeamRole | null }>({ open: false, role: null })
  const [deleting, setDeleting] = useState<TeamRole | null>(null)
  const list = roles.filter((r) => !labelIds.length || r.labelIds.some((id) => labelIds.includes(id)))
  const labelName = (id: string) => labels.find((l) => l.id === id)?.name

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex items-center justify-between gap-2">
        <div className="w-full sm:w-[260px]"><LabelCombobox kind="role" value={labelIds} onChange={setLabelIds} placeholder="Lọc theo nhãn vai trò" /></div>
        <Button variant="outline" size="sm" className={cn(SMALL_BTN, "shrink-0")} onClick={() => setForm({ open: true, role: null })}><HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />Tạo vai trò mới</Button>
      </div>

      {isLoading && <Skeleton className="h-32" />}
      {!isLoading && !roles.length && <EmptyState icon={Shield01Icon} title="Chưa có vai trò nào" description="Tạo vai trò để định nghĩa quyền hạn và trách nhiệm cho thành viên đội." />}
      {!isLoading && roles.length > 0 && (
        <div className={TABLE_CARD}>
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className={TR}>
                  <th className={TH}>Tên vai trò</th>
                  <th className={cn(TH, "hidden md:table-cell")}>Mã</th>
                  <th className={cn(TH, "hidden lg:table-cell")}>Mô tả</th>
                  <th className={cn(TH, "text-right")}>Hành động</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {list.map((r) => (
                  <tr key={r.id} className={TR}>
                    <td className={cn(TD, "font-medium")}>
                      <div className="flex items-center gap-2">{r.name}</div>
                      {r.labelIds.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{r.labelIds.map((id) => labelName(id) && <LabelPill key={id}>{labelName(id)}</LabelPill>)}</div>}
                      {r.description && <div className="mt-1 text-sm text-muted-foreground lg:hidden">{r.description}</div>}
                    </td>
                    <td className={cn(TD, "hidden text-muted-foreground md:table-cell")}>{r.code}</td>
                    <td className={cn(TD, "hidden max-w-md truncate text-muted-foreground lg:table-cell")}>{r.description || "—"}</td>
                    <td className={cn(TD, "text-right")}>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className={cn(SMALL_BTN, "hover:bg-accent/50")} onClick={() => setForm({ open: true, role: r })}><HugeiconsIcon icon={PencilEdit01Icon} className="size-4" /><span className="sr-only">Chỉnh sửa {r.name}</span></Button>
                        <Button variant="ghost" size="sm" className={cn(SMALL_BTN, "text-destructive hover:bg-accent/50 hover:text-destructive")} onClick={() => setDeleting(r)}><HugeiconsIcon icon={Delete02Icon} className="size-4" /><span className="sr-only">Xóa {r.name}</span></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">Không có vai trò nào khớp với nhãn đã chọn</p>}
          </div>
        </div>
      )}

      <RoleFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} teamId={teamId} role={form.role} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa vai trò?"
        description={deleting && `Vai trò “${deleting.name}” sẽ bị xóa và các thành viên đang giữ vai trò này sẽ bị gỡ khỏi vai trò. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vai trò"
        pending={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
