import { useMemo, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { SelectChevron } from "@/components/select"

export type ComboOption = {
  value: string
  /** Plain text, used for search and as the default label. */
  text: string
  /** Optional dot color shown before the label (select-one options). */
  color?: string
  /** Custom label node (e.g. a user chip); falls back to `text`. */
  node?: ReactNode
}

type Props = {
  value: string
  onChange: (v: string) => void
  options: ComboOption[]
  placeholder?: string
  /** "sm" = h-8 option picker, "lg" = h-10 record / user picker (reference sizes). */
  size?: "sm" | "lg"
  /** "form" = the record form's chevron (muted Hugeicons arrow). */
  chevron?: "select" | "form"
  /** Muted placeholder (reference record picker); default is the near-foreground option placeholder. */
  mutedPlaceholder?: boolean
  clearable?: boolean
  invalid?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
  "aria-describedby"?: string
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()

function Dot({ color }: { color: string }) {
  return <span className="size-2.5 shrink-0 rounded-full border" style={{ backgroundColor: color }} />
}

/** Single-value dropdown styled like the reference product (not a native <select>). */
export function ComboSelect({ value, onChange, options, placeholder = "Chọn", size = "sm", chevron = "select", mutedPlaceholder, clearable, invalid, disabled, id, className, ...rest }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const selected = options.find((o) => o.value === value)
  const shown = useMemo(() => {
    const n = fold(q.trim())
    return n ? options.filter((o) => fold(o.text).includes(n)) : options
  }, [options, q])
  const searchable = options.length > 7

  const label = (o: ComboOption) => (
    <span className="flex min-w-0 items-center gap-2">
      {o.color && <Dot color={o.color} />}
      <span className="truncate">{o.node ?? o.text}</span>
    </span>
  )

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ("") }}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-label={rest["aria-label"]}
          aria-describedby={rest["aria-describedby"]}
          className={cn(
            "flex w-full min-w-0 items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm font-normal transition-colors outline-none",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
            size === "lg" ? "h-10 py-2" : "h-8 py-1.5",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && (mutedPlaceholder ? "text-muted-foreground" : "text-foreground/90"))}>{selected ? label(selected) : placeholder}</span>
          <span className="ml-2 flex shrink-0 items-center gap-1 text-muted-foreground">
            {clearable && selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Xoá lựa chọn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange("")
                  }
                }}
                className="inline-flex size-5 items-center justify-center rounded-sm transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </span>
            )}
            {/* Record forms (reference): a muted Hugeicons chevron; elsewhere the select's 50% heroicons chevron. */}
            {chevron === "form" ? <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" /> : <SelectChevron className="ml-0" />}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[60] w-max max-w-[min(90vw,400px)] min-w-(--radix-popover-trigger-width) p-1 shadow-md">
        {searchable && (
          <div className="relative mb-1">
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." className="h-8 w-full rounded-md border-0 bg-muted/50 pr-2 pl-8 text-sm outline-none" />
          </div>
        )}
        <div role="listbox" className="max-h-[300px] overflow-y-auto">
          {shown.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={cn("relative flex w-full items-center rounded-sm py-1.5 pr-2 pl-8 text-left text-sm select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none", o.value === value && "bg-accent text-accent-foreground")}
            >
              {o.value === value && (
                <span className="absolute left-2 flex size-3.5 items-center justify-center">
                  <svg aria-hidden className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
              )}
              <span className="min-w-0 flex-1">{label(o)}</span>
            </button>
          ))}
          {!shown.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Không có kết quả</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
