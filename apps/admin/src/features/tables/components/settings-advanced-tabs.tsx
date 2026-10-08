import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDown, ArrowUp, Check, Copy, Eye, Pencil, Play, Plus, SquarePen, Target, Trash2, X, type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import { useTables, useWorkspaceTeams } from "../api/tables.queries"
import type {
  ConversionConfig, FieldMapping, GanttConfig, ItemAutoInit, ObjectiveCardConfig, ObjectiveList, PivotConfig, PivotGroupBy, TableAction, TableField,
} from "../types/table"
import { fieldTypeLabel, uid } from "../utils/fields"
import { checkFormula, formulaFields } from "../utils/formula"
import { FieldEditorDialog } from "./field-editor-dialog"
import { FieldTypeIcon } from "./field-type-icon"
import { FormRow, NativeSelect, Switch, Textarea } from "./form-controls"
import { EmptyBox, InfoBox, Pair, SettingsCard, SubCard } from "./settings-card"
import { patchConfig, type TabProps } from "./settings-types"

// ── shared bits ──────────────────────────────────────────────────────────────

function FieldSelect({ fields, value, onChange, placeholder = "Không chọn", filter }: { fields: TableField[]; value: string | null; onChange: (v: string) => void; placeholder?: string; filter?: (f: TableField) => boolean }) {
  const list = filter ? fields.filter(filter) : fields
  return (
    <NativeSelect value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {list.map((f) => <option key={f.name} value={f.name}>{f.label} ({fieldTypeLabel(f.type)})</option>)}
    </NativeSelect>
  )
}

function ConfigDialog({ open, onOpenChange, title, description, children, onSubmit, submitLabel, disabled, wide }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; onSubmit: () => void; submitLabel: string; disabled?: boolean; wide?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[90svh] flex-col gap-0 p-0", wide ? "sm:max-w-3xl" : "sm:max-w-xl")}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 overflow-y-auto px-6 pb-6">{children}</div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={disabled} onClick={() => { onSubmit(); onOpenChange(false) }}>{submitLabel}</Button>
        </DialogFooter>
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

function ConfigRow({ title, badge, onEdit, onDelete, children }: { title: string; badge: string; onEdit: () => void; onDelete: () => void; children: ReactNode }) {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        <p className="font-medium">{title}</p>
        <span className="rounded border px-1.5 text-xs text-muted-foreground">{badge}</span>
        <span className="ml-auto flex">
          <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${title}`} onClick={onEdit}><Pencil /></Button>
          <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Xoá ${title}`} onClick={onDelete}><Trash2 /></Button>
        </span>
      </div>
      {children}
    </div>
  )
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
        <ConfigDialog wide open={open} onOpenChange={setOpen} title="Ánh xạ trường item" submitLabel="Xong" onSubmit={() => undefined}
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
  const numericParent = p.draft.config.fields.filter((f) => f.type === "NUMERIC")

  return (
    <SettingsCard
      title="Danh sách chi tiết"
      description="Các dòng con trong một bản ghi (vd: mặt hàng của đơn hàng), có dòng tổng ghi ngược về trường của bản ghi."
      action={<label className="flex items-center gap-2 text-sm">Sử dụng <Switch checked={items.enabled} onChange={(enabled) => setItems({ enabled })} label="Sử dụng danh sách chi tiết" /></label>}
    >
      {!items.enabled ? (
        <p className="text-sm text-muted-foreground">Đang tắt. Bật để thêm bảng dòng con vào form và trang chi tiết.</p>
      ) : (
        <>
          <FormRow label="Tên danh sách chi tiết"><Input value={items.label} placeholder="VD: Mặt hàng" onChange={(e) => setItems({ label: e.target.value })} /></FormRow>
          <SubCard tag="Trường chi tiết" hint="Các cột của mỗi dòng">
            <div className="divide-y rounded-lg border empty:hidden">
              {items.fields.map((f, i) => (
                <div key={f.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <FieldTypeIcon type={f.type} className="size-4 text-muted-foreground" />
                  <span className="flex-1"><b className="font-medium">{f.label}</b> <span className="font-mono text-xs text-muted-foreground">{f.name}</span></span>
                  <Button size="icon-xs" variant="ghost" disabled={i === 0} aria-label="Lên" onClick={() => { const n = [...items.fields]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setItems({ fields: n }) }}><ArrowUp /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label={`Sửa ${f.label}`} onClick={() => setEditor({ open: true, field: f })}><Pencil /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label={`Xoá ${f.label}`} onClick={() => setItems({ fields: items.fields.filter((x) => x.name !== f.name) })}><Trash2 /></Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditor({ open: true })}><Plus />Thêm trường chi tiết</Button>
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
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá dòng tổng" onClick={() => setItems({ sums: items.sums.filter((_, j) => j !== i) })}><X /></Button>
                  <div className="sm:col-span-3">
                    <Input value={s.formula} className="font-mono text-xs" placeholder="SUM(qty * price)" onChange={(e) => set({ formula: e.target.value })} aria-invalid={!!err || undefined} />
                    <p className={cn("mt-1 text-xs", err || unknown.length ? "text-destructive" : "text-muted-foreground")}>
                      {err ?? (unknown.length ? `Không có trường: ${unknown.join(", ")}` : `Dùng: ${formulaFields(s.formula).join(", ") || "—"}`)}
                    </p>
                  </div>
                </div>
              )
            })}
            <Button size="sm" variant="outline" onClick={() => setItems({ sums: [...items.sums, { sumField: "", label: "Tổng", formula: "SUM()" }] })}><Plus />Thêm dòng tổng</Button>
            <p className="text-xs text-muted-foreground">Công thức hỗ trợ SUM, AVG, MIN, MAX, COUNT và phép + − × ÷ giữa các trường chi tiết.</p>
          </SubCard>
          <ItemAutoInitPanel {...p} />
        </>
      )}
      <FieldEditorDialog
        open={editor.open}
        field={editor.field}
        table={{ ...p.table, config: { ...p.draft.config, fields: items.fields } }}
        onOpenChange={(open) => setEditor((s) => ({ ...s, open }))}
        onSave={(f) => setItems({ fields: items.fields.some((x) => x.name === f.name) ? items.fields.map((x) => (x.name === f.name ? f : x)) : [...items.fields, f] })}
      />
    </SettingsCard>
  )
}

// ── Hành động ────────────────────────────────────────────────────────────────

const ACTION_ICON: Record<string, LucideIcon> = { create: Plus, access: Eye, update: SquarePen, delete: Trash2 }
const CUSTOM_ICONS = ["play", "workflow", "package", "send", "user-cog", "database"]

function ActionDialog({ open, onOpenChange, value, table, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: TableAction; table: TabProps["table"]; onSave: (a: TableAction) => void }) {
  const [a, setA] = useState<TableAction>({ actionId: "", name: "", type: "custom", icon: "play", inputFields: [] })
  const [fieldEditor, setFieldEditor] = useState<{ open: boolean; field?: TableField }>({ open: false })
  useEffect(() => {
    if (open) setA(value ?? { actionId: crypto.randomUUID?.() ?? uid(), name: "", type: "custom", icon: "play", inputFields: [] })
  }, [open, value])
  return (
    <ConfigDialog open={open} onOpenChange={onOpenChange} title={value ? "Sửa hành động tuỳ chỉnh" : "Thêm hành động tuỳ chỉnh"}
      description="Mã hành động dùng để gọi logic nghiệp vụ (workflow) khi người dùng bấm vào." submitLabel={value ? "Cập nhật" : "Thêm hành động"} disabled={!a.name.trim()} onSubmit={() => onSave({ ...a, name: a.name.trim() })}>
      <FormRow label="Tên hành động" required><Input value={a.name} autoFocus onChange={(e) => setA({ ...a, name: e.target.value })} /></FormRow>
      <FormRow label="Biểu tượng">
        <NativeSelect value={a.icon} onChange={(e) => setA({ ...a, icon: e.target.value })}>{CUSTOM_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</NativeSelect>
      </FormRow>
      <Separator />
      <div className="space-y-2">
        <p className="text-sm font-medium">Trường nhập khi chạy</p>
        <p className="text-xs text-muted-foreground">Người dùng điền form gồm các trường này trước khi hành động chạy.</p>
        {a.inputFields.map((f) => (
          <div key={f.name} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <FieldTypeIcon type={f.type} className="size-4 text-muted-foreground" />
            <span className="flex-1">{f.label} <span className="font-mono text-xs text-muted-foreground">{f.name}</span></span>
            <Button size="icon-xs" variant="ghost" aria-label={`Sửa ${f.label}`} onClick={() => setFieldEditor({ open: true, field: f })}><Pencil /></Button>
            <Button size="icon-xs" variant="ghost" aria-label={`Xoá ${f.label}`} onClick={() => setA({ ...a, inputFields: a.inputFields.filter((x) => x.name !== f.name) })}><Trash2 /></Button>
          </div>
        ))}
        {!a.inputFields.length && <EmptyBox title="Chưa có trường nào" hint="Hành động sẽ chạy ngay khi bấm." />}
        <Button size="sm" variant="outline" onClick={() => setFieldEditor({ open: true })}><Plus />Thêm trường</Button>
      </div>
      <FieldEditorDialog
        open={fieldEditor.open}
        field={fieldEditor.field}
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
    const Icon = ACTION_ICON[a.icon] ?? Play
    return (
      <div key={a.actionId} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5">
        <span className="grid size-8 place-items-center rounded-md border text-muted-foreground"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{a.name} <span className="ml-1 rounded border px-1.5 py-0.5 text-xs font-normal text-muted-foreground">{a.type === "custom" ? "Tuỳ chỉnh" : "Hệ thống"}</span></p>
          <p className="truncate font-mono text-xs text-muted-foreground">{a.type === "custom" ? a.actionId : a.type} · biểu tượng: {a.icon}{a.inputFields.length > 0 && ` · ${a.inputFields.length} trường nhập`}</p>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Sao chép mã hành động" onClick={() => copy(a.actionId)}>{copied === a.actionId ? <Check className="text-emerald-600" /> : <Copy />}</Button>
        {extra}
      </div>
    )
  }

  return (
    <SettingsCard title="Cấu hình hành động" description="Hành động hệ thống có sẵn cho mọi bảng; hành động tuỳ chỉnh dùng để kích hoạt workflow." action={<Button size="sm" onClick={() => setDialog({ open: true })}><Plus />Thêm hành động tuỳ chỉnh</Button>}>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Hành động hệ thống (chỉ đọc)</h3>
        <div className="space-y-2 rounded-lg border p-2">{system.map((a) => row(a))}</div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Hành động tuỳ chỉnh</h3>
        {custom.length ? (
          <div className="space-y-2 rounded-lg border p-2">
            {custom.map((a) =>
              row(a, (
                <>
                  <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${a.name}`} onClick={() => setDialog({ open: true, value: a })}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Xoá ${a.name}`} onClick={() => patchConfig(p, { actions: actions.filter((x) => x.actionId !== a.actionId) })}><Trash2 /></Button>
                </>
              )),
            )}
          </div>
        ) : (
          <EmptyBox title="Chưa có hành động tuỳ chỉnh" hint="Thêm hành động để chạy workflow từ bản ghi." />
        )}
      </div>
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
    <SettingsCard title="Cấu hình phân quyền" description="Phân quyền theo nhóm và vai trò cho từng hành động của bảng">
      <FormRow label="Chọn nhóm">
        <NativeSelect value={team?.id ?? ""} onChange={(e) => setTeamId(e.target.value)}>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </NativeSelect>
      </FormRow>
      <InfoBox title="Ma trận phân quyền" points={["Mỗi vai trò trong nhóm có phạm vi riêng cho từng hành động.", "Hành động bản ghi, bình luận và hành động tuỳ chỉnh có danh sách phạm vi khác nhau."]} />
      {team?.roles.map((r) => (
        <SubCard key={r.id} tag={r.name} hint="Phân quyền vai trò">
          <div className="divide-y">
            {actions.map((a) => (
              <div key={a.actionId} className="grid items-center gap-2 py-2 sm:grid-cols-[1fr_260px]">
                <div>
                  <p className="text-sm">{a.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a.type}</p>
                </div>
                <NativeSelect value={get(r.id, a.actionId)} onChange={(e) => set(r.id, a.actionId, e.target.value)} aria-label={`${r.name} – ${a.name}`}>
                  {scopesFor(a).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </NativeSelect>
              </div>
            ))}
          </div>
        </SubCard>
      ))}
    </SettingsCard>
  )
}

// ── Gantt ────────────────────────────────────────────────────────────────────

const isDate = (f: TableField) => f.type === "DATE" || f.type === "DATETIME"

function GanttDialog({ open, onOpenChange, value, fields, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: GanttConfig; fields: TableField[]; onSave: (g: GanttConfig) => void }) {
  const blank = (): GanttConfig => ({ id: uid(), name: "", description: "", taskNameField: fields[0]?.name ?? "", startDateField: "", endDateField: "", progressField: null, dependencyField: null, statusField: "", statusCompleteValue: "" })
  const [g, setG] = useState<GanttConfig>(blank)
  useEffect(() => { if (open) setG(value ?? blank()) }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const status = fields.find((f) => f.name === g.statusField)
  const ok = g.name.trim() && g.taskNameField && g.startDateField && g.endDateField && g.statusField
  return (
    <ConfigDialog open={open} onOpenChange={onOpenChange} title={value ? "Sửa biểu đồ Gantt" : "Thêm biểu đồ Gantt"}
      description="Mỗi bản ghi là một thanh ngang trên trục thời gian, từ ngày bắt đầu tới ngày kết thúc." submitLabel={value ? "Cập nhật" : "Thêm biểu đồ"} disabled={!ok} onSubmit={() => onSave(g)}>
      <FormRow label="Tên màn hình" required><Input value={g.name} autoFocus onChange={(e) => setG({ ...g, name: e.target.value })} /></FormRow>
      <FormRow label="Mô tả"><Textarea rows={2} value={g.description} onChange={(e) => setG({ ...g, description: e.target.value })} /></FormRow>
      <FormRow label="Trường tên công việc" required hint="Nhãn hiển thị trên thanh"><FieldSelect fields={fields} value={g.taskNameField} onChange={(v) => setG({ ...g, taskNameField: v })} /></FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Trường ngày bắt đầu" required hint="Kiểu Ngày hoặc Ngày & giờ"><FieldSelect fields={fields} filter={isDate} value={g.startDateField} onChange={(v) => setG({ ...g, startDateField: v })} /></FormRow>
        <FormRow label="Trường ngày kết thúc" required hint="Kiểu Ngày hoặc Ngày & giờ"><FieldSelect fields={fields} filter={isDate} value={g.endDateField} onChange={(v) => setG({ ...g, endDateField: v })} /></FormRow>
      </div>
      <FormRow label="Trường tiến độ (tuỳ chọn)" hint="Số 0–100, vẽ phần trăm hoàn thành"><FieldSelect fields={fields} filter={(f) => f.type === "NUMERIC"} value={g.progressField} onChange={(v) => setG({ ...g, progressField: v || null })} /></FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label="Trường trạng thái" required hint="Trường Chọn một"><FieldSelect fields={fields} filter={(f) => f.type === "SELECT_ONE"} value={g.statusField} onChange={(v) => setG({ ...g, statusField: v, statusCompleteValue: "" })} /></FormRow>
        <FormRow label="Giá trị hoàn thành">
          <NativeSelect value={g.statusCompleteValue} disabled={!status} onChange={(e) => setG({ ...g, statusCompleteValue: e.target.value })}>
            <option value="">—</option>
            {status?.options?.map((o) => <option key={o.value} value={o.value}>{o.text}</option>)}
          </NativeSelect>
        </FormRow>
      </div>
    </ConfigDialog>
  )
}

export function GanttTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<GanttConfig>()
  const label = (n: string | null) => (n ? c.fields.find((f) => f.name === n)?.label ?? n : "—")
  const statusOpt = (g: GanttConfig) => c.fields.find((f) => f.name === g.statusField)?.options?.find((o) => o.value === g.statusCompleteValue)?.text ?? "—"
  return (
    <SettingsCard title="Cấu hình biểu đồ Gantt" description="Lập kế hoạch và theo dõi tiến độ trên trục thời gian" action={<Button size="sm" onClick={ed.openNew}><Plus />Thêm biểu đồ Gantt</Button>}>
      {c.ganttCharts.length ? (
        <div className="divide-y rounded-lg border">
          {c.ganttCharts.map((g, i) => (
            <ConfigRow key={g.id} title={g.name} badge={`Biểu đồ ${i + 1}`} onEdit={() => ed.openEdit(g)} onDelete={() => patchConfig(p, { ganttCharts: c.ganttCharts.filter((x) => x.id !== g.id) })}>
              <div className="grid gap-1 sm:grid-cols-2">
                <Pair k="Tên công việc" v={label(g.taskNameField)} />
                <Pair k="Ngày bắt đầu" v={label(g.startDateField)} />
                <Pair k="Ngày kết thúc" v={label(g.endDateField)} />
                <Pair k="Trạng thái" v={label(g.statusField)} />
                <Pair k="Giá trị hoàn thành" v={statusOpt(g)} />
                <Pair k="Tiến độ" v={label(g.progressField)} />
              </div>
            </ConfigRow>
          ))}
        </div>
      ) : (
        <EmptyBox title="Chưa có biểu đồ Gantt nào." />
      )}
      <p className="text-sm text-muted-foreground">
        Tổng biểu đồ: {c.ganttCharts.length} · Trường ngày: {c.fields.filter(isDate).length} · Trường tiến độ: {c.fields.filter((f) => f.type === "NUMERIC").length} · Trường trạng thái: {c.fields.filter((f) => f.type === "SELECT_ONE").length}
      </p>
      <InfoBox title="Biểu đồ Gantt dùng để" points={["Nhìn lịch công việc theo thời gian", "Theo dõi % hoàn thành bằng thanh tiến độ", "Đánh dấu việc đã xong theo trạng thái"]} />
      <GanttDialog open={ed.open} value={ed.value} fields={c.fields} onOpenChange={ed.setOpen} onSave={(g) => patchConfig(p, { ganttCharts: upsert(c.ganttCharts, g) })} />
    </SettingsCard>
  )
}

// ── Pivot / Matrix ───────────────────────────────────────────────────────────

const GROUP_BY: { v: PivotGroupBy; l: string }[] = [{ v: "day", l: "Ngày" }, { v: "week", l: "Tuần" }, { v: "month", l: "Tháng" }, { v: "quarter", l: "Quý" }, { v: "year", l: "Năm" }]

function PivotDialog({ open, onOpenChange, value, fields, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: PivotConfig; fields: TableField[]; onSave: (v: PivotConfig) => void }) {
  const blank = (): PivotConfig => ({ id: uid(), name: "", description: "", rowField: "", columnField: "", groupBy: "month", measures: [{ label: "Số bản ghi", formula: "COUNT(*)", unit: null, decimalPlaces: 0 }], rowTotals: true, columnTotals: true, grandTotal: true })
  const [v, setV] = useState<PivotConfig>(blank)
  useEffect(() => { if (open) setV(value ?? blank()) }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const numeric = fields.filter((f) => f.type === "NUMERIC")
  const setM = (i: number, patch: Partial<PivotConfig["measures"][number]>) => setV({ ...v, measures: v.measures.map((m, j) => (j === i ? { ...m, ...patch } : m)) })
  const move = (i: number, d: -1 | 1) => { const n = [...v.measures]; [n[i], n[i + d]] = [n[i + d], n[i]]; setV({ ...v, measures: n }) }
  const errs = v.measures.map((m) => checkFormula(m.formula))
  return (
    <ConfigDialog wide open={open} onOpenChange={onOpenChange} title={value ? "Sửa Pivot" : "Thêm Pivot"} description="Bảng chéo: mỗi dòng là một giá trị của trường dòng, mỗi cột là một khoảng thời gian."
      submitLabel="Lưu Pivot" disabled={!v.name.trim() || !v.rowField || !v.measures.length || errs.some(Boolean)} onSubmit={() => onSave(v)}>
      <FormRow label="Tên Pivot" required><Input value={v.name} autoFocus onChange={(e) => setV({ ...v, name: e.target.value })} /></FormRow>
      <FormRow label="Mô tả"><Textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></FormRow>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormRow label="Trường dòng" required><FieldSelect fields={fields} filter={(f) => ["SELECT_ONE", "SELECT_ONE_WORKSPACE_USER", "SELECT_ONE_RECORD", "CHECKBOX_YES_NO", "SHORT_TEXT"].includes(f.type)} value={v.rowField} onChange={(rowField) => setV({ ...v, rowField })} placeholder="—" /></FormRow>
        <FormRow label="Trường cột thời gian"><FieldSelect fields={fields} filter={isDate} value={v.columnField} onChange={(columnField) => setV({ ...v, columnField })} placeholder="— (ngày tạo)" /></FormRow>
        <FormRow label="Nhóm theo">
          <NativeSelect value={v.groupBy} onChange={(e) => setV({ ...v, groupBy: e.target.value as PivotGroupBy })}>{GROUP_BY.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}</NativeSelect>
        </FormRow>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-sm font-medium">Measures</p><Button size="xs" variant="outline" onClick={() => setV({ ...v, measures: [...v.measures, { label: "", formula: "", unit: null, decimalPlaces: null }] })}><Plus />Thêm</Button></div>
        {v.measures.map((m, i) => (
          <div key={i} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Measure {i + 1}
              <span className="ml-auto flex">
                <Button size="icon-xs" variant="ghost" disabled={i === 0} aria-label="Lên" onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button size="icon-xs" variant="ghost" disabled={i === v.measures.length - 1} aria-label="Xuống" onClick={() => move(i, 1)}><ArrowDown /></Button>
                <Button size="icon-xs" variant="ghost" aria-label="Xoá measure" onClick={() => setV({ ...v, measures: v.measures.filter((_, j) => j !== i) })}><Trash2 /></Button>
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={m.label} placeholder="Nhãn" onChange={(e) => setM(i, { label: e.target.value })} />
              <NativeSelect value="" onChange={(e) => e.target.value && setM(i, { formula: e.target.value })}>
                <option value="">Chèn công thức mẫu…</option>
                <option value="COUNT(*)">Đếm bản ghi</option>
                {numeric.map((f) => <option key={f.name} value={`SUM(${f.name})`}>Tổng · {f.label}</option>)}
              </NativeSelect>
            </div>
            <Input value={m.formula} className="font-mono text-xs" placeholder="SUM(grand_total)" onChange={(e) => setM(i, { formula: e.target.value })} aria-invalid={!!errs[i] || undefined} />
            {errs[i] && <p className="text-xs text-destructive">{errs[i]}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Input value={m.unit ?? ""} placeholder="Đơn vị" onChange={(e) => setM(i, { unit: e.target.value || null })} />
              <Input type="number" min={0} max={6} value={m.decimalPlaces ?? ""} placeholder="Số chữ số thập phân" onChange={(e) => setM(i, { decimalPlaces: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><Switch checked={v.rowTotals} onChange={(rowTotals) => setV({ ...v, rowTotals })} />Hiển thị tổng dòng</label>
        <label className="flex items-center gap-2"><Switch checked={v.columnTotals} onChange={(columnTotals) => setV({ ...v, columnTotals })} />Hiển thị tổng cột</label>
        <label className="flex items-center gap-2"><Switch checked={v.grandTotal} onChange={(grandTotal) => setV({ ...v, grandTotal })} />Tổng toàn bảng</label>
      </div>
    </ConfigDialog>
  )
}

export function PivotTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<PivotConfig>()
  const label = (n: string) => (n ? c.fields.find((f) => f.name === n)?.label ?? n : "Ngày tạo")
  return (
    <SettingsCard title="Pivot / Matrix" description="Bảng chéo với các chỉ số được nhóm theo dòng và thời gian" action={<Button size="sm" onClick={ed.openNew}><Plus />Thêm Pivot</Button>}>
      {c.pivotConfigs.length ? (
        <div className="divide-y rounded-lg border">
          {c.pivotConfigs.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Pivot ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { pivotConfigs: c.pivotConfigs.filter((x) => x.id !== v.id) })}>
              <div className="grid gap-1 sm:grid-cols-2">
                <Pair k="Dòng" v={label(v.rowField)} />
                <Pair k="Cột" v={`${label(v.columnField)} · theo ${GROUP_BY.find((g) => g.v === v.groupBy)?.l.toLowerCase()}`} />
              </div>
              <div className="flex flex-wrap gap-1">{v.measures.map((m) => <span key={m.label + m.formula} className="rounded border px-1.5 py-0.5 font-mono text-xs">{m.label}: {m.formula}</span>)}</div>
            </ConfigRow>
          ))}
        </div>
      ) : (
        <EmptyBox title="Chưa có màn hình Pivot nào." />
      )}
      <PivotDialog open={ed.open} value={ed.value} fields={c.fields} onOpenChange={ed.setOpen} onSave={(v) => patchConfig(p, { pivotConfigs: upsert(c.pivotConfigs, v) })} />
    </SettingsCard>
  )
}

// ── Objective Card ───────────────────────────────────────────────────────────

function ObjectiveDialog({ open, onOpenChange, value, table, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value?: ObjectiveCardConfig; table: TabProps["table"]; onSave: (v: ObjectiveCardConfig) => void }) {
  const { data: tables = [] } = useTables()
  const blankList = (): ObjectiveList => ({ id: uid(), name: "", tableId: "", relationField: "", titleField: "", startField: "", endField: "", progressField: "", currentField: "", targetField: "", unitField: "", statusField: "", limit: 5 })
  const blank = (): ObjectiveCardConfig => ({ id: uid(), name: "", description: "", objective: { titleField: "", descriptionField: "", ownerField: "", startField: "", endField: "", progressField: "", statusField: "" }, lists: [blankList()] })
  const [v, setV] = useState<ObjectiveCardConfig>(blank)
  useEffect(() => { if (open) setV(value ?? blank()) }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const fields = table.config.fields
  const setO = (k: keyof ObjectiveCardConfig["objective"], val: string) => setV({ ...v, objective: { ...v.objective, [k]: val } })
  const setL = (i: number, patch: Partial<ObjectiveList>) => setV({ ...v, lists: v.lists.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const ok = v.name.trim() && v.lists.length > 0 && v.lists.every((l) => l.name.trim() && l.tableId && l.relationField)

  const OBJ: [keyof ObjectiveCardConfig["objective"], string, ((f: TableField) => boolean)?][] = [
    ["titleField", "Tiêu đề"], ["descriptionField", "Mô tả"], ["ownerField", "Người phụ trách", (f) => f.type.includes("WORKSPACE_USER")],
    ["startField", "Bắt đầu", isDate], ["endField", "Kết thúc", isDate], ["progressField", "Tiến độ", (f) => f.type === "NUMERIC"], ["statusField", "Trạng thái", (f) => f.type === "SELECT_ONE"],
  ]
  return (
    <ConfigDialog wide open={open} onOpenChange={onOpenChange} title={value ? "Sửa Objective Card" : "Thêm Objective Card"}
      description="Thẻ mục tiêu: thông tin chính lấy từ bảng hiện tại, kèm các danh sách kết quả (Key Results) từ bảng liên quan." submitLabel="Lưu Objective Card" disabled={!ok} onSubmit={() => onSave(v)}>
      <FormRow label="Tên Objective Card" required><Input value={v.name} autoFocus onChange={(e) => setV({ ...v, name: e.target.value })} /></FormRow>
      <FormRow label="Mô tả"><Textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></FormRow>
      <SubCard tag="Thông tin mục tiêu" hint={`Trường của bảng ${table.name}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {OBJ.map(([k, l, filter]) => <FormRow key={k} label={l}><FieldSelect fields={fields} filter={filter} value={v.objective[k]} onChange={(val) => setO(k, val)} /></FormRow>)}
        </div>
      </SubCard>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Các mục liên quan</p>
          <Button size="xs" variant="outline" onClick={() => setV({ ...v, lists: [...v.lists, blankList()] })}><Plus />Thêm mục liên quan</Button>
        </div>
        {!v.lists.length && <p className="text-xs text-destructive">Cần ít nhất một mục liên quan.</p>}
        {v.lists.map((l, i) => {
          const t = tables.find((x) => x.id === l.tableId)
          const tf = t?.config.fields ?? []
          return (
            <div key={l.id} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center text-xs font-medium text-muted-foreground">
                Mục liên quan {i + 1}{l.name && ` · ${l.name}`}
                <Button size="icon-xs" variant="ghost" className="ml-auto" aria-label="Xoá mục" onClick={() => setV({ ...v, lists: v.lists.filter((x) => x.id !== l.id) })}><Trash2 /></Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormRow label="Tên danh sách" required><Input value={l.name} onChange={(e) => setL(i, { name: e.target.value })} /></FormRow>
                <FormRow label="Bảng" required>
                  <NativeSelect value={l.tableId} onChange={(e) => setL(i, { tableId: e.target.value, relationField: "", titleField: "", startField: "", endField: "", progressField: "", currentField: "", targetField: "", unitField: "", statusField: "" })}>
                    <option value="">Chọn bảng liên quan</option>
                    {tables.filter((x) => x.id !== table.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </NativeSelect>
                </FormRow>
                <FormRow label="Quan hệ với mục tiêu" required hint="Trường tham chiếu trỏ về bảng hiện tại">
                  <FieldSelect fields={tf} filter={(f) => f.type === "SELECT_ONE_RECORD" && f.referenceTableId === table.id} value={l.relationField} onChange={(val) => setL(i, { relationField: val })} />
                </FormRow>
                <FormRow label="Tiêu đề"><FieldSelect fields={tf} value={l.titleField} onChange={(val) => setL(i, { titleField: val })} /></FormRow>
                <FormRow label="Bắt đầu"><FieldSelect fields={tf} filter={isDate} value={l.startField} onChange={(val) => setL(i, { startField: val })} /></FormRow>
                <FormRow label="Kết thúc"><FieldSelect fields={tf} filter={isDate} value={l.endField} onChange={(val) => setL(i, { endField: val })} /></FormRow>
                <FormRow label="Tiến độ"><FieldSelect fields={tf} filter={(f) => f.type === "NUMERIC"} value={l.progressField} onChange={(val) => setL(i, { progressField: val })} /></FormRow>
                <FormRow label="Trạng thái"><FieldSelect fields={tf} filter={(f) => f.type === "SELECT_ONE"} value={l.statusField} onChange={(val) => setL(i, { statusField: val })} /></FormRow>
                <FormRow label="Giá trị hiện tại"><FieldSelect fields={tf} filter={(f) => f.type === "NUMERIC"} value={l.currentField} onChange={(val) => setL(i, { currentField: val })} /></FormRow>
                <FormRow label="Giá trị mục tiêu"><FieldSelect fields={tf} filter={(f) => f.type === "NUMERIC"} value={l.targetField} onChange={(val) => setL(i, { targetField: val })} /></FormRow>
                <FormRow label="Đơn vị đo"><FieldSelect fields={tf} filter={(f) => ["SHORT_TEXT", "SELECT_ONE", "SELECT_ONE_RECORD"].includes(f.type)} value={l.unitField} onChange={(val) => setL(i, { unitField: val })} /></FormRow>
                <FormRow label="Hiển thị tối đa"><Input type="number" min={1} max={50} value={l.limit} onChange={(e) => setL(i, { limit: Number(e.target.value) || 5 })} /></FormRow>
              </div>
            </div>
          )
        })}
      </div>
    </ConfigDialog>
  )
}

export function ObjectiveTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<ObjectiveCardConfig>()
  const { data: tables = [] } = useTables()
  return (
    <SettingsCard title="Objective Card" description="Màn hình mục tiêu kèm danh sách kết quả từ các bảng liên quan" action={<Button size="sm" onClick={ed.openNew}><Plus />Thêm Objective Card</Button>}>
      {c.objectiveCards.length ? (
        <div className="divide-y rounded-lg border">
          {c.objectiveCards.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Thẻ ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { objectiveCards: c.objectiveCards.filter((x) => x.id !== v.id) })}>
              <div className="flex flex-wrap gap-1">
                {v.lists.map((l) => <span key={l.id} className="rounded border px-1.5 py-0.5 text-xs">{l.name} · {tables.find((t) => t.id === l.tableId)?.name ?? "?"}</span>)}
              </div>
            </ConfigRow>
          ))}
        </div>
      ) : (
        <EmptyBox icon={<Target className="size-8" />} title="Chưa có cấu hình Objective Card." hint="Thêm một màn hình để theo dõi mục tiêu và Key Results." />
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
  useEffect(() => { if (open) setV(value ?? blank()) }, [open, value]) // eslint-disable-line react-hooks/exhaustive-deps
  const setCol = (i: number, patch: Partial<ConversionConfig["columns"][number]>) => setV({ ...v, columns: v.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const quick = table.config.quickFilters.map((n) => table.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  return (
    <ConfigDialog wide open={open} onOpenChange={onOpenChange} title={value ? "Sửa báo cáo chuyển đổi" : "Thêm báo cáo chuyển đổi"}
      description="Mỗi cột lấy một chỉ số tổng hợp từ một bảng; bộ lọc nhanh của bảng này được áp sang bảng đích theo ánh xạ trường." submitLabel={value ? "Cập nhật" : "Thêm"}
      disabled={!v.name.trim() || !v.columns.length || v.columns.some((c) => !c.tableId || !c.label.trim())} onSubmit={() => onSave(v)}>
      <FormRow label="Tên báo cáo" required><Input value={v.name} autoFocus onChange={(e) => setV({ ...v, name: e.target.value })} /></FormRow>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Danh sách cột báo cáo <span className="text-destructive">*</span></p>
          <Button size="xs" variant="outline" onClick={() => setV({ ...v, columns: [...v.columns, { label: "", tableId: "", formula: "COUNT(*)", filterMappings: [] }] })}><Plus />Thêm cột</Button>
        </div>
        {!v.columns.length && <EmptyBox title="Chưa có cột nào" />}
        {v.columns.map((col, i) => {
          const t = tables.find((x) => x.id === col.tableId)
          return (
            <div key={i} className="space-y-3 rounded-md border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input value={col.label} placeholder="Tên cột" onChange={(e) => setCol(i, { label: e.target.value })} />
                <NativeSelect value={col.tableId} onChange={(e) => setCol(i, { tableId: e.target.value, filterMappings: [] })}>
                  <option value="">Chọn bảng…</option>
                  {tables.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </NativeSelect>
                <Button size="icon-sm" variant="ghost" aria-label="Xoá cột" onClick={() => setV({ ...v, columns: v.columns.filter((_, j) => j !== i) })}><X /></Button>
              </div>
              {t && (
                <>
                  <FormRow label="Chỉ số (dòng tổng của bảng đích)">
                    <NativeSelect value={col.formula} onChange={(e) => setCol(i, { formula: e.target.value })}>
                      {t.config.recordList.totalSumFields.map((s) => <option key={s.formula} value={s.formula}>{s.label} · {s.formula}</option>)}
                      {!t.config.recordList.totalSumFields.some((s) => s.formula === "COUNT(*)") && <option value="COUNT(*)">Đếm bản ghi</option>}
                    </NativeSelect>
                  </FormRow>
                  {quick.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Ánh xạ bộ lọc nhanh → trường bảng đích (chỉ cùng kiểu)</p>
                      {quick.map((qf) => {
                        const m = col.filterMappings.find((x) => x.from === qf.name)
                        return (
                          <div key={qf.name} className="grid items-center gap-2 text-sm sm:grid-cols-2">
                            <span className="text-muted-foreground">{qf.label}</span>
                            <FieldSelect fields={t.config.fields} filter={(f) => f.type === qf.type} value={m?.to ?? ""} placeholder="Không áp dụng"
                              onChange={(to) => setCol(i, { filterMappings: [...col.filterMappings.filter((x) => x.from !== qf.name), ...(to ? [{ from: qf.name, to }] : [])] })} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </ConfigDialog>
  )
}

export function ConversionTab(p: TabProps) {
  const c = p.draft.config
  const ed = useEditor<ConversionConfig>()
  const { data: tables = [] } = useTables()
  return (
    <SettingsCard title="Báo cáo chuyển đổi" description="Tổng hợp chỉ số từ nhiều bảng, đồng bộ theo bộ lọc nhanh của bảng này" action={<Button size="sm" onClick={ed.openNew}><Plus />Thêm báo cáo</Button>}>
      {c.conversions.length ? (
        <div className="divide-y rounded-lg border">
          {c.conversions.map((v, i) => (
            <ConfigRow key={v.id} title={v.name} badge={`Báo cáo ${i + 1}`} onEdit={() => ed.openEdit(v)} onDelete={() => patchConfig(p, { conversions: c.conversions.filter((x) => x.id !== v.id) })}>
              <div className="flex flex-wrap gap-1">{v.columns.map((col, j) => <span key={j} className="rounded border px-1.5 py-0.5 text-xs">{col.label} · {tables.find((t) => t.id === col.tableId)?.name}</span>)}</div>
            </ConfigRow>
          ))}
        </div>
      ) : (
        <EmptyBox title="Chưa có báo cáo chuyển đổi nào." hint="Bấm “Thêm báo cáo” để tạo." />
      )}
      <p className="text-sm text-muted-foreground">{c.conversions.length} báo cáo · {c.quickFilters.length} bộ lọc nhanh</p>
      <InfoBox title="Báo cáo chuyển đổi" points={["Gom chỉ số từ nhiều bảng vào một màn hình", "Lọc nhanh ở bảng này tự áp sang bảng đích", "Chỉ số lấy từ dòng tổng hợp của bảng đích", "Chỉ ánh xạ được các trường cùng kiểu dữ liệu"]} />
      <ConversionDialog open={ed.open} value={ed.value} table={{ ...p.table, config: c }} onOpenChange={ed.setOpen} onSave={(v) => patchConfig(p, { conversions: upsert(c.conversions, v) })} />
    </SettingsCard>
  )
}
