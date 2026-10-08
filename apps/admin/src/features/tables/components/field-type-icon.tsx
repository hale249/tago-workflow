import {
  AlignLeft, AtSign, Calendar, CalendarClock, Hash, Link2, List, ListChecks, Phone, Sigma, SquareCheck, Type, User, Users, Waypoints,
  type LucideIcon,
} from "lucide-react"

import type { FieldType } from "../types/table"

const ICONS: Record<FieldType, LucideIcon> = {
  SHORT_TEXT: Type,
  RICH_TEXT: AlignLeft,
  EMAIL: AtSign,
  PHONE: Phone,
  URL: Link2,
  AUTO_GENERATED_CODE: Hash,
  DATE: Calendar,
  DATETIME: CalendarClock,
  NUMERIC: Sigma,
  CHECKBOX_YES_NO: SquareCheck,
  SELECT_ONE: List,
  SELECT_LIST: ListChecks,
  SELECT_ONE_RECORD: Waypoints,
  SELECT_ONE_WORKSPACE_USER: User,
  SELECT_LIST_WORKSPACE_USER: Users,
}

export function FieldTypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const Icon = ICONS[type]
  return <Icon className={className ?? "size-3.5"} />
}
