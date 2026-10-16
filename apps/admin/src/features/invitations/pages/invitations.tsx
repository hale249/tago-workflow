import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Mail01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { WORKSPACES } from "@/config/navigation"
import { usePendingInvitations } from "../api/invitations.queries"
import { InvitationCard } from "../components/invitation-card"
import { ToastView, useToast } from "../components/toast"

/** Lời mời: pending workspace invitations for the current user (reference /workspaces/:id/invitations). */
export function InvitationsPage() {
  // Same source as the sidebar WorkspaceSwitcher (first workspace is the active one).
  const workspace = WORKSPACES[0]!
  const { data: invitations = [], isLoading, isError, refetch, isFetching } = usePendingInvitations()
  const { toast, show } = useToast()
  const done = (kind: "success" | "error", message: string) => show({ kind, message })

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-8">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="h-7 w-fit gap-1.5 px-2 hover:bg-accent/50 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5">
            <Link to="/"><HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />Quay lại Bảng điều khiển</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">Lời mời cho {workspace.name}</h1>
          <p className="text-sm leading-[1.375rem] text-muted-foreground">Xem lại đội nhóm và vai trò trước khi tham gia.</p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border/70 bg-muted/20 py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
          {isError ? (
            <div className="grid gap-1 px-5">
              <p className="flex items-center gap-2 text-base font-semibold"><HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" />Không thể tải lời mời vào workspace</p>
              <p className="text-[13px] text-muted-foreground">Vui lòng thử lại sau ít phút.</p>
              <Button size="sm" variant="outline" className="mt-3 w-fit" disabled={isFetching} onClick={() => refetch()}>Thử lại</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-1 px-5">
                <p className="flex items-center gap-2 text-base font-semibold"><HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" />Lời mời vào workspace</p>
                {!isLoading && !invitations.length && <p className="text-[13px] text-muted-foreground">Bạn không có lời mời vào workspace nào đang chờ.</p>}
              </div>
              {isLoading && <div className="px-5"><Skeleton className="h-28" /></div>}
              {invitations.length > 0 && (
                <div className="grid gap-3 px-5">
                  {invitations.map((inv) => <InvitationCard key={inv.id} invitation={inv} onDone={done} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ToastView toast={toast} />
    </section>
  )
}
