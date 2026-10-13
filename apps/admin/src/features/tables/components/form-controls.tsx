import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { Select } from "@/components/select"

const control =
  "w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30"

/** Popover select in the reference style; same props as `<select>` (kept as NativeSelect for existing call sites). */
export const NativeSelect = Select

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-20 py-2", className)} {...props} />
}

export { FormRow } from "@/components/form-row"

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", checked ? "bg-brand" : "bg-input")}
    >
      <span className={cn("inline-block size-4 rounded-full bg-background shadow transition-transform", checked ? "translate-x-4.5" : "translate-x-0.5")} />
    </button>
  )
}
