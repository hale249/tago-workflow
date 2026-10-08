import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function PageHeader({ title, description, icon, actions }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <header className={cn("flex shrink-0 items-center justify-between gap-4 px-4", description ? "min-h-14 py-2" : "h-14")}>
      <div className="flex items-center gap-2 text-base font-semibold">
        {icon}
        <div className="min-w-0">
          <h1 className="truncate">{title}</h1>
          {description && <p className="truncate text-xs font-normal text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  )
}
