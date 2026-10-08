import type { ComponentProps, ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

const control =
  "w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30"

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-8 pr-8", className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-20 py-2", className)} {...props} />
}

export function FormRow({ label, required, error, hint, children, className }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid content-start gap-1 text-sm", className)}>
      <span className="block font-medium">
        {label}
        {required && <span className="ml-1 text-destructive" aria-label="bắt buộc">*</span>}
      </span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

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
