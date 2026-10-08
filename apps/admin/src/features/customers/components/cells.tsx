import { cn } from "@workspace/ui/lib/utils"
import type { CustomerTag, Person } from "../types/customer"

const TAG_STYLES: Record<CustomerTag, string> = {
  SaaS: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300/80 dark:border-transparent",
  Fintech: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300/80 dark:border-transparent",
  Healthcare: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300/80 dark:border-transparent",
  Enterprise: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300/80 dark:border-transparent",
  AI: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300/80 dark:border-transparent",
  Logistics: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300/80 dark:border-transparent",
  Energy: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300/80 dark:border-transparent",
}

export function TagBadge({ tag }: { tag: CustomerTag }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded border px-1.5 text-xs font-medium", TAG_STYLES[tag])}>
      {tag}
    </span>
  )
}

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  return (
    <span
      title={person.name}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white ring-2 ring-background",
        person.color,
        className,
      )}
    >
      {person.initials}
    </span>
  )
}

export function AvatarStack({ people, max = 3 }: { people: Person[]; max?: number }) {
  const rest = people.length - max
  return (
    <div className="flex -space-x-1.5">
      {people.slice(0, max).map((p, i) => <PersonAvatar key={i} person={p} />)}
      {rest > 0 && (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
          +{rest}
        </span>
      )}
    </div>
  )
}

export function CompanyLogo({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[11px] font-semibold text-white", color, className)}>
      {name[0]}
    </span>
  )
}

export function ResponseRate({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  )
}
