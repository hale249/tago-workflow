import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Calendar01Icon, CheckmarkSquare02Icon, File02Icon, GitBranchIcon, HashtagIcon, Link01Icon, ListViewIcon, Mail01Icon, SmartPhone01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"

import type { FieldType } from "../types/table"

// Same glyphs as the reference's field list (text-like types share the document icon).
// EMAIL / CHECKBOX / SELECT_LIST / user-list weren't visible there; closest Hugeicons picked.
const ICONS: Record<FieldType, IconSvgElement> = {
  SHORT_TEXT: File02Icon,
  RICH_TEXT: File02Icon,
  EMAIL: Mail01Icon,
  PHONE: SmartPhone01Icon,
  URL: Link01Icon,
  AUTO_GENERATED_CODE: File02Icon,
  DATE: Calendar01Icon,
  DATETIME: Calendar01Icon,
  NUMERIC: HashtagIcon,
  CHECKBOX_YES_NO: CheckmarkSquare02Icon,
  SELECT_ONE: ListViewIcon,
  SELECT_LIST: ListViewIcon,
  SELECT_ONE_RECORD: GitBranchIcon,
  SELECT_ONE_WORKSPACE_USER: UserMultipleIcon,
  SELECT_LIST_WORKSPACE_USER: UserMultipleIcon,
}

export function FieldTypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const Icon = ICONS[type]
  return <HugeiconsIcon icon={Icon} className={className ?? "size-3.5"} />
}
