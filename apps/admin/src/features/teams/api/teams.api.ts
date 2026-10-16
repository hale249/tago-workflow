import { useTeamsDb } from "../store/teams-db.store"
import type { AddMemberInput, Label, LabelType, RoleInput, Team, TeamInput, TeamMember, TeamRole, TeamSummary } from "../types/team"

// Swap for HTTP later: POST /api/workspace/{ws}/workspace/{get|post|patch|delete}/{teams|team_roles|users}, label/get/labels
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))
const db = () => useTeamsDb.getState()
const write = useTeamsDb.setState
const now = () => new Date().toISOString()
const uid = () => Math.random().toString(36).slice(2, 12)
/** "Quản lý" -> "Quan ly" (the reference derives a role's code from its name). */
export const roleCode = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim()

const checkTeam = (v: TeamInput) => {
  if (!v.name.trim()) throw new Error("Tên đội nhóm không được để trống")
  if (v.name.trim().length > 100) throw new Error("Tên đội nhóm không được quá 100 ký tự")
  if (v.description.length > 500) throw new Error("Mô tả không được quá 500 ký tự")
}
const checkLabel = (name: string) => {
  if (!name.trim()) throw new Error("Tên nhãn không được để trống")
  if (name.trim().length > 100) throw new Error("Tên nhãn không được quá 100 ký tự")
}
const checkRole = (v: RoleInput) => {
  if (!v.name.trim()) throw new Error("Tên vai trò không được để trống")
  if (v.name.trim().length > 100) throw new Error("Tên vai trò không được quá 100 ký tự")
  if (v.description.length > 500) throw new Error("Mô tả không được quá 500 ký tự")
}

export const teamsApi = {
  async list(): Promise<TeamSummary[]> {
    await delay()
    const { teams, roles, memberships } = db()
    return teams.map((t) => ({
      ...t,
      roleCount: roles.filter((r) => r.teamId === t.id).length,
      memberCount: new Set(memberships.filter((m) => m.teamId === t.id).map((m) => m.userId)).size,
    }))
  },
  async get(id: string): Promise<Team> {
    await delay(60)
    const t = db().teams.find((x) => x.id === id)
    if (!t) throw new Error("Không tìm thấy đội nhóm")
    return t
  },
  async create(v: TeamInput): Promise<Team> {
    await delay()
    checkTeam(v)
    const t: Team = { id: uid(), name: v.name.trim(), description: v.description.trim(), labelIds: v.labelIds, createdAt: now(), updatedAt: now() }
    write((s) => ({ teams: [...s.teams, t] }))
    return t
  },
  async update(id: string, v: TeamInput): Promise<Team> {
    await delay()
    checkTeam(v)
    const next = { ...(await teamsApi.get(id)), name: v.name.trim(), description: v.description.trim(), labelIds: v.labelIds, updatedAt: now() }
    write((s) => ({ teams: s.teams.map((t) => (t.id === id ? next : t)) }))
    return next
  },
  /** Also drops the team's roles and memberships. */
  async remove(id: string) {
    await delay()
    write((s) => ({ teams: s.teams.filter((t) => t.id !== id), roles: s.roles.filter((r) => r.teamId !== id), memberships: s.memberships.filter((m) => m.teamId !== id) }))
  },

  async roles(teamId?: string): Promise<TeamRole[]> {
    await delay(60)
    return db().roles.filter((r) => !teamId || r.teamId === teamId)
  },
  async createRole(teamId: string, v: RoleInput): Promise<TeamRole> {
    await delay()
    checkRole(v)
    const r: TeamRole = { id: uid(), teamId, name: v.name.trim(), code: roleCode(v.name), description: v.description.trim(), labelIds: v.labelIds, createdAt: now() }
    write((s) => ({ roles: [...s.roles, r] }))
    return r
  },
  async updateRole(id: string, v: RoleInput): Promise<TeamRole> {
    await delay()
    checkRole(v)
    const cur = db().roles.find((r) => r.id === id)
    if (!cur) throw new Error("Không tìm thấy vai trò")
    const next = { ...cur, name: v.name.trim(), code: roleCode(v.name), description: v.description.trim(), labelIds: v.labelIds }
    write((s) => ({ roles: s.roles.map((r) => (r.id === id ? next : r)) }))
    return next
  },
  async removeRole(id: string) {
    await delay()
    write((s) => ({ roles: s.roles.filter((r) => r.id !== id), memberships: s.memberships.filter((m) => m.roleId !== id) }))
  },

  async members(teamId: string): Promise<TeamMember[]> {
    await delay(60)
    const { users, roles, memberships } = db()
    const mine = memberships.filter((m) => m.teamId === teamId)
    return users
      .filter((u) => mine.some((m) => m.userId === u.id))
      .map((u) => ({ ...u, roles: roles.filter((r) => mine.some((m) => m.userId === u.id && m.roleId === r.id)) }))
  },
  async users() {
    await delay(60)
    return db().users
  },
  /** Invites an existing user (matched by username) or creates the account first. */
  async addMember(v: AddMemberInput) {
    await delay(200)
    if (!v.roleId) throw new Error("Vui lòng chọn vai trò")
    const username = v.username.trim()
    let user = db().users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!user) {
      if (!username) throw new Error("Tên đăng nhập không được để trống")
      if (!v.password) throw new Error("Mật khẩu không được để trống")
      if (!/^\S+@\S+\.\S+$/.test(v.email ?? "")) throw new Error("Email không hợp lệ")
      user = { id: uid(), username, email: v.email!.trim(), fullName: v.fullName?.trim() || username }
      const created = user
      write((s) => ({ users: [...s.users, created] }))
    }
    const userId = user.id
    if (db().memberships.some((m) => m.userId === userId && m.roleId === v.roleId)) throw new Error("Thành viên đã có vai trò này")
    write((s) => ({ memberships: [...s.memberships, { userId, teamId: v.teamId, roleId: v.roleId }] }))
    return user
  },
  async removeFromRole(roleId: string, userIds: string[]) {
    await delay()
    write((s) => ({ memberships: s.memberships.filter((m) => !(m.roleId === roleId && userIds.includes(m.userId))) }))
  },

  /** All labels, or only one context ("notification" | "team" | "role"). */
  async labels(kind?: LabelType) {
    await delay(60)
    return db().labels.filter((l) => !kind || l.kind === kind)
  },
  async createLabel(kind: LabelType, name: string): Promise<Label> {
    await delay()
    checkLabel(name)
    const l: Label = { id: uid(), kind, name: name.trim(), createdAt: now(), updatedAt: now() }
    write((s) => ({ labels: [...s.labels, l] }))
    return l
  },
  /** Only the name can change (the reference locks the label type after creation). */
  async updateLabel(id: string, name: string): Promise<Label> {
    await delay()
    checkLabel(name)
    const cur = db().labels.find((l) => l.id === id)
    if (!cur) throw new Error("Không tìm thấy nhãn")
    const next = { ...cur, name: name.trim(), updatedAt: now() }
    write((s) => ({ labels: s.labels.map((l) => (l.id === id ? next : l)) }))
    return next
  },
  /** Also unassigns the label from teams and roles. */
  async removeLabel(id: string) {
    await delay()
    const drop = <T extends { labelIds: string[] }>(x: T) => (x.labelIds.includes(id) ? { ...x, labelIds: x.labelIds.filter((l) => l !== id) } : x)
    write((s) => ({ labels: s.labels.filter((l) => l.id !== id), teams: s.teams.map(drop), roles: s.roles.map(drop) }))
  },
}
