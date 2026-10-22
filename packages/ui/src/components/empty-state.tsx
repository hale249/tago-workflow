import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { cn } from "@workspace/ui/lib/utils"

export function EmptyState({ icon, title, description, className }: { icon: IconSvgElement; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border px-6 py-14 text-center", className)}>
      <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"><HugeiconsIcon icon={icon} className="size-5" /></span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
    </div>
  )
}
