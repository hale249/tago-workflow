import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

// Monaco "vs" look: Menlo 14/21, 68px margin (42px numbers + 26px folding), whitespace dots, 120px minimap.
const LINE = 21
const font = { fontFamily: 'Menlo, Monaco, "Courier New", monospace', fontSize: 14, lineHeight: `${LINE}px`, fontFeatureSettings: '"liga" 0, "calt" 0', letterSpacing: 0 }
const C = {
  key: "text-[#008080] dark:text-[#3dc9b0]",
  string: "text-[#0451a5] dark:text-[#ce9178]",
  number: "text-[#098658] dark:text-[#b5cea8]",
  keyword: "text-[#0000ff] dark:text-[#569cd6]",
  comment: "text-[#008000] dark:text-[#6a9955]",
  space: "text-[#33333333] dark:text-[#e3e4e229]",
}

function valueClass(v: string) {
  if (/^-?\d+(\.\d+)?$/.test(v)) return C.number
  if (/^(true|false|null|~)$/.test(v)) return C.keyword
  return C.string
}

/** Tokenises one YAML line into coloured spans (leading indentation drawn as Monaco whitespace dots). */
function highlight(line: string): ReactNode {
  const out: ReactNode[] = []
  const lead = line.match(/^ */)![0].length
  if (lead) out.push(<span key="ws" className={C.space}>{"·".repeat(lead)}</span>)
  let rest = line.slice(lead)
  const dash = rest.match(/^- ?/)
  if (dash) { out.push(<span key="dash">{dash[0]}</span>); rest = rest.slice(dash[0].length) }
  if (rest.startsWith("#")) { out.push(<span key="c" className={C.comment}>{rest}</span>); return out }
  const kv = rest.match(/^([^\s:'"#][^:#]*?)(:)(\s+|$)(.*)$/)
  if (kv) {
    out.push(<span key="k" className={C.key}>{kv[1]}</span>, <span key="p">{kv[2]}{kv[3]}</span>)
    rest = kv[4]
  }
  if (rest) {
    const cm = rest.match(/^(.*?)(\s+#.*)$/)
    const v = cm && !/^['"]/.test(rest) ? cm[1] : rest
    out.push(<span key="v" className={valueClass(v)}>{v}</span>)
    if (cm && v !== rest) out.push(<span key="vc" className={C.comment}>{cm[2]}</span>)
  }
  return out
}

/** Lightweight code editor styled like the reference's Monaco YAML editor (no extra dependency). */
export function YamlEditor({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const [active, setActive] = useState(0)
  const [view, setView] = useState({ top: 0, height: 0, total: 1 })
  const lines = value.split("\n")
  const syncCaret = () => { const el = area.current; if (el) setActive(el.value.slice(0, el.selectionStart).split("\n").length - 1) }
  const syncView = () => { const el = scroller.current; if (el) setView({ top: el.scrollTop, height: el.clientHeight, total: el.scrollHeight }) }
  useLayoutEffect(() => {
    syncView()
    window.addEventListener("resize", syncView)
    return () => window.removeEventListener("resize", syncView)
  }, [])

  // Minimap: 2px per line; the slider marks the visible window.
  const MINI = 2
  const slider = { top: (view.top / Math.max(1, view.total)) * lines.length * MINI, height: Math.max(8, (view.height / Math.max(1, view.total)) * lines.length * MINI) }

  return (
    <div className="flex h-full w-full flex-col" role="region" aria-label="YAML code editor">
      <div className="relative min-h-0 flex-1" aria-label="YAML code input area">
        <div ref={scroller} onScroll={syncView} className="absolute inset-0 overflow-auto pr-[134px] text-[#000] dark:text-[#d4d4d4]">
          <div className="relative flex w-max min-w-full" style={{ ...font, paddingBottom: Math.max(0, view.height - LINE) }}>
            {/* Margin: line numbers + current-line marker. */}
            <div className="sticky left-0 z-10 w-[68px] shrink-0 bg-background select-none" aria-hidden>
              {lines.map((_, i) => (
                <div key={i} className={cn("w-[42px] pr-0 text-right", i === active ? "text-[#0b216f] dark:text-[#c6c6c6]" : "text-[#237893] dark:text-[#858585]")} style={{ height: LINE }}>{i + 1}</div>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 border-2 border-[#eeeeee] dark:border-[#282828]" style={{ top: active * LINE, height: LINE }} />
              <pre aria-hidden className="pointer-events-none relative m-0 whitespace-pre" style={font}>
                {lines.map((l, i) => <Fragment key={i}>{highlight(l)}{"\n"}</Fragment>)}
              </pre>
              <textarea
                ref={area}
                value={value}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                wrap="off"
                aria-label="Editor content"
                aria-invalid={!!error}
                onChange={(e) => { onChange(e.target.value); syncCaret() }}
                onSelect={syncCaret}
                onKeyDown={(e) => {
                  // Tab inserts two spaces like Monaco's YAML mode.
                  if (e.key !== "Tab") return
                  e.preventDefault()
                  const el = e.currentTarget
                  const s = el.selectionStart
                  const next = `${el.value.slice(0, s)}  ${el.value.slice(el.selectionEnd)}`
                  onChange(next)
                  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; syncCaret() })
                }}
                className="absolute inset-0 m-0 resize-none overflow-hidden border-0 bg-transparent p-0 whitespace-pre text-transparent caret-[#000] outline-none dark:caret-[#aeafad]"
                style={font}
              />
            </div>
          </div>
        </div>
        {/* Minimap (120px) + 14px scrollbar gutter, like Monaco. */}
        <div
          aria-hidden
          className="absolute top-0 right-[14px] bottom-0 w-[120px] cursor-pointer overflow-hidden bg-background"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const line = (e.clientY - r.top) / MINI
            scroller.current?.scrollTo({ top: line * LINE - view.height / 2 })
          }}
        >
          <pre className="m-0 origin-top-left whitespace-pre" style={{ ...font, fontSize: 14, lineHeight: `${LINE}px`, transform: `scale(${MINI / LINE})`, width: `${120 * (LINE / MINI)}px` }}>
            {lines.map((l, i) => <Fragment key={i}>{highlight(l)}{"\n"}</Fragment>)}
          </pre>
          <div className="absolute inset-x-0 bg-[#64646433] opacity-0 transition-opacity hover:opacity-100" style={{ top: slider.top, height: slider.height }} />
        </div>
      </div>
      {error && <p role="alert" className="shrink-0 border-t bg-destructive/5 px-4 py-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
