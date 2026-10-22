import type { ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { UserIcon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

/** Reference badge: 22px outline pill (dashed for the list count). */
export function Chip({ icon, dashed, className, children }: { icon?: IconSvgElement; dashed?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border bg-background px-1.5 text-xs font-medium whitespace-nowrap text-foreground", dashed && "border-dashed", className)}>
      {icon && <HugeiconsIcon icon={icon} className="size-3.5" />}
      {children}
    </span>
  )
}

/** Small muted label pill shown under a role name ("leader"). */
export const LabelPill = ({ children }: { children: ReactNode }) => <span className="inline-flex h-5 items-center rounded-md bg-muted px-1.5 text-xs font-normal text-muted-foreground">{children}</span>

/** Default avatar (the reference shows a grey placeholder when the user has no photo). */
export const MemberAvatar = ({ className }: { className?: string }) => (
  <span className={cn("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground", className)}><HugeiconsIcon icon={UserIcon} className="size-4" /></span>
)
