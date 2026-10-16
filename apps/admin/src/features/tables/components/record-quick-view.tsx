import { useEffect, useState } from "react"

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

const MIN_W = 480
const MAX_W = 1440
const DEFAULT_W = 840
const WIDTH_KEY = "tables.quickViewWidth"
const clampWidth = (w: number) => Math.round(Math.min(Math.max(w, MIN_W), MAX_W, window.innerWidth))
const readWidth = () => {
  try { return Number(localStorage.getItem(WIDTH_KEY)) || DEFAULT_W } catch { return DEFAULT_W }
}

/** Quick-view drawer (reference: right sheet, ~840px, light backdrop) — keeps the list and its filters behind it. */
export function RecordQuickView({ tableId, recordId, records, onOpen, onClose }: Props) {
  const index = records.findIndex((r) => r.id === recordId)
  const prev = index > 0 ? () => onOpen(records[index - 1]!.id) : undefined
  const next = index >= 0 && index < records.length - 1 ? () => onOpen(records[index + 1]!.id) : undefined

  const [width, setWidth] = useState(() => clampWidth(readWidth()))
  useEffect(() => {
    try { localStorage.setItem(WIDTH_KEY, String(width)) } catch { /* storage unavailable */ }
  }, [width])

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

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault()
    const move = (ev: PointerEvent) => setWidth(clampWidth(window.innerWidth - ev.clientX))
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  return (
    <Sheet open={!!recordId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-background/35"
        style={{ width, minWidth: Math.min(MIN_W, window.innerWidth), maxWidth: "100vw" }}
        className="grid max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 outline-none data-[state=open]:duration-300 sm:max-w-none"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để thay đổi kích thước"
          aria-valuemin={MIN_W}
          aria-valuemax={MAX_W}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault()
              setWidth((w) => clampWidth(w + (e.key === "ArrowLeft" ? 40 : -40)))
            }
          }}
          className="group absolute top-0 left-0 z-20 h-full w-3 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-border after:transition-colors hover:after:w-0.5 hover:after:bg-primary/70 focus-visible:after:w-0.5 focus-visible:after:bg-ring max-sm:hidden"
        >
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-0 h-10 w-2 -translate-y-1/2 rounded-r-md border border-l-0 bg-card opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </div>
        <SheetTitle className="sr-only">Xem nhanh bản ghi</SheetTitle>
        <SheetDescription className="sr-only">Chi tiết bản ghi, bình luận và bản ghi liên quan</SheetDescription>
        {recordId && <RecordDetailView tableId={tableId} recordId={recordId} mode="drawer" onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
