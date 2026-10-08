import { ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import type { TableField } from "../types/table"
import { fieldTypeLabel } from "../utils/fields"

/** Ordered multi-select of fields: tick to include, arrows to reorder the chosen ones. */
export function FieldPicker({ fields, value, onChange }: { fields: TableField[]; value: string[]; onChange: (v: string[]) => void }) {
  const chosen = value.map((n) => fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const rest = fields.filter((f) => !value.includes(f.name))
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }

  return (
    <div className="divide-y rounded-lg border text-sm">
      {[...chosen, ...rest].map((f) => {
        const idx = value.indexOf(f.name)
        const on = idx >= 0
        return (
          <div key={f.name} className="flex items-center gap-3 px-3 py-1.5">
            <Checkbox checked={on} onCheckedChange={(c) => onChange(c ? [...value, f.name] : value.filter((n) => n !== f.name))} aria-label={f.label} />
            <span className="min-w-0 flex-1 truncate">{f.label}</span>
            <span className="text-xs text-muted-foreground max-sm:hidden">{fieldTypeLabel(f.type)}</span>
            <span className="flex w-14 justify-end">
              {on && (
                <>
                  <Button size="icon-xs" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Lên"><ArrowUp /></Button>
                  <Button size="icon-xs" variant="ghost" disabled={idx === value.length - 1} onClick={() => move(idx, 1)} aria-label="Xuống"><ArrowDown /></Button>
                </>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
