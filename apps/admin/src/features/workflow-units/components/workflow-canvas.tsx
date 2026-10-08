import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Copy, LayoutGrid, Maximize, Minus, Pencil, Play, Plus, Trash2 } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { GROUP_CHIP, GROUP_SUBTLE, NODE_TYPES, nodeType, OUTPUT_COLOR, START_EDGE, TRIGGERS } from "../data/node-types"
import type { WorkflowEvent, WorkflowStep } from "../types/workflow"
import { estimateNodeHeight } from "../utils/layout"

export const NODE_W = 240
const START = "start-node"
const ZOOM_MIN = 0.3
const ZOOM_MAX = 1.5
// Estimate used before the card has been measured.
const nodeH = (s: WorkflowStep) => estimateNodeHeight(s.type)
type Pt = { x: number; y: number }

type Props = {
  event: WorkflowEvent
  triggerLabel: string
  selected: string | null
  onSelect: (id: string | null) => void
  /** Called on every drag frame; `commit` is true on drop (pushes history). */
  onMove: (id: string, pos: Pt, commit: boolean) => void
  /** `handle` is the branch key when dragged from a branch port (condition true/false, email on_open…). */
  onConnect: (from: string, to: string, handle?: string) => void
  onDropType: (type: string, pos: Pt) => void
  /** "+" menu on an output port: add a node of `type` wired after `from`. */
  onAddAfter: (from: string, type: string, pos: Pt, handle?: string) => void
  onDelete: (id: string) => void
  onAutoLayout: () => void
}

/**
 * Hand-rolled node canvas styled after the reference (React Flow look): absolutely positioned cards,
 * SVG bezier edges, scroll to pan, Ctrl/⌘ + wheel to zoom, fit view, minimap.
 */
export function WorkflowCanvas({ event, triggerLabel, selected, onSelect, onMove, onConnect, onDropType, onAddAfter, onDelete, onAutoLayout }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null)
  const [link, setLink] = useState<{ from: string; handle?: string; x: number; y: number; start: Pt } | null>(null)
  const [menu, setMenu] = useState<{ from: string; handle?: string; x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)

  const posOf = (id: string) => (id === START ? event.startPosition : event.steps.find((s) => s.id === id)?.position)
  /** Pointer position in canvas (unscaled) coordinates. */
  const local = (e: { clientX: number; clientY: number }) => {
    const el = wrap.current!
    const r = el.getBoundingClientRect()
    return { x: (e.clientX - r.left + el.scrollLeft) / zoom, y: (e.clientY - r.top + el.scrollTop) / zoom }
  }

  // Real card heights (measured) so ports sit at the vertical centre like the reference.
  const [heights, setHeights] = useState<Record<string, number>>({})
  const observer = useRef<ResizeObserver | null>(null)
  if (!observer.current && typeof ResizeObserver !== "undefined")
    observer.current = new ResizeObserver((entries) =>
      setHeights((h) => {
        const next = { ...h }
        for (const en of entries) next[(en.target as HTMLElement).dataset.node!] = (en.target as HTMLElement).offsetHeight
        return next
      }),
    )
  useEffect(() => () => observer.current?.disconnect(), [])
  const measure = (el: HTMLDivElement | null) => { if (el) observer.current?.observe(el) }
  const heightOf = (id: string) => heights[id] ?? (id === START ? 88 : nodeH(event.steps.find((s) => s.id === id)!))
  const hasOutputs = (id: string) => id !== START && !!nodeType(event.steps.find((s) => s.id === id)?.type ?? "").outputs
  const stepOf = (id: string) => event.steps.find((s) => s.id === id)
  /** Port position; with `handle`, the matching branch row in the card's bottom block. */
  const outPort = (id: string, handle?: string) => {
    const p = posOf(id)!
    const outs = id === START ? undefined : nodeType(stepOf(id)?.type ?? "").outputs
    const i = handle && outs ? outs.findIndex((o) => o.key === handle) : -1
    if (outs && i >= 0) {
      // Bottom block: 1px border + 8px padding, rows 24px tall with 2px gaps, 8px padding + 1px card border.
      const block = 1 + 8 + outs.length * 24 + (outs.length - 1) * 2 + 8
      return { x: p.x + NODE_W, y: p.y + heightOf(id) - 1 - block + 9 + i * 26 + 12 }
    }
    return { x: p.x + NODE_W, y: p.y + heightOf(id) * (hasOutputs(id) ? 0.2 : 0.5) }
  }
  const branchOf = (source: string, target: string) => event.edges?.find((e) => e.source === source && e.target === target)?.label
  const inPort = (id: string) => { const p = posOf(id)!; return { x: p.x, y: p.y + heightOf(id) / 2 } }
  const colorOf = (id: string) => (id === START ? START_EDGE : nodeType(event.steps.find((s) => s.id === id)?.type ?? "").color)
  const curve = (a: Pt, b: Pt) => {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2)
    return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`
  }

  // Content bounds (unscaled) — used for fit view and the minimap.
  const bounds = {
    w: Math.max(event.startPosition.x + NODE_W, ...event.steps.map((s) => s.position.x + NODE_W)) + 60,
    h: Math.max(event.startPosition.y + heightOf(START), ...event.steps.map((s) => s.position.y + heightOf(s.id))) + 60,
  }
  const maxX = Math.max(bounds.w + 400, 1200)
  const maxY = Math.max(bounds.h + 300, 700)

  const [view, setView] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const syncView = () => { const el = wrap.current; if (el) setView({ x: el.scrollLeft / zoom, y: el.scrollTop / zoom, w: el.clientWidth / zoom, h: el.clientHeight / zoom }) }
  useEffect(() => { syncView() }, [maxX, maxY, zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomTo = (z: number, anchor?: { clientX: number; clientY: number }) => {
    const el = wrap.current
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
    if (!el) return setZoom(next)
    const r = el.getBoundingClientRect()
    const ax = anchor ? anchor.clientX - r.left : el.clientWidth / 2
    const ay = anchor ? anchor.clientY - r.top : el.clientHeight / 2
    const cx = (el.scrollLeft + ax) / zoom
    const cy = (el.scrollTop + ay) / zoom
    setZoom(next)
    requestAnimationFrame(() => el.scrollTo({ left: cx * next - ax, top: cy * next - ay }))
  }
  const fitView = () => {
    const el = wrap.current
    if (!el) return
    const z = Math.min(1, (el.clientWidth - 40) / bounds.w, (el.clientHeight - 40) / bounds.h)
    setZoom(Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
    requestAnimationFrame(() => el.scrollTo({ left: 0, top: 0 }))
  }
  // Fit once when an event opens (the reference opens zoomed to fit).
  const fitted = useRef("")
  useLayoutEffect(() => {
    if (fitted.current === event.id) return
    fitted.current = event.id
    fitView()
  }) // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl/⌘ + wheel zooms around the pointer; plain wheel scrolls (pans).
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomTo(zoom * (e.deltaY < 0 ? 1.1 : 0.9), e)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menu])

  const startDrag = (id: string, e: React.PointerEvent) => {
    const p = posOf(id)!
    const m = local(e)
    drag.current = { id, dx: m.x - p.x, dy: m.y - p.y, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const m = local(e)
    if (link) setLink({ ...link, x: m.x, y: m.y })
    const d = drag.current
    if (!d) return
    d.moved = true
    onMove(d.id, { x: Math.max(0, Math.round(m.x - d.dx)), y: Math.max(0, Math.round(m.y - d.dy)) }, false)
  }
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (d?.moved) { const m = local(e); onMove(d.id, { x: Math.max(0, Math.round(m.x - d.dx)), y: Math.max(0, Math.round(m.y - d.dy)) }, true) }
    if (link) {
      const m = local(e)
      const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-node]")?.getAttribute("data-node")
      // A click (no real drag) on the port opens the "+" menu like the reference.
      if (Math.hypot(m.x - link.start.x, m.y - link.start.y) < 4) setMenu({ from: link.from, handle: link.handle, x: link.start.x, y: link.start.y })
      else if (target && target !== link.from && target !== START) onConnect(link.from, target, link.handle)
      setLink(null)
    }
  }

  const handle = "size-3 rounded-full border-2 border-card transition-[width,height] duration-200"
  // Plain render function (not a component) so node DOM stays stable while dragging.
  const card = (id: string, children: React.ReactNode, className?: string, style?: React.CSSProperties) => {
    const p = posOf(id)!
    const color = colorOf(id)
    const o = hasOutputs(id) ? 0.2 : 0.5
    return (
      <div
        key={id}
        ref={measure}
        data-node={id}
        onPointerDown={(e) => { e.stopPropagation(); setMenu(null); onSelect(id === START ? null : id); startDrag(id, e) }}
        className={cn("group absolute cursor-grab bg-card shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing", selected === id && "ring-2 ring-brand/60", className)}
        style={{ left: p.x, top: p.y, width: NODE_W, ...style }}
      >
        {id !== START && (
          <div className="pointer-events-none absolute -top-10 left-4 z-10 flex -translate-y-2 gap-1 rounded-lg border bg-background/95 p-1 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <button type="button" aria-label="Chỉnh sửa node" title="Chỉnh sửa node" onPointerDown={(e) => { e.stopPropagation(); onSelect(id) }} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Pencil className="size-3.5" />
            </button>
            <button type="button" aria-label="Xóa node" title="Xóa node" onPointerDown={(e) => { e.stopPropagation(); onDelete(id) }} className="grid size-7 place-items-center rounded-md text-destructive hover:bg-destructive/10">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
        {children}
        <span
          role="button"
          aria-label="Thêm node"
          title="Bấm để thêm node, kéo để nối tới node khác"
          onPointerDown={(e) => { e.stopPropagation(); setMenu(null); const out = outPort(id); setLink({ from: id, ...out, start: out }); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
          className={cn("absolute -right-1.5 z-10 -translate-y-1/2 cursor-crosshair group-hover:-right-2 group-hover:size-4", handle)}
          style={{ top: `${o * 100}%`, backgroundColor: id === START ? "#3b82f6" : color }}
        />
        {id !== START && <span className={cn("absolute top-1/2 -left-1.5 -translate-y-1/2 group-hover:-left-2 group-hover:size-4", handle)} style={{ backgroundColor: color }} />}
      </div>
    )
  }
  const T = TRIGGERS[event.trigger.type]

  // Minimap: content bounds scaled into 200×150, viewport shown as a hole in a light mask.
  const MW = 200
  const MH = 150
  const mScale = Math.min(MW / bounds.w, MH / bounds.h)
  const mOff = { x: (MW - bounds.w * mScale) / 2, y: (MH - bounds.h * mScale) / 2 }
  const mRect = (x: number, y: number, w: number, h: number) => ({ x: mOff.x + x * mScale, y: mOff.y + y * mScale, w: w * mScale, h: h * mScale })
  const vr = mRect(view.x, view.y, view.w, view.h)

  return (
    <div className="relative h-full">
      <div
        ref={wrap}
        onScroll={syncView}
        className="relative h-full overflow-auto bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerDown={() => { onSelect(null); setMenu(null) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { const t = e.dataTransfer.getData("application/x-node-type"); if (t) onDropType(t, local(e)) }}
      >
        <div style={{ width: maxX * zoom, height: maxY * zoom }}>
          <div className="relative origin-top-left" style={{ width: maxX, height: maxY, transform: `scale(${zoom})` }}>
            <svg className="pointer-events-none absolute inset-0" width={maxX} height={maxY}>
              <defs>
                {Object.entries(OUTPUT_COLOR).map(([k, c]) => (
                  <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 Z" fill={c} />
                  </marker>
                ))}
              </defs>
              {event.steps.flatMap((s) => s.depends_on.filter(posOf).map((d) => {
                const branch = branchOf(d, s.id)
                const hot = selected === s.id || selected === d
                // Branch edges: 2px, branch colour, closed arrow (reference "branch" edge type).
                return branch && OUTPUT_COLOR[branch] ? (
                  <path key={`${d}-${s.id}`} d={curve(outPort(d, branch), inPort(s.id))} fill="none" stroke={OUTPUT_COLOR[branch]} strokeLinecap="round" strokeWidth={hot ? 3 : 2} markerEnd={`url(#arrow-${branch})`} />
                ) : (
                  <path key={`${d}-${s.id}`} d={curve(outPort(d), inPort(s.id))} fill="none" stroke={colorOf(d)} strokeLinecap="round" strokeWidth={hot ? 2.5 : 1.5} strokeOpacity={hot ? 1 : 0.7} />
                )
              }))}
              {link && <path d={curve(outPort(link.from, link.handle), link)} fill="none" stroke={link.handle ? OUTPUT_COLOR[link.handle] ?? colorOf(link.from) : colorOf(link.from)} strokeDasharray="5 4" strokeWidth={1.5} />}
            </svg>

            {card(START, <>
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
                <Play className="size-3.5 fill-current text-blue-500" />
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bắt đầu</p>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"><T.icon className="size-5" /></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold tracking-wide uppercase">{T.label}</p>
                  <p className="rounded-md bg-muted/50 px-2.5 py-1.5 font-mono text-xs break-words text-muted-foreground">{triggerLabel}</p>
                </div>
              </div>
            </>, "rounded-xl border-2 border-blue-400/50")}

            {event.steps.map((s) => {
              const N = nodeType(s.type)
              const unconfigured = !Object.keys(s.config).length
              return (
                card(s.id, <>
                  <div className={cn("flex flex-col gap-3 p-3", N.outputs && "pb-2")}>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md p-1.5" style={{ backgroundColor: GROUP_SUBTLE[N.group], color: N.color }}><N.icon className="size-4" /></span>
                      <p className="line-clamp-1 text-xs font-semibold">{N.label}</p>
                    </div>
                    {unconfigured && <p className="line-clamp-2 font-mono text-xs text-muted-foreground">Chưa cấu hình</p>}
                    {s.name && <p className="line-clamp-1 text-xs text-muted-foreground">{s.name}</p>}
                    {!N.outputs && (
                      <div className="flex items-center gap-1">
                        <p className="flex-1 truncate font-mono text-xs font-semibold" title={s.id}>{s.id}</p>
                        <button
                          type="button"
                          aria-label="Sao chép ID"
                          onPointerDown={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(s.id) }}
                          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {N.outputs && (
                    <div className="space-y-0.5 border-t px-3 py-2">
                      {N.outputs.map((o) => (
                        <div key={o.key} className="relative flex items-center justify-between py-1">
                          <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: OUTPUT_COLOR[o.key] ?? N.color }} />{o.label}</span>
                          <span
                            role="button"
                            aria-label={`Thêm node cho nhánh ${o.label}`}
                            title="Bấm để thêm node, kéo để nối nhánh tới node khác"
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              setMenu(null)
                              const out = outPort(s.id, o.key)
                              setLink({ from: s.id, handle: o.key, ...out, start: out })
                              ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                            }}
                            className={cn("absolute top-1/2 -right-[19px] -translate-y-1/2 cursor-crosshair hover:size-4", handle)}
                            style={{ backgroundColor: OUTPUT_COLOR[o.key] ?? N.color }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>, "rounded-lg border", { borderLeftWidth: 3, borderLeftColor: N.color })
              )
            })}

            {menu && (
              <div
                role="menu"
                aria-label="Thêm node"
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute z-30 max-h-80 w-56 origin-top-left overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                style={{ left: menu.x + 12, top: menu.y - 12, transform: `scale(${1 / zoom})` }}
              >
                {(["Logic", "Actions"] as const).map((g) => (
                  <div key={g}>
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{g}</p>
                    {NODE_TYPES.filter((n) => n.group === g).map((n) => (
                      <button
                        key={n.type}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          const p = posOf(menu.from)!
                          const x = p.x + NODE_W + 80
                          let y = menu.handle ? Math.round(menu.y - 40) : p.y
                          // Slide down until the new card doesn't overlap an existing one.
                          const h = estimateNodeHeight(n.type)
                          const hit = () => event.steps.some((st) => Math.abs(st.position.x - x) < NODE_W && y < st.position.y + heightOf(st.id) + 24 && st.position.y < y + h + 24)
                          for (let k = 0; k < 50 && hit(); k++) y += 40
                          onAddAfter(menu.from, n.type, { x, y }, menu.handle)
                          setMenu(null)
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      >
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", GROUP_CHIP[n.group])}><n.icon className="size-3.5" /></span>
                        <span className="truncate">{n.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAutoLayout}
        aria-label="Tự động sắp xếp node"
        title="Tự động sắp xếp node"
        className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-md border bg-background shadow-xs hover:bg-accent"
      >
        <LayoutGrid className="size-4" />
      </button>

      <div className="absolute right-4 bottom-4 z-10 flex flex-col overflow-hidden rounded-md border bg-background shadow-xs [&>button]:grid [&>button]:size-7 [&>button]:place-items-center [&>button]:border-b [&>button:last-child]:border-b-0 [&>button:hover]:bg-accent">
        <button type="button" aria-label="Phóng to" title="Phóng to" onClick={() => zoomTo(zoom * 1.2)}><Plus className="size-3.5" /></button>
        <button type="button" aria-label="Thu nhỏ" title="Thu nhỏ" onClick={() => zoomTo(zoom / 1.2)}><Minus className="size-3.5" /></button>
        <button type="button" aria-label="Vừa màn hình" title="Vừa màn hình" onClick={fitView}><Maximize className="size-3.5" /></button>
      </div>

      <svg
        width={MW}
        height={MH}
        role="img"
        aria-label="Bản đồ thu nhỏ"
        className="absolute bottom-4 left-4 z-10 cursor-pointer rounded-sm border bg-background shadow-xs"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - r.left - mOff.x) / mScale
          const y = (e.clientY - r.top - mOff.y) / mScale
          wrap.current?.scrollTo({ left: (x - view.w / 2) * zoom, top: (y - view.h / 2) * zoom, behavior: "smooth" })
        }}
      >
        {(() => { const r = mRect(event.startPosition.x, event.startPosition.y, NODE_W, heightOf(START)); return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill={START_EDGE} /> })()}
        {event.steps.map((s) => { const r = mRect(s.position.x, s.position.y, NODE_W, heightOf(s.id)); return <rect key={s.id} x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill={nodeType(s.type).color} /> })}
        <path fillRule="evenodd" fill="rgba(0,0,0,0.1)" d={`M0,0 H${MW} V${MH} H0 Z M${vr.x},${vr.y} h${vr.w} v${vr.h} h${-vr.w} Z`} />
      </svg>
    </div>
  )
}
