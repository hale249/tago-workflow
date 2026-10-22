import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, InboxIcon, MessageMultiple01Icon, PinIcon, Search01Icon, Settings02Icon } from "@hugeicons/core-free-icons"

import { ComboSelect } from "@workspace/ui/components/combo-select"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useWorkspaceUsers } from "@/features/tables"
import { CHANNEL_IDS, CHANNELS } from "../data/channels"
import { channelOfPage, useSocialStore } from "../store/social.store"
import type { Channel } from "../types/social"
import { CHAT_THEME, initialOf, isOnline, relTime } from "./chat-theme"
import { ConversationPane } from "./conversation-pane"

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

/** "Tất cả / Chưa đọc" pills + assignee filter, shared by both list layouts. */
function ListFilters({ filter, setFilter, assignee, setAssignee, assigneeOptions }: {
  filter: "all" | "unread"; setFilter: (f: "all" | "unread") => void; assignee: string; setAssignee: (v: string) => void; assigneeOptions: { value: string; text: string }[]
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex shrink-0 gap-0.5 rounded-full border border-border bg-muted/40 p-0.5">
        {([["all", "Tất cả"], ["unread", "Chưa đọc"]] as const).map(([id, l]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id}
            className={cn("rounded-full px-3 py-0.5 text-xs font-semibold transition-colors", filter === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </div>
      <ComboSelect value={assignee} onChange={setAssignee} clearable placeholder="Tất cả phụ trách" className="h-7 text-xs" aria-label="Lọc theo người phụ trách"
        options={[{ value: "none", text: "Chưa phân công" }, ...assigneeOptions]} />
    </div>
  )
}

/**
 * Inbox. Facebook follows the reference "lunar" inbox (titled list with a + menu, first conversation open);
 * Instagram / WhatsApp / Zalo follow the reference picker layout: connection, then page / account / number / OA,
 * then the conversation list. The bare /social-chat route keeps the cross-channel view (channel chips).
 */
export function ChatView({ channel, onChannelChange, onOpenSettings }: { channel: Channel | ""; onChannelChange: (c: Channel | "") => void; onOpenSettings: () => void }) {
  const { connections, pages, conversations, messages, settings, markRead } = useSocialStore()
  const { data: users = [] } = useWorkspaceUsers()
  const lunar = channel === "facebook"
  const chOf = (pid: string) => channelOfPage({ pages, connections }, pid)
  const channelConnections = connections.filter((c) => c.channel === channel)
  // Pre-select the first connection / account so seeded conversations show; clearing them shows the reference empty state.
  const [connectionId, setConnectionId] = useState(() => channelConnections[0]?.id ?? "")
  const [pageId, setPageId] = useState(() => (channel ? pages.find((p) => p.connectionId === channelConnections[0]?.id)?.id ?? "" : ""))
  const pageOptions = channel ? pages.filter((p) => p.connectionId === connectionId) : pages
  const ready = !channel || !!pageId
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [assignee, setAssignee] = useState("")
  const [q, setQ] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const autoPicked = useRef(false)

  const list = useMemo(() => conversations
    .filter((c) => (!channel || chOf(c.pageId) === channel) && (!pageId || c.pageId === pageId) && (filter === "all" || c.unread > 0) && (!assignee || (assignee === "none" ? !c.assigneeId : c.assigneeId === assignee)))
    .filter((c) => !q.trim() || c.customer.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.lastMessageAt.localeCompare(a.lastMessageAt)), [conversations, channel, pageId, filter, assignee, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const conv = ready ? conversations.find((c) => c.id === activeId) : undefined
  const unreadBy = (ch: Channel | "") => conversations.filter((c) => c.unread > 0 && (!ch || chOf(c.pageId) === ch)).length
  const lastOf = (id: string) => messages.filter((m) => m.conversationId === id).sort((a, b) => b.at.localeCompare(a.at))[0]
  const assigneeOptions = users.filter((u) => settings.assigneeIds.includes(u.id)).map((u) => ({ value: u.id, text: u.fullName }))

  // The reference Facebook inbox opens with its newest conversation selected (desktop only; unread badge stays until clicked).
  useEffect(() => {
    if (!lunar || autoPicked.current || !list[0] || !isDesktop()) return
    autoPicked.current = true
    setActiveId(list[0].id)
  }, [lunar, list])

  const open = (id: string) => { setActiveId(id); markRead(id) }
  const pickConnection = (v: string) => { setConnectionId(v); setPageId(""); setActiveId(null) }
  const pickPage = (v: string) => { setPageId(v); setActiveId(null) }
  const pagePicker = channel && (
    <>
      <ComboSelect value={connectionId} onChange={pickConnection} placeholder="Chọn kết nối…" aria-label="Kết nối" options={channelConnections.map((c) => ({ value: c.id, text: c.name }))} />
      <ComboSelect value={pageId} onChange={pickPage} disabled={!connectionId} placeholder={CHANNELS[channel].pagePlaceholder} aria-label={CHANNELS[channel].pageLabel}
        options={pageOptions.map((p) => ({ value: p.id, text: p.name }))} />
    </>
  )
  const pickFirst = channel && <p className="p-4 text-center text-xs text-muted-foreground">{connectionId && !pageOptions.length ? CHANNELS[channel].noPages : CHANNELS[channel].pickFirst}</p>

  const items: ReactNode = (
    <>
      {list.map((c) => {
        const last = lastOf(c.id)
        const ch = chOf(c.pageId)
        const active = c.id === conv?.id
        return (
          <li key={c.id}>
            <button type="button" onClick={() => open(c.id)} aria-current={active}
              className={cn("mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", active ? "bg-primary-subtle" : lunar ? "hover:bg-primary-subtle" : "hover:bg-accent")}>
              <span className="relative shrink-0">
                <span className={cn("flex size-11 items-center justify-center rounded-full text-[13px] font-semibold", lunar ? "bg-[var(--chat-bubble-incoming)] text-[var(--chat-text-secondary)]" : "bg-muted text-muted-foreground")}>{initialOf(c.customer.name)}</span>
                {channel && isOnline(c.lastMessageAt) && <span className={cn("absolute -right-0.5 -bottom-0.5 size-[10px] rounded-full border-2 bg-[var(--chat-green)]", lunar ? "border-[var(--chat-bg-sidebar)]" : "border-background")} />}
                {!channel && ch && (() => { const I = CHANNELS[ch].icon
                  return <span title={CHANNELS[ch].name} className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full text-white ring-2 ring-background" style={{ backgroundColor: CHANNELS[ch].color }}><HugeiconsIcon icon={I} className="size-2.5" /></span> })()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between">
                  <span className={cn("truncate text-[15px] font-semibold", lunar ? "text-[var(--chat-text-primary)]" : "text-foreground")}>{c.customer.name}</span>
                  <span className={cn("ml-2 flex shrink-0 items-center gap-1 text-[11px]", lunar ? "text-[var(--chat-text-tertiary)]" : "text-muted-foreground")}>
                    {c.pinned && <HugeiconsIcon icon={PinIcon} className="size-3" aria-label="Đã ghim" />}{relTime(c.lastMessageAt)}
                  </span>
                </span>
                <span className="flex items-center justify-between">
                  <span className={cn("truncate text-[13px]", lunar ? "text-[var(--chat-text-secondary)]" : c.unread ? "text-foreground" : "text-muted-foreground")}>{last?.from === "agent" && "Bạn: "}{last?.text ?? "Chưa có tin nhắn"}</span>
                  {c.unread > 0 && <span className="ml-2 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--chat-red)] text-[11px] font-bold text-white">{c.unread}</span>}
                </span>
                {c.labelIds.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {c.labelIds.map((id) => settings.labels.find((l) => l.id === id)).filter(Boolean).map((l) => (
                      <span key={l!.id} className="rounded px-1.5 text-[10px] font-medium text-white" style={{ backgroundColor: l!.color }}>{l!.name}</span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
      {!list.length && <li className={cn("p-4 text-center text-xs", lunar ? "text-[var(--chat-text-tertiary)]" : "text-muted-foreground")}>Không có cuộc trò chuyện</li>}
    </>
  )

  return (
    <div className={cn("flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--chat-bg-main)]", CHAT_THEME)}>
      {lunar ? (
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-r border-[var(--chat-border-strong)] bg-[var(--chat-bg-sidebar)] md:w-80 max-md:[&:has(+div[data-open=true])]:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[15px] font-semibold text-[var(--chat-text-primary)]">{CHANNELS[channel].title}</span>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Trang và bộ lọc" title="Trang và bộ lọc" className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)]">
                  <HugeiconsIcon icon={Add01Icon} className="size-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="flex w-72 flex-col gap-2 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Trang Facebook</p>
                {pagePicker}
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Bộ lọc</p>
                <ListFilters filter={filter} setFilter={setFilter} assignee={assignee} setAssignee={setAssignee} assigneeOptions={assigneeOptions} />
                <button type="button" onClick={onOpenSettings} className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
                  <HugeiconsIcon icon={Settings02Icon} className="size-4" />Cài đặt Social Chat
                </button>
              </PopoverContent>
            </Popover>
          </div>
          {!ready ? pickFirst : (
            <>
              <div className="px-3 pb-2">
                <label className="flex items-center gap-2 rounded-[10px] bg-[var(--chat-bg-main)] px-3 py-2 opacity-50 transition-opacity focus-within:opacity-100">
                  <HugeiconsIcon icon={Search01Icon} className="size-3.5 shrink-0 text-[var(--chat-text-tertiary)]" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Tìm cuộc trò chuyện"
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--chat-text-primary)] outline-none placeholder:text-[var(--chat-text-tertiary)]" />
                </label>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto py-1">{items}</ul>
            </>
          )}
        </aside>
      ) : (
        <div className="flex w-full shrink-0 flex-col border-r border-border bg-muted/30 md:w-80 max-md:[&:has(+div[data-open=true])]:hidden">
          <div className="flex flex-col gap-2 border-b border-border p-3">
            {channel ? pagePicker : (
              <>
                <div role="tablist" aria-label="Kênh" className="no-scrollbar flex gap-1 overflow-x-auto">
                  {(["", ...CHANNEL_IDS] as const).map((ch) => {
                    const Icon = ch ? CHANNELS[ch].icon : InboxIcon
                    const n = unreadBy(ch)
                    return (
                      <button key={ch || "all"} type="button" role="tab" aria-selected={channel === ch} title={ch ? CHANNELS[ch].name : "Tất cả kênh"}
                        onClick={() => onChannelChange(ch)}
                        className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors", channel === ch ? "bg-primary-subtle font-medium text-primary-subtle-foreground" : "text-muted-foreground hover:bg-accent")}>
                        <HugeiconsIcon icon={Icon} className="size-3.5" style={ch ? { color: CHANNELS[ch].color } : undefined} />
                        {ch ? CHANNELS[ch].name : "Tất cả"}
                        {n > 0 && <span className="rounded-full bg-destructive px-1.5 text-[10px] leading-4 font-bold text-white">{n}</span>}
                      </button>
                    )
                  })}
                </div>
                <ComboSelect value={pageId} onChange={pickPage} clearable placeholder="Tất cả trang / tài khoản" aria-label="Trang"
                  options={pageOptions.map((p) => ({ value: p.id, text: p.name, node: <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: CHANNELS[chOf(p.id)!].color }} />{p.name}<span className="text-xs text-muted-foreground">· {CHANNELS[chOf(p.id)!].name}</span></span> }))} />
              </>
            )}
          </div>
          {!ready ? pickFirst : (
            <>
              <div className="space-y-2 px-3 pt-3 pb-2">
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm" aria-label="Tìm cuộc trò chuyện"
                    className="h-8 w-full rounded-md border border-input bg-background pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset" />
                </div>
                <ListFilters filter={filter} setFilter={setFilter} assignee={assignee} setAssignee={setAssignee} assigneeOptions={assigneeOptions} />
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto py-1">{items}</ul>
            </>
          )}
        </div>
      )}

      <div data-open={!!conv} className="flex min-w-0 flex-1 bg-[var(--chat-bg-main)] max-md:data-[open=false]:hidden">
        {!conv ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <HugeiconsIcon icon={MessageMultiple01Icon} className="size-10" strokeWidth={1.5} />
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        ) : (
          <ConversationPane key={conv.id} conv={conv} lunar={lunar} subtitle={!channel} onBack={() => setActiveId(null)} />
        )}
      </div>
    </div>
  )
}
