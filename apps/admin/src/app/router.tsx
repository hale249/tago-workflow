import { createBrowserRouter, Navigate } from "react-router"

import { AppLayout } from "@/app/layouts/app-layout"
import { LoginPage } from "@/features/auth"
import { CustomersPage } from "@/features/customers"
import { HomePage } from "@/features/home"
import { ComingSoonPage } from "@/pages/coming-soon-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { NAV_SECTIONS } from "@/config/navigation"

const IMPLEMENTED = new Set(["/", "/customers"])

const placeholderRoutes = NAV_SECTIONS.flatMap((s) => s.items)
  .filter((item) => !IMPLEMENTED.has(item.to))
  .map((item) => ({
    path: item.to.slice(1),
    element: <ComingSoonPage title={item.title} />,
  }))

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "customers", element: <CustomersPage /> },
      ...placeholderRoutes,
      { path: "home", element: <Navigate to="/" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
