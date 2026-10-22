import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowDown01Icon, Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useRef, useState } from "react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { ComboSelect } from "@workspace/ui/components/combo-select"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { lookupLabel } from "../api/tables.api"
import { recordsQuery } from "../api/tables.queries"
import type { RecordData, RecordValue, TableField, WorkspaceUser } from "../types/table"
import { computeSummaries, formatDateValue, formatNumber, TIME_PART_RANGE } from "../utils/fields"
import { AttachmentInput } from "./attachment-field"
import { FieldValue, OptionBadge, RecordChip, UserChip } from "./field-value"
import { RichTextEditor } from "./rich-text-editor"

type Props = {
  field: TableField
  value: RecordValue | undefined
  onChange: (v: RecordValue) => void
  users: WorkspaceUser[]
  invalid?: boolean
  disabled?: boolean
  /** Show the "+" button beside record pickers (main form only, not inside line items). */
  allowCreate?: boolean
  /** Whole record being edited — lets Số tự tính show its live result. */
  record?: RecordData
  /** Set by FormRow so its <label> / hint point at the control. */
  id?: string
  "aria-describedby"?: string
}

/** Checkbox list over the field's options; `single` keeps at most one ticked (Một ô chọn). */
function CheckboxGroup({ field, value, onChange, single }: { field: TableField; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  const options = field.options ?? []
  return (
    <div role="group" aria-label={field.label} className="flex flex-col gap-2 py-1">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <label key={o.value} className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={on} onCheckedChange={(c) => onChange(single ? (c ? [o.value] : []) : c ? [...value, o.value] : value.filter((v) => v !== o.value))} />
            <span>{o.text}</span>
          </label>
        )
      })}
      {!options.length && <span className="text-xs text-muted-foreground">Chưa có tuỳ chọn</span>}
    </div>
  )
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
  // Reference record picker is h-8; grow to h-10 only when the chosen record shows a second line.
  const twoLine = data.some((r) => r.id === value && lookupLabel(r.tableId, r.id, field.referenceLabelField).secondary.length > 0)
  return (
    <div className="flex w-full items-center gap-2">
      <ComboSelect size={twoLine ? "lg" : "sm"} chevron="form" mutedPlaceholder value={String(value ?? "")} onChange={onChange} options={options} placeholder={field.placeholder || "Chọn bản ghi"} invalid={invalid} clearable={!field.required} id={id} aria-label={field.label} aria-describedby={describedBy} />
      {allowCreate && field.referenceTableId && (
        <Link
          to={`/tables/${field.referenceTableId}/records/new`}
          target="_blank"
          aria-label="Tạo mới"
          title="Tạo mới"
          className={cn("inline-flex shrink-0 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent", twoLine ? "size-10" : "size-8")}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
        </Link>
      )}
    </div>
  )
}

/** Tham chiếu nhiều bản ghi: selected records as removable chips + the single-record picker to add more. */
function RecordMultiPicker({ field, value, onChange, invalid, allowCreate, id, "aria-describedby": describedBy }: Omit<Props, "users" | "value" | "onChange"> & { value: string[]; onChange: (v: string[]) => void }) {
  const { data = [] } = useQuery({ ...recordsQuery(field.referenceTableId ?? ""), enabled: !!field.referenceTableId })
  const options = data
    .filter((r) => !value.includes(r.id))
    .map((r) => {
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
    <div className="grid w-full gap-2">
      {value.length > 0 && field.referenceTableId && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="inline-flex max-w-full items-center gap-0.5">
              <RecordChip tableId={field.referenceTableId!} recordId={v} labelField={field.referenceLabelField} size="md" />
              <button type="button" aria-label="Bỏ chọn" onClick={() => onChange(value.filter((x) => x !== v))} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex w-full items-center gap-2">
        <ComboSelect chevron="form" mutedPlaceholder value="" onChange={(v) => v && onChange([...value, v])} options={options} placeholder={field.placeholder || "Chọn bản ghi"} invalid={invalid} id={id} aria-label={field.label} aria-describedby={describedBy} />
        {allowCreate && field.referenceTableId && (
          <Link
            to={`/tables/${field.referenceTableId}/records/new`}
            target="_blank"
            aria-label="Tạo mới"
            title="Tạo mới"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
          </Link>
        )}
      </div>
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
        className={cn("flex h-8 w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-left text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset aria-invalid:border-destructive", !value && "text-muted-foreground")}
      >
        <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4 shrink-0" />
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
        className={cn("tabular-nums", field.unit && "pr-12", className)}
      />
      {field.unit && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{field.unit}</span>}
    </div>
  )
}

const readOnlyBox = "flex min-h-8 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm"

function FieldControl({ field, value, onChange, users, invalid, allowCreate, record, id, "aria-describedby": describedBy }: Props) {
  const str = value == null ? "" : String(value)
  // aria-label keeps controls named where there is no visible label (line-item cells).
  const common = { id, placeholder: field.placeholder, "aria-invalid": invalid || undefined, "aria-label": field.label, "aria-describedby": describedBy }

  switch (field.type) {
    case "TEXT":
    case "TEXTAREA":
      return <Textarea {...common} value={str} maxLength={field.maxLength ?? undefined} onChange={(e) => onChange(e.target.value)} rows={4} />
    case "RICH_TEXT":
      return <RichTextEditor id={id} value={str} onChange={onChange} placeholder={field.placeholder} invalid={invalid} aria-label={field.label} aria-describedby={describedBy} />
    case "NUMERIC":
      return <NumberInput {...common} field={field} value={value} onChange={onChange} />
    case "INTEGER":
      return <NumberInput {...common} inputMode="numeric" field={{ ...field, decimalPlaces: 0 }} value={value} onChange={(v) => onChange(typeof v === "number" ? Math.trunc(v) : v)} />
    case "NUMERIC_SUMMARY": {
      const v = record ? computeSummaries([field], record)[field.name] : value
      return (
        <div id={id} aria-label={field.label} aria-describedby={describedBy} title="Giá trị được tính tự động" className={cn(readOnlyBox, "cursor-not-allowed tabular-nums")}>
          {v == null || v === "" ? <span className="text-muted-foreground">Tự động tính</span> : formatNumber(Number(v), field.decimalPlaces, field.unit)}
        </div>
      )
    }
    case "FIRST_REFERENCE_RECORD":
      return (
        <div id={id} aria-label={field.label} aria-describedby={describedBy} className={cn(readOnlyBox, "cursor-not-allowed")}>
          {str ? <FieldValue field={field} value={str} users={users} size="md" /> : <span className="text-muted-foreground">{field.placeholder || "Tự động lấy bản ghi đầu tiên tham chiếu tới bản ghi này"}</span>}
        </div>
      )
    case "TIME":
      return <Input {...common} type="time" value={str.slice(0, 5)} onChange={(e) => onChange(e.target.value)} className="tabular-nums" />
    case "YEAR":
    case "MONTH":
    case "DAY":
    case "HOUR":
    case "MINUTE":
    case "SECOND": {
      const [min, max] = TIME_PART_RANGE[field.type]!
      return (
        <Input
          {...common}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          placeholder={field.placeholder || `${min}–${max}`}
          value={str}
          onChange={(e) => onChange(e.target.value === "" ? null : Math.trunc(Number(e.target.value)))}
          className="tabular-nums"
        />
      )
    }
    case "ATTACHMENT":
      return <AttachmentInput field={field} id={id} invalid={invalid} value={Array.isArray(value) ? value : []} onChange={onChange} />
    case "CHECKBOX_ONE":
      return <CheckboxGroup single field={field} value={str ? [str] : []} onChange={(v) => onChange(v[0] ?? "")} />
    case "CHECKBOX_LIST":
      return <CheckboxGroup field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
    case "SELECT_LIST_RECORD":
      return <RecordMultiPicker field={field} value={Array.isArray(value) ? value : []} onChange={onChange} invalid={invalid} allowCreate={allowCreate} id={id} aria-describedby={describedBy} />
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
          chevron="form"
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
          chevron="form"
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
      return <Input {...common} value={str} maxLength={field.maxLength ?? undefined} onChange={(e) => onChange(e.target.value)} />
  }
}
