import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon, AlertCircleIcon, ArrowDown01Icon, ArrowLeft01Icon, ArrowUp01Icon, Cancel01Icon, Copy01Icon, HappyIcon, MailReply01Icon,
  MoreHorizontalIcon, PinIcon, Search01Icon, SmartPhone01Icon, TickDouble01Icon,
} from "@hugeicons/core-free-icons"

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useWorkspaceUsers } from "@/features/tables"
import { CURRENT_USER_ID } from "@/features/tables/data/seed"
import { CHANNELS } from "../data/channels"
import { channelOfPage, useSocialStore } from "../store/social.store"
import type { Conversation, Message } from "../types/social"
import { initialOf, isOnline } from "./chat-theme"
import { DetailsPanel } from "./details-panel"

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]
const clock = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const diff = Math.round((new Date(new Date().toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  return diff === 0 ? "Hôm nay" : diff === 1 ? "Hôm qua" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const HEADER_BTN = "flex size-8 items-center justify-center rounded-lg text-[var(--chat-text-secondary)] hover:bg-primary-subtle aria-pressed:text-primary"
const TOOL_BTN = "flex size-7 items-center justify-center rounded-md text-[var(--chat-text-secondary)] transition-colors hover:bg-primary-subtle hover:text-[var(--chat-text-primary)]"

/** Hover toolbar of a bubble (reference: Reply / Add reaction / More actions). */
function MessageToolbar({ m, mine, onReply }: { m: Message; mine: boolean; onReply: () => void }) {
  const react = useSocialStore((s) => s.react)
  return (
    <div className={cn("absolute -top-3 z-10 flex items-center gap-0.5 rounded-lg border border-[var(--chat-border-strong)] bg-[var(--chat-bg-sidebar)] p-0.5 opacity-0 shadow-[var(--chat-shadow-toolbar)] transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100", mine ? "right-0" : "left-10")}>
      <button type="button" className={TOOL_BTN} aria-label="Trả lời" title="Trả lời" onClick={onReply}><HugeiconsIcon icon={MailReply01Icon} className="size-3.5" /></button>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={TOOL_BTN} aria-label="Thêm cảm xúc" title="Thêm cảm xúc"><HugeiconsIcon icon={HappyIcon} className="size-3.5" /></button>
        </PopoverTrigger>
        <PopoverContent side="top" align={mine ? "end" : "start"} className="flex w-auto gap-0.5 rounded-full p-1">
          {REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => react(m.id, e)} aria-pressed={m.reactions?.includes(e) ?? false}
              className="grid size-8 place-items-center rounded-full text-lg transition-transform hover:scale-110 hover:bg-accent aria-pressed:bg-primary-subtle">{e}</button>
          ))}
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={TOOL_BTN} aria-label="Thao tác khác" title="Thao tác khác"><HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5" /></button>
        </PopoverTrigger>
        <PopoverContent side="top" align={mine ? "end" : "start"} className="w-40 p-1">
          <button type="button" onClick={onReply} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"><HugeiconsIcon icon={MailReply01Icon} className="size-4" />Trả lời</button>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(m.text)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"><HugeiconsIcon icon={Copy01Icon} className="size-4" />Sao chép</button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Open conversation, laid out like the reference "lunar" chat: sticky blurred header (avatar + online dot, name,
 * phone / search / pin actions), date separators, 18px bubbles with hover toolbar, pill composer.
 * `lunar` switches the placeholder copy to the reference's; `subtitle` adds channel/page info (unified inbox).
 */
export function ConversationPane({ conv, lunar, subtitle, onBack }: { conv: Conversation; lunar: boolean; subtitle: boolean; onBack: () => void }) {
  const { connections, pages, messages, settings, send, updateConversation } = useSocialStore()
  const { data: users = [] } = useWorkspaceUsers()
  const channel = channelOfPage({ pages, connections }, conv.pageId)!
  const [draft, setDraft] = useState("")
  const [reply, setReply] = useState<Message | null>(null)
  const [details, setDetails] = useState(false)
  const [search, setSearch] = useState<string | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  const all = messages.filter((m) => m.conversationId === conv.id).sort((a, b) => a.at.localeCompare(b.at))
  const needle = search?.trim().toLowerCase() ?? ""
  const thread = needle ? all.filter((m) => m.text.toLowerCase().includes(needle)) : all

  const toBottom = (smooth = false) => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: smooth ? "smooth" : "auto" })
  useEffect(() => { toBottom() }, [conv.id, all.length])

  const submit = () => {
    if (!draft.trim()) return
    send(conv.id, reply ? `> ${reply.text}\n${draft.trim()}` : draft.trim(), CURRENT_USER_ID)
    setDraft("")
    setReply(null)
  }
  const startReply = (m: Message) => { setReply(m); input.current?.focus() }

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--chat-bg-main)]">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--chat-border)] bg-[var(--chat-bg-header)] px-4 py-3 backdrop-blur-[20px] backdrop-saturate-[180%]">
          <button type="button" className="mr-1 text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] md:hidden" onClick={onBack} aria-label="Quay lại danh sách"><HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" /></button>
          <div className="relative">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--chat-bubble-incoming)] text-sm font-semibold text-[var(--chat-text-primary)]">{initialOf(conv.customer.name)}</div>
            {isOnline(conv.lastMessageAt) && <div className="absolute -right-0.5 -bottom-0.5 size-[10px] rounded-full border-2 border-[var(--chat-bg-main)] bg-[var(--chat-green)]" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            {search !== null ? (
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setSearch(null) }}
                placeholder="Tìm trong cuộc trò chuyện" aria-label="Tìm trong cuộc trò chuyện"
                className="h-8 w-full max-w-sm rounded-lg bg-[var(--chat-bg-sidebar)] px-3 text-sm text-[var(--chat-text-primary)] outline-none placeholder:text-[var(--chat-text-tertiary)]" />
            ) : (
              <>
                <span className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--chat-text-primary)]">{conv.customer.name}</span>
                {subtitle && <span className="truncate text-xs text-[var(--chat-text-secondary)]">{CHANNELS[channel].name} · {pages.find((p) => p.id === conv.pageId)?.name}{conv.assigneeId && ` · Phụ trách: ${users.find((u) => u.id === conv.assigneeId)?.fullName ?? ""}`}</span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className={HEADER_BTN} aria-pressed={details} aria-label="Thông tin khách hàng" title="Thông tin khách hàng" onClick={() => setDetails(!details)}><HugeiconsIcon icon={SmartPhone01Icon} className="size-4" /></button>
            <button type="button" className={HEADER_BTN} aria-pressed={search !== null} aria-label="Tìm trong cuộc trò chuyện" title="Tìm trong cuộc trò chuyện" onClick={() => setSearch(search === null ? "" : null)}>
              <HugeiconsIcon icon={search === null ? Search01Icon : Cancel01Icon} className="size-4" />
            </button>
            <button type="button" className={HEADER_BTN} aria-pressed={!!conv.pinned} aria-label={conv.pinned ? "Bỏ ghim" : "Ghim cuộc trò chuyện"} title={conv.pinned ? "Bỏ ghim" : "Ghim cuộc trò chuyện"} onClick={() => updateConversation(conv.id, { pinned: !conv.pinned })}>
              <HugeiconsIcon icon={PinIcon} className="size-4" />
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite"
            onScroll={(e) => { const el = e.currentTarget; setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120) }}>
            <div className="mx-auto w-full max-w-3xl">
              {!thread.length && <p className="py-10 text-center text-sm text-[var(--chat-text-tertiary)]">{needle ? "Không tìm thấy tin nhắn" : "Chưa có tin nhắn"}</p>}
              {thread.map((m, i) => {
                const mine = m.from === "agent"
                const prev = thread[i - 1]
                const next = thread[i + 1]
                const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString()
                const first = newDay || prev!.from !== m.from
                const lastInRun = !next || next.from !== m.from || new Date(next.at).toDateString() !== new Date(m.at).toDateString()
                return (
                  <div key={m.id}>
                    {newDay && (
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-[var(--chat-border)]" />
                        <span className="text-[11px] font-semibold tracking-[0.08em] text-[var(--chat-text-tertiary)] uppercase">{dayLabel(m.at)}</span>
                        <div className="h-px flex-1 bg-[var(--chat-border)]" />
                      </div>
                    )}
                    <div className={cn("group/message relative flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row", first ? "mt-4" : "mt-1")}>
                      {!mine && (
                        <div className="w-8 shrink-0">
                          {lastInRun && <div className="flex size-8 items-center justify-center rounded-full bg-[var(--chat-bubble-incoming)] text-[11px] font-semibold text-[var(--chat-text-secondary)]">{initialOf(conv.customer.name)}</div>}
                        </div>
                      )}
                      <div className="flex max-w-[75%] flex-col">
                        {!mine && first && <span className="mb-0.5 ml-3 text-[14px] leading-tight font-semibold tracking-[-0.01em] text-[var(--chat-text-secondary)]">{conv.customer.name}</span>}
                        <div className="relative">
                          <MessageToolbar m={m} mine={mine} onReply={() => startReply(m)} />
                          <div className={cn("relative px-3.5 py-2", mine ? "rounded-[18px_18px_4px_18px] bg-primary text-primary-foreground" : "rounded-[18px_18px_18px_4px] bg-[var(--chat-bubble-incoming)] text-[var(--chat-bubble-incoming-text)]")}>
                            <p className="text-[15px] leading-[1.35] tracking-[-0.01em] break-words whitespace-pre-wrap">{m.text}</p>
                            <div className={cn("mt-1 flex items-center gap-1", mine ? "justify-end" : "justify-start")}>
                              <time className="text-[11px] tracking-[0.02em] opacity-60">{clock(m.at)}</time>
                              {mine && !m.failed && <HugeiconsIcon icon={TickDouble01Icon} className="size-3.5 opacity-60" />}
                            </div>
                            {m.failed && <span className="mt-1 flex items-center gap-1 text-[11px] opacity-80"><HugeiconsIcon icon={AlertCircleIcon} className="size-3" />Gửi tin nhắn thất bại. Vui lòng thử lại.</span>}
                          </div>
                          {!!m.reactions?.length && (
                            <div className={cn("-mt-1.5 flex", mine ? "justify-end pr-2" : "justify-start pl-2")}>
                              <span className="relative rounded-full border border-[var(--chat-border-strong)] bg-[var(--chat-bg-main)] px-1.5 text-xs leading-5 shadow-[var(--chat-shadow-toolbar)]">{m.reactions.join("")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <button type="button" onClick={() => toBottom(true)} aria-label="Cuộn xuống cuối" tabIndex={atBottom ? -1 : 0}
            className={cn("absolute right-4 bottom-4 z-[5] flex size-10 items-center justify-center rounded-full border border-[var(--chat-border-strong)] bg-[var(--chat-bg-main)] shadow-[var(--chat-shadow-md)] transition-all duration-200", atBottom ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100")}>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-[18px] text-[var(--chat-text-secondary)]" />
          </button>
        </div>

        <div className="relative z-10">
          <div className="border-t border-[var(--chat-border)] bg-[var(--chat-bg-composer)] px-3 py-2 backdrop-blur-[20px] backdrop-saturate-[180%]">
            <div className="mx-auto max-w-3xl">
              {reply && (
                <div className="mb-2 ml-11 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-[var(--chat-bg-sidebar)] px-3 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate text-[var(--chat-text-secondary)]"><span className="font-semibold text-[var(--chat-text-primary)]">Trả lời {reply.from === "agent" ? "bạn" : conv.customer.name}: </span>{reply.text}</span>
                  <button type="button" onClick={() => setReply(null)} aria-label="Huỷ trả lời" className="text-[var(--chat-text-tertiary)] hover:text-[var(--chat-text-primary)]"><HugeiconsIcon icon={Cancel01Icon} className="size-3.5" /></button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" aria-label="Mẫu tin nhắn" title="Mẫu tin nhắn"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg-sidebar)] text-[var(--chat-text-tertiary)] transition-all hover:bg-primary-subtle hover:text-[var(--chat-text-secondary)]">
                      <HugeiconsIcon icon={Add01Icon} className="size-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" side="top" className="max-h-72 w-80 overflow-y-auto p-1">
                    <p className="px-2 py-1.5 text-xs font-semibold">Mẫu tin nhắn</p>
                    {[...settings.templateGroups, { id: "", name: "Khác" }].map((g) => {
                      const items = settings.templates.filter((t) => (t.groupId ?? "") === g.id)
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
                    {!settings.templates.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Chưa có mẫu.</p>}
                  </PopoverContent>
                </Popover>
                <div className="relative flex flex-1 items-end rounded-[22px] border border-[var(--chat-border)] bg-[var(--chat-bg-sidebar)]">
                  <textarea ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder={lunar ? "Message" : "Nhập tin nhắn…"} aria-label="Nhập tin nhắn"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() } }}
                    className="field-sizing-content max-h-40 flex-1 resize-none bg-transparent py-[10px] pr-12 pl-4 text-[15px] leading-[22px] tracking-[-0.01em] text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-tertiary)] focus:outline-none" />
                  <button type="button" disabled={!draft.trim()} onClick={submit} aria-label="Gửi tin nhắn"
                    className={cn("absolute right-[6px] bottom-[6px] flex size-8 items-center justify-center rounded-full transition-all duration-200", draft.trim() ? "bg-primary text-primary-foreground" : "bg-transparent text-[var(--chat-text-tertiary)]")}>
                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {details && <DetailsPanel channel={channel} conv={conv} onClose={() => setDetails(false)} />}
    </>
  )
}
