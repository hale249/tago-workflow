import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronLeft, ChevronRight, Code2, Copy, Download, GripVertical, Pause, PencilLine, Play, Redo2, Save, Search, Terminal, Undo2, Wand2, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { tablesListQuery } from "@/features/tables"
import { useEvent, useEvents, useSaveEvent } from "../api/workflow.queries"
import { WorkflowCanvas } from "../components/workflow-canvas"
import { GROUP_CHIP, GROUP_SUBTLE, NODE_TYPES, nodeType, TRIGGERS } from "../data/node-types"
import type { WorkflowEvent, WorkflowStep } from "../types/workflow"
import { exportWorkflowPng } from "../utils/export-png"
import { autoLayout } from "../utils/layout"
import { fromYaml, toYaml } from "../utils/yaml"
import { FORM_TYPES, NodeConfigForm } from "../components/node-config-form"

/** Draws a plain PNG snapshot of the graph (boxes + links) and downloads it. */
function NodePanel({ step, steps, edges, onChange, onClose }: { step: WorkflowStep; steps: WorkflowStep[]; edges: WorkflowEvent["edges"]; onChange: (s: WorkflowStep) => void; onClose: () => void }) {
  const N = nodeType(step.type)
  const [json, setJson] = useState(JSON.stringify(step.config, null, 2))
  const [jsonErr, setJsonErr] = useState("")
  const [idDraft, setIdDraft] = useState(step.id)
  const [renaming, setRenaming] = useState(false)
  useEffect(() => { setJson(JSON.stringify(step.config, null, 2)); setJsonErr(""); setIdDraft(step.id); setRenaming(false) }, [step.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const hasForm = FORM_TYPES.has(step.type)
  const idErr = !idDraft.trim() ? "ID node không được để trống" : idDraft.length > 128 ? "ID node tối đa 128 ký tự" : idDraft !== step.id && steps.some((s) => s.id === idDraft) ? "ID node đã tồn tại" : ""
  const commitId = () => { if (!idErr && idDraft !== step.id) onChange({ ...step, id: idDraft }); if (!idErr) setRenaming(false) }
  const branchLabel = (d: string) => {
    const key = edges?.find((e) => e.source === d && e.target === step.id)?.label
    const src = steps.find((s) => s.id === d)
    return key ? nodeType(src?.type ?? "").outputs?.find((o) => o.key === key)?.label ?? key : null
  }
  return (
    <aside className="flex w-[clamp(360px,32vw,500px)] shrink-0 flex-col border-l bg-background duration-200 animate-in slide-in-from-right-5">
      <div className="flex shrink-0 items-center gap-3 border-b p-4">
        <span className="rounded-lg p-2" style={{ backgroundColor: GROUP_SUBTLE[N.group], color: N.color }} aria-hidden><N.icon className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{N.label}</h3>
          <span className="mt-1 inline-flex h-[22px] items-center rounded-md border bg-background px-1.5 text-xs font-medium">{N.group === "Logic" ? "logic" : "action"}</span>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Đóng bảng" onClick={onClose}><X /></Button>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {N.description && <p className="text-xs text-muted-foreground">{N.description}</p>}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold">ID Node</p>
          {renaming ? (
            <div className="space-y-1">
              <Input autoFocus value={idDraft} className="font-mono text-xs" aria-label="ID Node" aria-invalid={!!idErr || undefined}
                onChange={(e) => setIdDraft(e.target.value)} onBlur={commitId} onKeyDown={(e) => { if (e.key === "Enter") commitId(); if (e.key === "Escape") { setIdDraft(step.id); setRenaming(false) } }} />
              {idErr && <p className="text-xs text-destructive">{idErr}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="flex-1 font-mono text-xs break-all text-muted-foreground">{step.id}</p>
              <Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground" title="Đổi ID" aria-label="Đổi ID" onClick={() => setRenaming(true)}><PencilLine /></Button>
              <Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground" title="Sao chép ID" aria-label="Sao chép ID" onClick={() => navigator.clipboard?.writeText(step.id)}><Copy /></Button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="node-name" className="block text-sm font-medium">Tên<span className="ml-1 text-destructive">*</span></label>
            <Input id="node-name" value={step.name} onChange={(e) => onChange({ ...step, name: e.target.value })} />
            <p className="text-xs text-muted-foreground">Định danh duy nhất cho bước này</p>
          </div>
          <NodeConfigForm step={step} steps={steps} onChange={(config) => { onChange({ ...step, config }); setJson(JSON.stringify(config, null, 2)) }} />
        </div>
        <details className="group rounded-md border" open={!hasForm}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium">
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />{hasForm ? "Nâng cao" : "Cấu hình (JSON)"}
          </summary>
          <div className="space-y-4 border-t p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Chạy sau</p>
              <div className="flex flex-wrap gap-1">
                {step.depends_on.map((d) => (
                  <span key={d} className="inline-flex h-[22px] items-center gap-1 rounded-md border px-1.5 font-mono text-[11px]">
                    {d}{branchLabel(d) && <span className="font-sans text-muted-foreground">· {branchLabel(d)}</span>}
                    <button type="button" aria-label={`Bỏ liên kết ${d}`} onClick={() => onChange({ ...step, depends_on: step.depends_on.filter((x) => x !== d) })}><X className="size-3" /></button>
                  </span>
                ))}
                {!step.depends_on.length && <span className="text-xs text-muted-foreground">Chưa nối — kéo từ chấm bên phải của node khác vào node này.</span>}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Cấu hình (JSON)</p>
              <textarea rows={10} value={json} spellCheck={false} aria-label="Cấu hình JSON" className="w-full rounded-md border border-input bg-muted/30 p-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring" onChange={(e) => {
                setJson(e.target.value)
                try { onChange({ ...step, config: JSON.parse(e.target.value || "{}") }); setJsonErr("") } catch { setJsonErr("JSON chưa hợp lệ nên chưa được lưu.") }
              }} />
              {jsonErr && <p className="text-xs text-destructive">{jsonErr}</p>}
              <p className="text-xs text-muted-foreground">Dùng {"{{ .workflowData.<trường> }}"} hoặc {"{{ .<id_bước>.<trường> }}"} để lấy dữ liệu bước trước.</p>
            </div>
          </div>
        </details>
      </div>
    </aside>
  )
}

export function EventEditorPage() {
  const { unitId = "", eventId = "" } = useParams()
  const navigate = useNavigate()
  const { data: saved } = useEvent(eventId)
  const { data: siblings = [] } = useEvents(unitId)
  const { data: tables = [] } = useQuery(tablesListQuery())
  const save = useSaveEvent()
  const [draft, setDraft] = useState<WorkflowEvent | null>(null)
  const [past, setPast] = useState<WorkflowEvent[]>([])
  const [future, setFuture] = useState<WorkflowEvent[]>([])
  const [mode, setMode] = useState<"visual" | "yaml">("visual")
  const [selected, setSelected] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [yamlText, setYamlText] = useState("")
  const [yamlErr, setYamlErr] = useState("")
  useEffect(() => { if (saved) { setDraft(saved); setPast([]); setFuture([]); setSelected(null) } }, [saved])

  const dirty = useMemo(() => !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  if (!draft) return <Skeleton className="h-full w-full rounded-lg" />

  /** Apply a change; `record` pushes the previous state onto the undo stack. */
  const apply = (raw: WorkflowEvent, record = true) => {
    // Branch labels only survive while the dependency they describe still exists.
    const next = raw.edges ? { ...raw, edges: raw.edges.filter((e) => raw.steps.find((s) => s.id === e.target)?.depends_on.includes(e.source)) } : raw
    if (record) { setPast((p) => [...p.slice(-49), draft]); setFuture([]) }
    setDraft(next)
  }
  /** Sets (or clears) the branch label of the source → target dependency. */
  const withBranch = (e: WorkflowEvent, source: string, target: string, label?: string): WorkflowEvent => {
    const rest = (e.edges ?? []).filter((x) => !(x.source === source && x.target === target))
    return { ...e, edges: label ? [...rest, { source, target, label }] : rest }
  }
  const undo = () => { const prev = past.at(-1); if (!prev) return; setPast(past.slice(0, -1)); setFuture([draft, ...future]); setDraft(prev) }
  const redo = () => { const nxt = future[0]; if (!nxt) return; setFuture(future.slice(1)); setPast([...past, draft]); setDraft(nxt) }
  const updateStep = (id: string, s: WorkflowStep) =>
    apply({
      ...draft,
      steps: draft.steps.map((x) => (x.id === id ? s : { ...x, depends_on: x.depends_on.map((d) => (d === id ? s.id : d)) })),
      edges: draft.edges?.map((e) => ({ ...e, source: e.source === id ? s.id : e.source, target: e.target === id ? s.id : e.target })),
    })
  const addStep = (type: string, pos?: { x: number; y: number }) => {
    const id = `${type}-${Date.now().toString(36)}`
    const after = selected ?? draft.steps.at(-1)?.id ?? "start-node"
    const base = pos ?? { x: (draft.steps.find((s) => s.id === after)?.position.x ?? 40) + 300, y: draft.steps.find((s) => s.id === after)?.position.y ?? 160 }
    apply({ ...draft, steps: [...draft.steps, { id, name: nodeType(type).label, type, config: {}, depends_on: pos ? [] : [after], position: base }] })
    setSelected(id)
  }
  /** "+" on an output port: new node wired after `from`. */
  const addAfter = (from: string, type: string, pos: { x: number; y: number }, handle?: string) => {
    const id = `${type}-${Date.now().toString(36)}`
    apply(withBranch({ ...draft, steps: [...draft.steps, { id, name: nodeType(type).label, type, config: {}, depends_on: [from], position: pos }] }, from, id, handle))
    setSelected(id)
  }
  const deleteStep = (id: string) => {
    apply({ ...draft, steps: draft.steps.filter((s) => s.id !== id).map((s) => ({ ...s, depends_on: s.depends_on.filter((d) => d !== id) })) })
    if (selected === id) setSelected(null)
  }
  const step = draft.steps.find((s) => s.id === selected)
  const T = TRIGGERS[draft.trigger.type]
  const triggerLabel = draft.trigger.type === "ACTIVE_TABLE" ? `${tables.find((t) => t.id === draft.trigger.params.tableId)?.name ?? "?"} · ${draft.trigger.params.action ?? ""}` : draft.trigger.params.expression ?? draft.trigger.params.path ?? draft.trigger.params.formId ?? ""
  const palette = NODE_TYPES.filter((n) => `${n.label} ${n.description}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <div className="no-scrollbar flex shrink-0 items-center justify-between gap-2 overflow-x-auto border-b px-4 py-3">
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 max-w-60 gap-2 px-3">
                <T.icon className="size-4 shrink-0" /><span className="truncate">{draft.name}</span>
                <span className="inline-flex h-[22px] items-center rounded-md border bg-muted px-1.5 text-xs text-muted-foreground" aria-hidden>{siblings.length}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild><Link to={`/workflow-units/${unitId}`}><ChevronLeft />Về danh sách sự kiện</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              {siblings.map((s) => <DropdownMenuItem key={s.id} onSelect={() => navigate(`/workflow-units/${unitId}/events/${s.id}/edit`)}>{s.name}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <span
            title={draft.active ? "Đang chạy" : "Tạm dừng"}
            className={cn("inline-flex h-[22px] items-center rounded-md border px-1.5", draft.active ? "border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : "border-amber-500/20 bg-amber-50 text-amber-600 dark:bg-amber-500/10")}
          >
            {draft.active ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5" />}
          </span>
          <span className="h-6 w-px shrink-0 bg-border/80" aria-hidden />
          <div role="tablist" aria-label="Chế độ soạn thảo" className="grid h-10 w-[200px] grid-cols-2 items-center rounded-md bg-muted p-1 text-muted-foreground">
            {([["visual", "Trực quan", null], ["yaml", "YAML", Code2]] as const).map(([m, label, Icon]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { if (m === "yaml") { setYamlText(toYaml(draft)); setYamlErr("") } setMode(m) }} className={cn("inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all", mode === m ? "bg-background text-brand shadow-sm" : "hover:text-foreground")}>{Icon && <Icon className="size-3.5" />}{label}</button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Điều khiển lịch sử">
            <Button size="icon-sm" variant="ghost" aria-label="Hoàn tác" disabled={!past.length} onClick={undo}><Undo2 /></Button>
            <Button size="icon-sm" variant="ghost" aria-label="Làm lại" disabled={!future.length} onClick={redo}><Redo2 /></Button>
          </div>
          <span className="h-6 w-px shrink-0 bg-border/80" aria-hidden />
          <Button size="sm" variant="outline" className="h-8" onClick={() => apply(autoLayout(draft))}><Wand2 />Tự động sắp xếp</Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => exportWorkflowPng(draft, triggerLabel)}><Download />Xuất PNG</Button>
          <Button asChild size="icon-sm" variant="ghost" title="Console" aria-label="Console"><Link to={`/workflow-units/${unitId}/events/${eventId}/console`}><Terminal /></Link></Button>
          <span className="h-6 w-px shrink-0 bg-border/80" aria-hidden />
          <span role="status" aria-live="polite" className={cn("max-w-[6.5rem] text-sm leading-tight", dirty ? "text-amber-600" : "text-muted-foreground")}>{save.isPending ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</span>
          <Button size="sm" className="h-8" disabled={!dirty || save.isPending} onClick={() => save.mutate(draft)}><Save />Lưu Workflow</Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r bg-background max-md:hidden">
          <div className="space-y-3 p-4 pb-2">
            <p className="px-1 text-sm font-semibold">Bảng Node</p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm" className="h-9 border-0 bg-muted/50 pl-9" />
            </div>
          </div>
          <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pt-2 pb-4">
            {(["Logic", "Actions"] as const).map((g) => {
              const list = palette.filter((n) => n.group === g)
              if (!list.length) return null
              return (
                <div key={g} className="space-y-1">
                  <p className="px-2 pb-1 text-sm text-muted-foreground">{g}</p>
                  <div className="space-y-0.5">
                    {list.map((n) => (
                      <button key={n.type} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("application/x-node-type", n.type)} onClick={() => addStep(n.type)}
                        className="group flex w-full cursor-grab items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-left transition-all hover:border-border/40 hover:bg-accent active:cursor-grabbing" title="Bấm để thêm sau node đang chọn, hoặc kéo thả vào canvas">
                        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", GROUP_CHIP[n.group])}><n.icon className="size-4" /></span>
                        <span className="flex min-w-0 flex-1 flex-col items-start">
                          <span className="text-sm leading-tight font-medium">{n.label}</span>
                          <span className="line-clamp-1 w-full text-[11px] text-muted-foreground/80">{n.description}</span>
                        </span>
                        <GripVertical className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {!palette.length && <p className="px-2 text-xs text-muted-foreground">Không tìm thấy node nào phù hợp.</p>}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {mode === "visual" ? (
            <WorkflowCanvas
              event={draft}
              triggerLabel={triggerLabel}
              selected={selected}
              onSelect={setSelected}
              onMove={(id, pos, commit) => {
                const next = id === "start-node" ? { ...draft, startPosition: pos } : { ...draft, steps: draft.steps.map((s) => (s.id === id ? { ...s, position: pos } : s)) }
                apply(next, commit)
              }}
              onConnect={(from, to, handle) => {
                const t = draft.steps.find((s) => s.id === to)
                if (!t) return
                const steps = t.depends_on.includes(from) ? draft.steps : draft.steps.map((s) => (s.id === to ? { ...s, depends_on: [...s.depends_on, from] } : s))
                apply(withBranch({ ...draft, steps }, from, to, handle))
              }}
              onDropType={(type, pos) => addStep(type, pos)}
              onAddAfter={addAfter}
              onDelete={deleteStep}
              onAutoLayout={() => apply(autoLayout(draft))}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
                <span className={cn("flex-1", yamlErr ? "text-destructive" : "text-muted-foreground")}>{yamlErr || "Sửa YAML rồi bấm Áp dụng để cập nhật sơ đồ."}</span>
                <Button size="xs" variant="ghost" onClick={() => { setYamlText(toYaml(draft)); setYamlErr("") }}>Hoàn tác YAML</Button>
                <Button size="xs" disabled={yamlText === toYaml(draft)} onClick={() => {
                  try { apply(fromYaml(yamlText, draft)); setYamlErr("") } catch (err) { setYamlErr((err as Error).message) }
                }}>Áp dụng</Button>
              </div>
              <textarea spellCheck={false} value={yamlText} onChange={(e) => setYamlText(e.target.value)} className="flex-1 resize-none bg-muted/30 p-4 font-mono text-xs leading-5 outline-none" aria-label="YAML" />
            </div>
          )}
        </div>

        {step && mode === "visual" && (
          <NodePanel
            step={step}
            steps={draft.steps}
            edges={draft.edges}
            onChange={(s) => { updateStep(step.id, s); if (s.id !== step.id) setSelected(s.id) }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </section>
  )
}
