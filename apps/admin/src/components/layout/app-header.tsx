import { Moon, PanelLeft, Sun } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { Kbd } from "@/components/kbd"
import { useTheme } from "@/components/theme/theme-provider"
import { useUiStore } from "@/stores/ui.store"
import { UserMenu } from "./user-menu"

const ICON_BTN = "size-8 text-muted-foreground hover:text-foreground"

/** Top bar above every page: sidebar toggle on the left, theme + account on the right. */
export function AppHeader() {
  const { sidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUiStore()
  const { theme, toggleTheme } = useTheme()
  const sidebarLabel = sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
  const themeLabel = theme === "dark" ? "Chế độ sáng" : "Chế độ tối"

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Button variant="ghost" size="icon" className={`${ICON_BTN} md:hidden`} onClick={() => setMobileSidebarOpen(true)} aria-label="Mở sidebar">
          <PanelLeft strokeWidth={1.5} />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={`${ICON_BTN} max-md:hidden`} onClick={toggleSidebar} aria-label={sidebarLabel}>
              <PanelLeft strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            {sidebarLabel} <Kbd>⌘B</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={ICON_BTN} onClick={toggleTheme} aria-label={themeLabel}>
              {theme === "dark" ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{themeLabel}</TooltipContent>
        </Tooltip>
        <UserMenu />
      </div>
    </header>
  )
}
