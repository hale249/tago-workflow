import { createBrowserRouter, Navigate, type LazyRouteFunction, type RouteObject } from "react-router"
import type { ComponentType } from "react"

import { AppLayout } from "@/app/layouts/app-layout"
import { RouteMeta } from "@/app/layouts/route-meta"
import { NAV_ITEMS } from "@/config/navigation"

/**
 * Route-level code splitting: each page loads on first visit. Import the page *file* (not the feature
 * barrel) — barrels are also imported statically by the sidebar, which would pull every page back in.
 */
const page =
  <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M): LazyRouteFunction<RouteObject> =>
  async () => ({ Component: (await load())[name] as ComponentType })

const Dashboard = page(() => import("@/features/dashboard/pages/dashboard"), "DashboardPage")
const Notifications = page(() => import("@/features/dashboard/pages/dashboard"), "NotificationsPage")
const SocialChat = page(() => import("@/features/social-chat/pages/social-chat"), "SocialChatPage")
const TableRecords = page(() => import("@/features/tables/pages/table-records"), "TableRecordsPage")
const RecordForm = page(() => import("@/features/tables/pages/record-form"), "RecordFormPage")

const placeholderRoutes: RouteObject[] = NAV_ITEMS.filter((item) => item.comingSoon).map((item) => ({
  path: item.to.slice(1),
  handle: { title: item.title },
  lazy: async () => {
    const { ComingSoonPage } = await import("@/pages/coming-soon")
    return { Component: () => <ComingSoonPage title={item.title} /> }
  },
}))

/** Shown only while the very first route chunk loads. */
function BootFallback() {
  return <div className="grid h-svh place-items-center text-sm text-muted-foreground">Đang tải…</div>
}

export const router = createBrowserRouter([
  {
    Component: RouteMeta,
    HydrateFallback: BootFallback,
    children: [
    { path: "/login", handle: { title: "Đăng nhập" }, lazy: page(() => import("@/features/auth/pages/login"), "LoginPage") },
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, handle: { title: "Bảng điều khiển" }, lazy: Dashboard },
        { path: "notifications", handle: { title: "Thông báo" }, lazy: Notifications },
        { path: "customers", handle: { title: "Khách hàng" }, lazy: page(() => import("@/features/customers/pages/customers"), "CustomersPage") },
        { path: "settings", handle: { title: "Cài đặt workspace" }, lazy: page(() => import("@/features/workspace-settings/pages/workspace-settings"), "WorkspaceSettingsPage") },
        { path: "profile", handle: { title: "Hồ sơ người dùng" }, lazy: page(() => import("@/features/profile/pages/profile"), "ProfilePage") },
        { path: "social-chat", handle: { title: "Hộp thư Social", h1: true }, lazy: SocialChat },
        // Per-channel inboxes (sidebar "Social" section) = the unified inbox pre-filtered.
        { path: "social-chat/:channel", handle: { title: "Hộp thư Social", h1: true }, lazy: SocialChat },
        { path: "workflow-connectors", handle: { title: "Kết nối" }, lazy: page(() => import("@/features/workflow-connectors/pages/connectors"), "ConnectorsPage") },
        { path: "workflow-connectors/select", handle: { title: "Chọn loại Connector" }, lazy: page(() => import("@/features/workflow-connectors/pages/connectors"), "ConnectorSelectPage") },
        { path: "workflow-connectors/:connectorId", handle: { title: "Chi tiết kết nối" }, lazy: page(() => import("@/features/workflow-connectors/pages/connectors"), "ConnectorDetailPage") },
        { path: "workflow-forms", handle: { title: "Biểu mẫu" }, lazy: page(() => import("@/features/workflow-forms/pages/workflow-forms"), "WorkflowFormsPage") },
        { path: "workflow-forms/:formId", handle: { title: "Trình dựng biểu mẫu" }, lazy: page(() => import("@/features/workflow-forms/pages/form-builder"), "FormBuilderPage") },
        { path: "workflow-units", handle: { title: "Cloud Logic (Workflow)" }, lazy: page(() => import("@/features/workflow-units/pages/workflow-units"), "WorkflowUnitsPage") },
        { path: "workflow-units/:unitId", handle: { title: "Workflow" }, lazy: page(() => import("@/features/workflow-units/pages/workflow-unit"), "WorkflowUnitPage") },
        { path: "workflow-units/:unitId/events/:eventId/edit", handle: { title: "Trình dựng workflow", h1: true }, lazy: page(() => import("@/features/workflow-units/pages/event-editor"), "EventEditorPage") },
        { path: "workflow-units/:unitId/events/:eventId/console", handle: { title: "Console sự kiện", h1: true }, lazy: page(() => import("@/features/workflow-units/pages/event-console"), "EventConsolePage") },
        { path: "tables", handle: { title: "Apps" }, lazy: page(() => import("@/features/tables/pages/tables"), "TablesPage") },
        { path: "tables/:tableId", handle: { title: "Bản ghi" }, lazy: TableRecords },
        { path: "tables/:tableId/settings", handle: { title: "Cài đặt bảng" }, lazy: page(() => import("@/features/tables/pages/table-settings"), "TableSettingsPage") },
        { path: "tables/:tableId/records", handle: { title: "Bản ghi" }, lazy: TableRecords },
        { path: "tables/:tableId/records/new", handle: { title: "Tạo bản ghi" }, lazy: RecordForm },
        { path: "tables/:tableId/records/:recordId", handle: { title: "Chi tiết bản ghi" }, lazy: page(() => import("@/features/tables/pages/record-detail"), "RecordDetailPage") },
        { path: "tables/:tableId/records/:recordId/edit", handle: { title: "Sửa bản ghi" }, lazy: RecordForm },
        ...placeholderRoutes,
        { path: "home", element: <Navigate to="/" replace /> },
        { path: "*", handle: { title: "Không tìm thấy trang" }, lazy: page(() => import("@/pages/not-found"), "NotFoundPage") },
      ],
    },
    ],
  },
])
