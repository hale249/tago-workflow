import { useCreateRole, useUpdateRole } from "../api/teams.queries"
import type { TeamRole } from "../types/team"
import { DetailsFormDialog } from "./details-form-dialog"

const COMMON = { nameLabel: "Tên vai trò", namePlaceholder: "ví dụ: Lập trình viên, Quản lý, Thiết kế", descPlaceholder: "Mô tả trách nhiệm và quyền hạn của vai trò", labelPlaceholder: "Chọn nhãn cho vai trò", subject: "Tên vai trò" }
const CREATE = { ...COMMON, title: "Tạo vai trò mới", description: "Tạo vai trò mới để gán cho thành viên đội", submit: "Tạo vai trò" }
const EDIT = { ...COMMON, title: "Chỉnh sửa vai trò", description: "Cập nhật thông tin vai trò bên dưới", submit: "Cập nhật vai trò" }

/** Create (no `role`) or edit a role of `teamId`. */
export function RoleFormDialog({ open, onOpenChange, teamId, role }: { open: boolean; onOpenChange: (o: boolean) => void; teamId: string; role?: TeamRole | null }) {
  const create = useCreateRole(teamId)
  const update = useUpdateRole()
  const m = role ? update : create
  const done = { onSuccess: () => onOpenChange(false) }
  return (
    <DetailsFormDialog
      open={open}
      onOpenChange={(o) => { if (!o) m.reset(); onOpenChange(o) }}
      kind="role"
      texts={role ? EDIT : CREATE}
      initial={role ? { name: role.name, description: role.description, labelIds: role.labelIds } : undefined}
      pending={m.isPending}
      error={m.error?.message}
      onSubmit={(v) => (role ? update.mutate({ id: role.id, ...v }, done) : create.mutate(v, done))}
    />
  )
}
