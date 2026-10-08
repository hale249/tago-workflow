import { Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { ItemsConfig, RecordData, RecordItem, WorkspaceUser } from "../types/table"
import { emptyValue, formatNumber, uid } from "../utils/fields"
import { evaluateFormula } from "../utils/formula"
import { FieldInput } from "./field-input"
import { FieldValue } from "./field-value"

type Props = {
  config: ItemsConfig
  items: RecordItem[]
  users: WorkspaceUser[]
  onChange?: (items: RecordItem[]) => void
  /** Parent record values + roll-ups copied by auto-init: those show the stored value instead of recomputing. */
  parent?: RecordData
  pinnedSums?: string[]
}

/** Line-item grid (editable when `onChange` is given) followed by a separate totals block. */
export function ItemsEditor({ config, items, users, onChange, parent, pinnedSums = [] }: Props) {
  const editable = !!onChange
  const blankRow = (): RecordItem => {
    const row: RecordItem = { id: uid() }
    for (const f of config.fields) row[f.name] = emptyValue(f)
    return row
  }

  const sumValue = (s: ItemsConfig["sums"][number]) =>
    formatNumber(pinnedSums.includes(s.sumField) && parent ? Number(parent[s.sumField]) || 0 : evaluateFormula(s.formula, items), 2)

  return (
    <div>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              {config.label || "Danh sách chi tiết"}
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand/10 px-1.5 text-xs font-medium text-brand">{items.length}</span>
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Danh sách các mục chi tiết của bản ghi này</p>
          </div>
          {editable && <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 px-2.5" onClick={() => onChange([...items, blankRow()])}><Plus className="size-3.5" />Thêm dòng</Button>}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/50">
                  <th className="h-9 w-12 px-3 text-center text-[13px] font-medium whitespace-nowrap text-muted-foreground">#</th>
                  {config.fields.map((f) => (
                    <th key={f.name} className={cn("h-9 px-3 text-left text-[13px] font-medium whitespace-nowrap text-muted-foreground", f.type === "SELECT_ONE_RECORD" ? "w-[220px] min-w-[220px]" : "w-[160px] min-w-[160px]")}>{f.label}</th>
                  ))}
                  {editable && <th className="h-9 w-16 px-3 text-center text-[13px] font-medium whitespace-nowrap text-muted-foreground">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {items.map((it, i) => (
                  <tr key={it.id} className="group border-b border-border/70 transition-colors hover:bg-muted/60">
                    <td className="h-9 px-3 py-1.5 text-center font-medium text-muted-foreground tabular-nums">{i + 1}</td>
                    {config.fields.map((f) =>
                      editable ? (
                        <td key={f.name} className={cn("p-2 align-top", f.type === "SELECT_ONE_RECORD" ? "w-[220px] min-w-[220px]" : "w-[160px] min-w-[160px]")}>
                          <FieldInput field={f} value={it[f.name]} users={users} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [f.name]: v } : x)))} />
                        </td>
                      ) : (
                        <td key={f.name} className="h-9 px-3 py-1.5">
                          {f.type === "NUMERIC" && it[f.name] != null && it[f.name] !== "" ? (
                            <span className="tabular-nums">{formatNumber(Number(it[f.name]), 2, f.unit === "%" ? "%" : null)}</span>
                          ) : (
                            <FieldValue field={f} value={it[f.name]} users={users} />
                          )}
                        </td>
                      ),
                    )}
                    {editable && (
                      <td className="h-9 px-3 py-1.5 text-center">
                        <Button type="button" size="icon-sm" variant="ghost" className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 max-md:opacity-100" aria-label={`Xoá dòng ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={config.fields.length + (editable ? 2 : 1)} className="px-3 py-4 text-center text-xs text-muted-foreground">Chưa có dòng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground">Tổng cộng: {items.length} dòng</div>
        </div>
      </div>

      {config.sums.length > 0 && (
        <div className="mt-6 rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {config.sums.map((s) => (
              <div key={s.label} className="space-y-1.5">
                <label className="text-sm font-medium">{s.label}</label>
                <Input disabled value={sumValue(s)} aria-label={s.label} />
                {pinnedSums.includes(s.sumField) && <p className="text-[11px] text-muted-foreground">Chép từ bản ghi kích hoạt</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
