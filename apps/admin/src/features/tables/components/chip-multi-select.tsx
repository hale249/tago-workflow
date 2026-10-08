import { useState } from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { TableField } from "../types/table"
import { FieldTypeIcon } from "./field-type-icon"

type Props = { fields: TableField[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string }

/**
 * Ordered multi-select of fields: a dropdown with checkboxes plus a chip tray.
 * Chips can be dragged to reorder (order = column / display order) and removed with ×.
 */
export function ChipMultiSelect({ fields, value, onChange, placeholder = "Chọn trường…" }: Props) {
  const [open, setOpen] = useState(false)
  const [dragName, setDragName] = useState<string | null>(null)
  const byName = new Map(fields.map((f) => [f.name, f]))
  const chosen = value.filter((n) => byName.has(n))
  const toggle = (n: string) => onChange(chosen.includes(n) ? chosen.filter((x) => x !== n) : [...chosen, n])
  const dropOn = (target: string) => {
    if (!dragName || dragName === target) return
    const next = chosen.filter((n) => n !== dragName)
    next.splice(next.indexOf(target), 0, dragName)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center gap-2 rounded-md border border-input px-3 text-left text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className={cn("flex-1", !chosen.length && "text-muted-foreground")}>{chosen.length ? `${chosen.length} đã chọn` : placeholder}</span>
            {chosen.length > 0 && (
              <span
                role="button"
                aria-label="Bỏ chọn tất cả"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange([])
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Tìm trường…" />
            <CommandList className="max-h-72">
              <CommandEmpty>Không có trường phù hợp</CommandEmpty>
              <CommandGroup>
                {fields.map((f) => (
                  <CommandItem key={f.name} value={f.label + " " + f.name} onSelect={() => toggle(f.name)} className="gap-2">
                    <span className={cn("grid size-4 place-items-center rounded-sm border", chosen.includes(f.name) && "border-brand bg-brand text-white")}>
                      {chosen.includes(f.name) && <Check className="size-3" />}
                    </span>
                    <FieldTypeIcon type={f.type} className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{f.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-md bg-muted/60 p-2">
          {chosen.map((n) => (
            <span
              key={n}
              draggable
              onDragStart={() => setDragName(n)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(n)}
              onDragEnd={() => setDragName(null)}
              className={cn("inline-flex cursor-grab items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs", dragName === n && "opacity-50")}
            >
              {byName.get(n)!.label}
              <button type="button" aria-label={`Bỏ ${byName.get(n)!.label}`} onClick={() => toggle(n)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
