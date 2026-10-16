import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

/** Inline status banner for the auth card (success / error). */
export function AuthNotice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  const success = tone === "success"
  return (
    <div role={success ? "status" : "alert"}
      className={cn("flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs leading-relaxed",
        success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300")}>
      <HugeiconsIcon icon={success ? CheckmarkCircle02Icon : Alert02Icon} className="mt-px size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
