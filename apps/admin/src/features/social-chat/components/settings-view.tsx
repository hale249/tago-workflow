import { useEffect, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { ComboSelect, useTables, useWorkspaceUsers } from "@/features/tables"
import { LABEL_COLORS } from "../data/channels"
import { useSocialStore } from "../store/social.store"
import type { ChannelSettings } from "../types/social"

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
type Section = "table" | "assignees" | "templates" | "labels"

const SECTION = "rounded-xl border border-border bg-background p-4"
const H3 = "text-sm font-semibold text-foreground"
/** Reference "sm" button inside settings cards: h-7, px-2.5, 14px text, 14px icons. */
const BTN = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5"
const SUBLABEL = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const EMPTY = "text-[11px] italic text-muted-foreground"

/** Đặt lại / Lưu row at the bottom of each card (own draft per card, like the reference settings tab). */
function CardFooter({ dirty, onReset, onSave, className = "mt-2" }: { dirty: boolean; onReset: () => void; onSave: () => void; className?: string }) {
  return (
    <div className={`${className} flex items-center justify-end gap-2`}>
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" className={BTN} disabled={!dirty} onClick={onReset}>Đặt lại</Button>
        <Button size="sm" className={BTN} disabled={!dirty} onClick={onSave}>Lưu</Button>
      </div>
    </div>
  )
}

function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <Button size="sm" variant="outline" className={BTN} onClick={onClick}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />{children}</Button>
}

export function SettingsView() {
  const saved = useSocialStore((s) => s.settings)
  const saveSettings = useSocialStore((s) => s.saveSettings)
  const { data: tables = [] } = useTables()
  const { data: users = [] } = useWorkspaceUsers()
  const [draft, setDraft] = useState<ChannelSettings>(saved)
  useEffect(() => setDraft(saved), [saved])

  const pick = (k: Section): Partial<ChannelSettings> =>
    k === "table" ? { linkedTableId: draft.linkedTableId } : k === "assignees" ? { assigneeIds: draft.assigneeIds }
      : k === "templates" ? { templateGroups: draft.templateGroups, templates: draft.templates } : { labels: draft.labels }
  const dirty = (k: Section) => JSON.stringify(pick(k)) !== JSON.stringify({ ...pick(k), ...Object.fromEntries(Object.keys(pick(k)).map((x) => [x, saved[x as keyof ChannelSettings]])) })
  const reset = (k: Section) => setDraft({ ...draft, ...Object.fromEntries(Object.keys(pick(k)).map((x) => [x, saved[x as keyof ChannelSettings]])) })
  const save = (k: Section) => saveSettings({ ...saved, ...pick(k) })
  const card = (k: Section) => ({ dirty: dirty(k), onReset: () => reset(k), onSave: () => save(k) })
  const set = (patch: Partial<ChannelSettings>) => setDraft({ ...draft, ...patch })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <section className={SECTION}>
          <h3 className={`mb-1 ${H3}`}>Bảng liên kết</h3>
          <p className="mb-2 text-[11px] text-muted-foreground">Chọn một Active Table để bật liên kết bản ghi trong bảng chi tiết cuộc trò chuyện.</p>
          <ComboSelect value={draft.linkedTableId} clearable placeholder="Không có bảng liên kết" aria-label="Bảng liên kết"
            onChange={(v) => { set({ linkedTableId: v }); saveSettings({ ...saved, linkedTableId: v }) }}
            options={tables.map((t) => ({ value: t.id, text: t.name }))} />
        </section>

        <section className={SECTION}>
          <h3 className={`mb-2 ${H3}`}>Người được phân công</h3>
          <div className="max-h-72 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {users.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50">
                  <Checkbox className="size-3.5 [&_svg]:size-3" checked={draft.assigneeIds.includes(u.id)}
                    onCheckedChange={(on) => set({ assigneeIds: on ? [...draft.assigneeIds, u.id] : draft.assigneeIds.filter((x) => x !== u.id) })} />
                  <span className="truncate">{u.fullName}</span>
                </label>
              ))}
            </div>
          </div>
          <CardFooter {...card("assignees")} />
        </section>

        <section className={SECTION}>
          <h3 className={`mb-3 ${H3}`}>Mẫu tin nhắn</h3>
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className={SUBLABEL}>Nhóm</span>
              <AddButton onClick={() => set({ templateGroups: [...draft.templateGroups, { id: uid("tg"), name: "" }] })}>Thêm nhóm</AddButton>
            </div>
            <div className="flex flex-col gap-2">
              {!draft.templateGroups.length && <p className={EMPTY}>Chưa có nhóm.</p>}
              {draft.templateGroups.map((g, i) => (
                <div key={g.id} className="flex gap-2">
                  <Input value={g.name} placeholder="Tên nhóm" aria-label="Tên nhóm" onChange={(e) => set({ templateGroups: draft.templateGroups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá nhóm" onClick={() => set({ templateGroups: draft.templateGroups.filter((x) => x.id !== g.id), templates: draft.templates.map((t) => (t.groupId === g.id ? { ...t, groupId: undefined } : t)) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={SUBLABEL}>Mẫu</span>
              <AddButton onClick={() => set({ templates: [...draft.templates, { id: uid("tp"), name: "", content: "" }] })}>Thêm mẫu</AddButton>
            </div>
            <div className="flex flex-col gap-2">
              {!draft.templates.length && <p className={EMPTY}>Chưa có mẫu.</p>}
              {draft.templates.map((t, i) => {
                const put = (patch: Partial<typeof t>) => set({ templates: draft.templates.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
                return (
                  <div key={t.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input value={t.name} placeholder="Tên mẫu" aria-label="Tên mẫu" onChange={(e) => put({ name: e.target.value })} />
                      <div className="w-48 shrink-0">
                        <ComboSelect value={t.groupId ?? ""} onChange={(v) => put({ groupId: v || undefined })} clearable placeholder="Không nhóm" aria-label="Nhóm"
                          options={draft.templateGroups.map((g) => ({ value: g.id, text: g.name || "(chưa đặt tên)" }))} />
                      </div>
                      <Button size="icon-sm" variant="ghost" aria-label="Gỡ mẫu" onClick={() => set({ templates: draft.templates.filter((x) => x.id !== t.id) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
                    </div>
                    <textarea value={t.content} rows={3} placeholder="Nội dung mẫu" aria-label="Nội dung mẫu" onChange={(e) => put({ content: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset" />
                  </div>
                )
              })}
            </div>
          </div>
          <CardFooter className="mt-3" {...card("templates")} />
        </section>

        <section className={SECTION}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className={H3}>Nhãn</h3>
            <AddButton onClick={() => set({ labels: [...draft.labels, { id: uid("lb"), name: "", color: LABEL_COLORS[draft.labels.length % LABEL_COLORS.length]! }] })}>Thêm nhãn</AddButton>
          </div>
          <div className="flex flex-col gap-2">
            {!draft.labels.length && <p className={EMPTY}>Chưa định nghĩa nhãn nào.</p>}
            {draft.labels.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2">
                <input type="color" value={l.color} aria-label="Màu nhãn" onChange={(e) => set({ labels: draft.labels.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) })}
                  className="size-8 shrink-0 cursor-pointer rounded-md border bg-background p-1" />
                <Input value={l.name} placeholder="Tên nhãn" aria-label="Tên nhãn" onChange={(e) => set({ labels: draft.labels.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Button size="icon-sm" variant="ghost" aria-label="Xoá nhãn" onClick={() => set({ labels: draft.labels.filter((x) => x.id !== l.id) })}><HugeiconsIcon icon={Delete02Icon} /></Button>
              </div>
            ))}
          </div>
          <CardFooter {...card("labels")} />
        </section>
      </div>
    </div>
  )
}
