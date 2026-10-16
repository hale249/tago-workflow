import { Children, cloneElement, isValidElement, useId, type ReactNode } from "react"
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

export function EmptyState({ icon, title, description, className }: { icon: IconSvgElement; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border px-6 py-14 text-center", className)}>
      <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"><HugeiconsIcon icon={icon} className="size-5" /></span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
    </div>
  )
}

/** Default avatar (the reference shows a grey placeholder when the user has no photo). */
export const MemberAvatar = ({ className }: { className?: string }) => (
  <span className={cn("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground", className)}><HugeiconsIcon icon={UserIcon} className="size-4" /></span>
)

// Reference data-table: 36px rows, 13px muted header, hairline row borders.
export const TABLE_CARD = "flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150"
export const TH = "h-9 px-3 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground"
export const TD = "h-9 px-3 py-1.5 align-middle"
export const TR = "border-b border-border/70 transition-colors hover:bg-muted/60 data-[state=selected]:bg-primary/[0.06]"
export const TEXTAREA = "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset aria-invalid:border-destructive dark:bg-input/30"
/** Toolbar / page action buttons (reference h-7 with a 16px icon). */
export const SMALL_BTN = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2"

/** Reference dialog shell: 16px padding on phones, 24px from sm, scrolls inside the viewport. Add the sm:max-w-[…] width. */
export const DIALOG_CONTENT = "max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto p-4 sm:p-6"

/**
 * Reference dialog field (`space-y-2` + inline label, "Tên <span>*</span>"): the inline label keeps the 20px line box,
 * which is what gives the reference its label→control spacing. The single child control gets the label's id.
 */
export function DialogField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  const uid = useId()
  const only = Children.count(children) === 1 && isValidElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children) ? children : null
  const id = only?.props.id ?? `${uid}-control`
  return (
    <div className="space-y-2">
      <label htmlFor={only ? id : undefined} className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <> <span className="text-destructive">*</span></>}
      </label>
      {only ? cloneElement(only, { id, "aria-invalid": !!error, "aria-describedby": error ? `${uid}-error` : only.props["aria-describedby"] }) : children}
      {error && <p id={`${uid}-error`} className="text-[0.8rem] font-medium text-destructive">{error}</p>}
    </div>
  )
}
