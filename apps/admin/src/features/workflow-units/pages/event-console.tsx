import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Download01Icon, InformationCircleIcon, PlayIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useClearLogs, useEvent, useLogs, useTestRun } from "../api/workflow.queries"
import type { LogLevel } from "../types/workflow"

const LEVELS: { id: LogLevel; cls: string }[] = [
  { id: "debug", cls: "text-muted-foreground" },
  { id: "info", cls: "text-accent-blue" },
  { id: "warn", cls: "text-warning-subtle-foreground" },
  { id: "error", cls: "text-destructive" },
]
const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
const checkbox = "data-[state=checked]:border-primary data-[state=checked]:bg-primary"

export function EventConsolePage() {
  const { eventId = "" } = useParams()
  const { data: event } = useEvent(eventId)
  const run = useTestRun()
  const clear = useClearLogs()
  const { data: logs = [] } = useLogs(eventId, run.isPending)
  const [levels, setLevels] = useState<LogLevel[]>(["debug", "info", "warn", "error"])
  const [q, setQ] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const end = useRef<HTMLDivElement>(null)
  const needle = q.trim().toLowerCase()
  const shown = logs.filter((l) => levels.includes(l.level) && (!needle || `${l.stepId ?? ""} ${l.message}`.toLowerCase().includes(needle)))
  useEffect(() => { if (autoScroll) end.current?.scrollIntoView({ block: "end" }) }, [shown.length, autoScroll])
  const asText = () => shown.map((l) => `${l.at}\t${l.level.toUpperCase()}\t${l.stepId ?? "-"}\t${l.message}`).join("\n")
  /** Reference copies the visible logs to the clipboard; fall back to a .log download. */
  const exportLogs = () => {
    const text = asText()
    if (navigator.clipboard) return void navigator.clipboard.writeText(text)
    const blob = new Blob([text], { type: "text/plain" })
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${event?.name ?? "logs"}.log` }).click()
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="space-y-4 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full", run.isPending ? "animate-pulse bg-warning" : "bg-success")} aria-label={run.isPending ? "Running" : "Connected"} />
            <span className="text-sm font-medium">{run.isPending ? "Running..." : "Connected"}</span>
            <span className="ml-2 inline-flex h-[22px] items-center rounded-md border border-border bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground">{logs.length} total • {shown.length} shown</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" title={event ? `Chạy thử “${event.name}”` : "Chạy thử"} disabled={run.isPending} onClick={() => run.mutate(eventId)}><HugeiconsIcon icon={PlayIcon} className="size-4" />{run.isPending ? "Đang chạy…" : "Chạy thử"}</Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" aria-label="Export logs to clipboard" disabled={!shown.length} onClick={exportLogs}><HugeiconsIcon icon={Download01Icon} className="size-4" />Export</Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2.5 has-[>svg]:px-2" aria-label="Clear all logs" disabled={!logs.length} onClick={() => clear.mutate(eventId)}><HugeiconsIcon icon={Delete02Icon} className="size-4" />Clear</Button>
          </div>
        </div>
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs..." aria-label="Search logs" className="h-8 pl-10" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Levels:</label>
            {LEVELS.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <Checkbox id={`level-${l.id}`} aria-label={`Filter ${l.id} logs`} className={checkbox} checked={levels.includes(l.id)}
                  onCheckedChange={(v) => setLevels(v ? [...levels, l.id] : levels.filter((x) => x !== l.id))} />
                <label htmlFor={`level-${l.id}`} className="cursor-pointer text-sm font-medium capitalize">{l.id}</label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="auto-scroll" aria-label="Auto-scroll to latest log" className={checkbox} checked={autoScroll} onCheckedChange={(v) => setAutoScroll(v === true)} />
            <label htmlFor="auto-scroll" className="cursor-pointer text-sm font-medium">Auto-scroll</label>
          </div>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {!shown.length ? (
          // The reference's console is a full-viewport (h-screen) panel under the 48px app header, so its
          // empty state sits 24px below the visible centre; pt-12 reproduces that without clipping logs.
          <div className="flex h-full items-center justify-center pt-12">
            <div className="text-center text-muted-foreground">
              <HugeiconsIcon icon={InformationCircleIcon} className="mx-auto mb-4 size-12 opacity-50" />
              <p className="text-lg font-medium">No logs to display</p>
              <p className="mt-1 text-sm">{logs.length ? "No logs match the current filters" : run.isPending ? "Running workflow..." : "Waiting for logs..."}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60 font-mono text-xs">
            {shown.map((l) => (
              <p key={l.id} className="flex gap-3 px-4 py-1.5 hover:bg-muted/50">
                <span className="shrink-0 text-muted-foreground tabular-nums">{time.format(new Date(l.at))}</span>
                <span className={cn("w-12 shrink-0 font-semibold uppercase", LEVELS.find((x) => x.id === l.level)!.cls)}>{l.level}</span>
                {l.stepId && <span className="shrink-0 text-accent-purple">[{l.stepId}]</span>}
                <span className="min-w-0 break-all text-foreground">{l.message}</span>
              </p>
            ))}
            <div ref={end} />
          </div>
        )}
      </div>
    </section>
  )
}
