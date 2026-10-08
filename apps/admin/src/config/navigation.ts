import {
  AppWindow,
  Building2,
  CheckSquare,
  CreditCard,
  Home,
  Inbox,
  type LucideIcon,
  MessageSquare,
  MoreHorizontal,
  PieChart,
  Receipt,
  Repeat,
  Search,
  Users,
  Wallet,
} from "lucide-react"

export type NavItem = { title: string; to: string; icon: LucideIcon; badge?: number }
export type NavSection = { label?: string; items: NavItem[] }

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { title: "Home", to: "/", icon: Home },
      { title: "Inbox", to: "/inbox", icon: Inbox, badge: 4 },
      { title: "Search", to: "/search", icon: Search },
      { title: "Messages", to: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Company",
    items: [
      { title: "Balances", to: "/balances", icon: Wallet },
      { title: "Customers", to: "/customers", icon: Users },
      { title: "Transactions", to: "/transactions", icon: Receipt },
      { title: "Workflows", to: "/workflows", icon: Repeat },
      { title: "Tasks", to: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Spaces",
    items: [
      { title: "Payments", to: "/payments", icon: CreditCard },
      { title: "Billing", to: "/billing", icon: Building2 },
      { title: "Reporting", to: "/reporting", icon: PieChart },
      { title: "Apps", to: "/apps", icon: AppWindow },
      { title: "More", to: "/more", icon: MoreHorizontal },
    ],
  },
]

export const TEAMS = [
  { id: "evergreen", name: "Evergreen", color: "from-emerald-400 to-teal-600" },
  { id: "crestview", name: "Crestview", color: "from-sky-400 to-blue-600" },
  { id: "frontier", name: "Frontier", color: "from-orange-400 to-rose-600" },
  { id: "innovatech", name: "Innovatech", color: "from-violet-400 to-purple-600" },
  { id: "pioneer", name: "Pioneer Team", color: "from-amber-300 to-orange-500" },
  { id: "summit", name: "Summit, Inc", color: "from-pink-400 to-fuchsia-600" },
]
