import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Alert01Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Copy01Icon, Delete02Icon, DragDropVerticalIcon, FloppyDiskIcon, PencilEdit01Icon, SecurityCheckIcon, Settings02Icon, Undo02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteTable, useTable, useTables, useUpdateTable, useWorkGroups } from "../api/tables.queries"
import { ChipMultiSelect } from "../components/chip-multi-select"
import {
  ActionsIcon, type AppIcon, ConversionIcon, DangerIcon, DetailIcon, FieldsIcon, FiltersIcon, GanttIcon, KanbanIcon, ListLayoutIcon,
  ObjectiveIcon, PermissionsIcon, PivotIcon, SettingsNavIcon, TABLE_ICONS,
} from "@/components/icons"
import { ComboSelect } from "../components/combo-select"
import { ConfirmDialog } from "../components/confirm-dialog"
import { FieldEditorDialog } from "../components/field-editor-dialog"
import { FieldTypeIcon } from "../components/field-type-icon"
import { OptionBadge } from "../components/field-value"
import { FormRow, NativeSelect, Switch, Textarea } from "../components/form-controls"
import { TableIcon } from "../components/table-icon"
import { ActionsTab, ConversionTab, GanttTab, ItemsSection, ObjectiveTab, PermissionsTab, PivotTab } from "../components/settings-advanced-tabs"
import { EmptyBox, InfoBox, SettingsCard, SubCard } from "../components/settings-card"
import type { Draft, TabProps } from "../components/settings-types"
import type { ActiveTable, KanbanConfig, RefRecordsConfig, TableConfig, TableField, TotalSumField } from "../types/table"
import { fieldTypeLabel, isGroupable, uid } from "../utils/fields"

const SEARCHABLE_TYPES: TableField["type"][] = ["SHORT_TEXT", "RICH_TEXT", "EMAIL", "URL"]
const setConfig = (draft: Draft, setDraft: TabProps["setDraft"], patch: Partial<TableConfig>) => setDraft({ ...draft, config: { ...draft.config, ...patch } })

const ICON_CHOICES = TABLE_ICONS
const COLOR_CHOICES = ["#64748b", "#0f766e", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#16a34a", "#0f172a"]

// ── Tổng quan ────────────────────────────────────────────────────────────────
function GeneralTab({ table, draft, setDraft }: TabProps) {
  const { data: groups = [] } = useWorkGroups()
  const [copied, setCopied] = useState(false)
  return (
    <SettingsCard title="Cấu hình chung" description="Thông tin và cài đặt cơ bản của bảng">
      <FormRow label="Mã bảng" hint="Định danh duy nhất cho bảng này. Sử dụng khi tham chiếu bảng trong API.">
        <div className="flex gap-2">
          <Input value={table.id} readOnly aria-label="Mã bảng" className="h-8 bg-muted font-mono" />
          <Button type="button" variant="outline" size="icon-sm" aria-label="Sao chép mã bảng" onClick={() => navigator.clipboard?.writeText(table.id).then(() => setCopied(true))}>
            <HugeiconsIcon icon={Copy01Icon} />
          </Button>
        </div>
        {copied && <span className="text-xs text-emerald-600">Đã sao chép</span>}
      </FormRow>
      <FormRow label="Tiêu đề bảng" required hint="Tối đa 100 ký tự">
        <Input className="h-8" value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </FormRow>
      <FormRow label="Mô tả">
        <Textarea value={draft.description} rows={3} placeholder="Nhập mô tả module" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </FormRow>
      <div className="grid gap-2 text-sm">
        <span className="leading-none font-medium">Biểu tượng</span>
        <div className="flex items-center gap-2">
          <ComboSelect
            className="flex-1"
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon: icon || "table" })}
            aria-label="Biểu tượng"
            options={ICON_CHOICES.map((i) => ({ value: i.id, text: i.label, node: <span className="flex items-center gap-2"><TableIcon plain icon={i.id} color={draft.iconColor} />{i.label}</span> }))}
          />
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setDraft({ ...draft, icon: table.icon, iconColor: table.iconColor })}><HugeiconsIcon icon={Undo02Icon} />Xóa</Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLOR_CHOICES.map((c) => (
            <button key={c} type="button" aria-label={`Màu ${c}`} onClick={() => setDraft({ ...draft, iconColor: c })}
              className={cn("size-6 rounded-md border border-black/10", draft.iconColor.toLowerCase() === c && "ring-2 ring-brand ring-offset-1")} style={{ backgroundColor: c }} />
          ))}
          <span className="mx-1.5 h-6 w-px bg-border" />
          <label className="relative size-6 cursor-pointer overflow-hidden rounded-md border border-black/10" style={{ backgroundColor: draft.iconColor }} title="Chọn màu khác">
            <input type="color" aria-label="Chọn màu khác" className="absolute inset-0 cursor-pointer opacity-0" value={draft.iconColor} onChange={(e) => setDraft({ ...draft, iconColor: e.target.value })} />
          </label>
          <Input className="h-8 w-24 font-mono text-xs" value={draft.iconColor} onChange={(e) => setDraft({ ...draft, iconColor: e.target.value })} aria-label="Mã màu" />
        </div>
        <span className="text-xs text-muted-foreground">Chọn biểu tượng và màu để nhận ra bảng nhanh hơn</span>
      </div>
      <FormRow label="Nhóm công việc">
        <NativeSelect value={draft.workGroupId} onChange={(e) => setDraft({ ...draft, workGroupId: e.target.value })}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </NativeSelect>
      </FormRow>
      <FormRow label="Hướng sắp xếp mặc định" required hint="Thứ tự sắp xếp mặc định khi hiển thị bản ghi trong danh sách">
        <NativeSelect value={draft.config.defaultSort} onChange={(e) => setConfig(draft, setDraft, { defaultSort: e.target.value as "asc" | "desc" })}>
          <option value="desc">mới nhất</option>
          <option value="asc">cũ nhất</option>
        </NativeSelect>
      </FormRow>
      <FormRow label="Màn hình chính mặc định" hint="Màn hình mở ra khi vào bảng từ menu hoặc liên kết chưa chỉ định màn. Liên kết tới màn cụ thể hoặc bản ghi vẫn giữ nguyên">
        <NativeSelect
          value={draft.config.defaultScreen.screenId || "list"}
          onChange={(e) => {
            const id = e.target.value
            const c = draft.config
            const type = id === "list" ? "list"
              : c.ganttCharts.some((g) => g.id === id) ? "gantt"
              : c.pivotConfigs.some((g) => g.id === id) ? "pivot"
              : c.objectiveCards.some((g) => g.id === id) ? "objective"
              : c.conversions.some((g) => g.id === id) ? "conversion" : "kanban"
            setConfig(draft, setDraft, { defaultScreen: { type, screenId: id === "list" ? "" : id } })
          }}
        >
          <option value="list">Danh sách</option>
          {draft.config.kanbanConfigs.map((k) => <option key={k.id} value={k.id}>Kanban · {k.name}</option>)}
          {draft.config.ganttCharts.map((k) => <option key={k.id} value={k.id}>Gantt · {k.name}</option>)}
          {draft.config.pivotConfigs.map((k) => <option key={k.id} value={k.id}>Pivot · {k.name}</option>)}
          {draft.config.objectiveCards.map((k) => <option key={k.id} value={k.id}>Objective · {k.name}</option>)}
          {draft.config.conversions.map((k) => <option key={k.id} value={k.id}>Chuyển đổi · {k.name}</option>)}
        </NativeSelect>
      </FormRow>
      <div className="grid gap-2 text-sm">
        <span className="leading-none font-medium">Khóa mã hóa</span>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><HugeiconsIcon icon={SecurityCheckIcon} className="size-4 text-emerald-600" />Mã hóa phía máy chủ - Khóa được quản lý bởi máy chủ</p>
      </div>
      <FormRow label="Trường có thể tìm kiếm" hint="Các trường được chọn sẽ được băm và lập chỉ mục để tìm kiếm nhanh. Chỉ các trường văn bản (Văn bản ngắn, Văn bản, Email, URL) mới có thể tìm kiếm. Để trống sẽ tìm trên mọi trường.">
        <ChipMultiSelect placeholder="Chọn trường để tìm kiếm…" fields={draft.config.fields.filter((f) => SEARCHABLE_TYPES.includes(f.type))} value={draft.config.searchableFields ?? []} onChange={(searchableFields) => setConfig(draft, setDraft, { searchableFields })} />
      </FormRow>
      <FormRow label="Trường hiển thị chính khi tìm bản ghi" hint="Trường hiển thị nổi bật khi bảng khác tìm và chọn bản ghi từ bảng này. Để trống sẽ dùng nhãn tham chiếu mặc định.">
        <NativeSelect value={draft.config.lookupPrimaryField ?? ""} onChange={(e) => setConfig(draft, setDraft, { lookupPrimaryField: e.target.value, lookupSecondaryFields: (draft.config.lookupSecondaryFields ?? []).filter((n) => n !== e.target.value) })}>
          <option value="">Mặc định (dùng trường nhãn tham chiếu)</option>
          {draft.config.fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
        </NativeSelect>
      </FormRow>
      <FormRow label="Trường hiển thị phụ khi tìm bản ghi" hint="Các trường phụ hiển thị bên dưới trường chính giúp phân biệt bản ghi trùng tên. Không thể chọn trường đang là trường chính.">
        <ChipMultiSelect placeholder="Chọn các trường phụ…" fields={draft.config.fields.filter((f) => f.name !== draft.config.lookupPrimaryField)} value={draft.config.lookupSecondaryFields ?? []} onChange={(lookupSecondaryFields) => setConfig(draft, setDraft, { lookupSecondaryFields })} />
      </FormRow>
    </SettingsCard>
  )
}

// ── Trường ───────────────────────────────────────────────────────────────────
function FieldsTab({ table, draft, setDraft }: TabProps) {
  const [editor, setEditor] = useState<{ open: boolean; field?: TableField }>({ open: false })
  const [toDelete, setToDelete] = useState<TableField | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const fields = draft.config.fields

  const drop = (to: number) => {
    if (dragIdx === null || dragIdx === to) return
    const next = [...fields]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(to, 0, moved)
    setConfig(draft, setDraft, { fields: next })
    setDragIdx(null)
  }
  const save = (f: TableField) => {
    const c = draft.config
    const exists = fields.some((x) => x.name === f.name)
    setConfig(draft, setDraft, exists
      ? { fields: fields.map((x) => (x.name === f.name ? f : x)) }
      : {
          // New fields show up in list + detail by default.
          fields: [...fields, f],
          recordList: { ...c.recordList, displayFields: [...c.recordList.displayFields, f.name] },
          recordDetail: { ...c.recordDetail, rowTailFields: [...c.recordDetail.rowTailFields, f.name] },
        })
  }

  return (
    <SettingsCard title="Cấu hình trường" description="Các trường dữ liệu của bảng — kéo để đổi thứ tự trên form" action={<Button size="sm" onClick={() => setEditor({ open: true })}><HugeiconsIcon icon={Add01Icon} />Thêm trường</Button>}>
      <div className="divide-y rounded-lg border">
        {fields.map((f, i) => (
          <div key={f.name} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)} className={cn("flex items-center gap-3 px-3 py-3", dragIdx === i && "opacity-50")}>
            <span draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => setDragIdx(null)} className="cursor-grab p-1 text-muted-foreground" aria-label={`Kéo để sắp xếp ${f.label}`}>
              <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                {f.label}
                {f.required && <span className="ml-2 text-xs font-normal text-muted-foreground">Bắt buộc</span>}
                {f.isLocked && <span className="ml-2 text-xs font-normal text-muted-foreground">Khoá sửa</span>}
              </p>
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                <FieldTypeIcon type={f.type} />{fieldTypeLabel(f.type)}
                <span>·</span><span className="font-mono">{f.name}</span>
                {f.placeholder && <><span>·</span><span className="truncate">Gợi ý: {f.placeholder}</span></>}
              </p>
              {f.options && f.options.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">{f.options.map((o) => <OptionBadge key={o.value} option={o} />)}</div>
              )}
            </div>
            <Button size="icon-sm" variant="ghost" aria-label={`Sửa trường ${f.label}`} onClick={() => setEditor({ open: true, field: f })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
            <Button size="icon-sm" variant="ghost" aria-label={`Xoá trường ${f.label}`} disabled={fields.length === 1} onClick={() => setToDelete(f)}><HugeiconsIcon icon={Delete02Icon} /></Button>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Tổng số trường: {fields.length} · Bắt buộc: {fields.filter((f) => f.required).length}</p>

      <FieldEditorDialog open={editor.open} field={editor.field} table={{ ...table, config: draft.config }} onOpenChange={(open) => setEditor((s) => ({ ...s, open }))} onSave={save} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Xoá trường “${toDelete?.label}”?`}
        description="Trường bị gỡ khỏi bảng và mọi màn hình sau khi bấm Lưu thay đổi."
        onConfirm={() => {
          setConfig(draft, setDraft, { fields: fields.filter((f) => f.name !== toDelete?.name) })
          setToDelete(null)
        }}
      />
    </SettingsCard>
  )
}

// ── Danh sách ────────────────────────────────────────────────────────────────
const BTN7 = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2"
const FN_LABEL: Record<string, string> = { COUNT: "Đếm số bản ghi", SUM: "Tổng", AVG: "Trung bình", MIN: "Nhỏ nhất", MAX: "Lớn nhất" }

/** "Trường tổng hợp" card: roll-up rows shown under a record list (main list or a related tab). */
function TotalSumCard({ fields, value, onChange }: { fields: TableField[]; value: TotalSumField[]; onChange: (v: TotalSumField[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null)
  const numeric = fields.filter((f) => f.type === "NUMERIC")
  const set = (i: number, patch: Partial<TotalSumField>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  return (
    <SettingsCard title="Trường tổng hợp" description="Định nghĩa các trường sẽ được tính tổng ở cuối danh sách bản ghi"
      action={<Button size="sm" className={BTN7} onClick={() => { onChange([...value, { label: "Tổng", formula: "COUNT(*)" }]); setEditing(value.length) }}><HugeiconsIcon icon={Add01Icon} />Thêm</Button>}>
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="rounded-lg border">
            <div className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{s.label || "Không tên"}</span>
                  <span className="inline-flex h-[22px] items-center rounded-md border border-brand/20 bg-brand/5 px-1.5 font-mono text-xs font-normal text-brand">{s.formula.split("(")[0]}</span>
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{s.formula}</p>
              </div>
              <Button size="icon-sm" variant="ghost" aria-label="Sửa" onClick={() => setEditing(editing === i ? null : i)}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
              <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Xoá" onClick={() => { onChange(value.filter((_, j) => j !== i)); setEditing(null) }}><HugeiconsIcon icon={Delete02Icon} /></Button>
            </div>
            {editing === i && (
              <div className="grid gap-4 border-t p-3 sm:grid-cols-2">
                <FormRow label="Nhãn"><Input className="h-8" value={s.label} onChange={(e) => set(i, { label: e.target.value })} /></FormRow>
                <FormRow label="Công thức">
                  <NativeSelect value={s.formula} onChange={(e) => set(i, { formula: e.target.value })}>
                    <option value="COUNT(*)">{FN_LABEL.COUNT}</option>
                    {numeric.flatMap((f) => (["SUM", "AVG", "MIN", "MAX"] as const).map((fn) => <option key={fn + f.name} value={`${fn}(${f.name})`}>{FN_LABEL[fn]} · {f.label}</option>))}
                  </NativeSelect>
                </FormRow>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Đã cấu hình: {value.length}</p>
    </SettingsCard>
  )
}

function ListTab({ draft, setDraft }: TabProps) {
  const c = draft.config
  const setList = (patch: Partial<TableConfig["recordList"]>) => setConfig(draft, setDraft, { recordList: { ...c.recordList, ...patch } })
  return (
    <div className="space-y-6">
      <SettingsCard title="Cấu hình hiển thị danh sách" description="Cấu hình cách hiển thị bản ghi trong chế độ xem danh sách">
        <FormRow label="Loại bố cục" hint="Chế độ xem bảng chuẩn với cột cho mỗi trường">
          <NativeSelect value="generic-table" onChange={() => undefined}><option value="generic-table">Bảng chung</option></NativeSelect>
        </FormRow>
        <SubCard tag="Bảng chung" hint="Mỗi bản ghi là một hàng, mỗi trường là một cột">
          <FormRow label="Trường hiển thị" hint="Các trường được chọn sẽ xuất hiện dưới dạng cột trong danh sách (thứ tự quan trọng)">
            <ChipMultiSelect fields={c.fields} value={c.recordList.displayFields} onChange={(displayFields) => setList({ displayFields })} />
          </FormRow>
        </SubCard>
        <SubCard tag="Sắp xếp" hint="Sắp xếp danh sách theo một trường (mới nhất theo mặc định khi để trống)">
          <FormRow label="Trường sắp xếp">
            <NativeSelect value={c.recordList.sortField ?? ""} onChange={(e) => setList({ sortField: e.target.value })}>
              <option value="">Không sắp xếp (mặc định)</option>
              {c.fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
            </NativeSelect>
          </FormRow>
          {c.recordList.sortField && (
            <FormRow label="Thứ tự">
              <NativeSelect value={c.recordList.sortOrder ?? "asc"} onChange={(e) => setList({ sortOrder: e.target.value as "asc" | "desc" })}>
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </NativeSelect>
            </FormRow>
          )}
        </SubCard>
        <InfoBox title="Thông tin xem trước" points={["Thay đổi sẽ được áp dụng ngay lập tức khi bạn lưu cài đặt. Danh sách sẽ phản ánh cấu hình của bạn."]} />
      </SettingsCard>
      <TotalSumCard fields={c.fields} value={c.recordList.totalSumFields} onChange={(totalSumFields) => setList({ totalSumFields })} />
    </div>
  )
}

// ── Bộ lọc ───────────────────────────────────────────────────────────────────
const FILTERABLE: TableField["type"][] = ["SELECT_ONE", "SELECT_LIST", "CHECKBOX_YES_NO", "SELECT_ONE_RECORD", "SELECT_ONE_WORKSPACE_USER", "SELECT_LIST_WORKSPACE_USER", "DATE", "DATETIME", "AUTO_GENERATED_CODE"]
const typeBadge = (t: TableField["type"]) =>
  t.startsWith("SELECT_ONE_WORKSPACE") || t.startsWith("SELECT_LIST_WORKSPACE") ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10"
  : t === "SELECT_ONE" || t === "SELECT_LIST" ? "border-brand/20 bg-brand/5 text-brand"
  : "border-border bg-background text-foreground"

function FiltersTab({ draft, setDraft }: TabProps) {
  const [open, setOpen] = useState(false)
  const eligible = draft.config.fields.filter((f) => FILTERABLE.includes(f.type))
  const used = draft.config.quickFilters.map((n) => draft.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const available = eligible.filter((f) => !draft.config.quickFilters.includes(f.name))
  const setFilters = (quickFilters: string[]) => setConfig(draft, setDraft, { quickFilters })
  return (
    <SettingsCard title="Cấu hình bộ lọc nhanh" description="Tạo bộ lọc nhanh cho các truy vấn thường dùng hiển thị ở đầu danh sách"
      action={
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild><Button size="sm" className={BTN7} disabled={!available.length}><HugeiconsIcon icon={Add01Icon} />Thêm bộ lọc nhanh</Button></PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1">
            {available.map((f) => (
              <button key={f.name} type="button" onClick={() => { setFilters([...draft.config.quickFilters, f.name]); setOpen(false) }} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent">
                <FieldTypeIcon type={f.type} className="size-3.5 text-muted-foreground" /><span className="truncate">{f.label}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      }>
      {used.length ? (
        <div className="max-h-[400px] divide-y overflow-y-auto rounded-lg border">
          {used.map((f) => (
            <div key={f.name} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  {f.label}
                  <span className={cn("inline-flex h-[22px] items-center rounded-md border px-1.5 text-xs", typeBadge(f.type))}>{f.type}</span>
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{f.name}</p>
              </div>
              <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Xoá bộ lọc ${f.label}`} onClick={() => setFilters(draft.config.quickFilters.filter((n) => n !== f.name))}><HugeiconsIcon icon={Delete02Icon} /></Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyBox title="Chưa có bộ lọc nhanh nào." hint={eligible.length ? "Nhấp “Thêm bộ lọc nhanh” để tạo bộ lọc đầu tiên." : "Thêm trường có lựa chọn (SELECT, CHECKBOX, REFERENCE) để bật bộ lọc nhanh."} />
      )}
      <p className="!mt-4 text-sm text-muted-foreground">Bộ lọc đang dùng: {used.length}&nbsp;&nbsp;Trường đủ điều kiện: {eligible.length}&nbsp;&nbsp;Có sẵn: {available.length}</p>
      <InfoBox title="Yêu cầu bộ lọc nhanh" points={["Chỉ trường có lựa chọn (SELECT, CHECKBOX, REFERENCE), DATE/DATETIME hoặc AUTO_GENERATED_CODE mới có thể dùng làm bộ lọc nhanh. Các bộ lọc này sẽ hiển thị nổi bật ở đầu danh sách để truy cập dễ dàng."]} />
    </SettingsCard>
  )
}

// ── Chi tiết ─────────────────────────────────────────────────────────────────
function RefTabRow({ table, value, open, onToggle, onChange, onRemove, onDuplicate, dragProps }: {
  table: ActiveTable; value: RefRecordsConfig; open: boolean; onToggle: () => void; onChange: (v: RefRecordsConfig) => void; onRemove: () => void; onDuplicate: () => void
  dragProps: Pick<ComponentProps<"div">, "draggable" | "onDragStart" | "onDragOver" | "onDrop" | "onDragEnd">
}) {
  const { data: tables = [] } = useTables()
  const v = value
  const refTable = tables.find((t) => t.id === v.refTableId)
  const links = refTable?.config.fields.filter((f) => f.type === "SELECT_ONE_RECORD" && f.referenceTableId === table.id) ?? []
  const linkLabel = links.find((f) => f.name === v.refField)?.label
  let jsonError = ""
  try { if (v.extraFilter?.trim()) { const o = JSON.parse(v.extraFilter); if (typeof o !== "object" || Array.isArray(o) || o === null) jsonError = "Phải là JSON object" } } catch { jsonError = "JSON không hợp lệ" }
  return (
    <div className="group transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-4 p-4">
        <div {...dragProps} className="cursor-grab text-muted-foreground/40 hover:text-foreground active:cursor-grabbing"><HugeiconsIcon icon={DragDropVerticalIcon} className="size-5" strokeWidth={1.5} /></div>
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 cursor-pointer flex-col text-left">
          <span className="text-sm font-semibold">{v.title || "Tab không tên"}</span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <span className="truncate">{refTable?.name ?? "—"}</span><span>•</span><span className="truncate">{linkLabel ?? table.name}</span><span>•</span><span>{v.layout === "cards" ? "Danh sách thẻ" : "Bảng (Cổ điển)"}</span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Nhân bản tab" title="Nhân bản" onClick={onDuplicate}><HugeiconsIcon icon={Copy01Icon} /></Button>
          <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Xoá tab" onClick={onRemove}><HugeiconsIcon icon={Delete02Icon} /></Button>
          <Button size="icon-sm" variant="ghost" aria-label={open ? "Thu gọn" : "Mở rộng"} onClick={onToggle}>{open ? <HugeiconsIcon icon={ArrowDown01Icon} /> : <HugeiconsIcon icon={ArrowRight01Icon} />}</Button>
        </div>
      </div>
      {open && (
        <div className="space-y-6 px-12 pt-6 pb-6 max-sm:px-4">
          <div className="-mt-6 mb-6 border-t" />
          <FormRow label="Tiêu đề Tab"><Input className="h-8" value={v.title} onChange={(e) => onChange({ ...v, title: e.target.value })} /></FormRow>
          <FormRow label="Mô tả phụ"><Input className="h-8" value={v.description ?? ""} placeholder="Nhập mô tả module" onChange={(e) => onChange({ ...v, description: e.target.value })} /></FormRow>
          <FormRow label="Bảng tham chiếu">
            <NativeSelect value={v.refTableId} onChange={(e) => {
              const t = tables.find((x) => x.id === e.target.value)
              const link = t?.config.fields.find((f) => f.type === "SELECT_ONE_RECORD" && f.referenceTableId === table.id)
              onChange({ ...v, refTableId: e.target.value, refField: link?.name ?? "", displayFields: t?.config.recordList.displayFields.slice(0, 4) ?? [] })
            }}>
              <option value="">Chọn một bảng…</option>
              {tables.filter((t) => t.id !== table.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Liên kết qua Trường (trong bảng tham chiếu)" required error={refTable && !links.length ? "Bảng được chọn không có trường nào tham chiếu đến bảng hiện tại." : undefined}>
            <NativeSelect value={v.refField} disabled={!links.length} onChange={(e) => onChange({ ...v, refField: e.target.value })}>
              {!refTable && <option value="">Vui lòng chọn bảng trước</option>}
              {links.map((f) => <option key={f.name} value={f.name}>{f.label} ({f.name})</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Bố cục" hint={v.layout === "cards" ? "Mỗi bản ghi là một thẻ, các trường xếp dọc" : "Chế độ xem bảng chuẩn với cột cho mỗi trường"}>
            <NativeSelect value={v.layout ?? "table"} onChange={(e) => onChange({ ...v, layout: e.target.value as RefRecordsConfig["layout"] })}>
              <option value="table">Bảng (Cổ điển)</option>
              <option value="cards">Danh sách thẻ</option>
            </NativeSelect>
          </FormRow>
          {refTable && (
            <SubCard tag={v.layout === "cards" ? "Danh sách thẻ" : "Bảng chung"} hint={v.layout === "cards" ? "Mỗi bản ghi là một thẻ" : "Mỗi bản ghi là một hàng, mỗi trường là một cột"}>
              <FormRow label="Trường hiển thị" hint="Các trường được chọn sẽ xuất hiện dưới dạng cột trong danh sách (thứ tự quan trọng)">
                <ChipMultiSelect fields={refTable.config.fields} value={v.displayFields} onChange={(displayFields) => onChange({ ...v, displayFields })} />
              </FormRow>
            </SubCard>
          )}
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={v.showCreate !== false} onChange={(showCreate) => onChange({ ...v, showCreate })} label="Hiển thị nút Tạo mới" />
            Hiển thị nút Tạo mới
          </label>
          <FormRow label="Điều kiện bổ sung" error={jsonError || undefined} hint="Nhập các điều kiện lọc bổ sung dưới dạng JSON object">
            <Textarea className="font-mono" rows={3} value={v.extraFilter ?? ""} placeholder='{"trang_thai": "da_xuat"}' onChange={(e) => onChange({ ...v, extraFilter: e.target.value })} />
          </FormRow>
          <div className="border-t pt-4">
            <TotalSumCard fields={refTable?.config.fields ?? []} value={v.totalSumFields ?? []} onChange={(totalSumFields) => onChange({ ...v, totalSumFields })} />
          </div>
        </div>
      )}
    </div>
  )
}

function DetailTab({ table, draft, setDraft }: TabProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  // Index of the expanded tab; re-pointed on delete / duplicate / reorder so it stays on the same tab.
  const [expanded, setExpanded] = useState<number | null>(null)
  const d = draft.config.recordDetail
  const fields = draft.config.fields
  const setD = (patch: Partial<typeof d>) => setConfig(draft, setDraft, { recordDetail: { ...d, ...patch } })
  const twoCol = d.layout === "two-column"
  const refs = d.refRecords
  const move = (to: number) => {
    if (dragIdx === null || dragIdx === to) return
    const n = [...refs]; const [m] = n.splice(dragIdx, 1); n.splice(to, 0, m); setD({ refRecords: n })
    if (expanded !== null) {
      const order = refs.map((_, i) => i); const [x] = order.splice(dragIdx, 1); order.splice(to, 0, x)
      setExpanded(order.indexOf(expanded))
    }
    setDragIdx(null)
  }
  return (
    <SettingsCard title="Cấu hình hiển thị chi tiết" description="Cấu hình cách hiển thị chi tiết từng bản ghi">
      <FormRow label="Loại bố cục" hint={twoCol ? "Bố cục hai cột được tối ưu hóa cho màn hình rộng" : "Bố cục dọc phù hợp cho màn hình hẹp"}>
        <NativeSelect value={d.layout ?? "head-detail"} onChange={(e) => {
          const layout = e.target.value as "head-detail" | "two-column"
          // Seed the columns from the one-column list the first time two-column is picked.
          const all = d.rowTailFields.length ? d.rowTailFields : fields.map((f) => f.name) // [] = every field
          const half = Math.ceil(all.length / 2)
          setD(layout === "two-column" && !d.leftFields?.length && !d.rightFields?.length
            ? { layout, leftFields: all.slice(0, half), rightFields: all.slice(half) }
            : { layout })
        }}>
          <option value="head-detail">Chi tiết tiêu đề (Một cột)</option>
          <option value="two-column">Chi tiết hai cột</option>
        </NativeSelect>
      </FormRow>
      <FormRow label="Vị trí bình luận" hint={d.commentsPosition === "hidden" ? "Ẩn phần bình luận" : "Hiển thị bình luận trong cột riêng biệt bên phải"}>
        <NativeSelect value={d.commentsPosition ?? "right-panel"} onChange={(e) => setD({ commentsPosition: e.target.value as "right-panel" | "hidden" })}>
          <option value="right-panel">Bảng điều khiển bên phải</option>
          <option value="hidden">Ẩn</option>
        </NativeSelect>
      </FormRow>
      <SubCard tag="Phần tiêu đề" hint="Áp dụng cho cả hai bố cục">
        <FormRow label="Trường tiêu đề" required hint="Trường chính hiển thị ở trên cùng (nổi bật, chữ lớn)">
          <NativeSelect value={d.headTitleField} onChange={(e) => setD({ headTitleField: e.target.value })}>
            {fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
          </NativeSelect>
        </FormRow>
        <FormRow label="Trường dòng phụ" hint="Trường hiển thị bên dưới tiêu đề trong phần đầu">
          <ChipMultiSelect placeholder="Chọn trường dòng phụ…" fields={fields.filter((f) => f.name !== d.headTitleField)} value={d.headSubLineFields} onChange={(headSubLineFields) => setD({ headSubLineFields })} />
        </FormRow>
      </SubCard>
      {twoCol ? (
        <SubCard tag="Phần thân hai cột" hint="Trường được chia thành cột trái và phải">
          <FormRow label="Trường cột trái" hint="Trường hiển thị trong cột trái">
            <ChipMultiSelect placeholder="Chọn trường cột trái…" fields={fields.filter((f) => !d.rightFields?.includes(f.name))} value={d.leftFields ?? []} onChange={(leftFields) => setD({ leftFields })} />
          </FormRow>
          <FormRow label="Trường cột phải" hint="Trường hiển thị trong cột phải">
            <ChipMultiSelect placeholder="Chọn trường cột phải…" fields={fields.filter((f) => !d.leftFields?.includes(f.name))} value={d.rightFields ?? []} onChange={(rightFields) => setD({ rightFields })} />
          </FormRow>
        </SubCard>
      ) : (
        <SubCard tag="Phần thân một cột" hint="Trường được xếp theo chiều dọc">
          <FormRow label="Trường cuối hàng" hint="Trường hiển thị trong phần thân theo chiều dọc">
            <ChipMultiSelect placeholder="Chọn trường cuối hàng…" fields={fields} value={d.rowTailFields} onChange={(rowTailFields) => setD({ rowTailFields })} />
          </FormRow>
        </SubCard>
      )}
      <div className="rounded-lg border bg-card p-3 sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Hồ sơ liên quan</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Cấu hình các tab hồ sơ liên quan (ví dụ: Công việc, Ghi chú)</p>
        </div>
        <div className="mb-6 flex items-center justify-between gap-2">
          <span className="text-base font-semibold">Hồ sơ liên quan (Tabs)</span>
          <Button size="sm" className={BTN7} onClick={() => { setD({ refRecords: [...refs, { title: "", refTableId: "", refField: "", displayFields: [], layout: "table", showCreate: true }] }); setExpanded(refs.length) }}><HugeiconsIcon icon={Add01Icon} />Thêm Tab</Button>
        </div>
        {refs.length ? (
          <div className="divide-y overflow-hidden rounded-lg border">
            {refs.map((r, i) => (
              <div key={i} className={cn(dragIdx === i && "opacity-50")}>
                <RefTabRow
                  table={table}
                  value={r}
                  onChange={(nv) => setD({ refRecords: refs.map((x, j) => (j === i ? nv : x)) })}
                  open={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                  onRemove={() => { setD({ refRecords: refs.filter((_, j) => j !== i) }); setExpanded(expanded === i ? null : expanded !== null && expanded > i ? expanded - 1 : expanded) }}
                  onDuplicate={() => { setD({ refRecords: [...refs.slice(0, i + 1), { ...r, title: `${r.title} (bản sao)` }, ...refs.slice(i + 1)] }); if (expanded !== null && expanded > i) setExpanded(expanded + 1) }}
                  dragProps={{ draggable: true, onDragStart: () => setDragIdx(i), onDragOver: (e) => e.preventDefault(), onDrop: () => move(i), onDragEnd: () => setDragIdx(null) }}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox title="Chưa có tab hồ sơ liên quan nào được cấu hình." />
        )}
      </div>
      <InfoBox title="Thông tin xem trước" points={["Thay đổi sẽ được áp dụng ngay lập tức khi bạn lưu cài đặt. Chế độ xem chi tiết sẽ phản ánh cấu hình của bạn."]} />
    </SettingsCard>
  )
}

// ── Kanban ───────────────────────────────────────────────────────────────────
function KanbanDialog({ open, onOpenChange, fields, value, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; fields: TableField[]; value?: KanbanConfig; onSave: (k: KanbanConfig) => void }) {
  const groupable = fields.filter((f) => isGroupable(f.type))
  const [k, setK] = useState<KanbanConfig | null>(null)
  useEffect(() => {
    if (open) setK(value ?? { id: uid(), name: "", statusField: groupable[0]?.name ?? "", headlineField: fields[0]?.name ?? "", displayFields: [] })
  }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{value ? "Sửa màn hình Kanban" : "Thêm màn hình Kanban"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <FormRow label="Tên màn hình" required><Input value={k.name} autoFocus onChange={(e) => setK({ ...k, name: e.target.value })} /></FormRow>
          <FormRow label="Trường trạng thái" hint="Mỗi giá trị của trường này là một cột">
            <NativeSelect value={k.statusField} onChange={(e) => setK({ ...k, statusField: e.target.value })}>
              {groupable.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Trường tiêu đề thẻ">
            <NativeSelect value={k.headlineField} onChange={(e) => setK({ ...k, headlineField: e.target.value })}>
              {fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Trường hiển thị trên thẻ">
            <ChipMultiSelect fields={fields.filter((f) => f.name !== k.headlineField && f.name !== k.statusField)} value={k.displayFields} onChange={(displayFields) => setK({ ...k, displayFields })} />
          </FormRow>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!k.name.trim() || !k.statusField} onClick={() => { onSave(k); onOpenChange(false) }}>{value ? "Cập nhật" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KanbanTab({ draft, setDraft }: TabProps) {
  const c = draft.config
  const [dialog, setDialog] = useState<{ open: boolean; value?: KanbanConfig }>({ open: false })
  const label = (n: string) => c.fields.find((f) => f.name === n)?.label ?? n
  const canAdd = c.fields.some((f) => isGroupable(f.type))
  return (
    <SettingsCard
      title="Cấu hình Kanban"
      description="Mỗi màn hình nhóm bản ghi theo một trường; kéo thẻ để đổi giá trị"
      action={<Button size="sm" disabled={!canAdd} onClick={() => setDialog({ open: true })}><HugeiconsIcon icon={Add01Icon} />Thêm màn hình Kanban</Button>}
    >
      {!canAdd && <p className="text-xs text-muted-foreground">Cần ít nhất một trường “Chọn một”, “Một người dùng” hoặc “Có/Không”.</p>}
      {c.kanbanConfigs.length > 0 && (
        <div className="divide-y rounded-lg border">
          {c.kanbanConfigs.map((k, i) => (
            <div key={k.id} className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <p className="font-medium">{k.name}</p>
                <span className="rounded border px-1.5 text-xs text-muted-foreground">Màn hình {i + 1}</span>
                <span className="ml-auto flex">
                  <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${k.name}`} onClick={() => setDialog({ open: true, value: k })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Xoá ${k.name}`} onClick={() => setConfig(draft, setDraft, { kanbanConfigs: c.kanbanConfigs.filter((x) => x.id !== k.id) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </span>
              </div>
              <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <span>Trường trạng thái: <b className="font-medium text-foreground">{label(k.statusField)}</b></span>
                <span>Trường tiêu đề: <b className="font-medium text-foreground">{label(k.headlineField)}</b></span>
                <span>Trường hiển thị: <b className="font-medium text-foreground">{k.displayFields.length} đã chọn</b></span>
              </div>
              <div className="flex flex-wrap gap-1">
                {k.displayFields.slice(0, 5).map((n) => <span key={n} className="rounded border px-1.5 py-0.5 text-xs">{label(n)}</span>)}
                {k.displayFields.length > 5 && <span className="rounded border px-1.5 py-0.5 text-xs">+{k.displayFields.length - 5} nữa</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <KanbanDialog
        open={dialog.open}
        value={dialog.value}
        fields={c.fields}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        onSave={(k) => setConfig(draft, setDraft, { kanbanConfigs: c.kanbanConfigs.some((x) => x.id === k.id) ? c.kanbanConfigs.map((x) => (x.id === k.id ? k : x)) : [...c.kanbanConfigs, k] })}
      />
    </SettingsCard>
  )
}

// ── Nguy hiểm ────────────────────────────────────────────────────────────────
function DangerTab({ table }: TabProps) {
  const navigate = useNavigate()
  const del = useDeleteTable()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="rounded-lg border border-destructive bg-card p-3 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Vùng nguy hiểm</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Các thao tác không thể hoàn tác và ảnh hưởng vĩnh viễn đến bảng</p>
      </div>
      <div className="space-y-6">
        <div className="flex gap-2 rounded-lg border-2 border-destructive/80 bg-destructive/5 px-3 py-3">
          <HugeiconsIcon icon={Alert01Icon} className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Cảnh báo: Thao tác vĩnh viễn</p>
            <p className="mt-1 text-xs text-muted-foreground">Các thao tác trong phần này không thể hoàn tác và sẽ xóa dữ liệu vĩnh viễn. Vui lòng thực hiện thận trọng.</p>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border-2 border-destructive/80 p-6">
          <p className="flex items-center gap-2 text-base font-semibold text-destructive"><HugeiconsIcon icon={Delete02Icon} className="size-4" />Xóa bảng</p>
          <p className="text-xs text-muted-foreground">Xóa vĩnh viễn bảng này và toàn bộ dữ liệu liên quan. Thao tác này không thể hoàn tác.</p>
          <div className="rounded-md bg-muted p-2 text-sm">
            <p className="mb-1 font-medium">Thao tác này sẽ xóa vĩnh viễn:</p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              {["Toàn bộ bản ghi và dữ liệu trường", "Toàn bộ bình luận và tệp đính kèm", "Toàn bộ khung nhìn, bộ lọc và sắp xếp", "Toàn bộ luồng tự động hóa liên kết với bảng này", "Toàn bộ cấu hình phân quyền"].map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <Button variant="destructive" size="sm" className="w-full" onClick={() => setConfirm(true)}><HugeiconsIcon icon={Delete02Icon} />Xóa bảng</Button>
        </div>
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-2 text-brand dark:bg-brand/10">
          <p className="text-sm">Trước khi xóa:</p>
          {["Xuất dữ liệu quan trọng để sao lưu", "Xem xét các luồng và phụ thuộc liên quan", "Thông báo cho các thành viên đang sử dụng bảng này", "Cân nhắc lưu trữ thay vì xóa"].map((t) => <p key={t} className="mt-0.5 text-xs">• {t}</p>)}
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Xóa bảng “${table.name}”?`}
        description="Thao tác này không thể hoàn tác."
        pending={del.isPending}
        onConfirm={() => del.mutate(table.id, { onSuccess: () => navigate("/tables", { replace: true }) })}
      />
    </div>
  )
}

function ComingSoonTab({ title }: { title: string }) {
  return <SettingsCard title={title}><p className="py-10 text-center text-sm text-muted-foreground">Tính năng đang được phát triển.</p></SettingsCard>
}

const NAV: { group: string; items: { id: string; label: string; icon: AppIcon; danger?: boolean }[] }[] = [
  { group: "Bảng", items: [
    { id: "general", label: "Tổng quan", icon: SettingsNavIcon },
    { id: "fields", label: "Trường", icon: FieldsIcon },
    { id: "actions", label: "Hành động", icon: ActionsIcon },
    { id: "permissions", label: "Phân quyền", icon: PermissionsIcon },
  ] },
  { group: "Cách hiển thị", items: [
    { id: "list", label: "Danh sách", icon: ListLayoutIcon },
    { id: "filters", label: "Bộ lọc", icon: FiltersIcon },
    { id: "detail", label: "Chi tiết", icon: DetailIcon },
    { id: "kanban", label: "Kanban", icon: KanbanIcon },
    { id: "gantt", label: "Gantt", icon: GanttIcon },
    { id: "pivot", label: "Pivot / Matrix", icon: PivotIcon },
    { id: "objective", label: "Objective Card", icon: ObjectiveIcon },
  ] },
  { group: "Nâng cao", items: [
    { id: "conversion", label: "Chuyển đổi", icon: ConversionIcon },
    { id: "danger", label: "Nguy hiểm", icon: DangerIcon, danger: true },
  ] },
]

const TABS: Record<string, (p: TabProps) => ReactNode> = {
  general: GeneralTab,
  fields: (p) => <div className="space-y-6"><FieldsTab {...p} /><ItemsSection {...p} /></div>,
  actions: ActionsTab,
  permissions: PermissionsTab,
  list: ListTab,
  filters: FiltersTab,
  detail: DetailTab,
  kanban: KanbanTab,
  gantt: GanttTab,
  pivot: PivotTab,
  objective: ObjectiveTab,
  conversion: ConversionTab,
  danger: DangerTab,
}

const toDraft = (t: ActiveTable): Draft => ({ name: t.name, description: t.description, workGroupId: t.workGroupId, icon: t.icon, iconColor: t.iconColor, config: t.config })

export function TableSettingsPage() {
  const { tableId = "" } = useParams()
  const { data: table, error } = useTable(tableId)
  const update = useUpdateTable(tableId)
  const [tab, setTab] = useState("general")
  const [draft, setDraft] = useState<Draft | null>(null)
  useEffect(() => {
    if (table) setDraft(toDraft(table))
  }, [table])

  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy bảng. <Link to="/tables" className="text-brand hover:underline">Quay lại</Link></p>
  if (!table || !draft) return <Skeleton className="h-full w-full rounded-lg" />

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(table))
  const current = NAV.flatMap((g) => g.items).find((i) => i.id === tab)!
  const Tab = TABS[tab]

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden bg-background p-3 sm:p-6">
      <header className="shrink-0">
        <div className="flex items-start gap-2 sm:gap-3">
          <Button asChild size="icon-sm" variant="ghost" className="mt-0.5 text-muted-foreground" aria-label="Quay lại danh sách"><Link to={`/tables/${table.id}`}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" /></Link></Button>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-center gap-2 text-base font-semibold break-words sm:text-2xl"><HugeiconsIcon icon={Settings02Icon} className="size-5 text-muted-foreground" />Cài đặt bảng — {table.name}</h1>
            <p className="text-sm text-muted-foreground">Thông tin và cài đặt cơ bản của bảng</p>
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-border/80" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col pt-6 lg:flex-row lg:gap-8">
        <nav aria-label="Mục cài đặt" className="no-scrollbar flex shrink-0 overflow-x-auto border-b lg:block lg:w-56 lg:space-y-0.5 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:pr-3">
          {NAV.map((g) => (
            <div key={g.group} className="contents lg:block lg:space-y-0.5">
              <p className="hidden px-2 pt-4 pb-1 text-[11px] leading-4 font-semibold text-muted-foreground lg:block [div:first-child>&]:pt-0">{g.group}</p>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setTab(it.id)}
                  aria-current={tab === it.id ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                    "lg:flex lg:h-8 lg:w-full lg:rounded-md lg:border-b-0 lg:px-2 lg:py-0 lg:hover:bg-accent/70",
                    tab === it.id && "border-brand text-foreground lg:bg-brand/10 lg:text-brand",
                    it.danger && "text-destructive hover:text-destructive lg:text-destructive",
                  )}
                >
                  <HugeiconsIcon icon={it.icon} className="size-4" />{it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-2 sm:py-6 lg:px-1">{Tab ? <Tab table={table} draft={draft} setDraft={setDraft} /> : <ComingSoonTab title={current.label} />}</div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t bg-background pt-4">
        <span className={cn("text-sm", update.error ? "text-destructive" : "text-muted-foreground")}>
          {update.error ? update.error.message : update.isPending ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu cài đặt"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" disabled={!dirty || update.isPending} onClick={() => setDraft(toDraft(table))}><HugeiconsIcon icon={Cancel01Icon} />Hủy</Button>
          <Button size="sm" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" disabled={!dirty || update.isPending || !draft.name.trim()} onClick={() => update.mutate(draft)}><HugeiconsIcon icon={FloppyDiskIcon} />Lưu thay đổi</Button>
        </div>
      </footer>
    </section>
  )
}
