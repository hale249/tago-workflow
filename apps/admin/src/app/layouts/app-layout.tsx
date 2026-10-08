import { Outlet } from "react-router"

import { AppSidebar, MobileSidebar } from "@/components/layout/sidebar"

export function AppLayout() {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-[#f0f2f5] dark:bg-sidebar">
      <AppSidebar />
      <MobileSidebar />
      {/* Gray canvas; each page section is its own white card (no border). */}
      <main className="relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-2 md:p-3">
        <Outlet />
      </main>
    </div>
  )
}
