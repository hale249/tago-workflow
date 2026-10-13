import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft01Icon, Copy01Icon, Delete02Icon, Key01Icon, Link01Icon, MoreVerticalIcon, PencilEdit01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { CONNECTOR_ICONS, ConnectedIcon, ConnectorErrorIcon, DisconnectedIcon } from "@/components/icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useConnector, useConnectors, useCreateConnector, useDeleteConnector, useUpdateConnector } from "../api/connectors.api"
import { CONNECTOR_TYPES, connectorType, STATUS, type ConnectorStatus } from "../data/connector-types"

const area = "rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
/** Type glyph on a tinted tile, keyed by connector type then by its group. */
const Logo = ({ type, className }: { type: string; className?: string }) => {
  const t = connectorType(type)
  const m = CONNECTOR_ICONS[type] ?? CONNECTOR_ICONS[t?.group ?? ""] ?? CONNECTOR_ICONS.ACTIVE_TABLE
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", m.tile, className)}><HugeiconsIcon icon={m.icon} className="size-4" /></span>
}
const Badge = ({ s }: { s: ConnectorStatus }) => <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS[s].cls)}>{STATUS[s].label}</span>
const STATUS_ICON = { connected: ConnectedIcon, disconnected: DisconnectedIcon, error: ConnectorErrorIcon, expired: ConnectorErrorIcon } as const
/** Reference row chip: outline pill with a status glyph. */
const StatusChip = ({ s }: { s: ConnectorStatus }) => {
  const Icon = STATUS_ICON[s]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", s === "connected" ? "text-emerald-700 dark:text-emerald-400" : s === "disconnected" ? "text-muted-foreground" : "text-destructive")}>
      <HugeiconsIcon icon={Icon} className="size-3.5" />{s === "connected" ? "Đã kết nối" : STATUS[s].label}
    </span>
  )
}

export function ConnectorsPage() {
  const navigate = useNavigate()
  const { data: list = [], isLoading } = useConnectors()
  const del = useDeleteConnector()
  const [tab, setTab] = useState<"all" | "connected" | "not">("all")
  const connected = list.filter((c) => c.status === "connected")
  const shown = tab === "all" ? list : tab === "connected" ? connected : list.filter((c) => c.status !== "connected")
  const tabs = [["all", "Tất cả", list.length], ["connected", "Đã kết nối", connected.length], ["not", "Chưa kết nối", list.length - connected.length]] as const
  // "2/2 trường": required config fields filled / required fields of the type.
  const fieldsDone = (c: (typeof list)[number]) => {
    const req = (connectorType(c.connectorType)?.fields ?? []).filter((f) => f.required)
    return `${req.filter((f) => c.config[f.name]).length}/${req.length} trường`
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-6">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0"><h1 className="text-2xl font-semibold">Kết nối</h1><p className="text-[13px] text-muted-foreground">Quản lý kết nối với các dịch vụ bên ngoài</p></div>
          <Button size="sm" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" onClick={() => navigate("/workflow-connectors/select")}><HugeiconsIcon icon={Add01Icon} />Tạo mới</Button>
        </header>
        <div className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" className="flex flex-nowrap items-center gap-0.5 overflow-x-auto">
            {tabs.map(([id, label, n]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors", tab === id ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground")}>
                {label}<span className="text-[13px] text-muted-foreground tabular-nums">{n}</span>
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{shown.length} kết nối</span>
        </div>
        {isLoading && <Skeleton className="h-24" />}
        {!isLoading && !list.length && (
          <div className="flex flex-col items-center rounded-lg border px-6 py-14 text-center">
            <p className="text-sm font-medium">Chưa có connector nào</p>
            <p className="text-[13px] text-muted-foreground">Tạo connector đầu tiên để kết nối với các dịch vụ bên ngoài</p>
          </div>
        )}
        {shown.length > 0 && (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {shown.map((c) => (
              <div key={c.id} role="link" tabIndex={0} onClick={() => navigate(`/workflow-connectors/${c.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/workflow-connectors/${c.id}`)}
                className="group flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset">
                <Logo type={c.connectorType} />
                <div className="min-w-0 flex-1">
                  <Link to={`/workflow-connectors/${c.id}`} onClick={(e) => e.stopPropagation()} className="block truncate text-sm font-medium">{c.name}</Link>
                  <p className="truncate text-[13px] text-muted-foreground">{connectorType(c.connectorType)?.name}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 text-[13px] text-muted-foreground sm:flex">
                  <StatusChip s={c.status} />
                  <span className="tabular-nums">{fieldsDone(c)}</span>
                </div>
                <div className="shrink-0 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Mở menu"><HugeiconsIcon icon={MoreVerticalIcon} /></Button></DropdownMenuTrigger>
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
        {!isLoading && list.length > 0 && !shown.length && <p className="py-10 text-center text-sm text-muted-foreground">Không có kết nối nào trong mục này</p>}
      </div>
    </section>
  )
}

export function ConnectorSelectPage() {
  const navigate = useNavigate()
  const create = useCreateConnector()
  const [q, setQ] = useState("")
  const [pick, setPick] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const types = CONNECTOR_TYPES.filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <div className="flex items-center gap-2"><Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to="/workflow-connectors"><HugeiconsIcon icon={ArrowLeft01Icon} /></Link></Button>
        <div><h1 className="text-xl font-semibold">Chọn loại Connector</h1><p className="text-sm text-muted-foreground">Chọn dịch vụ bạn muốn kết nối</p></div></div>
      <div className="relative mt-4 w-full max-w-80"><HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm connector..." className="h-9 pl-8" /></div>
      {[...new Set(types.map((t) => t.group))].map((g) => (
        <div key={g} className="mt-5">
          <p className="mb-2 text-sm font-semibold">{g}</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {types.filter((t) => t.group === g).map((t) => (
              <button key={t.type} type="button" onClick={() => { setPick(t.type); setName(t.name); setDescription("") }} className="flex items-start gap-3 rounded-lg border p-3 text-left hover:border-brand/40 hover:bg-muted/40">
                <Logo type={t.type} /><span className="min-w-0"><span className="block text-sm font-medium">{t.name}</span><span className="block text-xs text-muted-foreground">{t.description}</span></span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {!types.length && <p className="mt-8 text-center text-sm text-muted-foreground">Không tìm thấy connector</p>}
      <Dialog open={!!pick} onOpenChange={(o) => !o && setPick(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Tạo Connector · {connectorType(pick ?? "")?.name}</DialogTitle><DialogDescription>Nhập tên định danh và mô tả cho connector mới</DialogDescription></DialogHeader>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Tên định danh *</span><Input value={name} maxLength={100} placeholder="VD: Email Marketing" onChange={(e) => setName(e.target.value)} /></label>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Mô tả</span><textarea rows={3} maxLength={500} value={description} placeholder="Mục đích sử dụng connector này..." onChange={(e) => setDescription(e.target.value)} className={area} /></label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPick(null)}>Hủy</Button>
            <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate({ name, description, connectorType: pick! }, { onSuccess: (c) => navigate(`/workflow-connectors/${c.id}`, { replace: true }) })}>{create.isPending ? "Đang tạo..." : "Tạo Connector"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function ConnectorDetailPage() {
  const { connectorId = "" } = useParams()
  const navigate = useNavigate()
  const { data: c, error } = useConnector(connectorId)
  const update = useUpdateConnector(connectorId)
  const del = useDeleteConnector()
  const [config, setConfig] = useState<Record<string, string>>({})
  const [info, setInfo] = useState({ name: "", description: "" })
  const [editInfo, setEditInfo] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (c) { setConfig(c.config); setInfo({ name: c.name, description: c.description }) } }, [c])
  if (error) return <p className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy connector. <Link to="/workflow-connectors" className="text-brand hover:underline">Quay lại</Link></p>
  if (!c) return <Skeleton className="h-full w-full rounded-lg" />
  const t = connectorType(c.connectorType)
  const missing = (t?.fields ?? []).filter((f) => f.required && !config[f.name])

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to="/workflow-connectors"><HugeiconsIcon icon={ArrowLeft01Icon} /></Link></Button>
        <Logo type={c.connectorType} className="size-11" />
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-semibold">{c.name}</h1><p className="flex items-center gap-2 text-sm text-muted-foreground">{t?.name}<Badge s={c.status} /></p></div>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(c.id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>{copied ? <HugeiconsIcon icon={Tick02Icon} /> : <HugeiconsIcon icon={Copy01Icon} />}{copied ? "Đã sao chép" : "Sao chép ID"}</Button>
        <Button size="sm" variant="outline" onClick={() => setEditInfo(true)}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => window.confirm("Xác nhận xóa connector?") && del.mutate(c.id, { onSuccess: () => navigate("/workflow-connectors", { replace: true }) })}><HugeiconsIcon icon={Delete02Icon} />{del.isPending ? "Đang xóa..." : "Xóa"}</Button>
      </div>
      {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold">Cấu hình kỹ thuật</h2>
          {t?.oauth && (
            <div className="flex items-center gap-3 rounded-lg bg-brand/5 p-3 text-sm">
              <HugeiconsIcon icon={Link01Icon} className="size-5 text-brand" />
              <p className="flex-1">Loại này kết nối qua <b>OAuth</b>: bấm kết nối để đăng nhập dịch vụ và cấp quyền. Cần backend để hoàn tất — tạm thời có thể dán token thủ công bên dưới.</p>
              <Button size="sm" disabled title="Cần backend OAuth"><HugeiconsIcon icon={Key01Icon} />Kết nối OAuth</Button>
            </div>
          )}
          {(t?.fields ?? []).map((f) => (
            <label key={f.name} className="grid gap-1.5 text-sm">
              <span className="font-medium">{f.label}{f.required && <span aria-hidden className="text-destructive"> *</span>} <span aria-hidden className="font-mono text-xs font-normal text-muted-foreground">{f.name}</span></span>
              <Input type={f.type === "password" ? "password" : f.type === "number" ? "number" : "text"} required={f.required} value={config[f.name] ?? ""} autoComplete="off" onChange={(e) => setConfig({ ...config, [f.name]: e.target.value })} />
            </label>
          ))}
          {!t && <p className="text-sm text-destructive">Không tìm thấy cấu hình cho loại connector này.</p>}
          <div className="flex items-center gap-3">
            <Button disabled={update.isPending || JSON.stringify(config) === JSON.stringify(c.config)} onClick={() => update.mutate({ config })}>{update.isPending ? "Đang lưu..." : "Lưu cấu hình"}</Button>
            {missing.length > 0 && <span className="text-xs text-muted-foreground">Còn thiếu: {missing.map((f) => f.label).join(", ")} (bắt buộc)</span>}
          </div>
        </div>
        <aside className="space-y-3 rounded-lg border p-5 text-sm">
          <h2 className="font-semibold">Tài liệu</h2>
          <p className="text-muted-foreground">{t?.description}.</p>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
            {t?.oauth ? <><li>Bấm “Kết nối OAuth” và đăng nhập tài khoản dịch vụ.</li><li>Chọn trang / tài khoản cần cấp quyền.</li><li>Quay lại đây, trạng thái chuyển “Đang hoạt động”.</li></>
              : <><li>Lấy thông tin truy cập từ trang quản trị của dịch vụ.</li><li>Điền các ô bắt buộc (*) rồi bấm “Lưu cấu hình”.</li><li>Dùng connector này trong các node Cloud Logic.</li></>}
          </ol>
          <p className="border-t pt-3 font-mono text-xs text-muted-foreground">ID: {c.id}</p>
        </aside>
      </div>

      <Dialog open={editInfo} onOpenChange={setEditInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Chỉnh sửa Connector</DialogTitle><DialogDescription>Cập nhật thông tin connector</DialogDescription></DialogHeader>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Tên định danh *</span><Input value={info.name} maxLength={100} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></label>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Mô tả</span><textarea rows={3} maxLength={500} value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} className={area} /></label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditInfo(false)}>Hủy</Button>
            <Button disabled={!info.name.trim() || update.isPending} onClick={() => update.mutate(info, { onSuccess: () => setEditInfo(false) })}>{update.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
