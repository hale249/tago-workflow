import { useInvitationsDb } from "../store/invitations-db.store"
import type { Invitation, InvitationStatus } from "../types/invitation"

// Swap for HTTP later: POST /api/user/me/get/workspace_invitations, .../workspace_invitations/{id}/{accept|reject}
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))
const db = () => useInvitationsDb.getState()

async function respond(id: string, status: InvitationStatus): Promise<Invitation> {
  await delay(600)
  const cur = db().invitations.find((i) => i.id === id && i.status === "PENDING")
  if (!cur) throw new Error("Lời mời không còn hiệu lực.")
  const next = { ...cur, status }
  useInvitationsDb.setState((s) => ({ invitations: s.invitations.map((i) => (i.id === id ? next : i)) }))
  return next
}

export const invitationsApi = {
  async listPending() {
    await delay()
    if (db().failList) throw new Error("Không thể tải lời mời vào workspace")
    return db().invitations.filter((i) => i.status === "PENDING")
  },
  accept: (id: string) => respond(id, "ACCEPTED"),
  reject: (id: string) => respond(id, "REJECTED"),
}
