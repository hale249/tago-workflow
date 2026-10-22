import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { FormRow } from "@workspace/ui/components/form-row"
import { Input } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"
import { useAddMember, useWorkspaceUsers } from "../api/teams.queries"
import type { Team, TeamRole } from "../types/team"

type Fields = { username: string; password: string; email: string; fullName: string; roleId: string }
type Errors = Partial<Record<keyof Fields, string>>
const blank: Fields = { username: "", password: "", email: "", fullName: "", roleId: "" }

/**
 * "Thêm thành viên": a username that already exists in the workspace switches to invite mode
 * (no password / email needed); otherwise the account is created and added to the chosen role.
 */
export function AddMemberDialog({ open, onOpenChange, team, roles }: { open: boolean; onOpenChange: (o: boolean) => void; team: Team; roles: TeamRole[] }) {
  const add = useAddMember()
  const { data: users = [] } = useWorkspaceUsers()
  const [v, setV] = useState<Fields>(blank)
  const [errors, setErrors] = useState<Errors>({})
  useEffect(() => { if (open) { setV(blank); setErrors({}); add.reset() } }, [open])
  const existing = users.find((u) => v.username.trim() && u.username.toLowerCase() === v.username.trim().toLowerCase())
  const set = (k: keyof Fields, value: string) => { setV({ ...v, [k]: value }); setErrors({ ...errors, [k]: undefined }) }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {
      username: !v.username.trim() ? "Tên đăng nhập không được để trống" : undefined,
      password: !existing && !v.password ? "Mật khẩu không được để trống" : undefined,
      email: !existing && !/^\S+@\S+\.\S+$/.test(v.email.trim()) ? "Email không hợp lệ" : undefined,
      roleId: !v.roleId ? "Vui lòng chọn vai trò" : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    add.mutate(
      { teamId: team.id, roleId: v.roleId, username: v.username, ...(existing ? {} : { password: v.password, email: v.email, fullName: v.fullName }) },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">Thêm thành viên</DialogTitle>
          <DialogDescription>Mời người dùng hiện có hoặc tạo tài khoản mới</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <FormRow label="Tên đăng nhập" required error={errors.username} hint={existing ? `Người dùng “${existing.fullName}” đã có trong workspace — sẽ được mời vào đội.` : undefined}>
            <Input autoFocus autoComplete="off" value={v.username} placeholder="Nhập tên đăng nhập" onChange={(e) => set("username", e.target.value)} />
          </FormRow>
          {!existing && (
            <>
              <FormRow label="Mật khẩu" required error={errors.password}>
                <Input type="password" autoComplete="new-password" value={v.password} placeholder="Nhập mật khẩu cho tài khoản mới" onChange={(e) => set("password", e.target.value)} />
              </FormRow>
              <FormRow label="Email" required error={errors.email}>
                <Input type="email" value={v.email} placeholder="user@example.com" onChange={(e) => set("email", e.target.value)} />
              </FormRow>
              <FormRow label="Họ tên (Tùy chọn)">
                <Input value={v.fullName} placeholder="Nguyễn Văn A" onChange={(e) => set("fullName", e.target.value)} />
              </FormRow>
            </>
          )}
          <FormRow label="Đội nhóm" required>
            <Select value={team.id} disabled><option value={team.id}>{team.name}</option></Select>
          </FormRow>
          <FormRow label="Vai trò" required error={errors.roleId}>
            {roles.length ? (
              <Select value={v.roleId} onChange={(e) => set("roleId", e.target.value)}>
                <option value="" disabled>Chọn vai trò</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            ) : (
              <p className="rounded-md border border-dashed px-3 py-2 text-[13px] text-muted-foreground">Đội này chưa có vai trò. Tạo vai trò trước khi thêm thành viên.</p>
            )}
          </FormRow>
          {add.error && <p className="text-sm text-destructive">{add.error.message}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3" disabled={add.isPending || !roles.length}>
              {existing ? (add.isPending ? "Đang mời..." : "Mời thành viên") : add.isPending ? "Đang tạo..." : "Tạo và thêm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
