import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

// Default is h-8 like the reference product; other sizes match buttonVariants.
const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        xs: "h-6 px-2 text-xs file:h-4 file:text-xs",
        sm: "h-8 px-2.5 text-sm file:h-6 file:text-sm",
        default: "h-8 px-3 py-1.5 text-sm file:h-6 file:text-sm",
        lg: "h-10 px-3.5 text-base file:h-8 file:text-sm",
        xl: "h-11 px-4 text-base file:h-9 file:text-sm",
      },
    },
    defaultVariants: { size: "default" },
  }
)

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
