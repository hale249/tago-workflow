import { PanelLeftClose } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Kbd } from "@/components/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { NAV_SECTIONS } from "@/config/navigation"
import { NavSection } from "./nav-section"
import { TeamSwitcher } from "./team-switcher"
import { UserMenu } from "./user-menu"

type Props = {
  collapsed: boolean
  /** Collapse button; hidden on mobile (the sheet has its own close). Expand lives in PageHeader. */
  onToggle?: () => void
  onNavigate?: () => void
}

/** Sidebar body, shared by the desktop rail and the mobile sheet. */
export function SidebarContent({ collapsed, onToggle, onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-1 p-3", collapsed && "flex-col gap-2 px-2")}>
        <div className="min-w-0 flex-1">
          <TeamSwitcher collapsed={collapsed} />
        </div>
        {onToggle && !collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onToggle} aria-label="Toggle sidebar">
                <PanelLeftClose />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              Collapse <Kbd>⌘B</Kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <nav aria-label="Main" className={cn("no-scrollbar flex-1 space-y-4 overflow-y-auto py-1", collapsed ? "px-2" : "px-3")}>
        {NAV_SECTIONS.map((section, i) => (
          <NavSection key={section.label ?? i} section={section} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  )
}
