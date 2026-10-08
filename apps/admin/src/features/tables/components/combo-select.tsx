import { useMemo, useState, type ReactNode } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

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
  clearable?: boolean
  invalid?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()

function Dot({ color }: { color: string }) {
  return <span className="size-2.5 shrink-0 rounded-full border" style={{ backgroundColor: color }} />
}

/** Single-value dropdown styled like the reference product (not a native <select>). */
export function ComboSelect({ value, onChange, options, placeholder = "Chọn", size = "sm", clearable, invalid, disabled, id, className, ...rest }: Props) {
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
          className={cn(
            "flex w-full min-w-0 items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm font-normal transition-colors outline-none",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
            size === "lg" ? "h-10 py-2" : "h-8 py-1.5",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-foreground/90")}>{selected ? label(selected) : placeholder}</span>
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
                <X className="size-4" />
              </span>
            )}
            <ChevronDown className="size-4" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-48 p-1">
        {searchable && (
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." className="h-8 w-full rounded-md border-0 bg-muted/50 pr-2 pl-8 text-sm outline-none" />
          </div>
        )}
        <div role="listbox" className="max-h-64 overflow-y-auto">
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
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">{label(o)}</span>
              {o.value === value && <Check className="size-4 shrink-0 text-brand" />}
            </button>
          ))}
          {!shown.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Không có kết quả</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
