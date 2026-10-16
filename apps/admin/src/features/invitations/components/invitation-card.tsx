import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, UserGroupIcon, UserIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { useAcceptInvitation, useRejectInvitation } from "../api/invitations.queries"
import type { Invitation } from "../types/invitation"

const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()

export function InvitationCard({ invitation: inv, onDone }: { invitation: Invitation; onDone: (kind: "success" | "error", message: string) => void }) {
  const accept = useAcceptInvitation()
  const reject = useRejectInvitation()
  const [confirm, setConfirm] = useState(false)
  const busy = accept.isPending || reject.isPending
  const fail = (e: Error) => onDone("error", e.message)

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-card)] bg-surface-elevated p-4 shadow-surface sm:flex-row sm:items-start">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-base font-semibold text-white ring-1 ring-border", inv.color)}>
        {initials(inv.workspaceName)}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base leading-tight font-semibold">{inv.workspaceName}</h3>
            <span className="inline-flex h-5 items-center rounded-md border border-transparent bg-warning-subtle px-1.5 text-[11px] font-medium text-warning-subtle-foreground">Đang chờ</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">@{inv.namespace}</p>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex min-w-0 items-center gap-2"><HugeiconsIcon icon={UserIcon} className="size-3.5 shrink-0" />Mời bởi <span className="truncate text-foreground">{inv.invitedBy}</span></p>
          <p className="flex items-center gap-2"><HugeiconsIcon icon={Calendar01Icon} className="size-3.5 shrink-0" />Gửi lúc {day.format(new Date(inv.createdAt))}</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs font-medium">Phân công đội nhóm và vai trò</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="flex items-center gap-1.5 text-muted-foreground"><HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />Đội</dt>
            <dd className={cn("truncate", !inv.team && "text-muted-foreground")}>{inv.team ?? "Đội chưa xác định"}</dd>
            <dt className="flex items-center gap-1.5 text-muted-foreground"><HugeiconsIcon icon={UserIcon} className="size-3.5" />Vai trò</dt>
            <dd className={cn("truncate", !inv.role && "text-muted-foreground")}>{inv.role ?? "Vai trò chưa xác định"}</dd>
          </dl>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col">
        <Button size="sm" disabled={busy} onClick={() => accept.mutate(inv.id, { onSuccess: () => onDone("success", "Đã chấp nhận lời mời vào workspace."), onError: fail })}>
          {accept.isPending ? "Đang chấp nhận..." : "Chấp nhận"}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm(true)}>
          {reject.isPending ? "Đang từ chối..." : "Từ chối"}
        </Button>
      </div>

      <Dialog open={confirm} onOpenChange={(o) => !reject.isPending && setConfirm(o)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Từ chối lời mời?</DialogTitle>
            <DialogDescription>Bạn sẽ không tham gia workspace “{inv.workspaceName}”. Người mời cần gửi lại lời mời nếu bạn muốn tham gia sau này.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={reject.isPending} onClick={() => setConfirm(false)}>Giữ lời mời</Button>
            <Button variant="destructive" disabled={reject.isPending}
              onClick={() => reject.mutate(inv.id, { onSuccess: () => { setConfirm(false); onDone("success", "Đã từ chối lời mời vào workspace.") }, onError: (e) => { setConfirm(false); fail(e) } })}>
              {reject.isPending ? "Đang từ chối..." : "Từ chối lời mời"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
