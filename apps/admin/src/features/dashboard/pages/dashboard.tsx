import { useState } from "react"
import { Link } from "react-router"
import { Bell, Building2, Check, CheckCheck, Crown } from "lucide-react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const day = new Intl.DateTimeFormat("vi-VN")
const WORKSPACES = [
  { id: "evergreen", name: "Evergreen", handle: "evergreen", owner: "Louis Cooper", mine: true, createdAt: "2026-03-09", color: "from-emerald-400 to-teal-600" },
  { id: "crestview", name: "Crestview", handle: "crestview", owner: "Louis Cooper", mine: false, createdAt: "2026-03-15", color: "from-sky-400 to-blue-600" },
]

/** Workspace dashboard: one row per workspace the user belongs to. */
export function DashboardPage() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <h1 className="text-2xl font-semibold">Bảng điều khiển Workspace</h1>
      <p className="text-sm text-muted-foreground">{WORKSPACES.length} workspace đang hoạt động</p>
      <div className="mt-5 divide-y rounded-lg border">
        {WORKSPACES.map((w) => (
          <Link key={w.id} to="/tables" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
            <span className={cn("grid size-10 place-items-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white", w.color)}>{w.name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">{w.name}{w.mine && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Crown className="size-3" />Chủ sở hữu</span>}</p>
              <p className="text-xs text-muted-foreground">@{w.handle}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground max-sm:hidden"><p className="flex items-center justify-end gap-1"><Building2 className="size-3" />{w.owner}</p><p>Tạo lúc {day.format(new Date(w.createdAt))}</p></div>
          </Link>
        ))}
      </div>
    </section>
  )
}

type Notice = { id: string; title: string; body: string; at: string; read: boolean; link?: string }
const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const useNotices = create<{ items: Notice[] }>()(persist(() => ({
  items: [
    { id: "n1", title: "Bạn được giao một công việc", body: "“Gửi báo giá” — hạn trong 2 ngày", at: ago(2), read: false, link: "/tables/t_tasks" },
    { id: "n2", title: "Bình luận mới", body: "Nguyễn Thị Lan đã bình luận trên Công ty Minh Phát", at: ago(20), read: false, link: "/tables/t_customers/records/t_customers_r1" },
    { id: "n3", title: "Đơn hàng hoàn thành", body: "DH000004 đã chuyển sang Hoàn thành", at: ago(50), read: true, link: "/tables/t_orders" },
  ] as Notice[],
}), { name: "tago-notifications", version: 1 }))
/** Unread count for the sidebar badge. */
export const useUnreadNotifications = () => useNotices((s) => s.items.filter((n) => !n.read).length)
const rel = new Intl.RelativeTimeFormat("vi", { numeric: "auto" })
const ago2 = (iso: string) => { const h = Math.round((Date.parse(iso) - Date.now()) / 3_600_000); return Math.abs(h) < 24 ? rel.format(h, "hour") : rel.format(Math.round(h / 24), "day") }

export function NotificationsPage() {
  const items = useNotices((s) => s.items)
  const [tab, setTab] = useState<"all" | "unread" | "read">("all")
  const list = items.filter((n) => tab === "all" || (tab === "unread" ? !n.read : n.read))
  const mark = (id: string) => useNotices.setState((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  const unread = items.filter((n) => !n.read).length
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-background p-5">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-semibold">Thông báo</h1>
        <Button size="sm" variant="outline" disabled={!unread} onClick={() => useNotices.setState((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }))}><CheckCheck />Đánh dấu đã đọc tất cả</Button>
      </div>
      <div className="mt-4 flex gap-1 border-b">
        {([["all", "Tất cả"], ["unread", `Chưa đọc${unread ? ` (${unread})` : ""}`], ["read", "Đã đọc"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === k ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </div>
      {!list.length ? (
        <div className="grid place-items-center gap-2 py-20 text-center text-sm text-muted-foreground"><Bell className="size-8" /><p className="font-medium text-foreground">Không có thông báo nào</p>Các thông báo mới sẽ xuất hiện tại đây</div>
      ) : (
        <ul className="mt-2 divide-y">
          {list.map((n) => (
            <li key={n.id} className={cn("group flex items-start gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted/60", !n.read && "bg-brand/5")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
              <Link to={n.link ?? "#"} onClick={() => mark(n.id)} className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                <p className="truncate text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{ago2(n.at)}</p>
              </Link>
              {!n.read && <Button size="icon-sm" variant="ghost" className="opacity-0 group-hover:opacity-100" aria-label="Đánh dấu đã đọc" onClick={() => mark(n.id)}><Check /></Button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
