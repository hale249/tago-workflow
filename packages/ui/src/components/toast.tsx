import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

type Toast = { kind: "success" | "error"; message: string }

/** Minimal bottom-right toast (the app has no toast system yet). */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback((t: Toast) => {
    clearTimeout(timer.current)
    setToast(t)
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return { toast, show }
}

export function ToastView({ toast }: { toast: Toast | null }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
      {toast && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg">
          <HugeiconsIcon
            icon={toast.kind === "success" ? CheckmarkCircle01Icon : Alert02Icon}
            className={cn("size-4 shrink-0", toast.kind === "success" ? "text-accent-green" : "text-destructive")}
          />
          {toast.message}
        </div>
      )}
    </div>
  )
}
