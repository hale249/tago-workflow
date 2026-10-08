import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { WORKSPACES } from "@/config/navigation"

/** "Motor Anh Quốc" -> "MA" */
const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()

function WorkspaceLogo({ name, color }: { name: string; color: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-semibold text-white",
        color,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const [activeId, setActiveId] = useState(WORKSPACES[0]!.id)
  const active = WORKSPACES.find((w) => w.id === activeId) ?? WORKSPACES[0]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Chọn workspace"
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "w-auto justify-center px-1",
        )}
      >
        <WorkspaceLogo name={active.name} color={active.color} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-sm font-semibold">{active.name}</span>
            <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/50" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="w-56">
        {WORKSPACES.map((ws) => (
          <DropdownMenuItem key={ws.id} onSelect={() => setActiveId(ws.id)}>
            <WorkspaceLogo name={ws.name} color={ws.color} />
            <span className={cn("flex-1 truncate", ws.id === activeId && "font-medium")}>{ws.name}</span>
            {ws.id === activeId && <Check className="size-4 text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
