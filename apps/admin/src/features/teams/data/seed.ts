import type { Label, Membership, Team, TeamRole, WorkspaceUser } from "../types/team"

const at = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

// Mirrors the reference workspace: 3 teams, 4 roles, one owner member.
export const SEED_TEAMS: Team[] = [
  { id: "tm_owner", name: "Workspace Owner Team", description: "", labelIds: [], createdAt: at(30), updatedAt: at(30) },
  { id: "tm_general", name: "General Team", description: "", labelIds: [], createdAt: at(30), updatedAt: at(30) },
  { id: "tm_sales", name: "Sales", description: "", labelIds: [], createdAt: at(12), updatedAt: at(12) },
]

export const SEED_ROLES: TeamRole[] = [
  { id: "rl_owner", teamId: "tm_owner", name: "Workspace Owner Team Role", code: "Workspace Owner Team Role", description: "", labelIds: ["lb_leader"], createdAt: at(30) },
  { id: "rl_general", teamId: "tm_general", name: "General Team Role", code: "General Team Role", description: "", labelIds: [], createdAt: at(30) },
  { id: "rl_sales_lead", teamId: "tm_sales", name: "Quản lý", code: "Quan ly", description: "", labelIds: [], createdAt: at(12) },
  { id: "rl_sales_staff", teamId: "tm_sales", name: "Nhân viên", code: "Nhan vien", description: "", labelIds: [], createdAt: at(12) },
]

export const SEED_USERS: WorkspaceUser[] = [{ id: "u_baochau", username: "baochau", email: "baochau@example.com", fullName: "Bảo Châu" }]

export const SEED_MEMBERSHIPS: Membership[] = [{ userId: "u_baochau", teamId: "tm_owner", roleId: "rl_owner" }]

/** Team labels are empty in the reference workspace ("Không có nhãn nhóm"); roles have "leader". */
export const SEED_LABELS: Label[] = [{ id: "lb_leader", name: "leader", kind: "role", createdAt: at(30), updatedAt: at(30) }]
