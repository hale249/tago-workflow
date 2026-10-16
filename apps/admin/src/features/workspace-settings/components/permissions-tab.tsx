import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FloppyDiskIcon, InformationCircleIcon, SecurityCheckIcon, Undo02Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"
import { Select } from "@/components/select"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { EmptyState, useTeamRoles, useTeams, type TeamRole } from "@/features/teams"
import { useRolePermissions, useSaveRolePermissions } from "../api/permissions.queries"
import { ACTION_COUNT, PERMISSION_RESOURCES, permissionKey } from "../data/permissions"
import type { RolePermissions } from "../types/permission"
import { TYPE } from "./settings-ui"

// Icon + text sit in an inner flex (4px gap), so the button keeps its 10px padding like the reference.
const BTN = "h-7 gap-1.5 px-2.5 shadow-xs [&_svg:not([class*='size-'])]:size-3.5"

export function PermissionsTab() {
  const { data: teams = [], isLoading } = useTeams()
  const [teamId, setTeamId] = useState("")
  const [roleId, setRoleId] = useState("")
  const team = teams.find((t) => t.id === teamId)
  const { data: roles = [], isLoading: rolesLoading } = useTeamRoles(teamId || undefined)
  const teamRoles = teamId ? roles.filter((r) => r.teamId === teamId) : []
  const role = teamRoles.find((r) => r.id === roleId)

  // Default to the first team, then its first role (like the reference).
  useEffect(() => { if (!team && teams[0]) setTeamId(teams[0].id) }, [teams, team])
  useEffect(() => { if (!rolesLoading && !role && teamRoles[0]) setRoleId(teamRoles[0].id) }, [rolesLoading, role, teamRoles])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium tracking-tight">Cấu hình phân quyền</h3>
        <p className="text-sm text-muted-foreground">Quản lý phân quyền theo nhóm và vai trò cho các hành động</p>
      </div>

      {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Đang tải nhóm và vai trò...</p> : !teams.length ? (
        <EmptyState icon={UserMultipleIcon} title="Không tìm thấy nhóm" description="Bạn cần tạo nhóm và vai trò trong workspace trước khi cấu hình phân quyền." />
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="perm-team" className="text-sm leading-none font-medium">Chọn nhóm</label>
                  <Select id="perm-team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setRoleId("") }}>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="perm-role" className="text-sm leading-none font-medium">Chọn vai trò</label>
                  <Select id="perm-role" value={roleId} disabled={!teamRoles.length} onChange={(e) => setRoleId(e.target.value)}>
                    {!role && <option value="">Chọn vai trò...</option>}
                    {teamRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                  {!rolesLoading && team && !teamRoles.length && <p className="text-xs text-muted-foreground">Không tìm thấy vai trò cho nhóm này.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-info/20 bg-info-subtle p-4">
              <div className="flex items-start gap-1">
                <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0 text-info" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-info">Ma trận phân quyền</p>
                  <p className="text-xs text-info">Cấu hình phân quyền cho từng vai trò và hành động. Các hành động khác nhau có tùy chọn phân quyền khác nhau dựa trên loại.</p>
                </div>
              </div>
            </div>
            {team && role ? <Matrix key={`${team.id}:${role.id}`} teamId={team.id} role={role} /> : (
              <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Vui lòng chọn nhóm và vai trò để xem cấu hình phân quyền.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** The role's matrix: edits stay in a draft until "Lưu thay đổi"; "Khôi phục" drops them. */
function Matrix({ teamId, role }: { teamId: string; role: TeamRole }) {
  const { data: saved, isLoading } = useRolePermissions(teamId, role.id)
  const save = useSaveRolePermissions()
  const [draft, setDraft] = useState<RolePermissions | null>(null)
  const [done, setDone] = useState(false)
  useEffect(() => { if (saved) setDraft(saved) }, [saved])
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 2500); return () => clearTimeout(t) }, [done])

  if (isLoading || !draft || !saved) return <Skeleton className="h-[640px] rounded-lg" />
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const configured = Object.keys(draft.actions).length
  const setAction = (key: string, v: string) => setDraft({ ...draft, actions: { ...draft.actions, [key]: v } })

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <span title={role.name} className="inline-flex h-[22px] w-fit max-w-[260px] items-center truncate rounded-md border border-transparent bg-primary px-1.5 text-xs font-medium whitespace-nowrap text-primary-foreground sm:max-w-[320px]">{role.name}</span>
            <p className="min-w-0 break-words text-foreground" style={TYPE.small}>Phân quyền vai trò</p>
          </div>
          <div className="min-w-0 lg:max-w-[360px]">
            <div className="flex min-w-0 items-start justify-between gap-4 sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-1.5">
                <HugeiconsIcon icon={SecurityCheckIcon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <label htmlFor="grant-permission" className="min-w-0 cursor-pointer text-sm leading-5 font-medium">Có thể cấp quyền cho người khác</label>
              </div>
              <button id="grant-permission" type="button" role="switch" aria-checked={draft.canGrant} onClick={() => setDraft({ ...draft, canGrant: !draft.canGrant })}
                className={cn("inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none", draft.canGrant ? "bg-primary" : "bg-input")}>
                <span className={cn("pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform", draft.canGrant ? "translate-x-5" : "translate-x-0")} />
              </button>
            </div>
          </div>
        </div>
        <div role="none" className="h-px w-full shrink-0 bg-border/80" />

        <div className="-mx-2 h-[500px] overflow-y-auto px-2">
          <div className="flex flex-col gap-4">
            {PERMISSION_RESOURCES.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 pt-2 first:pt-0">
                <div className="sticky top-0 z-10 bg-card py-1">
                  <p className="text-muted-foreground" style={TYPE.small}>{r.label}</p>
                  <div role="none" className="mt-1 h-px w-full shrink-0 bg-border/80" />
                </div>
                <div className="flex flex-col gap-2">
                  {r.actions.map((a) => {
                    const key = permissionKey(r.id, a.id)
                    return (
                      <div key={a.id} className="flex flex-col items-stretch justify-between gap-2 py-1 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-4">
                          <p className="text-foreground" style={TYPE.small}>{a.label}</p>
                          <p className="text-muted-foreground" style={TYPE.small}>{a.id}</p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                          <Select className="h-9" aria-label={`${r.label} – ${a.label}`} value={draft.actions[key] ?? "not_allowed"} onChange={(e) => setAction(key, e.target.value)}>
                            {a.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>Hành động: {ACTION_COUNT}</span>
            <span>Cấu hình: {configured}</span>
            {done && <span role="status" className="text-success">Cập nhật phân quyền thành công</span>}
            {save.isError && <span role="alert" className="text-destructive">Lưu phân quyền thất bại</span>}
          </div>
          <div className="flex w-full flex-nowrap items-center gap-1 sm:w-auto">
            <Button variant="outline" size="sm" className={cn(BTN, "border-input")} disabled={!dirty || save.isPending} onClick={() => setDraft(saved)}><span className="flex items-center gap-1"><HugeiconsIcon icon={Undo02Icon} /><span>Khôi phục</span></span></Button>
            <Button size="sm" className={BTN} disabled={!dirty || save.isPending} onClick={() => save.mutate({ teamId, roleId: role.id, value: draft }, { onSuccess: () => setDone(true) })}>
              <span className="flex items-center gap-1"><HugeiconsIcon icon={FloppyDiskIcon} /><span>{save.isPending ? "Đang lưu..." : "Lưu thay đổi"}</span></span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
