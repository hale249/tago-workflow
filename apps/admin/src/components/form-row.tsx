import { Children, cloneElement, isValidElement, useId, type ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

const LABELABLE = new Set(["input", "select", "textarea", "button"])

/**
 * Label + control + hint/error. Only the title is the <label> (tied to the control by id) and the hint is wired
 * through aria-describedby, so assistive tech reads "Tên trường" as the name instead of the whole block.
 */
export function FormRow({ label, required, error, hint, children, className }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) {
  const uid = useId()
  const note = error ?? hint
  const single = Children.count(children) === 1 && isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children) ? children : null
  // A host element that isn't a form control (e.g. a layout <div>) can't take the label — leave it alone.
  const only = single && (typeof single.type !== "string" || LABELABLE.has(single.type)) ? single : null
  const controlId = only?.props.id ?? `${uid}-control`
  const control = only
    ? cloneElement(only, { id: controlId, "aria-describedby": note ? `${uid}-note` : only.props["aria-describedby"], "aria-invalid": error ? true : only.props["aria-invalid"] })
    : children
  return (
    <div className={cn("grid content-start gap-2 text-sm", className)}>
      <label htmlFor={only ? controlId : undefined} className="block leading-none font-medium">
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden>*</span>}
      </label>
      {control}
      {note && <span id={`${uid}-note`} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>{note}</span>}
    </div>
  )
}
