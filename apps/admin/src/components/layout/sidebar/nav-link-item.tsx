import { NavLink } from "react-router"
import { ChevronRight } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import type { NavItem } from "@/config/navigation"
import { useUiStore } from "@/stores/ui.store"

type Props = { item: NavItem; collapsed: boolean; onNavigate?: () => void }

const useNoBadge = () => 0

export function NavLinkItem({ item, collapsed, onNavigate }: Props) {
  // An item's useBadge never changes, so the hook order stays stable per instance.
  const useBadge = item.useBadge ?? useNoBadge
  const badge = useBadge()
  const { closedTree, toggleTree } = useUiStore()
  const treeOpen = !closedTree.includes(item.to)

  const link = (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      aria-label={collapsed ? item.title : undefined}
      className={({ isActive }) =>
        cn(
          "group/nav relative flex h-8 flex-1 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-150 outline-none select-none",
          "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isActive && "bg-brand/8 text-brand hover:bg-brand/10 hover:text-brand",
          collapsed && "mx-auto size-9 flex-none justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            strokeWidth={1.5}
            className={cn("size-4 shrink-0 transition-colors", isActive ? "text-brand" : "text-sidebar-foreground/60 group-hover/nav:text-sidebar-foreground")}
          />
          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
          {badge ? (
            collapsed ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand ring-2 ring-sidebar" />
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">{badge}</span>
            )
          ) : null}
        </>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {badge ? <span className="text-muted-foreground tabular-nums">{badge}</span> : null}
        </TooltipContent>
      </Tooltip>
    )
  }
  // Row wrapper keeps the link at h-8 (flex-1 inside a column parent would squash it).
  return (
    <div className="group/row relative flex items-center">
      {link}
      {item.tree && <button
        type="button"
        onClick={() => toggleTree(item.to)}
        aria-label={treeOpen ? `Thu gọn ${item.title}` : `Mở rộng ${item.title}`}
        aria-expanded={treeOpen}
        className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded text-sidebar-foreground/30 opacity-0 transition-[color,background-color,opacity] group-hover/row:opacity-100 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground/70 focus-visible:opacity-100"
      >
        <ChevronRight className={cn("size-3 transition-transform duration-200", treeOpen && "rotate-90")} />
      </button>}
    </div>
  )
}
