import { useId, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Calendar01Icon, Cancel01Icon, Clock01Icon, Tick02Icon, UserIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { SelectChevron } from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import type { DateRange, WorkspaceUser } from "../types/table"
import { DATE_PRESETS, rangeLabel } from "../utils/filters"

const PRESET = "inline-flex h-9 items-center justify-start rounded-md px-3 text-sm font-normal whitespace-nowrap transition-colors hover:bg-accent/50 hover:text-accent-foreground focus-visible:ring-4 focus-visible:ring-ring/10 focus-visible:outline-none"

/** Browser time zone in the reference's "UTC + 7:00" format. */
function tzLabel() {
  const off = -new Date().getTimezoneOffset()
  const a = Math.abs(off)
  return `UTC ${off < 0 ? "-" : "+"} ${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`
}

/** Date-range picker with presets (today … this quarter) and a custom from/to. */
export function DateRangeFilter({ value, onChange, label = "Ngày tạo", compact, className }: { value: DateRange | null; onChange: (v: DateRange | null) => void; label?: string; compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({})
  const [showCustom, setShowCustom] = useState(false)
  const uid = useId()
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setShowCustom(value?.preset === "custom") }}>
      <PopoverTrigger asChild>
        {compact ? (
          <Button size="icon-xs" variant="ghost" className={cn("size-6 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", value && "text-brand")} aria-label={`Lọc theo thời gian: ${value ? rangeLabel(value) : "tất cả"}`}><HugeiconsIcon icon={Calendar01Icon} className="size-3.5" /></Button>
        ) : (
          <button type="button" className={cn("inline-flex h-8 w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-left has-[>svg]:px-2 text-sm font-normal whitespace-nowrap shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto sm:min-w-[140px]", value ? "border-brand bg-brand/5 text-brand" : "text-muted-foreground", className)}>
            <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-3.5 opacity-70" /><span className="flex-1 truncate">{value ? rangeLabel(value) : label}</span>
            <span className="ml-2 flex shrink-0 items-center gap-1">
              {value ? <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" onClick={(e) => { e.stopPropagation(); onChange(null) }} /> : <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-40" />}
            </span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto flex-row overflow-hidden border-border p-0 shadow-surface-hover sm:max-w-[min(640px,calc(100vw-3rem))]">
        <div className="flex w-[200px] flex-col border-r bg-muted/30">
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            <span className="px-2 py-2 text-xs font-medium text-muted-foreground">Thời gian</span>
            {DATE_PRESETS.filter((p) => p.id !== "custom").map((p) => (
              <button key={p.id} type="button" onClick={() => { onChange({ preset: p.id }); setShowCustom(false); setOpen(false) }}
                className={cn(PRESET, value?.preset === p.id && "bg-accent text-accent-foreground")}>{p.label}</button>
            ))}
            <div className="mt-1 border-t border-border/50 pt-2">
              <button type="button" onClick={() => setShowCustom(true)} className={cn(PRESET, "w-full", (showCustom || value?.preset === "custom") && "bg-accent text-accent-foreground")}>Tùy chọn</button>
            </div>
          </div>
          <div className="flex items-center border-t bg-muted/10 p-3 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={12} strokeWidth={2} className="mr-2" />Múi giờ — {tzLabel()}
          </div>
        </div>
        {showCustom && (
          <div className="flex w-[320px] flex-col bg-background">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label htmlFor={`${uid}-from`} className="text-xs font-medium text-muted-foreground">Từ ngày</label>
                <Input id={`${uid}-from`} type="date" className="h-8 shadow-xs" value={custom.from ?? ""} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label htmlFor={`${uid}-to`} className="text-xs font-medium text-muted-foreground">Đến ngày</label>
                <Input id={`${uid}-to`} type="date" className="h-8 shadow-xs" value={custom.to ?? ""} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
              </div>
            </div>
            <div className="mt-auto flex items-center justify-end border-t bg-muted/10 p-3">
              <Button size="sm" className="h-8 px-5 text-xs shadow-xs" disabled={!custom.from && !custom.to} onClick={() => { onChange({ preset: "custom", ...custom }); setOpen(false) }}>Áp dụng</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function CreatorFilter({ users, value, onChange }: { users: WorkspaceUser[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = users.find((u) => u.id === value)
  const pick = (v: string) => { onChange(v); setOpen(false) }
  const item = "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Lọc theo Người tạo"
          className={cn(
            "flex h-8 w-full flex-none items-center justify-start gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:w-[150px] sm:max-w-[150px] sm:min-w-[150px]",
            value ? "border-brand bg-brand/5 text-foreground" : "text-muted-foreground",
          )}
        >
          <HugeiconsIcon icon={UserIcon} className="h-4 w-4 shrink-0 opacity-70" />
          <span className="block min-w-0 flex-1 truncate text-left">{current?.fullName ?? "Người tạo"}</span>
          <SelectChevron className="ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[60] max-h-[300px] w-[220px] max-w-[220px] min-w-[220px] overflow-y-auto p-1 shadow-md">
        <div role="listbox" aria-label="Người tạo">
          <button type="button" role="option" aria-selected={!value} onClick={() => pick("")} className={cn(item, !value && "bg-accent text-accent-foreground")}>
            {!value && <span className="absolute left-2 flex size-3.5 items-center justify-center"><HugeiconsIcon icon={Tick02Icon} className="size-4" /></span>}
            Tất cả người tạo
          </button>
          {users.map((u) => (
            <button key={u.id} type="button" role="option" aria-selected={value === u.id} onClick={() => pick(u.id)} className={cn(item, value === u.id && "bg-accent text-accent-foreground")}>
              {value === u.id && <span className="absolute left-2 flex size-3.5 items-center justify-center"><HugeiconsIcon icon={Tick02Icon} className="size-4" /></span>}
              <span className="truncate" title={u.fullName}>{u.fullName}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
