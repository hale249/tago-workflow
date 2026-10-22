import { useQuery } from "@tanstack/react-query"

import { Input } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { lookupLabel } from "../api/tables.api"
import { recordsQuery } from "../api/tables.queries"
import type { DateRange, TableField, WorkspaceUser } from "../types/table"
import { formatTimePart, TIME_PART_RANGE } from "../utils/fields"
import { DateRangeFilter } from "./created-filters"

type Props = { fields: TableField[]; values: Record<string, string>; users: WorkspaceUser[]; onChange: (field: string, value: string) => void }

const cls = (active: boolean) => cn("h-8 w-full bg-background px-2.5 text-sm sm:w-auto sm:max-w-[260px] sm:min-w-[140px]", active && "border-brand bg-brand/5")

function RecordRefFilter({ field, value, onChange }: { field: TableField; value: string; onChange: (v: string) => void }) {
  const { data = [] } = useQuery({ ...recordsQuery(field.referenceTableId ?? ""), enabled: !!field.referenceTableId })
  return (
    <Select className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
      <option value="">Tất cả {field.label}</option>
      {data.map((r) => (
        <option key={r.id} value={r.id}>{lookupLabel(r.tableId, r.id, field.referenceLabelField).primary}</option>
      ))}
    </Select>
  )
}

function FilterControl({ field, value, users, onChange }: { field: TableField; value: string; users: WorkspaceUser[]; onChange: (v: string) => void }) {
  const all = `Tất cả ${field.label}`
  switch (field.type) {
    case "SELECT_ONE":
    case "SELECT_LIST":
    case "CHECKBOX_ONE":
    case "CHECKBOX_LIST":
      return (
        <Select className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              <span className="flex min-w-0 flex-nowrap items-center justify-start gap-[var(--space-050)]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.backgroundColor }} />
                <span className="truncate" title={o.text}>{o.text}</span>
              </span>
            </option>
          ))}
        </Select>
      )
    case "SELECT_ONE_WORKSPACE_USER":
    case "SELECT_LIST_WORKSPACE_USER":
      return (
        <Select className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          <option value="__empty__">(Chưa gán)</option>
        </Select>
      )
    case "SELECT_ONE_RECORD":
    case "SELECT_LIST_RECORD":
    case "FIRST_REFERENCE_RECORD":
      return <RecordRefFilter field={field} value={value} onChange={onChange} />
    case "YEAR":
      return <Input type="number" inputMode="numeric" className={cn(cls(!!value), "w-32")} value={value} placeholder={field.label} onChange={(e) => onChange(e.target.value)} aria-label={field.label} />
    case "MONTH":
    case "DAY":
    case "HOUR":
    case "MINUTE":
    case "SECOND": {
      const [min, max] = TIME_PART_RANGE[field.type]!
      return (
        <Select className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => <option key={n} value={String(n)}>{formatTimePart(field.type, n)}</option>)}
          <option value="__empty__">(Trống)</option>
        </Select>
      )
    }
    case "CHECKBOX_YES_NO":
      return (
        <Select className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          <option value="true">Có</option>
          <option value="false">Không</option>
        </Select>
      )
    case "DATE":
    case "DATETIME": {
      // Same date-range picker as "Ngày tạo"; the range is stored JSON-encoded in the filter value.
      let range: DateRange | null = null
      try { range = value.startsWith("{") ? (JSON.parse(value) as DateRange) : null } catch { /* ignore malformed */ }
      return <DateRangeFilter label={field.label} value={range} onChange={(r) => onChange(r ? JSON.stringify(r) : "")} className="max-w-[260px]" />
    }
    default:
      return <Input className={cn(cls(!!value), "w-48")} value={value} placeholder={all} onChange={(e) => onChange(e.target.value)} aria-label={field.label} />
  }
}

export function QuickFilters({ fields, values, users, onChange }: Props) {
  if (!fields.length) return null
  return (
    <>
      {fields.map((f) => <FilterControl key={f.name} field={f} value={values[f.name] ?? ""} users={users} onChange={(v) => onChange(f.name, v)} />)}
    </>
  )
}
