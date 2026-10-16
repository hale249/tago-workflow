import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_PERMISSIONS } from "../data/permissions"
import type { RolePermissions } from "../types/permission"

/** Local stand-in for the permission backend: `${teamId}:${roleId}` -> matrix. Only `permissions.api.ts` touches it. */
export const usePermissionsDb = create<{ roles: Record<string, RolePermissions> }>()(
  persist(() => ({ roles: SEED_PERMISSIONS }), { name: "tago-permissions-db", version: 2, migrate: () => ({ roles: SEED_PERMISSIONS }) }),
)
