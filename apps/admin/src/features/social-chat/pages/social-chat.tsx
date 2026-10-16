import { useNavigate, useParams, useSearchParams } from "react-router"

import { cn } from "@workspace/ui/lib/utils"
import { NotFoundPage } from "@/pages/not-found"
import { ChatView } from "../components/chat-view"
import { SettingsView } from "../components/settings-view"
import { CHANNEL_IDS } from "../data/channels"
import type { Channel } from "../types/social"

/**
 * Unified Social inbox: all channels in one place; /social-chat/:channel pre-filters, ?tab=settings opens shared settings.
 * The Facebook inbox has no "Trò chuyện / Cài đặt" bar (reference); its + menu opens settings, where the bar comes back.
 */
export function SocialChatPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") === "settings" ? "settings" : "chat"
  const navigate = useNavigate()
  // Channel comes from the path (/social-chat/zalo, the sidebar inboxes) or the legacy ?channel=.
  const pathChannel = useParams().channel
  const raw = pathChannel ?? params.get("channel") ?? ""
  const channel = (CHANNEL_IDS as string[]).includes(raw) ? (raw as Channel) : ""
  const update = (patch: Record<string, string>) => {
    const n = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) if (v) n.set(k, v); else n.delete(k)
    setParams(n, { replace: true })
  }

  if (pathChannel && !channel) return <NotFoundPage />
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {!(channel === "facebook" && tab === "chat") && <div className="flex shrink-0 justify-center border-b border-border bg-background px-3 py-2">
        <div role="tablist" aria-label="Hộp thư Social" className="inline-flex gap-0.5 rounded-full border border-border bg-muted/40 p-0.5">
          {([["chat", "Trò chuyện"], ["settings", "Cài đặt"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => update({ tab: id === "settings" ? "settings" : "" })}
              className={cn("rounded-full px-5 py-1 text-xs font-semibold transition-colors", tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </div>}
      {tab === "chat" ? <ChatView key={channel || "all"} channel={channel} onOpenSettings={() => update({ tab: "settings" })} onChannelChange={(c) => { const q = new URLSearchParams(params); q.delete("channel"); navigate({ pathname: c ? `/social-chat/${c}` : "/social-chat", search: q.toString() ? `?${q}` : "" }, { replace: true }) }} /> : <SettingsView />}
    </div>
  )
}
