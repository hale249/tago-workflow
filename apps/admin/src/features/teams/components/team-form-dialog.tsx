import { useCreateTeam, useUpdateTeam } from "../api/teams.queries"
import type { Team } from "../types/team"
import { DetailsFormDialog } from "./details-form-dialog"

const COMMON = { nameLabel: "Tên đội nhóm", namePlaceholder: "ví dụ: Kỹ thuật, Marketing", descPlaceholder: "Mô tả mục đích và trách nhiệm của đội", labelPlaceholder: "Chọn nhãn cho nhóm", subject: "Tên đội nhóm" }
const CREATE = { ...COMMON, title: "Tạo đội nhóm mới", description: "Tạo đội nhóm mới để tổ chức thành viên workspace", submit: "Tạo đội nhóm mới" }
const EDIT = { ...COMMON, title: "Chỉnh sửa đội nhóm", description: "Cập nhật thông tin đội nhóm bên dưới", submit: "Cập nhật đội nhóm" }

/** Create (no `team`) or edit a team. */
export function TeamFormDialog({ open, onOpenChange, team }: { open: boolean; onOpenChange: (o: boolean) => void; team?: Team | null }) {
  const create = useCreateTeam()
  const update = useUpdateTeam()
  const m = team ? update : create
  const done = { onSuccess: () => onOpenChange(false) }
  return (
    <DetailsFormDialog
      open={open}
      onOpenChange={(o) => { if (!o) m.reset(); onOpenChange(o) }}
      kind="team"
      texts={team ? EDIT : CREATE}
      initial={team ? { name: team.name, description: team.description, labelIds: team.labelIds } : undefined}
      pending={m.isPending}
      error={m.error?.message}
      onSubmit={(v) => (team ? update.mutate({ id: team.id, ...v }, done) : create.mutate(v, done))}
    />
  )
}
