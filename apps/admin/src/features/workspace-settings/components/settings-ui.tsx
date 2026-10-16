import type { CSSProperties, ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

// The reference's type ramp, applied inline exactly like it does (font-size / line-height / weight / tracking / family vars).
const ramp = (name: string, weight?: number): CSSProperties => ({
  fontSize: `var(--font-${name}-size)`,
  lineHeight: `var(--font-${name}-line-height)`,
  fontWeight: weight ?? `var(--font-${name}-weight)`,
  letterSpacing: `var(--font-${name}-letter-spacing)`,
  fontFamily: `var(--font-${name}-family)`,
})
export const TYPE = {
  h1: ramp("heading-h1"),
  h3: ramp("heading-h3"),
  body: ramp("body-default", 400),
  bodyMedium: ramp("body-default", 500),
  small: ramp("body-small", 400),
} satisfies Record<string, CSSProperties>

/** Tab heading (h3 + small muted description) with the actions on the right, as in every reference tab. */
export function SectionHeader({ title, description, layout = "sm", children, className }: { title: string; description: string; layout?: "sm" | "lg"; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", layout === "lg" ? "lg:flex-row lg:items-start lg:justify-between" : "sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-foreground" style={TYPE.h3}>{title}</h3>
        <p className="text-muted-foreground" style={TYPE.small}>{description}</p>
      </div>
      {children}
    </div>
  )
}

/** Search field with a leading icon; `lg` is the 36px variant used by the labels tab. */
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

/** Reference card: title (+ optional icon) and 13px description over the content. */
export function SettingsCard({ icon, iconGap = "gap-2", title, description, flush, children }: { icon?: IconSvgElement; iconGap?: string; title: string; description: string; flush?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
      <div className="grid gap-1 px-5">
        {icon ? (
          <div className={cn("flex items-center", iconGap)}>
            <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" />
            <div className="text-sm leading-5 font-semibold">{title}</div>
          </div>
        ) : (
          <div className="text-sm leading-5 font-semibold">{title}</div>
        )}
        <div className="text-[13px] text-muted-foreground">{description}</div>
      </div>
      <div className={flush ? "p-0" : "px-5"}>{children}</div>
    </div>
  )
}
