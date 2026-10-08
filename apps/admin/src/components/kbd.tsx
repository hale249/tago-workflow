import type { ReactNode } from "react"

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-current/20 px-1 font-sans text-[10px] leading-4 opacity-70">{children}</kbd>
  )
}
