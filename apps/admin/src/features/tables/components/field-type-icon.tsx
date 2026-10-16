import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowTurnBackwardIcon, Attachment01Icon, Calendar01Icon, CalculatorIcon, CheckListIcon, CheckmarkSquare02Icon, Clock01Icon, File02Icon, GitBranchIcon,
  HashtagIcon, Link01Icon, ListViewIcon, Mail01Icon, SmartPhone01Icon, TextAlignLeftIcon, UserMultipleIcon,
} from "@hugeicons/core-free-icons"

import type { FieldType } from "../types/table"

// Same glyphs as the reference's field picker (short / rich text and codes share the document icon, long text = lines).
// Types not visible there (email, yes/no, multi select, time parts, user list…) use the closest Hugeicons.
const ICONS: Record<FieldType, IconSvgElement> = {
  SHORT_TEXT: File02Icon,
  TEXT: TextAlignLeftIcon,
  TEXTAREA: TextAlignLeftIcon,
  RICH_TEXT: File02Icon,
  EMAIL: Mail01Icon,
  PHONE: SmartPhone01Icon,
  URL: Link01Icon,
  AUTO_GENERATED_CODE: File02Icon,
  ATTACHMENT: Attachment01Icon,
  DATE: Calendar01Icon,
  DATETIME: Calendar01Icon,
  TIME: Clock01Icon,
  YEAR: Calendar01Icon,
  MONTH: Calendar01Icon,
  DAY: Calendar01Icon,
  HOUR: Clock01Icon,
  MINUTE: Clock01Icon,
  SECOND: Clock01Icon,
  INTEGER: HashtagIcon,
  NUMERIC: HashtagIcon,
  NUMERIC_SUMMARY: CalculatorIcon,
  CHECKBOX_YES_NO: CheckmarkSquare02Icon,
  CHECKBOX_ONE: CheckmarkSquare02Icon,
  CHECKBOX_LIST: CheckListIcon,
  SELECT_ONE: ListViewIcon,
  SELECT_LIST: ListViewIcon,
  SELECT_ONE_RECORD: GitBranchIcon,
  SELECT_LIST_RECORD: GitBranchIcon,
  FIRST_REFERENCE_RECORD: ArrowTurnBackwardIcon,
  SELECT_ONE_WORKSPACE_USER: UserMultipleIcon,
  SELECT_LIST_WORKSPACE_USER: UserMultipleIcon,
}

export function FieldTypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const Icon = ICONS[type] ?? File02Icon
  return <HugeiconsIcon icon={Icon} className={className ?? "size-3.5"} />
}
