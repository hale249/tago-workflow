import { Children, cloneElement, isValidElement, useId, type ReactNode } from "react"

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
