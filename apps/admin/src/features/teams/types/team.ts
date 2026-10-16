export type LabelKind = "team" | "role"
/** Every label context of the workspace (Cài đặt → Nhãn); `team` / `role` are the ones teams and roles use. */
export type LabelType = "notification" | LabelKind
export type Label = { id: string; name: string; kind: LabelType; createdAt?: string; updatedAt?: string }
export type Team = { id: string; name: string; description: string; labelIds: string[]; createdAt: string; updatedAt: string }
/** `code` is the name with diacritics stripped ("Quản lý" -> "Quan ly"), like the reference. */
export type TeamRole = { id: string; teamId: string; name: string; code: string; description: string; labelIds: string[]; createdAt: string }
export type WorkspaceUser = { id: string; username: string; email: string; fullName: string }
/** One row per (user, team, role): a user can hold several roles in a team. */
export type Membership = { userId: string; teamId: string; roleId: string }

export type TeamSummary = Team & { roleCount: number; memberCount: number }
export type TeamMember = WorkspaceUser & { roles: TeamRole[] }

export type TeamInput = { name: string; description: string; labelIds: string[] }
export type RoleInput = { name: string; description: string; labelIds: string[] }
export type AddMemberInput = { teamId: string; roleId: string; username: string; password?: string; email?: string; fullName?: string }
