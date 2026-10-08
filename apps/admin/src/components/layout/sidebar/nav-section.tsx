import { ChevronDown } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import type { NavSection as NavSectionType } from "@/config/navigation"
import { useUiStore } from "@/stores/ui.store"
import { NavLinkItem } from "./nav-link-item"

type Props = { section: NavSectionType; collapsed: boolean; onNavigate?: () => void }

export function NavSection({ section, collapsed, onNavigate }: Props) {
  const { closedSections, toggleSection, closedTree } = useUiStore()
  const label = section.label
  // Sections can't be folded in icon mode — every icon must stay reachable.
  const open = collapsed || !label || !closedSections.includes(label)

  return (
    <div className={cn("space-y-0.5", label && (collapsed ? "mt-3" : "mt-4"))}>
      {label && !collapsed && (
        <button
          type="button"
          onClick={() => toggleSection(label)}
          aria-expanded={open}
          className="flex h-7 w-full items-center gap-1.5 px-2 text-xs font-medium text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground/80"
        >
          <ChevronDown className={cn("size-3 shrink-0 transition-transform duration-200", !open && "-rotate-90")} />
          <span className="truncate">{label}</span>
        </button>
      )}
      <div className={cn("grid transition-[grid-template-rows] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className={cn("space-y-0.5 overflow-hidden", collapsed && "space-y-1")}>
          {section.items.map((item) => (
            <div key={item.to} className="flex flex-col">
              <NavLinkItem item={item} collapsed={collapsed} onNavigate={onNavigate} />
              {item.tree && !collapsed && !closedTree.includes(item.to) && <item.tree onNavigate={onNavigate} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
