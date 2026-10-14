import type { ReactNode } from "react"

export type { TabProps, Draft } from "./settings-types"

export function SettingsCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 max-w-prose text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export function SubCard({ tag, hint, children }: { tag: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-[22px] shrink-0 items-center rounded-md bg-secondary px-1.5 text-xs font-medium whitespace-nowrap text-secondary-foreground">{tag}</span>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function EmptyBox({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="grid place-items-center gap-1 rounded-lg border border-dashed px-4 py-10 text-center">
      {icon && <span className="mb-1 text-muted-foreground">{icon}</span>}
      <p className="text-sm text-muted-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function InfoBox({ title, points, tone = "info" }: { title: string; points: string[]; tone?: "info" | "bullets" }) {
  return (
    <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 text-brand dark:bg-brand/10">
      <p className="text-sm font-medium">{title}</p>
      {points.map((p) => <p key={p} className="mt-1 text-xs">{tone === "bullets" ? `• ${p}` : p}</p>)}
    </div>
  )
}

/** "Label: value" pair used on config summary cards. */
export function Pair({ k, v }: { k: string; v: ReactNode }) {
  return <span className="text-sm text-muted-foreground">{k}: <b className="font-medium text-foreground">{v}</b></span>
}
