import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Command, CommandGroup, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { FieldType } from "../types/table"
import { FIELD_GROUPS, FIELD_TYPES } from "../utils/fields"
import { FieldTypeIcon } from "./field-type-icon"

/** Grouped field-type dropdown (reference: no search box): icon + name + one-line description per type. */
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
            "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm transition-colors outline-none",
            "focus:ring-1 focus:ring-ring focus:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-1 ring-ring ring-inset",
          )}
        >
          {current ? (
            <span className="flex min-w-0 items-center gap-2">
              <FieldTypeIcon type={current.type} className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{current.label}</span>
              <span className="inline-flex h-[22px] items-center rounded-md border border-border bg-background px-1.5 text-xs font-medium whitespace-nowrap text-foreground max-sm:hidden">{current.group}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Chọn loại trường...</span>
          )}
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandList className="max-h-[400px]">
            {FIELD_GROUPS.map((g) => (
              <CommandGroup key={g} heading={g} className="[&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-foreground/80">
                {FIELD_TYPES.filter((t) => t.group === g).map((t) => (
                  <CommandItem
                    key={t.type}
                    value={`${t.label} ${t.description}`}
                    onSelect={() => {
                      onChange(t.type)
                      setOpen(false)
                    }}
                    className="items-start gap-3 px-2 py-2"
                  >
                    <FieldTypeIcon type={t.type} className="mt-0.5 size-4 text-muted-foreground" />
                    <span className="grid flex-1 gap-0.5">
                      <span className="text-sm">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </span>
                    {value === t.type && <HugeiconsIcon icon={Tick02Icon} className="mt-0.5 size-4 text-brand" />}
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
