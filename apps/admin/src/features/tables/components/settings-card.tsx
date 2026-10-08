import type { ReactNode } from "react"

export type { TabProps, Draft } from "./settings-types"

export function SettingsCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function SubCard({ tag, hint, children }: { tag: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm">
        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{tag}</span>
        <span className="text-muted-foreground">{hint}</span>
      </p>
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

export function InfoBox({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-lg bg-brand/5 px-4 py-3 text-xs text-brand">
      <p className="mb-1 text-sm font-medium">{title}</p>
      <ul className="list-inside list-disc space-y-0.5">{points.map((p) => <li key={p}>{p}</li>)}</ul>
    </div>
  )
}

/** "Label: value" pair used on config summary cards. */
export function Pair({ k, v }: { k: string; v: ReactNode }) {
  return <span className="text-sm text-muted-foreground">{k}: <b className="font-medium text-foreground">{v}</b></span>
}
