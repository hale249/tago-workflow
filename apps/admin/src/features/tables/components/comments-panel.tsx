import { useState } from "react"
import { MessageSquare, Pencil, SendHorizontal, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { formatStamp } from "@/lib/format"
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../api/tables.queries"
import { CURRENT_USER_ID } from "../data/seed"
import type { WorkspaceUser } from "../types/table"
import { Textarea } from "./form-controls"

function Avatar({ user }: { user?: WorkspaceUser }) {
  const initials = (user?.fullName ?? "?").split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: user?.color ?? "#9ca3af" }}>
      {initials}
    </span>
  )
}

/** Comment dock: header, composer on top, newest-first thread below (reference layout). */
export function CommentsPanel({ recordId, users }: { recordId: string; users: WorkspaceUser[] }) {
  const { data: comments = [] } = useComments(recordId)
  const create = useCreateComment(recordId)
  const update = useUpdateComment()
  const remove = useDeleteComment()
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null)

  const send = () => draft.trim() && create.mutate(draft, { onSuccess: () => setDraft("") })
  const canSend = !!draft.trim() && !create.isPending
  const thread = [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center border-b px-3">
        <h2 className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="size-4 text-muted-foreground" />Bình luận</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3 pt-3 pb-3">
        <div className="shrink-0 pb-4">
          <div className="overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send()
              }}
              placeholder="Viết bình luận..."
              aria-label="Viết bình luận"
              className="block max-h-[200px] min-h-[60px] w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between border-t border-input px-3 py-2">
              <span className="text-xs text-muted-foreground">Ctrl+Enter để gửi</span>
              <button
                type="button"
                title="Bình luận"
                aria-label="Gửi bình luận"
                disabled={!canSend}
                onClick={send}
                className={cn("grid size-8 place-items-center rounded-full transition-colors", canSend ? "bg-brand text-white hover:bg-brand/90" : "cursor-not-allowed bg-muted text-muted-foreground")}
              >
                <SendHorizontal className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="-mx-1 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-1 py-1">
          {!thread.length && <p className="py-8 text-center text-xs text-muted-foreground">Chưa có bình luận</p>}
          {thread.map((c) => {
            const mine = c.createdBy === CURRENT_USER_ID
            const user = users.find((u) => u.id === c.createdBy)
            return (
              <div key={c.id} className="group rounded-md px-1 py-2">
                <div className="flex gap-2.5">
                  <Avatar user={user} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="min-w-0 truncate text-[13px] font-medium">{user?.fullName ?? "Ẩn danh"}</span>
                      <span className="text-xs whitespace-nowrap text-muted-foreground">{formatStamp(c.createdAt)}{c.updatedAt && " · đã sửa"}</span>
                      {mine && editing?.id !== c.id && (
                        <span className="ml-auto flex opacity-0 group-hover:opacity-100 max-md:opacity-100">
                          <Button size="icon-xs" variant="ghost" aria-label="Sửa" onClick={() => setEditing({ id: c.id, content: c.content })}><Pencil /></Button>
                          <Button size="icon-xs" variant="ghost" aria-label="Xoá" onClick={() => remove.mutate(c.id)}><Trash2 /></Button>
                        </span>
                      )}
                    </div>
                    {editing?.id === c.id ? (
                      <div className="space-y-2">
                        <Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={3} />
                        <div className="flex justify-end gap-2">
                          <Button size="xs" variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
                          <Button size="xs" disabled={!editing.content.trim()} onClick={() => update.mutate(editing, { onSuccess: () => setEditing(null) })}>Lưu</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] break-words whitespace-pre-line">{c.content}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
