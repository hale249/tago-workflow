import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { ActiveTable, GanttConfig, TableRecord } from "../types/table"

const DAY = 86_400_000
type Zoom = "week" | "month" | "quarter" | "year"
/** Pixel width of one day at each zoom level. */
const DAY_PX: Record<Zoom, number> = { week: 44, month: 22, quarter: 8, year: 3 }
const ZOOMS: { id: Zoom; label: string }[] = [{ id: "week", label: "Tuần" }, { id: "month", label: "Tháng" }, { id: "quarter", label: "Quý" }, { id: "year", label: "Năm" }]
const WEEKDAY = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"]
const MONTH = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" })
const ROW_H = 36

const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
const startOfMonth = (t: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime() }
const addMonths = (t: number, n: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime() }

/** Timeline with a fixed task pane (name + duration) and a scrollable day grid. */
export function RecordsGanttView({ table, config, records, onOpen }: { table: ActiveTable; config: GanttConfig; records: TableRecord[]; onOpen: (r: TableRecord) => void }) {
  const [zoom, setZoom] = useState<Zoom>("week")
  const scroller = useRef<HTMLDivElement>(null)
  const pane = useRef<HTMLDivElement>(null)
  const status = table.config.fields.find((f) => f.name === config.statusField)
  const px = DAY_PX[zoom]

  const rows = useMemo(
    () =>
      records
        .map((r) => {
          const s = Date.parse(String(r.record[config.startDateField] ?? ""))
          const e = Date.parse(String(r.record[config.endDateField] ?? ""))
          const start = startOfDay(Number.isNaN(s) ? e : s)
          const end = startOfDay(Number.isNaN(e) ? s : e)
          return { r, start: Math.min(start, end), end: Math.max(start, end) }
        })
        .filter((x) => !Number.isNaN(x.start))
        .sort((a, b) => a.start - b.start),
    [records, config],
  )

  // Range: whole months around the data and today, with a month of padding each side.
  const today = startOfDay(Date.now())
  const from = addMonths(startOfMonth(Math.min(today, ...rows.map((x) => x.start))), -1)
  const to = addMonths(startOfMonth(Math.max(today, ...rows.map((x) => x.end))), 2)
  const days = Math.round((to - from) / DAY)
  const x = (t: number) => ((t - from) / DAY) * px

  const scrollToToday = () => scroller.current?.scrollTo({ left: Math.max(0, x(today) - 200), behavior: "smooth" })
  const page = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" })
  // Block body: newer browsers return a Promise from scrollTo, which React would treat as cleanup.
  useEffect(() => { scrollToToday() }, [zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  const months: { t: number; w: number }[] = []
  for (let m = from; m < to; m = addMonths(m, 1)) months.push({ t: m, w: x(addMonths(m, 1)) - x(m) })
  const showDays = zoom === "week" || zoom === "month"
  const colorOf = (r: TableRecord) => status?.options?.find((o) => o.value === r.record[config.statusField])
  const width = days * px

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div className="flex items-center gap-1">
        {ZOOMS.map((z) => (
          <Button key={z.id} size="sm" variant={zoom === z.id ? "secondary" : "ghost"} className="h-8" onClick={() => setZoom(z.id)}>{z.label}</Button>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8" onClick={scrollToToday}>Hôm nay</Button>
          <Button size="icon-sm" variant="ghost" aria-label="Lùi" onClick={() => page(-1)}><ChevronLeft /></Button>
          <Button size="icon-sm" variant="ghost" aria-label="Tới" onClick={() => page(1)}><ChevronRight /></Button>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border text-sm">
        {/* Task pane */}
        <div className="flex w-80 shrink-0 flex-col border-r max-md:w-48">
          <div className="flex h-14 items-end justify-between border-b px-3 pb-2 text-xs text-muted-foreground"><span>Tên</span><span>Thời lượng</span></div>
          <div ref={pane} className="no-scrollbar min-h-0 flex-1 overflow-y-auto" onScroll={(e) => scroller.current && scroller.current.scrollTop !== e.currentTarget.scrollTop && (scroller.current.scrollTop = e.currentTarget.scrollTop)}>
            <div className="flex items-center border-b bg-muted/40 px-3 text-xs font-medium" style={{ height: ROW_H }}>{table.name}</div>
            {rows.map(({ r, start, end }) => (
              <button key={r.id} type="button" onClick={() => onOpen(r)} className="flex w-full items-center gap-2 border-b px-3 text-left hover:bg-muted/50" style={{ height: ROW_H }}>
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(r)?.textColor ?? "#9ca3af" }} />
                <span className="min-w-0 flex-1 truncate text-[13px]">{String(r.record[config.taskNameField] || "(Không tên)")}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{Math.round((end - start) / DAY) + 1} ngày</span>
              </button>
            ))}
            {!rows.length && <p className="p-6 text-center text-xs text-muted-foreground">Không có bản ghi nào có ngày bắt đầu/kết thúc.</p>}
          </div>
        </div>

        {/* Timeline */}
        <div ref={scroller} className="min-w-0 flex-1 overflow-auto" onScroll={(e) => pane.current && pane.current.scrollTop !== e.currentTarget.scrollTop && (pane.current.scrollTop = e.currentTarget.scrollTop)}>
          <div className="relative" style={{ width }}>
            <div className="sticky top-0 z-20 h-14 border-b bg-background">
              <div className="flex h-7">
                {months.map((m) => (
                  <div key={m.t} className="shrink-0 truncate border-r px-2 pt-1.5 text-xs font-medium capitalize" style={{ width: m.w }}>{MONTH.format(m.t)}</div>
                ))}
              </div>
              {showDays && (
                <div className="flex h-7">
                  {Array.from({ length: days }, (_, i) => {
                    const d = new Date(from + i * DAY)
                    return (
                      <div key={i} className="shrink-0 border-r text-center leading-3" style={{ width: px }}>
                        <span className="block text-[11px] font-medium">{d.getDate()}</span>
                        {zoom === "week" && <span className="text-[9px] text-muted-foreground">{WEEKDAY[d.getDay()]}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
              <span className="absolute top-0 rounded-b bg-brand px-3 py-0.5 text-[10px] text-white" style={{ left: x(today) + px / 2 - 34 }}>Hôm nay</span>
            </div>

            {/* grid: weekends + today line */}
            <div className="pointer-events-none absolute inset-x-0 top-14 bottom-0">
              {showDays && Array.from({ length: days }, (_, i) => {
                const wd = new Date(from + i * DAY).getDay()
                return wd === 0 || wd === 6 ? <div key={i} className="absolute inset-y-0 bg-muted/60" style={{ left: i * px, width: px }} /> : null
              })}
              {months.map((m) => <div key={m.t} className="absolute inset-y-0 w-px bg-border" style={{ left: x(m.t) }} />)}
              <div className="absolute inset-y-0 w-px bg-foreground/60" style={{ left: x(today) + px / 2 }} />
            </div>

            <div className="relative" style={{ height: ROW_H * (rows.length + 1) }}>
              {rows.map(({ r, start, end }, i) => {
                const opt = colorOf(r)
                const done = !!config.statusCompleteValue && r.record[config.statusField] === config.statusCompleteValue
                const progress = config.progressField ? Math.max(0, Math.min(100, Number(r.record[config.progressField]) || 0)) : done ? 100 : 0
                const w = Math.max(px, x(end + DAY) - x(start)) - 2
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpen(r)}
                    title={`${String(r.record[config.taskNameField] ?? "")} · ${progress}%`}
                    className={cn("absolute flex items-center overflow-hidden rounded text-[11px] font-medium shadow-xs", done && "opacity-70")}
                    style={{ top: ROW_H * (i + 1) + 7, height: ROW_H - 14, left: x(start) + 1, width: w, backgroundColor: opt?.backgroundColor ?? "#dbeafe", color: opt?.textColor ?? "#1e3a8a" }}
                  >
                    <span className="absolute inset-y-0 left-0 opacity-25" style={{ width: `${progress}%`, backgroundColor: opt?.textColor ?? "#1d4ed8" }} />
                    {w > 60 && <span className="relative truncate px-2">{String(r.record[config.taskNameField] ?? "")}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
