import { useEffect, useState, type ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { ComboSelect, useTables, useWorkspaceUsers } from "@/features/tables"
import { LABEL_COLORS } from "../data/channels"
import { useSocialStore } from "../store/social.store"
import type { ChannelSettings } from "../types/social"

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
type Section = "table" | "assignees" | "templates" | "labels"

/** Card with its own draft → Đặt lại / Lưu, like each block on the reference settings tab. */
function SettingsCard({ title, description, action, dirty, onReset, onSave, autoSave, children }: {
  title: string; description?: string; action?: ReactNode; dirty: boolean; onReset: () => void; onSave: () => void; autoSave?: boolean; children: ReactNode
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
      {!autoSave && (
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={!dirty} onClick={onReset}>Đặt lại</Button>
          <Button size="sm" disabled={!dirty} onClick={onSave}>Lưu</Button>
        </div>
      )}
    </section>
  )
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
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1024px] space-y-3 px-4 py-6">
        <p className="text-sm text-muted-foreground">Cài đặt dùng chung cho mọi kênh trong hộp thư (Facebook, Instagram, WhatsApp, Zalo OA).</p>
        <SettingsCard title="Bảng liên kết" description="Chọn một Active Table để bật liên kết bản ghi trong bảng chi tiết cuộc trò chuyện." autoSave {...card("table")}>
          <ComboSelect value={draft.linkedTableId} clearable placeholder="Không có bảng liên kết" aria-label="Bảng liên kết"
            onChange={(v) => { set({ linkedTableId: v }); saveSettings({ ...saved, linkedTableId: v }) }}
            options={tables.map((t) => ({ value: t.id, text: t.name }))} />
        </SettingsCard>

        <SettingsCard title="Người được phân công" {...card("assignees")}>
          <div className="space-y-2">
            {users.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2 px-2 text-sm">
                <Checkbox checked={draft.assigneeIds.includes(u.id)}
                  onCheckedChange={(on) => set({ assigneeIds: on ? [...draft.assigneeIds, u.id] : draft.assigneeIds.filter((x) => x !== u.id) })} />
                {u.fullName}
              </label>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Mẫu tin nhắn" {...card("templates")}>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">NHÓM</p>
                <Button size="sm" variant="outline" className="h-7" onClick={() => set({ templateGroups: [...draft.templateGroups, { id: uid("tg"), name: "" }] })}><Plus />Thêm nhóm</Button>
              </div>
              {!draft.templateGroups.length && <p className="text-xs text-muted-foreground italic">Chưa có nhóm.</p>}
              <div className="space-y-2">
                {draft.templateGroups.map((g, i) => (
                  <div key={g.id} className="flex gap-2">
                    <Input value={g.name} placeholder="Tên nhóm" aria-label="Tên nhóm" onChange={(e) => set({ templateGroups: draft.templateGroups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <Button size="icon-sm" variant="ghost" aria-label="Xoá nhóm" onClick={() => set({ templateGroups: draft.templateGroups.filter((x) => x.id !== g.id), templates: draft.templates.map((t) => (t.groupId === g.id ? { ...t, groupId: undefined } : t)) })}><Trash2 /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">MẪU</p>
                <Button size="sm" variant="outline" className="h-7" onClick={() => set({ templates: [...draft.templates, { id: uid("tp"), name: "", content: "" }] })}><Plus />Thêm mẫu</Button>
              </div>
              {!draft.templates.length && <p className="text-xs text-muted-foreground italic">Chưa có mẫu.</p>}
              <div className="space-y-3">
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
                        <Button size="icon-sm" variant="ghost" aria-label="Gỡ mẫu" onClick={() => set({ templates: draft.templates.filter((x) => x.id !== t.id) })}><Trash2 /></Button>
                      </div>
                      <textarea value={t.content} rows={3} placeholder="Nội dung mẫu" aria-label="Nội dung mẫu" onChange={(e) => put({ content: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Nhãn" {...card("labels")}
          action={<Button size="sm" variant="outline" className="h-7" onClick={() => set({ labels: [...draft.labels, { id: uid("lb"), name: "", color: LABEL_COLORS[draft.labels.length % LABEL_COLORS.length]! }] })}><Plus />Thêm nhãn</Button>}>
          {!draft.labels.length && <p className="text-xs text-muted-foreground italic">Chưa định nghĩa nhãn nào.</p>}
          <div className="space-y-2">
            {draft.labels.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2">
                <input type="color" value={l.color} aria-label="Màu nhãn" onChange={(e) => set({ labels: draft.labels.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) })}
                  className="size-8 shrink-0 cursor-pointer rounded-md border bg-background p-1" />
                <Input value={l.name} placeholder="Tên nhãn" aria-label="Tên nhãn" onChange={(e) => set({ labels: draft.labels.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Button size="icon-sm" variant="ghost" aria-label="Xoá nhãn" onClick={() => set({ labels: draft.labels.filter((x) => x.id !== l.id) })}><Trash2 /></Button>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}
