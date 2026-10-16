import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { AddMemberInput, LabelType, RoleInput, TeamInput } from "../types/team"
import { teamsApi } from "./teams.api"

export const teamKeys = {
  all: ["teams"] as const,
  list: () => [...teamKeys.all, "list"] as const,
  detail: (id: string) => [...teamKeys.all, id] as const,
  roles: (teamId?: string) => [...teamKeys.all, "roles", teamId ?? "*"] as const,
  members: (teamId: string) => [...teamKeys.all, "members", teamId] as const,
  users: () => [...teamKeys.all, "users"] as const,
  labels: (kind?: LabelType) => [...teamKeys.all, "labels", kind ?? "*"] as const,
}
export const teamsListQuery = () => ({ queryKey: teamKeys.list(), queryFn: teamsApi.list })
export const useTeams = () => useQuery(teamsListQuery())
export const useTeam = (id: string) => useQuery({ queryKey: teamKeys.detail(id), queryFn: () => teamsApi.get(id), retry: false })
export const useTeamRoles = (teamId?: string) => useQuery({ queryKey: teamKeys.roles(teamId), queryFn: () => teamsApi.roles(teamId) })
export const useTeamMembers = (teamId: string) => useQuery({ queryKey: teamKeys.members(teamId), queryFn: () => teamsApi.members(teamId) })
export const useWorkspaceUsers = () => useQuery({ queryKey: teamKeys.users(), queryFn: teamsApi.users })
export const useLabels = (kind?: LabelType) => useQuery({ queryKey: teamKeys.labels(kind), queryFn: () => teamsApi.labels(kind) })

function useWrite<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }) })
}
export const useCreateTeam = () => useWrite((v: TeamInput) => teamsApi.create(v))
export const useUpdateTeam = () => useWrite(({ id, ...v }: TeamInput & { id: string }) => teamsApi.update(id, v))
export const useDeleteTeam = () => useWrite((id: string) => teamsApi.remove(id))
export const useCreateRole = (teamId: string) => useWrite((v: RoleInput) => teamsApi.createRole(teamId, v))
export const useUpdateRole = () => useWrite(({ id, ...v }: RoleInput & { id: string }) => teamsApi.updateRole(id, v))
export const useDeleteRole = () => useWrite((id: string) => teamsApi.removeRole(id))
export const useAddMember = () => useWrite((v: AddMemberInput) => teamsApi.addMember(v))
export const useRemoveFromRole = () => useWrite(({ roleId, userIds }: { roleId: string; userIds: string[] }) => teamsApi.removeFromRole(roleId, userIds))
export const useCreateLabel = () => useWrite(({ kind, name }: { kind: LabelType; name: string }) => teamsApi.createLabel(kind, name))
export const useUpdateLabel = () => useWrite(({ id, name }: { id: string; name: string }) => teamsApi.updateLabel(id, name))
export const useDeleteLabel = () => useWrite((id: string) => teamsApi.removeLabel(id))
