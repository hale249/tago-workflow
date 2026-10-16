import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft01Icon, Copy01Icon, Delete02Icon, File02Icon, Key01Icon, MoreVerticalIcon, PencilEdit01Icon, Search01Icon, Settings01Icon, Tick02Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { CONNECTOR_ICONS, ConnectedIcon, ConnectorErrorIcon, DisconnectedIcon } from "@/components/icons"
import { ComboSelect, useTables } from "@/features/tables"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useConnector, useConnectors, useCreateConnector, useDeleteConnector, useUpdateConnector } from "../api/connectors.api"
import { ConnectorInfoDialog } from "../components/connector-info-dialog"
import { ConnectorLogo } from "../components/connector-logo"
import { MarkdownDoc } from "../components/markdown-doc"
import { connectorDoc } from "../data/connector-docs"
import { CONNECTOR_TYPES, connectorType, STATUS, type ConnectorStatus } from "../data/connector-types"

const H1_STYLE = {
  fontSize: "var(--font-heading-h1-size)",
  lineHeight: "var(--font-heading-h1-line-height)",
  fontWeight: "var(--font-heading-h1-weight)",
  letterSpacing: "var(--font-heading-h1-letter-spacing)",
  fontFamily: "var(--font-heading-h1-family)",
} as const
const SMALL_STYLE = {
  fontSize: "var(--font-body-small-size)",
  lineHeight: "var(--font-body-small-line-height)",
  fontWeight: "var(--font-body-small-weight)",
  fontFamily: "var(--font-body-small-family)",
  letterSpacing: "var(--font-body-small-letter-spacing)",
} as const
/** Types the reference catalog shows without a logo image (a plain muted tile). */
const LOGO_PLACEHOLDER = new Set(["EINVOICE_VNPT", "ACTIVE_TABLE", "AI_PROVIDER"])

/** Type glyph on a tinted tile, keyed by connector type then by its group. */
const Logo = ({ type, className }: { type: string; className?: string }) => {
  const t = connectorType(type)
  const m = CONNECTOR_ICONS[type] ?? CONNECTOR_ICONS[t?.group ?? ""] ?? CONNECTOR_ICONS.ACTIVE_TABLE
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", m.tile, className)}><HugeiconsIcon icon={m.icon} className="size-4" /></span>
}
const STATUS_ICON = { connected: ConnectedIcon, disconnected: DisconnectedIcon, error: ConnectorErrorIcon, expired: ConnectorErrorIcon } as const
/** Reference row chip: outline pill with a status glyph. */
const StatusChip = ({ s }: { s: ConnectorStatus }) => {
  const Icon = STATUS_ICON[s]
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0 text-[11px] font-medium whitespace-nowrap", s === "connected" ? "text-emerald-700 dark:text-emerald-400" : s === "disconnected" ? "text-muted-foreground" : "text-destructive")}>
      <HugeiconsIcon icon={Icon} className="size-3" /><span>{s === "connected" ? "Đã kết nối" : STATUS[s].label}</span>
    </span>
  )
}

export function ConnectorsPage() {
  const navigate = useNavigate()
  const { data: list = [], isLoading } = useConnectors()
  const del = useDeleteConnector()
  const [tab, setTab] = useState<"all" | "connected" | "not">("all")
  // "2/2 trường": required config fields filled / required fields of the type.
  const required = (c: (typeof list)[number]) => (connectorType(c.connectorType)?.fields ?? []).filter((f) => f.required)
  const filled = (c: (typeof list)[number]) => required(c).filter((f) => c.config[f.name]).length
  const fieldsDone = (c: (typeof list)[number]) => `${filled(c)}/${required(c).length} trường`
  // Like the reference, the status tabs count a connector as "connected" once its required config is complete
  // (the row chip shows the runtime/OAuth status separately).
  const isConfigured = (c: (typeof list)[number]) => filled(c) === required(c).length
  const connected = list.filter(isConfigured)
  const shown = tab === "all" ? list : tab === "connected" ? connected : list.filter((c) => !isConfigured(c))
  const tabs = [["all", "Tất cả", list.length], ["connected", "Đã kết nối", connected.length], ["not", "Chưa kết nối", list.length - connected.length]] as const

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-[var(--space-300)]">
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-200)]">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0"><h1 className="text-foreground" style={H1_STYLE}>Kết nối</h1><p className="text-[13px] text-muted-foreground">Quản lý kết nối với các dịch vụ bên ngoài</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button size="sm" className="h-7 gap-1.5 px-2.5 shadow-xs has-[>svg]:px-2" onClick={() => navigate("/workflow-connectors/select")}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />Tạo mới</Button></div>
        </header>
        <div className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <div role="group" aria-label="Trạng thái" className="flex flex-nowrap items-center gap-0.5 overflow-x-auto">
              {tabs.map(([id, label, n]) => (
                <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}
                  className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none", tab === id ? "bg-primary-subtle font-medium text-primary-subtle-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                  {label}<span className="text-[13px] text-muted-foreground tabular-nums">{n}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{shown.length} kết nối</div>
        </div>
        {isLoading && (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex min-h-14 items-center gap-3 px-3 py-2">
                <Skeleton className="size-8 rounded-md bg-muted" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-48 bg-muted" /><Skeleton className="h-3 w-32 bg-muted" /></div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !list.length && (
          <div className="flex flex-col items-center rounded-lg border px-6 py-14 text-center">
            <p className="text-sm font-medium">Chưa có connector nào</p>
            <p className="text-[13px] text-muted-foreground">Tạo connector đầu tiên để kết nối với các dịch vụ bên ngoài</p>
          </div>
        )}
        {shown.length > 0 && (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {shown.map((c) => (
              <div key={c.id} role="button" tabIndex={0} onClick={() => navigate(`/workflow-connectors/${c.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/workflow-connectors/${c.id}`)}
                className="group flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset">
                <Logo type={c.connectorType} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                  <div className="truncate text-[13px] text-muted-foreground">{connectorType(c.connectorType)?.name}</div>
                </div>
                <div className="hidden shrink-0 items-center gap-3 text-[13px] text-muted-foreground sm:flex">
                  <StatusChip s={c.status} />
                  <span className="tabular-nums">{fieldsDone(c)}</span>
                </div>
                <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground hover:bg-accent/50" aria-label="Xem chi tiết"><HugeiconsIcon icon={MoreVerticalIcon} className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => navigate(`/workflow-connectors/${c.id}`)}>Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/workflow-connectors/${c.id}`)}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá connector “${c.name}”?`) && del.mutate(c.id)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && list.length > 0 && !shown.length && (
          <div className="flex flex-col items-center rounded-lg border px-6 py-14 text-center">
            <p className="text-sm font-medium">Không tìm thấy connector</p>
            <p className="text-[13px] text-muted-foreground">Thay đổi bộ lọc để xem các connector khác</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function ConnectorSelectPage() {
  const navigate = useNavigate()
  const create = useCreateConnector()
  const [q, setQ] = useState("")
  const [pick, setPick] = useState<string | null>(null)
  const s = q.trim().toLowerCase()
  const types = CONNECTOR_TYPES.filter((t) => !s || `${t.name} ${t.description}`.toLowerCase().includes(s))
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <div className="container mx-auto space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button asChild size="icon-sm" variant="ghost" className="size-8 hover:bg-accent/50" aria-label="Quay lại"><Link to="/workflow-connectors"><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /></Link></Button>
            <div className="flex-1"><h1 className="text-foreground" style={H1_STYLE}>Chọn loại Connector</h1><p className="text-muted-foreground" style={SMALL_STYLE}>Chọn dịch vụ bạn muốn kết nối</p></div>
          </div>
          <div className="relative max-w-md">
            <HugeiconsIcon icon={Search01Icon} aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm connector..." aria-label="Tìm kiếm connector" type="text" className="h-8 py-1.5 pl-9" />
          </div>
        </div>
        {types.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {types.map((t) => (
              <button key={t.type} type="button" aria-label={`Tạo ${t.name} connector`} onClick={() => setPick(t.type)}
                className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-[var(--border-card-hover)] hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
                <span className="flex size-9 shrink-0 items-center justify-center"><ConnectorLogo type={t.type} fallback={LOGO_PLACEHOLDER.has(t.type) ? <span className="size-8 rounded-md bg-muted" /> : <Logo type={t.type} />} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{t.name}</span><span className="line-clamp-1 text-xs text-muted-foreground">{t.description}</span></span>
              </button>
            ))}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy connector</p>}
      </div>
      <ConnectorInfoDialog open={!!pick} onOpenChange={(o) => !o && setPick(null)} mode="create" initial={{ name: "", description: "" }}
        title={`Tạo ${connectorType(pick ?? "")?.name ?? ""} Connector`} pending={create.isPending}
        onSubmit={(info) => create.mutate({ ...info, connectorType: pick! }, { onSuccess: (c) => navigate(`/workflow-connectors/${c.id}`, { replace: true }) })} />
    </section>
  )
}

const card = "flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150"

/** Password input with a show/hide toggle (reference: eye button inside the field). */
function SecretInput({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} value={value} autoComplete="off" aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} className="h-8 py-1.5 pr-10" />
      <button type="button" tabIndex={-1} aria-label={show ? "Ẩn mật khẩu" : "Hiển thị khóa mã hóa"} onClick={() => setShow(!show)} className="absolute top-0 right-0 flex h-full w-8 items-center justify-center px-3">
        <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

export function ConnectorDetailPage() {
  const { connectorId = "" } = useParams()
  const navigate = useNavigate()
  const { data: c, error } = useConnector(connectorId)
  const { data: tables = [] } = useTables()
  const update = useUpdateConnector(connectorId)
  const del = useDeleteConnector()
  const [config, setConfig] = useState<Record<string, string>>({})
  const [editInfo, setEditInfo] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (c) { setConfig(c.config) } }, [c])
  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy connector. <Link to="/workflow-connectors" className="text-brand hover:underline">Quay lại</Link></p>
  if (!c) return <div className="mx-auto w-full max-w-4xl space-y-6 p-6"><Skeleton className="h-16 bg-muted" /><Skeleton className="h-64 bg-muted" /></div>
  const t = connectorType(c.connectorType)
  const missing = (t?.fields ?? []).filter((f) => f.required && !config[f.name])
  const doc = connectorDoc(c.connectorType)
  const copyId = () => navigator.clipboard?.writeText(c.id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  const save = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!missing.length) update.mutate({ config })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-4xl space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Button asChild size="icon" variant="ghost" className="mt-0.5 shrink-0 hover:bg-accent/50" aria-label="Quay lại" title="Quay lại"><Link to="/workflow-connectors"><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /></Link></Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold text-foreground">{c.name}</h1>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <code className="max-w-full min-w-0 truncate rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{c.id}</code>
                <Button size="icon-sm" variant="ghost" className="size-7 shrink-0 hover:bg-accent/50" title="Sao chép ID" aria-label="Sao chép ID" onClick={copyId}><HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-4" /></Button>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label="Cài đặt" title="Cài đặt" onClick={() => setEditInfo(true)}><HugeiconsIcon icon={Settings01Icon} className="size-4" /></Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2.5 text-muted-foreground has-[>svg]:px-2 hover:bg-destructive/10 hover:text-destructive [&_svg:not([class*='size-'])]:size-3.5" onClick={() => setConfirmDelete(true)}><HugeiconsIcon icon={Delete02Icon} />Xóa</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            <Button size="sm" variant="outline" className="h-7 w-full gap-1.5 px-2.5 text-destructive" onClick={() => setConfirmDelete(true)}><HugeiconsIcon icon={Delete02Icon} className="size-3.5" />Xóa</Button>
            <Button size="sm" variant="outline" className="h-7 w-full gap-1.5 px-2.5" onClick={() => setEditInfo(true)}><HugeiconsIcon icon={Settings01Icon} className="size-3.5" />Cài đặt</Button>
          </div>
        </div>

        <div className={card}>
          <div className="flex flex-col gap-3 px-5 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm leading-5 font-semibold">Cấu hình kỹ thuật</h2>
            {t?.oauth && <Button size="sm" className="h-7 gap-1.5 px-2.5" disabled title="Cần backend OAuth"><HugeiconsIcon icon={Key01Icon} className="size-3.5" />Kết nối OAuth</Button>}
          </div>
          <div className="px-5">
            {t ? (
              <form className="space-y-4" onSubmit={save} noValidate>
                {t.fields.map((f) => {
                  const id = `field-${f.name}`
                  const invalid = touched && f.required && !config[f.name]
                  const set = (v: string) => setConfig({ ...config, [f.name]: v })
                  return (
                    <div key={f.name} className="space-y-2 leading-5">
                      <label htmlFor={id} className="text-sm leading-none font-medium">{f.label}{f.required && <span className="ml-1 text-destructive">*</span>}</label>
                      {f.type === "table" ? <ComboSelect id={id} value={config[f.name] ?? ""} onChange={set} invalid={invalid} placeholder="Chọn bảng" options={tables.map((x) => ({ value: x.id, text: x.name }))} />
                        : f.type === "password" ? <SecretInput id={id} value={config[f.name] ?? ""} onChange={set} invalid={invalid} />
                        : <Input id={id} type={f.type === "number" ? "number" : "text"} value={config[f.name] ?? ""} autoComplete="off" aria-invalid={invalid || undefined} onChange={(e) => set(e.target.value)} className="h-8 py-1.5" />}
                      {invalid && <p className="text-xs text-destructive">{f.label} là bắt buộc</p>}
                    </div>
                  )
                })}
                <div className="grid grid-cols-1 pt-4 sm:flex sm:justify-end">
                  <Button type="submit" size="sm" className="w-full shadow-xs sm:w-auto" disabled={update.isPending}>{update.isPending ? "Đang lưu..." : "Lưu cấu hình"}</Button>
                </div>
              </form>
            ) : <p className="text-sm text-destructive">Không tìm thấy cấu hình cho loại connector này.</p>}
          </div>
        </div>

        <div className={card}>
          <div className="px-5 pb-1"><h2 className="flex items-center gap-2 text-sm leading-5 font-semibold"><HugeiconsIcon icon={File02Icon} className="size-5" />Tài liệu</h2></div>
          <div className="px-5">{doc ? <MarkdownDoc source={doc} /> : <p className="text-sm text-muted-foreground">Không có tài liệu hướng dẫn cho connector này.</p>}</div>
        </div>
      </div>

      <ConnectorInfoDialog open={editInfo} onOpenChange={setEditInfo} mode="edit" initial={{ name: c.name, description: c.description }} title="Chỉnh sửa Connector"
        pending={update.isPending} onSubmit={(info) => update.mutate(info, { onSuccess: () => setEditInfo(false) })} />
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Xác nhận xóa connector</DialogTitle><DialogDescription>Connector “{c.name}” sẽ bị xóa vĩnh viễn. Các workflow đang dùng connector này sẽ không chạy được.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Hủy</Button>
            <Button variant="destructive" disabled={del.isPending} onClick={() => del.mutate(c.id, { onSuccess: () => navigate("/workflow-connectors", { replace: true }) })}>{del.isPending ? "Đang xóa..." : "Xóa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
