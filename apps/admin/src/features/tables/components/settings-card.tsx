import { Children, cloneElement, isValidElement, useId, type ComponentProps, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type { TabProps, Draft } from "./settings-types"

/** Reference "h-7" small action button (card header actions, footer buttons). */
export const BTN7 = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5"

/**
 * Card-header primary action. The reference builds it four ways depending on the tab:
 * - "wrap" (actions, filters, gantt): icon + responsive label inside a gap-1 row, so the button keeps px-2.5;
 * - "direct" (kanban, roll-ups): icon is a direct child (px-2, gap-1.5) + responsive label;
 * - "mr1" / "mr2" (pivot, objective / related tabs): icon with its own right margin, full label;
 * - "text" (conversion): label only.
 */
export function AddButton({ label, variant = "wrap", className, ...props }: { label: string; variant?: "wrap" | "direct" | "mr1" | "mr2" | "text" } & Omit<ComponentProps<typeof Button>, "children" | "variant">) {
  const responsive = (
    <>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Thêm</span>
    </>
  )
  return (
    <Button size="sm" className={cn(BTN7, "shadow-xs", className)} {...props}>
      {variant === "wrap" ? (
        <span className="flex items-center gap-1"><HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />{responsive}</span>
      ) : variant === "direct" ? (
        <><HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />{responsive}</>
      ) : variant === "text" ? (
        label
      ) : (
        <><HugeiconsIcon icon={Add01Icon} className={cn("h-4 w-4", variant === "mr1" ? "mr-1" : "mr-2")} />{label}</>
      )}
    </Button>
  )
}

/** Footer / toolbar button content: the reference wraps icon + label in a gap-1 row. */
export function BtnContent({ icon, children }: { icon: ComponentProps<typeof HugeiconsIcon>["icon"]; children: ReactNode }) {
  return <span className="flex items-center gap-1"><HugeiconsIcon icon={icon} className="h-4 w-4" />{children}</span>
}

/** Reference type ramp: card titles use the h4 token (14/22), descriptions the body-small token (12/18). */
export const H4 = "text-[length:var(--font-heading-h4-size)] leading-[var(--font-heading-h4-line-height)] font-semibold tracking-[var(--font-heading-h4-letter-spacing)]"
export const SMALL = "text-[length:var(--font-body-small-size)] leading-[var(--font-body-small-line-height)] tracking-[var(--font-body-small-letter-spacing)]"

const LABELABLE = new Set(["input", "select", "textarea", "button"])

/**
 * Reference settings field (general / detail tabs): `space-y-2` block with an inline text-sm label, so the label
 * line is a full 20px with no gap before the control, and the hint is a block `text-xs` paragraph.
 */
export function SettingsField({ label, required, hint, error, children, className }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }) {
  const uid = useId()
  const note = error ?? hint
  const single = Children.count(children) === 1 && isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children) ? children : null
  const only = single && (typeof single.type !== "string" || LABELABLE.has(single.type)) ? single : null
  const controlId = only?.props.id ?? `${uid}-control`
  const control = only
    ? cloneElement(only, { id: controlId, "aria-describedby": note ? `${uid}-note` : only.props["aria-describedby"], "aria-invalid": error ? true : only.props["aria-invalid"] })
    : children
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={only ? controlId : undefined} className="text-sm font-medium">
        {label}
        {required && <> <span className="text-destructive" aria-hidden>*</span></>}
      </label>
      {control}
      {note && <p id={`${uid}-note`} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{note}</p>}
    </div>
  )
}

/**
 * Settings section card. `bodyClassName` sets the gap between children — the reference varies it per tab
 * (space-y-5 general, space-y-4 fields, gap-3 list, gap-2 filters, space-y-6 detail…).
 */
export function SettingsCard({ title, description, action, children, bodyClassName = "space-y-6", className }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode; bodyClassName?: string; className?: string
}) {
  return (
    <div className={cn("rounded-lg border bg-card text-sm text-card-foreground max-sm:-mx-2", className)}>
      <div className="p-3 sm:p-5">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(H4, "text-foreground")}>{title}</h3>
            {action && <div className="flex shrink-0 gap-2">{action}</div>}
          </div>
          {description && <p className={cn(SMALL, "mt-0.5 max-w-prose text-muted-foreground")}>{description}</p>}
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  )
}

/** Muted sub-section with a tag badge. `dense` = the list tab's gap-2 variant; default is the detail tab's space-y-4. */
export function SubCard({ tag, hint, children, dense }: { tag: string; hint?: string; children: ReactNode; dense?: boolean }) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", dense ? "flex flex-col gap-2" : "space-y-4")}>
      <div className={cn("flex items-center", dense ? "gap-1" : "gap-2")}>
        <span className="inline-flex h-[22px] shrink-0 items-center rounded-md border border-transparent bg-secondary px-1.5 text-xs font-medium whitespace-nowrap text-secondary-foreground">{tag}</span>
        {hint && <span className={cn("text-sm text-muted-foreground", dense && "hidden sm:inline")}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** Dashed empty state. `pad` follows the reference per tab (p-10 / p-12). */
export function EmptyBox({ icon, title, hint, pad = "p-10" }: { icon?: ReactNode; title: string; hint?: string; pad?: "p-10" | "p-12" }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border text-center", pad)}>
      {icon && <span className="mx-auto mb-3 block w-fit text-muted-foreground">{icon}</span>}
      <p className="text-sm text-muted-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/**
 * Info panel. Default = reference "feature" boxes (border-info/20, title + body in text-info); `bullets` renders
 * "• item" lines; `muted` = the list/detail preview box (plain border, body in info-subtle-foreground).
 */
export function InfoBox({ title, points, bullets, muted, className }: { title: string; points: string[]; bullets?: boolean; muted?: boolean; className?: string }) {
  const body = muted ? "text-info-subtle-foreground" : "text-info"
  return (
    <div className={cn("rounded-lg border bg-info-subtle p-4", !muted && "border-info/20", className)}>
      <p className="text-sm font-medium text-info">{title}</p>
      {bullets ? (
        <ul className={cn("mt-2 space-y-1 text-xs", body)}>{points.map((p) => <li key={p}>• {p}</li>)}</ul>
      ) : (
        points.map((p) => <p key={p} className={cn("mt-1 text-xs", body)}>{p}</p>)
      )}
    </div>
  )
}

/** Small bordered badge (reference Badge: h-[22px] border px-1.5 text-xs font-medium). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[22px] items-center rounded-md border border-border bg-background px-1.5 text-xs font-medium whitespace-nowrap text-foreground", className)}>{children}</span>
}

/** "Label: value" pair used on config summary cards. */
export function Pair({ k, v, className }: { k: string; v: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="text-muted-foreground">{k}:</span> <span className="font-medium">{v}</span>
    </div>
  )
}

/** Count line under a list ("Tổng …: n   …"). */
export function Stats({ items, className }: { items: string[]; className?: string }) {
  return <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground", className)}>{items.map((s) => <span key={s}>{s}</span>)}</div>
}
