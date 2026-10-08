import { useEffect, useState, type ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { useTables } from "../api/tables.queries"
import type { ActiveTable, TableField } from "../types/table"
import { FIELD_TYPES, renderCodeTemplate, slugify } from "../utils/fields"
import { FieldTypePicker } from "./field-type-picker"
import { FormRow, NativeSelect, Switch } from "./form-controls"
import { OptionListEditor } from "./option-list-editor"

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  table: ActiveTable
  /** Edit mode when set; type and `name` are immutable once created (records are keyed by name). */
  field?: TableField
  onSave: (f: TableField) => void
}

const READONLY_TYPES = new Set(["AUTO_GENERATED_CODE"])

function ToggleCard({ title, description, checked, onChange, disabled }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {!disabled && <Switch checked={checked} onChange={onChange} label={title} />}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function FieldEditorDialog({ open, onOpenChange, table, field, onSave }: Props) {
  const { data: tables = [] } = useTables()
  const [f, setF] = useState<Partial<TableField>>({})
  const [nameTouched, setNameTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const editing = !!field

  useEffect(() => {
    if (!open) return
    setF(field ? structuredClone(field) : { label: "", name: "", placeholder: "", required: false })
    setNameTouched(!!field)
    setErrors({})
  }, [open, field])

  const set = (patch: Partial<TableField>) => setF((s) => ({ ...s, ...patch }))
  const meta = FIELD_TYPES.find((t) => t.type === f.type)
  const refTable = tables.find((t) => t.id === f.referenceTableId)
  const hasOptions = f.type === "SELECT_ONE" || f.type === "SELECT_LIST"
  const readOnlyType = !!f.type && READONLY_TYPES.has(f.type)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!f.type) err.type = "Hãy chọn loại trường"
    if (!f.label?.trim()) err.label = "Nhãn trường là bắt buộc"
    if (!f.name || !/^[a-z][a-z0-9_]*$/.test(f.name)) err.name = "Chỉ dùng a-z, 0-9, dấu _ và bắt đầu bằng chữ"
    else if (!editing && table.config.fields.some((x) => x.name === f.name)) err.name = "Tên trường đã tồn tại trong bảng"
    if (hasOptions && !f.options?.length) err.options = "Cần ít nhất một tuỳ chọn"
    if (hasOptions && f.options && new Set(f.options.map((o) => o.value)).size !== f.options.length) err.options = "Có tuỳ chọn bị trùng giá trị"
    if (f.type === "SELECT_ONE_RECORD" && !f.referenceTableId) err.referenceTableId = "Chọn bảng tham chiếu"
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...(f as TableField), label: f.label!.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-xl">{editing ? "Chỉnh sửa trường" : "Thêm trường mới"}</DialogTitle>
          <DialogDescription>{editing ? "Thay đổi cấu hình của trường." : "Chọn loại dữ liệu rồi đặt tên cho trường mới."}</DialogDescription>
        </DialogHeader>

        <form id="field-form" onSubmit={submit} className="space-y-6 overflow-y-auto px-8 pb-6">
          <FormRow label="Loại trường" required error={errors.type} hint={editing ? "Không đổi được loại sau khi tạo." : undefined}>
            <FieldTypePicker value={f.type} disabled={editing} onChange={(type) => set({ type, options: type === "SELECT_ONE" || type === "SELECT_LIST" ? f.options ?? [] : undefined })} />
          </FormRow>
          {meta && !editing && (
            <p className="-mt-3 rounded-md bg-brand/5 px-3 py-2 text-xs text-muted-foreground">
              Đã chọn: <b className="text-foreground">{meta.label}</b> — {meta.description}
            </p>
          )}

          <Separator />

          <Section title="Cấu hình cơ bản">
            <FormRow label="Nhãn trường" required error={errors.label} hint="Tên hiển thị trên form và cột">
              <Input
                value={f.label ?? ""}
                autoFocus
                placeholder="VD: Tên khách hàng, Ngày đặt hàng"
                onChange={(e) => set({ label: e.target.value, ...(nameTouched ? {} : { name: slugify(e.target.value) }) })}
              />
            </FormRow>
            <FormRow label="Tên trường" required error={errors.name} hint="Mã định danh dạng snake_case, tự sinh từ nhãn">
              <Input
                value={f.name ?? ""}
                disabled={editing}
                placeholder="vd: customer_name"
                className="font-mono text-sm"
                onChange={(e) => {
                  setNameTouched(true)
                  set({ name: e.target.value })
                }}
              />
            </FormRow>
            {!readOnlyType && f.type !== "CHECKBOX_YES_NO" && (
              <FormRow label="Placeholder" hint="Chữ gợi ý khi ô còn trống">
                <Input value={f.placeholder ?? ""} placeholder="VD: Nhập tên khách hàng…" onChange={(e) => set({ placeholder: e.target.value })} />
              </FormRow>
            )}
            {!readOnlyType && !hasOptions && f.type !== "SELECT_ONE_RECORD" && !f.type?.includes("USER") && (
              <FormRow label="Giá trị mặc định" hint="Điền sẵn khi tạo bản ghi mới">
                {f.type === "CHECKBOX_YES_NO" ? (
                  <NativeSelect value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })}>
                    <option value="">Không</option>
                    <option value="true">Có</option>
                  </NativeSelect>
                ) : (
                  <Input value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })} />
                )}
              </FormRow>
            )}
            {hasOptions && f.options && f.options.length > 0 && (
              <FormRow label="Giá trị mặc định">
                <NativeSelect value={f.defaultValue ?? ""} onChange={(e) => set({ defaultValue: e.target.value })}>
                  <option value="">— Không —</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
                </NativeSelect>
              </FormRow>
            )}

            {!readOnlyType && (
              <ToggleCard title="Trường bắt buộc" description="Không cho lưu bản ghi khi trường này trống" checked={!!f.required} onChange={(required) => set({ required })} />
            )}
            {f.type && ["SHORT_TEXT", "EMAIL", "PHONE", "URL"].includes(f.type) && (
              <ToggleCard title="Không trùng lặp" description="Hai bản ghi không được có cùng giá trị" checked={!!f.isUnique} onChange={(isUnique) => set({ isUnique })} />
            )}

            <FormRow label="Độ rộng cột" hint="Áp dụng cho chế độ danh sách. Tự động = co giãn theo loại trường.">
              <div className="flex gap-2">
                <NativeSelect className="w-44" value={f.columnWidth ? "custom" : "auto"} onChange={(e) => set({ columnWidth: e.target.value === "auto" ? null : f.columnWidth || 200 })}>
                  <option value="auto">Tự động</option>
                  <option value="custom">Tuỳ chỉnh (px)</option>
                </NativeSelect>
                <Input type="number" min={80} max={600} disabled={!f.columnWidth} value={f.columnWidth ?? ""} placeholder="Tự động" onChange={(e) => set({ columnWidth: Number(e.target.value) || null })} />
              </div>
            </FormRow>

            <ToggleCard
              title="Khoá chỉnh sửa"
              description={readOnlyType ? "Loại trường này vốn đã chỉ đọc." : "Được nhập khi tạo mới, nhưng không sửa được khi cập nhật bản ghi."}
              checked={!!f.isLocked}
              onChange={(isLocked) => set({ isLocked })}
              disabled={readOnlyType}
            />
          </Section>

          {f.type?.includes("WORKSPACE_USER") && (
            <>
              <Separator />
              <Section title="Vai trò người dùng" description="Quyết định người trong trường này được tính là gì đối với bản ghi.">
                <ToggleCard title="Đánh dấu là người liên quan" description="Bản ghi hiện trong bộ lọc “Liên quan đến tôi” của người được chọn." checked={!!f.isRelatedUser} onChange={(isRelatedUser) => set({ isRelatedUser })} />
                <ToggleCard title="Đánh dấu là người được giao" description="Bản ghi hiện trong bộ lọc “Được giao cho tôi” của người được chọn." checked={!!f.isAssignedUser} onChange={(isAssignedUser) => set({ isAssignedUser })} />
                <ToggleCard title="Người xem có thể thêm người dùng" description="Người chỉ có quyền xem vẫn mời thêm người vào trường này được." checked={!!f.accessUserCanAddUsers} onChange={(accessUserCanAddUsers) => set({ accessUserCanAddUsers })} />
                <ToggleCard title="Người xem có thể loại bỏ người dùng" description="Người chỉ có quyền xem vẫn gỡ người khỏi trường này được." checked={!!f.accessUserCanRemoveUsers} onChange={(accessUserCanRemoveUsers) => set({ accessUserCanRemoveUsers })} />
                <ToggleCard title="Cho phép người được chọn tự rời khỏi vai trò" description="Mỗi người có thể tự gỡ chính mình khỏi trường này." checked={!!f.allowSelfLeave} onChange={(allowSelfLeave) => set({ allowSelfLeave })} />
              </Section>
            </>
          )}

          {hasOptions && (
            <>
              <Separator />
              <Section title="Tuỳ chọn" description="Danh sách giá trị được phép chọn. Cần ít nhất một tuỳ chọn.">
                <OptionListEditor value={f.options ?? []} onChange={(options) => set({ options })} error={errors.options} />
              </Section>
            </>
          )}

          {f.type === "NUMERIC" && (
            <>
              <Separator />
              <Section title="Cấu hình số">
                <div className="grid grid-cols-2 gap-4">
                  <FormRow label="Tối thiểu"><Input type="number" value={f.min ?? ""} onChange={(e) => set({ min: e.target.value === "" ? null : Number(e.target.value) })} /></FormRow>
                  <FormRow label="Tối đa"><Input type="number" value={f.max ?? ""} onChange={(e) => set({ max: e.target.value === "" ? null : Number(e.target.value) })} /></FormRow>
                  <FormRow label="Số chữ số thập phân"><Input type="number" min={0} max={6} value={f.decimalPlaces ?? ""} onChange={(e) => set({ decimalPlaces: e.target.value === "" ? null : Number(e.target.value) })} /></FormRow>
                  <FormRow label="Đơn vị"><Input value={f.unit ?? ""} placeholder="đ, kg, %" onChange={(e) => set({ unit: e.target.value || null })} /></FormRow>
                </div>
              </Section>
            </>
          )}

          {f.type === "AUTO_GENERATED_CODE" && (
            <>
              <Separator />
              <Section title="Mẫu mã" description="Biến hỗ trợ: {{auto.increment}}, {{auto.increment.padLeft(5,0)}}, {{date.yyyy}}, {{date.yy}}, {{date.mm}}, {{date.dd}}">
                <Input value={f.codeTemplate ?? ""} placeholder="KH{{auto.increment.padLeft(5,0)}}" className="font-mono text-sm" onChange={(e) => set({ codeTemplate: e.target.value })} />
                <p className="text-xs text-muted-foreground">Xem trước: <b className="font-mono text-foreground">{renderCodeTemplate(f.codeTemplate || "{{auto.increment}}", 1)}</b></p>
              </Section>
            </>
          )}

          {f.type === "SELECT_ONE_RECORD" && (
            <>
              <Separator />
              <Section title="Tham chiếu">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormRow label="Bảng tham chiếu" required error={errors.referenceTableId}>
                    <NativeSelect value={f.referenceTableId ?? ""} onChange={(e) => set({ referenceTableId: e.target.value, referenceLabelField: "" })}>
                      <option value="">— Chọn bảng —</option>
                      {tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </NativeSelect>
                  </FormRow>
                  <FormRow label="Trường làm nhãn">
                    <NativeSelect value={f.referenceLabelField ?? ""} onChange={(e) => set({ referenceLabelField: e.target.value })} disabled={!refTable}>
                      <option value="">Mặc định (tiêu đề bảng đích)</option>
                      {refTable?.config.fields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                    </NativeSelect>
                  </FormRow>
                </div>
              </Section>
            </>
          )}
        </form>

        <DialogFooter className="border-t px-8 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="submit" form="field-form">{editing ? "Cập nhật trường" : "Thêm trường"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
