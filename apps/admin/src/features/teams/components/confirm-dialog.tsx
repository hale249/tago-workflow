import type { ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"

/** Destructive confirmation ("Xóa đội nhóm?" …) with a pending label while the mutation runs. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, pending, onConfirm }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="tracking-tight">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" className="px-3" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button variant="destructive" size="sm" className="px-3" disabled={pending} onClick={onConfirm}>{pending ? "Đang xóa..." : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
