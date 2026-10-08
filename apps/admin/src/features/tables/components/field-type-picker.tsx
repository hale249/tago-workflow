import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { FieldType } from "../types/table"
import { FIELD_GROUPS, FIELD_TYPES } from "../utils/fields"
import { FieldTypeIcon } from "./field-type-icon"

/** Grouped, searchable field-type dropdown: icon + name + one-line description per type. */
export function FieldTypePicker({ value, onChange, disabled }: { value?: FieldType; onChange: (t: FieldType) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const current = FIELD_TYPES.find((t) => t.type === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
            open && "border-ring ring-[3px] ring-ring/50",
          )}
        >
          {current ? (
            <>
              <FieldTypeIcon type={current.type} className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{current.label}</span>
              <span className="text-xs text-muted-foreground max-sm:hidden">{current.group}</span>
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">Chọn loại trường…</span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Tìm loại trường…" />
          <CommandList className="max-h-80">
            <CommandEmpty>Không có loại phù hợp</CommandEmpty>
            {FIELD_GROUPS.map((g) => (
              <CommandGroup key={g} heading={`Trường ${g.toLowerCase()}`}>
                {FIELD_TYPES.filter((t) => t.group === g).map((t) => (
                  <CommandItem
                    key={t.type}
                    value={`${t.label} ${t.description}`}
                    onSelect={() => {
                      onChange(t.type)
                      setOpen(false)
                    }}
                    className="items-start gap-3 py-2"
                  >
                    <FieldTypeIcon type={t.type} className="mt-0.5 size-4 text-muted-foreground" />
                    <span className="grid flex-1 gap-0.5">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </span>
                    {value === t.type && <Check className="mt-0.5 size-4 text-brand" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
