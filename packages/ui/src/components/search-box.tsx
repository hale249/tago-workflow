import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

/** Search field with a leading icon; `lg` is the 36px variant. */
export function SearchBox({ value, onChange, placeholder, size = "sm", className }: { value: string; onChange: (v: string) => void; placeholder: string; size?: "sm" | "lg"; className?: string }) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <HugeiconsIcon icon={Search01Icon} className={cn("pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground", size === "lg" ? "size-4" : "size-3.5")} />
      <input
        type="search"
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:bg-input/30",
          size === "lg" ? "h-9 pl-9" : "h-8 pl-8",
        )}
      />
    </div>
  )
}
