import { useState, type ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"
import { authField } from "./auth-styles"

/** Password input with an inline show/hide toggle, styled for the dark auth card. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn(authField, "pr-9", className)} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute inset-y-0 right-0 grid w-9 place-items-center text-slate-400 hover:text-slate-200">
        <HugeiconsIcon icon={visible ? ViewOffIcon : ViewIcon} className="size-4" />
      </button>
    </div>
  )
}
