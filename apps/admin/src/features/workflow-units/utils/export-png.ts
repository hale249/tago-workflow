import { GROUP_SUBTLE, nodeType, OUTPUT_COLOR, START_EDGE, TRIGGERS } from "../data/node-types"
import type { WorkflowEvent } from "../types/workflow"
import { estimateNodeHeight } from "./layout"

const NODE_W = 240
const START_H = 104
const FONT = "Inter, ui-sans-serif, system-ui, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
const C = { fg: "#15181a", muted: "#5e6266", border: "#e6e8e9", dot: "#e6e8e9", subtle: "#f3f4f3" }

/**
 * Renders the workflow the way the canvas draws it (cards with group accent, branch rows,
 * branch-coloured edges with arrows) and downloads it as a PNG at 2× scale.
 */
export function exportWorkflowPng(e: WorkflowEvent, triggerLabel: string) {
  const height = (id: string) => (id === "start-node" ? START_H : estimateNodeHeight(e.steps.find((s) => s.id === id)?.type ?? ""))
  const pos = (id: string) => (id === "start-node" ? e.startPosition : e.steps.find((s) => s.id === id)?.position)
  const outs = (id: string) => (id === "start-node" ? undefined : nodeType(e.steps.find((s) => s.id === id)?.type ?? "").outputs)
  const outPort = (id: string, handle?: string) => {
    const p = pos(id)!
    const o = outs(id)
    const i = handle && o ? o.findIndex((x) => x.key === handle) : -1
    if (o && i >= 0) {
      const block = 1 + 8 + o.length * 24 + (o.length - 1) * 2 + 8
      return { x: p.x + NODE_W, y: p.y + height(id) - 1 - block + 9 + i * 26 + 12 }
    }
    return { x: p.x + NODE_W, y: p.y + height(id) * (o ? 0.2 : 0.5) }
  }
  const inPort = (id: string) => { const p = pos(id)!; return { x: p.x, y: p.y + height(id) / 2 } }

  const minX = Math.min(e.startPosition.x, ...e.steps.map((s) => s.position.x)) - 40
  const minY = Math.min(e.startPosition.y, ...e.steps.map((s) => s.position.y)) - 40
  const w = Math.max(e.startPosition.x + NODE_W, ...e.steps.map((s) => s.position.x + NODE_W)) + 40 - minX
  const h = Math.max(e.startPosition.y + START_H, ...e.steps.map((s) => s.position.y + height(s.id))) + 40 - minY
  const scale = 2
  const canvas = Object.assign(document.createElement("canvas"), { width: w * scale, height: h * scale })
  const g = canvas.getContext("2d")!
  g.scale(scale, scale)
  g.translate(-minX, -minY)

  // Background with the canvas dot grid.
  g.fillStyle = "#fff"
  g.fillRect(minX, minY, w, h)
  g.fillStyle = C.dot
  for (let x = Math.floor(minX / 16) * 16; x < minX + w; x += 16) for (let y = Math.floor(minY / 16) * 16; y < minY + h; y += 16) g.fillRect(x, y, 1, 1)

  const text = (s: string, x: number, y: number, font: string, color: string, maxW = NODE_W - 24) => {
    g.font = font
    g.fillStyle = color
    let t = s
    while (t.length > 1 && g.measureText(t).width > maxW) t = t.slice(0, -2) + "…"
    g.fillText(t, x, y)
  }
  const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2)
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.bezierCurveTo(a.x + dx, a.y, b.x - dx, b.y, b.x, b.y)
    g.stroke()
  }
  const dot = (x: number, y: number, r: number, color: string) => {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = color; g.fill()
    g.lineWidth = 2; g.strokeStyle = "#fff"; g.stroke()
  }

  // Edges (branch edges: 2px, branch colour, arrow head).
  g.lineCap = "round"
  for (const s of e.steps) for (const d of s.depends_on) {
    if (!pos(d)) continue
    const branch = e.edges?.find((x) => x.source === d && x.target === s.id)?.label
    const color = branch && OUTPUT_COLOR[branch] ? OUTPUT_COLOR[branch] : d === "start-node" ? START_EDGE : nodeType(e.steps.find((x) => x.id === d)?.type ?? "").color
    const b = inPort(s.id)
    g.strokeStyle = color
    g.globalAlpha = branch ? 1 : 0.7
    g.lineWidth = branch ? 2 : 1.5
    curve(outPort(d, branch), b)
    g.globalAlpha = 1
    if (branch) {
      g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x - 8, b.y - 4); g.lineTo(b.x - 8, b.y + 4); g.closePath(); g.fillStyle = color; g.fill()
    }
  }

  // Start card.
  const sp = e.startPosition
  const T = TRIGGERS[e.trigger.type]
  g.fillStyle = "#fff"; g.strokeStyle = "rgba(96,165,250,0.5)"; g.lineWidth = 2
  g.beginPath(); g.roundRect(sp.x, sp.y, NODE_W, START_H, 12); g.fill(); g.stroke()
  g.strokeStyle = C.border; g.lineWidth = 1
  g.beginPath(); g.moveTo(sp.x, sp.y + 33); g.lineTo(sp.x + NODE_W, sp.y + 33); g.stroke()
  text("▶  BẮT ĐẦU", sp.x + 16, sp.y + 21, `600 11px ${FONT}`, C.muted)
  g.fillStyle = "#dbeafe"; g.beginPath(); g.roundRect(sp.x + 16, sp.y + 49, 40, 40, 8); g.fill()
  text(T.label.slice(0, 1), sp.x + 31, sp.y + 74, `700 14px ${FONT}`, "#2563eb")
  text(T.label.toUpperCase(), sp.x + 68, sp.y + 62, `600 13px ${FONT}`, C.fg, NODE_W - 84)
  text(triggerLabel, sp.x + 68, sp.y + 82, `11px ${MONO}`, C.muted, NODE_W - 84)
  dot(sp.x + NODE_W, sp.y + START_H / 2, 6, "#3b82f6")

  // Step cards.
  for (const s of e.steps) {
    const N = nodeType(s.type)
    const { x, y } = s.position
    const ch = height(s.id)
    g.save()
    g.beginPath(); g.roundRect(x, y, NODE_W, ch, 8); g.clip()
    g.fillStyle = "#fff"; g.fillRect(x, y, NODE_W, ch)
    g.fillStyle = N.color; g.fillRect(x, y, 3, ch)
    g.restore()
    g.strokeStyle = C.border; g.lineWidth = 1
    g.beginPath(); g.roundRect(x + 0.5, y + 0.5, NODE_W - 1, ch - 1, 8); g.stroke()

    g.fillStyle = GROUP_SUBTLE[N.group]; g.beginPath(); g.roundRect(x + 12, y + 12, 28, 28, 6); g.fill()
    text(N.label.slice(0, 1), x + 21, y + 31, `700 13px ${FONT}`, N.color)
    text(N.label, x + 48, y + 30, `600 12px ${FONT}`, C.fg, NODE_W - 60)
    let ly = y + 58
    if (!Object.keys(s.config).length) { text("Chưa cấu hình", x + 12, ly, `11px ${MONO}`, C.muted); ly += 22 }
    if (s.name) { text(s.name, x + 12, ly, `12px ${FONT}`, C.muted); ly += 22 }
    if (!N.outputs) text(s.id, x + 12, ly, `600 11px ${MONO}`, C.fg)

    if (N.outputs) {
      const block = 1 + 8 + N.outputs.length * 24 + (N.outputs.length - 1) * 2 + 8
      const top = y + ch - 1 - block
      g.strokeStyle = C.border; g.beginPath(); g.moveTo(x, top); g.lineTo(x + NODE_W, top); g.stroke()
      N.outputs.forEach((o, i) => {
        const cy = top + 9 + i * 26 + 12
        const color = OUTPUT_COLOR[o.key] ?? N.color
        g.beginPath(); g.arc(x + 16, cy, 4, 0, Math.PI * 2); g.fillStyle = color; g.fill()
        text(o.label, x + 28, cy + 4, `12px ${FONT}`, C.muted)
        dot(x + NODE_W, cy, 6, color)
      })
    }
    dot(x, y + ch / 2, 6, N.color)
    dot(x + NODE_W, y + ch * (N.outputs ? 0.2 : 0.5), 6, N.color)
  }

  Object.assign(document.createElement("a"), { href: canvas.toDataURL("image/png"), download: `${e.name}.png` }).click()
}
