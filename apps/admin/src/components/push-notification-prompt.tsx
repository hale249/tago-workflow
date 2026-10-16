import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Notification01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"

const DISMISSED_KEY = "push-prompt:dismissed" // localStorage — "Bật" or X: never ask again
const SNOOZED_KEY = "push-prompt:snoozed" // sessionStorage — "Để sau": hide for this session

function readFlag(storage: () => Storage, key: string) {
  try { return storage().getItem(key) === "1" } catch { return false }
}

function writeFlag(storage: () => Storage, key: string) {
  try { storage().setItem(key, "1") } catch { /* storage blocked — hiding in memory is enough */ }
}

function shouldShow() {
  if (typeof window === "undefined" || !("Notification" in window)) return false
  if (Notification.permission !== "default") return false
  return !readFlag(() => localStorage, DISMISSED_KEY) && !readFlag(() => sessionStorage, SNOOZED_KEY)
}

/** Bottom-right "enable push notifications" card (beqeek style). Self-hides when unsupported or already decided. */
export function PushNotificationPrompt() {
  const [open, setOpen] = useState(shouldShow)
  if (!open) return null

  const dismiss = () => { writeFlag(() => localStorage, DISMISSED_KEY); setOpen(false) }
  const snooze = () => { writeFlag(() => sessionStorage, SNOOZED_KEY); setOpen(false) }
  const enable = () => {
    dismiss()
    try { void Notification.requestPermission()?.catch(() => {}) } catch { /* unsupported */ }
  }

  return (
    <div role="dialog" aria-labelledby="push-prompt-title" className="fixed right-4 bottom-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border bg-card p-4 text-card-foreground shadow-lg">
      <Button variant="ghost" size="icon-xs" aria-label="Đóng" className="absolute top-3 right-3 text-muted-foreground hover:bg-accent/50" onClick={dismiss}>
        <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
      </Button>
      <div className="flex gap-3 pr-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
          <HugeiconsIcon icon={Notification01Icon} strokeWidth={1.5} className="size-4 text-primary-subtle-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p id="push-prompt-title" className="text-sm leading-5 font-medium">Bật thông báo đẩy</p>
          <p className="mt-1.5 text-xs leading-[18px] text-muted-foreground">Nhận thông báo realtime khi có cập nhật mới</p>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" className="h-7 px-2.5" onClick={enable}>Bật</Button>
            <Button size="sm" variant="ghost" className="h-7 px-2.5 hover:bg-accent/50" onClick={snooze}>Để sau</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
