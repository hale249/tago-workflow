import { cn } from "@workspace/ui/lib/utils"

/** Toggle switch: "sm" = 20px (inline settings rows), "lg" = 24px (reference card toggles). */
export function Switch({ checked, onChange, label, size = "sm", disabled, id, className }: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  size?: "sm" | "lg"
  disabled?: boolean
  id?: string
  className?: string
}) {
  const lg = size === "lg"
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        lg ? "h-6 w-11 border-2 border-transparent" : "h-5 w-9",
        checked ? "bg-primary" : "bg-input",
        className,
      )}
    >
      <span className={cn("pointer-events-none inline-block rounded-full bg-background transition-transform", lg ? "size-5 shadow-lg" : "size-4 shadow", checked ? (lg ? "translate-x-5" : "translate-x-4.5") : lg ? "translate-x-0" : "translate-x-0.5")} />
    </button>
  )
}
