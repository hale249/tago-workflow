import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Add01Icon, ArrowDown01Icon, ArrowUp01Icon, ArrowUp02Icon, ArrowUpDownIcon, Cancel01Icon, Copy01Icon, Database01Icon, Delete02Icon, DragDropVerticalIcon, InformationCircleIcon, PackageIcon,
  PencilEdit01Icon, PencilIcon, PlayIcon, SentIcon, Tick02Icon, UserSettings01Icon, ViewIcon, WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { ObjectiveIcon } from "@/components/icons"
import { useTables, useWorkspaceTeams } from "../api/tables.queries"
import type {
  ConversionConfig, FieldMapping, FieldType, GanttConfig, ItemAutoInit, ObjectiveCardConfig, ObjectiveList, PivotConfig, PivotGroupBy, TableAction, TableField,
} from "../types/table"
import { FIELD_GROUPS, FIELD_TYPES, fieldTypeLabel, isNumber, uid } from "../utils/fields"
import { checkFormula, formulaFields } from "../utils/formula"
import { FieldEditorDialog } from "./field-editor-dialog"
import { FieldTypeIcon } from "./field-type-icon"
import { FormRow, NativeSelect, Switch, Textarea } from "./form-controls"
import { AddButton, BTN7, EmptyBox, InfoBox, Pair, SettingsCard, SettingsField, Stats, SubCard, Tag } from "./settings-card"
import { patchConfig, type TabProps } from "./settings-types"

// ── shared bits ──────────────────────────────────────────────────────────────

/** Field dropdown. `suffix`: "label" = "Nhãn (Kiểu)", "raw" = "Nhãn (SELECT_ONE)" (reference config dialogs), "none" = label only. */
function FieldSelect({ fields, value, onChange, placeholder = "Không chọn", filter, suffix = "label", disabled, ...rest }: {
  fields: TableField[]; value: string | null; onChange: (v: string) => void; placeholder?: string; filter?: (f: TableField) => boolean; suffix?: "label" | "raw" | "none"; disabled?: boolean
  id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean
}) {
  const list = filter ? fields.filter(filter) : fields
  const text = (f: TableField) => (suffix === "none" ? f.label : `${f.label} (${suffix === "raw" ? f.type : fieldTypeLabel(f.type)})`)
  return (
    <NativeSelect value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{placeholder}</option>
      {list.map((f) => <option key={f.name} value={f.name}>{text(f)}</option>)}
    </NativeSelect>
  )
}

/** Inline validation for config dialogs: returns false (keep the dialog open) when any rule fails. */
function useRules<K extends string>() {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({})
  const check = (rules: [K, unknown, string][]) => {
    const next: Partial<Record<K, string>> = {}
    for (const [k, ok, msg] of rules) if (!ok && !next[k]) next[k] = msg
    setErrors(next)
    return Object.keys(next).length === 0
  }
  return { errors, check, reset: () => setErrors({}) }
}

/**
 * Reference config dialogs come in a few shells:
 * - "padded" (custom action): edge-to-edge header / scroll body / bordered footer, each with its own padding;
 * - "classic" (Gantt): p-6 dialog that scrolls as a whole, body `space-y-4 py-4`;
 * - "pivot" / "objective" / "conversion": p-6 flex column with a scrolling body (footer border on the last two).
 */
const SHELLS = {
  padded: {
    content: "flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-[640px]",
    form: "flex min-h-0 flex-col",
    header: "p-4 pb-3 sm:p-6 sm:pb-4",
    body: "max-h-[60dvh] overflow-y-auto px-4 sm:px-6",
    inner: "space-y-4 pb-4",
    footer: "border-t p-4 pt-3 sm:p-6 sm:pt-4",
  },
  wide: {
    content: "flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-3xl",
    form: "flex min-h-0 flex-col",
    header: "p-4 pb-3 sm:p-6 sm:pb-4",
    body: "grid gap-4 overflow-y-auto px-4 pb-6 sm:px-6",
    inner: "",
    footer: "border-t p-4 pt-3 sm:p-6 sm:pt-4",
  },
  classic: { content: "block max-h-[90vh] overflow-y-auto p-4 sm:max-w-[600px] sm:p-6", form: "", header: "", body: "space-y-4 py-4", inner: "", footer: "" },
  pivot: { content: "flex max-h-[90vh] flex-col overflow-hidden p-4 sm:max-w-3xl sm:p-6", form: "flex min-h-0 flex-1 flex-col gap-4", header: "shrink-0", body: "min-h-0 flex-1 overflow-y-auto pr-1", inner: "flex flex-col items-stretch justify-start gap-[var(--space-100)] py-2", footer: "shrink-0" },
  objective: { content: "flex max-h-[90vh] flex-col overflow-hidden p-4 sm:max-w-4xl sm:p-6", form: "flex min-h-0 flex-col", header: "shrink-0", body: "min-h-0 space-y-5 overflow-y-auto py-4 pr-1", inner: "", footer: "shrink-0 border-t pt-4" },
  conversion: { content: "flex max-h-[90vh] flex-col overflow-hidden p-4 sm:max-w-[800px] sm:p-6", form: "flex min-h-0 flex-1 flex-col", header: "", body: "min-h-0 flex-1 space-y-4 overflow-y-auto py-4", inner: "", footer: "border-t pt-4" },
} as const

/** `onSubmit` returns false to keep the dialog open (validation errors are shown inline, as in the reference). */
function ConfigDialog({ open, onOpenChange, title, description, children, onSubmit, submitLabel, shell = "classic" }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; onSubmit: () => boolean | void; submitLabel: string; shell?: keyof typeof SHELLS
}) {
  const s = SHELLS[shell]
  const submit = (e: FormEvent) => {
    // Nested dialogs (e.g. the field editor) are portalled but their submit events still bubble through React.
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    if (onSubmit() !== false) onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <form className={s.form} onSubmit={submit} noValidate>
          <DialogHeader className={cn("gap-0 space-y-1.5", s.header)}>
            <DialogTitle className="text-lg leading-none font-semibold tracking-tight">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className={s.body}>{s.inner ? <div className={s.inner}>{children}</div> : children}</div>
          <DialogFooter className={cn("gap-2", s.footer)}>
            <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" size="sm" className="px-3">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Generic "list of config cards + add/edit dialog" state. */
function useEditor<T extends { id: string }>() {
  const [state, setState] = useState<{ open: boolean; value?: T }>({ open: false })
  return { ...state, openNew: () => setState({ open: true }), openEdit: (value: T) => setState({ open: true, value }), setOpen: (open: boolean) => setState((s) => ({ ...s, open })) }
}
const upsert = <T extends { id: string }>(list: T[], v: T) => (list.some((x) => x.id === v.id) ? list.map((x) => (x.id === v.id ? v : x)) : [...list, v])

/** Summary row of a configured screen (reference Kanban row: title + "Màn hình n" badge, details, edit / delete). */
function ConfigRow({ title, badge, onEdit, onDelete, children }: { title: string; badge: string; onEdit: () => void; onDelete: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <Tag className="bg-muted text-muted-foreground">{badge}</Tag>
        </div>
        {children}
      </div>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${title}`} onClick={onEdit}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
        <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Xoá ${title}`} onClick={onDelete}><HugeiconsIcon icon={Delete02Icon} /></Button>
      </div>
    </div>
  )
}

function ConfigList({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-md border"><div className="divide-y">{children}</div></div>
}

// ── Tự khởi tạo item từ bảng kích hoạt ──────────────────────────────────────

const NO_AUTO_INIT: ItemAutoInit = { enabled: false, triggerField: "", itemMappings: [], sumMappings: [] }

function MappingRows({ targets, sources, value, onChange, sourceLabel, targetLabel }: {
  targets: { name: string; label: string; type?: string }[]; sources: { name: string; label: string; type?: string }[]
  value: FieldMapping[]; onChange: (v: FieldMapping[]) => void; sourceLabel: string; targetLabel: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border text-sm">
      <div className="grid grid-cols-2 bg-muted/40 text-xs font-medium text-muted-foreground"><span className="px-3 py-2">{targetLabel}</span><span className="px-3 py-2">{sourceLabel}</span></div>
      {targets.map((t) => {
        const cur = value.find((m) => m.target === t.name)?.source ?? ""
        // Same data type only; each target maps once (one row per target).
        const options = sources.filter((x) => !t.type || !x.type || x.type === t.type)
        return (
          <div key={t.name} className="grid grid-cols-2 items-center border-t">
            <span className="px-3 py-2">{t.label}</span>
            <div className="px-2 py-1.5">
              <NativeSelect value={cur} onChange={(e) => onChange([...value.filter((m) => m.target !== t.name), ...(e.target.value ? [{ source: e.target.value, target: t.name }] : [])])}>
                <option value="">-- Không ánh xạ --</option>
                {options.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
              </NativeSelect>
            </div>
          </div>
        )
      })}
      {!targets.length && <p className="border-t px-3 py-3 text-xs text-muted-foreground">Chưa có trường đích.</p>}
    </div>
  )
}

function ItemAutoInitPanel(p: TabProps) {
  const { data: tables = [] } = useTables()
  const items = p.draft.config.items
  const ai = items.autoInit ?? NO_AUTO_INIT
  const setAi = (patch: Partial<ItemAutoInit>) => patchConfig(p, { items: { ...items, autoInit: { ...ai, ...patch } } })
  const [open, setOpen] = useState(false)
  // Trigger candidates: reference fields whose target table has line items.
  const triggers = p.draft.config.fields.filter((f) => f.type === "SELECT_ONE_RECORD" && tables.find((t) => t.id === f.referenceTableId)?.config.items.enabled)
  const source = tables.find((t) => t.id === p.draft.config.fields.find((f) => f.name === ai.triggerField)?.referenceTableId)
  const parentLabel = (n: string) => p.draft.config.fields.find((f) => f.name === n)?.label ?? n
  const errors = ai.enabled ? [!ai.triggerField && "Vui lòng chọn trường kích hoạt", ai.triggerField && !ai.itemMappings.length && "Cần cấu hình ít nhất một ánh xạ trường item"].filter(Boolean) : []

  return (
    <SubCard tag="Tự khởi tạo" hint="Chọn bản ghi ở trường kích hoạt → sao chép danh sách item của bản ghi đó sang đây">
      <label className="flex items-center gap-3 text-sm">
        <Switch checked={ai.enabled} onChange={(enabled) => setAi({ enabled })} label="Tự động khởi tạo item từ bảng kích hoạt" />
        Tự động khởi tạo item từ bảng kích hoạt
      </label>
      {ai.enabled && (
        <>
          <FormRow label="Trường kích hoạt" hint="Chỉ gồm trường Tham chiếu một bản ghi trỏ tới bảng có danh sách chi tiết.">
            {triggers.length ? (
              <FieldSelect fields={triggers} value={ai.triggerField} placeholder="Chọn trường kích hoạt" onChange={(triggerField) => setAi({ triggerField, itemMappings: [], sumMappings: [] })} />
            ) : (
              <p className="text-xs text-muted-foreground">Không có trường liên kết bản ghi phù hợp.</p>
            )}
          </FormRow>
          {source && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Cấu hình ánh xạ</Button>
              <span className="text-muted-foreground">{ai.itemMappings.length} trường item · {ai.sumMappings.length} trường tổng · nguồn: {source.name}</span>
            </div>
          )}
          {errors.map((e) => <p key={String(e)} className="text-xs text-destructive">{e}</p>)}
        </>
      )}
      {source && (
        <ConfigDialog shell="wide" open={open} onOpenChange={setOpen} title="Ánh xạ trường item" submitLabel="Xong" onSubmit={() => undefined}
          description="Mỗi trường item ở bảng này nhận giá trị từ một trường item cùng kiểu của bảng kích hoạt.">
          <MappingRows
            targetLabel="Trường item bảng hiện tại" sourceLabel="Trường item bảng kích hoạt"
            targets={items.fields.map((f) => ({ name: f.name, label: f.label, type: f.type }))}
            sources={source.config.items.fields.map((f) => ({ name: f.name, label: f.label, type: f.type }))}
            value={ai.itemMappings} onChange={(itemMappings) => setAi({ itemMappings })}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Ánh xạ trường tổng hợp danh sách chi tiết</p>
            <p className="text-xs text-muted-foreground">Chép nguyên giá trị tổng thực tế từ bản ghi kích hoạt; trường không ánh xạ vẫn được tính lại từ item.</p>
            <MappingRows
              targetLabel="Trường tổng hợp bảng hiện tại" sourceLabel="Trường tổng hợp bảng kích hoạt"
              targets={items.sums.filter((x) => x.sumField).map((x) => ({ name: x.sumField, label: x.label || parentLabel(x.sumField) }))}
              sources={source.config.items.sums.filter((x) => x.sumField).map((x) => ({ name: x.sumField, label: x.label }))}
              value={ai.sumMappings} onChange={(sumMappings) => setAi({ sumMappings })}
            />
          </div>
        </ConfigDialog>
      )}
    </SubCard>
  )
}

// ── Danh sách chi tiết (line items) — rendered inside the Fields tab ───────

export function ItemsSection(p: TabProps) {
  const items = p.draft.config.items
  const setItems = (patch: Partial<typeof items>) => patchConfig(p, { items: { ...items, ...patch } })
  const [editor, setEditor] = useState<{ open: boolean; field?: TableField }>({ open: false })
  const numericParent = p.draft.config.fields.filter((f) => f.type === "NUMERIC" || f.type === "INTEGER")

  return (
    <div className="mt-8 border-t pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Checkbox id="item-fields-enabled" checked={items.enabled} onCheckedChange={(v) => setItems({ enabled: v === true })} />
        <label htmlFor="item-fields-enabled" className="cursor-pointer text-sm leading-none font-medium">Sử dụng danh sách chi tiết</label>
      </div>
      {items.enabled && (
        <div className="space-y-4">
          <FormRow label="Tên danh sách chi tiết"><Input className="h-8" value={items.label} placeholder="VD: Mặt hàng" onChange={(e) => setItems({ label: e.target.value })} /></FormRow>
          <SubCard tag="Trường chi tiết" hint="Các cột của mỗi dòng">
            <div className="divide-y rounded-lg border empty:hidden">
              {items.fields.map((f, i) => (
                <div key={f.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <FieldTypeIcon type={f.type} className="size-4 text-muted-foreground" />
                  <span className="flex-1"><b className="font-medium">{f.label}</b> <span className="font-mono text-xs text-muted-foreground">{f.name}</span></span>
                  <Button size="icon-xs" variant="ghost" disabled={i === 0} aria-label="Lên" onClick={() => { const n = [...items.fields]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setItems({ fields: n }) }}><HugeiconsIcon icon={ArrowUp02Icon} /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label={`Sửa ${f.label}`} onClick={() => setEditor({ open: true, field: f })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label={`Xoá ${f.label}`} onClick={() => setItems({ fields: items.fields.filter((x) => x.name !== f.name) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditor({ open: true })}><HugeiconsIcon icon={Add01Icon} />Thêm trường chi tiết</Button>
          </SubCard>
          <SubCard tag="Dòng tổng" hint="Tính từ các dòng con, lưu vào một trường số của bản ghi">
            {items.sums.map((s, i) => {
              const err = checkFormula(s.formula)
              const unknown = formulaFields(s.formula).filter((n) => !items.fields.some((f) => f.name === n))
              const set = (patch: Partial<typeof s>) => setItems({ sums: items.sums.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
              return (
                <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input value={s.label} placeholder="Nhãn" onChange={(e) => set({ label: e.target.value })} />
                  <FieldSelect fields={numericParent} value={s.sumField} onChange={(sumField) => set({ sumField })} placeholder="Ghi vào trường…" />
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá dòng tổng" onClick={() => setItems({ sums: items.sums.filter((_, j) => j !== i) })}><HugeiconsIcon icon={Cancel01Icon} /></Button>
                  <div className="sm:col-span-3">
                    <Input value={s.formula} className="font-mono text-xs" placeholder="SUM(qty * price)" onChange={(e) => set({ formula: e.target.value })} aria-invalid={!!err || undefined} />
                    <p className={cn("mt-1 text-xs", err || unknown.length ? "text-destructive" : "text-muted-foreground")}>
                      {err ?? (unknown.length ? `Không có trường: ${unknown.join(", ")}` : `Dùng: ${formulaFields(s.formula).join(", ") || "—"}`)}
                    </p>
                  </div>
                </div>
              )
            })}
            <Button size="sm" variant="outline" onClick={() => setItems({ sums: [...items.sums, { sumField: "", label: "Tổng", formula: "SUM()" }] })}><HugeiconsIcon icon={Add01Icon} />Thêm dòng tổng</Button>
            <p className="text-xs text-muted-foreground">Công thức hỗ trợ SUM, AVG, MIN, MAX, COUNT và phép + − × ÷ giữa các trường chi tiết.</p>
          </SubCard>
          <ItemAutoInitPanel {...p} />
        </div>
      )}
      <FieldEditorDialog
        open={editor.open}
        field={editor.field}
        table={{ ...p.table, config: { ...p.draft.config, fields: items.fields } }}
        onOpenChange={(open) => setEditor((s) => ({ ...s, open }))}
        onSave={(f) => setItems({ fields: items.fields.some((x) => x.name === f.name) ? items.fields.map((x) => (x.name === f.name ? f : x)) : [...items.fields, f] })}
      />
    </div>
  )
}

// ── Hành động ────────────────────────────────────────────────────────────────

const ACTION_ICON: Record<string, IconSvgElement> = { create: Add01Icon, access: ViewIcon, update: PencilIcon, delete: Delete02Icon }
/** Icon library for custom actions (stored by key on the action). */
const CUSTOM_ICONS: { key: string; label: string; icon: IconSvgElement }[] = [
  { key: "play", label: "Play", icon: PlayIcon },
  { key: "workflow", label: "Workflow", icon: WorkflowSquare01Icon },
  { key: "package", label: "Package", icon: PackageIcon },
  { key: "send", label: "Send", icon: SentIcon },
  { key: "user-cog", label: "User Cog", icon: UserSettings01Icon },
  { key: "database", label: "Database", icon: Database01Icon },
]
const customIcon = (key: string) => CUSTOM_ICONS.find((i) => i.key === key) ?? CUSTOM_ICONS[0]!

function ActionIconPicker({ value, onChange, id, ...aria }: { value: string; onChange: (v: string) => void; id?: string; "aria-describedby"?: string }) {
  const [open, setOpen] = useState(false)
  const cur = customIcon(value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" role="combobox" aria-expanded={open} variant="outline" className="h-9 w-full justify-between gap-1.5 rounded-md border-input bg-background px-3 py-1.5 text-sm font-normal has-[>svg]:px-2.5" {...aria}>
          <span className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={cur.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{cur.label}</span>
          </span>
          <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
        {CUSTOM_ICONS.map((i) => (
          <button key={i.key} type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:bg-accent" onClick={() => { onChange(i.key); setOpen(false) }}>
            <HugeiconsIcon icon={i.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left">{i.label}</span>
            {i.key === cur.key && <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ActionDialog({ open, onOpenChange, value, table, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: TableAction; table: TabProps["table"]; onSave: (a: TableAction) => void }) {
  const [a, setA] = useState<TableAction>({ actionId: "", name: "", type: "custom", icon: "play", inputFields: [] })
  const [error, setError] = useState("")
  const [fieldEditor, setFieldEditor] = useState<{ open: boolean; field?: TableField; type?: FieldType }>({ open: false })
  useEffect(() => {
    if (!open) return
    setA(value ?? { actionId: crypto.randomUUID?.() ?? uid(), name: "", type: "custom", icon: "play", inputFields: [] })
    setError("")
  }, [open, value])
  const save = () => {
    if (!a.name.trim()) {
      setError("Tên hành động là bắt buộc")
      return false
    }
    onSave({ ...a, name: a.name.trim() })
  }
  return (
    <ConfigDialog shell="padded" open={open} onOpenChange={onOpenChange} title={value ? "Chỉnh sửa hành động tùy chỉnh" : "Thêm hành động tùy chỉnh"}
      description="Tạo hành động tùy chỉnh cho luồng công việc. ID hành động sẽ được dùng để kích hoạt logic nghiệp vụ trên backend." submitLabel={value ? "Cập nhật hành động" : "Thêm hành động"} onSubmit={save}>
      <SettingsField label="Tên hành động" required error={error}>
        <Input value={a.name} autoFocus placeholder="Ví dụ: Gửi thông báo Email" onChange={(e) => setA({ ...a, name: e.target.value })} />
      </SettingsField>
      <SettingsField label="Biểu tượng" hint="Chọn một biểu tượng trong thư viện">
        <ActionIconPicker value={a.icon} onChange={(icon) => setA({ ...a, icon })} />
      </SettingsField>
      <div role="none" className="h-px w-full shrink-0 bg-border/80" />
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-100)]">
        <div className="flex flex-nowrap items-center justify-between gap-[var(--space-100)]">
          <div className="flex flex-col items-stretch justify-start gap-[var(--space-025)]">
            <h3 className="text-base font-semibold">Thiết lập trường</h3>
            <p className="text-xs text-muted-foreground">Khi action chạy, người dùng sẽ điền form theo các trường này.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={cn(BTN7, "border-input shadow-xs")}>
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                <span>Thêm trường</span>
                <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60] max-h-80 w-60 overflow-y-auto">
              {FIELD_GROUPS.map((g, gi) => (
                <DropdownMenuGroup key={g}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{g}</DropdownMenuLabel>
                  {FIELD_TYPES.filter((t) => t.group === g).map((t) => (
                    <DropdownMenuItem key={t.type} onSelect={() => setFieldEditor({ open: true, type: t.type })}>
                      <FieldTypeIcon type={t.type} className="size-4 text-muted-foreground" />
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {a.inputFields.map((f) => (
          <div key={f.name} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <FieldTypeIcon type={f.type} className="size-4 text-muted-foreground" />
            <span className="flex-1">{f.label} <span className="font-mono text-xs text-muted-foreground">{f.name}</span></span>
            <Button type="button" size="icon-xs" variant="ghost" aria-label={`Sửa ${f.label}`} onClick={() => setFieldEditor({ open: true, field: f })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
            <Button type="button" size="icon-xs" variant="ghost" aria-label={`Xoá ${f.label}`} onClick={() => setA({ ...a, inputFields: a.inputFields.filter((x) => x.name !== f.name) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
          </div>
        ))}
        {!a.inputFields.length && (
          <div className="rounded-lg border border-dashed border-border p-[var(--space-300)] text-center">
            <p className="text-sm text-muted-foreground">Chưa có trường nào. Bấm "Thêm trường" để cấu hình form input cho action này.</p>
          </div>
        )}
      </div>
      <FieldEditorDialog
        open={fieldEditor.open}
        field={fieldEditor.field}
        initialType={fieldEditor.type}
        table={{ ...table, config: { ...table.config, fields: a.inputFields } }}
        onOpenChange={(o) => setFieldEditor((s) => ({ ...s, open: o }))}
        onSave={(f) => setA((s) => ({ ...s, inputFields: s.inputFields.some((x) => x.name === f.name) ? s.inputFields.map((x) => (x.name === f.name ? f : x)) : [...s.inputFields, f] }))}
      />
    </ConfigDialog>
  )
}

export function ActionsTab(p: TabProps) {
  const actions = p.draft.config.actions
  const system = actions.filter((a) => a.type !== "custom")
  const custom = actions.filter((a) => a.type === "custom")
  const [dialog, setDialog] = useState<{ open: boolean; value?: TableAction }>({ open: false })
  const [copied, setCopied] = useState("")
  const copy = (id: string) => navigator.clipboard?.writeText(id).then(() => setCopied(id))

  const row = (a: TableAction, extra?: ReactNode) => {
    const Icon = a.type === "custom" ? customIcon(a.icon).icon : ACTION_ICON[a.icon.replace("comment_", "")] ?? PlayIcon
    return (
      <div key={a.actionId} className="rounded-md bg-background p-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40"><HugeiconsIcon icon={Icon} className="size-4 text-muted-foreground" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="truncate font-medium">{a.name}</span>
              <Tag className="bg-muted text-muted-foreground">{a.type === "custom" ? "Tùy chỉnh" : "Hệ thống"}</Tag>
            </div>
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate font-mono">{a.type === "custom" ? a.actionId : a.type}</span>
              <span>•</span>
              <span className="shrink-0">Biểu tượng: {a.icon}</span>
              {a.inputFields.length > 0 && <><span>•</span><span className="shrink-0">{a.inputFields.length} trường nhập</span></>}
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" className="hover:bg-accent/50" aria-label="Sao chép mã hành động" onClick={() => copy(a.actionId)}>{copied === a.actionId ? <HugeiconsIcon icon={Tick02Icon} className="text-emerald-600" /> : <HugeiconsIcon icon={Copy01Icon} />}</Button>
          {extra}
        </div>
      </div>
    )
  }

  return (
    <SettingsCard title="Cấu hình hành động" description="Quản lý hành động hệ thống mặc định và tạo hành động tùy chỉnh cho luồng công việc cụ thể" bodyClassName="flex flex-col gap-6"
      action={<AddButton label="Thêm hành động tùy chỉnh" onClick={() => setDialog({ open: true })} />}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold">Hành động hệ thống (Chỉ đọc)</h3>
        <div className="rounded-lg border border-border bg-muted/30 p-2">
          <div className="flex flex-col gap-1">{system.map((a) => row(a))}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold">Hành động tùy chỉnh</h3>
        {custom.length ? (
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <div className="flex flex-col gap-1">
              {custom.map((a) =>
                row(a, (
                  <>
                    <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${a.name}`} onClick={() => setDialog({ open: true, value: a })}><HugeiconsIcon icon={PencilEdit01Icon} /></Button>
                    <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Xoá ${a.name}`} onClick={() => patchConfig(p, { actions: actions.filter((x) => x.actionId !== a.actionId) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                  </>
                )),
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">Chưa cấu hình hành động tùy chỉnh nào. Nhấn "Thêm hành động tùy chỉnh" để tạo hành động đầu tiên.</p>
          </div>
        )}
      </div>
      <Stats className="gap-x-2" items={[`Hành động hệ thống: ${system.length}`, `Hành động tùy chỉnh: ${custom.length}`, `Tổng: ${actions.length}`]} />
      <ActionDialog
        open={dialog.open}
        value={dialog.value}
        table={{ ...p.table, config: p.draft.config }}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
        onSave={(a) => patchConfig(p, { actions: actions.some((x) => x.actionId === a.actionId) ? actions.map((x) => (x.actionId === a.actionId ? a : x)) : [...actions, a] })}
      />
    </SettingsCard>
  )
}

// ── Phân quyền ───────────────────────────────────────────────────────────────

const NOT_ALLOWED = { value: "not_allowed", label: "Không cho phép" }
const RECORD_SCOPES = [
  NOT_ALLOWED,
  { value: "all", label: "Tất cả bản ghi" },
  { value: "self_created", label: "Do chính mình tạo" },
  { value: "self_assigned", label: "Được giao cho mình" },
  { value: "self_related", label: "Có liên quan đến mình" },
  { value: "self_created_or_assigned", label: "Mình tạo hoặc được giao" },
  { value: "team_member_created", label: "Do thành viên nhóm tạo" },
  { value: "team_member_assigned", label: "Giao cho thành viên nhóm" },
  { value: "team_member_created_or_assigned", label: "Nhóm tạo hoặc giao cho nhóm" },
]
const CREATE_SCOPES = [NOT_ALLOWED, { value: "all", label: "Cho phép" }]
const COMMENT_SCOPES = [
  NOT_ALLOWED,
  { value: "all", label: "Tất cả bình luận" },
  { value: "comment_self_created", label: "Bình luận của mình" },
  { value: "comment_team_member_created", label: "Bình luận của nhóm" },
]
const scopesFor = (a: TableAction) =>
  a.type === "create" || a.type === "comment_create" || a.type === "custom" ? CREATE_SCOPES : a.type.startsWith("comment_") ? COMMENT_SCOPES : RECORD_SCOPES

export function PermissionsTab(p: TabProps) {
  const { data: teams = [] } = useWorkspaceTeams()
  const [teamId, setTeamId] = useState("")
  const team = teams.find((t) => t.id === teamId) ?? teams[0]
  const perms = p.draft.config.permissions
  const actions = p.draft.config.actions
  const get = (roleId: string, actionId: string) => perms.find((x) => x.teamId === team?.id && x.roleId === roleId)?.actions[actionId] ?? "not_allowed"
  const set = (roleId: string, actionId: string, scope: string) => {
    if (!team) return
    const cur = perms.find((x) => x.teamId === team.id && x.roleId === roleId)
    const next = { teamId: team.id, roleId, actions: { ...(cur?.actions ?? {}), [actionId]: scope } }
    patchConfig(p, { permissions: cur ? perms.map((x) => (x === cur ? next : x)) : [...perms, next] })
  }

  return (
    <SettingsCard title="Cấu hình phân quyền" description="Quản lý phân quyền theo nhóm và vai trò cho các hành động" bodyClassName="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="permission-team" className="text-sm leading-none font-medium">Chọn nhóm</label>
        <NativeSelect id="permission-team" value={team?.id ?? ""} onChange={(e) => setTeamId(e.target.value)}>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-info/20 bg-info-subtle p-4">
          <div className="flex items-start gap-1">
            <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0 text-info" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-info">Ma trận phân quyền</p>
              <p className="text-xs text-info">Cấu hình phân quyền cho từng vai trò và hành động. Các hành động khác nhau có tùy chọn phân quyền khác nhau dựa trên loại.</p>
            </div>
          </div>
        </div>
        <div className="h-[600px] overflow-y-auto rounded-md border">
          <div className="p-4">
            {team?.roles.map((r) => (
              <div key={r.id} className="mb-6 rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center gap-1">
                  <span className="inline-flex h-[22px] items-center rounded-md border border-transparent bg-secondary px-1.5 text-xs font-medium whitespace-nowrap text-secondary-foreground">{r.name}</span>
                  <span className="text-sm text-muted-foreground">Phân quyền vai trò</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {actions.map((a) => (
                    <div key={a.actionId} className="flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-stretch">
                      <div className="flex flex-1 flex-col gap-0.5">
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.type}</p>
                      </div>
                      <div className="w-[300px] max-sm:w-full">
                        <NativeSelect value={get(r.id, a.actionId)} onChange={(e) => set(r.id, a.actionId, e.target.value)} aria-label={`${r.name} – ${a.name}`}>
                          {scopesFor(a).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </NativeSelect>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

// ── Gantt ────────────────────────────────────────────────────────────────────

const isDate = (f: TableField) => f.type === "DATE" || f.type === "DATETIME"
/** Gantt dependency: a record-reference field (predecessor task(s)). */
const isDependency = (f: TableField) => f.type === "SELECT_ONE_RECORD" || f.type === "SELECT_LIST_RECORD"

function GanttDialog({ open, onOpenChange, value, fields, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: GanttConfig; fields: TableField[]; onSave: (g: GanttConfig) => void }) {
  const dates = fields.filter(isDate)
  const blank = (): GanttConfig => ({
    id: uid(), name: "", description: "", taskNameField: fields[0]?.name ?? "", startDateField: dates[0]?.name ?? "", endDateField: (dates[1] ?? dates[0])?.name ?? "",
    progressField: null, dependencyField: null, statusField: "", statusCompleteValue: "",
  })
  const [g, setG] = useState<GanttConfig>(blank)
  const { errors, check, reset } = useRules<"name" | "task" | "start" | "end" | "status" | "complete">()
  useEffect(() => { if (open) { setG(value ?? blank()); reset() } }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const status = fields.find((f) => f.name === g.statusField)
  const save = () => {
    const ok = check([
      ["name", g.name.trim(), "Tên màn hình là bắt buộc"],
      ["task", g.taskNameField, "Trường tên công việc là bắt buộc"],
      ["start", g.startDateField, "Trường ngày bắt đầu là bắt buộc"],
      ["end", g.endDateField, "Trường ngày kết thúc là bắt buộc"],
      ["status", g.statusField, "Trường trạng thái là bắt buộc"],
      ["complete", g.statusCompleteValue, "Giá trị trạng thái hoàn thành là bắt buộc"],
    ])
    if (!ok) return false
    onSave({ ...g, name: g.name.trim() })
  }
  return (
    <ConfigDialog open={open} onOpenChange={onOpenChange} title={value ? "Chỉnh sửa biểu đồ Gantt" : "Thêm biểu đồ Gantt"}
      description="Cấu hình biểu đồ Gantt để lập kế hoạch dự án và trực quan hóa thời gian. Công việc sẽ hiển thị dưới dạng thanh ngang trên trục thời gian."
      submitLabel={value ? "Cập nhật biểu đồ" : "Thêm biểu đồ"} onSubmit={save}>
      <SettingsField label="Tên màn hình" required error={errors.name}>
        <Input value={g.name} autoFocus placeholder="Ví dụ: Thời gian dự án, Lịch Sprint" onChange={(e) => setG({ ...g, name: e.target.value })} />
      </SettingsField>
      <SettingsField label="Mô tả">
        <Textarea value={g.description} placeholder="Mô tả ngắn gọn biểu đồ Gantt này..." onChange={(e) => setG({ ...g, description: e.target.value })} />
      </SettingsField>
      <SettingsField label="Trường tên công việc" required error={errors.task} hint="Trường dùng làm tên/nhãn công việc trong biểu đồ Gantt">
        <FieldSelect suffix="none" placeholder="Chọn trường tên công việc..." fields={fields} value={g.taskNameField} onChange={(v) => setG({ ...g, taskNameField: v })} />
      </SettingsField>
      <SettingsField label="Trường ngày bắt đầu" required error={errors.start} hint="Khi công việc bắt đầu (yêu cầu trường DATE hoặc DATETIME)">
        <FieldSelect suffix="raw" placeholder="Chọn trường ngày bắt đầu..." fields={fields} filter={isDate} value={g.startDateField} onChange={(v) => setG({ ...g, startDateField: v })} />
      </SettingsField>
      <SettingsField label="Trường ngày kết thúc" required error={errors.end} hint="Khi công việc kết thúc (yêu cầu trường DATE hoặc DATETIME)">
        <FieldSelect suffix="raw" placeholder="Chọn trường ngày kết thúc..." fields={fields} filter={isDate} value={g.endDateField} onChange={(v) => setG({ ...g, endDateField: v })} />
      </SettingsField>
      <SettingsField label="Trường tiến độ (Tùy chọn)" hint="Trường số (0-100) để hiển thị phần trăm hoàn thành công việc">
        <FieldSelect suffix="raw" placeholder="Chọn trường tiến độ (tùy chọn)..." fields={fields} filter={(f) => isNumber(f.type)} value={g.progressField} onChange={(v) => setG({ ...g, progressField: v || null })} />
      </SettingsField>
      <SettingsField label="Trường phụ thuộc (Tùy chọn)" hint="Trường SELECT_LIST_RECORD liên kết đến các công việc khác mà công việc này phụ thuộc">
        <FieldSelect suffix="raw" placeholder="Chọn trường phụ thuộc (tùy chọn)..." fields={fields} filter={isDependency} value={g.dependencyField} onChange={(v) => setG({ ...g, dependencyField: v || null })} />
      </SettingsField>
      <SettingsField label="Trường trạng thái" required error={errors.status} hint="Trường SELECT_ONE để xác định trạng thái công việc trong biểu đồ Gantt">
        <FieldSelect suffix="raw" placeholder="Chọn trường trạng thái..." fields={fields} filter={(f) => f.type === "SELECT_ONE"} value={g.statusField} onChange={(v) => setG({ ...g, statusField: v, statusCompleteValue: "" })} />
      </SettingsField>
      {status && (
        <SettingsField label="Giá trị trạng thái hoàn thành" required error={errors.complete} hint="Giá trị được xem là hoàn thành để đánh dấu công việc đã xong trong biểu đồ Gantt">
          <NativeSelect value={g.statusCompleteValue} onChange={(e) => setG({ ...g, statusCompleteValue: e.target.value })}>
            <option value="">Chọn giá trị trạng thái hoàn thành...</option>
            {status.options?.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
          </NativeSelect>
        </SettingsField>
      )}
    </ConfigDialog>
  )
}

export function GanttTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<GanttConfig>()
  const label = (n: string | null) => (n ? c.fields.find((f) => f.name === n)?.label ?? n : "—")
  const statusOpt = (g: GanttConfig) => c.fields.find((f) => f.name === g.statusField)?.options?.find((o) => o.value === g.statusCompleteValue)?.text ?? "—"
  return (
    <SettingsCard title="Cấu hình biểu đồ Gantt" description="Thiết lập biểu đồ Gantt để lập kế hoạch dự án và trực quan hóa thời gian" bodyClassName="flex flex-col gap-2"
      action={<AddButton label="Thêm biểu đồ Gantt" onClick={ed.openNew} />}>
      {c.ganttCharts.length ? (
        <ConfigList>
          {c.ganttCharts.map((g, i) => (
            <ConfigRow key={g.id} title={g.name} badge={`Biểu đồ ${i + 1}`} onEdit={() => ed.openEdit(g)} onDelete={() => patchConfig(p, { ganttCharts: c.ganttCharts.filter((x) => x.id !== g.id) })}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Pair k="Tên công việc" v={label(g.taskNameField)} />
                <Pair k="Trạng thái" v={`${label(g.statusField)} · ${statusOpt(g)}`} />
                <Pair k="Ngày bắt đầu" v={label(g.startDateField)} />
                <Pair k="Ngày kết thúc" v={label(g.endDateField)} />
                <Pair k="Tiến độ" v={label(g.progressField)} />
                <Pair k="Phụ thuộc" v={label(g.dependencyField)} />
              </div>
            </ConfigRow>
          ))}
        </ConfigList>
      ) : (
        <EmptyBox pad="p-12" title={'Chưa cấu hình biểu đồ Gantt nào. Nhấn "Thêm biểu đồ Gantt" để tạo khung nhìn thời gian đầu tiên.'} />
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-3 md:flex md:flex-wrap">
        <span>Tổng biểu đồ: {c.ganttCharts.length}</span>
        <span>Trường ngày: {c.fields.filter(isDate).length}</span>
        <span>Trường tiến độ: {c.fields.filter((f) => isNumber(f.type)).length}</span>
        <span>Trường phụ thuộc: {c.fields.filter(isDependency).length}</span>
        <span>Trường trạng thái: {c.fields.filter((f) => f.type === "SELECT_ONE").length}</span>
      </div>
      <div className="rounded-lg border border-info/20 bg-info-subtle p-4">
        <p className="text-sm font-medium text-info">Tính năng biểu đồ Gantt</p>
        <ul className="mt-2 flex list-disc flex-col gap-0.5 text-xs text-info">
          {["Trực quan hóa thời gian dự án và lịch công việc", "Theo dõi tiến độ công việc với thanh tiến trình", "Quản lý phụ thuộc công việc với đường liên kết", "Lý tưởng cho lập kế hoạch dự án và phân bổ tài nguyên"].map((t) => <li key={t}>• {t}</li>)}
        </ul>
      </div>
      <GanttDialog open={ed.open} value={ed.value} fields={c.fields} onOpenChange={ed.setOpen} onSave={(g) => patchConfig(p, { ganttCharts: upsert(c.ganttCharts, g) })} />
    </SettingsCard>
  )
}

// ── Pivot / Matrix ───────────────────────────────────────────────────────────

const GROUP_BY: { v: PivotGroupBy; l: string }[] = [{ v: "day", l: "Ngày" }, { v: "week", l: "Tuần" }, { v: "month", l: "Tháng" }, { v: "quarter", l: "Quý" }, { v: "year", l: "Năm" }]

const PIVOT_ROW_TYPES = ["SELECT_ONE", "SELECT_ONE_WORKSPACE_USER", "SELECT_ONE_RECORD", "CHECKBOX_YES_NO", "SHORT_TEXT"]

function PivotDialog({ open, onOpenChange, value, fields, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: PivotConfig; fields: TableField[]; onSave: (v: PivotConfig) => void }) {
  const blank = (): PivotConfig => ({ id: uid(), name: "", description: "", rowField: "", columnField: "", groupBy: "month", measures: [{ label: "", formula: "COUNT(*)", unit: null, decimalPlaces: null }], rowTotals: false, columnTotals: false, grandTotal: true })
  const [v, setV] = useState<PivotConfig>(blank)
  const [drag, setDrag] = useState<number | null>(null)
  const { errors, check, reset } = useRules<string>()
  useEffect(() => { if (open) { setV(value ?? blank()); reset() } }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const setM = (i: number, patch: Partial<PivotConfig["measures"][number]>) => setV({ ...v, measures: v.measures.map((m, j) => (j === i ? { ...m, ...patch } : m)) })
  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= v.measures.length) return
    const n = [...v.measures]
    const [m] = n.splice(from, 1)
    n.splice(to, 0, m!)
    setV({ ...v, measures: n })
  }
  const save = () => {
    const ok = check([
      ["name", v.name.trim(), "Tên Pivot là bắt buộc"],
      ["rowField", v.rowField, "Trường dòng là bắt buộc"],
      ["measures", v.measures.length, "Cần ít nhất một measure"],
      ...v.measures.map((m, i): [string, unknown, string] => [`formula${i}`, !checkFormula(m.formula), checkFormula(m.formula) ?? ""]),
    ])
    if (!ok) return false
    onSave({ ...v, name: v.name.trim() })
  }
  const box = "rounded-lg border border-border p-4"
  const field = "space-y-1.5"
  return (
    <ConfigDialog shell="pivot" open={open} onOpenChange={onOpenChange} title={value ? "Sửa Pivot" : "Thêm Pivot"} description="Cấu hình bảng chéo với các chỉ số được nhóm." submitLabel="Lưu Pivot" onSubmit={save}>
      <div className={cn("grid gap-3 sm:grid-cols-2", box)}>
        <SettingsField className={field} label="Tên Pivot" error={errors.name}><Input value={v.name} autoFocus onChange={(e) => setV({ ...v, name: e.target.value })} /></SettingsField>
        <SettingsField className={field} label="Mô tả"><Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></SettingsField>
      </div>
      <div className={cn("space-y-4", box)}>
        <SettingsField className={field} label="Trường dòng" error={errors.rowField}>
          <FieldSelect suffix="none" fields={fields} filter={(f) => PIVOT_ROW_TYPES.includes(f.type)} value={v.rowField} onChange={(rowField) => setV({ ...v, rowField })} placeholder="—" />
        </SettingsField>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsField className={field} label="Trường cột thời gian">
            <FieldSelect suffix="none" fields={fields} filter={isDate} value={v.columnField} onChange={(columnField) => setV({ ...v, columnField })} placeholder="—" />
          </SettingsField>
          {v.columnField && (
            <SettingsField className={field} label="Nhóm theo">
              <NativeSelect value={v.groupBy} onChange={(e) => setV({ ...v, groupBy: e.target.value as PivotGroupBy })}>{GROUP_BY.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}</NativeSelect>
            </SettingsField>
          )}
        </div>
      </div>
      <div className={cn("space-y-2", box)}>
        <div className="flex flex-nowrap items-center justify-between gap-0">
          <span className="text-sm leading-none font-medium">Measures</span>
          <Button type="button" variant="outline" size="sm" className={cn(BTN7, "border-input shadow-xs")} onClick={() => setV({ ...v, measures: [...v.measures, { label: "", formula: "", unit: null, decimalPlaces: null }] })}>
            <HugeiconsIcon icon={Add01Icon} className="mr-1 h-4 w-4" />Thêm
          </Button>
        </div>
        {errors.measures && <p className="text-xs text-destructive">{errors.measures}</p>}
        <div className="flex flex-col items-stretch justify-start gap-[var(--space-075)]">
          {v.measures.map((m, i) => (
            <div
              key={i}
              className={cn("rounded-md border border-border p-3", drag === i && "opacity-50")}
              onDragOver={(e) => drag !== null && e.preventDefault()}
              onDrop={() => { if (drag !== null) moveTo(drag, i); setDrag(null) }}
            >
              <div className="flex flex-nowrap items-start justify-start gap-2">
                <span draggable aria-label="Kéo để sắp xếp" className="cursor-grab" onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)}>
                  <HugeiconsIcon icon={DragDropVerticalIcon} className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-stretch justify-start gap-[var(--space-075)]">
                  <div className="flex flex-nowrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">Measures {i + 1}</span>
                    <div className="flex flex-nowrap items-center justify-start gap-1">
                      <Button type="button" size="icon-sm" variant="ghost" className="hover:bg-accent/50" disabled={i === 0} aria-label="Đưa measure lên" onClick={() => moveTo(i, i - 1)}>↑</Button>
                      <Button type="button" size="icon-sm" variant="ghost" className="hover:bg-accent/50" disabled={i === v.measures.length - 1} aria-label="Đưa measure xuống" onClick={() => moveTo(i, i + 1)}>↓</Button>
                      <Button type="button" size="icon-sm" variant="ghost" className="hover:bg-accent/50" aria-label="Xóa measure" onClick={() => setV({ ...v, measures: v.measures.filter((_, j) => j !== i) })}><HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <SettingsField className={field} label="Nhãn"><Input value={m.label} onChange={(e) => setM(i, { label: e.target.value })} /></SettingsField>
                  <SettingsField className={field} label="Công thức" error={errors[`formula${i}`]}>
                    <Textarea value={m.formula} onChange={(e) => setM(i, { formula: e.target.value })} />
                  </SettingsField>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SettingsField className={field} label="Đơn vị"><Input value={m.unit ?? ""} onChange={(e) => setM(i, { unit: e.target.value || null })} /></SettingsField>
                    <SettingsField className={field} label="Số chữ số thập phân">
                      <Input type="number" min={0} max={6} value={m.decimalPlaces ?? ""} onChange={(e) => setM(i, { decimalPlaces: e.target.value === "" ? null : Number(e.target.value) })} />
                    </SettingsField>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn("grid gap-2 sm:grid-cols-3", box)}>
        {([["rowTotals", "Hiển thị tổng dòng"], ["columnTotals", "Hiển thị tổng cột"], ["grandTotal", "Hiển thị tổng toàn bảng"]] as const).map(([k, l]) => (
          <label key={k} className="inline-flex items-center gap-2 text-sm">
            <Checkbox checked={v[k]} onCheckedChange={(c) => setV({ ...v, [k]: c === true })} />
            {l}
          </label>
        ))}
      </div>
    </ConfigDialog>
  )
}

export function PivotTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<PivotConfig>()
  const label = (n: string) => (n ? c.fields.find((f) => f.name === n)?.label ?? n : "Ngày tạo")
  return (
    <SettingsCard title="Pivot / Matrix" description="Cấu hình bảng chéo với các chỉ số được nhóm." bodyClassName="flex flex-col gap-2" action={<AddButton variant="mr1" label="Thêm Pivot" onClick={ed.openNew} />}>
      {c.pivotConfigs.length ? (
        <ConfigList>
          {c.pivotConfigs.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Pivot ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { pivotConfigs: c.pivotConfigs.filter((x) => x.id !== v.id) })}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Pair k="Dòng" v={label(v.rowField)} />
                <Pair k="Cột" v={`${label(v.columnField)} · theo ${GROUP_BY.find((g) => g.v === v.groupBy)?.l.toLowerCase()}`} />
              </div>
              <div className="flex flex-wrap gap-1">{v.measures.map((m) => <Tag key={m.label + m.formula} className="font-mono">{m.label}: {m.formula}</Tag>)}</div>
            </ConfigRow>
          ))}
        </ConfigList>
      ) : (
        <EmptyBox title="Chưa có màn hình Pivot nào." />
      )}
      <PivotDialog open={ed.open} value={ed.value} fields={c.fields} onOpenChange={ed.setOpen} onSave={(v) => patchConfig(p, { pivotConfigs: upsert(c.pivotConfigs, v) })} />
    </SettingsCard>
  )
}

// ── Objective Card ───────────────────────────────────────────────────────────

/** Related-list filter: equality conditions combined with AND (stored on the list; the view applies them as record filters). */
type ObjectiveCondition = { field: string; value: string }
type ObjectiveListDraft = ObjectiveList & { conditions?: ObjectiveCondition[] }

const OBJECTIVE_FIELDS: [keyof ObjectiveCardConfig["objective"], string, ((f: TableField) => boolean)?][] = [
  ["titleField", "Tiêu đề"], ["descriptionField", "Mô tả"], ["ownerField", "Người phụ trách", (f) => f.type.includes("WORKSPACE_USER")],
  ["startField", "Bắt đầu", isDate], ["endField", "Kết thúc", isDate], ["progressField", "Tiến độ", (f) => isNumber(f.type)], ["statusField", "Status", (f) => f.type === "SELECT_ONE"],
]
type ListMapKey = "titleField" | "startField" | "endField" | "progressField" | "currentField" | "targetField" | "unitField" | "statusField"
const LIST_FIELDS: [ListMapKey, string, ((f: TableField) => boolean)?][] = [
  ["titleField", "Tiêu đề"], ["startField", "Bắt đầu", isDate], ["endField", "Kết thúc", isDate], ["progressField", "Tiến độ", (f) => isNumber(f.type)],
  ["currentField", "Current", (f) => isNumber(f.type)], ["targetField", "Target", (f) => isNumber(f.type)],
  ["unitField", "Đơn vị đo", (f) => ["SHORT_TEXT", "SELECT_ONE", "SELECT_ONE_RECORD"].includes(f.type)], ["statusField", "Status", (f) => f.type === "SELECT_ONE"],
]

function ObjectiveDialog({ open, onOpenChange, value, table, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: ObjectiveCardConfig; table: TabProps["table"]; onSave: (v: ObjectiveCardConfig) => void }) {
  const { data: tables = [] } = useTables()
  const blankList = (): ObjectiveListDraft => ({ id: uid(), name: "", tableId: "", relationField: "", titleField: "", startField: "", endField: "", progressField: "", currentField: "", targetField: "", unitField: "", statusField: "", limit: 30, conditions: [] })
  const blank = (): ObjectiveCardConfig => ({ id: uid(), name: "", description: "", objective: { titleField: "", descriptionField: "", ownerField: "", startField: "", endField: "", progressField: "", statusField: "" }, lists: [blankList()] })
  const [v, setV] = useState<ObjectiveCardConfig>(blank)
  const { errors, check, reset } = useRules<string>()
  useEffect(() => { if (open) { setV(value ?? blank()); reset() } }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const fields = table.config.fields
  const lists = v.lists as ObjectiveListDraft[]
  const setO = (k: keyof ObjectiveCardConfig["objective"], val: string) => setV({ ...v, objective: { ...v.objective, [k]: val } })
  const setL = (i: number, patch: Partial<ObjectiveListDraft>) => setV({ ...v, lists: lists.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const moveL = (i: number, d: -1 | 1) => { const n = [...lists]; [n[i], n[i + d]] = [n[i + d]!, n[i]!]; setV({ ...v, lists: n }) }
  const save = () => {
    const ok = check([
      ["name", v.name.trim(), "Tên màn hình Objective Card là bắt buộc."],
      ["lists", lists.length, "Objective Card cần ít nhất một mục liên quan."],
      ...lists.flatMap((l): [string, unknown, string][] => [
        [`name.${l.id}`, l.name.trim(), "Tên mục liên quan là bắt buộc."],
        [`table.${l.id}`, l.tableId, "Bảng liên quan là bắt buộc."],
        [`rel.${l.id}`, l.relationField, "Field quan hệ với Objective là bắt buộc."],
        [`cond.${l.id}`, (l.conditions ?? []).every((c) => c.field && c.value.trim()), "Điều kiện chưa hoàn chỉnh."],
        [`limit.${l.id}`, Number.isInteger(l.limit) && l.limit > 0, "Giới hạn phải là số nguyên dương."],
      ]),
    ])
    if (!ok) return false
    onSave({ ...v, name: v.name.trim() })
  }
  const field = "space-y-1.5"
  return (
    <ConfigDialog shell="objective" open={open} onOpenChange={onOpenChange} title={value ? "Sửa Objective Card" : "Thêm Objective Card"}
      description="Cấu hình cách hiển thị mục tiêu và các danh sách liên quan. Các mapping lưu tên field, không lưu nhãn." submitLabel="Lưu Objective Card" onSubmit={save}>
      <div className="space-y-4 rounded-lg border border-border p-4">
        <SettingsField className={field} label="Tên Objective Card" required error={errors.name}>
          <Input value={v.name} autoFocus placeholder="Ví dụ: Mục tiêu quý" onChange={(e) => setV({ ...v, name: e.target.value })} />
        </SettingsField>
        <SettingsField className={field} label="Mô tả">
          <Textarea value={v.description} placeholder="Theo dõi mục tiêu và kết quả then chốt" onChange={(e) => setV({ ...v, description: e.target.value })} />
        </SettingsField>
        <SettingsField className={field} label="Nguồn dữ liệu">
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">Bảng chính (bảng hiện tại)</div>
        </SettingsField>
      </div>
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-sm font-semibold">Thông tin Objective</h3>
          <p className="mt-1 text-xs text-muted-foreground">Chỉ chọn các field có trong schema bảng hiện tại.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {OBJECTIVE_FIELDS.map(([k, l, filter]) => (
            <SettingsField key={k} className={field} label={l}><FieldSelect suffix="none" fields={fields} filter={filter} value={v.objective[k]} onChange={(val) => setO(k, val)} /></SettingsField>
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Các mục liên quan</h3>
            <p className={cn("mt-1 text-xs", errors.lists ? "text-destructive" : "text-muted-foreground")}>Cần ít nhất một mục liên quan để lưu Objective Card.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className={cn(BTN7, "border-input shadow-xs")} onClick={() => setV({ ...v, lists: [...lists, blankList()] })}>Thêm mục liên quan</Button>
        </div>
        <div className="space-y-3">
          {lists.map((l, i) => {
            const t = tables.find((x) => x.id === l.tableId)
            const tf = t?.config.fields ?? []
            const conds = l.conditions ?? []
            const setC = (j: number, patch: Partial<ObjectiveCondition>) => setL(i, { conditions: conds.map((c, k) => (k === j ? { ...c, ...patch } : c)) })
            return (
              <div key={l.id} className="space-y-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Mục liên quan {i + 1}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.name.trim() || "Chưa đặt tên"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" size="icon-sm" variant="ghost" className="hover:bg-accent/50" disabled={i === 0} aria-label="Đưa lên" onClick={() => moveL(i, -1)}><HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4" /></Button>
                      <Button type="button" size="icon-sm" variant="ghost" className="hover:bg-accent/50" disabled={i === lists.length - 1} aria-label="Đưa xuống" onClick={() => moveL(i, 1)}><HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" /></Button>
                      <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:bg-accent/50 hover:text-destructive" aria-label="Xóa mục liên quan" onClick={() => setV({ ...v, lists: lists.filter((x) => x.id !== l.id) })}><HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SettingsField className={field} label="Tên danh sách" required error={errors[`name.${l.id}`]}>
                      <Input value={l.name} placeholder="Ví dụ: Key Results" onChange={(e) => setL(i, { name: e.target.value })} />
                    </SettingsField>
                    <SettingsField className={field} label="Bảng" required error={errors[`table.${l.id}`]}>
                      <NativeSelect value={l.tableId} onChange={(e) => setL(i, { tableId: e.target.value, relationField: "", titleField: "", startField: "", endField: "", progressField: "", currentField: "", targetField: "", unitField: "", statusField: "", conditions: [] })}>
                        <option value="">Chọn bảng liên quan</option>
                        {tables.filter((x) => x.id !== table.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </NativeSelect>
                    </SettingsField>
                    <SettingsField className={field} label="Quan hệ với Objective" required error={errors[`rel.${l.id}`]}>
                      <FieldSelect suffix="none" disabled={!t} fields={tf} filter={(f) => (f.type === "SELECT_ONE_RECORD" || f.type === "SELECT_LIST_RECORD") && f.referenceTableId === table.id} value={l.relationField} onChange={(val) => setL(i, { relationField: val })} />
                    </SettingsField>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {LIST_FIELDS.map(([k, label, filter]) => (
                        <SettingsField key={k} className={field} label={label}>
                          <FieldSelect suffix="none" disabled={!t} fields={tf} filter={filter} value={l[k]} onChange={(val) => setL(i, { [k]: val })} />
                        </SettingsField>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm leading-none font-medium">Điều kiện</span>
                        <Button type="button" variant="outline" size="sm" className={cn(BTN7, "border-input shadow-xs")} disabled={!t} onClick={() => setL(i, { conditions: [...conds, { field: "", value: "" }] })}>
                          <HugeiconsIcon icon={Add01Icon} className="mr-1 h-4 w-4" />Thêm điều kiện
                        </Button>
                      </div>
                      {conds.length ? (
                        conds.map((c, j) => (
                          <div key={j} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <FieldSelect suffix="none" fields={tf} value={c.field} onChange={(val) => setC(j, { field: val })} />
                            <Input value={c.value} placeholder="Nhập giá trị" onChange={(e) => setC(j, { value: e.target.value })} />
                            <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Xóa điều kiện" onClick={() => setL(i, { conditions: conds.filter((_, k) => k !== j) })}><HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" /></Button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Chưa có điều kiện. Các điều kiện trong cùng danh sách kết hợp bằng AND.</p>
                      )}
                      {errors[`cond.${l.id}`] && <p className="text-xs text-destructive">{errors[`cond.${l.id}`]}</p>}
                    </div>
                    <SettingsField className={cn(field, "sm:max-w-[220px]")} label="Hiển thị tối đa" error={errors[`limit.${l.id}`]}>
                      <Input type="number" min={1} value={Number.isNaN(l.limit) ? "" : l.limit} onChange={(e) => setL(i, { limit: e.target.value === "" ? Number.NaN : Number(e.target.value) })} />
                    </SettingsField>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ConfigDialog>
  )
}

export function ObjectiveTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<ObjectiveCardConfig>()
  const { data: tables = [] } = useTables()
  return (
    <SettingsCard title="Objective Card" description="Tạo màn hình mục tiêu với các danh sách liên quan theo schema của Active Table." bodyClassName="flex flex-col gap-2" action={<AddButton variant="mr1" label="Thêm Objective Card" onClick={ed.openNew} />}>
      {c.objectiveCards.length ? (
        <ConfigList>
          {c.objectiveCards.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Thẻ ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { objectiveCards: c.objectiveCards.filter((x) => x.id !== v.id) })}>
              <div className="flex flex-wrap gap-1">
                {v.lists.map((l) => <Tag key={l.id}>{l.name} · {tables.find((t) => t.id === l.tableId)?.name ?? "?"}</Tag>)}
              </div>
            </ConfigRow>
          ))}
        </ConfigList>
      ) : (
        <EmptyBox icon={<HugeiconsIcon icon={ObjectiveIcon} className="size-8" />} title="Chưa có cấu hình Objective Card." hint="Thêm một màn hình để hiển thị mục tiêu và Key Results." />
      )}
      <ObjectiveDialog open={ed.open} value={ed.value} table={{ ...p.table, config: c }} onOpenChange={ed.setOpen} onSave={(v) => patchConfig(p, { objectiveCards: upsert(c.objectiveCards, v) })} />
    </SettingsCard>
  )
}

// ── Chuyển đổi (cross-table conversion report) ───────────────────────────────

function ConversionDialog({ open, onOpenChange, value, table, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: ConversionConfig; table: TabProps["table"]; onSave: (v: ConversionConfig) => void }) {
  const { data: tables = [] } = useTables()
  const blank = (): ConversionConfig => ({ id: uid(), name: "", columns: [] })
  const [v, setV] = useState<ConversionConfig>(blank)
  const { errors, check, reset } = useRules<string>()
  useEffect(() => { if (open) { setV(value ?? blank()); reset() } }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const setCol = (i: number, patch: Partial<ConversionConfig["columns"][number]>) => setV({ ...v, columns: v.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const quick = table.config.quickFilters.map((n) => table.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const save = () => {
    const ok = check([
      ["name", v.name.trim(), "Vui lòng nhập tên báo cáo"],
      ["columns", v.columns.length, "Vui lòng thêm ít nhất một cột"],
      ...v.columns.flatMap((c, i): [string, unknown, string][] => [[`label${i}`, c.label.trim(), "Vui lòng nhập tên cột"], [`table${i}`, c.tableId, "Bảng không hợp lệ"]]),
    ])
    if (!ok) return false
    onSave({ ...v, name: v.name.trim() })
  }
  return (
    <ConfigDialog shell="conversion" open={open} onOpenChange={onOpenChange} title={value ? "Sửa báo cáo chuyển đổi" : "Thêm báo cáo chuyển đổi"}
      description="Cấu hình báo cáo tổng hợp từ nhiều bảng khác nhau" submitLabel={value ? "Cập nhật" : "Thêm"} onSubmit={save}>
      <SettingsField label="Tên báo cáo" required error={errors.name}>
        <Input value={v.name} autoFocus placeholder="Nhập tên báo cáo" onChange={(e) => setV({ ...v, name: e.target.value })} />
      </SettingsField>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm leading-none font-medium">Danh sách cột báo cáo <span className="text-destructive">*</span></span>
          <Button type="button" variant="outline" size="sm" className={cn(BTN7, "border-input shadow-xs")} onClick={() => setV({ ...v, columns: [...v.columns, { label: "", tableId: "", formula: "COUNT(*)", filterMappings: [] }] })}>
            <HugeiconsIcon icon={Add01Icon} className="mr-1 h-4 w-4" />Thêm cột
          </Button>
        </div>
        {errors.columns && <p className="text-xs text-destructive">{errors.columns}</p>}
        <div className="space-y-4 pr-4">
          {v.columns.map((col, i) => {
            const t = tables.find((x) => x.id === col.tableId)
            return (
              <div key={i} className="space-y-3 rounded-md border p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <SettingsField label="Tên cột" required error={errors[`label${i}`]}>
                      <Input value={col.label} placeholder="Nhập tên cột" onChange={(e) => setCol(i, { label: e.target.value })} />
                    </SettingsField>
                    <SettingsField label="Bảng nguồn" required error={errors[`table${i}`]} hint="Chọn Active Table để lấy dữ liệu tổng hợp cho cột này">
                      <NativeSelect value={col.tableId} onChange={(e) => setCol(i, { tableId: e.target.value, filterMappings: [] })}>
                        <option value="">Chọn bảng nguồn</option>
                        {tables.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </NativeSelect>
                    </SettingsField>
                  </div>
                  <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Xóa cột" onClick={() => setV({ ...v, columns: v.columns.filter((_, j) => j !== i) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </div>
                {t && (
                  <>
                    <SettingsField label="Chỉ số">
                      {t.config.recordList.totalSumFields.length ? (
                        <NativeSelect value={col.formula} onChange={(e) => setCol(i, { formula: e.target.value })}>
                          {t.config.recordList.totalSumFields.map((s) => <option key={s.formula} value={s.formula}>{s.label} · {s.formula}</option>)}
                          {!t.config.recordList.totalSumFields.some((s) => s.formula === "COUNT(*)") && <option value="COUNT(*)">Đếm bản ghi</option>}
                        </NativeSelect>
                      ) : (
                        <p className="text-xs text-muted-foreground">Bảng đích chưa có trường tổng hợp nào được cấu hình</p>
                      )}
                    </SettingsField>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Đồng bộ bộ lọc</p>
                      {quick.length ? (
                        <div className="overflow-hidden rounded-md border text-sm">
                          <div className="grid grid-cols-2 bg-muted/40 text-xs font-medium text-muted-foreground"><span className="px-3 py-2">Bảng chính</span><span className="px-3 py-2">Bảng đích</span></div>
                          {quick.map((qf) => {
                            const m = col.filterMappings.find((x) => x.from === qf.name)
                            return (
                              <div key={qf.name} className="grid grid-cols-2 items-center border-t">
                                <span className="px-3 py-2">{qf.label}</span>
                                <div className="px-2 py-1.5">
                                  <FieldSelect suffix="none" fields={t.config.fields} filter={(f) => f.type === qf.type} value={m?.to ?? ""} placeholder="Không áp dụng"
                                    onChange={(to) => setCol(i, { filterMappings: [...col.filterMappings.filter((x) => x.from !== qf.name), ...(to ? [{ from: qf.name, to }] : [])] })} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Không có bộ lọc nhanh nào được cấu hình</p>
                      )}
                      <p className="text-xs text-muted-foreground">Chỉ cho phép map các trường có cùng kiểu dữ liệu</p>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </ConfigDialog>
  )
}

export function ConversionTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<ConversionConfig>()
  const { data: tables = [] } = useTables()
  return (
    <SettingsCard title="Báo cáo chuyển đổi" description="Tạo báo cáo tổng hợp từ nhiều bảng khác nhau với đồng bộ bộ lọc tự động" bodyClassName="space-y-4" action={<AddButton variant="text" label="Thêm báo cáo" onClick={ed.openNew} />}>
      {c.conversions.length ? (
        <ConfigList>
          {c.conversions.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Báo cáo ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { conversions: c.conversions.filter((x) => x.id !== v.id) })}>
              <div className="flex flex-wrap gap-1">{v.columns.map((col, j) => <Tag key={j}>{col.label} · {tables.find((t) => t.id === col.tableId)?.name}</Tag>)}</div>
            </ConfigRow>
          ))}
        </ConfigList>
      ) : (
        <EmptyBox pad="p-12" title={'Chưa có báo cáo chuyển đổi nào.Nhấn "Thêm báo cáo" để tạo báo cáo mới.'} />
      )}
      <Stats items={[`${c.conversions.length} báo cáo`, `${c.quickFilters.length} bộ lọc nhanh`]} />
      <InfoBox bullets title="Tính năng báo cáo chuyển đổi" points={["Tạo báo cáo tổng hợp từ nhiều Active Table khác nhau", "Dữ liệu tự động đồng bộ theo bộ lọc nhanh của bảng chính", "Hiển thị các chỉ số tổng hợp (totalSumFields) từ bảng đích", "Chỉ cho phép map các trường có cùng kiểu dữ liệu"]} />
      <ConversionDialog open={ed.open} value={ed.value} table={{ ...p.table, config: c }} onOpenChange={ed.setOpen} onSave={(v) => patchConfig(p, { conversions: upsert(c.conversions, v) })} />
    </SettingsCard>
  )
}
