import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { FileText, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"

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
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-semibold">Biểu mẫu</h1><p className="text-sm text-muted-foreground">Quản lý biểu mẫu workflow</p></div>
        <Button onClick={() => setOpen(true)}><Plus />Tạo Form</Button>
      </header>
      {forms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <div className="relative w-full max-w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm form theo tên hoặc mô tả..." className="h-9 pl-8" />
          </div>
          <span className="text-xs text-muted-foreground">Loại form:</span>
          {[{ type: "" as const, label: "Tất cả" }, ...FORM_TYPES].map((t) => (
            <button key={t.type} type="button" onClick={() => setType(t.type)} className={cn("h-8 rounded-md px-2.5 text-sm", type === t.type ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-muted")}>{t.label}</button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}
        {!isLoading && !forms.length && (
          <div className="grid place-items-center gap-3 rounded-lg border border-dashed py-20 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><FileText className="size-6" /></span>
            <p className="text-sm text-muted-foreground">Chưa có form nào</p>
            <Button variant="outline" onClick={() => setOpen(true)}><Plus />Tạo form đầu tiên</Button>
          </div>
        )}
        {!isLoading && forms.length > 0 && !list.length && <p className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy form nào</p>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((f) => {
            const T = FORM_TYPES.find((t) => t.type === f.formType)!
            return (
              <div key={f.id} className="group relative rounded-lg border p-4 hover:border-brand/40">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><T.icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/workflow-forms/${f.id}`} className="block truncate font-medium hover:underline">{f.name}</Link>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{f.description || "Không có mô tả"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Mở menu"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => navigate(`/workflow-forms/${f.id}`)}>Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/workflow-forms/${f.id}`)}><Pencil />Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => window.confirm(`Xoá form “${f.name}”?`) && del.mutate(f.id)}><Trash2 />Xóa</DropdownMenuItem>
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
      </div>
      <CreateFormDialog open={open} onOpenChange={setOpen} />
    </section>
  )
}
