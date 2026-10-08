import { useQuery } from "@tanstack/react-query"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { recordLabel } from "../api/tables.api"
import { recordsQuery } from "../api/tables.queries"
import type { TableField, WorkspaceUser } from "../types/table"
import { NativeSelect } from "./form-controls"

type Props = { fields: TableField[]; values: Record<string, string>; users: WorkspaceUser[]; onChange: (field: string, value: string) => void }

const cls = (active: boolean) => cn("h-8 w-auto max-w-[260px] min-w-[140px] bg-background px-2.5 text-sm", active && "border-brand bg-brand/5")

function RecordRefFilter({ field, value, onChange }: { field: TableField; value: string; onChange: (v: string) => void }) {
  const { data = [] } = useQuery({ ...recordsQuery(field.referenceTableId ?? ""), enabled: !!field.referenceTableId })
  return (
    <NativeSelect className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
      <option value="">Tất cả {field.label}</option>
      {data.map((r) => (
        <option key={r.id} value={r.id}>{field.referenceLabelField ? String(r.record[field.referenceLabelField] ?? r.id) : recordLabel(r.tableId, r.id)}</option>
      ))}
    </NativeSelect>
  )
}

function FilterControl({ field, value, users, onChange }: { field: TableField; value: string; users: WorkspaceUser[]; onChange: (v: string) => void }) {
  const all = `Tất cả ${field.label}`
  switch (field.type) {
    case "SELECT_ONE":
    case "SELECT_LIST":
      return (
        <NativeSelect className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
          <option value="__empty__">(Trống)</option>
        </NativeSelect>
      )
    case "SELECT_ONE_WORKSPACE_USER":
    case "SELECT_LIST_WORKSPACE_USER":
      return (
        <NativeSelect className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          <option value="__empty__">(Chưa gán)</option>
        </NativeSelect>
      )
    case "SELECT_ONE_RECORD":
      return <RecordRefFilter field={field} value={value} onChange={onChange} />
    case "CHECKBOX_YES_NO":
      return (
        <NativeSelect className={cls(!!value)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
          <option value="">{all}</option>
          <option value="true">Có</option>
          <option value="false">Không</option>
        </NativeSelect>
      )
    case "DATE":
      return <Input type="month" className={cn(cls(!!value), "w-40")} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label} title={field.label} />
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
