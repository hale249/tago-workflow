import { CheckSquare, Package, Table2, Users, type LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const ICONS: Record<string, LucideIcon> = { table: Table2, users: Users, "check-square": CheckSquare, package: Package }

/** Neutral chip with a colored glyph by default; `plain` renders just the colored glyph (sidebar tree, search). */
export function TableIcon({ icon, color, className, plain }: { icon: string; color: string; className?: string; plain?: boolean }) {
  const Icon = ICONS[icon] ?? Table2
  if (plain) return <Icon className={cn("size-4 shrink-0", className)} style={{ color }} strokeWidth={1.75} />
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-secondary [&_svg]:size-[18px]", className)} style={{ color }}>
      <Icon strokeWidth={1.75} />
    </span>
  )
}
