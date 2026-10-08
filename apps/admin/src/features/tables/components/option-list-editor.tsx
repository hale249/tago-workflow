import { useState } from "react"
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { FieldOption } from "../types/table"
import { makeOption, OPTION_COLORS, slugify } from "../utils/fields"
import { OptionBadge } from "./field-value"

type Props = { value: FieldOption[]; onChange: (v: FieldOption[]) => void; error?: string }

export function OptionListEditor({ value, onChange, error }: Props) {
  const [draft, setDraft] = useState("")
  const [expanded, setExpanded] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const add = () => {
    const text = draft.trim()
    if (!text) return
    let v = slugify(text) || `opt_${value.length + 1}`
    while (value.some((o) => o.value === v)) v += "_1"
    onChange([...value, makeOption(text, value.length, v)])
    setDraft("")
  }
  const patch = (i: number, p: Partial<FieldOption>) => onChange(value.map((o, j) => (j === i ? { ...o, ...p } : o)))
  const drop = (to: number) => {
    if (dragIdx === null || dragIdx === to) return
    const next = [...value]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(to, 0, moved)
    onChange(next)
    setDragIdx(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-lg border border-dashed p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Gõ tên tuỳ chọn rồi Enter…"
          aria-invalid={!!error || undefined}
        />
        <Button type="button" onClick={add} disabled={!draft.trim()}><Plus />Thêm</Button>
      </div>

      {value.length > 0 && (
        <div className="space-y-2 rounded-lg border p-2">
          {value.map((o, i) => (
            <div
              key={o.value + i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(i)}
              className={cn("rounded-md border bg-background shadow-xs", dragIdx === i && "opacity-50")}
            >
              <div className="flex items-center gap-2 px-2 py-2">
                <span draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => setDragIdx(null)} className="cursor-grab p-1 text-muted-foreground" aria-label="Kéo để sắp xếp">
                  <GripVertical className="size-4" />
                </span>
                <OptionBadge option={o} className="px-2.5 py-1 text-sm" />
                <Button type="button" size="icon-xs" variant="ghost" aria-label="Tuỳ chỉnh" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? null : i)}>
                  <ChevronDown className={cn("transition-transform", expanded === i && "rotate-180")} />
                </Button>
                <Button type="button" size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Xoá ${o.text}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
              {expanded === i && (
                <div className="grid gap-3 border-t px-3 py-3 sm:grid-cols-[1fr_auto]">
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Tên hiển thị
                    <Input value={o.text} onChange={(e) => patch(i, { text: e.target.value })} className="h-8 text-sm text-foreground" />
                  </label>
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    Màu
                    <div className="flex h-8 items-center gap-1.5">
                      {OPTION_COLORS.map((c) => (
                        <button
                          key={c.backgroundColor}
                          type="button"
                          aria-label={`Màu ${c.backgroundColor}`}
                          onClick={() => patch(i, c)}
                          className={cn("size-6 rounded-md border", o.backgroundColor === c.backgroundColor && "ring-2 ring-brand ring-offset-1")}
                          style={{ backgroundColor: c.backgroundColor }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground sm:col-span-2">Giá trị lưu: {o.value}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error ?? `Có ${value.length} tuỳ chọn`}</p>
    </div>
  )
}
