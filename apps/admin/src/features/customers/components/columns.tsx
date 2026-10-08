import type { ReactNode } from "react"
import {
  AtSign, Building2, Calendar, CalendarClock, DollarSign, Globe, Hash, Link2, MapPin,
  MessageCircle, Mail, Percent, Tags, User, UserCircle, Users, type LucideIcon,
} from "lucide-react"

import { formatCurrency, formatDate, formatRelative } from "@/lib/format"
import type { Customer } from "../types/customer"
import { AvatarStack, CompanyLogo, PersonAvatar, ResponseRate, TagBadge } from "./cells"

export type CustomerColumn = {
  id: string
  label: string
  icon: LucideIcon
  width: string
  sortValue?: (c: Customer) => string | number
  cell: (c: Customer) => ReactNode
}

export const CUSTOMER_COLUMNS: CustomerColumn[] = [
  {
    id: "account", label: "Account", icon: Building2, width: "minmax(240px,1.5fr)",
    sortValue: (c) => c.account,
    cell: (c) => (
      <span className="flex min-w-0 items-center gap-2 font-medium">
        <CompanyLogo name={c.account} color={c.logoColor} />
        <span className="truncate">{c.account}</span>
      </span>
    ),
  },
  { id: "location", label: "Location", icon: MapPin, width: "minmax(160px,1fr)", sortValue: (c) => c.location, cell: (c) => c.location },
  {
    id: "website", label: "Website", icon: Globe, width: "minmax(160px,1fr)", sortValue: (c) => c.website,
    cell: (c) => <span className="text-brand underline-offset-2 hover:underline">{c.website}</span>,
  },
  {
    id: "categories", label: "Categories", icon: Tags, width: "minmax(220px,1.5fr)",
    cell: (c) => <span className="flex gap-1">{c.categories.map((t) => <TagBadge key={t} tag={t} />)}</span>,
  },
  {
    id: "lead", label: "Lead", icon: User, width: "minmax(180px,1fr)", sortValue: (c) => c.lead.name,
    cell: (c) => <span className="flex items-center gap-2"><PersonAvatar person={c.lead} /> {c.lead.name}</span>,
  },
  { id: "team", label: "Team", icon: Users, width: "minmax(140px,1fr)", sortValue: (c) => c.team.length, cell: (c) => <AvatarStack people={c.team} /> },
  {
    id: "amount", label: "Amount", icon: DollarSign, width: "minmax(140px,1fr)", sortValue: (c) => c.amount,
    cell: (c) => <span className="tabular-nums">{formatCurrency(c.amount)}</span>,
  },
  { id: "startDate", label: "Start Date", icon: Calendar, width: "minmax(140px,1fr)", sortValue: (c) => c.startDate, cell: (c) => formatDate(c.startDate) },
  {
    id: "communication", label: "Communication", icon: MessageCircle, width: "minmax(170px,1fr)",
    sortValue: (c) => c.communication.messages + c.communication.emails,
    cell: (c) => (
      <span className="flex items-center gap-3 text-muted-foreground">
        <span className="flex items-center gap-1"><MessageCircle className="size-3.5" />{c.communication.messages}</span>
        <span className="flex items-center gap-1"><Mail className="size-3.5" />{c.communication.emails}</span>
      </span>
    ),
  },
  {
    id: "onlinePresence", label: "Online Presence", icon: Link2, width: "minmax(200px,1.3fr)",
    cell: (c) => <span className="truncate text-muted-foreground">{c.onlinePresence.twitter}</span>,
  },
  { id: "founded", label: "Founded", icon: Hash, width: "minmax(110px,0.8fr)", sortValue: (c) => c.founded, cell: (c) => c.founded },
  { id: "founders", label: "Founders", icon: UserCircle, width: "minmax(130px,1fr)", cell: (c) => <AvatarStack people={c.founders} /> },
  { id: "employees", label: "Employees", icon: Users, width: "minmax(120px,0.8fr)", sortValue: (c) => parseInt(c.employees), cell: (c) => c.employees },
  { id: "email", label: "Email", icon: AtSign, width: "minmax(220px,1.4fr)", sortValue: (c) => c.email, cell: (c) => <span className="truncate">{c.email}</span> },
  {
    id: "lastInteraction", label: "Last Interaction", icon: CalendarClock, width: "minmax(160px,1fr)",
    sortValue: (c) => c.lastInteraction, cell: (c) => formatRelative(c.lastInteraction),
  },
  { id: "responseRate", label: "Response Rate", icon: Percent, width: "minmax(180px,1.2fr)", sortValue: (c) => c.responseRate, cell: (c) => <ResponseRate value={c.responseRate} /> },
]

export const COLUMN_MAP = Object.fromEntries(CUSTOMER_COLUMNS.map((c) => [c.id, c]))
export const DEFAULT_COLUMN_ORDER = CUSTOMER_COLUMNS.map((c) => c.id)
