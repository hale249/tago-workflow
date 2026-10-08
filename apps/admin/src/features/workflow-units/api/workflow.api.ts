import { useWorkflowDb } from "../store/workflow-db.store"
import type { LogLevel, WorkflowEvent, WorkflowLog, WorkflowUnit } from "../types/workflow"
import { nodeType } from "../data/node-types"

// Swap for real HTTP calls later; keep the signatures.
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))
const db = () => useWorkflowDb.getState()
const write = useWorkflowDb.setState
const id = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()

function must<T>(v: T | undefined, msg: string): T {
  if (!v) throw new Error(msg)
  return v
}

export const workflowApi = {
  async listUnits() { await delay(); return db().units },
  async getUnit(unitId: string) { await delay(60); return must(db().units.find((u) => u.id === unitId), "Không tìm thấy workflow") },
  async saveUnit(input: Pick<WorkflowUnit, "name" | "description"> & { id?: string }): Promise<WorkflowUnit> {
    await delay()
    if (!input.name.trim()) throw new Error("Tên workflow là bắt buộc")
    const cur = input.id ? db().units.find((u) => u.id === input.id) : undefined
    const u: WorkflowUnit = cur ? { ...cur, ...input, updatedAt: now() } : { id: id(), name: input.name.trim(), description: input.description, createdAt: now(), updatedAt: now() }
    write((s) => ({ units: cur ? s.units.map((x) => (x.id === u.id ? u : x)) : [...s.units, u] }))
    return u
  },
  async deleteUnit(unitId: string) {
    await delay()
    write((s) => ({ units: s.units.filter((u) => u.id !== unitId), events: s.events.filter((e) => e.unitId !== unitId) }))
  },

  async listEvents(unitId: string) { await delay(60); return db().events.filter((e) => e.unitId === unitId) },
  async getEvent(eventId: string) { await delay(60); return must(db().events.find((e) => e.id === eventId), "Không tìm thấy sự kiện") },
  async saveEvent(e: Omit<WorkflowEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<WorkflowEvent> {
    await delay()
    if (!e.name.trim()) throw new Error("Tên sự kiện là bắt buộc")
    const cur = e.id ? db().events.find((x) => x.id === e.id) : undefined
    const next: WorkflowEvent = cur ? { ...cur, ...e, id: cur.id, updatedAt: now() } : { ...e, id: id(), createdAt: now(), updatedAt: now() }
    write((s) => ({ events: cur ? s.events.map((x) => (x.id === next.id ? next : x)) : [...s.events, next] }))
    write((s) => ({ units: s.units.map((u) => (u.id === next.unitId ? { ...u, updatedAt: now() } : u)) }))
    return next
  },
  async deleteEvent(eventId: string) { await delay(); write((s) => ({ events: s.events.filter((e) => e.id !== eventId) })) },

  async listLogs(eventId: string) { await delay(40); return db().logs.filter((l) => l.eventId === eventId) },
  async clearLogs(eventId: string) { await delay(40); write((s) => ({ logs: s.logs.filter((l) => l.eventId !== eventId) })) },
  /** Dry run: walks steps in dependency order and writes log lines (no side effects). */
  async testRun(eventId: string) {
    const e = must(db().events.find((x) => x.id === eventId), "Không tìm thấy sự kiện")
    const add = (level: LogLevel, message: string, stepId?: string) =>
      write((s) => ({ logs: [...s.logs, { id: id(), eventId, at: now(), level, message, stepId } satisfies WorkflowLog] }))
    add("info", `▶ Bắt đầu chạy thử “${e.name}” (kích hoạt: ${e.trigger.type})`)
    const done = new Set(["start-node"])
    let pending = [...e.steps]
    while (pending.length) {
      const ready = pending.filter((s) => s.depends_on.every((d) => done.has(d)))
      if (!ready.length) {
        add("error", `Không chạy được ${pending.length} bước vì phụ thuộc không tồn tại hoặc vòng lặp: ${pending.map((s) => s.id).join(", ")}`)
        break
      }
      for (const s of ready) {
        await delay(120)
        add("debug", `config = ${JSON.stringify(s.config)}`, s.id)
        if (!Object.keys(s.config).length) add("warn", `“${s.name}” chưa được cấu hình`, s.id)
        add("info", `✓ ${nodeType(s.type).label}: ${s.name}`, s.id)
        done.add(s.id)
      }
      pending = pending.filter((s) => !done.has(s.id))
    }
    add("info", "■ Kết thúc chạy thử")
  },
}
