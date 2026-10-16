import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invitationsApi } from "./invitations.api"

export const invitationKeys = { all: ["invitations"] as const, pending: () => [...invitationKeys.all, "pending"] as const }
export const pendingInvitationsQuery = () => ({ queryKey: invitationKeys.pending(), queryFn: invitationsApi.listPending, retry: false })
export const usePendingInvitations = () => useQuery(pendingInvitationsQuery())

function useRespond(fn: (id: string) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: invitationKeys.all }) })
}
export const useAcceptInvitation = () => useRespond(invitationsApi.accept)
export const useRejectInvitation = () => useRespond(invitationsApi.reject)
