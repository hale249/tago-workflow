// Public API of the teams (Quản lý đội nhóm) feature.
export { TeamsPage } from "./pages/teams"
export { TeamDetailPage } from "./pages/team-detail"
export {
  teamKeys, teamsListQuery, useCreateLabel, useDeleteLabel, useDeleteTeam, useLabels, useTeamRoles, useTeams, useUpdateLabel,
} from "./api/teams.queries"
export type { Label, LabelKind, LabelType, TeamRole, TeamSummary } from "./types/team"
export { LabelCombobox } from "./components/label-combobox"
export { TeamFormDialog } from "./components/team-form-dialog"
