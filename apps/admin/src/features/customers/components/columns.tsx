import type { ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { AtIcon, BubbleChatIcon, Building03Icon, Calendar01Icon, Calendar03Icon, Dollar01Icon, Globe02Icon, HashtagIcon, Link01Icon, Location01Icon, Mail01Icon, PercentIcon, Tag02Icon, UserCircleIcon, UserIcon, UserMultipleIcon } from "@hugeicons/core-free-icons"

import { formatCurrency, formatDate, formatRelative } from "@/lib/format"
import type { Customer } from "../types/customer"
import { AvatarStack, CompanyLogo, PersonAvatar, ResponseRate, TagBadge } from "./cells"

export type CustomerColumn = {
  id: string
  label: string
  icon: IconSvgElement
  width: string
  sortValue?: (c: Customer) => string | number
  cell: (c: Customer) => ReactNode
}

export const CUSTOMER_COLUMNS: CustomerColumn[] = [
  {
    id: "account", label: "Account", icon: Building03Icon, width: "minmax(240px,1.5fr)",
    sortValue: (c) => c.account,
    cell: (c) => (
      <span className="flex min-w-0 items-center gap-2 font-medium">
        <CompanyLogo name={c.account} color={c.logoColor} />
        <span className="truncate">{c.account}</span>
      </span>
    ),
  },
  { id: "location", label: "Location", icon: Location01Icon, width: "minmax(160px,1fr)", sortValue: (c) => c.location, cell: (c) => c.location },
  {
    id: "website", label: "Website", icon: Globe02Icon, width: "minmax(160px,1fr)", sortValue: (c) => c.website,
    cell: (c) => <span className="text-brand underline-offset-2 hover:underline">{c.website}</span>,
  },
  {
    id: "categories", label: "Categories", icon: Tag02Icon, width: "minmax(220px,1.5fr)",
    cell: (c) => <span className="flex gap-1">{c.categories.map((t) => <TagBadge key={t} tag={t} />)}</span>,
  },
  {
    id: "lead", label: "Lead", icon: UserIcon, width: "minmax(180px,1fr)", sortValue: (c) => c.lead.name,
    cell: (c) => <span className="flex items-center gap-2"><PersonAvatar person={c.lead} /> {c.lead.name}</span>,
  },
  { id: "team", label: "Team", icon: UserMultipleIcon, width: "minmax(140px,1fr)", sortValue: (c) => c.team.length, cell: (c) => <AvatarStack people={c.team} /> },
  {
    id: "amount", label: "Amount", icon: Dollar01Icon, width: "minmax(140px,1fr)", sortValue: (c) => c.amount,
    cell: (c) => <span className="tabular-nums">{formatCurrency(c.amount)}</span>,
  },
  { id: "startDate", label: "Start Date", icon: Calendar01Icon, width: "minmax(140px,1fr)", sortValue: (c) => c.startDate, cell: (c) => formatDate(c.startDate) },
  {
    id: "communication", label: "Communication", icon: BubbleChatIcon, width: "minmax(170px,1fr)",
    sortValue: (c) => c.communication.messages + c.communication.emails,
    cell: (c) => (
      <span className="flex items-center gap-3 text-muted-foreground">
        <span className="flex items-center gap-1"><HugeiconsIcon icon={BubbleChatIcon} className="size-3.5" />{c.communication.messages}</span>
        <span className="flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} className="size-3.5" />{c.communication.emails}</span>
      </span>
    ),
  },
  {
    id: "onlinePresence", label: "Online Presence", icon: Link01Icon, width: "minmax(200px,1.3fr)",
    cell: (c) => <span className="truncate text-muted-foreground">{c.onlinePresence.twitter}</span>,
  },
  { id: "founded", label: "Founded", icon: HashtagIcon, width: "minmax(110px,0.8fr)", sortValue: (c) => c.founded, cell: (c) => c.founded },
  { id: "founders", label: "Founders", icon: UserCircleIcon, width: "minmax(130px,1fr)", cell: (c) => <AvatarStack people={c.founders} /> },
  { id: "employees", label: "Employees", icon: UserMultipleIcon, width: "minmax(120px,0.8fr)", sortValue: (c) => parseInt(c.employees), cell: (c) => c.employees },
  { id: "email", label: "Email", icon: AtIcon, width: "minmax(220px,1.4fr)", sortValue: (c) => c.email, cell: (c) => <span className="truncate">{c.email}</span> },
  {
    id: "lastInteraction", label: "Last Interaction", icon: Calendar03Icon, width: "minmax(160px,1fr)",
    sortValue: (c) => c.lastInteraction, cell: (c) => formatRelative(c.lastInteraction),
  },
  { id: "responseRate", label: "Response Rate", icon: PercentIcon, width: "minmax(180px,1.2fr)", sortValue: (c) => c.responseRate, cell: (c) => <ResponseRate value={c.responseRate} /> },
]

export const COLUMN_MAP = Object.fromEntries(CUSTOMER_COLUMNS.map((c) => [c.id, c]))
export const DEFAULT_COLUMN_ORDER = CUSTOMER_COLUMNS.map((c) => c.id)
