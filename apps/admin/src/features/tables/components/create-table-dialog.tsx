import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Select, SelectChevron } from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { typeStyle } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateTable, useCreateWorkGroup, useWorkGroups } from "../api/tables.queries"
import { TEMPLATES, buildTemplateConfig } from "../data/table-templates"
import type { TableTemplate } from "../types/table"
import { fieldTypeLabel } from "../utils/fields"
import { FieldTypeIcon } from "./field-type-icon"
import { BTN7 } from "./settings-card"
import { TableIcon } from "./table-icon"

const NEW_GROUP = "__new__"

/** Reference template names (shown under each app on the Apps page too). */
const TEMPLATE_LABEL: Record<TableTemplate, string> = {
  BLANK: "Blank",
  CUSTOMER_PIPELINE: "Customer Pipeline",
  TASK_EISENHOWER: "Task Eisenhower",
  INVENTORY: "Inventory",
}

const H3_STYLE = typeStyle("heading-h3")
const SMALL_STYLE = typeStyle("body-small")

const INPUT =
  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30"
const LABEL = "text-sm font-medium leading-none"

/** Reference dialog card: `py-5` card with a `px-5` header (h3 token) and `px-5 space-y-4` body. */
function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div data-slot="card" className="flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
      <div className="grid auto-rows-min items-start gap-1 px-5">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground" style={H3_STYLE}>{title}</h3>
          {action}
        </div>
      </div>
      <div className="space-y-4 px-5">{children}</div>
    </div>
  )
}

/** "Loại module" picker: popover list of templates; picking one loads its fields into the field card. */
function TemplatePicker({ value, onChange }: { value: TableTemplate | null; onChange: (t: TableTemplate) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id="tableType" type="button" className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:bg-input/30">
          <span className="truncate">{value ? TEMPLATE_LABEL[value] : "Chọn loại module"}</span>
          <SelectChevron />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[60] w-(--radix-popover-trigger-width) min-w-72 p-1 shadow-md">
        <div role="listbox" aria-label="Loại module">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={value === t.id}
              onClick={() => {
                onChange(t.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent"
            >
              <TableIcon icon={t.icon} color={t.iconColor} plain />
              <span className="grid min-w-0 flex-1">
                <span className="truncate">{TEMPLATE_LABEL[t.id]}</span>
                <span className="truncate text-xs text-muted-foreground">{t.description}</span>
              </span>
              {value === t.id && <HugeiconsIcon icon={Tick02Icon} className="size-4 shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function CreateTableDialog({ open, onOpenChange, defaultGroupId }: { open: boolean; onOpenChange: (o: boolean) => void; defaultGroupId?: string }) {
  const navigate = useNavigate()
  const { data: groups = [] } = useWorkGroups()
  const createTable = useCreateTable()
  const createGroup = useCreateWorkGroup()
  const [template, setTemplate] = useState<TableTemplate | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState("")
  const [groupName, setGroupName] = useState("")
  const [showFields, setShowFields] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setTemplate(null)
    setName("")
    setDescription("")
    setGroupId(defaultGroupId ?? "")
    setGroupName("")
    setShowFields(true)
    setError("")
  }, [open, defaultGroupId])

  const fields = useMemo(() => (template ? buildTemplateConfig(template).fields : []), [template])
  const pending = createTable.isPending || createGroup.isPending

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError("Tên module là bắt buộc")
    if (groupId === NEW_GROUP && !groupName.trim()) return setError("Nhập tên nhóm mới")
    const wg = groupId === NEW_GROUP ? (await createGroup.mutateAsync({ name: groupName })).id : groupId
    const t = await createTable.mutateAsync({ name, description, workGroupId: wg, template: template ?? "BLANK" })
    onOpenChange(false)
    navigate(`/tables/${t.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto p-4 duration-150 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] sm:max-w-4xl sm:p-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">Tạo Module mới</DialogTitle>
          <DialogDescription>Thiết lập module mới để quản lý dữ liệu cấu trúc với quy trình, mã hóa và cộng tác nhóm.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <Card title="Thông tin cơ bản">
            <div className="space-y-2">
              <label className={LABEL} htmlFor="name">Tên module *</label>
              <input
                id="name"
                className={INPUT}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên module"
                aria-invalid={!!error && !name.trim()}
                autoFocus
              />
              <p className="text-destructive" style={SMALL_STYLE}>{error && !name.trim() ? error : ""}</p>
            </div>
            <div className="space-y-2">
              <label className={LABEL} htmlFor="description">Mô tả</label>
              <Textarea id="description" className="placeholder:text-muted-foreground" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả module" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={LABEL} htmlFor="workGroupId">Nhóm công việc</label>
                <Select id="workGroupId" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">Không (Chưa phân nhóm)</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  <option value={NEW_GROUP}>+ Tạo nhóm mới…</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className={LABEL} htmlFor="tableType">Loại module</label>
                <TemplatePicker
                  value={template}
                  onChange={(t) => {
                    setTemplate(t)
                    setShowFields(true)
                  }}
                />
              </div>
            </div>
            {groupId === NEW_GROUP && (
              <div className="space-y-2">
                <label className={LABEL} htmlFor="groupName">Tên nhóm mới *</label>
                <input id="groupName" className={INPUT} value={groupName} onChange={(e) => setGroupName(e.target.value)} aria-invalid={!!error && !groupName.trim()} />
                {error && !groupName.trim() && <p className="text-destructive" style={SMALL_STYLE}>{error}</p>}
              </div>
            )}
          </Card>
          <Card
            title="Cấu hình trường"
            action={
              <Button type="button" variant="ghost" size="sm" className={cn(BTN7, "hover:bg-accent/50")} onClick={() => setShowFields((v) => !v)}>
                <HugeiconsIcon icon={showFields ? ArrowUp01Icon : ArrowDown01Icon} className="mr-2 h-4 w-4" />
                {showFields ? "Ẩn trường" : "Hiện trường"}
              </Button>
            }
          >
            {showFields &&
              (fields.length ? (
                <div className="space-y-2">
                  {fields.map((f) => (
                    <div key={f.name} className="flex items-center gap-3 rounded-md border px-3 py-2">
                      <FieldTypeIcon type={f.type} className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {f.label}
                        {f.required && <span className="ml-1 text-destructive">*</span>}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{f.name}</span>
                      <span className="inline-flex h-[22px] shrink-0 items-center rounded-md bg-secondary px-1.5 text-xs font-medium text-secondary-foreground">{fieldTypeLabel(f.type)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground" style={SMALL_STYLE}>Chưa có trường nào. Chọn loại module để tự động tải trường.</p>
              ))}
          </Card>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="border-input" onClick={() => onOpenChange(false)} disabled={pending}>Hủy</Button>
            <Button type="submit" size="sm" className="shadow-xs" disabled={pending}>{pending ? "Đang tạo..." : "Tạo Module"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
