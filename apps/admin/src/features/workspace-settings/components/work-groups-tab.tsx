import { useEffect, useState, type DragEvent, type KeyboardEvent } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowRight01Icon, Delete02Icon, DragDropVerticalIcon, FolderKanbanIcon, MoreVerticalIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { TableIcon, useDeleteWorkGroup, useReorderTables, useReorderWorkGroups, useTables, useWorkGroups, type ActiveTable, type WorkGroup } from "@/features/tables"
import { ConfirmDialog, SMALL_BTN } from "@/features/teams"
import { SearchBox, SectionHeader } from "./settings-ui"
import { WorkGroupFormDialog } from "./work-group-form-dialog"

const HINT = "Kéo biểu tượng ⋮⋮ để đổi thứ tự nhóm và bảng. Thứ tự áp dụng cho cả workspace."
const HANDLE = "-ml-1 flex h-7 w-5 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
const ROW = "group flex items-center gap-3 px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset cursor-pointer hover:bg-muted/50"

const move = (ids: string[], from: string, to: string) => {
  const next = ids.filter((x) => x !== from)
  next.splice(ids.indexOf(to), 0, from)
  return next
}
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()

type Drag = { id: string; groupId?: string } | null

/** Drag handle: HTML5 drag + ArrowUp/ArrowDown when focused (keyboard reorder). */
function Handle({ label, disabled, onDragStart, onDragEnd, onStep }: { label: string; disabled: boolean; onDragStart: () => void; onDragEnd: () => void; onStep: (dir: -1 | 1) => void }) {
  return (
    <button type="button" className={HANDLE} aria-label={`Kéo để sắp xếp ${label}`} aria-roledescription="sortable" aria-disabled={disabled || undefined} title={disabled ? "Xoá tìm kiếm để sắp xếp" : undefined}
      draggable={!disabled}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e: DragEvent) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", label); onDragStart() }}
      onDragEnd={onDragEnd}
      onKeyDown={(e: KeyboardEvent) => {
        if (disabled || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return
        e.preventDefault()
        e.stopPropagation()
        onStep(e.key === "ArrowUp" ? -1 : 1)
      }}>
      <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
    </button>
  )
}

export function WorkGroupsTab() {
  const navigate = useNavigate()
  const { data: groups = [], isLoading } = useWorkGroups()
  const { data: tables = [] } = useTables()
  const reorderGroups = useReorderWorkGroups()
  const reorderTables = useReorderTables()
  const del = useDeleteWorkGroup()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [drag, setDrag] = useState<Drag>(null)
  const [over, setOver] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  // `group: null` = create; the target is kept while closing so the title does not flip mid-animation.
  const [form, setForm] = useState<{ open: boolean; group: WorkGroup | null }>({ open: false, group: null })
  const [deleting, setDeleting] = useState<WorkGroup | null>(null)
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 2500); return () => clearTimeout(t) }, [notice])

  const s = fold(q.trim())
  const tablesOf = (gid: string) => tables.filter((t) => t.workGroupId === gid)
  const shown = groups
    .map((g) => {
      const all = tablesOf(g.id)
      const hit = !s || fold(g.name).includes(s)
      return { group: g, all, tables: hit ? all : all.filter((t) => fold(t.name).includes(s)), hit }
    })
    .filter((x) => x.hit || x.tables.length)
  const locked = !!s
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const saved = { onSuccess: () => setNotice({ text: "Đã lưu thứ tự" }) }

  const moveGroup = (from: string, to: string) => {
    if (from === to) return
    reorderGroups.mutate(move(groups.map((g) => g.id), from, to), { ...saved, onError: () => setNotice({ text: "Không lưu được thứ tự nhóm công việc", error: true }) })
  }
  const moveTable = (gid: string, from: string, to: string) => {
    if (from === to) return
    reorderTables.mutate({ workGroupId: gid, ids: move(tablesOf(gid).map((t) => t.id), from, to) }, { ...saved, onError: () => setNotice({ text: "Không lưu được thứ tự bảng. Bạn cần quyền cập nhật trên tất cả bảng trong nhóm.", error: true }) })
  }
  const step = <T extends { id: string }>(list: T[], id: string, dir: -1 | 1, fn: (from: string, to: string) => void) => {
    const to = list[list.findIndex((x) => x.id === id) + dir]
    if (to) fn(id, to.id)
  }
  const dropProps = (id: string, accepts: (d: NonNullable<Drag>) => boolean, onDrop: (from: string) => void) => ({
    onDragOver: (e: DragEvent) => { if (drag && accepts(drag)) { e.preventDefault(); e.stopPropagation(); setOver(id) } },
    onDrop: (e: DragEvent) => { if (drag && accepts(drag)) { e.preventDefault(); e.stopPropagation(); onDrop(drag.id) } setDrag(null); setOver(null) },
  })
  const endDrag = () => { setDrag(null); setOver(null) }

  return (
    <div className="space-y-6">
      <SectionHeader title="Nhóm công việc" description="Nhóm các bảng theo danh mục để dễ quản lý">
        <div className="flex items-center gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Tìm kiếm..." />
          <Button size="sm" className={cn(SMALL_BTN, "shrink-0 shadow-xs [&_svg:not([class*='size-'])]:size-3.5")} onClick={() => setForm({ open: true, group: null })}><HugeiconsIcon icon={Add01Icon} />Tạo mới</Button>
        </div>
      </SectionHeader>

      {isLoading ? <Skeleton className="h-40" /> : (
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          <div role="status" className={cn("flex h-9 items-center px-3 text-xs tabular-nums", notice?.error ? "text-destructive" : "text-muted-foreground")}>
            {notice?.text ?? (locked ? "Xoá tìm kiếm để sắp xếp" : HINT)}
          </div>
          {shown.map(({ group: g, all, tables: list }) => {
            const expanded = open.has(g.id) || (!!s && list.length > 0 && !fold(g.name).includes(s))
            return (
              <div key={g.id} className={cn("bg-card", drag?.id === g.id && "opacity-50", over === g.id && drag?.id !== g.id && "shadow-[inset_0_2px_0_var(--brand)]")}
                {...dropProps(g.id, (d) => !d.groupId, (from) => moveGroup(from, g.id))}>
                <div role="button" tabIndex={0} aria-expanded={expanded} className={cn(ROW, "min-h-14")} onClick={() => toggle(g.id)} onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(g.id))}>
                  <Handle label={g.name} disabled={locked} onDragStart={() => setDrag({ id: g.id })} onDragEnd={endDrag} onStep={(d) => step(groups, g.id, d, moveGroup)} />
                  <button type="button" aria-expanded={expanded} aria-label={`Hiện hoặc ẩn bảng của ${g.name}`} onClick={(e) => { e.stopPropagation(); toggle(g.id) }}
                    className="-mx-1 flex h-7 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-4 transition-transform", expanded && "rotate-90")} />
                  </button>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-green-subtle text-accent-green"><HugeiconsIcon icon={FolderKanbanIcon} className="size-4" /></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-foreground">{g.name}</div></div>
                  <div className="hidden shrink-0 items-center gap-3 text-[13px] text-muted-foreground sm:flex"><span className="tabular-nums">{all.length} bảng</span></div>
                  <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 has-[[data-state=open]]:opacity-100" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="size-7 text-muted-foreground hover:bg-accent/50" aria-label="Mở menu"><HugeiconsIcon icon={MoreVerticalIcon} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setForm({ open: true, group: g })}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" disabled={all.length > 0} onSelect={() => setDeleting(g)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {expanded && (
                  <div className="divide-y border-t bg-muted/20">
                    {!list.length && <p className="py-3 pr-3 pl-[4.25rem] text-[13px] text-muted-foreground">Nhóm này chưa có bảng nào.</p>}
                    {list.map((t: ActiveTable) => (
                      <div key={t.id} role="button" tabIndex={0} onClick={() => navigate(`/tables/${t.id}`)} onKeyDown={(e) => e.target === e.currentTarget && e.key === "Enter" && navigate(`/tables/${t.id}`)}
                        className={cn(ROW, "min-h-11 pl-10", drag?.id === t.id && "opacity-50", over === t.id && drag?.id !== t.id && "shadow-[inset_0_2px_0_var(--brand)]")}
                        {...dropProps(t.id, (d) => d.groupId === g.id, (from) => moveTable(g.id, from, t.id))}>
                        <Handle label={t.name} disabled={locked} onDragStart={() => setDrag({ id: t.id, groupId: g.id })} onDragEnd={endDrag} onStep={(d) => step(all, t.id, d, (a, b) => moveTable(g.id, a, b))} />
                        <TableIcon icon={t.icon} color={t.iconColor} plain />
                        <div className="min-w-0 flex-1 truncate text-sm text-foreground">{t.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {!shown.length && <p className="py-10 text-center text-sm text-muted-foreground">{groups.length ? "Không tìm thấy kết quả" : "Chưa có nhóm công việc nào"}</p>}
        </div>
      )}

      <WorkGroupFormDialog open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} group={form.group} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa nhóm công việc?"
        description={deleting && `Nhóm công việc “${deleting.name}” sẽ bị xóa. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        pending={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
