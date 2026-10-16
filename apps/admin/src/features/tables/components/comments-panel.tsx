import { useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AtIcon,
  AttachmentIcon,
  BubbleChatIcon,
  Delete02Icon,
  Link01Icon,
  MailSend01Icon,
  Message01Icon,
  MoreHorizontalIcon,
  PencilIcon,
  SmileIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { formatStamp } from "@/lib/format"
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../api/tables.queries"
import { CURRENT_USER_ID } from "../data/seed"
import type { WorkspaceUser } from "../types/table"
import { ConfirmDialog } from "./confirm-dialog"
import { Textarea } from "./form-controls"

const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "👏", "🙏", "🎉", "🔥", "❤️", "✅", "❌", "⭐", "💡", "📌"]

/** Reference composer tool button: 32px round ghost icon button. */
const TOOL = "size-8 rounded-full hover:bg-accent/50 dark:hover:bg-white/5 [&_svg]:h-4 [&_svg]:w-4"

function Avatar({ user }: { user?: WorkspaceUser }) {
  const initials = (user?.fullName ?? "?").split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: user?.color ?? "#9ca3af" }}>
      {initials}
    </span>
  )
}

function ToolPopover({ title, icon, children, open, onOpenChange }: { title: string; icon: typeof AtIcon; children: ReactNode; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className={TOOL} title={title} aria-label={title}><HugeiconsIcon icon={icon} /></Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1">{children}</PopoverContent>
    </Popover>
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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formatting, setFormatting] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [mentionOpen, setMentionOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const send = () => draft.trim() && create.mutate(draft, { onSuccess: () => setDraft("") })
  const canSend = !!draft.trim() && !create.isPending
  const thread = [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  /** Inserts text at the caret (or wraps the selection with `before` / `after`). */
  const insert = (before: string, after = "") => {
    const el = inputRef.current
    const start = el?.selectionStart ?? draft.length
    const end = el?.selectionEnd ?? draft.length
    const next = draft.slice(0, start) + before + draft.slice(start, end) + after + draft.slice(end)
    setDraft(next)
    requestAnimationFrame(() => {
      el?.focus()
      const caret = end + before.length
      el?.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3 text-sm font-medium">
        <HugeiconsIcon icon={Message01Icon} className="h-4 w-4 text-muted-foreground" />Bình luận
      </div>
      <div className="flex min-h-[280px] flex-1 flex-col px-3 py-3 xl:min-h-0">
        <div className="shrink-0 pb-4">
          <div className="overflow-hidden rounded-lg border border-input bg-background">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send()
              }}
              placeholder="Viết bình luận..."
              aria-label="Viết bình luận"
              className="block max-h-[200px] min-h-[60px] w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            {formatting && (
              <div className="flex items-center gap-1 border-t border-input px-3 py-1.5">
                <Button type="button" variant="ghost" size="icon-sm" className="size-7 font-bold" title="In đậm (Ctrl+B)" aria-label="In đậm" onClick={() => insert("**", "**")}>B</Button>
                <Button type="button" variant="ghost" size="icon-sm" className="size-7 italic" title="In nghiêng (Ctrl+I)" aria-label="In nghiêng" onClick={() => insert("_", "_")}>I</Button>
                <Button type="button" variant="ghost" size="icon-sm" className="size-7 line-through" title="Gạch ngang" aria-label="Gạch ngang" onClick={() => insert("~~", "~~")}>S</Button>
                <Button type="button" variant="ghost" size="icon-sm" className="size-7" title="Danh sách chấm" aria-label="Danh sách chấm" onClick={() => insert("\n- ")}>•</Button>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-input px-3 py-2">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" className={cn(TOOL, formatting && "bg-accent")} title="Định dạng" aria-label="Định dạng" aria-pressed={formatting} onClick={() => setFormatting(!formatting)}>
                  <HugeiconsIcon icon={TextFontIcon} />
                </Button>
                <ToolPopover title="Chèn emoji" icon={SmileIcon} open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <div className="grid grid-cols-5 gap-0.5">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" className="grid size-8 place-items-center rounded-md text-lg hover:bg-accent" onClick={() => { insert(e); setEmojiOpen(false) }}>{e}</button>
                    ))}
                  </div>
                </ToolPopover>
                <Button type="button" variant="ghost" size="icon-sm" className={TOOL} title="Đính kèm tệp" aria-label="Đính kèm tệp" onClick={() => fileRef.current?.click()}>
                  <HugeiconsIcon icon={AttachmentIcon} />
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    const names = [...(e.target.files ?? [])].map((f) => `📎 ${f.name}`)
                    if (names.length) insert((draft && !draft.endsWith("\n") ? "\n" : "") + names.join("\n"))
                    e.target.value = ""
                  }}
                />
                <ToolPopover title="Nhắc tên (@)" icon={AtIcon} open={mentionOpen} onOpenChange={setMentionOpen}>
                  <div className="max-h-60 w-56 overflow-y-auto">
                    {users.map((u) => (
                      <button key={u.id} type="button" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { insert(`@${u.fullName} `); setMentionOpen(false) }}>
                        <Avatar user={u} /><span className="truncate">{u.fullName}</span>
                      </button>
                    ))}
                  </div>
                </ToolPopover>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-sm"
                  title="Bình luận"
                  aria-label="Gửi bình luận"
                  disabled={!canSend}
                  onClick={send}
                  className={cn("size-8 rounded-full shadow-xs transition-colors disabled:opacity-100 [&_svg]:h-4 [&_svg]:w-4", canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "cursor-not-allowed bg-muted text-muted-foreground")}
                >
                  <HugeiconsIcon icon={MailSend01Icon} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="-mx-1 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-1 py-1">
          {!thread.length && <div className="py-8 text-center text-sm text-muted-foreground">Chưa có bình luận nào. Hãy bắt đầu cuộc thảo luận.</div>}
          {thread.map((c) => {
            const mine = c.createdBy === CURRENT_USER_ID
            const user = users.find((u) => u.id === c.createdBy)
            return (
              <div key={c.id} id={`comment-${c.id}`} className="group rounded-md px-1 py-2 transition-colors duration-300">
                <div className="flex gap-2.5">
                  <Avatar user={user} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="min-w-0 truncate text-[13px] font-medium">{user?.fullName ?? "Người dùng không xác định"}</span>
                      <span className="text-xs whitespace-nowrap text-muted-foreground">{formatStamp(c.createdAt)}{c.updatedAt && " · Đã chỉnh sửa"}</span>
                      {editing?.id !== c.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs" className="ml-auto h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent/50 focus-visible:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100 [&_svg]:h-4 [&_svg]:w-4" aria-label="Tuỳ chọn bình luận">
                              <HugeiconsIcon icon={MoreHorizontalIcon} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[60]">
                            <DropdownMenuItem onSelect={() => void navigator.clipboard?.writeText(`${location.origin}${location.pathname}#comment-${c.id}`)}>
                              <HugeiconsIcon icon={Link01Icon} />Sao chép liên kết
                            </DropdownMenuItem>
                            {mine && <DropdownMenuItem onSelect={() => setEditing({ id: c.id, content: c.content })}><HugeiconsIcon icon={PencilIcon} />Chỉnh sửa</DropdownMenuItem>}
                            {mine && <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c.id)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {editing?.id === c.id ? (
                      <div className="space-y-2">
                        <Textarea value={editing.content} placeholder="Chỉnh sửa bình luận..." onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={3} />
                        <div className="flex justify-end gap-2">
                          <Button size="xs" variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
                          <Button size="xs" disabled={!editing.content.trim() || update.isPending} onClick={() => update.mutate(editing, { onSuccess: () => setEditing(null) })}>{update.isPending ? "Đang lưu..." : "Lưu"}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 text-[13px] break-words whitespace-pre-line wrap-anywhere">{c.content}</div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground has-[>svg]:px-2"
                        onClick={() => insert(`@${user?.fullName ?? ""} `)}
                      >
                        <HugeiconsIcon icon={BubbleChatIcon} className="mr-1 h-3.5 w-3.5" /><span className="text-xs">Trả lời</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xoá bình luận?"
        description="Bạn có chắc muốn xoá bình luận này?"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
