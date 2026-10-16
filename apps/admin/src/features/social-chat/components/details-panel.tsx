import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon, Tag01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ComboSelect, recordLabel, recordsQuery, useTables, useWorkspaceUsers } from "@/features/tables"
import { CHANNELS } from "../data/channels"
import { useSocialStore } from "../store/social.store"
import type { Channel, Conversation } from "../types/social"
import { initialOf } from "./chat-theme"

/** Right-hand "Chi tiết cuộc trò chuyện": assignee, labels and the linked Active Table record (opened from the chat header). */
export function DetailsPanel({ channel, conv, onClose }: { channel: Channel; conv: Conversation; onClose: () => void }) {
  const settings = useSocialStore((s) => s.settings)
  const update = useSocialStore((s) => s.updateConversation)
  const { data: users = [] } = useWorkspaceUsers()
  const { data: tables = [] } = useTables()
  const table = tables.find((t) => t.id === settings.linkedTableId)
  const { data: records = [] } = useQuery({ ...recordsQuery(settings.linkedTableId), enabled: !!settings.linkedTableId })
  const assignable = users.filter((u) => settings.assigneeIds.includes(u.id))
  const toggleLabel = (id: string) => update(conv.id, { labelIds: conv.labelIds.includes(id) ? conv.labelIds.filter((x) => x !== id) : [...conv.labelIds, id] })

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[var(--chat-border)] bg-[var(--chat-bg-main)] max-lg:hidden">
      <div className="flex h-[65px] shrink-0 items-center justify-between border-b border-[var(--chat-border)] px-4">
        <span className="text-[15px] font-semibold text-[var(--chat-text-primary)]">Chi tiết cuộc trò chuyện</span>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="flex size-8 items-center justify-center rounded-lg text-[var(--chat-text-secondary)] hover:bg-primary-subtle">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>
      <div className="space-y-5 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--chat-bubble-incoming)] text-base font-semibold text-[var(--chat-text-primary)]">{initialOf(conv.customer.name)}</span>
          <div>
            <p className="font-semibold text-[var(--chat-text-primary)]">{conv.customer.name}</p>
            <p className="text-xs text-[var(--chat-text-secondary)]">@{conv.customer.handle} · {CHANNELS[channel].name}</p>
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
                  <HugeiconsIcon icon={Tag01Icon} className="size-3" />{l.name}
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
                  <Link to={`/tables/${table.id}/records/new`}><HugeiconsIcon icon={Add01Icon} />Tạo bản ghi mới và liên kết với cuộc trò chuyện</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
