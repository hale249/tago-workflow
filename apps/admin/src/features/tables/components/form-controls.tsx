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

export function Switch({ checked, onChange, label, size = "sm", disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: "sm" | "lg"; disabled?: boolean }) {
  const lg = size === "lg"
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        lg ? "h-6 w-11 border-2 border-transparent" : "h-5 w-9",
        checked ? "bg-brand" : "bg-input",
      )}
    >
      <span className={cn("inline-block rounded-full bg-background transition-transform", lg ? "size-5 shadow-lg" : "size-4 shadow", checked ? (lg ? "translate-x-5" : "translate-x-4.5") : lg ? "translate-x-0" : "translate-x-0.5")} />
    </button>
  )
}
