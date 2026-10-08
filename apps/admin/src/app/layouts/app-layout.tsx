import { Outlet } from "react-router"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar, MobileSidebar } from "@/components/layout/sidebar"

export function AppLayout() {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <AppSidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
