import { useState } from "react"
import { Calendar, ChevronDown, User, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { DateRange, WorkspaceUser } from "../types/table"
import { DATE_PRESETS, rangeLabel } from "../utils/filters"
import { NativeSelect } from "./form-controls"

/** Date-range picker with presets (today … this quarter) and a custom from/to. */
export function DateRangeFilter({ value, onChange, label = "Ngày tạo", compact }: { value: DateRange | null; onChange: (v: DateRange | null) => void; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({})
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <Button size="icon-xs" variant="ghost" className={cn(value && "text-brand")} aria-label={`Lọc theo thời gian: ${value ? rangeLabel(value) : "tất cả"}`}><Calendar /></Button>
        ) : (
          <button type="button" className={cn("flex h-8 min-w-[140px] items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-left text-sm shadow-xs", value ? "border-brand bg-brand/5 text-brand" : "text-muted-foreground")}>
            <Calendar className="size-4 opacity-60" /><span className="flex-1 truncate">{value ? rangeLabel(value) : label}</span>
            {value ? <X className="size-4" onClick={(e) => { e.stopPropagation(); onChange(null) }} /> : <ChevronDown className="size-4 opacity-40" />}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Thời gian</p>
        {DATE_PRESETS.filter((p) => p.id !== "custom").map((p) => (
          <button key={p.id} type="button" onClick={() => { onChange({ preset: p.id }); setOpen(false) }}
            className={cn("block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted", value?.preset === p.id && "bg-brand/10 text-brand")}>{p.label}</button>
        ))}
        <div className="mt-1 space-y-2 border-t px-2 pt-2">
          <p className="text-xs font-medium text-muted-foreground">Tùy chọn</p>
          <Input type="date" className="h-8" value={custom.from ?? ""} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="Từ ngày" />
          <Input type="date" className="h-8" value={custom.to ?? ""} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="Đến ngày" />
          <Button size="sm" className="w-full" disabled={!custom.from && !custom.to} onClick={() => { onChange({ preset: "custom", ...custom }); setOpen(false) }}>Áp dụng</Button>
          <p className="text-[11px] text-muted-foreground">Múi giờ — theo trình duyệt</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function CreatorFilter({ users, value, onChange }: { users: WorkspaceUser[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground opacity-60" />
      <NativeSelect className={cn("h-8 w-[150px] bg-background pl-8 text-sm text-muted-foreground", value && "border-brand bg-brand/5 text-foreground")} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Người tạo">
        <option value="">Người tạo</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
      </NativeSelect>
    </div>
  )
}
