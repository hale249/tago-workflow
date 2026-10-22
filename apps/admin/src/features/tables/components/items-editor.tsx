import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { TYPE } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import type { ItemsConfig, RecordData, RecordItem, WorkspaceUser } from "../types/table"
import { emptyValue, formatNumber, isNumber, uid } from "../utils/fields"
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

/** Read-only grid column widths as on the reference (# 48px, then 160 / 256 / 112…); table-fixed spreads spare width proportionally. */
const readWidth = (i: number) => (i === 0 ? 160 : i === 1 ? 256 : 112)

/** Line-item grid (editable when `onChange` is given) followed by a separate totals block. */
export function ItemsEditor({ config, items, users, onChange, parent, pinnedSums = [] }: Props) {
  const editable = !!onChange
  const readMinWidth = 48 + config.fields.reduce((n, _, i) => n + readWidth(i), 0)
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
        {editable ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {config.label || "Danh sách chi tiết"}
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand/10 px-1.5 text-xs font-medium text-brand">{items.length}</span>
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Danh sách các mục chi tiết của bản ghi này</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 px-2.5" onClick={() => onChange([...items, blankRow()])}><HugeiconsIcon icon={Add01Icon} className="size-3.5" />Thêm dòng</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{config.label || "Danh sách chi tiết"}</h3>
            <span className="inline-flex h-[22px] items-center rounded-md border border-border bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground">{items.length}</span>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="relative w-full overflow-x-auto">
            <table className={cn("w-full border-collapse text-sm", editable ? "min-w-max" : "table-fixed")} style={editable ? undefined : { minWidth: readMinWidth }}>
              <thead>
                <tr className={cn("border-b", editable ? "bg-muted/50" : "bg-background")}>
                  <th className={cn("h-9 w-12 px-3 text-center text-[13px] font-medium whitespace-nowrap text-muted-foreground", !editable && "overflow-hidden border-r border-border/70 align-middle")}>#</th>
                  {config.fields.map((f, i) =>
                    editable ? (
                      <th key={f.name} className={cn("h-9 px-3 text-left text-[13px] font-medium whitespace-nowrap text-muted-foreground", f.type === "SELECT_ONE_RECORD" ? "w-[220px] min-w-[220px]" : "w-[160px] min-w-[160px]")}>{f.label}</th>
                    ) : (
                      <th key={f.name} style={{ width: readWidth(i) }} className={cn("h-9 overflow-hidden border-r border-border/70 px-3 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground last:border-r-0", isNumber(f.type) && "text-right tabular-nums")}><div className="truncate pr-2">{f.label}</div></th>
                    ),
                  )}
                  {editable && <th className="h-9 w-16 px-3 text-center text-[13px] font-medium whitespace-nowrap text-muted-foreground">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {items.map((it, i) => (
                  <tr key={it.id} className="group border-b border-border/70 transition-colors hover:bg-muted/60">
                    <td className={cn("h-9 px-3 py-1 text-center font-medium text-muted-foreground tabular-nums", !editable && "overflow-hidden border-r border-border/70 align-middle whitespace-nowrap")}>{i + 1}</td>
                    {config.fields.map((f) =>
                      editable ? (
                        <td key={f.name} className={cn("p-2 align-top", f.type === "SELECT_ONE_RECORD" ? "w-[220px] min-w-[220px]" : "w-[160px] min-w-[160px]")}>
                          <FieldInput field={f} value={it[f.name]} users={users} record={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [f.name]: v } : x)))} />
                        </td>
                      ) : (
                        <td key={f.name} className={cn("h-9 overflow-hidden border-r border-border/70 px-3 py-1 align-top whitespace-nowrap last:border-r-0", isNumber(f.type) && "text-right tabular-nums")}>
                          {(f.type === "NUMERIC" || f.type === "NUMERIC_SUMMARY") && it[f.name] != null && it[f.name] !== "" ? (
                            <span className="text-foreground tabular-nums" style={TYPE.body}>{formatNumber(Number(it[f.name]), 2, f.unit === "%" ? "%" : null)}</span>
                          ) : (
                            <FieldValue size="md" field={f} value={it[f.name]} users={users} />
                          )}
                        </td>
                      ),
                    )}
                    {editable && (
                      <td className="h-9 px-3 py-1.5 text-center">
                        <Button type="button" size="icon-sm" variant="ghost" className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 max-md:opacity-100" aria-label={`Xoá dòng ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><HugeiconsIcon icon={Delete02Icon} /></Button>
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
          <div className={cn("border-t px-3 py-2 text-muted-foreground tabular-nums", editable ? "bg-muted/30 px-4 text-sm" : "bg-background text-xs")}>Tổng cộng: {items.length} dòng</div>
        </div>
      </div>

      {config.sums.length > 0 && (
        <div className={cn("rounded-lg border bg-muted/20 p-4", editable ? "mt-6" : "mt-4")}>
          <div className={cn("grid sm:grid-cols-2", editable ? "gap-4" : "gap-3")}>
            {config.sums.map((s) => (
              // Form: disabled inputs; detail view: label + bold value (as in the reference).
              <div key={s.label} className={editable ? "space-y-1.5" : "space-y-1"}>
                {/* Inline label + block value, exactly like the reference (the label sits on the parent's line box). */}
                {editable ? <label className="text-sm font-medium">{s.label}</label> : <span className="text-xs font-medium text-muted-foreground">{s.label}</span>}
                {editable ? <Input disabled value={sumValue(s)} aria-label={s.label} /> : <div className="text-sm font-semibold">{sumValue(s)}</div>}
                {pinnedSums.includes(s.sumField) && <p className="text-[11px] text-muted-foreground">Chép từ bản ghi kích hoạt</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
