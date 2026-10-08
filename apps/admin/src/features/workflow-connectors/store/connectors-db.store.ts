import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Connector } from "../data/connector-types"

const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
// Like the reference workspace: one table connector per main table (not configured yet).
const SEED: Connector[] = [
  { id: "cn_customers", name: "Khách hàng", connectorType: "ACTIVE_TABLE", description: "", config: { tableId: "t_customers" }, status: "disconnected", createdAt: ago(20), updatedAt: ago(20) },
  { id: "cn_orders", name: "Đơn hàng", connectorType: "ACTIVE_TABLE", description: "", config: { tableId: "t_orders" }, status: "disconnected", createdAt: ago(18), updatedAt: ago(18) },
]

export const useConnectorsDb = create<{ connectors: Connector[] }>()(persist(() => ({ connectors: SEED }), { name: "tago-connectors-db", version: 1 }))
