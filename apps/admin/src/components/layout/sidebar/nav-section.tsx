import { ChevronRight } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import type { NavSection as NavSectionType } from "@/config/navigation"
import { useUiStore } from "@/stores/ui.store"
import { NavLinkItem } from "./nav-link-item"

type Props = { section: NavSectionType; collapsed: boolean; onNavigate?: () => void }

export function NavSection({ section, collapsed, onNavigate }: Props) {
  const { closedSections, toggleSection } = useUiStore()
  const label = section.label
  // Sections can't be folded in icon mode — every icon must stay reachable.
  const open = collapsed || !label || !closedSections.includes(label)

  return (
    <div className="space-y-1">
      {label &&
        (collapsed ? (
          <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={() => toggleSection(label)}
            aria-expanded={open}
            className="group/section flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground"
          >
            {label}
            <ChevronRight className={cn("size-3 opacity-0 transition-all group-hover/section:opacity-100", open && "rotate-90")} />
          </button>
        ))}
      <div className={cn("grid transition-[grid-template-rows] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="space-y-1 overflow-hidden">
          {section.items.map((item) => (
            <NavLinkItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  )
}
