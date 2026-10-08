import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Team = { id: string; name: string; description: string; roles: { id: string; name: string }[]; members: { userId: string; roleId: string }[] }
export type LabelType = "notification" | "workspace_team_role" | "workspace_team"
export type Label = { id: string; type: LabelType; name: string; updatedAt: string }
/** permissions[teamId:roleId][subject] = scope */
type State = { teams: Team[]; labels: Label[]; permissions: Record<string, Record<string, string>> }

const SEED: State = {
  teams: [
    { id: "team_owner", name: "Ban quản trị", description: "Chủ workspace", roles: [{ id: "role_owner", name: "Chủ workspace" }], members: [{ userId: "u_me", roleId: "role_owner" }] },
    { id: "team_sales", name: "Kinh doanh", description: "", roles: [{ id: "role_sales_lead", name: "Trưởng nhóm" }, { id: "role_sales", name: "Nhân viên" }], members: [{ userId: "u_lan", roleId: "role_sales_lead" }, { userId: "u_minh", roleId: "role_sales" }] },
    { id: "team_ops", name: "Vận hành", description: "", roles: [{ id: "role_ops_lead", name: "Trưởng nhóm" }, { id: "role_ops", name: "Nhân viên" }], members: [{ userId: "u_huong", roleId: "role_ops_lead" }, { userId: "u_khoa", roleId: "role_ops" }] },
  ],
  labels: [{ id: "lb_leader", type: "workspace_team_role", name: "leader", updatedAt: new Date().toISOString() }],
  permissions: {},
}

/** Local stand-in for workspace settings (teams, roles, labels, permission matrix). */
export const useSettingsStore = create<State>()(persist(() => SEED, { name: "tago-workspace-settings", version: 1 }))
