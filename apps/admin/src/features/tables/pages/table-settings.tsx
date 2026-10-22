import { Fragment, useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon, Alert02Icon, ArrowDown01Icon, ArrowUpDownIcon, ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Copy01Icon, Delete02Icon, DragDropVerticalIcon, FloppyDiskIcon, PencilEdit01Icon, PencilIcon,
  Settings02Icon, Tick02Icon, Undo02Icon, ViewIcon, ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { FormRow } from "@workspace/ui/components/form-row"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Select } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteTable, useTable, useTables, useUpdateTable, useWorkGroups } from "../api/tables.queries"
import { ChipMultiSelect } from "../components/chip-multi-select"
import {
  ActionsIcon, type AppIcon, ConversionIcon, DangerIcon, DetailIcon, FieldsIcon, FiltersIcon, GanttIcon, KanbanIcon, ListLayoutIcon,
  ObjectiveIcon, PermissionsIcon, PivotIcon, SettingsNavIcon, TABLE_ICONS,
} from "@/components/icons"
import { FieldEditorDialog } from "../components/field-editor-dialog"
import { FieldTypeIcon } from "../components/field-type-icon"
import { OptionBadge } from "../components/field-value"
import { TableIcon } from "../components/table-icon"
import { ActionsTab, ConversionTab, GanttTab, ItemsSection, ObjectiveTab, PermissionsTab, PivotTab } from "../components/settings-advanced-tabs"
import { AddButton, BTN7, BtnContent, EmptyBox, H4, InfoBox, Pair, SettingsCard, SettingsField, SMALL, Stats, SubCard, Tag } from "../components/settings-card"
import type { Draft, TabProps } from "../components/settings-types"
import type { ActiveTable, KanbanConfig, RefRecordsConfig, TableConfig, TableField, TotalSumField } from "../types/table"
import { fieldTypeLabel, isGroupable, isNumber, uid } from "../utils/fields"

const SEARCHABLE_TYPES: TableField["type"][] = ["SHORT_TEXT", "TEXT", "TEXTAREA", "RICH_TEXT", "EMAIL", "URL"]
const setConfig = (draft: Draft, setDraft: TabProps["setDraft"], patch: Partial<TableConfig>) => setDraft({ ...draft, config: { ...draft.config, ...patch } })

const ICON_CHOICES = TABLE_ICONS
const COLOR_CHOICES = ["#64748b", "#0f766e", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#16a34a", "#0f172a"]

/** Server-managed key shown (read-only) on the general tab; derived from the table id so it is stable per table. */
const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
function encryptionKey(id: string) {
  let h = 2166136261
  let out = ""
  for (let i = 0; i < 32; i++) {
    h = Math.imul(h ^ id.charCodeAt(i % id.length) ^ i, 16777619) >>> 0
    out += KEY_CHARS[h % KEY_CHARS.length]
  }
  return out
}

/** Reference icon combobox: h-9 outline trigger with the colored icon + label and a muted up/down arrow. */
function IconPicker({ value, color, onChange }: { value: string; color: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = ICON_CHOICES.find((i) => i.id === value) ?? ICON_CHOICES[0]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Biểu tượng"
          className="inline-flex h-9 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-normal whitespace-nowrap shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:ring-4 focus-visible:ring-ring/10"
        >
          <span className="flex min-w-0 items-center gap-2">
            <TableIcon plain icon={current.id} color={color} />
            <span className="truncate">{current.label}</span>
          </span>
          <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
        <div role="listbox" className="max-h-[300px] overflow-y-auto">
          {ICON_CHOICES.map((i) => (
            <button
              key={i.id}
              type="button"
              role="option"
              aria-selected={i.id === current.id}
              onClick={() => { onChange(i.id); setOpen(false) }}
              className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground", i.id === current.id && "bg-accent text-accent-foreground")}
            >
              <TableIcon plain icon={i.id} color={color} />
              <span className="min-w-0 flex-1 truncate">{i.label}</span>
              {i.id === current.id && <HugeiconsIcon icon={Tick02Icon} className="size-4 shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Tổng quan ────────────────────────────────────────────────────────────────
function GeneralTab({ table, draft, setDraft }: TabProps) {
  const { data: groups = [] } = useWorkGroups()
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const key = encryptionKey(table.id)
  return (
    <SettingsCard title="Cấu hình chung" description="Thông tin và cài đặt cơ bản của bảng" bodyClassName="space-y-5">
      <SettingsField label="Mã bảng" hint="Định danh duy nhất cho bảng này. Sử dụng khi tham chiếu bảng trong API.">
        <div className="flex gap-2">
          <Input value={table.id} readOnly aria-label="Mã bảng" className="h-8 flex-1 bg-muted font-mono text-sm" />
          <Button type="button" variant="outline" size="icon-sm" className="shrink-0" aria-label="Sao chép mã bảng" title={copied ? "Đã sao chép" : "Sao chép"} onClick={() => navigator.clipboard?.writeText(table.id).then(() => setCopied(true))}>
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
          </Button>
        </div>
      </SettingsField>
      <SettingsField label="Tiêu đề bảng" required hint="Tối đa 100 ký tự">
        <Input className="h-8" value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </SettingsField>
      <SettingsField label="Mô tả">
        <Textarea className="flex" value={draft.description} rows={3} placeholder="Nhập mô tả module" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </SettingsField>
      <div className="space-y-2 text-sm">
        <span className="font-medium">Biểu tượng</span>
        <div className="flex items-center gap-2">
          <IconPicker value={draft.icon} color={draft.iconColor} onChange={(icon) => setDraft({ ...draft, icon })} />
          <Button type="button" variant="ghost" size="sm" className={cn(BTN7, "shrink-0")} onClick={() => setDraft({ ...draft, icon: table.icon, iconColor: table.iconColor })}><HugeiconsIcon icon={Undo02Icon} />Xóa</Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLOR_CHOICES.map((c) => (
            <button key={c} type="button" aria-label={`Màu ${c}`} onClick={() => setDraft({ ...draft, iconColor: c })}
              className={cn("size-6 rounded-md border border-border transition-shadow", draft.iconColor.toLowerCase() === c ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : "hover:ring-2 hover:ring-border")} style={{ backgroundColor: c }} />
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <label className="relative inline-flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-input shadow-xs" title="Màu chữ" style={{ backgroundColor: draft.iconColor }}>
            <span className="inline-block size-full rounded-full border border-background/40" />
            <input type="color" aria-label="Màu chữ" className="absolute inset-0 cursor-pointer opacity-0" value={draft.iconColor} onChange={(e) => setDraft({ ...draft, iconColor: e.target.value })} />
          </label>
          <Input className="h-7 w-24 px-2 font-mono text-xs uppercase" value={draft.iconColor} onChange={(e) => setDraft({ ...draft, iconColor: e.target.value })} aria-label="Mã màu" />
        </div>
        <p className="text-xs text-muted-foreground">Chọn biểu tượng và màu để nhận ra bảng nhanh hơn</p>
      </div>
      <SettingsField label="Nhóm công việc">
        <Select value={draft.workGroupId} onChange={(e) => setDraft({ ...draft, workGroupId: e.target.value })}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </SettingsField>
      <SettingsField label="Hướng sắp xếp mặc định" required hint="Thứ tự sắp xếp mặc định khi hiển thị bản ghi trong danh sách">
        <Select value={draft.config.defaultSort} onChange={(e) => setConfig(draft, setDraft, { defaultSort: e.target.value as "asc" | "desc" })}>
          <option value="desc">mới nhất</option>
          <option value="asc">cũ nhất</option>
        </Select>
      </SettingsField>
      <SettingsField label="Màn hình chính mặc định" hint="Màn hình mở ra khi vào bảng từ menu hoặc liên kết chưa chỉ định màn. Liên kết tới màn cụ thể hoặc bản ghi vẫn giữ nguyên.">
        <Select
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
        </Select>
      </SettingsField>
      <div className="space-y-3 rounded-lg border p-4">
        <div className="space-y-0.5">
          <label htmlFor="encryption-key" className="text-sm font-medium">Khóa mã hóa</label>
          <p className="text-sm text-muted-foreground">Mã hóa phía máy chủ - Khóa được quản lý bởi máy chủ</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input id="encryption-key" readOnly type={showKey ? "text" : "password"} value={key} placeholder="Chưa cấu hình khóa mã hóa" className="h-8 bg-muted pr-10 font-mono text-sm" />
            <Button type="button" variant="ghost" size="icon-sm" className="absolute top-0 right-0 h-full" aria-label={showKey ? "Ẩn khóa" : "Hiện khóa"} onClick={() => setShowKey((s) => !s)}>
              <HugeiconsIcon icon={showKey ? ViewOffSlashIcon : ViewIcon} />
            </Button>
          </div>
          <Button type="button" variant="outline" size="icon-lg" className="shrink-0" aria-label="Sao chép khóa mã hóa" onClick={() => navigator.clipboard?.writeText(key)}>
            <HugeiconsIcon icon={Copy01Icon} />
          </Button>
        </div>
      </div>
      <SettingsField label="Trường có thể tìm kiếm" hint="Các trường được chọn sẽ được băm và lập chỉ mục để tìm kiếm nhanh. Chỉ các trường văn bản (Văn bản ngắn, Văn bản, Văn bản định dạng, Email, URL) mới có thể tìm kiếm.">
        <ChipMultiSelect placeholder="Chọn trường để tìm kiếm..." fields={draft.config.fields.filter((f) => SEARCHABLE_TYPES.includes(f.type))} value={draft.config.searchableFields ?? []} onChange={(searchableFields) => setConfig(draft, setDraft, { searchableFields })} />
      </SettingsField>
      <SettingsField label="Trường hiển thị chính khi tìm bản ghi" hint="Trường hiển thị nổi bật khi bảng khác tìm và chọn bản ghi từ bảng này. Để trống sẽ dùng nhãn tham chiếu mặc định.">
        <Select value={draft.config.lookupPrimaryField ?? ""} onChange={(e) => setConfig(draft, setDraft, { lookupPrimaryField: e.target.value, lookupSecondaryFields: (draft.config.lookupSecondaryFields ?? []).filter((n) => n !== e.target.value) })}>
          <option value="">Mặc định (dùng trường nhãn tham chiếu)</option>
          {draft.config.fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
        </Select>
      </SettingsField>
      <SettingsField label="Trường hiển thị phụ khi tìm bản ghi" hint="Các trường phụ hiển thị bên dưới trường chính giúp phân biệt bản ghi trùng tên. Không thể chọn trường đang là trường chính.">
        <ChipMultiSelect placeholder="Chọn các trường phụ..." fields={draft.config.fields.filter((f) => f.name !== draft.config.lookupPrimaryField)} value={draft.config.lookupSecondaryFields ?? []} onChange={(lookupSecondaryFields) => setConfig(draft, setDraft, { lookupSecondaryFields })} />
      </SettingsField>
    </SettingsCard>
  )
}

// ── Trường ───────────────────────────────────────────────────────────────────
function FieldsTab({ table, draft, setDraft, children }: TabProps & { children?: ReactNode }) {
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
    <SettingsCard title="Cấu hình trường" description="Định nghĩa và quản lý các trường của bảng" bodyClassName="space-y-4" action={<Button size="sm" className={cn(BTN7, "shadow-xs")} onClick={() => setEditor({ open: true })}><HugeiconsIcon icon={Add01Icon} className="h-4 w-4 max-sm:hidden" />Thêm trường</Button>}>
      <div className="h-[min(500px,60vh)] overflow-y-auto rounded-md border border-border bg-background md:h-[500px]">
        <div className="divide-y divide-border">
          {fields.map((f, i) => (
            <div key={f.name} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)} className={cn("group relative flex items-center gap-2 px-2 py-2.5 hover:bg-muted/40 sm:gap-3 sm:px-3", dragIdx === i && "opacity-50")}>
              <button type="button" draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => setDragIdx(null)} className="touch-none cursor-grab rounded-md p-1 text-muted-foreground/60 outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing" aria-label={`Kéo để sắp xếp lại ${f.label}`}>
                <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
              </button>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{f.label}</span>
                  {f.required && <span className="shrink-0 text-xs text-muted-foreground">Bắt buộc</span>}
                  {f.isLocked && <span className="shrink-0 text-xs text-muted-foreground">Khóa chỉnh sửa</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex shrink-0 items-center gap-1" title={f.type}><FieldTypeIcon type={f.type} className="size-3.5" />{fieldTypeLabel(f.type)}</span>
                  <span aria-hidden>·</span>
                  <span className="max-w-[160px] truncate font-mono sm:max-w-none">{f.name}</span>
                  {f.placeholder && <><span className="hidden sm:inline" aria-hidden>·</span><span className="hidden max-w-[200px] truncate sm:inline">Gợi ý: {f.placeholder}</span></>}
                </div>
                {f.options && f.options.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {f.options.slice(0, 5).map((o) => <OptionBadge key={o.value} option={o} className="h-5 text-[11px]" />)}
                    {f.options.length > 5 && <span className="inline-flex h-5 items-center rounded-md border px-1.5 text-[11px] font-medium text-muted-foreground">+{f.options.length - 5} nữa</span>}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label={`Sửa trường ${f.label}`} onClick={() => setEditor({ open: true, field: f })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Xoá trường ${f.label}`} disabled={fields.length === 1} onClick={() => setToDelete(f)}><HugeiconsIcon icon={Delete02Icon} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Stats items={[`Tổng số trường: ${fields.length}`, `Bắt buộc: ${fields.filter((f) => f.required).length}`]} />
      {children}

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
const FN_LABEL: Record<string, string> = { COUNT: "Đếm số bản ghi", SUM: "Tổng", AVG: "Trung bình", MIN: "Nhỏ nhất", MAX: "Lớn nhất" }

/** "Trường tổng hợp" card: roll-up rows shown under a record list (main list or a related tab). */
function TotalSumCard({ fields, value, onChange }: { fields: TableField[]; value: TotalSumField[]; onChange: (v: TotalSumField[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null)
  const numeric = fields.filter((f) => isNumber(f.type))
  const set = (i: number, patch: Partial<TotalSumField>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  return (
    <SettingsCard title="Trường tổng hợp" description="Định nghĩa các trường sẽ được tính tổng ở cuối danh sách bản ghi" bodyClassName="flex flex-col gap-2"
      action={<AddButton variant="direct" label="Thêm" onClick={() => { onChange([...value, { label: "Tổng", formula: "COUNT(*)" }]); setEditing(value.length) }} />}>
      {value.length > 0 && (
        <div className="flex flex-col gap-1">
          {value.map((s, i) => (
            <div key={i} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{s.label || "Không tên"}</span>
                    <Tag className="border-accent-blue/20 bg-accent-blue-subtle text-accent-blue">{s.formula.split("(")[0]}{s.formula.startsWith("COUNT") ? "(*)" : ""}</Tag>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{s.formula}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button size="icon-sm" variant="ghost" aria-label="Sửa" onClick={() => setEditing(editing === i ? null : i)}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Xoá" onClick={() => { onChange(value.filter((_, j) => j !== i)); setEditing(null) }}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </div>
              </div>
              {editing === i && (
                <div className="grid gap-4 border-t p-3 sm:grid-cols-2">
                  <FormRow label="Nhãn"><Input className="h-8" value={s.label} onChange={(e) => set(i, { label: e.target.value })} /></FormRow>
                  <FormRow label="Công thức">
                    <Select value={s.formula} onChange={(e) => set(i, { formula: e.target.value })}>
                      <option value="COUNT(*)">{FN_LABEL.COUNT}</option>
                      {numeric.flatMap((f) => (["SUM", "AVG", "MIN", "MAX"] as const).map((fn) => <option key={fn + f.name} value={`${fn}(${f.name})`}>{FN_LABEL[fn]} · {f.label}</option>))}
                    </Select>
                  </FormRow>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Stats className="text-xs" items={[`Đã cấu hình: ${value.length}`]} />
    </SettingsCard>
  )
}

function ListTab({ draft, setDraft }: TabProps) {
  const c = draft.config
  const setList = (patch: Partial<TableConfig["recordList"]>) => setConfig(draft, setDraft, { recordList: { ...c.recordList, ...patch } })
  return (
    <div>
      <SettingsCard title="Cấu hình hiển thị danh sách" description="Cấu hình cách hiển thị bản ghi trong chế độ xem danh sách" bodyClassName="flex flex-col gap-3">
        <FormRow className="gap-1" label="Loại bố cục" hint="Chế độ xem bảng chuẩn với cột cho mỗi trường">
          <Select value="generic-table" onChange={() => undefined}><option value="generic-table">Bảng chung</option></Select>
        </FormRow>
        <SubCard dense tag="Bảng chung" hint="Mỗi bản ghi là một hàng, mỗi trường là một cột">
          <FormRow className="gap-1" label="Trường hiển thị" hint="Các trường được chọn sẽ xuất hiện dưới dạng cột trong danh sách (thứ tự quan trọng)">
            <ChipMultiSelect fields={c.fields} value={c.recordList.displayFields} onChange={(displayFields) => setList({ displayFields })} />
          </FormRow>
        </SubCard>
        <SubCard dense tag="Sắp xếp" hint="Sắp xếp danh sách theo một trường (mới nhất theo mặc định khi để trống)">
          <FormRow className="gap-1" label="Trường sắp xếp">
            <Select value={c.recordList.sortField ?? ""} onChange={(e) => setList({ sortField: e.target.value })}>
              <option value="">Không sắp xếp (mặc định)</option>
              {c.fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
            </Select>
          </FormRow>
          {c.recordList.sortField && (
            <FormRow className="gap-1" label="Thứ tự">
              <Select value={c.recordList.sortOrder ?? "asc"} onChange={(e) => setList({ sortOrder: e.target.value as "asc" | "desc" })}>
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </Select>
            </FormRow>
          )}
        </SubCard>
        <InfoBox muted title="Thông tin xem trước" points={["Thay đổi sẽ được áp dụng ngay lập tức khi bạn lưu cài đặt. Danh sách sẽ phản ánh cấu hình của bạn."]} />
      </SettingsCard>
      <div className="mt-6">
        <TotalSumCard fields={c.fields} value={c.recordList.totalSumFields} onChange={(totalSumFields) => setList({ totalSumFields })} />
      </div>
    </div>
  )
}

// ── Bộ lọc ───────────────────────────────────────────────────────────────────
const FILTERABLE: TableField["type"][] = [
  "SELECT_ONE", "SELECT_LIST", "CHECKBOX_YES_NO", "CHECKBOX_ONE", "CHECKBOX_LIST", "SELECT_ONE_RECORD", "SELECT_LIST_RECORD", "FIRST_REFERENCE_RECORD",
  "SELECT_ONE_WORKSPACE_USER", "SELECT_LIST_WORKSPACE_USER", "DATE", "DATETIME", "YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND", "AUTO_GENERATED_CODE",
]
/** Reference badge colours per field type (select = info, user = orange, date/time = blue, rest = neutral). */
const typeBadge = (t: TableField["type"]) =>
  t.includes("WORKSPACE_USER") ? "bg-accent-orange-subtle text-accent-orange"
  : t === "SELECT_ONE" || t === "SELECT_LIST" ? "bg-info-subtle text-info"
  : ["DATE", "DATETIME", "YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND"].includes(t) ? "bg-accent-blue-subtle text-accent-blue"
  : "bg-background text-foreground"

function FiltersTab({ draft, setDraft }: TabProps) {
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState("")
  const eligible = draft.config.fields.filter((f) => FILTERABLE.includes(f.type))
  const used = draft.config.quickFilters.map((n) => draft.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const available = eligible.filter((f) => !draft.config.quickFilters.includes(f.name))
  const setFilters = (quickFilters: string[]) => setConfig(draft, setDraft, { quickFilters })
  return (
    <SettingsCard title="Cấu hình bộ lọc nhanh" description="Tạo bộ lọc nhanh cho các truy vấn thường dùng hiển thị ở đầu danh sách" bodyClassName="flex flex-col gap-2"
      action={<AddButton label="Thêm bộ lọc nhanh" disabled={!available.length} onClick={() => { setPick(""); setOpen(true) }} />}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-4 sm:p-6">
          <form onSubmit={(e) => { e.preventDefault(); if (!pick) return; setFilters([...draft.config.quickFilters, pick]); setOpen(false) }}>
            <DialogHeader className="gap-0 space-y-1.5">
              <DialogTitle className="text-lg leading-none font-semibold tracking-tight">Thêm bộ lọc nhanh</DialogTitle>
              <DialogDescription>Chọn trường để dùng làm bộ lọc nhanh trong danh sách</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <SettingsField label="Trường" hint="Chỉ hiển thị các trường đủ điều kiện (SELECT, CHECKBOX, REFERENCE)">
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Chọn trường...</option>
                  {available.map((f) => <option key={f.name} value={f.name}>{f.label} ({f.type})</option>)}
                </Select>
              </SettingsField>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="px-3" disabled={!pick}>Thêm bộ lọc</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {used.length ? (
        <div className="max-h-[400px] overflow-y-auto rounded-md border">
          <div className="divide-y">
            {used.map((f) => (
              <div key={f.name} className="flex items-center gap-2 p-4 transition-colors hover:bg-muted/50">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium">{f.label}</span>
                    <Tag className={typeBadge(f.type)}>{f.type}</Tag>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{f.name}</span>
                </div>
                <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-accent/50 hover:text-destructive" aria-label={`Xoá bộ lọc ${f.label}`} onClick={() => setFilters(draft.config.quickFilters.filter((n) => n !== f.name))}><HugeiconsIcon icon={Delete02Icon} /></Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyBox pad="p-12" title="Chưa có bộ lọc nhanh nào." hint={eligible.length ? "Nhấp “Thêm bộ lọc nhanh” để tạo bộ lọc đầu tiên." : "Thêm trường có lựa chọn (SELECT, CHECKBOX, REFERENCE) để bật bộ lọc nhanh."} />
      )}
      <div className="flex flex-col gap-1">
        <Stats className="gap-x-2" items={[`Bộ lọc đang dùng: ${used.length}`, `Trường đủ điều kiện: ${eligible.length}`, `Có sẵn: ${available.length}`]} />
        <InfoBox title="Yêu cầu bộ lọc nhanh" points={["Chỉ trường có lựa chọn (SELECT, CHECKBOX, REFERENCE), DATE/DATETIME hoặc AUTO_GENERATED_CODE mới có thể dùng làm bộ lọc nhanh. Các bộ lọc này sẽ hiển thị nổi bật ở đầu danh sách để truy cập dễ dàng."]} />
      </div>
    </SettingsCard>
  )
}

// ── Chi tiết ─────────────────────────────────────────────────────────────────
function RefTabRow({ table, value, open, onToggle, onChange, onRemove, dragProps }: {
  table: ActiveTable; value: RefRecordsConfig; open: boolean; onToggle: () => void; onChange: (v: RefRecordsConfig) => void; onRemove: () => void
  dragProps: Pick<ComponentProps<"div">, "draggable" | "onDragStart" | "onDragOver" | "onDrop" | "onDragEnd">
}) {
  const { data: tables = [] } = useTables()
  const v = value
  const refTable = tables.find((t) => t.id === v.refTableId)
  const links = refTable?.config.fields.filter((f) => (f.type === "SELECT_ONE_RECORD" || f.type === "SELECT_LIST_RECORD") && f.referenceTableId === table.id) ?? []
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
            <span className="truncate">{refTable?.name ?? "Chọn một bảng..."}</span><span>•</span><span className="truncate">{linkLabel ?? "Chọn một trường..."}</span><span>•</span><span>{v.layout === "cards" ? "Danh sách thẻ" : "Bảng (Cổ điển)"}</span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Chỉnh sửa tab" onClick={() => !open && onToggle()}><HugeiconsIcon icon={PencilIcon} /></Button>
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
            <Select value={v.refTableId} onChange={(e) => {
              const t = tables.find((x) => x.id === e.target.value)
              const link = t?.config.fields.find((f) => (f.type === "SELECT_ONE_RECORD" || f.type === "SELECT_LIST_RECORD") && f.referenceTableId === table.id)
              onChange({ ...v, refTableId: e.target.value, refField: link?.name ?? "", displayFields: t?.config.recordList.displayFields.slice(0, 4) ?? [] })
            }}>
              <option value="">Chọn một bảng…</option>
              {tables.filter((t) => t.id !== table.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Liên kết qua Trường (trong bảng tham chiếu)" required error={refTable && !links.length ? "Bảng được chọn không có trường nào tham chiếu đến bảng hiện tại." : undefined}>
            <Select value={v.refField} disabled={!links.length} onChange={(e) => onChange({ ...v, refField: e.target.value })}>
              {!refTable && <option value="">Vui lòng chọn bảng trước</option>}
              {links.map((f) => <option key={f.name} value={f.name}>{f.label} ({f.name})</option>)}
            </Select>
          </FormRow>
          <FormRow label="Bố cục" hint={v.layout === "cards" ? "Mỗi bản ghi là một thẻ, các trường xếp dọc" : "Chế độ xem bảng chuẩn với cột cho mỗi trường"}>
            <Select value={v.layout ?? "table"} onChange={(e) => onChange({ ...v, layout: e.target.value as RefRecordsConfig["layout"] })}>
              <option value="table">Bảng (Cổ điển)</option>
              <option value="cards">Danh sách thẻ</option>
            </Select>
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
            <Textarea className="flex font-mono" rows={3} value={v.extraFilter ?? ""} placeholder='{"trang_thai": "da_xuat"}' onChange={(e) => onChange({ ...v, extraFilter: e.target.value })} />
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
  // Index of the expanded tab; re-pointed on delete / reorder so it stays on the same tab.
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
      <SettingsField label="Loại bố cục" hint={twoCol ? "Bố cục hai cột được tối ưu hóa cho màn hình rộng" : "Bố cục dọc phù hợp cho màn hình hẹp"}>
        <Select value={d.layout ?? "head-detail"} onChange={(e) => {
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
        </Select>
      </SettingsField>
      <SettingsField label="Vị trí bình luận" hint={d.commentsPosition === "hidden" ? "Ẩn phần bình luận" : "Hiển thị bình luận trong cột riêng biệt bên phải"}>
        <Select value={d.commentsPosition ?? "right-panel"} onChange={(e) => setD({ commentsPosition: e.target.value as "right-panel" | "hidden" })}>
          <option value="right-panel">Bảng điều khiển bên phải</option>
          <option value="hidden">Ẩn</option>
        </Select>
      </SettingsField>
      <SubCard tag="Phần tiêu đề" hint="Áp dụng cho cả hai bố cục">
        <SettingsField label="Trường tiêu đề" required hint="Trường chính hiển thị ở trên cùng (nổi bật, chữ lớn)">
          <Select value={d.headTitleField} onChange={(e) => setD({ headTitleField: e.target.value })}>
            {fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
          </Select>
        </SettingsField>
        <SettingsField label="Trường dòng phụ" hint="Trường hiển thị bên dưới tiêu đề trong phần đầu">
          <ChipMultiSelect placeholder="Chọn trường dòng phụ…" fields={fields.filter((f) => f.name !== d.headTitleField)} value={d.headSubLineFields} onChange={(headSubLineFields) => setD({ headSubLineFields })} />
        </SettingsField>
      </SubCard>
      {twoCol ? (
        <SubCard tag="Phần thân hai cột" hint="Trường được chia thành cột trái và phải">
          <SettingsField label="Trường cột trái" hint="Trường hiển thị trong cột trái">
            <ChipMultiSelect placeholder="Chọn trường cột trái…" fields={fields.filter((f) => !d.rightFields?.includes(f.name))} value={d.leftFields ?? []} onChange={(leftFields) => setD({ leftFields })} />
          </SettingsField>
          <SettingsField label="Trường cột phải" hint="Trường hiển thị trong cột phải">
            <ChipMultiSelect placeholder="Chọn trường cột phải…" fields={fields.filter((f) => !d.leftFields?.includes(f.name))} value={d.rightFields ?? []} onChange={(rightFields) => setD({ rightFields })} />
          </SettingsField>
        </SubCard>
      ) : (
        <SubCard tag="Phần thân một cột" hint="Trường được xếp theo chiều dọc">
          <SettingsField label="Trường cuối hàng" hint="Trường hiển thị trong phần thân theo chiều dọc">
            <ChipMultiSelect placeholder="Chọn trường cuối hàng…" fields={fields} value={d.rowTailFields} onChange={(rowTailFields) => setD({ rowTailFields })} />
          </SettingsField>
        </SubCard>
      )}
      <SettingsCard title="Hồ sơ liên quan" description="Cấu hình các tab hồ sơ liên quan (ví dụ: Công việc, Ghi chú)" bodyClassName="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold">Hồ sơ liên quan (Tabs)</span>
          <AddButton variant="mr2" label="Thêm Tab" onClick={() => { setD({ refRecords: [...refs, { title: "", refTableId: "", refField: "", displayFields: [], layout: "table", showCreate: true }] }) }} />
        </div>
        {refs.length ? (
          <div className="divide-y divide-border overflow-hidden rounded-lg border bg-background">
            {refs.map((r, i) => (
              <div key={i} className={cn(dragIdx === i && "opacity-50")}>
                <RefTabRow
                  table={table}
                  value={r}
                  onChange={(nv) => setD({ refRecords: refs.map((x, j) => (j === i ? nv : x)) })}
                  open={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                  onRemove={() => { setD({ refRecords: refs.filter((_, j) => j !== i) }); setExpanded(expanded === i ? null : expanded !== null && expanded > i ? expanded - 1 : expanded) }}
                  dragProps={{ draggable: true, onDragStart: () => setDragIdx(i), onDragOver: (e) => e.preventDefault(), onDrop: () => move(i), onDragEnd: () => setDragIdx(null) }}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox pad="p-12" title="Chưa có tab hồ sơ liên quan nào được cấu hình." />
        )}
      </SettingsCard>
      <InfoBox muted title="Thông tin xem trước" points={["Thay đổi sẽ được áp dụng ngay lập tức khi bạn lưu cài đặt. Chế độ xem chi tiết sẽ phản ánh cấu hình của bạn."]} />
    </SettingsCard>
  )
}

// ── Kanban ───────────────────────────────────────────────────────────────────
type KanbanDraft = KanbanConfig & { description?: string }

function KanbanDialog({ open, onOpenChange, fields, value, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; fields: TableField[]; value?: KanbanConfig; onSave: (k: KanbanConfig) => void }) {
  const groupable = fields.filter((f) => isGroupable(f.type))
  const [k, setK] = useState<KanbanDraft | null>(null)
  const [errors, setErrors] = useState<Partial<Record<"name" | "statusField" | "headlineField", string>>>({})
  useEffect(() => {
    if (open) {
      setK(value ?? { id: uid(), name: "", description: "", statusField: groupable[0]?.name ?? "", headlineField: fields[0]?.name ?? "", displayFields: [] })
      setErrors({})
    }
  }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k) return null
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: k.name.trim() ? undefined : "Tên màn hình là bắt buộc",
      statusField: k.statusField ? undefined : "Trường trạng thái là bắt buộc",
      headlineField: k.headlineField ? undefined : "Trường tiêu đề là bắt buộc",
    }
    setErrors(next)
    if (next.name || next.statusField || next.headlineField) return
    onSave({ ...k, name: k.name.trim() })
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-[600px] sm:p-6">
        <form onSubmit={submit}>
          <DialogHeader className="space-y-1.5 gap-0">
            <DialogTitle className="text-lg leading-none font-semibold tracking-tight">{value ? "Chỉnh sửa màn hình Kanban" : "Thêm màn hình Kanban"}</DialogTitle>
            <DialogDescription>Cấu hình bảng Kanban để trực quan hóa luồng công việc. Bản ghi sẽ được tổ chức thành cột dựa trên trường trạng thái.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormRow label="Tên màn hình" required error={errors.name}>
              <Input value={k.name} autoFocus placeholder="Ví dụ: Luồng công việc, Quy trình bán hàng" onChange={(e) => setK({ ...k, name: e.target.value })} />
            </FormRow>
            <FormRow label="Mô tả">
              <Textarea value={k.description ?? ""} placeholder="Mô tả ngắn gọn khung nhìn Kanban này..." onChange={(e) => setK({ ...k, description: e.target.value })} />
            </FormRow>
            <FormRow label="Trường trạng thái" required error={errors.statusField} hint="Các giá trị của trường này sẽ trở thành cột trong bảng Kanban. Chỉ cho phép trường lựa chọn đơn.">
              <Select value={k.statusField} onChange={(e) => setK({ ...k, statusField: e.target.value })}>
                {groupable.map((f) => <option key={f.name} value={f.name}>{f.label} ({f.type})</option>)}
              </Select>
            </FormRow>
            <FormRow label="Trường tiêu đề" required error={errors.headlineField} hint="Trường này sẽ được hiển thị nổi bật làm tiêu đề thẻ trong bảng Kanban">
              <Select value={k.headlineField} onChange={(e) => setK({ ...k, headlineField: e.target.value })}>
                {fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Trường hiển thị" hint="Các trường bổ sung hiển thị trên mỗi thẻ Kanban để tham khảo nhanh">
              <ChipMultiSelect placeholder="Chọn trường hiển thị trên thẻ..." fields={fields.filter((f) => f.name !== k.headlineField && f.name !== k.statusField)} value={k.displayFields} onChange={(displayFields) => setK({ ...k, displayFields })} />
            </FormRow>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3">{value ? "Cập nhật màn hình" : "Thêm màn hình"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function KanbanTab({ draft, setDraft }: TabProps) {
  const c = draft.config
  const [dialog, setDialog] = useState<{ open: boolean; value?: KanbanConfig }>({ open: false })
  const label = (n: string) => c.fields.find((f) => f.name === n)?.label ?? n
  const eligible = c.fields.filter((f) => isGroupable(f.type)).length
  return (
    <SettingsCard
      title="Cấu hình Kanban"
      description="Thiết lập nhiều bảng Kanban để trực quan hóa luồng công việc"
      bodyClassName="space-y-4"
      action={<AddButton variant="direct" label="Thêm màn hình Kanban" disabled={!eligible} onClick={() => setDialog({ open: true })} />}
    >
      {c.kanbanConfigs.length ? (
        <div className="h-[600px] overflow-y-auto rounded-md border">
          <div className="divide-y">
            {c.kanbanConfigs.map((k, i) => (
              <div key={k.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{k.name}</span>
                    <Tag className="bg-muted text-muted-foreground">Màn hình {i + 1}</Tag>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Pair k="Trường trạng thái" v={label(k.statusField)} />
                    <Pair k="Trường tiêu đề" v={label(k.headlineField)} />
                    <Pair className="col-span-2" k="Trường hiển thị" v={`${k.displayFields.length} đã chọn`} />
                  </div>
                  {k.displayFields.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {k.displayFields.slice(0, 5).map((n) => <Tag key={n}>{label(n)}</Tag>)}
                      {k.displayFields.length > 5 && <Tag>+{k.displayFields.length - 5} nữa</Tag>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${k.name}`} onClick={() => setDialog({ open: true, value: k })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Xoá ${k.name}`} onClick={() => setConfig(draft, setDraft, { kanbanConfigs: c.kanbanConfigs.filter((x) => x.id !== k.id) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyBox pad="p-12" title={eligible ? "Chưa cấu hình bảng Kanban nào. Nhấn \"Thêm màn hình Kanban\" để tạo bảng đầu tiên." : "Cần ít nhất một trường “Chọn một”, “Một người dùng” hoặc “Có/Không” để tạo bảng Kanban."} />
      )}
      <Stats items={[`Tổng màn hình: ${c.kanbanConfigs.length}`, `Trường trạng thái đủ điều kiện: ${eligible}`]} />
      <InfoBox bullets title="Tính năng bảng Kanban" points={["Tạo nhiều khung nhìn Kanban cho các luồng công việc khác nhau", "Mỗi bảng sử dụng trường trạng thái để tổ chức thẻ thành cột", "Kéo thả thẻ giữa các cột để cập nhật trạng thái", "Tùy chỉnh trường hiển thị trên mỗi thẻ"]} />
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
    <SettingsCard className="border-destructive" title="Vùng nguy hiểm" description="Các thao tác không thể hoàn tác và ảnh hưởng vĩnh viễn đến bảng" bodyClassName="flex flex-col gap-6">
      <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-2">
        <div className="flex items-start gap-1.5">
          <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex flex-1 flex-col gap-1">
            <h4 className={cn(H4, "text-destructive")}>Cảnh báo: Thao tác vĩnh viễn</h4>
            <p className={cn(SMALL, "text-muted-foreground")}>Các thao tác trong phần này không thể hoàn tác và sẽ xóa dữ liệu vĩnh viễn. Vui lòng thực hiện thận trọng.</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border-2 border-destructive p-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="flex items-center gap-1 text-[length:var(--font-heading-h3-size)] leading-[var(--font-heading-h3-line-height)] font-semibold tracking-[var(--font-heading-h3-letter-spacing)] text-destructive"><HugeiconsIcon icon={Delete02Icon} className="size-5" />Xóa bảng</h3>
            <p className={cn(SMALL, "text-muted-foreground")}>Xóa vĩnh viễn bảng này và toàn bộ dữ liệu liên quan. Thao tác này không thể hoàn tác.</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Thao tác này sẽ xóa vĩnh viễn:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {["Toàn bộ bản ghi và dữ liệu trường", "Toàn bộ bình luận và tệp đính kèm", "Toàn bộ khung nhìn, bộ lọc và sắp xếp", "Toàn bộ luồng tự động hóa liên kết với bảng này", "Toàn bộ cấu hình phân quyền"].map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
          <Button variant="destructive" className="h-9 w-full gap-1 px-5 shadow-xs has-[>svg]:px-5" onClick={() => setConfirm(true)}><HugeiconsIcon icon={Delete02Icon} className="size-4" />Xóa bảng</Button>
        </div>
      </div>
      <div className="rounded-lg border border-info/20 bg-info-subtle p-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-info">Trước khi xóa:</p>
          <ul className="space-y-1 text-xs text-info-subtle-foreground">
            {["Xuất dữ liệu quan trọng để sao lưu", "Xem xét các luồng và phụ thuộc liên quan", "Thông báo cho các thành viên đang sử dụng bảng này", "Cân nhắc lưu trữ thay vì xóa"].map((t) => <li key={t}>• {t}</li>)}
          </ul>
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
    </SettingsCard>
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
  fields: (p) => <FieldsTab {...p}><ItemsSection {...p} /></FieldsTab>,
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
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2 sm:gap-3">
            <Button asChild size="icon-sm" variant="ghost" className="mt-0.5 shrink-0 hover:bg-accent/50" aria-label="Quay lại danh sách"><Link to={`/tables/${table.id}`}><HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" /></Link></Button>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <HugeiconsIcon icon={Settings02Icon} className="size-4 shrink-0 text-muted-foreground sm:size-5" />
                <h1 className="text-base font-semibold break-words text-foreground sm:text-2xl">Cài đặt bảng — {table.name}</h1>
                {dirty && <Tag className="bg-muted text-muted-foreground">Có thay đổi chưa lưu</Tag>}
              </div>
              <p className="text-[length:var(--font-body-default-size)] leading-[var(--font-body-default-line-height)] tracking-[var(--font-body-default-letter-spacing)] text-muted-foreground">Thông tin và cài đặt cơ bản của bảng</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px w-full shrink-0 bg-border/80" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col pt-6 lg:flex-row lg:gap-8">
        <nav aria-label="Mục cài đặt" role="tablist" aria-orientation="vertical" className="no-scrollbar flex shrink-0 overflow-x-auto border-b lg:w-56 lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:pr-3">
          {NAV.map((g, gi) => (
            <Fragment key={g.group}>
              <p role="presentation" className={cn("hidden px-2 pt-4 pb-1 text-[11px] leading-4 font-semibold text-muted-foreground lg:block", gi === 0 && "pt-0")}>{g.group}</p>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setTab(it.id)}
                  role="tab"
                  aria-selected={tab === it.id}
                  data-state={tab === it.id ? "active" : "inactive"}
                  className={cn(
                    // Active styles ride on data-[state=active] (as in the reference) so they outrank the hover tint.
                    "inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground",
                    "lg:flex lg:h-8 lg:w-full lg:justify-start lg:rounded-md lg:border-b-0 lg:px-2 lg:py-0 lg:hover:bg-accent/70",
                    it.danger ? "lg:text-destructive lg:data-[state=active]:bg-accent lg:data-[state=active]:text-destructive" : "lg:data-[state=active]:bg-primary-subtle lg:data-[state=active]:text-primary-subtle-foreground",
                  )}
                >
                  <HugeiconsIcon icon={it.icon} className="size-4" /><span className="whitespace-nowrap">{it.label}</span>
                </button>
              ))}
            </Fragment>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div role="tabpanel" className="mx-auto w-full max-w-5xl p-2 sm:py-6 lg:px-1">{Tab ? <Tab table={table} draft={draft} setDraft={setDraft} /> : <ComingSoonTab title={current.label} />}</div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t bg-background pt-4">
        <span className={cn("text-sm", update.error ? "text-destructive" : "text-muted-foreground")}>
          {update.error ? update.error.message : update.isPending ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu cài đặt"}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className={cn(BTN7, "border-input")} disabled={update.isPending} onClick={() => setDraft(toDraft(table))}><BtnContent icon={Cancel01Icon}>Hủy</BtnContent></Button>
          <Button size="sm" className={cn(BTN7, "shadow-sm")} disabled={!dirty || update.isPending || !draft.name.trim()} onClick={() => update.mutate(draft)}><BtnContent icon={FloppyDiskIcon}>Lưu thay đổi</BtnContent></Button>
        </div>
      </footer>
    </section>
  )
}
