import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Connector } from "../data/connector-types"

const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
// Like the reference workspace: one table connector per main table, configured (2/2 trường) but not yet verified.
const tc = (id: string, name: string, tableId: string, d: number): Connector => ({ id, name, connectorType: "ACTIVE_TABLE", description: "", config: { tableId, tableKey: Math.random().toString(36).slice(2, 18) }, status: "disconnected", createdAt: ago(d), updatedAt: ago(d) })
const SEED: Connector[] = [
  tc("cn_customers", "Khách hàng", "t_customers", 20),
  tc("cn_tasks", "Công việc", "t_tasks", 19),
  tc("cn_orders", "Đơn hàng", "t_orders", 18),
  tc("cn_stock_out", "Xuất kho", "t_stock_out", 17),
]

export const useConnectorsDb = create<{ connectors: Connector[] }>()(persist(() => ({ connectors: SEED }), { name: "tago-connectors-db", version: 2, migrate: () => ({ connectors: SEED }) }))
