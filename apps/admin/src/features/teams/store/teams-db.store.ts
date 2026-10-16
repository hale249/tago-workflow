import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_LABELS, SEED_MEMBERSHIPS, SEED_ROLES, SEED_TEAMS, SEED_USERS } from "../data/seed"
import type { Label, Membership, Team, TeamRole, WorkspaceUser } from "../types/team"

type TeamsDb = { teams: Team[]; roles: TeamRole[]; users: WorkspaceUser[]; memberships: Membership[]; labels: Label[] }

/** Local stand-in for the workspace teams backend (teams, team_roles, users, labels). */
export const useTeamsDb = create<TeamsDb>()(
  persist(() => ({ teams: SEED_TEAMS, roles: SEED_ROLES, users: SEED_USERS, memberships: SEED_MEMBERSHIPS, labels: SEED_LABELS }), { name: "tago-teams-db", version: 1 }),
)
