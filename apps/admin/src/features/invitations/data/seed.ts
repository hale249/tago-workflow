import type { Invitation } from "../types/invitation"

/** The reference account has no pending invitations, so the store starts empty. */
export const SEED_INVITATIONS: Invitation[] = []

/** Sample used for local testing: `useInvitationsDb.setState({ invitations: [SAMPLE_INVITATION] })`. */
export const SAMPLE_INVITATION: Invitation = {
  id: "inv_sample",
  workspaceId: "crestview",
  workspaceName: "Crestview",
  namespace: "crestview",
  color: "from-violet-400 to-violet-500",
  invitedBy: "Bảo Châu",
  team: "Kinh doanh",
  role: "Nhân viên",
  status: "PENDING",
  createdAt: "2026-03-20T09:00:00.000Z",
}
