import { ChevronsUpDown, LogOut, Moon, Settings, Sun, User } from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { useTheme } from "@/components/theme/theme-provider"

const USER = { name: "Louis Cooper", email: "louis@evergreen.com", initials: "LC" }

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg p-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "justify-center",
        )}
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-indigo-600 text-xs text-white">{USER.initials}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{USER.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{USER.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{USER.name}</p>
          <p className="text-xs text-muted-foreground">{USER.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User /> Profile</DropdownMenuItem>
        <DropdownMenuItem><Settings /> Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleTheme() }}>
          {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive"><LogOut /> Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

