import { useEffect, useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FlashIcon, InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { useTables } from "../api/tables.queries"
import type { ActiveTable, FieldType, TableField } from "../types/table"
import { FIELD_TYPES, hasOptions, isComputed, isNumericValue, renderCodeTemplate, slugify, TIME_PART_RANGE } from "../utils/fields"
import { checkFormula, formulaFields } from "../utils/formula"
import { FieldTypePicker } from "./field-type-picker"
import { NativeSelect, Switch } from "./form-controls"
import { OptionListEditor } from "./option-list-editor"
import { SettingsField as FormRow } from "./settings-card"

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  table: ActiveTable
  /** Edit mode when set; type and `name` are immutable once created (records are keyed by name). */
  field?: TableField
  /** New-field mode only: preselect this type (e.g. picked from a "Thêm trường" type menu). */
  initialType?: FieldType
  onSave: (f: TableField) => void
}

const TEXT_LIMIT_TYPES: FieldType[] = ["SHORT_TEXT", "TEXT", "TEXTAREA", "RICH_TEXT"]
const UNIQUE_TYPES: FieldType[] = ["SHORT_TEXT", "EMAIL", "PHONE", "URL"]
/** Types whose add-field dialog has no "Văn bản placeholder" / "Giá trị mặc định" (as in the reference). */
const NO_PLACEHOLDER: FieldType[] = ["ATTACHMENT", "NUMERIC_SUMMARY", "AUTO_GENERATED_CODE", "CHECKBOX_YES_NO"]
const NO_DEFAULT: FieldType[] = ["ATTACHMENT", "AUTO_GENERATED_CODE", "SELECT_ONE_WORKSPACE_USER", "SELECT_LIST_WORKSPACE_USER"]
const isRef = (t?: FieldType) => t === "SELECT_ONE_RECORD" || t === "SELECT_LIST_RECORD"
/** Types that can copy their value from a linked record (reference: not files, multi-choice lists or computed types). */
const canAutoFill = (t: FieldType) => !isComputed(t) && !["ATTACHMENT", "SELECT_LIST", "CHECKBOX_LIST"].includes(t)

function ToggleCard({ title, description, checked, onChange, disabled }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch size="lg" checked={checked && !disabled} disabled={disabled} onChange={onChange} label={title} />
    </div>
  )
}

function Section({ title, description, required, children }: { title: string; description?: string; required?: boolean; children: ReactNode }) {
  return (
    <section className="space-y-4">
      {description ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{title}{required && <span className="ml-1 text-destructive">*</span>}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      ) : (
        <h3 className="text-base font-semibold">{title}</h3>
      )}
      {children}
    </section>
  )
}

const Divider = () => <div className="h-px w-full shrink-0 bg-border/80" />

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s))

export function FieldEditorDialog({ open, onOpenChange, table, field, initialType, onSave }: Props) {
  const { data: tables = [] } = useTables()
  const [f, setF] = useState<Partial<TableField>>({})
  const [nameTouched, setNameTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formulaRef = useRef<HTMLInputElement>(null)
  const editing = !!field

  useEffect(() => {
    if (!open) return
    setF(field ? structuredClone(field) : { label: "", name: "", placeholder: "", required: false, ...(initialType ? { type: initialType, options: hasOptions(initialType) ? [] : undefined } : {}) })
    setNameTouched(!!field)
    setErrors({})
  }, [open, field, initialType])

  const set = (patch: Partial<TableField>) => setF((s) => ({ ...s, ...patch }))
  const t = f.type
  const meta = FIELD_TYPES.find((x) => x.type === (t === "TEXTAREA" ? "TEXT" : t))
  const refTable = tables.find((x) => x.id === f.referenceTableId)
  const withOptions = !!t && hasOptions(t)
  const computed = !!t && isComputed(t)
  // FIRST_REFERENCE_RECORD: reference fields of the source table that point back at this table.
  const backLinks = t === "FIRST_REFERENCE_RECORD" ? refTable?.config.fields.filter((x) => (x.type === "SELECT_ONE_RECORD" || x.type === "SELECT_LIST_RECORD") && x.referenceTableId === table.id) ?? [] : []
  const otherFields = table.config.fields.filter((x) => x.name !== f.name)
  // "Tự động điền từ liên kết": link = SELECT_ONE_RECORD field of this table; source = same-type field of the linked table.
  const linkFields = table.config.fields.filter((x) => x.type === "SELECT_ONE_RECORD" && x.name !== f.name)
  const autoFillTable = tables.find((x) => x.id === linkFields.find((l) => l.name === f.autoFill?.linkField)?.referenceTableId)
  const autoFillSources = autoFillTable?.config.fields.filter((x) => x.type === t) ?? []

  const insertFormulaField = (name: string) => {
    const el = formulaRef.current
    const cur = f.formula ?? ""
    const at = el?.selectionStart ?? cur.length
    const before = cur.slice(0, at), after = cur.slice(el?.selectionEnd ?? at)
    const pad = before && !/[\s(]$/.test(before) ? " " : ""
    set({ formula: `${before}${pad}${name}${after}` })
    requestAnimationFrame(() => {
      el?.focus()
      const pos = before.length + pad.length + name.length
      el?.setSelectionRange(pos, pos)
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!t) err.type = "Vui lòng chọn loại trường"
    if (!f.label?.trim()) err.label = "Nhãn trường là bắt buộc"
    if (!f.name) err.name = "Tên trường là bắt buộc"
    else if (!/^[a-z][a-z0-9_]*$/.test(f.name)) err.name = "Chỉ dùng a-z, 0-9, dấu _ và bắt đầu bằng chữ"
    else if (!editing && table.config.fields.some((x) => x.name === f.name)) err.name = "Tên trường phải là duy nhất"
    if (withOptions && !f.options?.length) err.options = "Ít nhất một tùy chọn là bắt buộc cho trường lựa chọn"
    if (withOptions && f.options && new Set(f.options.map((o) => o.value)).size !== f.options.length) err.options = "Có tuỳ chọn bị trùng giá trị"
    if ((isRef(t) || t === "FIRST_REFERENCE_RECORD") && !f.referenceTableId) err.referenceTableId = "Bảng tham chiếu là bắt buộc"
    if (t === "FIRST_REFERENCE_RECORD" && f.referenceTableId && !f.referenceField) err.referenceField = "Trường tham chiếu là bắt buộc"
    if (t === "AUTO_GENERATED_CODE" && !f.codeTemplate?.trim()) err.codeTemplate = "Mẫu mã là bắt buộc cho trường mã tự sinh"
    if (f.min != null && Number.isNaN(f.min)) err.min = "Giá trị số không hợp lệ"
    if (f.max != null && Number.isNaN(f.max)) err.max = "Giá trị số không hợp lệ"
    else if (f.min != null && f.max != null && f.max < f.min) err.max = "Giá trị tối đa phải lớn hơn hoặc bằng tối thiểu"
    if (f.maxLength != null && (!Number.isInteger(f.maxLength) || f.maxLength < 1)) err.maxLength = "Giới hạn ký tự không hợp lệ"
    if (t === "NUMERIC_SUMMARY") {
      const unknown = formulaFields(f.formula ?? "").filter((n) => !otherFields.some((x) => x.name === n))
      if (!f.formula?.trim()) err.formula = "Công thức là bắt buộc"
      else if (checkFormula(f.formula)) err.formula = checkFormula(f.formula)!
      else if (unknown.length) err.formula = `Không có trường: ${unknown.join(", ")}`
    }
    if (f.autoFill && t && canAutoFill(t)) {
      if (!f.autoFill.linkField) err.autoFillLink = "Vui lòng chọn trường liên kết"
      else if (!f.autoFill.sourceField) err.autoFillSource = "Vui lòng chọn trường nguồn"
    }
    const d = f.defaultValue?.trim()
    if (d && t) {
      const range = TIME_PART_RANGE[t]
      if (isNumericValue(t) && !Number.isFinite(Number(d))) err.defaultValue = "Giá trị mặc định không hợp lệ"
      else if (range && (!Number.isInteger(Number(d)) || Number(d) < range[0] || Number(d) > range[1])) err.defaultValue = "Giá trị mặc định không hợp lệ"
      else if (t === "TIME" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d)) err.defaultValue = "Giá trị thời gian không hợp lệ"
    }
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...(f as TableField), label: f.label!.trim(), ...(computed ? { required: false, isLocked: false } : {}), ...(t && canAutoFill(t) ? {} : { autoFill: null }) })
    onOpenChange(false)
  }

  const defaultInput = () => {
    if (!t) return <Input value={f.defaultValue ?? ""} placeholder="Ví dụ: 2025, pending, https://example.com" onChange={(e) => set({ defaultValue: e.target.value })} />
    if (t === "CHECKBOX_YES_NO")
      return (
        <NativeSelect value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })}>
          <option value="">Không</option>
          <option value="true">Có</option>
        </NativeSelect>
      )
    if (withOptions)
      return (
        <NativeSelect value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })}>
          <option value="">— Không —</option>
          {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
        </NativeSelect>
      )
    if (t === "TIME") return <Input type="time" value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })} />
    if (isNumericValue(t)) {
      const range = TIME_PART_RANGE[t]
      return <Input type="number" min={range?.[0]} max={range?.[1]} step={t === "NUMERIC" || t === "NUMERIC_SUMMARY" ? "any" : 1} value={f.defaultValue ?? ""} placeholder="Ví dụ: 2025" onChange={(e) => set({ defaultValue: e.target.value })} />
    }
    return <Input value={f.defaultValue ?? ""} placeholder="Ví dụ: 2025, pending, https://example.com" onChange={(e) => set({ defaultValue: e.target.value })} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="gap-0 space-y-1.5 p-4 pb-3 sm:p-6 sm:pb-4">
          <DialogTitle className="text-lg leading-none font-semibold tracking-tight">{editing ? "Chỉnh sửa trường" : "Thêm trường mới"}</DialogTitle>
          <DialogDescription className="text-sm">{editing ? "Cập nhật cấu hình trường bên dưới." : "Cấu hình trường mới cho bảng của bạn. Trường xác định cấu trúc dữ liệu."}</DialogDescription>
        </DialogHeader>

        <form id="field-form" onSubmit={submit} className="max-h-[55dvh] space-y-6 overflow-y-auto px-4 pb-6 sm:px-6">
          <FormRow label="Loại trường" required error={errors.type}>
            <FieldTypePicker value={t === "TEXTAREA" ? "TEXT" : t} disabled={editing} onChange={(type) => set({ type, options: hasOptions(type) ? f.options ?? [] : undefined })} />
          </FormRow>
          {meta && (
            <p className="-mt-4 text-sm text-muted-foreground">
              Đã chọn: <strong>{meta.label}</strong> - {meta.description}
            </p>
          )}
          {editing && (
            <div className="rounded-md border border-info/20 bg-info-subtle p-3">
              <div className="flex gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0 text-info" />
                <p className="text-sm text-info">Không thể thay đổi loại trường sau khi tạo để duy trì tính toàn vẹn dữ liệu.</p>
              </div>
            </div>
          )}

          <Divider />

          <Section title="Cấu hình cơ bản">
            <FormRow label="Nhãn trường" required error={errors.label} hint="Tên hiển thị cho người dùng">
              <Input
                value={f.label ?? ""}
                autoFocus
                placeholder="Ví dụ: Tên khách hàng, Địa chỉ email, Ngày đặt hàng"
                onChange={(e) => set({ label: e.target.value, ...(nameTouched ? {} : { name: slugify(e.target.value) }) })}
              />
            </FormRow>
            <FormRow label="Tên trường" required error={errors.name} hint={editing ? "Không thể thay đổi tên trường sau khi tạo" : "Định danh duy nhất (tự động tạo từ nhãn, chữ thường, snake_case)"}>
              <Input
                value={f.name ?? ""}
                disabled={editing}
                placeholder="Ví dụ: customer_name, email_address, order_date"
                className="font-mono text-sm"
                onChange={(e) => {
                  setNameTouched(true)
                  set({ name: e.target.value })
                }}
              />
            </FormRow>
            {!(t && NO_PLACEHOLDER.includes(t)) && (
              <FormRow label="Văn bản placeholder" hint="Văn bản gợi ý hiển thị trong ô nhập trống">
                <Input value={f.placeholder ?? ""} placeholder="Ví dụ: Nhập tên khách hàng..." onChange={(e) => set({ placeholder: e.target.value })} />
              </FormRow>
            )}
            {!(t && NO_DEFAULT.includes(t)) && (
              <FormRow label="Giá trị mặc định" error={errors.defaultValue} hint={t === "NUMERIC_SUMMARY" ? "Dùng khi công thức chưa tính được giá trị" : "Giá trị ban đầu khi tạo bản ghi mới"}>
                {defaultInput()}
              </FormRow>
            )}

            {!computed && (
              <ToggleCard title="Trường bắt buộc" description="Người dùng phải cung cấp giá trị cho trường này" checked={!!f.required} onChange={(required) => set({ required })} />
            )}

            <FormRow label="Độ rộng cột" hint="Áp dụng cho List View dạng bảng. Chọn Tự động để Front-end tự căn theo nội dung.">
              <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                <NativeSelect value={f.columnWidth ? "custom" : "auto"} onChange={(e) => set({ columnWidth: e.target.value === "auto" ? null : f.columnWidth || 200 })}>
                  <option value="auto">Tự động</option>
                  <option value="custom">Cố định</option>
                </NativeSelect>
                {f.columnWidth ? (
                  <Input type="number" min={80} max={600} value={f.columnWidth} placeholder="Ví dụ: 300" aria-label="Độ rộng cột (px)" onChange={(e) => set({ columnWidth: Number(e.target.value) || null })} />
                ) : (
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">Tự động</div>
                )}
              </div>
            </FormRow>

            <ToggleCard
              title="Khóa chỉnh sửa"
              description={computed ? "Loại trường này đã có hành vi chỉ đọc hoặc tự sinh nên không hỗ trợ khóa chỉnh sửa bổ sung." : "Nếu bật, người dùng vẫn nhập được khi tạo mới nhưng không thể sửa tay khi cập nhật bản ghi."}
              checked={!!f.isLocked}
              onChange={(isLocked) => set({ isLocked })}
              disabled={computed}
            />
          </Section>

          {t && (TEXT_LIMIT_TYPES.includes(t) || UNIQUE_TYPES.includes(t)) && (
            <>
              <Divider />
              <Section title="Ràng buộc văn bản">
                {TEXT_LIMIT_TYPES.includes(t) && (
                  <FormRow label="Giới hạn ký tự tối đa" error={errors.maxLength}>
                    <Input type="number" min={1} value={f.maxLength ?? ""} placeholder="Ví dụ: 255" onChange={(e) => set({ maxLength: numOrNull(e.target.value) })} />
                  </FormRow>
                )}
                {UNIQUE_TYPES.includes(t) && (
                  <ToggleCard title="Giá trị duy nhất (Không trùng lặp)" description="Nếu bật, hệ thống sẽ báo lỗi khi giá trị đã tồn tại" checked={!!f.isUnique} onChange={(isUnique) => set({ isUnique })} />
                )}
              </Section>
            </>
          )}

          {t?.includes("WORKSPACE_USER") && (
            <>
              <Divider />
              <Section title="Vai trò người dùng" description="Quyết định người trong trường này được tính là gì đối với bản ghi.">
                <ToggleCard title="Đánh dấu là người liên quan" description="Bản ghi hiện trong bộ lọc “Liên quan đến tôi” của người được chọn." checked={!!f.isRelatedUser} onChange={(isRelatedUser) => set({ isRelatedUser })} />
                <ToggleCard title="Đánh dấu là người được giao" description="Bản ghi hiện trong bộ lọc “Được giao cho tôi” của người được chọn." checked={!!f.isAssignedUser} onChange={(isAssignedUser) => set({ isAssignedUser })} />
                <ToggleCard title="Người xem có thể thêm người dùng" description="Người chỉ có quyền xem vẫn mời thêm người vào trường này được." checked={!!f.accessUserCanAddUsers} onChange={(accessUserCanAddUsers) => set({ accessUserCanAddUsers })} />
                <ToggleCard title="Người xem có thể loại bỏ người dùng" description="Người chỉ có quyền xem vẫn gỡ người khỏi trường này được." checked={!!f.accessUserCanRemoveUsers} onChange={(accessUserCanRemoveUsers) => set({ accessUserCanRemoveUsers })} />
                <ToggleCard title="Cho phép người được chọn tự rời khỏi vai trò" description="Mỗi người có thể tự gỡ chính mình khỏi trường này." checked={!!f.allowSelfLeave} onChange={(allowSelfLeave) => set({ allowSelfLeave })} />
              </Section>
            </>
          )}

          {withOptions && (
            <>
              <Divider />
              <Section title="Tùy chọn" required description="Định nghĩa các lựa chọn có sẵn cho trường này. Ít nhất một tùy chọn là bắt buộc.">
                <OptionListEditor value={f.options ?? []} onChange={(options) => set({ options })} error={errors.options} />
              </Section>
            </>
          )}

          {(t === "NUMERIC" || t === "INTEGER" || t === "NUMERIC_SUMMARY") && (
            <>
              <Divider />
              <Section title="Cấu hình số">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormRow label="Giá trị tối thiểu (Min)" error={errors.min}><Input type="number" step="any" value={f.min ?? ""} placeholder="Không giới hạn" onChange={(e) => set({ min: numOrNull(e.target.value) })} /></FormRow>
                  <FormRow label="Giá trị tối đa (Max)" error={errors.max}><Input type="number" step="any" value={f.max ?? ""} placeholder="Không giới hạn" onChange={(e) => set({ max: numOrNull(e.target.value) })} /></FormRow>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormRow label="Đơn vị tính"><Input value={f.unit ?? ""} placeholder="Ví dụ: kg, %, VNĐ" onChange={(e) => set({ unit: e.target.value || null })} /></FormRow>
                  {t !== "INTEGER" && (
                    <FormRow label="Số chữ số thập phân" hint="Số lượng số 0 hiển thị sau dấu phẩy">
                      <NativeSelect value={f.decimalPlaces == null ? "" : String(f.decimalPlaces)} onChange={(e) => set({ decimalPlaces: numOrNull(e.target.value) })}>
                        <option value="">Auto</option>
                        {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={String(n)}>{n}</option>)}
                      </NativeSelect>
                    </FormRow>
                  )}
                </div>
              </Section>
            </>
          )}

          {t === "NUMERIC_SUMMARY" && (
            <>
              <Divider />
              <Section title="Cấu hình số tự tính" description="Trường này luôn ở chế độ chỉ đọc trong form. Giá trị sẽ được tự động tính và vẫn được gửi trong payload.">
                <FormRow label="Công thức tùy chỉnh" required error={errors.formula} hint="Bắt buộc. Hỗ trợ +, -, *, /, so sánh, &&, || và IF(condition, trueValue, falseValue).">
                  <Input ref={formulaRef} value={f.formula ?? ""} placeholder="VD: quantity * unit_price" className="font-mono text-sm" onChange={(e) => set({ formula: e.target.value })} />
                </FormRow>
                {otherFields.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Nhấp để chèn tên trường vào công thức:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {otherFields.map((x) => (
                        <button key={x.name} type="button" onClick={() => insertFormulaField(x.name)} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-accent">
                          <span>{x.label}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-muted-foreground">{x.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}

          {t === "ATTACHMENT" && (
            <>
              <Divider />
              <Section title="Cấu hình tệp đính kèm">
                <ToggleCard title="Cho phép nhiều tệp" description="Cho phép người dùng tải lên nhiều tệp tin" checked={!!f.allowMultiple} onChange={(allowMultiple) => set({ allowMultiple })} />
                <FormRow label="Loại tệp cho phép" hint="Nhập định dạng MIME hoặc phần mở rộng (phân cách bằng dấu phẩy)">
                  <Input value={f.accept ?? ""} placeholder="VD: image/*, .pdf, .docx" onChange={(e) => set({ accept: e.target.value })} />
                </FormRow>
              </Section>
            </>
          )}

          {t === "AUTO_GENERATED_CODE" && (
            <>
              <Divider />
              <Section title="Cấu hình mẫu mã" description="Biến hỗ trợ: {{auto.increment}}, {{auto.increment.padLeft(5,0)}}, {{date.yyyy}}, {{date.yy}}, {{date.mm}}, {{date.dd}}">
                <FormRow label="Mẫu mã tự sinh" required error={errors.codeTemplate}>
                  <Input value={f.codeTemplate ?? ""} placeholder="KH{{auto.increment.padLeft(5,0)}}" className="font-mono text-sm" onChange={(e) => set({ codeTemplate: e.target.value })} />
                </FormRow>
                <p className="text-xs text-muted-foreground">Xem trước: <b className="font-mono text-foreground">{renderCodeTemplate(f.codeTemplate || "{{auto.increment}}", 1)}</b></p>
              </Section>
            </>
          )}

          {(isRef(t) || t === "FIRST_REFERENCE_RECORD") && (
            <>
              <Divider />
              <Section title="Cấu hình tham chiếu">
                {t === "FIRST_REFERENCE_RECORD" && (
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tra cứu ngược</p>
                    <p className="mt-1 text-sm font-medium">Trường tra cứu ngược</p>
                    <p className="mt-1 text-xs text-muted-foreground">Trường chỉ đọc này hiển thị dữ liệu từ bản ghi đầu tiên trong bảng được chọn có tham chiếu đến bản ghi hiện tại. Bạn phải chỉ định trường nào trong bảng tham chiếu liên kết ngược lại bảng này.</p>
                  </div>
                )}
                <div className="space-y-4">
                  <FormRow label="Bảng tham chiếu" required error={errors.referenceTableId}>
                    <NativeSelect value={f.referenceTableId ?? ""} onChange={(e) => set({ referenceTableId: e.target.value, referenceLabelField: "", referenceField: "" })}>
                      <option value="">Chọn một bảng...</option>
                      {tables.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </NativeSelect>
                  </FormRow>
                  {t === "FIRST_REFERENCE_RECORD" && (
                    <FormRow label="Trường tham chiếu" required error={errors.referenceField} hint={refTable && !backLinks.length ? "Không có trường tham chiếu nào trong bảng" : "Trường trong bảng tham chiếu trỏ về bảng này"}>
                      <NativeSelect value={f.referenceField ?? ""} disabled={!backLinks.length} onChange={(e) => set({ referenceField: e.target.value })}>
                        <option value="">Chọn trường tham chiếu...</option>
                        {backLinks.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                      </NativeSelect>
                    </FormRow>
                  )}
                  {refTable && (
                    <FormRow label="Trường hiển thị" hint="Trường này sẽ được hiển thị làm nhãn cho các bản ghi được tham chiếu">
                      <NativeSelect value={f.referenceLabelField ?? ""} onChange={(e) => set({ referenceLabelField: e.target.value })}>
                        <option value="">Chọn trường hiển thị...</option>
                        {refTable.config.fields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                      </NativeSelect>
                    </FormRow>
                  )}
                </div>
              </Section>
            </>
          )}
          {t && canAutoFill(t) && (
            <>
              <Divider />
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={FlashIcon} className="size-4 shrink-0 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Tự động điền từ liên kết</p>
                      <p className="text-xs text-muted-foreground">Trường này sẽ tự động sao chép giá trị từ bản ghi liên kết khi được chọn</p>
                    </div>
                  </div>
                  <Switch size="lg" label="Tự động điền từ liên kết" checked={!!f.autoFill} onChange={(on) => set({ autoFill: on ? { linkField: linkFields[0]?.name ?? "", sourceField: "" } : null })} />
                </div>
                {f.autoFill && (
                  linkFields.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormRow label="Trường liên kết" required error={errors.autoFillLink} hint="Trường tham chiếu một bản ghi của bảng này">
                        <NativeSelect value={f.autoFill.linkField} onChange={(e) => set({ autoFill: { linkField: e.target.value, sourceField: "" } })}>
                          {linkFields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                        </NativeSelect>
                      </FormRow>
                      <FormRow label="Trường nguồn" required error={errors.autoFillSource} hint="Trường cùng kiểu trong bảng được liên kết">
                        <NativeSelect value={f.autoFill.sourceField} disabled={!autoFillSources.length} onChange={(e) => set({ autoFill: { ...f.autoFill!, sourceField: e.target.value } })}>
                          <option value="">Chọn trường nguồn...</option>
                          {autoFillSources.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                        </NativeSelect>
                      </FormRow>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bảng chưa có trường “Tham chiếu một bản ghi” để liên kết.</p>
                  )
                )}
              </div>
            </>
          )}
        </form>

        <DialogFooter className="gap-2 border-t p-4 pt-3 sm:p-6 sm:pt-4">
          <Button variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" size="sm" className="px-3" form="field-form">{editing ? "Cập nhật trường" : "Thêm trường"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
