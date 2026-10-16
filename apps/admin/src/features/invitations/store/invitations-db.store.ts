import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_INVITATIONS } from "../data/seed"
import type { Invitation } from "../types/invitation"

type InvitationsDb = {
  invitations: Invitation[]
  /** Dev switch: make the next list request fail (exercises the error state). */
  failList: boolean
}

/** Local stand-in for the invitations backend. */
export const useInvitationsDb = create<InvitationsDb>()(
  persist((): InvitationsDb => ({ invitations: SEED_INVITATIONS, failList: false }), { name: "tago-invitations-db", version: 1 }),
)

/** Pending invitations for the sidebar "Lời mời" item and the dashboard banner. */
export const usePendingInvitationCount = () =>
  useInvitationsDb((s) => s.invitations.filter((i) => i.status === "PENDING").length)
