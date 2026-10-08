import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { ChevronLeft } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ApiError, autoInitItems } from "../api/tables.api"
import { useCreateRecord, useRecord, useTable, useUpdateRecord, useWorkspaceUsers } from "../api/tables.queries"
import { FieldInput } from "../components/field-input"
import { FormRow } from "../components/form-controls"
import { ItemsEditor } from "../components/items-editor"
import type { RecordData, RecordItem } from "../types/table"
import { emptyValue, pinnedSumsOf, uid, validateRecord } from "../utils/fields"

function parseInit(raw: string | null): RecordData {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === "object" ? (v as RecordData) : {}
  } catch {
    return {}
  }
}

/** Full-page create / edit form (`/records/new`, `/records/:recordId/edit`). */
export function RecordFormPage() {
  const { tableId = "", recordId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const editing = !!recordId
  const { data: table } = useTable(tableId)
  const { data: record } = useRecord(tableId, recordId ?? "")
  const { data: users = [] } = useWorkspaceUsers()
  const create = useCreateRecord(tableId)
  const update = useUpdateRecord(tableId)
  const [values, setValues] = useState<RecordData | null>(null)
  const [items, setItems] = useState<RecordItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!table || values || (editing && !record)) return
    const base: RecordData = {}
    for (const f of table.config.fields) base[f.name] = emptyValue(f)
    setValues({ ...base, ...(editing ? record!.record : parseInit(params.get("init"))) })
    const blankItem = () => {
      const row: RecordItem = { id: uid() }
      for (const f of table.config.items.fields) row[f.name] = emptyValue(f)
      return row
    }
    setItems(editing ? record!.items ?? [] : table.config.items.enabled ? [blankItem()] : [])
  }, [table, record, editing, params, values])

  if (!table || !values) return <Skeleton className="h-full w-full rounded-lg" />

  const ai = table.config.items.enabled ? table.config.items.autoInit : undefined
  const autoNote = ai?.enabled && values[ai.triggerField] ? "Danh sách được khởi tạo từ bản ghi ở trường kích hoạt — có thể chỉnh sửa trước khi lưu." : ""
  const sumTargets = new Set(table.config.items.enabled ? table.config.items.sums.map((s) => s.sumField) : [])
  const fields = table.config.fields.filter((f) => !sumTargets.has(f.name))
  const pending = create.isPending || update.isPending
  const back = editing ? `/tables/${table.id}/records/${recordId}` : `/tables/${table.id}`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const local = validateRecord(table.config.fields, values)
    setErrors(local)
    if (Object.keys(local).length) return
    const lineItems = table.config.items.enabled ? items : undefined
    try {
      const saved = editing
        ? await update.mutateAsync({ id: recordId!, patch: values, items: lineItems })
        : await create.mutateAsync({ data: values, items: lineItems })
      navigate(`/tables/${table.id}/records/${saved.id}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setFormError(Object.keys(err.fieldErrors).length ? "Vui lòng kiểm tra các trường được đánh dấu." : err.message)
      } else setFormError("Có lỗi xảy ra, vui lòng thử lại")
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
      {/* Reference: narrow column for plain forms, wide one when the table has line items. */}
      <div className={cn("mx-auto flex flex-col gap-4 p-3 sm:p-6", table.config.items.enabled ? "max-w-6xl" : "max-w-3xl")}>
        <header className="flex items-center gap-3 py-2">
          <Button asChild size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="Quay lại"><Link to={back}><ChevronLeft /></Link></Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{editing ? "Cập nhật bản ghi" : "Tạo bản ghi mới"}</h1>
            <p className="text-sm text-muted-foreground">
              {editing ? <>Chỉnh sửa bản ghi trong <b className="font-semibold text-foreground">{table.name}</b></> : <>Điền vào các trường bên dưới để tạo bản ghi mới trong <b className="font-semibold text-foreground">{table.name}</b></>}
            </p>
          </div>
        </header>
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form id="record-page-form" onSubmit={submit} className="p-3 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
            {fields.map((f) => (
              <FormRow key={f.name} label={f.label} required={f.required} error={errors[f.name]} className={f.type === "RICH_TEXT" || f.type.includes("LIST") ? "md:col-span-2" : undefined}>
                <FieldInput
                  field={f}
                  value={values[f.name]}
                  users={users}
                  invalid={!!errors[f.name]}
                  disabled={editing && f.isLocked}
                  allowCreate
                  onChange={(v) => {
                    setValues((s) => ({ ...s!, [f.name]: v }))
                    if (errors[f.name]) setErrors(({ [f.name]: _, ...rest }) => rest)
                    // Picking the trigger record copies its line items (+ mapped roll-ups).
                    if (ai?.enabled && f.name === ai.triggerField) {
                      const init = autoInitItems(table, String(v ?? ""))
                      if (init) {
                        setItems(init.items)
                        setValues((s) => ({ ...s!, ...init.sums }))
                      }
                    }
                  }}
                />
              </FormRow>
            ))}
          </div>
          {table.config.items.enabled && (
            <div className="mt-8 space-y-2 border-t pt-6">
              {autoNote && <p className="rounded-md bg-brand/5 px-3 py-2 text-xs text-brand">{autoNote}</p>}
              <ItemsEditor config={table.config.items} items={items} users={users} onChange={setItems} parent={values} pinnedSums={pinnedSumsOf(table.config.items, values)} />
            </div>
          )}
          {formError && <p className="mt-6 text-sm text-destructive">{formError}</p>}
        </form>
        <footer className="flex items-center justify-end gap-3 border-t bg-muted/50 px-3 py-4 sm:px-6">
          <Button variant="outline" size="sm" className="px-3" asChild><Link to={back}>Hủy</Link></Button>
          <Button type="submit" size="sm" className="px-3" form="record-page-form" disabled={pending}>{pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo bản ghi"}</Button>
        </footer>
        </section>
      </div>
    </div>
  )
}
