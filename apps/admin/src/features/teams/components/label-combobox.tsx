import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useLabels } from "../api/teams.queries"
import type { LabelKind } from "../types/team"

const TEXT = {
  team: { search: "Tìm nhãn nhóm...", empty: "Không có nhãn nhóm" },
  role: { search: "Tìm nhãn vai trò...", empty: "Không có nhãn vai trò" },
} as const

/** Multi-select label picker (team or role labels) — outline trigger + searchable list. */
export function LabelCombobox({ kind, value, onChange, placeholder, className }: { kind: LabelKind; value: string[]; onChange: (ids: string[]) => void; placeholder: string; className?: string }) {
  const { data: labels = [] } = useLabels(kind)
  const [open, setOpen] = useState(false)
  const picked = labels.filter((l) => value.includes(l.id))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-expanded={open} className={cn("h-8 w-full justify-between gap-1.5 border-input px-3 py-1.5 font-normal shadow-xs has-[>svg]:px-2.5", !picked.length && "text-muted-foreground", className)}>
          <span className="truncate">{picked.length ? picked.map((l) => l.name).join(", ") : placeholder}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={TEXT[kind].search} />
          <CommandList>
            <CommandEmpty>{TEXT[kind].empty}</CommandEmpty>
            {labels.length > 0 && (
              <CommandGroup>
                {labels.map((l) => (
                  <CommandItem key={l.id} value={l.name} onSelect={() => toggle(l.id)}>
                    <HugeiconsIcon icon={Tick02Icon} className={cn("size-4", !value.includes(l.id) && "opacity-0")} />
                    {l.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
