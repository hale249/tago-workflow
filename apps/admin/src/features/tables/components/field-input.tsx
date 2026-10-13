import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowDown01Icon, Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useRef, useState } from "react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { lookupLabel } from "../api/tables.api"
import { recordsQuery } from "../api/tables.queries"
import type { RecordValue, TableField, WorkspaceUser } from "../types/table"
import { formatDateValue } from "../utils/fields"
import { ComboSelect } from "./combo-select"
import { Switch, Textarea } from "./form-controls"
import { OptionBadge, UserChip } from "./field-value"

type Props = {
  field: TableField
  value: RecordValue | undefined
  onChange: (v: RecordValue) => void
  users: WorkspaceUser[]
  invalid?: boolean
  disabled?: boolean
  /** Show the "+" button beside record pickers (main form only, not inside line items). */
  allowCreate?: boolean
  /** Set by FormRow so its <label> / hint point at the control. */
  id?: string
  "aria-describedby"?: string
}

function MultiPicker({ items, value, onChange }: { items: { value: string; node: React.ReactNode }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border p-2">
      {items.map((it) => {
        const on = value.includes(it.value)
        return (
          <label key={it.value} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm", on && "border-brand bg-brand/5")}>
            <Checkbox checked={on} onCheckedChange={(c) => onChange(c ? [...value, it.value] : value.filter((v) => v !== it.value))} />
            {it.node}
          </label>
        )
      })}
      {!items.length && <span className="text-xs text-muted-foreground">Chưa có lựa chọn</span>}
    </div>
  )
}

function RecordPicker({ field, value, onChange, invalid, allowCreate, id, "aria-describedby": describedBy }: Omit<Props, "users">) {
  const { data = [] } = useQuery({ ...recordsQuery(field.referenceTableId ?? ""), enabled: !!field.referenceTableId })
  const options = data.map((r) => {
    const { primary, secondary } = lookupLabel(r.tableId, r.id, field.referenceLabelField)
    return {
      value: r.id,
      text: [primary, ...secondary].join(" "),
      node: (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{primary}</span>
          {secondary.length > 0 && <span className="truncate text-xs text-muted-foreground">{secondary.join(" · ")}</span>}
        </span>
      ),
    }
  })
  return (
    <div className="flex w-full items-center gap-2">
      <ComboSelect size="lg" value={String(value ?? "")} onChange={onChange} options={options} placeholder={field.placeholder || "Chọn bản ghi"} invalid={invalid} clearable={!field.required} id={id} aria-label={field.label} aria-describedby={describedBy} />
      {allowCreate && field.referenceTableId && (
        <Link
          to={`/tables/${field.referenceTableId}/records/new`}
          target="_blank"
          aria-label="Tạo mới"
          title="Tạo mới"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
        </Link>
      )}
    </div>
  )
}

/** Reference-style date trigger ("Chọn ngày"), opening the browser's native date picker. */
function DateButton({ value, onChange, invalid, label }: { value: string; onChange: (v: string) => void; invalid?: boolean; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const open = () => {
    const el = ref.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        aria-invalid={invalid || undefined}
        aria-label={label}
        className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset aria-invalid:border-destructive"
      >
        <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{value ? formatDateValue(value) : "Chọn ngày"}</span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Xoá ngày"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </span>
        ) : (
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      <input ref={ref} type="date" tabIndex={-1} aria-hidden value={value} onChange={(e) => onChange(e.target.value)} className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0" />
    </div>
  )
}

const toLocalDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Editable control for a record value according to its field type. */
export function FieldInput(props: Props) {
  if (!props.disabled) return <FieldControl {...props} />
  // Locked fields: render the control but block interaction.
  return (
    <div aria-disabled className="pointer-events-none opacity-60" title="Trường đã khoá chỉnh sửa">
      <FieldControl {...props} />
    </div>
  )
}

const nf = (d: number | null | undefined) => new Intl.NumberFormat("vi-VN", { minimumFractionDigits: d ?? 0, maximumFractionDigits: d ?? 10 })
/** "57.900.000,5" / "57900000.5" → 57900000.5 (vi-VN: dots group thousands, comma is the decimal mark). */
function parseViNumber(s: string): number | null {
  const t = s.trim().replace(/\s/g, "")
  if (!t) return null
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^-?\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t)
  return Number.isFinite(n) ? n : null
}

/** Numeric field like the reference: grouped "57.900.000,00" at rest, plain digits while typing, unit suffix. */
function NumberInput({ field, value, onChange, className, ...rest }: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & { field: TableField; value: RecordValue | undefined; onChange: (v: RecordValue) => void }) {
  const [draft, setDraft] = useState<string | null>(null) // non-null while focused
  const num = value == null || value === "" ? null : Number(value)
  const shown = draft ?? (num == null || Number.isNaN(num) ? "" : nf(field.decimalPlaces).format(num))
  return (
    <div className="relative">
      <Input
        {...rest}
        type="text"
        inputMode="decimal"
        value={shown}
        onFocus={() => setDraft(num == null || Number.isNaN(num) ? "" : String(num).replace(".", ","))}
        onChange={(e) => {
          setDraft(e.target.value)
          onChange(parseViNumber(e.target.value))
        }}
        onBlur={() => {
          setDraft(null)
          // Store what is shown: round to the field's decimal places.
          if (num != null && !Number.isNaN(num) && field.decimalPlaces != null) {
            const r = Number(num.toFixed(field.decimalPlaces))
            if (r !== num) onChange(r)
          }
        }}
        className={cn("tabular-nums", field.unit && "pr-10", className)}
      />
      {field.unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{field.unit}</span>}
    </div>
  )
}

function FieldControl({ field, value, onChange, users, invalid, allowCreate, id, "aria-describedby": describedBy }: Props) {
  const str = value == null ? "" : String(value)
  // aria-label keeps controls named where there is no visible label (line-item cells).
  const common = { id, placeholder: field.placeholder, "aria-invalid": invalid || undefined, "aria-label": field.label, "aria-describedby": describedBy }

  switch (field.type) {
    case "RICH_TEXT":
      return <Textarea {...common} value={str} onChange={(e) => onChange(e.target.value)} rows={4} />
    case "NUMERIC":
      return <NumberInput {...common} field={field} value={value} onChange={onChange} />
    case "DATE":
      return <DateButton value={str.slice(0, 10)} onChange={onChange} invalid={invalid} label={field.label} />
    case "DATETIME":
      return <Input {...common} type="datetime-local" value={str ? toLocalDateTime(str) : ""} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
    case "EMAIL":
      return <Input {...common} type="email" value={str} onChange={(e) => onChange(e.target.value)} />
    case "PHONE":
      return <Input {...common} type="tel" value={str} onChange={(e) => onChange(e.target.value)} />
    case "URL":
      return <Input {...common} type="url" value={str} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || "https://"} />
    case "CHECKBOX_YES_NO":
      return (
        <div className="flex h-8 items-center gap-2.5">
          <Switch checked={Boolean(value)} onChange={onChange} label={field.label} />
          <button type="button" tabIndex={-1} onClick={() => onChange(!value)} className="text-sm text-muted-foreground select-none">{value ? "Có" : "Không"}</button>
        </div>
      )
    case "SELECT_ONE":
      return (
        <ComboSelect
          value={str}
          onChange={onChange}
          invalid={invalid}
          clearable
          id={id} aria-label={field.label} aria-describedby={describedBy}
          placeholder={field.placeholder || `Chọn ${field.label.toLowerCase()}`}
          options={(field.options ?? []).map((o) => ({ value: o.value, text: o.text, color: o.backgroundColor }))}
        />
      )
    case "SELECT_LIST":
      return (
        <MultiPicker
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          items={(field.options ?? []).map((o) => ({ value: o.value, node: <OptionBadge option={o} /> }))}
        />
      )
    case "SELECT_ONE_WORKSPACE_USER":
      return (
        <ComboSelect
          size="lg"
          value={str}
          onChange={onChange}
          invalid={invalid}
          clearable={!field.required}
          id={id} aria-label={field.label} aria-describedby={describedBy}
          placeholder={field.placeholder || `Chọn ${field.label.toLowerCase()}`}
          options={users.map((u) => ({ value: u.id, text: u.fullName, node: <UserChip user={u} /> }))}
        />
      )
    case "SELECT_LIST_WORKSPACE_USER":
      return (
        <MultiPicker
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          items={users.map((u) => ({ value: u.id, node: <UserChip user={u} /> }))}
        />
      )
    case "SELECT_ONE_RECORD":
      return <RecordPicker field={field} value={value} onChange={onChange} invalid={invalid} allowCreate={allowCreate} id={id} aria-describedby={describedBy} />
    case "AUTO_GENERATED_CODE":
      return <Input id={id} aria-label={field.label} value={str} placeholder="Mã tự động sinh ra" disabled readOnly className="cursor-not-allowed bg-muted" />
    default:
      return <Input {...common} value={str} onChange={(e) => onChange(e.target.value)} />
  }
}
