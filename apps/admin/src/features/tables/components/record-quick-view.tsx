import { useEffect } from "react"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet"
import type { TableRecord } from "../types/table"
import { RecordDetailView } from "./record-detail-view"

type Props = {
  tableId: string
  recordId: string | null
  /** Records in the order currently shown, for ↑ / ↓ navigation. */
  records: TableRecord[]
  onOpen: (id: string) => void
  onClose: () => void
}

/** Quick-view drawer (reference: right sheet, ~840px, light backdrop) — keeps the list and its filters behind it. */
export function RecordQuickView({ tableId, recordId, records, onOpen, onClose }: Props) {
  const index = records.findIndex((r) => r.id === recordId)
  const prev = index > 0 ? () => onOpen(records[index - 1]!.id) : undefined
  const next = index >= 0 && index < records.length - 1 ? () => onOpen(records[index + 1]!.id) : undefined

  useEffect(() => {
    if (!recordId) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowUp" && prev) { e.preventDefault(); prev() }
      if (e.key === "ArrowDown" && next) { e.preventDefault(); next() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [recordId, prev, next])

  return (
    <Sheet open={!!recordId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-background/35"
        className="w-full gap-0 p-0 outline-none sm:w-[85vw] sm:max-w-[1120px] data-[state=open]:duration-300"
      >
        <SheetTitle className="sr-only">Xem nhanh bản ghi</SheetTitle>
        <SheetDescription className="sr-only">Chi tiết bản ghi, bình luận và bản ghi liên quan</SheetDescription>
        {recordId && (
          <RecordDetailView
            tableId={tableId}
            recordId={recordId}
            mode="drawer"
            onClose={onClose}
            nav={index >= 0 ? { index, total: records.length, prev, next } : undefined}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
