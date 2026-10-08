import { useState } from "react"
import { Check, ChevronsUpDown, Plus, Settings, Sparkles, UserPlus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { TEAMS } from "@/config/navigation"

function TeamLogo({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-semibold text-white",
        color,
        className,
      )}
    >
      {name[0]}
    </span>
  )
}

export function TeamSwitcher({ collapsed }: { collapsed: boolean }) {
  const [activeId, setActiveId] = useState(TEAMS[0]!.id)
  const active = TEAMS.find((t) => t.id === activeId) ?? TEAMS[0]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-sm font-medium outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "justify-center",
        )}
      >
        <TeamLogo name={active.name} color={active.color} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{active.name}</span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
        {TEAMS.map((team) => (
          <DropdownMenuItem key={team.id} onSelect={() => setActiveId(team.id)}>
            <TeamLogo name={team.name} color={team.color} className="size-5 text-[10px]" />
            <span className="flex-1">{team.name}</span>
            {team.id === activeId && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem><Sparkles /> Manage Plan</DropdownMenuItem>
        <DropdownMenuItem><Settings /> Team Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem><UserPlus /> Invite Member</DropdownMenuItem>
        <DropdownMenuItem><Plus /> New Team</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
