import type { ComponentType } from "react"
import {
  Bell,
  Cable,
  CircleHelp,
  FileText,
  Grid2x2,
  House,
  type LucideIcon,
  MessagesSquare,
  Settings,
  Workflow,
} from "lucide-react"

import { useUnreadNotifications } from "@/features/dashboard"
import { useUnreadChats } from "@/features/social-chat"
import { TablesNavTree } from "@/features/tables"

export type NavItem = {
  title: string
  to: string
  icon: LucideIcon
  /** Hook returning the badge count (0 hides it). Called once per rendered item. */
  useBadge?: () => number
  /** No page yet — the router serves a "coming soon" placeholder at `to`. */
  comingSoon?: true
  /** Optional nested tree rendered under the item when the sidebar is expanded. */
  tree?: ComponentType<{ onNavigate?: () => void }>
}
export type NavSection = { label?: string; items: NavItem[] }

// The one place to manage the menu: order, grouping, badges and which entries
// are still placeholders. Sidebar and router both read from here.
// ("Phân tích" is hidden behind a workspace flag in the reference, so not listed.)
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { title: "Bảng điều khiển", to: "/", icon: House },
      { title: "Thông báo", to: "/notifications", icon: Bell, useBadge: useUnreadNotifications },
    ],
  },
  {
    label: "Tính năng Workspace",
    items: [
      { title: "Apps", to: "/tables", icon: Grid2x2, tree: TablesNavTree },
      { title: "Cloud Logic (Workflow)", to: "/workflow-units", icon: Workflow },
      { title: "Biểu mẫu", to: "/workflow-forms", icon: FileText },
      { title: "Kết nối", to: "/workflow-connectors", icon: Cable },
      { title: "Hộp thư", to: "/social-chat", icon: MessagesSquare, useBadge: useUnreadChats },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { title: "Cài đặt", to: "/settings", icon: Settings },
      { title: "Trợ giúp & Hỗ trợ", to: "/help", icon: CircleHelp, comingSoon: true },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

/** Workspaces the user belongs to (switcher at the top of the sidebar). */
export const WORKSPACES = [
  { id: "motor-anh-quoc", name: "Motor Anh Quốc", color: "from-orange-400 to-orange-500" },
  { id: "bm-agency", name: "BM Agency", color: "from-cyan-400 to-blue-500" },
]
