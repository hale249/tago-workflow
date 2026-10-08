import { createBrowserRouter, Navigate } from "react-router"

import { AppLayout } from "@/app/layouts/app-layout"
import { LoginPage } from "@/features/auth"
import { CustomersPage } from "@/features/customers"
import { ProfilePage } from "@/features/profile"
import { SocialChatPage } from "@/features/social-chat"
import { DashboardPage, NotificationsPage } from "@/features/dashboard"
import { WorkspaceSettingsPage } from "@/features/workspace-settings"
import { ConnectorDetailPage, ConnectorSelectPage, ConnectorsPage } from "@/features/workflow-connectors"
import { FormBuilderPage, WorkflowFormsPage } from "@/features/workflow-forms"
import { EventConsolePage, EventEditorPage, WorkflowUnitPage, WorkflowUnitsPage } from "@/features/workflow-units"
import { RecordDetailPage, RecordFormPage, TableRecordsPage, TablesPage, TableSettingsPage } from "@/features/tables"
import { ComingSoonPage } from "@/pages/coming-soon"
import { NotFoundPage } from "@/pages/not-found"
import { NAV_ITEMS } from "@/config/navigation"

const placeholderRoutes = NAV_ITEMS
  .filter((item) => item.comingSoon)
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
      { index: true, element: <DashboardPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "settings", element: <WorkspaceSettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "social-chat", element: <SocialChatPage /> },
      // Old per-channel inbox links land in the unified inbox, pre-filtered.
      ...(["facebook", "instagram", "whatsapp", "zalo"] as const).map((ch) => ({ path: `social-chat/${ch}`, element: <Navigate to={`/social-chat?channel=${ch}`} replace /> })),
      { path: "workflow-connectors", element: <ConnectorsPage /> },
      { path: "workflow-connectors/select", element: <ConnectorSelectPage /> },
      { path: "workflow-connectors/:connectorId", element: <ConnectorDetailPage /> },
      { path: "workflow-forms", element: <WorkflowFormsPage /> },
      { path: "workflow-forms/:formId", element: <FormBuilderPage /> },
      { path: "workflow-units", element: <WorkflowUnitsPage /> },
      { path: "workflow-units/:unitId", element: <WorkflowUnitPage /> },
      { path: "workflow-units/:unitId/events/:eventId/edit", element: <EventEditorPage /> },
      { path: "workflow-units/:unitId/events/:eventId/console", element: <EventConsolePage /> },
      { path: "tables", element: <TablesPage /> },
      { path: "tables/:tableId", element: <TableRecordsPage /> },
      { path: "tables/:tableId/settings", element: <TableSettingsPage /> },
      { path: "tables/:tableId/records", element: <TableRecordsPage /> },
      { path: "tables/:tableId/records/new", element: <RecordFormPage /> },
      { path: "tables/:tableId/records/:recordId", element: <RecordDetailPage /> },
      { path: "tables/:tableId/records/:recordId/edit", element: <RecordFormPage /> },
      ...placeholderRoutes,
      { path: "home", element: <Navigate to="/" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
