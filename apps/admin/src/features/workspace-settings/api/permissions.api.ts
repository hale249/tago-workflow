import { usePermissionsDb } from "../store/permissions-db.store"
import type { RolePermissions } from "../types/permission"

// Swap for HTTP later: POST /api/workspace/{ws}/workspace/{get|patch}/team_role_permissions
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))
const key = (teamId: string, roleId: string) => `${teamId}:${roleId}`
const EMPTY: RolePermissions = { canGrant: false, actions: {} }

export const permissionsApi = {
  async get(teamId: string, roleId: string): Promise<RolePermissions> {
    await delay(60)
    return usePermissionsDb.getState().roles[key(teamId, roleId)] ?? EMPTY
  },
  async save(teamId: string, roleId: string, v: RolePermissions): Promise<RolePermissions> {
    await delay(250)
    usePermissionsDb.setState((s) => ({ roles: { ...s.roles, [key(teamId, roleId)]: v } }))
    return v
  },
}
