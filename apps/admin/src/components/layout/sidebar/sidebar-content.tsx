import { cn } from "@workspace/ui/lib/utils"
import { NAV_SECTIONS } from "@/config/navigation"
import { TablesQuickSearch } from "@/features/tables"
import { NavSection } from "./nav-section"
import { WorkspaceSwitcher } from "./workspace-switcher"

type Props = { collapsed: boolean; onNavigate?: () => void }

/** Sidebar body, shared by the desktop rail and the mobile sheet. The toggle lives in AppHeader. */
export function SidebarContent({ collapsed, onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-12 shrink-0 items-center border-b border-sidebar-border px-2", collapsed && "justify-center")}>
        <div className={cn("min-w-0", !collapsed && "flex-1")}>
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>
      </div>

      {!collapsed && (
        <div className="px-2 pt-3">
          <TablesQuickSearch onNavigate={onNavigate} />
        </div>
      )}

      <nav aria-label="Main" className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {NAV_SECTIONS.map((section, i) => (
          <NavSection key={section.label ?? i} section={section} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  )
}
