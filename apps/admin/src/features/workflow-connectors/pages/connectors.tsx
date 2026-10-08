import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Check, ChevronLeft, Copy, KeyRound, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useConnector, useConnectors, useCreateConnector, useDeleteConnector, useUpdateConnector } from "../api/connectors.api"
import { CONNECTOR_TYPES, connectorType, STATUS, type ConnectorStatus } from "../data/connector-types"

const area = "rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
const Logo = ({ type, className }: { type: string; className?: string }) => (
  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-semibold text-brand", className)}>{(connectorType(type)?.name ?? type).slice(0, 2).toUpperCase()}</span>
)
const Badge = ({ s }: { s: ConnectorStatus }) => <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS[s].cls)}>{STATUS[s].label}</span>

export function ConnectorsPage() {
  const navigate = useNavigate()
  const { data: list = [], isLoading } = useConnectors()
  const del = useDeleteConnector()
  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const shown = list.filter((c) => (!type || c.connectorType === type) && (!status || (status === "connected" ? c.status === "connected" : c.status !== "connected")) && `${c.name} ${c.description}`.toLowerCase().includes(q.trim().toLowerCase()))
  const stats = [["Connectors", list.length], ["Đã kết nối", list.filter((c) => c.status === "connected").length], ["OAuth", list.filter((c) => connectorType(c.connectorType)?.oauth).length]] as const

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-semibold">Kết nối</h1><p className="text-sm text-muted-foreground">Quản lý kết nối với các dịch vụ bên ngoài</p></div>
        <Button onClick={() => navigate("/workflow-connectors/select")}><Plus />Tạo mới</Button>
      </header>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map(([l, n]) => <div key={l} className="rounded-lg border p-3"><p className="text-2xl font-semibold tabular-nums">{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-64"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm connector..." className="h-9 pl-8" /></div>
        <select className="h-9 rounded-md border px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Loại">
          <option value="">Mọi loại</option>{[...new Set(list.map((c) => c.connectorType))].map((t) => <option key={t} value={t}>{connectorType(t)?.name ?? t}</option>)}
        </select>
        <select className="h-9 rounded-md border px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Trạng thái">
          <option value="">Tất cả</option><option value="connected">Đã kết nối</option><option value="not">Chưa kết nối</option>
        </select>
      </div>
      {isLoading && <Skeleton className="mt-4 h-24" />}
      {!isLoading && !list.length && <div className="mt-6 rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground"><p className="font-medium text-foreground">Chưa có connector nào</p>Tạo connector đầu tiên để kết nối với các dịch vụ bên ngoài</div>}
      {!isLoading && list.length > 0 && !shown.length && <p className="mt-10 text-center text-sm text-muted-foreground">Không tìm thấy connector — thay đổi bộ lọc để xem các connector khác</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => (
          <div key={c.id} className="rounded-lg border p-4 hover:border-brand/40">
            <div className="flex items-start gap-3">
              <Logo type={c.connectorType} />
              <div className="min-w-0 flex-1"><Link to={`/workflow-connectors/${c.id}`} className="block truncate font-medium hover:underline">{c.name}</Link><p className="truncate text-xs text-muted-foreground">{connectorType(c.connectorType)?.name}</p></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Mở menu"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate(`/workflow-connectors/${c.id}`)}>Xem chi tiết</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate(`/workflow-connectors/${c.id}`)}><Pencil />Chỉnh sửa</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá connector “${c.name}”?`) && del.mutate(c.id)}><Trash2 />Xóa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs"><Badge s={c.status} />{connectorType(c.connectorType)?.oauth && <span className="rounded border px-1.5">OAuth</span>}</div>
          </div>
        ))}
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
      <div className="flex items-center gap-2"><Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to="/workflow-connectors"><ChevronLeft /></Link></Button>
        <div><h1 className="text-xl font-semibold">Chọn loại Connector</h1><p className="text-sm text-muted-foreground">Chọn dịch vụ bạn muốn kết nối</p></div></div>
      <div className="relative mt-4 w-full max-w-80"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm connector..." className="h-9 pl-8" /></div>
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
        <Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to="/workflow-connectors"><ChevronLeft /></Link></Button>
        <Logo type={c.connectorType} className="size-11" />
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-semibold">{c.name}</h1><p className="flex items-center gap-2 text-sm text-muted-foreground">{t?.name}<Badge s={c.status} /></p></div>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(c.id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>{copied ? <Check /> : <Copy />}{copied ? "Đã sao chép" : "Sao chép ID"}</Button>
        <Button size="sm" variant="outline" onClick={() => setEditInfo(true)}><Pencil />Chỉnh sửa</Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => window.confirm("Xác nhận xóa connector?") && del.mutate(c.id, { onSuccess: () => navigate("/workflow-connectors", { replace: true }) })}><Trash2 />{del.isPending ? "Đang xóa..." : "Xóa"}</Button>
      </div>
      {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold">Cấu hình kỹ thuật</h2>
          {t?.oauth && (
            <div className="flex items-center gap-3 rounded-lg bg-brand/5 p-3 text-sm">
              <Link2 className="size-5 text-brand" />
              <p className="flex-1">Loại này kết nối qua <b>OAuth</b>: bấm kết nối để đăng nhập dịch vụ và cấp quyền. Cần backend để hoàn tất — tạm thời có thể dán token thủ công bên dưới.</p>
              <Button size="sm" disabled title="Cần backend OAuth"><KeyRound />Kết nối OAuth</Button>
            </div>
          )}
          {(t?.fields ?? []).map((f) => (
            <label key={f.name} className="grid gap-1.5 text-sm">
              <span className="font-medium">{f.label}{f.required && <span className="text-destructive"> *</span>} <span className="font-mono text-xs font-normal text-muted-foreground">{f.name}</span></span>
              <Input type={f.type === "password" ? "password" : f.type === "number" ? "number" : "text"} value={config[f.name] ?? ""} autoComplete="off" onChange={(e) => setConfig({ ...config, [f.name]: e.target.value })} />
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
