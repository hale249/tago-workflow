import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { TABLE_ICONS } from "@/components/icons"

const ICONS = Object.fromEntries(TABLE_ICONS.map((i) => [i.id, i.icon]))

/** Neutral chip with a colored glyph by default; `plain` renders just the colored glyph (sidebar tree, search). */
export function TableIcon({ icon, color, className, plain }: { icon: string; color: string; className?: string; plain?: boolean }) {
  const Icon = ICONS[icon] ?? TABLE_ICONS[0].icon
  if (plain) return <HugeiconsIcon icon={Icon} className={cn("size-4 shrink-0", className)} style={{ color }} />
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-secondary [&_svg]:size-[18px]", className)} style={{ color }}>
      <HugeiconsIcon icon={Icon} />
    </span>
  )
}
