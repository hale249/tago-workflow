import { useEffect } from "react"
import { Outlet, useMatches } from "react-router"

import { BRANDING } from "@/config/branding"

/** Route metadata: tab title, plus a visually hidden <h1> for pages whose visible header isn't a heading. */
export type RouteHandle = { title?: string; h1?: boolean }

/** Deepest matched route's handle that carries a title. */
export function useRouteHandle(): RouteHandle | undefined {
  return [...useMatches()].reverse().find((m) => (m.handle as RouteHandle | undefined)?.title)?.handle as RouteHandle | undefined
}

/** Root route: keeps document.title in sync for every page (login included). */
export function RouteMeta() {
  const title = useRouteHandle()?.title
  useEffect(() => { document.title = title ? `${title} · ${BRANDING.name}` : BRANDING.name }, [title])
  return <Outlet />
}
