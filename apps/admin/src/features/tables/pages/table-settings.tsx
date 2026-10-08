import { useEffect, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
  AlertTriangle, ArrowLeftRight, ChartGantt, ChevronLeft, Copy, Filter, FileText, GripVertical, Kanban, LayoutGrid, List, Pencil, Plus, Save,
  Settings, Shield, Table2, Target, Trash2, X, Zap, type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteTable, useTable, useTables, useUpdateTable, useWorkGroups } from "../api/tables.queries"
import { ChipMultiSelect } from "../components/chip-multi-select"
import { ConfirmDialog } from "../components/confirm-dialog"
import { FieldEditorDialog } from "../components/field-editor-dialog"
import { FieldTypeIcon } from "../components/field-type-icon"
import { OptionBadge } from "../components/field-value"
import { FormRow, NativeSelect, Textarea } from "../components/form-controls"
import { TableIcon } from "../components/table-icon"
import { ActionsTab, ConversionTab, GanttTab, ItemsSection, ObjectiveTab, PermissionsTab, PivotTab } from "../components/settings-advanced-tabs"
import { SettingsCard, SubCard } from "../components/settings-card"
import type { Draft, TabProps } from "../components/settings-types"
import type { ActiveTable, KanbanConfig, TableConfig, TableField } from "../types/table"
import { fieldTypeLabel, isGroupable, uid } from "../utils/fields"

const setConfig = (draft: Draft, setDraft: TabProps["setDraft"], patch: Partial<TableConfig>) => setDraft({ ...draft, config: { ...draft.config, ...patch } })

const ICON_CHOICES = [
  { id: "table", label: "Bảng" },
  { id: "users", label: "Người" },
  { id: "check-square", label: "Công việc" },
  { id: "package", label: "Hàng hoá" },
]
const COLOR_CHOICES = ["#64748b", "#0f766e", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#16a34a", "#0f172a"]

// ── Tổng quan ────────────────────────────────────────────────────────────────
function GeneralTab({ table, draft, setDraft }: TabProps) {
  const { data: groups = [] } = useWorkGroups()
  const [copied, setCopied] = useState(false)
  return (
    <SettingsCard title="Cấu hình chung" description="Tên, biểu tượng và hành vi mặc định của bảng">
      <FormRow label="Mã bảng" hint="Định danh cố định, dùng khi gọi API hoặc tham chiếu bảng.">
        <div className="flex gap-2">
          <Input value={table.id} readOnly className="bg-muted font-mono" />
          <Button type="button" variant="outline" size="icon" aria-label="Sao chép mã bảng" onClick={() => navigator.clipboard?.writeText(table.id).then(() => setCopied(true))}>
            <Copy />
          </Button>
        </div>
        {copied && <span className="text-xs text-emerald-600">Đã sao chép</span>}
      </FormRow>
      <FormRow label="Tiêu đề bảng" required hint="Tối đa 100 ký tự">
        <Input value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </FormRow>
      <FormRow label="Mô tả">
        <Textarea value={draft.description} rows={3} placeholder="Bảng này dùng để…" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </FormRow>
      <div className="grid gap-2 text-sm">
        <span className="font-medium">Biểu tượng</span>
        <div className="flex flex-wrap items-center gap-3">
          <TableIcon icon={draft.icon} color={draft.iconColor} />
          <NativeSelect className="w-44" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })}>
            {ICON_CHOICES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </NativeSelect>
          <div className="flex items-center gap-1.5">
            {COLOR_CHOICES.map((c) => (
              <button key={c} type="button" aria-label={`Màu ${c}`} onClick={() => setDraft({ ...draft, iconColor: c })}
                className={cn("size-7 rounded-md", draft.iconColor === c && "ring-2 ring-brand ring-offset-2")} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Input className="h-8 w-28 font-mono text-xs" value={draft.iconColor} onChange={(e) => setDraft({ ...draft, iconColor: e.target.value })} aria-label="Mã màu" />
        </div>
      </div>
      <FormRow label="Nhóm công việc">
        <NativeSelect value={draft.workGroupId} onChange={(e) => setDraft({ ...draft, workGroupId: e.target.value })}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </NativeSelect>
      </FormRow>
      <FormRow label="Hướng sắp xếp mặc định" required hint="Thứ tự bản ghi khi mở danh sách">
        <NativeSelect value={draft.config.defaultSort} onChange={(e) => setConfig(draft, setDraft, { defaultSort: e.target.value as "asc" | "desc" })}>
          <option value="desc">Mới nhất trước</option>
          <option value="asc">Cũ nhất trước</option>
        </NativeSelect>
      </FormRow>
      <FormRow label="Màn hình chính mặc định" hint="Màn hình mở ra khi vào bảng từ menu">
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
    <SettingsCard title="Cấu hình trường" description="Các trường dữ liệu của bảng — kéo để đổi thứ tự trên form" action={<Button size="sm" onClick={() => setEditor({ open: true })}><Plus />Thêm trường</Button>}>
      <div className="divide-y rounded-lg border">
        {fields.map((f, i) => (
          <div key={f.name} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)} className={cn("flex items-center gap-3 px-3 py-3", dragIdx === i && "opacity-50")}>
            <span draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => setDragIdx(null)} className="cursor-grab p-1 text-muted-foreground" aria-label={`Kéo để sắp xếp ${f.label}`}>
              <GripVertical className="size-4" />
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
            <Button size="icon-sm" variant="ghost" aria-label={`Sửa trường ${f.label}`} onClick={() => setEditor({ open: true, field: f })}><Pencil /></Button>
            <Button size="icon-sm" variant="ghost" aria-label={`Xoá trường ${f.label}`} disabled={fields.length === 1} onClick={() => setToDelete(f)}><Trash2 /></Button>
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
function ListTab({ draft, setDraft }: TabProps) {
  const c = draft.config
  const numeric = c.fields.filter((f) => f.type === "NUMERIC")
  const sums = c.recordList.totalSumFields
  const setList = (patch: Partial<TableConfig["recordList"]>) => setConfig(draft, setDraft, { recordList: { ...c.recordList, ...patch } })
  return (
    <SettingsCard title="Cấu hình hiển thị danh sách" description="Cách bản ghi hiện ở chế độ danh sách">
      <SubCard tag="Bảng chung" hint="Mỗi bản ghi một hàng, mỗi trường một cột">
        <FormRow label="Trường hiển thị" hint="Thứ tự chip = thứ tự cột. Kéo chip để sắp xếp.">
          <ChipMultiSelect fields={c.fields} value={c.recordList.displayFields} onChange={(displayFields) => setList({ displayFields })} />
        </FormRow>
      </SubCard>
      <SubCard tag="Tổng hợp" hint="Dòng thống kê dưới bảng, tính trên các bản ghi đang lọc">
        {sums.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="h-9 max-w-48" value={s.label} onChange={(e) => setList({ totalSumFields: sums.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <NativeSelect value={s.formula} onChange={(e) => setList({ totalSumFields: sums.map((x, j) => (j === i ? { ...x, formula: e.target.value } : x)) })}>
              <option value="COUNT(*)">Đếm số bản ghi</option>
              {numeric.flatMap((f) => (["SUM", "AVG", "MIN", "MAX"] as const).map((fn) => (
                <option key={fn + f.name} value={`${fn}(${f.name})`}>{{ SUM: "Tổng", AVG: "Trung bình", MIN: "Nhỏ nhất", MAX: "Lớn nhất" }[fn]} · {f.label}</option>
              )))}
            </NativeSelect>
            <Button size="icon-sm" variant="ghost" aria-label="Xoá dòng tổng hợp" onClick={() => setList({ totalSumFields: sums.filter((_, j) => j !== i) })}><X /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setList({ totalSumFields: [...sums, { label: "Tổng", formula: "COUNT(*)" }] })}><Plus />Thêm dòng tổng hợp</Button>
      </SubCard>
      <p className="rounded-lg bg-brand/5 px-4 py-3 text-xs text-brand">Thay đổi có hiệu lực ngay sau khi bấm Lưu thay đổi.</p>
    </SettingsCard>
  )
}

// ── Bộ lọc ───────────────────────────────────────────────────────────────────
function FiltersTab({ draft, setDraft }: TabProps) {
  return (
    <SettingsCard title="Bộ lọc nhanh" description="Các ô lọc hiện trên thanh công cụ của bảng">
      <FormRow label="Trường lọc" hint="Hỗ trợ tốt nhất với trường lựa chọn, người dùng, có/không và ngày.">
        <ChipMultiSelect fields={draft.config.fields.filter((f) => f.type !== "RICH_TEXT")} value={draft.config.quickFilters} onChange={(quickFilters) => setConfig(draft, setDraft, { quickFilters })} />
      </FormRow>
    </SettingsCard>
  )
}

// ── Chi tiết ─────────────────────────────────────────────────────────────────
function DetailTab({ table, draft, setDraft }: TabProps) {
  const { data: tables = [] } = useTables()
  const d = draft.config.recordDetail
  const setD = (patch: Partial<typeof d>) => setConfig(draft, setDraft, { recordDetail: { ...d, ...patch } })
  const referencing = tables.flatMap((t) =>
    t.config.fields.filter((f) => f.type === "SELECT_ONE_RECORD" && f.referenceTableId === table.id).map((f) => ({ table: t, field: f })),
  )
  return (
    <SettingsCard title="Cấu hình trang chi tiết" description="Bố cục khi mở một bản ghi">
      <SubCard tag="Đầu trang" hint="Tiêu đề lớn và dòng thông tin phụ">
        <FormRow label="Trường tiêu đề">
          <NativeSelect value={d.headTitleField} onChange={(e) => setD({ headTitleField: e.target.value })}>
            {draft.config.fields.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
          </NativeSelect>
        </FormRow>
        <FormRow label="Dòng phụ">
          <ChipMultiSelect fields={draft.config.fields.filter((f) => f.name !== d.headTitleField)} value={d.headSubLineFields} onChange={(headSubLineFields) => setD({ headSubLineFields })} />
        </FormRow>
      </SubCard>
      <SubCard tag="Nội dung" hint="Các trường hiển thị trong phần thông tin">
        <ChipMultiSelect fields={draft.config.fields} value={d.rowTailFields} onChange={(rowTailFields) => setD({ rowTailFields })} />
      </SubCard>
      <SubCard tag="Bản ghi liên quan" hint="Bản ghi ở bảng khác đang trỏ tới bản ghi này">
        {!referencing.length && <p className="text-xs text-muted-foreground">Chưa có bảng nào có trường “Tham chiếu một bản ghi” trỏ tới bảng này.</p>}
        {referencing.map(({ table: t, field }) => {
          const idx = d.refRecords.findIndex((r) => r.refTableId === t.id && r.refField === field.name)
          return (
            <label key={t.id + field.name} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--brand)]"
                checked={idx >= 0}
                onChange={(e) =>
                  setD({
                    refRecords: e.target.checked
                      ? [...d.refRecords, { title: t.name, refTableId: t.id, refField: field.name, displayFields: t.config.recordList.displayFields.slice(0, 4) }]
                      : d.refRecords.filter((_, j) => j !== idx),
                  })
                }
              />
              {t.name} <span className="text-muted-foreground">· qua trường “{field.label}”</span>
            </label>
          )
        })}
      </SubCard>
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
      action={<Button size="sm" disabled={!canAdd} onClick={() => setDialog({ open: true })}><Plus />Thêm màn hình Kanban</Button>}
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
                  <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${k.name}`} onClick={() => setDialog({ open: true, value: k })}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Xoá ${k.name}`} onClick={() => setConfig(draft, setDraft, { kanbanConfigs: c.kanbanConfigs.filter((x) => x.id !== k.id) })}><Trash2 /></Button>
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
    <SettingsCard title="Vùng nguy hiểm" description="Các thao tác không thể hoàn tác">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-destructive/30 p-4">
        <div className="flex-1">
          <p className="text-sm font-medium">Xoá bảng</p>
          <p className="text-xs text-muted-foreground">Xoá vĩnh viễn bảng cùng toàn bộ bản ghi và bình luận.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}><Trash2 />Xoá bảng</Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Xoá bảng “${table.name}”?`}
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

const NAV: { group: string; items: { id: string; label: string; icon: LucideIcon; danger?: boolean }[] }[] = [
  { group: "Bảng", items: [
    { id: "general", label: "Tổng quan", icon: Settings },
    { id: "fields", label: "Trường", icon: Table2 },
    { id: "actions", label: "Hành động", icon: Zap },
    { id: "permissions", label: "Phân quyền", icon: Shield },
  ] },
  { group: "Cách hiển thị", items: [
    { id: "list", label: "Danh sách", icon: List },
    { id: "filters", label: "Bộ lọc", icon: Filter },
    { id: "detail", label: "Chi tiết", icon: FileText },
    { id: "kanban", label: "Kanban", icon: Kanban },
    { id: "gantt", label: "Gantt", icon: ChartGantt },
    { id: "pivot", label: "Pivot / Matrix", icon: LayoutGrid },
    { id: "objective", label: "Objective Card", icon: Target },
  ] },
  { group: "Nâng cao", items: [
    { id: "conversion", label: "Chuyển đổi", icon: ArrowLeftRight },
    { id: "danger", label: "Nguy hiểm", icon: AlertTriangle, danger: true },
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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <header className="flex items-start gap-3 border-b px-4 py-5 md:px-6">
        <Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại bảng"><Link to={`/tables/${table.id}`}><ChevronLeft /></Link></Button>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><Settings className="size-5 text-muted-foreground" />Cài đặt bảng — {table.name}</h1>
          <p className="text-sm text-muted-foreground">Trường dữ liệu, cách hiển thị và hành vi của bảng</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <nav aria-label="Mục cài đặt" className="shrink-0 space-y-4 overflow-y-auto border-r p-3 max-md:flex max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto max-md:border-r-0 max-md:border-b md:w-56">
          {NAV.map((g) => (
            <div key={g.group} className="max-md:contents">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground max-md:hidden">{g.group}</p>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setTab(it.id)}
                  aria-current={tab === it.id ? "page" : undefined}
                  className={cn(
                    "flex h-8 w-full shrink-0 items-center gap-2.5 rounded-md px-2 text-sm whitespace-nowrap transition-colors max-md:w-auto",
                    tab === it.id ? "bg-brand/10 font-medium text-brand" : "text-foreground/80 hover:bg-muted",
                    it.danger && "text-destructive",
                  )}
                >
                  <it.icon className="size-4" />{it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl">{Tab ? <Tab table={table} draft={draft} setDraft={setDraft} /> : <ComingSoonTab title={current.label} />}</div>
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t px-4 py-3 md:px-6">
        <span className={cn("mr-auto text-sm", update.error ? "text-destructive" : "text-muted-foreground")}>
          {update.error ? update.error.message : update.isPending ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu cài đặt"}
        </span>
        <Button variant="outline" size="sm" disabled={!dirty || update.isPending} onClick={() => setDraft(toDraft(table))}><X />Huỷ</Button>
        <Button size="sm" disabled={!dirty || update.isPending || !draft.name.trim()} onClick={() => update.mutate(draft)}><Save />Lưu thay đổi</Button>
      </footer>
    </section>
  )
}
