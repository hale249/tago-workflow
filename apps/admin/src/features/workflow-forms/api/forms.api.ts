import { templateConfig } from "../data/templates"
import { useFormsDb } from "../store/forms-db.store"
import type { FormType, WorkflowForm } from "../types/form"

// Swap for HTTP later: POST /api/workspace/{ws}/workflow/{get|post|patch|delete}/workflow_forms[/{id}]
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))
const db = () => useFormsDb.getState()
const write = useFormsDb.setState
const now = () => new Date().toISOString()
const links = (id: string) => {
  const url = `${window.location.origin}/f/${id}`
  return { formLink: url, formEmbedCode: `<iframe src="${url}" width="100%" height="640" frameborder="0"></iframe>` }
}

export const formsApi = {
  async list() { await delay(); return db().forms },
  async get(id: string) {
    await delay(60)
    const f = db().forms.find((x) => x.id === id)
    if (!f) throw new Error("Form không tồn tại.")
    return f
  },
  async create(input: { name: string; description: string; formType: FormType }): Promise<WorkflowForm> {
    await delay()
    if (!input.name.trim()) throw new Error("Tên form không được để trống")
    const id = Math.random().toString(36).slice(2, 12)
    const f: WorkflowForm = { id, name: input.name.trim(), description: input.description, formType: input.formType, config: templateConfig(input.formType), ...links(id), createdAt: now(), updatedAt: now() }
    write((s) => ({ forms: [...s.forms, f] }))
    return f
  },
  async update(id: string, patch: Partial<Pick<WorkflowForm, "name" | "description" | "formType" | "config">>): Promise<WorkflowForm> {
    await delay()
    if (patch.name !== undefined && !patch.name.trim()) throw new Error("Tên form không được để trống")
    const cur = await formsApi.get(id)
    const next = { ...cur, ...patch, updatedAt: now() }
    write((s) => ({ forms: s.forms.map((f) => (f.id === id ? next : f)) }))
    return next
  },
  async remove(id: string) { await delay(); write((s) => ({ forms: s.forms.filter((f) => f.id !== id) })) },
}
