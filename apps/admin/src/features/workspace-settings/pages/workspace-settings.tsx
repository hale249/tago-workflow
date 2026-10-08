import { useState } from "react"
import { Link } from "react-router"
import { CalendarDays, ChevronLeft, Clock, Cpu, FolderKanban, Pencil, Plus, Server, Shield, Tag, Trash2, UserPlus, Users, type LucideIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateWorkGroup, useRecordCounts, useTables, useWorkGroups, useWorkspaceUsers } from "@/features/tables"
import { useSettingsStore, type Label, type LabelType, type Team } from "../settings.store"

const uid = () => Math.random().toString(36).slice(2, 10)
const sel = "h-9 rounded-md border border-input bg-transparent px-3 text-sm"
const set = useSettingsStore.setState
const nf = new Intl.NumberFormat("vi-VN")

function Card({ title, description, action, icon: Icon, children }: { title: string; description?: string; action?: React.ReactNode; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-sm font-semibold">{Icon && <Icon className="size-4 text-muted-foreground" />}{title}</h2>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** One-line "add" input used across tabs. */
function AddRow({ placeholder, onAdd, label = "Tạo mới" }: { placeholder: string; onAdd: (v: string) => void; label?: string }) {
  const [v, setV] = useState("")
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV("") } }
  return (
    <div className="flex gap-2">
      <Input value={v} placeholder={placeholder} className="h-9" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
      <Button size="sm" className="h-9" disabled={!v.trim()} onClick={add}><Plus />{label}</Button>
    </div>
  )
}

// ── Thông tin hệ thống ──
const LIMITS: [string, number][] = [
  ["Thành viên Workspace", 10], ["Bảng dữ liệu (Active Table)", 20], ["Sự kiện quy trình tuỳ chỉnh", 30], ["Sự kiện quy trình", 1000],
  ["Đơn vị Workflow", 1000], ["Biểu mẫu (Opt-in Form)", 1000], ["Kết nối Workflow", 1000], ["Nhóm làm việc", 1000], ["Vai trò trong Workspace", 1000],
]
function SystemTab() {
  const { data: tables = [] } = useTables()
  const { data: counts = {} } = useRecordCounts()
  return (
    <div className="space-y-4">
      <Card icon={Server} title="Thông tin cơ bản" description="Thông số cấu hình kỹ thuật của workspace">
        <dl className="divide-y text-sm">
          {([[Clock, "Múi giờ", "GMT+7"], [Cpu, "Giới hạn CPU", "1 WCPU"], [CalendarDays, "Ngày bắt đầu", "2026-03-15 00:00:00"], [CalendarDays, "Ngày hết hạn", "2027-03-15 23:59:59"]] as const).map(([Icon, k, v]) => (
            <div key={k} className="flex items-center gap-2 py-2.5"><Icon className="size-4 text-muted-foreground" /><dt className="flex-1">{k}</dt><dd className="font-mono text-muted-foreground tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card title="Giới hạn tài nguyên" description="Số lượng tối đa của từng loại tài nguyên trong workspace">
        <table className="-mx-5 w-[calc(100%+2.5rem)] text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="px-5 py-2 font-normal">Tài nguyên</th><th className="px-5 py-2 text-right font-normal">Giới hạn</th></tr></thead>
          <tbody>{LIMITS.map(([k, n]) => <tr key={k} className="border-t"><td className="px-5 py-2.5 font-medium">{k}</td><td className="px-5 py-2.5 text-right tabular-nums">{nf.format(n)}</td></tr>)}</tbody></table>
      </Card>
      <Card title="Giới hạn bản ghi theo Active Table" description="Giới hạn và số bản ghi đã dùng của từng bảng">
        <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5">Bảng dữ liệu</th><th className="py-1.5 text-right">Giới hạn</th><th className="py-1.5 text-right">Đã dùng</th></tr></thead>
          <tbody>{tables.map((t) => {
            const used = counts[t.id] ?? 0
            return (
              <tr key={t.id} className="border-t">
                <td className="py-2"><p>{t.name}</p><p className="font-mono text-xs text-muted-foreground">{t.id}</p></td>
                <td className="py-2 text-right tabular-nums">{nf.format(50000)}</td>
                <td className="py-2 text-right"><span className="tabular-nums">{nf.format(used)}</span><div className="ml-auto mt-1 h-1 w-24 rounded bg-muted"><div className="h-1 rounded bg-brand" style={{ width: `${Math.min(100, (used / 50000) * 100)}%` }} /></div></td>
              </tr>
            )
          })}</tbody></table>
      </Card>
    </div>
  )
}

// ── Nhóm công việc ──
function WorkGroupsTab() {
  const { data: groups = [] } = useWorkGroups()
  const { data: tables = [] } = useTables()
  const create = useCreateWorkGroup()
  return (
    <Card title="Nhóm công việc" description="Nhóm các bảng theo danh mục để dễ quản lý">
      <AddRow placeholder="Tên nhóm mới" onAdd={(name) => create.mutate({ name })} />
      <ul className="mt-3 divide-y rounded-lg border">
        {groups.map((g) => (
          <li key={g.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span className="flex-1 font-medium">{g.name}</span>
            <span className="text-xs text-muted-foreground">{tables.filter((t) => t.workGroupId === g.id).length} bảng</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Nhóm (đội, vai trò, thành viên) ──
function TeamsTab() {
  const teams = useSettingsStore((s) => s.teams)
  const { data: users = [] } = useWorkspaceUsers()
  const [openId, setOpenId] = useState(teams[0]?.id ?? "")
  const patch = (id: string, fn: (t: Team) => Team) => set((s) => ({ teams: s.teams.map((t) => (t.id === id ? fn(t) : t)) }))
  const team = teams.find((t) => t.id === openId)
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card title="Quản lý đội nhóm" description="Tổ chức thành viên workspace theo đội">
        <AddRow placeholder="Tên đội nhóm" label="Tạo" onAdd={(name) => { const id = uid(); set((s) => ({ teams: [...s.teams, { id, name, description: "", roles: [], members: [] }] })); setOpenId(id) }} />
        <ul className="mt-3 space-y-1">
          {teams.map((t) => (
            <li key={t.id}><button type="button" onClick={() => setOpenId(t.id)} className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm", openId === t.id ? "bg-brand/10 font-medium text-brand" : "hover:bg-muted")}>
              {t.name}<span className="text-xs text-muted-foreground">{t.members.length}</span></button></li>
          ))}
        </ul>
      </Card>
      {team ? (
        <Card title={team.name} description={team.description || "Vai trò và thành viên của đội"}
          action={<Button size="sm" variant="outline" className="text-destructive" onClick={() => window.confirm(`Xóa đội nhóm “${team.name}”?`) && (set((s) => ({ teams: s.teams.filter((t) => t.id !== team.id) })), setOpenId(""))}><Trash2 />Xóa</Button>}>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Vai trò</p>
              <div className="flex flex-wrap gap-1.5">
                {team.roles.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm">{r.name}
                    <button type="button" aria-label={`Xóa vai trò ${r.name}`} onClick={() => patch(team.id, (t) => ({ ...t, roles: t.roles.filter((x) => x.id !== r.id), members: t.members.filter((m) => m.roleId !== r.id) }))}><Trash2 className="size-3" /></button>
                  </span>
                ))}
                {!team.roles.length && <span className="text-xs text-muted-foreground">Chưa có vai trò nào</span>}
              </div>
              <AddRow placeholder="vd: Trưởng nhóm, Nhân viên" label="Tạo vai trò" onAdd={(name) => patch(team.id, (t) => ({ ...t, roles: [...t.roles, { id: uid(), name }] }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Thành viên</p>
              <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Tên</th><th className="py-1">Vai trò</th><th /></tr></thead>
                <tbody>{team.members.map((m) => (
                  <tr key={m.userId} className="border-t">
                    <td className="py-2">{users.find((u) => u.id === m.userId)?.fullName ?? m.userId}</td>
                    <td className="py-2"><select className={cn(sel, "h-8")} value={m.roleId} onChange={(e) => patch(team.id, (t) => ({ ...t, members: t.members.map((x) => (x.userId === m.userId ? { ...x, roleId: e.target.value } : x)) }))}>
                      {team.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></td>
                    <td className="py-2 text-right"><Button size="icon-sm" variant="ghost" aria-label="Xóa khỏi đội" onClick={() => patch(team.id, (t) => ({ ...t, members: t.members.filter((x) => x.userId !== m.userId) }))}><Trash2 /></Button></td>
                  </tr>
                ))}</tbody></table>
              {!team.members.length && <p className="text-xs text-muted-foreground">Đội này chưa có thành viên nào</p>}
              <AddMember team={team} users={users} onAdd={(userId, roleId) => patch(team.id, (t) => ({ ...t, members: [...t.members, { userId, roleId }] }))} />
            </div>
          </div>
        </Card>
      ) : <Card title="Chưa chọn đội"><p className="text-sm text-muted-foreground">Tạo đội nhóm đầu tiên để tổ chức thành viên và phân vai trò.</p></Card>}
    </div>
  )
}
function AddMember({ team, users, onAdd }: { team: Team; users: { id: string; fullName: string }[]; onAdd: (userId: string, roleId: string) => void }) {
  const [userId, setUserId] = useState("")
  const [roleId, setRoleId] = useState("")
  const free = users.filter((u) => !team.members.some((m) => m.userId === u.id))
  return (
    <div className="flex flex-wrap gap-2">
      <select className={sel} value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Chọn thành viên…</option>{free.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select>
      <select className={sel} value={roleId} onChange={(e) => setRoleId(e.target.value)}><option value="">Vai trò…</option>{team.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <Button size="sm" className="h-9" disabled={!userId || !roleId} onClick={() => { onAdd(userId, roleId); setUserId(""); setRoleId("") }}><UserPlus />Thêm thành viên</Button>
    </div>
  )
}

// ── Quyền ──
const SUBJECTS = ["Bảng dữ liệu", "Nhóm công việc", "Cloud Logic (Workflow)", "Biểu mẫu", "Kết nối", "Nhãn", "Nhóm", "Vai trò", "Vai trò nhóm", "Người dùng", "Facebook", "Instagram", "WhatsApp", "Zalo"]
const SCOPES = [["none", "Không cho phép"], ["view", "Chỉ xem"], ["manage", "Toàn quyền"]] as const
function PermissionsTab() {
  const { teams, permissions } = useSettingsStore()
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "")
  const team = teams.find((t) => t.id === teamId)
  const [roleId, setRoleId] = useState(team?.roles[0]?.id ?? "")
  const key = `${teamId}:${roleId}`
  return (
    <Card title="Cấu hình phân quyền" description="Phân quyền theo nhóm và vai trò cho từng đối tượng trong workspace">
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <label className="grid gap-1"><span className="text-xs font-medium">Chọn nhóm</span>
          <select className={sel} value={teamId} onChange={(e) => { setTeamId(e.target.value); setRoleId(teams.find((t) => t.id === e.target.value)?.roles[0]?.id ?? "") }}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="grid gap-1"><span className="text-xs font-medium">Chọn vai trò</span>
          <select className={sel} value={roleId} onChange={(e) => setRoleId(e.target.value)}>{team?.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      </div>
      {!team?.roles.length ? <p className="text-sm text-muted-foreground">Không tìm thấy vai trò cho nhóm này.</p> : (
        <div className="divide-y rounded-lg border">
          {SUBJECTS.map((s) => (
            <div key={s} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1">{s}</span>
              <select className={cn(sel, "h-8")} value={permissions[key]?.[s] ?? "none"} onChange={(e) => set((st) => ({ permissions: { ...st.permissions, [key]: { ...st.permissions[key], [s]: e.target.value } } }))}>
                {SCOPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Nhãn ──
const LABEL_TABS: [LabelType, string][] = [["notification", "Thông báo"], ["workspace_team_role", "Vai trò"], ["workspace_team", "Nhóm"]]
function LabelsTab() {
  const labels = useSettingsStore((s) => s.labels)
  const [type, setType] = useState<LabelType>("notification")
  const [q, setQ] = useState("")
  const list = labels.filter((l) => l.type === type && l.name.toLowerCase().includes(q.trim().toLowerCase()))
  const name = LABEL_TABS.find((t) => t[0] === type)![1]
  const upd = (id: string, p: Partial<Label>) => set((s) => ({ labels: s.labels.map((l) => (l.id === id ? { ...l, ...p, updatedAt: new Date().toISOString() } : l)) }))
  return (
    <Card title="Quản lý nhãn" description="Nhãn theo ngữ cảnh sử dụng, dùng để lọc và phân loại dữ liệu">
      <div className="mb-3 flex flex-wrap items-center gap-1">
        {LABEL_TABS.map(([t, l]) => <button key={t} type="button" onClick={() => setType(t)} className={cn("h-8 rounded-md px-3 text-sm", type === t ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-muted")}>{l}</button>)}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm nhãn..." className="ml-auto h-8 w-56" />
      </div>
      <AddRow placeholder="Tên nhãn" label="Thêm nhãn" onAdd={(n) => set((s) => ({ labels: [...s.labels, { id: uid(), type, name: n, updatedAt: new Date().toISOString() }] }))} />
      {list.length ? (
        <table className="mt-3 w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5">Tên nhãn</th><th className="py-1.5">Ngày cập nhật</th><th /></tr></thead>
          <tbody>{list.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="py-2">{l.name}</td><td className="py-2 text-muted-foreground">{new Date(l.updatedAt).toLocaleDateString("vi-VN")}</td>
              <td className="py-2 text-right">
                <Button size="icon-sm" variant="ghost" aria-label="Chỉnh sửa nhãn" onClick={() => { const n = window.prompt("Tên nhãn", l.name); if (n?.trim()) upd(l.id, { name: n.trim() }) }}><Pencil /></Button>
                <Button size="icon-sm" variant="ghost" aria-label="Xóa nhãn" onClick={() => window.confirm(`Xóa nhãn “${l.name}”?`) && set((s) => ({ labels: s.labels.filter((x) => x.id !== l.id) }))}><Trash2 /></Button>
              </td>
            </tr>
          ))}</tbody></table>
      ) : <p className="mt-6 text-center text-sm text-muted-foreground"><b className="block text-foreground">Chưa có nhãn</b>Chưa có nhãn nào trong nhóm “{name}”. Hãy tạo nhãn đầu tiên.</p>}
    </Card>
  )
}

const TABS = [["system", "Thông tin hệ thống", SystemTab, Server], ["groups", "Nhóm công việc", WorkGroupsTab, FolderKanban], ["teams", "Nhóm", TeamsTab, Users], ["perms", "Quyền", PermissionsTab, Shield], ["labels", "Nhãn", LabelsTab, Tag]] as const

export function WorkspaceSettingsPage() {
  const [tab, setTab] = useState<string>("system")
  const Active = TABS.find((t) => t[0] === tab)![2]
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <header className="flex items-center gap-2 px-5 pt-5">
        <Link to="/" aria-label="Quay lại" className="rounded p-1 text-muted-foreground hover:bg-muted"><ChevronLeft className="size-5" /></Link>
        <h1 className="text-2xl font-semibold">Evergreen - Cài đặt</h1>
      </header>
      <div role="tablist" className="mx-5 mt-4 flex gap-1 overflow-x-auto border-b">
        {TABS.map(([id, label, , Icon]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cn("-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm", tab === id ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}><Icon className="size-4" />{label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5"><Active /></div>
    </section>
  )
}
