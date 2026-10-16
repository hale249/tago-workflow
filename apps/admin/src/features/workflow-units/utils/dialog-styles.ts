import { cn } from "@workspace/ui/lib/utils"

/** Reference dialog shell: p-4 → p-6, scrolls inside the viewport. */
export const dialogShell = "max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto p-4 sm:p-6"
export const dialogHeader = "gap-0 space-y-1.5"
export const dialogTitle = "tracking-tight"
const field = "flex w-full rounded-md border border-input bg-background text-sm transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
export const inputClass = cn(field, "h-8 px-3 py-1.5")
export const textareaClass = cn(field, "min-h-[80px] px-3 py-2")
