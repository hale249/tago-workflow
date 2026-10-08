import type { ReactNode } from "react"
import { Menu } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useUiStore } from "@/stores/ui.store"

export function PageHeader({ title, icon, actions }: { title: string; icon?: ReactNode; actions?: ReactNode }) {
  const openMobile = useUiStore((s) => s.setMobileSidebarOpen)

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Button variant="ghost" size="icon" className="-ml-2 size-8 md:hidden" onClick={() => openMobile(true)} aria-label="Open menu">
          <Menu />
        </Button>
        {icon}
        <h1>{title}</h1>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  )
}
