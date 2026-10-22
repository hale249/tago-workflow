import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, PencilEdit01Icon, TagsIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { SearchBox } from "@workspace/ui/components/search-box"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { SMALL_BTN, TABLE_CARD, TD, TH, TR } from "@workspace/ui/lib/styles"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteLabel, useLabels, type Label, type LabelType } from "@/features/teams"
import { LABEL_TYPES, labelTypeName } from "../data/labels"
import { LabelFormDialog } from "./label-form-dialog"
import { SectionHeader } from "./settings-ui"

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")

/** Notification / role / team labels — role & team labels are the ones offered in the teams dialogs. */
export function LabelsTab() {
  const [type, setType] = useState<LabelType>("notification")
  const { data: labels = [], isLoading } = useLabels(type)
  const del = useDeleteLabel()
  const [q, setQ] = useState("")
  const [form, setForm] = useState<{ open: boolean; label: Label | null }>({ open: false, label: null })
  const [deleting, setDeleting] = useState<Label | null>(null)
  const s = q.trim().toLowerCase()
  const list = labels.filter((l) => !s || l.name.toLowerCase().includes(s))

  return (
    <div className="space-y-6">
      <SectionHeader title="Quản lý nhãn" description="Quản lý các nhãn theo ngữ cảnh sử dụng để phục vụ lọc và phân loại dữ liệu.">
        <div className="flex items-center gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Tìm kiếm nhãn..." size="lg" />
          <Button size="sm" className={cn(SMALL_BTN, "shrink-0 shadow-xs [&_svg:not([class*='size-'])]:size-3.5")} onClick={() => setForm({ open: true, label: null })}><HugeiconsIcon icon={Add01Icon} className="mr-2 max-sm:hidden" />Thêm nhãn</Button>
        </div>
      </SectionHeader>

      <div role="tablist" aria-orientation="horizontal" aria-label="Loại nhãn" className="inline-flex h-auto items-center justify-start rounded-lg bg-muted/40 p-1 text-muted-foreground">
        {LABEL_TYPES.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={type === t.id} data-state={type === t.id ? "active" : "inactive"} onClick={() => setType(t.id)}
            className={cn("inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", type === t.id && "bg-primary-subtle text-primary-subtle-foreground hover:text-primary-subtle-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-32" />}
      {!isLoading && !labels.length && <EmptyState icon={TagsIcon} title="Chưa có nhãn" description={`Chưa có nhãn nào trong nhóm "${labelTypeName(type)}". Hãy tạo nhãn đầu tiên.`} />}
      {!isLoading && labels.length > 0 && (
        <div className={TABLE_CARD}>
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className={TR}>
                  <th className={TH}>Tên nhãn</th>
                  <th className={cn(TH, "hidden md:table-cell")}>Ngày tạo</th>
                  <th className={cn(TH, "hidden md:table-cell")}>Ngày cập nhật</th>
                  <th className={cn(TH, "text-right")}>Hành động</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {list.map((l) => (
                  <tr key={l.id} className={TR}>
                    <td className={cn(TD, "font-medium")}>{l.name}</td>
                    <td className={cn(TD, "hidden text-muted-foreground tabular-nums md:table-cell")}>{fmt(l.createdAt)}</td>
                    <td className={cn(TD, "hidden text-muted-foreground tabular-nums md:table-cell")}>{fmt(l.updatedAt)}</td>
                    <td className={cn(TD, "text-right")}>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className={cn(SMALL_BTN, "hover:bg-accent/50")} onClick={() => setForm({ open: true, label: l })}><HugeiconsIcon icon={PencilEdit01Icon} className="size-4" /><span className="sr-only">Cập nhật nhãn {l.name}</span></Button>
                        <Button variant="ghost" size="sm" className={cn(SMALL_BTN, "text-destructive hover:bg-accent/50 hover:text-destructive")} onClick={() => setDeleting(l)}><HugeiconsIcon icon={Delete02Icon} className="size-4" /><span className="sr-only">Xóa nhãn {l.name}</span></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy nhãn nào</p>}
          </div>
        </div>
      )}

      <LabelFormDialog open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} label={form.label} defaultType={type} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa nhãn"
        description={deleting && `Nhãn “${deleting.name}” sẽ bị xóa và gỡ khỏi các mục đang dùng. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa nhãn"
        pending={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
