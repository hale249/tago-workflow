import { nodeType } from "../data/node-types"
import type { WorkflowEvent } from "../types/workflow"

const COL_W = 320
const GAP_Y = 48
/** Card height estimate (matches the canvas card: base block + optional branch rows). */
export const estimateNodeHeight = (type: string) => {
  const outs = nodeType(type).outputs?.length ?? 0
  return 112 + (outs ? 17 + outs * 24 + (outs - 1) * 2 : 0)
}

/** Layered left-to-right layout: column = longest path from the trigger; cards stack by real height, columns centred. */
export function autoLayout(e: WorkflowEvent): WorkflowEvent {
  const depth = new Map<string, number>([["start-node", 0]])
  const byId = new Map(e.steps.map((s) => [s.id, s]))
  const visit = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!
    if (seen.has(id)) return 1
    seen.add(id)
    const s = byId.get(id)
    const d = s && s.depends_on.length ? Math.max(...s.depends_on.map((p) => visit(p, seen))) + 1 : 1
    depth.set(id, d)
    return d
  }
  e.steps.forEach((s) => visit(s.id))
  const cols = new Map<number, string[]>()
  for (const s of e.steps) cols.set(depth.get(s.id)!, [...(cols.get(depth.get(s.id)!) ?? []), s.id])
  const colHeight = (ids: string[]) => ids.reduce((h, id) => h + estimateNodeHeight(byId.get(id)!.type), 0) + GAP_Y * (ids.length - 1)
  const tallest = Math.max(88, ...[...cols.values()].map(colHeight))
  // Order each column by the average rank of its parents (barycenter) so edges cross less.
  const rank = new Map<string, number>([["start-node", 0]])
  for (const d of [...cols.keys()].sort((x, y) => x - y)) {
    const ids = cols.get(d)!
    const score = (id: string) => {
      const ps = byId.get(id)!.depends_on.filter((p) => rank.has(p))
      return ps.length ? ps.reduce((t, p) => t + rank.get(p)!, 0) / ps.length : 0
    }
    ids.sort((x, y) => score(x) - score(y))
    ids.forEach((id, i) => rank.set(id, i))
  }
  const pos = new Map<string, { x: number; y: number }>()
  for (const [d, ids] of cols) {
    let y = 60 + (tallest - colHeight(ids)) / 2
    for (const id of ids) {
      pos.set(id, { x: 40 + d * COL_W, y: Math.round(y) })
      y += estimateNodeHeight(byId.get(id)!.type) + GAP_Y
    }
  }
  return { ...e, startPosition: { x: 40, y: Math.round(60 + (tallest - 88) / 2) }, steps: e.steps.map((s) => ({ ...s, position: pos.get(s.id) ?? s.position })) }
}
