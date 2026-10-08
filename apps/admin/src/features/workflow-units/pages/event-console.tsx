import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router"
import { ChevronLeft, Download, Play, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useClearLogs, useEvent, useLogs, useTestRun } from "../api/workflow.queries"
import type { LogLevel } from "../types/workflow"

const LEVELS: { id: LogLevel; label: string; cls: string }[] = [
  { id: "debug", label: "Debug", cls: "text-muted-foreground" },
  { id: "info", label: "Info", cls: "text-sky-600" },
  { id: "warn", label: "Warn", cls: "text-amber-600" },
  { id: "error", label: "Error", cls: "text-destructive" },
]
const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export function EventConsolePage() {
  const { unitId = "", eventId = "" } = useParams()
  const { data: event } = useEvent(eventId)
  const run = useTestRun()
  const clear = useClearLogs()
  const { data: logs = [] } = useLogs(eventId, run.isPending)
  const [levels, setLevels] = useState<LogLevel[]>(["debug", "info", "warn", "error"])
  const [autoScroll, setAutoScroll] = useState(true)
  const end = useRef<HTMLDivElement>(null)
  const shown = logs.filter((l) => levels.includes(l.level))
  useEffect(() => { if (autoScroll) end.current?.scrollIntoView({ block: "end" }) }, [shown.length, autoScroll])
  const download = () => {
    const blob = new Blob([shown.map((l) => `${l.at}\t${l.level.toUpperCase()}\t${l.stepId ?? "-"}\t${l.message}`).join("\n")], { type: "text/plain" })
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${event?.name ?? "logs"}.log` }).click()
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm">
        <Button asChild size="icon-sm" variant="ghost" aria-label="Quay lại"><Link to={`/workflow-units/${unitId}/events/${eventId}/edit`}><ChevronLeft /></Link></Button>
        <span className="font-medium">{event?.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />Connected</span>
        <span className="text-xs text-muted-foreground">{logs.length} total • {shown.length} shown</span>
        <span className="ml-auto flex flex-wrap items-center gap-1">
          <Button size="sm" className="h-8" disabled={run.isPending} onClick={() => run.mutate(eventId)}><Play />{run.isPending ? "Đang chạy…" : "Chạy thử"}</Button>
          <Button size="sm" variant="outline" className="h-8" disabled={!shown.length} onClick={download}><Download />Export</Button>
          <Button size="sm" variant="outline" className="h-8" disabled={!logs.length} onClick={() => clear.mutate(eventId)}><Trash2 />Clear</Button>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-1.5 text-xs">
        <span className="text-muted-foreground">Levels:</span>
        {LEVELS.map((l) => (
          <button key={l.id} type="button" aria-pressed={levels.includes(l.id)} onClick={() => setLevels(levels.includes(l.id) ? levels.filter((x) => x !== l.id) : [...levels, l.id])}
            className={cn("rounded border px-2 py-0.5", levels.includes(l.id) ? "border-brand bg-brand/10 text-brand" : "text-muted-foreground")}>{l.label}</button>
        ))}
        <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />Auto-scroll</label>
      </div>
      <div className="flex-1 overflow-y-auto bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
        {!shown.length && <p className="py-16 text-center text-zinc-500">Chưa có log. Bấm “Chạy thử” — log sẽ hiện ở đây khi workflow chạy.</p>}
        {shown.map((l) => (
          <p key={l.id} className="flex gap-3 py-0.5">
            <span className="text-zinc-500">{time.format(new Date(l.at))}</span>
            <span className={cn("w-12 uppercase", LEVELS.find((x) => x.id === l.level)!.cls)}>{l.level}</span>
            {l.stepId && <span className="text-violet-400">[{l.stepId}]</span>}
            <span className="min-w-0 break-all">{l.message}</span>
          </p>
        ))}
        <div ref={end} />
      </div>
    </section>
  )
}
