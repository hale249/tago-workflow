export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED"
/** One workspace invitation addressed to the current user (reference: GET /api/user/me/get/workspace_invitations). */
export type Invitation = {
  id: string
  workspaceId: string
  workspaceName: string
  namespace: string
  /** Tailwind gradient stops for the initials avatar. */
  color: string
  invitedBy: string
  /** Team / role the inviter assigned; undefined -> "… chưa xác định". */
  team?: string
  role?: string
  status: InvitationStatus
  createdAt: string
}
