import type { ReactNode } from "react"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { TYPE } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"

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
