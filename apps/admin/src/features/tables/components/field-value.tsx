import { Check, ExternalLink, Minus } from "lucide-react"
import { Link } from "react-router"

import { cn } from "@workspace/ui/lib/utils"
import { recordLabel } from "../api/tables.api"
import type { FieldOption, RecordValue, TableField, WorkspaceUser } from "../types/table"
import { formatDateValue, formatNumber, isBlank } from "../utils/fields"

export function OptionBadge({ option, className }: { option?: FieldOption; className?: string }) {
  if (!option) return null
  return (
    <span
      className={cn("inline-flex h-5 max-w-full items-center truncate rounded-md px-1.5 text-[11px] font-medium", className)}
      style={{ color: option.textColor, backgroundColor: option.backgroundColor }}
    >
      {option.text}
    </span>
  )
}

export function UserChip({ user, compact }: { user?: WorkspaceUser; compact?: boolean }) {
  if (!user) return null
  const initials = user.fullName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" title={user.fullName}>
      <span className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: user.color }}>
        {initials}
      </span>
      {!compact && <span className="truncate">{user.fullName}</span>}
    </span>
  )
}

type Props = { field: TableField; value: RecordValue | undefined; users: WorkspaceUser[]; className?: string }

/** Read-only rendering of a record value according to its field type. */
export function FieldValue({ field, value, users, className }: Props) {
  if (isBlank(value) && field.type !== "CHECKBOX_YES_NO") return <span className={cn("text-muted-foreground/60", className)}>—</span>
  const list = Array.isArray(value) ? value : [value]

  switch (field.type) {
    case "SELECT_ONE":
    case "SELECT_LIST":
      return (
        <span className={cn("flex min-w-0 flex-wrap gap-1", className)}>
          {list.map((v) => (
            <OptionBadge key={String(v)} option={field.options?.find((o) => o.value === v) ?? { text: String(v), value: String(v), textColor: "#374151", backgroundColor: "#e5e7eb" }} />
          ))}
        </span>
      )
    case "SELECT_ONE_WORKSPACE_USER":
      return <UserChip user={users.find((u) => u.id === value)} />
    case "SELECT_LIST_WORKSPACE_USER":
      return (
        <span className={cn("flex -space-x-1", className)}>
          {list.map((v) => <UserChip key={String(v)} compact user={users.find((u) => u.id === v)} />)}
        </span>
      )
    case "SELECT_ONE_RECORD":
      return field.referenceTableId ? (
        <Link
          to={`/tables/${field.referenceTableId}/records/${value}`}
          onClick={(e) => e.stopPropagation()}
          className={cn("truncate text-brand hover:underline", className)}
        >
          {recordLabel(field.referenceTableId, String(value))}
        </Link>
      ) : (
        <span>{String(value)}</span>
      )
    case "CHECKBOX_YES_NO":
      return value ? <Check className="size-4 text-emerald-600" /> : <Minus className="size-4 text-muted-foreground/60" />
    case "NUMERIC":
      return <span className={cn("tabular-nums", className)}>{formatNumber(Number(value), field.decimalPlaces, field.unit)}</span>
    case "DATE":
      return <span className={cn("tabular-nums", className)}>{formatDateValue(String(value))}</span>
    case "DATETIME":
      return <span className={cn("tabular-nums", className)}>{formatDateValue(String(value), true)}</span>
    case "URL":
      return (
        <a href={String(value)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={cn("inline-flex min-w-0 items-center gap-1 text-brand hover:underline", className)}>
          <span className="truncate">{String(value).replace(/^https?:\/\//, "")}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      )
    case "EMAIL":
      return <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()} className={cn("truncate hover:underline", className)}>{String(value)}</a>
    case "PHONE":
      return <a href={`tel:${value}`} onClick={(e) => e.stopPropagation()} className={cn("truncate text-blue-600 hover:text-blue-800 dark:text-blue-400", className)}>{String(value)}</a>
    case "AUTO_GENERATED_CODE":
      return <span className={cn("truncate", className)}>{String(value)}</span>
    case "RICH_TEXT":
      return <span className={cn("line-clamp-2 whitespace-pre-line", className)}>{String(value)}</span>
    default:
      return <span className={cn("truncate", className)}>{String(value)}</span>
  }
}
