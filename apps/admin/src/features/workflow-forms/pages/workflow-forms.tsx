import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, File02Icon, MoreVerticalIcon, PencilEdit01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { useDeleteForm, useForms } from "../api/forms.queries"
import { CreateFormDialog } from "../components/create-form-dialog"
import { FORM_TYPES } from "../data/templates"
import type { FormType } from "../types/form"

const day = new Intl.DateTimeFormat("vi-VN")
const H1_STYLE = {
  fontSize: "var(--font-heading-h1-size)",
  lineHeight: "var(--font-heading-h1-line-height)",
  fontWeight: "var(--font-heading-h1-weight)",
  letterSpacing: "var(--font-heading-h1-letter-spacing)",
  fontFamily: "var(--font-heading-h1-family)",
} as const

export function WorkflowFormsPage() {
  const navigate = useNavigate()
  const { data: forms = [], isLoading } = useForms()
  const del = useDeleteForm()
  const [q, setQ] = useState("")
  const [type, setType] = useState<FormType | "">("")
  const [open, setOpen] = useState(false)
  const s = q.trim().toLowerCase()
  const list = forms.filter((f) => (!type || f.formType === type) && (!s || `${f.name} ${f.description}`.toLowerCase().includes(s)))

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-[var(--space-300)]">
      <div className="flex flex-col items-stretch justify-start gap-[var(--space-200)]">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0"><h1 className="text-foreground" style={H1_STYLE}>Biểu mẫu</h1><p className="text-[13px] text-muted-foreground">Quản lý biểu mẫu workflow</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Tìm kiếm form theo tên hoặc mô tả..." placeholder="Tìm kiếm form theo tên hoặc mô tả..." className="h-8 py-1.5 pl-8" />
            </div>
            <Button size="sm" className="h-7 gap-1.5 px-2.5 shadow-xs has-[>svg]:px-2" onClick={() => setOpen(true)}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />Tạo Form</Button>
          </div>
        </header>
        {forms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">Loại form:</span>
            {[{ type: "" as const, label: "Tất cả" }, ...FORM_TYPES].map((t) => (
              <button key={t.type} type="button" onClick={() => setType(t.type)} className={cn("h-7 rounded-md px-2.5 text-sm", type === t.type ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-muted")}>{t.label}</button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-[var(--space-200)]">
          {isLoading && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}
          {!isLoading && !forms.length && (
            <div className="flex flex-col items-center justify-center rounded-lg border px-6 py-14 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"><HugeiconsIcon icon={File02Icon} className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">Chưa có form nào</p>
              <div className="mt-4"><Button size="sm" className="h-7 gap-1.5 px-2.5 shadow-xs has-[>svg]:px-2" onClick={() => setOpen(true)}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />Tạo form đầu tiên</Button></div>
            </div>
          )}
          {!isLoading && forms.length > 0 && !list.length && <p className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy form nào</p>}
          {list.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((f) => {
                const T = FORM_TYPES.find((t) => t.type === f.formType)!
                return (
                  <div key={f.id} className="group relative rounded-lg border p-4 hover:border-brand/40">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><HugeiconsIcon icon={T.icon} className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <Link to={`/workflow-forms/${f.id}`} className="block truncate font-medium hover:underline">{f.name}</Link>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{f.description || "Không có mô tả"}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Mở menu"><HugeiconsIcon icon={MoreVerticalIcon} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/workflow-forms/${f.id}`)}>Xem chi tiết</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => navigate(`/workflow-forms/${f.id}`)}><HugeiconsIcon icon={PencilEdit01Icon} />Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá form “${f.name}”?`) && del.mutate(f.id)}><HugeiconsIcon icon={Delete02Icon} />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded border px-1.5">{T.label}</span>{f.config.fields.length} field · cập nhật {day.format(new Date(f.updatedAt))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <CreateFormDialog open={open} onOpenChange={setOpen} />
    </section>
  )
}
