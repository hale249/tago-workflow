import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

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
const HEADER_H = 56
const todayLabel = (t: number) => { const d = new Date(t); return `${d.getDate()} thg ${d.getMonth() + 1} năm ${d.getFullYear()}` }
const NAV_BTN = "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"

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

  const zoomBtn = (active: boolean) =>
    cn("h-7 rounded-md px-2.5 text-[13px] transition-colors duration-150", active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")

  return (
    <div className="relative flex h-[calc(100dvh-190px)] min-h-[320px] w-full flex-col sm:h-[calc(100vh-220px)] sm:min-h-[400px]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-background pb-2">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex min-w-0 items-center gap-0.5" aria-label="Gantt">
            {ZOOMS.map((z) => (
              <button key={z.id} type="button" className={zoomBtn(zoom === z.id)} aria-pressed={zoom === z.id} onClick={() => setZoom(z.id)}>{z.label}</button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className="hidden h-7 rounded-md border border-border px-2.5 text-[13px] text-foreground transition-colors duration-150 hover:bg-accent sm:block" onClick={scrollToToday}>Hôm nay</button>
            <button type="button" aria-label="Kỳ trước" className={NAV_BTN} onClick={() => page(-1)}><HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" /></button>
            <button type="button" aria-label="Kỳ sau" className={NAV_BTN} onClick={() => page(1)}><HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-background">
        {/* Task pane */}
        <div className="flex w-44 shrink-0 flex-col border-r border-border/70 sm:w-80">
          <div className="flex shrink-0 items-end justify-between gap-2 border-b border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground" style={{ height: HEADER_H }}>
            <p className="flex-1 truncate text-left">Tên</p><p className="hidden shrink-0 sm:block">Thời lượng</p>
          </div>
          <div ref={pane} className="no-scrollbar min-h-0 flex-1 overflow-y-auto" onScroll={(e) => scroller.current && scroller.current.scrollTop !== e.currentTarget.scrollTop && (scroller.current.scrollTop = e.currentTarget.scrollTop)}>
            <p className="flex w-full items-center border-b border-border/50 bg-muted/40 px-3 text-left text-xs font-medium text-foreground" style={{ height: ROW_H }}>{table.name}</p>
            {rows.map(({ r, start, end }) => (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(r)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(r))}
                className="group relative flex cursor-pointer items-center gap-2 border-b border-border/50 px-2.5 text-xs transition-colors outline-none hover:bg-accent/70 focus-visible:bg-accent/70 sm:gap-2.5 sm:px-3"
                style={{ height: ROW_H }}
              >
                <span className="pointer-events-none h-2 w-2 shrink-0 rounded-full ring-2 ring-background" style={{ backgroundColor: colorOf(r)?.textColor ?? "#6c757d" }} />
                <p className="pointer-events-none min-w-0 flex-1 truncate text-left font-medium text-foreground">{String(r.record[config.taskNameField] || "(Không tên)")}</p>
                <p className="pointer-events-none hidden shrink-0 text-muted-foreground sm:block">{Math.round((end - start) / DAY) + 1} ngày</p>
              </div>
            ))}
            {!rows.length && <p className="p-6 text-center text-xs text-muted-foreground">Không có bản ghi nào có ngày bắt đầu/kết thúc.</p>}
          </div>
        </div>

        {/* Timeline */}
        <div ref={scroller} className="min-w-0 flex-1 overflow-auto overscroll-contain" onScroll={(e) => pane.current && pane.current.scrollTop !== e.currentTarget.scrollTop && (pane.current.scrollTop = e.currentTarget.scrollTop)}>
          <div className="relative min-h-full" style={{ width, minHeight: HEADER_H + ROW_H * (rows.length + 1) }}>
            <div className="sticky top-0 z-20 border-b border-border/70 bg-background" style={{ height: HEADER_H }}>
              <div className="flex">
                {months.map((m) => (
                  <div key={m.t} className="shrink-0" style={{ width: m.w }}>
                    <div className="sticky left-0 inline-flex px-3 pt-2 pb-0.5 text-xs font-medium whitespace-nowrap text-foreground first-letter:uppercase"><p>{MONTH.format(m.t)}</p></div>
                  </div>
                ))}
              </div>
              {showDays && (
                <div className="flex">
                  {Array.from({ length: days }, (_, i) => {
                    const d = new Date(from + i * DAY)
                    return (
                      <div key={i} className="flex shrink-0 items-center justify-center border-l border-border/60 py-1 text-center text-[11px] text-muted-foreground first:border-l-0" style={{ width: px }}>
                        <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
                          <p className="font-medium text-foreground tabular-nums">{d.getDate()}</p>
                          {zoom === "week" && <p className="text-[10px]">{WEEKDAY[d.getDay()]}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* grid: one column per day (weekends shaded), month dividers */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex divide-x divide-border/50" style={{ top: HEADER_H }}>
              {showDays
                ? Array.from({ length: days }, (_, i) => {
                    const wd = new Date(from + i * DAY).getDay()
                    return <div key={i} className={cn("h-full shrink-0", wd === 0 || wd === 6 ? "bg-muted/55" : "bg-background/20")} style={{ width: px }} />
                  })
                : months.map((m) => <div key={m.t} className="h-full shrink-0 bg-background/20" style={{ width: m.w }} />)}
            </div>

            {/* today marker: label pinned to the top, line through the rows */}
            <div className="pointer-events-none absolute top-0 left-0 z-20 flex h-full flex-col items-center overflow-visible" style={{ width: 0, transform: `translateX(${x(today) + px / 2}px)` }}>
              <div className="group pointer-events-auto sticky top-0 flex flex-col flex-nowrap items-center justify-center rounded-b bg-primary px-1.5 py-0.5 text-[10px] leading-4 font-medium whitespace-nowrap text-primary-foreground">
                Hôm nay<span className="max-h-0 overflow-hidden opacity-80 transition-all group-hover:max-h-8">{todayLabel(today)}</span>
              </div>
              <div className="h-full w-px bg-primary/60" />
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
                    className={cn("absolute z-10 flex items-center overflow-hidden rounded text-[11px] font-medium shadow-xs", done && "opacity-70")}
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
