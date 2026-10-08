import type { TriggerType, WorkflowEvent } from "../types/workflow"

/** Trigger names used inside the YAML document (event list uses ACTIVE_TABLE / SCHEDULE / …). */
const TRIGGER_TO_YAML: Record<TriggerType, string> = { ACTIVE_TABLE: "table", SCHEDULE: "schedule", WEBHOOK: "webhook", FORM: "form" }
const YAML_TO_TRIGGER = Object.fromEntries(Object.entries(TRIGGER_TO_YAML).map(([k, v]) => [v, k])) as Record<string, TriggerType>

/** Minimal YAML emitter for the workflow document (scalars, arrays, nested objects). */
function emit(v: unknown, indent: number): string {
  const pad = " ".repeat(indent)
  if (v === null || v === undefined) return "null"
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  if (typeof v === "string") return /^[\w./-]+$/.test(v) && !/^\d+$/.test(v) && !["true", "false", "null"].includes(v) ? v : JSON.stringify(v)
  if (Array.isArray(v)) {
    if (!v.length) return "[]"
    return "\n" + v.map((x) => `${pad}- ${typeof x === "object" && x ? emit(x, indent + 2).trimStart() : emit(x, indent + 2)}`).join("\n")
  }
  const entries = Object.entries(v as Record<string, unknown>)
  if (!entries.length) return "{}"
  return "\n" + entries.map(([k, x]) => `${pad}${k}: ${typeof x === "object" && x && Object.keys(x).length ? emit(x, indent + 2) : emit(x, indent + 2)}`).join("\n")
}

export function toYaml(e: WorkflowEvent): string {
  const doc = {
    version: "1.0",
    trigger: { type: TRIGGER_TO_YAML[e.trigger.type], config: e.trigger.params },
    steps: e.steps.map((s) => ({ id: s.id, name: s.name, type: s.type, config: s.config, depends_on: s.depends_on, position: s.position })),
    // Branch edges, same shape as the reference export: { source, target, label }.
    ...(e.edges?.length ? { edges: e.edges.map(({ source, target, label }) => ({ source, target, label })) } : {}),
  }
  return emit(doc, 0).trimStart() + "\n"
}

/** Parser for the YAML subset emitted above (2-space indents, maps, "- " lists, JSON-style scalars). */
export function parseYaml(src: string): unknown {
  const lines = src.split("\n").map((raw, n) => ({ n: n + 1, indent: raw.search(/\S|$/), text: raw.trim() })).filter((l) => l.text && !l.text.startsWith("#"))
  let i = 0
  const scalar = (s: string): unknown => {
    if (s === "[]") return []
    if (s === "{}") return {}
    if (s === "null" || s === "~") return null
    if (s === "true" || s === "false") return s === "true"
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
    if (s.startsWith('"')) return JSON.parse(s)
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
    return s
  }
  const block = (indent: number): unknown => {
    if (i >= lines.length) return null
    if (lines[i].text.startsWith("- ") || lines[i].text === "-") {
      const arr: unknown[] = []
      while (i < lines.length && lines[i].indent === indent && (lines[i].text.startsWith("- ") || lines[i].text === "-")) {
        const rest = lines[i].text.slice(2).trim()
        if (!rest) { i++; arr.push(block(lines[i]?.indent ?? indent + 2)); continue }
        if (/^[\w.-]+:(\s|$)/.test(rest)) {
          // "- key: v" starts an inline map; following keys sit at indent + 2.
          lines[i] = { ...lines[i], indent: indent + 2, text: rest }
          arr.push(block(indent + 2))
        } else { arr.push(scalar(rest)); i++ }
      }
      return arr
    }
    const obj: Record<string, unknown> = {}
    while (i < lines.length && lines[i].indent === indent) {
      const l = lines[i]
      const m = l.text.match(/^([\w.-]+):(?:\s+(.*))?$/)
      if (!m) throw new Error(`Dòng ${l.n}: không đọc được “${l.text}”`)
      i++
      if (m[2] !== undefined && m[2] !== "") obj[m[1]] = scalar(m[2])
      else if (i < lines.length && lines[i].indent > indent) obj[m[1]] = block(lines[i].indent)
      else if (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith("- ")) obj[m[1]] = block(indent)
      else obj[m[1]] = null
    }
    if (i < lines.length && lines[i].indent > indent) throw new Error(`Dòng ${lines[i].n}: thụt lề không hợp lệ`)
    return obj
  }
  const out = block(lines[0]?.indent ?? 0)
  if (i < lines.length) throw new Error(`Dòng ${lines[i].n}: thụt lề không hợp lệ`)
  return out
}

/** Applies an edited YAML document onto an event (keeps id/unit/name/active). */
export function fromYaml(text: string, base: WorkflowEvent): WorkflowEvent {
  const doc = parseYaml(text) as { trigger?: { type?: string; config?: Record<string, string> }; steps?: Record<string, unknown>[]; edges?: Record<string, unknown>[] }
  if (!doc || typeof doc !== "object") throw new Error("YAML trống")
  const steps = (doc.steps ?? []).map((s, k) => {
    if (!s.id || !s.type) throw new Error(`Bước thứ ${k + 1} thiếu id hoặc type`)
    const pos = (s.position ?? {}) as { x?: number; y?: number }
    return {
      id: String(s.id),
      name: String(s.name ?? s.id),
      type: String(s.type),
      config: (s.config && typeof s.config === "object" ? s.config : {}) as Record<string, unknown>,
      depends_on: Array.isArray(s.depends_on) ? s.depends_on.map(String) : [],
      position: { x: Number(pos.x ?? 40 + k * 300), y: Number(pos.y ?? 160) },
    }
  })
  const ids = steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error("Có ID bước bị trùng")
  const known = new Set(["start-node", ...ids])
  const edges = (Array.isArray(doc.edges) ? doc.edges : [])
    .filter((x) => x && x.source && x.target && x.label && x.label !== "workflow")
    .map((x) => ({ source: String(x.source), target: String(x.target), label: String(x.label) }))
  for (const ed of edges) {
    if (!known.has(ed.source) || !known.has(ed.target)) throw new Error(`Cạnh ${ed.source} → ${ed.target} trỏ tới bước không tồn tại`)
    // An edge implies the dependency even if depends_on omits it.
    const t = steps.find((s) => s.id === ed.target)
    if (t && !t.depends_on.includes(ed.source)) t.depends_on.push(ed.source)
  }
  const type = doc.trigger?.type ? YAML_TO_TRIGGER[doc.trigger.type] ?? base.trigger.type : base.trigger.type
  return { ...base, trigger: { type, params: (doc.trigger?.config ?? base.trigger.params) as Record<string, string> }, steps, edges }
}
