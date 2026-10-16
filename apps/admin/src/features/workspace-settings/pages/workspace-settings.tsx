import { useNavigate, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, FolderKanbanIcon, ServerStack01Icon, Shield01Icon, TagsIcon, UserMultipleIcon } from "@hugeicons/core-free-icons"
import { WORKSPACES } from "@/config/navigation"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { LabelsTab } from "../components/labels-tab"
import { PermissionsTab } from "../components/permissions-tab"
import { SystemInfoTab } from "../components/system-info-tab"
import { TeamsTab } from "../components/teams-tab"
import { TYPE } from "../components/settings-ui"
import { WorkGroupsTab } from "../components/work-groups-tab"

const TABS = [
  { id: "system-info", label: "Thông tin hệ thống", icon: ServerStack01Icon, Panel: SystemInfoTab },
  { id: "workgroups", label: "Nhóm công việc", icon: FolderKanbanIcon, Panel: WorkGroupsTab },
  { id: "teams", label: "Nhóm", icon: UserMultipleIcon, Panel: TeamsTab },
  { id: "permissions", label: "Quyền", icon: Shield01Icon, Panel: PermissionsTab },
  { id: "labels", label: "Nhãn", icon: TagsIcon, Panel: LabelsTab },
] as const

/** Workspace settings; the active tab lives in `?t=` like the reference (system-info | workgroups | teams | permissions | labels). */
export function WorkspaceSettingsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const active = TABS.find((t) => t.id === params.get("t")) ?? TABS[0]
  const select = (id: string) => setParams((p) => { p.set("t", id); return p }, { replace: true })

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 hover:bg-accent/50" aria-label="Quay lại" onClick={() => navigate(-1)}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /></Button>
          <h1 className="text-foreground" style={TYPE.h1}>{WORKSPACES[0]!.name} - Cài đặt</h1>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 overflow-x-auto border-b [scrollbar-width:none]">
            <div role="tablist" aria-orientation="horizontal" className="inline-flex items-center justify-start text-muted-foreground lg:flex-wrap"
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                const i = TABS.indexOf(active)
                const next = TABS[(i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length]!
                select(next.id)
                document.getElementById(`ws-tab-${next.id}`)?.focus()
              }}>
              {TABS.map((t) => {
                const on = t === active
                return (
                  <button key={t.id} id={`ws-tab-${t.id}`} type="button" role="tab" aria-selected={on} aria-controls={`ws-panel-${t.id}`} tabIndex={on ? 0 : -1} aria-label={t.label} data-state={on ? "active" : "inactive"} onClick={() => select(t.id)}
                    className={cn(
                      "-mb-px inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      on && "border-foreground text-foreground",
                    )}>
                    <HugeiconsIcon icon={t.icon} className="size-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div id={`ws-panel-${active.id}`} role="tabpanel" aria-labelledby={`ws-tab-${active.id}`} className="pt-4">
            <active.Panel />
          </div>
        </div>
      </div>
    </section>
  )
}
