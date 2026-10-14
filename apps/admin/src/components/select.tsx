import { Children, isValidElement, useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

type Option = { value: string; label: ReactNode; text: string; disabled?: boolean }

const textOf = (n: ReactNode): string =>
  typeof n === "string" || typeof n === "number" ? String(n) : Array.isArray(n) ? n.map(textOf).join("") : isValidElement<{ children?: ReactNode }>(n) ? textOf(n.props.children) : ""

/** Flattens `<option>` children (incl. arrays / fragments / optgroups) like a native select would. */
function readOptions(children: ReactNode): Option[] {
  const out: Option[] = []
  const walk = (c: ReactNode) => {
    Children.forEach(c, (ch) => {
      if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(ch)) return
      if (ch.type === "option") {
        const text = textOf(ch.props.children)
        out.push({ value: String(ch.props.value ?? text), label: ch.props.children, text, disabled: ch.props.disabled })
      } else walk(ch.props.children)
    })
  }
  walk(children)
  return out
}

/** The reference's select chevron (heroicons chevron-down, 2px stroke, 50% opacity). */
export function SelectChevron({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn("ml-2 size-4 shrink-0 opacity-50", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function Check() {
  return (
    <svg aria-hidden className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

type Props = Omit<ComponentProps<"select">, "children" | "multiple" | "size"> & { children?: ReactNode }

/**
 * Drop-in replacement for `<select>` + `<option>` (same `value` / `onChange(e.target.value)` contract),
 * rendered as the reference's popover select: 32px trigger, check-marked list items, max 300px tall.
 */
export function Select({ value, defaultValue, onChange, children, className, disabled, id, style, "aria-label": ariaLabel, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, name, required }: Props) {
  const options = readOptions(children)
  const [inner, setInner] = useState(String(defaultValue ?? ""))
  const current = value !== undefined ? String(value) : inner
  // Native semantics: an unknown value shows the first option.
  const selected = options.find((o) => o.value === current) ?? options[0]
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const choose = (o: Option) => {
    if (o.disabled) return
    setOpen(false)
    if (o.value === current) return
    if (value === undefined) setInner(o.value)
    const target = { value: o.value, name } as HTMLSelectElement
    onChange?.({ target, currentTarget: target } as ChangeEvent<HTMLSelectElement>)
  }
  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? [])]
  const onListKey = (e: KeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus()
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      list[e.key === "Home" ? 0 : list.length - 1]?.focus()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-required={required || undefined}
          aria-expanded={open}
          disabled={disabled}
          style={style}
          onKeyDown={(e) => {
            if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className={cn(
            "flex h-8 w-full min-w-0 items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm transition-colors outline-none",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
            className,
          )}
        >
          <span className="truncate">{selected?.label}</span>
          <SelectChevron />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] max-h-[300px] w-max max-w-[min(90vw,400px)] min-w-(--radix-popover-trigger-width) overflow-y-auto p-1 shadow-md"
        onOpenAutoFocus={(e) => {
          // Land on the selected item (or the first) instead of the container.
          e.preventDefault()
          requestAnimationFrame(() => (listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? items()[0])?.focus())
        }}
      >
        <div ref={listRef} role="listbox" aria-label={ariaLabel} onKeyDown={onListKey}>
          {options.map((o) => {
            const on = o === selected
            return (
              <div
                key={o.value}
                role="option"
                tabIndex={-1}
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                data-selected={on}
                onClick={() => choose(o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    choose(o)
                  }
                }}
                className={cn(
                  "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  on && "bg-accent text-accent-foreground",
                  o.disabled && "pointer-events-none opacity-50",
                )}
              >
                {on && <span className="absolute left-2 flex size-3.5 items-center justify-center"><Check /></span>}
                {o.label}
              </div>
            )
          })}
          {!options.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Không có lựa chọn</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
