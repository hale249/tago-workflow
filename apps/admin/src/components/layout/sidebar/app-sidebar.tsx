import { useCallback, useEffect } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { useResizeHandle } from "@/hooks/use-resize-handle"
import { SIDEBAR_COLLAPSED, SIDEBAR_DEFAULT, useUiStore } from "@/stores/ui.store"
import { SidebarContent } from "./sidebar-content"

export function AppSidebar() {
  const { sidebarCollapsed: collapsed, sidebarWidth, toggleSidebar, setSidebarWidth } = useUiStore()
  const { isResizing, onPointerDown } = useResizeHandle(useCallback((x: number) => setSidebarWidth(x), [setSidebarWidth]))

  // ⌘B / Ctrl+B toggles the rail (same shortcut as VS Code / Linear).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleSidebar])

  return (
    <aside
      style={{ width: collapsed ? SIDEBAR_COLLAPSED : sidebarWidth }}
      className={cn(
        "relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block",
        !isResizing && "transition-[width] duration-200 ease-out",
      )}
    >
      <SidebarContent collapsed={collapsed} />

      {/* Drag to resize (snaps to collapsed when narrow), double-click to reset. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để thay đổi kích thước"
        onPointerDown={onPointerDown}
        onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT)}
        className="group absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize"
      >
        <div className={cn("mx-auto h-full w-px transition-colors group-hover:bg-brand/60", isResizing && "bg-brand")} />
      </div>
    </aside>
  )
}
