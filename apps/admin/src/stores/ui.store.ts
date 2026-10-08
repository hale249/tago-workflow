import { create } from "zustand"
import { persist } from "zustand/middleware"

type UiState = {
  sidebarCollapsed: boolean
  sidebarWidth: number
  mobileSidebarOpen: boolean
  closedSections: string[]
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleSection: (label: string) => void
}

export const SIDEBAR_MIN = 200
export const SIDEBAR_MAX = 360
export const SIDEBAR_DEFAULT = 248
export const SIDEBAR_COLLAPSED = 60
/** Dragging narrower than this snaps the sidebar to collapsed mode. */
export const SIDEBAR_SNAP = 140

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: SIDEBAR_DEFAULT,
      mobileSidebarOpen: false,
      closedSections: [],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSidebarWidth: (width) =>
        width < SIDEBAR_SNAP
          ? set({ sidebarCollapsed: true })
          : set({ sidebarCollapsed: false, sidebarWidth: Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width)) }),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      toggleSection: (label) =>
        set(({ closedSections }) => ({
          closedSections: closedSections.includes(label)
            ? closedSections.filter((l) => l !== label)
            : [...closedSections, label],
        })),
    }),
    {
      name: "tago-ui",
      partialize: ({ sidebarCollapsed, sidebarWidth, closedSections }) => ({ sidebarCollapsed, sidebarWidth, closedSections }),
    },
  ),
)
