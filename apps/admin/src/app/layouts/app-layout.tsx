import { Outlet, useNavigation } from "react-router"

import { useRouteHandle } from "@/app/layouts/route-meta"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar, MobileSidebar } from "@/components/layout/sidebar"

export function AppLayout() {
  // Pages are lazy chunks; show a thin top bar while the next one loads.
  const loading = useNavigation().state === "loading"
  const handle = useRouteHandle()
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <AppSidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden" aria-busy={loading || undefined}>
          {handle?.h1 && <h1 className="sr-only">{handle.title}</h1>}
          {loading && <div role="progressbar" aria-label="Đang tải trang" className="absolute inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand" />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
