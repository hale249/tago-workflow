import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { RolePermissions } from "../types/permission"
import { permissionsApi } from "./permissions.api"

export const permissionKeys = {
  all: ["permissions"] as const,
  role: (teamId: string, roleId: string) => [...permissionKeys.all, teamId, roleId] as const,
}

export const useRolePermissions = (teamId: string, roleId: string) =>
  useQuery({ queryKey: permissionKeys.role(teamId, roleId), queryFn: () => permissionsApi.get(teamId, roleId), enabled: !!teamId && !!roleId })

export function useSaveRolePermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, roleId, value }: { teamId: string; roleId: string; value: RolePermissions }) => permissionsApi.save(teamId, roleId, value),
    onSuccess: (v, { teamId, roleId }) => qc.setQueryData(permissionKeys.role(teamId, roleId), v),
  })
}
