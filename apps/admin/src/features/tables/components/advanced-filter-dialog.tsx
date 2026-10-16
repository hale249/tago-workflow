import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, FilterIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { AdvancedCondition, TableField, WorkspaceUser } from "../types/table"
import { isNumericValue } from "../utils/fields"
import { OPERATORS, operatorsFor } from "../utils/filters"
import { NativeSelect } from "./form-controls"

const DESC = "Tạo bộ lọc nhanh cho các truy vấn thường dùng hiển thị ở đầu danh sách"

type Props = { fields: TableField[]; users: WorkspaceUser[]; value: AdvancedCondition[]; onApply: (v: AdvancedCondition[]) => void }

function ValueInput({ field, cond, users, onChange }: { field?: TableField; cond: AdvancedCondition; users: WorkspaceUser[]; onChange: (v: string) => void }) {
  const multi = cond.op === "in" || cond.op === "notIn"
  const choices = field?.options?.map((o) => ({ v: o.value, l: o.text })) ?? (field?.type.includes("WORKSPACE_USER") ? users.map((u) => ({ v: u.id, l: u.fullName })) : null)
  if (field?.type === "CHECKBOX_YES_NO")
    return <NativeSelect value={cond.value} onChange={(e) => onChange(e.target.value)}><option value="">—</option><option value="true">Có</option><option value="false">Không</option></NativeSelect>
  if (choices && !multi)
    return <NativeSelect value={cond.value} onChange={(e) => onChange(e.target.value)}><option value="">Chọn giá trị…</option>{choices.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</NativeSelect>
  if (choices && multi) {
    const sel = cond.value.split(",").filter(Boolean)
    return (
      <div className="flex flex-wrap gap-1 rounded-md border p-1.5">
        {choices.map((c) => (
          <button key={c.v} type="button" onClick={() => onChange((sel.includes(c.v) ? sel.filter((x) => x !== c.v) : [...sel, c.v]).join(","))}
            className={cn("rounded border px-1.5 py-0.5 text-xs", sel.includes(c.v) && "border-brand bg-brand/10 text-brand")}>{c.l}</button>
        ))}
      </div>
    )
  }
  const type = field && isNumericValue(field.type) ? "number" : field?.type === "DATE" ? "date" : field?.type === "DATETIME" ? "datetime-local" : field?.type === "TIME" ? "time" : "text"
  return <Input type={type} value={cond.value} placeholder={multi ? "Giá trị, cách nhau bởi dấu phẩy" : "Nhập giá trị"} onChange={(e) => onChange(e.target.value)} />
}

export function AdvancedFilterButton({ fields, users, value, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AdvancedCondition[]>([])
  const [error, setError] = useState("")
  useEffect(() => {
    if (open) { setRows(value); setError("") }
  }, [open, value])
  const addRow = () => setRows([...rows, { field: "", op: "eq", value: "" }])
  const set = (i: number, patch: Partial<AdvancedCondition>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const apply = () => {
    const filled = rows.filter((r) => r.field)
    if (filled.some((r) => !r.op)) return setError("Vui lòng chọn phép so sánh")
    onApply(filled)
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" className={cn("h-8 gap-2 px-2.5 font-normal has-[>svg]:px-2", value.length && "border-brand text-brand")} onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={FilterIcon} className="size-3.5" />Bộ lọc nâng cao{value.length > 0 && ` (${value.length})`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-y-auto p-0 duration-150 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] sm:max-w-3xl">
          <DialogHeader className="gap-1.5 border-b p-6 pb-4">
            <DialogTitle className="tracking-tight">Bộ lọc nâng cao</DialogTitle>
            <DialogDescription>{DESC}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] min-h-[300px] flex-1 overflow-y-auto bg-muted/10">
            <div className="space-y-4 p-6">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-16 text-center transition-colors hover:border-primary/20">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <HugeiconsIcon icon={FilterIcon} className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mb-1 font-medium text-foreground">Chưa có bộ lọc nhanh nào.</p>
                  <p className="mb-6 max-w-[280px] text-sm text-muted-foreground">{DESC}</p>
                  <Button size="sm" variant="outline" className="gap-2 border-input" onClick={addRow}><HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />Thêm điều kiện</Button>
                </div>
              ) : (
                <>
                  {rows.map((r, i) => {
                    const f = fields.find((x) => x.name === r.field)
                    const ops = f ? operatorsFor(f) : OPERATORS.map((o) => o.op)
                    return (
                      <div key={i} className="grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
                        <NativeSelect value={r.field} onChange={(e) => { const nf = fields.find((x) => x.name === e.target.value); set(i, { field: e.target.value, op: nf ? operatorsFor(nf)[0] : "eq", value: "" }) }}>
                          <option value="">Chọn trường...</option>
                          {fields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                        </NativeSelect>
                        <NativeSelect value={r.op} disabled={!f} onChange={(e) => set(i, { op: e.target.value as AdvancedCondition["op"], value: "" })}>
                          {OPERATORS.filter((o) => ops.includes(o.op)).map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
                        </NativeSelect>
                        <ValueInput field={f} cond={r} users={users} onChange={(value) => set(i, { value })} />
                        <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-destructive" aria-label="Xóa điều kiện" onClick={() => setRows(rows.filter((_, j) => j !== i))}><HugeiconsIcon icon={Delete02Icon} /></Button>
                      </div>
                    )
                  })}
                  <Button size="sm" variant="outline" className="gap-2 border-input" onClick={addRow}><HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />Thêm điều kiện</Button>
                </>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter className="items-center border-t bg-muted/5 p-6 pt-4 sm:justify-between">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-accent/50 hover:text-destructive" disabled={!rows.length && !value.length} onClick={() => { onApply([]); setOpen(false) }}>Xóa bộ lọc</Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-input" onClick={() => setOpen(false)}>Hủy</Button>
              <Button size="sm" className="shadow-xs" onClick={apply}>Áp dụng</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
