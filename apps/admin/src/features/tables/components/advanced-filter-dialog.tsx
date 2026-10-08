import { useEffect, useState } from "react"
import { Filter, Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { AdvancedCondition, TableField, WorkspaceUser } from "../types/table"
import { OPERATORS, operatorsFor } from "../utils/filters"
import { NativeSelect } from "./form-controls"

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
  const type = field?.type === "NUMERIC" ? "number" : field?.type === "DATE" ? "date" : field?.type === "DATETIME" ? "datetime-local" : "text"
  return <Input type={type} value={cond.value} placeholder={multi ? "Giá trị, cách nhau bởi dấu phẩy" : "Nhập giá trị"} onChange={(e) => onChange(e.target.value)} />
}

export function AdvancedFilterButton({ fields, users, value, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AdvancedCondition[]>([])
  const [error, setError] = useState("")
  useEffect(() => {
    if (open) { setRows(value.length ? value : [{ field: "", op: "eq", value: "" }]); setError("") }
  }, [open, value])
  const set = (i: number, patch: Partial<AdvancedCondition>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const apply = () => {
    const filled = rows.filter((r) => r.field)
    if (filled.some((r) => !r.op)) return setError("Vui lòng chọn phép so sánh")
    onApply(filled)
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" className={cn("h-8 gap-2 px-2.5 font-normal", value.length && "border-brand text-brand")} onClick={() => setOpen(true)}>
        <Filter />Bộ lọc nâng cao{value.length > 0 && ` (${value.length})`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bộ lọc nâng cao</DialogTitle>
            <DialogDescription>Kết hợp nhiều điều kiện (AND) để lọc bản ghi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {rows.map((r, i) => {
              const f = fields.find((x) => x.name === r.field)
              const ops = f ? operatorsFor(f) : OPERATORS.map((o) => o.op)
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
                  <NativeSelect value={r.field} onChange={(e) => { const nf = fields.find((x) => x.name === e.target.value); set(i, { field: e.target.value, op: nf ? operatorsFor(nf)[0] : "eq", value: "" }) }}>
                    <option value="">Chọn trường...</option>
                    {fields.map((x) => <option key={x.name} value={x.name}>{x.label}</option>)}
                  </NativeSelect>
                  <NativeSelect value={r.op} disabled={!f} onChange={(e) => set(i, { op: e.target.value as AdvancedCondition["op"], value: "" })}>
                    {OPERATORS.filter((o) => ops.includes(o.op)).map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
                  </NativeSelect>
                  <ValueInput field={f} cond={r} users={users} onChange={(value) => set(i, { value })} />
                  <Button size="icon-sm" variant="ghost" aria-label="Xoá điều kiện" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              )
            })}
            <Button size="sm" variant="outline" onClick={() => setRows([...rows, { field: "", op: "eq", value: "" }])}><Plus />Thêm điều kiện</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => { onApply([]); setOpen(false) }}>Xóa bộ lọc</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button onClick={apply}>Áp dụng</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
