import { NavLink } from "react-router"

import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import type { NavItem } from "@/config/navigation"

type Props = { item: NavItem; collapsed: boolean; onNavigate?: () => void }

export function NavLinkItem({ item, collapsed, onNavigate }: Props) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      aria-label={collapsed ? item.title : undefined}
      className={({ isActive }) =>
        cn(
          "group/nav relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground/70 transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
          isActive && "bg-sidebar-accent font-medium text-sidebar-foreground",
          collapsed && "mx-auto size-9 justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn("size-4 shrink-0", isActive && "text-brand")} />
          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
          {item.badge ? (
            collapsed ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand ring-2 ring-sidebar" />
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.badge}
              </span>
            )
          ) : null}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {item.title}
        {item.badge ? <span className="text-muted-foreground tabular-nums">{item.badge}</span> : null}
      </TooltipContent>
    </Tooltip>
  )
}
