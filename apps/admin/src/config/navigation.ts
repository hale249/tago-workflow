import type { ComponentType } from "react"
import {
  type AppIcon,
  AppsNavIcon,
  ConnectorNavIcon,
  FacebookNavIcon,
  FormNavIcon,
  HelpNavIcon,
  HomeNavIcon,
  InstagramNavIcon,
  NotificationNavIcon,
  SettingsNavIcon,
  WhatsAppNavIcon,
  WorkflowNavIcon,
  ZaloNavIcon,
} from "@/components/icons"
import { useUnreadNotifications } from "@/features/dashboard"
import { useUnreadChatsIn } from "@/features/social-chat"
import { TablesNavTree } from "@/features/tables"

export type NavItem = {
  title: string
  to: string
  icon: AppIcon
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
      { title: "Bảng điều khiển", to: "/", icon: HomeNavIcon },
      { title: "Thông báo", to: "/notifications", icon: NotificationNavIcon, useBadge: useUnreadNotifications },
    ],
  },
  {
    label: "Tính năng Workspace",
    items: [
      { title: "Apps", to: "/tables", icon: AppsNavIcon, tree: TablesNavTree },
      { title: "Cloud Logic (Workflow)", to: "/workflow-units", icon: WorkflowNavIcon },
      { title: "Biểu mẫu", to: "/workflow-forms", icon: FormNavIcon },
      { title: "Kết nối", to: "/workflow-connectors", icon: ConnectorNavIcon },
    ],
  },
  {
    // One inbox per channel, like the reference; all open the unified inbox pre-filtered.
    label: "Social",
    items: [
      { title: "Facebook Page Inbox", to: "/social-chat/facebook", icon: FacebookNavIcon, useBadge: () => useUnreadChatsIn("facebook") },
      { title: "Instagram Inbox", to: "/social-chat/instagram", icon: InstagramNavIcon, useBadge: () => useUnreadChatsIn("instagram") },
      { title: "WhatsApp Inbox", to: "/social-chat/whatsapp", icon: WhatsAppNavIcon, useBadge: () => useUnreadChatsIn("whatsapp") },
      { title: "Zalo OA Inbox", to: "/social-chat/zalo", icon: ZaloNavIcon, useBadge: () => useUnreadChatsIn("zalo") },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { title: "Cài đặt", to: "/settings", icon: SettingsNavIcon },
      { title: "Trợ giúp & Hỗ trợ", to: "/help", icon: HelpNavIcon, comingSoon: true },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

/** Workspaces the user belongs to (switcher at the top of the sidebar). */
export const WORKSPACES = [
  { id: "motor-anh-quoc", name: "Motor Anh Quốc", color: "from-orange-400 to-orange-500" },
  { id: "bm-agency", name: "BM Agency", color: "from-cyan-400 to-blue-500" },
]
