import { useState } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { AtIcon, Mail01Icon, Tick02Icon, TickDouble02Icon } from "@hugeicons/core-free-icons"
import { CalendarSmallIcon, OwnerIcon, PeopleIcon, StarOutlineIcon } from "@/components/icons"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { usePendingInvitationCount } from "@/features/invitations"

/** Reference type ramp, applied inline exactly like the reference markup. */
const H1_STYLE = { fontSize: "var(--font-heading-h1-size)", lineHeight: "var(--font-heading-h1-line-height)", fontWeight: "var(--font-heading-h1-weight)", letterSpacing: "var(--font-heading-h1-letter-spacing)", fontFamily: "var(--font-heading-h1-family)" }
const BODY_STYLE = { fontSize: "var(--font-body-default-size)", lineHeight: "var(--font-body-default-line-height)", fontWeight: "var(--font-weight-regular, 400)", fontFamily: "var(--font-body-default-family)", letterSpacing: "var(--font-body-default-letter-spacing)" }

const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
/** Reference workspaces (beqeek.com/workspaces): avatar gradients are BA cyan #22D3EE→#06B6D4, MA orange #FB923C→#F97316. */
const WORKSPACES = [
  { id: "bm-agency", name: "BM Agency", handle: "bmagency", owner: "Bảo Châu", mine: true, createdAt: "2026-03-09", colors: ["#22D3EE", "#06B6D4"] },
  { id: "motor-anh-quoc", name: "Motor Anh Quốc", handle: "motor_anh_quoc", owner: "Bảo Châu", mine: false, createdAt: "2026-03-15", colors: ["#FB923C", "#F97316"] },
]
/** "Motor Anh Quốc" -> "MA" */
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()

/** Same generated SVG avatar as the reference: 128-unit rounded square, linear gradient, system-ui 51/600 initials. */
function WorkspaceAvatar({ id, name, colors }: { id: string; name: string; colors: string[] }) {
  const grad = `ws-grad-${id}`
  return (
    <svg role="img" aria-label={name} viewBox="0 0 128 128" className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-border">
      <defs>
        <linearGradient id={grad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="19.2" fill={`url(#${grad})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="51" fontWeight="600" fill="white">{initials(name)}</text>
    </svg>
  )
}

/** Workspace dashboard: one card per workspace the user belongs to (reference card grid). */
export function DashboardPage() {
  const [starred, setStarred] = useState<string[]>([])
  const pending = usePendingInvitationCount()
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-[var(--space-400)]">
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-500)]">
        <div className="flex flex-col items-stretch justify-start gap-[var(--space-050)]">
          <h1 className="text-foreground" style={H1_STYLE}>Bảng điều khiển Workspace</h1>
          <p className="text-muted-foreground" style={BODY_STYLE}>{WORKSPACES.length} workspace đang hoạt động</p>
        </div>
        {pending > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-5 py-5 shadow-sm sm:flex-row sm:items-center">
            <div className="grid flex-1 gap-1">
              <p className="flex items-center gap-2 text-base font-semibold"><HugeiconsIcon icon={Mail01Icon} className="size-4" />Đang chờ tham gia</p>
              <p className="text-[13px] text-muted-foreground">Các workspace đã mời bạn và đang chờ phản hồi. Xem lại lời mời để tham gia hoặc từ chối.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="w-fit"><Link to="/invitations"><HugeiconsIcon icon={Mail01Icon} />Xem lời mời</Link></Button>
          </div>
        )}
        <div className="grid grid-cols-12 items-stretch justify-items-stretch gap-[var(--space-300)]">
          {WORKSPACES.map((w) => {
            const on = starred.includes(w.id)
            return (
              <div key={w.id} className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3">
                <Link to="/tables" className="group relative flex h-full cursor-pointer flex-col gap-4 rounded-lg border border-[var(--border-card)] bg-surface-elevated py-5 text-card-foreground shadow-surface transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--border-card-hover)] hover:shadow-surface-hover active:translate-y-0 active:border-[var(--border-card-active)] active:shadow-surface-active">
                  <button type="button" aria-label={on ? "Bỏ yêu thích" : "Thêm vào yêu thích"} aria-pressed={on}
                    onClick={(e) => { e.preventDefault(); setStarred(on ? starred.filter((x) => x !== w.id) : [...starred, w.id]) }}
                    className={cn("absolute top-3 right-3 z-10 rounded-md p-1.5 transition-opacity duration-200 hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", on ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <HugeiconsIcon icon={StarOutlineIcon} className={cn("size-3.5", on ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} />
                  </button>
                  <div className="flex flex-row items-start gap-3 px-5 pt-4 pr-10 pb-3">
                    <WorkspaceAvatar id={w.id} name={w.name} colors={w.colors} />
                    <div className="min-w-0 grow space-y-1">
                      <h3 className="truncate text-base leading-tight font-semibold">{w.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">@{w.handle}</p>
                      {w.mine && (
                        <span className="mt-1.5 inline-flex h-5 max-w-full items-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
                          <HugeiconsIcon icon={OwnerIcon} className="mr-1 size-3 shrink-0" /><span className="truncate">Chủ sở hữu</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 px-5 pt-0 pb-4 text-xs">
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><HugeiconsIcon icon={PeopleIcon} className="size-3.5 shrink-0" /><span className="truncate text-foreground">{w.owner}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><HugeiconsIcon icon={CalendarSmallIcon} className="size-3.5 shrink-0" /><span>Tạo lúc {day.format(new Date(w.createdAt))}</span></div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

type Notice = { id: string; title: string; body: string; at: string; read: boolean; mentioned?: boolean; link?: string }
const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const useNotices = create<{ items: Notice[] }>()(persist(() => ({
  items: [
    { id: "n1", title: "Bạn được giao một công việc", body: "“Gửi báo giá” — hạn trong 2 ngày", at: ago(2), read: false, link: "/tables/t_tasks" },
    { id: "n2", title: "Bạn được nhắc tên", body: "Nguyễn Thị Lan đã nhắc bạn trong bình luận trên Công ty Minh Phát", at: ago(20), read: false, mentioned: true, link: "/tables/t_customers/records/t_customers_r1" },
    { id: "n3", title: "Đơn hàng hoàn thành", body: "DH000004 đã chuyển sang Hoàn thành", at: ago(50), read: true, link: "/tables/t_orders" },
  ] as Notice[],
}), { name: "tago-notifications", version: 2, migrate: () => ({}) as never }))
/** Unread count for the sidebar badge. */
export const useUnreadNotifications = () => useNotices((s) => s.items.filter((n) => !n.read).length)
const rel = new Intl.RelativeTimeFormat("vi", { numeric: "auto" })
const ago2 = (iso: string) => { const h = Math.round((Date.parse(iso) - Date.now()) / 3_600_000); return Math.abs(h) < 24 ? rel.format(h, "hour") : rel.format(Math.round(h / 24), "day") }

const FILTERS = [["all", "Tất cả"], ["unread", "Chưa đọc"], ["read", "Đã đọc"]] as const

/** Reference /notifications: centered max-w-2xl column, segmented read filter + "Được nhắc tên" toggle. */
export function NotificationsPage() {
  const items = useNotices((s) => s.items)
  const [tab, setTab] = useState<(typeof FILTERS)[number][0]>("all")
  const [mentioned, setMentioned] = useState(false)
  const list = items.filter((n) => (tab === "all" || (tab === "unread" ? !n.read : n.read)) && (!mentioned || n.mentioned))
  const mark = (id: string) => useNotices.setState((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  const unread = items.filter((n) => !n.read).length
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground" style={H1_STYLE}>Thông báo</h1>
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => useNotices.setState((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }))}>
              <HugeiconsIcon icon={TickDouble02Icon} className="size-3.5" />Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <div role="none" className="h-px w-full shrink-0 bg-border/80" />
        <div className="px-6 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Thông báo" className="flex flex-nowrap items-center gap-0.5 overflow-x-auto">
              {FILTERS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)}
                  className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    tab === k ? "bg-primary-subtle font-medium text-primary-subtle-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                  {l}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" aria-pressed={mentioned} onClick={() => setMentioned(!mentioned)}
              className={cn("h-8 gap-1.5 px-2.5 text-xs has-[>svg]:px-2", mentioned && "border-primary/40 bg-primary-subtle text-primary-subtle-foreground hover:bg-primary-subtle")}>
              <HugeiconsIcon icon={AtIcon} className="size-3.5" />Được nhắc tên
            </Button>
          </div>
        </div>
        <div role="none" className="h-px w-full shrink-0 bg-border/80" />
        {!list.length ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 text-4xl">🔔</div>
            <p className="text-sm font-medium text-foreground">Không có thông báo nào</p>
            <p className="mt-1 text-xs text-muted-foreground">Các thông báo mới sẽ xuất hiện tại đây</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/80">
            {list.map((n) => (
              <li key={n.id} className={cn("group flex items-start gap-3 px-6 py-3 transition-colors hover:bg-accent/60", !n.read && "bg-primary-subtle/40")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                <Link to={n.link ?? "#"} onClick={() => mark(n.id)} className="min-w-0 flex-1">
                  <p className={cn("text-sm text-foreground", !n.read && "font-medium")}>{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ago2(n.at)}</p>
                </Link>
                {!n.read && <Button size="icon-sm" variant="ghost" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label="Đánh dấu đã đọc" onClick={() => mark(n.id)}><HugeiconsIcon icon={Tick02Icon} /></Button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
