import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { connectorType, type Connector } from "../data/connector-types"
import { useConnectorsDb } from "../store/connectors-db.store"

// Swap for HTTP later: POST /api/workspace/{ws}/workflow/{get|post|patch|delete}/workflow_connectors[/{id}]
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))
const db = () => useConnectorsDb.getState().connectors
const write = (fn: (c: Connector[]) => Connector[]) => useConnectorsDb.setState((s) => ({ connectors: fn(s.connectors) }))
const now = () => new Date().toISOString()

/** "connected" once every required config field has a value (OAuth types: once a token is present). */
const statusOf = (c: Pick<Connector, "connectorType" | "config">): Connector["status"] => {
  const t = connectorType(c.connectorType)
  if (!t) return "error"
  return t.fields.filter((f) => f.required || t.oauth).some((f) => (f.required || f.name.toLowerCase().includes("token")) && !c.config[f.name]) ? "disconnected" : "connected"
}

export const connectorsApi = {
  async list() { await delay(); return db() },
  async get(id: string) { await delay(60); const c = db().find((x) => x.id === id); if (!c) throw new Error("Không tìm thấy connector"); return c },
  async create(v: { name: string; description: string; connectorType: string }) {
    await delay()
    if (!v.name.trim()) throw new Error("Tên định danh là bắt buộc")
    const c: Connector = { ...v, name: v.name.trim(), id: Math.random().toString(36).slice(2, 12), config: {}, status: "disconnected", createdAt: now(), updatedAt: now() }
    write((l) => [...l, c])
    return c
  },
  async update(id: string, patch: Partial<Pick<Connector, "name" | "description" | "config">>) {
    await delay()
    const cur = await connectorsApi.get(id)
    const next = { ...cur, ...patch, updatedAt: now() }
    next.status = statusOf(next)
    write((l) => l.map((c) => (c.id === id ? next : c)))
    return next
  },
  async remove(id: string) { await delay(); write((l) => l.filter((c) => c.id !== id)) },
}

const KEY = ["workflow-connectors"] as const
export const connectorsListQuery = () => ({ queryKey: KEY, queryFn: connectorsApi.list })
export const useConnectors = () => useQuery(connectorsListQuery())
export const useConnector = (id: string) => useQuery({ queryKey: [...KEY, id], queryFn: () => connectorsApi.get(id) })
function useWrite<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) })
}
export const useCreateConnector = () => useWrite(connectorsApi.create)
export const useUpdateConnector = (id: string) => useWrite((p: Partial<Pick<Connector, "name" | "description" | "config">>) => connectorsApi.update(id, p))
export const useDeleteConnector = () => useWrite((id: string) => connectorsApi.remove(id))
