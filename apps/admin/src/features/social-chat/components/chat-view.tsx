import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, FileText, Inbox, MessagesSquare, Plus, Search, SendHorizontal, Tag, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { ComboSelect, recordLabel, recordsQuery, useTables, useWorkspaceUsers } from "@/features/tables"
import { CURRENT_USER_ID } from "@/features/tables/data/seed"
import { formatStamp } from "@/lib/format"
import { CHANNEL_IDS, CHANNELS } from "../data/channels"
import { channelOfPage, useSocialStore } from "../store/social.store"
import type { Channel, Conversation } from "../types/social"

const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()
const shortTime = (iso: string) => {
  const d = new Date(iso)
  return Date.now() - d.getTime() < 86_400_000 ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

function Avatar({ name, color, className }: { name: string; color: string; className?: string }) {
  return <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white", className)} style={{ backgroundColor: color }}>{initials(name)}</span>
}

/** Right-hand "Chi tiết cuộc trò chuyện": assignee, labels and the linked Active Table record. */
function DetailsPanel({ channel, conv }: { channel: Channel; conv: Conversation }) {
  const settings = useSocialStore((s) => s.settings)
  const update = useSocialStore((s) => s.updateConversation)
  const { data: users = [] } = useWorkspaceUsers()
  const { data: tables = [] } = useTables()
  const table = tables.find((t) => t.id === settings.linkedTableId)
  const { data: records = [] } = useQuery({ ...recordsQuery(settings.linkedTableId), enabled: !!settings.linkedTableId })
  const assignable = users.filter((u) => settings.assigneeIds.includes(u.id))
  const toggleLabel = (id: string) => update(conv.id, { labelIds: conv.labelIds.includes(id) ? conv.labelIds.filter((x) => x !== id) : [...conv.labelIds, id] })

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l max-xl:hidden">
      <div className="flex h-12 shrink-0 items-center border-b px-4 text-sm font-semibold">Chi tiết cuộc trò chuyện</div>
      <div className="space-y-5 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar name={conv.customer.name} color={conv.customer.color} className="size-14 text-base" />
          <div>
            <p className="font-semibold">{conv.customer.name}</p>
            <p className="text-xs text-muted-foreground">@{conv.customer.handle} · {CHANNELS[channel].name}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Người được phân công</p>
          <ComboSelect value={conv.assigneeId ?? ""} onChange={(v) => update(conv.id, { assigneeId: v || undefined })} clearable placeholder="Chưa phân công"
            options={assignable.map((u) => ({ value: u.id, text: u.fullName }))} aria-label="Người được phân công" />
          {!assignable.length && <p className="text-xs text-muted-foreground">Kênh này chưa cấu hình người dùng được phân công trong Social Chat.</p>}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Nhãn</p>
          <div className="flex flex-wrap gap-1.5">
            {settings.labels.map((l) => {
              const on = conv.labelIds.includes(l.id)
              return (
                <button key={l.id} type="button" onClick={() => toggleLabel(l.id)} aria-pressed={on}
                  className={cn("inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs transition-colors", on ? "border-transparent text-white" : "text-muted-foreground hover:bg-accent")}
                  style={on ? { backgroundColor: l.color } : undefined}>
                  <Tag className="size-3" />{l.name}
                </button>
              )
            })}
            {!settings.labels.length && <p className="text-xs text-muted-foreground">Chưa định nghĩa nhãn nào.</p>}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Bản ghi liên kết{table && <span className="font-normal text-muted-foreground"> · {table.name}</span>}</p>
          {!table ? (
            <p className="text-xs text-muted-foreground">Chọn một Active Table ở tab Cài đặt để bật liên kết bản ghi.</p>
          ) : (
            <>
              <ComboSelect value={conv.linkedRecordId ?? ""} onChange={(v) => update(conv.id, { linkedRecordId: v || undefined })} clearable placeholder="Chọn bản ghi"
                options={records.map((r) => ({ value: r.id, text: recordLabel(table.id, r.id) }))} aria-label="Bản ghi liên kết" />
              {conv.linkedRecordId ? (
                <Link to={`/tables/${table.id}?preview=${conv.linkedRecordId}`} className="text-xs text-brand hover:underline">Xem bản ghi</Link>
              ) : (
                <Button asChild variant="outline" size="sm" className="h-auto w-full justify-start py-1.5 text-left whitespace-normal">
                  <Link to={`/tables/${table.id}/records/new`}><Plus />Tạo bản ghi mới và liên kết với cuộc trò chuyện</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

/** Unified inbox: every channel in one list (channel chips + page filter), thread with composer, details panel. */
export function ChatView({ channel, onChannelChange }: { channel: Channel | ""; onChannelChange: (c: Channel | "") => void }) {
  const { connections, pages, conversations, messages, settings, send, markRead } = useSocialStore()
  const { data: users = [] } = useWorkspaceUsers()
  const chOf = (pid: string) => channelOfPage({ pages, connections }, pid)
  const [pageId, setPageId] = useState("")
  const pageOptions = pages.filter((p) => !channel || chOf(p.id) === channel)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [assignee, setAssignee] = useState("")
  const [q, setQ] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const bottom = useRef<HTMLDivElement>(null)

  const list = useMemo(() => conversations
    .filter((c) => (!channel || chOf(c.pageId) === channel) && (!pageId || c.pageId === pageId) && (filter === "all" || c.unread > 0) && (!assignee || (assignee === "none" ? !c.assigneeId : c.assigneeId === assignee)))
    .filter((c) => !q.trim() || c.customer.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)), [conversations, channel, pageId, filter, assignee, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const conv = conversations.find((c) => c.id === activeId)
  const unreadBy = (ch: Channel | "") => conversations.filter((c) => c.unread > 0 && (!ch || chOf(c.pageId) === ch)).length
  const thread = messages.filter((m) => m.conversationId === conv?.id).sort((a, b) => a.at.localeCompare(b.at))
  const lastOf = (id: string) => messages.filter((m) => m.conversationId === id).sort((a, b) => b.at.localeCompare(a.at))[0]
  const cfg = settings

  useEffect(() => { if (conv?.unread) markRead(conv.id) }, [conv?.id, conv?.unread, markRead])
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }) }, [conv?.id, thread.length])

  const submit = () => {
    if (!conv || !draft.trim()) return
    send(conv.id, draft.trim(), CURRENT_USER_ID)
    setDraft("")
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-[320px] shrink-0 flex-col border-r bg-muted/20 max-md:w-full max-md:[&:has(+div[data-open=true])]:hidden">
        <div className="space-y-2 border-b p-3">
          <div role="tablist" aria-label="Kênh" className="no-scrollbar flex gap-1 overflow-x-auto">
            {(["", ...CHANNEL_IDS] as const).map((ch) => {
              const Icon = ch ? CHANNELS[ch].icon : Inbox
              const n = unreadBy(ch)
              return (
                <button key={ch || "all"} type="button" role="tab" aria-selected={channel === ch} title={ch ? CHANNELS[ch].name : "Tất cả kênh"}
                  onClick={() => { onChannelChange(ch); setPageId("") }}
                  className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors", channel === ch ? "bg-brand/8 font-medium text-brand" : "text-muted-foreground hover:bg-accent")}>
                  <Icon className="size-3.5" style={ch && channel !== ch ? { color: CHANNELS[ch].color } : undefined} />
                  {ch ? CHANNELS[ch].name : "Tất cả"}
                  {n > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] leading-4 font-semibold text-white">{n}</span>}
                </button>
              )
            })}
          </div>
          <ComboSelect value={pageId} onChange={(v) => { setPageId(v); setActiveId(null) }} clearable placeholder="Tất cả trang / tài khoản" aria-label="Trang"
            options={pageOptions.map((p) => ({ value: p.id, text: p.name, node: <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: CHANNELS[chOf(p.id)!].color }} />{p.name}<span className="text-xs text-muted-foreground">· {CHANNELS[chOf(p.id)!].name}</span></span> }))} />
        </div>
        {(
          <>
            <div className="space-y-2 border-b p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm" aria-label="Tìm cuộc trò chuyện"
                  className="h-8 w-full rounded-md border border-input bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 rounded-md bg-muted p-0.5 text-xs">
                  {([["all", "Tất cả"], ["unread", "Chưa đọc"]] as const).map(([id, l]) => (
                    <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id}
                      className={cn("h-6 rounded-[5px] px-2", filter === id ? "bg-background font-medium shadow-xs" : "text-muted-foreground")}>{l}</button>
                  ))}
                </div>
                <ComboSelect value={assignee} onChange={setAssignee} clearable placeholder="Tất cả phụ trách" className="h-7 text-xs" aria-label="Lọc theo người phụ trách"
                  options={[{ value: "none", text: "Chưa phân công" }, ...users.filter((u) => cfg.assigneeIds.includes(u.id)).map((u) => ({ value: u.id, text: u.fullName }))]} />
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {list.map((c) => {
                const last = lastOf(c.id)
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => setActiveId(c.id)} aria-current={c.id === conv?.id}
                      className={cn("flex w-full gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-accent/60", c.id === conv?.id && "bg-brand/6")}>
                      <span className="relative shrink-0">
                        <Avatar name={c.customer.name} color={c.customer.color} />
                        {(() => { const ch = chOf(c.pageId); if (!ch) return null; const I = CHANNELS[ch].icon
                          return <span title={CHANNELS[ch].name} className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full text-white ring-2 ring-background" style={{ backgroundColor: CHANNELS[ch].color }}><I className="size-2.5" /></span> })()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("flex-1 truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.customer.name}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{shortTime(c.lastMessageAt)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className={cn("flex-1 truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>{last?.from === "agent" && "Bạn: "}{last?.text ?? "Chưa có tin nhắn"}</span>
                          {c.unread > 0 && <span className="grid size-4 place-items-center rounded-full bg-brand text-[10px] font-semibold text-white">{c.unread}</span>}
                        </span>
                        {c.labelIds.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {c.labelIds.map((id) => cfg.labels.find((l) => l.id === id)).filter(Boolean).map((l) => (
                              <span key={l!.id} className="rounded px-1.5 text-[10px] font-medium text-white" style={{ backgroundColor: l!.color }}>{l!.name}</span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
              {!list.length && <li className="px-4 py-6 text-center text-xs text-muted-foreground">Không có cuộc trò chuyện</li>}
            </ul>
          </>
        )}
      </div>

      <div data-open={!!conv} className="flex min-w-0 flex-1 max-md:data-[open=false]:hidden">
        {!conv ? (
          <div className="m-auto flex flex-col items-center gap-3 text-muted-foreground">
            <MessagesSquare className="size-9" strokeWidth={1.5} />
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
                <Button size="icon-sm" variant="ghost" className="md:hidden" onClick={() => setActiveId(null)} aria-label="Quay lại danh sách"><X /></Button>
                <Avatar name={conv.customer.name} color={conv.customer.color} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{conv.customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{CHANNELS[chOf(conv.pageId)!]?.name} · {pages.find((p) => p.id === conv.pageId)?.name}{conv.assigneeId && ` · Phụ trách: ${users.find((u) => u.id === conv.assigneeId)?.fullName ?? ""}`}</p>
                </div>
              </header>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/20 px-4 py-4">
                {!thread.length && <p className="py-10 text-center text-sm text-muted-foreground">Chưa có tin nhắn</p>}
                {thread.map((m, i) => {
                  const mine = m.from === "agent"
                  const showTime = i === 0 || new Date(m.at).getTime() - new Date(thread[i - 1]!.at).getTime() > 30 * 60_000
                  return (
                    <div key={m.id}>
                      {showTime && <p className="my-3 text-center text-[11px] text-muted-foreground">{formatStamp(m.at)}</p>}
                      <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line", mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border bg-background")}>
                          {m.text}
                          {m.failed && <span className="mt-1 flex items-center gap-1 text-[11px] text-red-200"><AlertCircle className="size-3" />Gửi lỗi</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottom} />
              </div>
              <div className="shrink-0 border-t p-3">
                <div className="overflow-hidden rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Nhập tin nhắn…" aria-label="Nhập tin nhắn"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() } }}
                    className="block max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none" />
                  <div className="flex items-center justify-between border-t px-2 py-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 text-muted-foreground"><FileText />Mẫu tin nhắn</Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" side="top" className="max-h-72 w-80 overflow-y-auto p-1">
                        {[...cfg.templateGroups, { id: "", name: "Khác" }].map((g) => {
                          const items = cfg.templates.filter((t) => (t.groupId ?? "") === g.id)
                          if (!items.length) return null
                          return (
                            <div key={g.id || "none"}>
                              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{g.name}</p>
                              {items.map((t) => (
                                <button key={t.id} type="button" onClick={() => setDraft((d) => (d ? `${d}\n${t.content}` : t.content))}
                                  className="block w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent">
                                  <span className="block text-sm font-medium">{t.name}</span>
                                  <span className="line-clamp-1 text-xs text-muted-foreground">{t.content}</span>
                                </button>
                              ))}
                            </div>
                          )
                        })}
                        {!cfg.templates.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Chưa có mẫu.</p>}
                      </PopoverContent>
                    </Popover>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground max-sm:hidden">Enter để gửi · Shift+Enter xuống dòng</span>
                      <Button size="icon-sm" className="size-7 rounded-full" disabled={!draft.trim()} onClick={submit} aria-label="Gửi tin nhắn"><SendHorizontal /></Button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DetailsPanel channel={chOf(conv.pageId)!} conv={conv} />
          </>
        )}
      </div>
    </div>
  )
}
