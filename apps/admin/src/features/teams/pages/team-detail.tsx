import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Shield01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useTeam, useTeamRoles } from "../api/teams.queries"
import { MembersTab } from "../components/members-tab"
import { RolesTab } from "../components/roles-tab"

const TABS = [
  { id: "members", label: "Thành viên", icon: UserMultipleIcon },
  { id: "roles", label: "Vai trò", icon: Shield01Icon },
] as const

/** Team page with Thành viên / Vai trò tabs; the tab lives in `?tab=roles` like the reference. */
export function TeamDetailPage() {
  const { teamId = "" } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") === "roles" ? "roles" : "members"
  const { data: team, isLoading, isError } = useTeam(teamId)
  const { data: roles = [], isLoading: rolesLoading } = useTeamRoles(teamId)

  if (isError)
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium">Không tìm thấy đội nhóm</p>
        <Button asChild variant="outline" size="sm"><Link to="/team">Quay lại danh sách</Link></Button>
      </section>
    )

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-6">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" className="-ml-2 hover:bg-accent/50" aria-label="Quay lại" onClick={() => navigate("/team")}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /></Button>
            {team ? <h1 className="truncate text-2xl font-semibold tracking-[-0.01em] text-foreground">{team.name}</h1> : <Skeleton className="h-8 w-56" />}
          </div>
          <p className="pl-9 text-xs leading-[18px] text-muted-foreground">Quản lý đội nhóm và vai trò trong workspace</p>
        </header>

        <div className="flex flex-col">
          <div role="tablist" className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-state={tab === t.id ? "active" : "inactive"}
                onClick={() => setParams(t.id === "roles" ? { tab: "roles" } : {}, { replace: true })}
                className={cn("flex items-center justify-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  tab === t.id && "bg-primary-subtle text-primary-subtle-foreground hover:text-primary-subtle-foreground")}>
                <HugeiconsIcon icon={t.icon} className="size-4" />{t.label}
              </button>
            ))}
          </div>
          {isLoading || !team ? (
            <Skeleton className="mt-6 h-32" />
          ) : tab === "members" ? (
            <MembersTab team={team} roles={roles} />
          ) : (
            <RolesTab teamId={team.id} roles={roles} isLoading={rolesLoading} />
          )}
        </div>
      </div>
    </section>
  )
}
