import { create } from "zustand"
import { persist } from "zustand/middleware"

type UiState = {
  sidebarCollapsed: boolean
  sidebarWidth: number
  mobileSidebarOpen: boolean
  closedSections: string[]
  /** Collapsed nodes of the Apps tree ("apps" itself, or a work group id). */
  closedTree: string[]
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleSection: (label: string) => void
  toggleTree: (id: string) => void
}

export const SIDEBAR_MIN = 180
export const SIDEBAR_MAX = 480
export const SIDEBAR_DEFAULT = 256
export const SIDEBAR_COLLAPSED = 64
/** Dragging narrower than this snaps the sidebar to collapsed mode. */
export const SIDEBAR_SNAP = 140

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: SIDEBAR_DEFAULT,
      mobileSidebarOpen: false,
      closedSections: [],
      closedTree: [],
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
      toggleTree: (id) =>
        set(({ closedTree }) => ({
          closedTree: closedTree.includes(id) ? closedTree.filter((x) => x !== id) : [...closedTree, id],
        })),
    }),
    {
      name: "tago-ui",
      partialize: ({ sidebarCollapsed, sidebarWidth, closedSections, closedTree }) => ({ sidebarCollapsed, sidebarWidth, closedSections, closedTree }),
    },
  ),
)
