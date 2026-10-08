import { useEffect } from "react"
import { useSearchParams } from "react-router"

import { cn } from "@workspace/ui/lib/utils"
import { ChatView } from "../components/chat-view"
import { SettingsView } from "../components/settings-view"
import { CHANNEL_IDS } from "../data/channels"
import type { Channel } from "../types/social"

/** Unified Social inbox: all channels in one place; ?channel= pre-filters, ?tab=settings opens shared settings. */
export function SocialChatPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") === "settings" ? "settings" : "chat"
  const raw = params.get("channel") ?? ""
  const channel = (CHANNEL_IDS as string[]).includes(raw) ? (raw as Channel) : ""
  const update = (patch: Record<string, string>) => {
    const n = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) if (v) n.set(k, v); else n.delete(k)
    setParams(n, { replace: true })
  }
  useEffect(() => { document.title = "Hộp thư Social" }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 justify-center border-b py-2">
        <div role="tablist" aria-label="Hộp thư Social" className="inline-flex rounded-full border bg-muted/60 p-0.5">
          {([["chat", "Trò chuyện"], ["settings", "Cài đặt"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => update({ tab: id === "settings" ? "settings" : "" })}
              className={cn("h-7 rounded-full px-5 text-xs font-medium transition-colors", tab === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === "chat" ? <ChatView channel={channel} onChannelChange={(c) => update({ channel: c })} /> : <SettingsView />}
    </div>
  )
}
