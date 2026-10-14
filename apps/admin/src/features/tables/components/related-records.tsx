import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, CalculatorIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useRecords, useTable } from "../api/tables.queries"
import type { RefRecordsConfig, TableField, WorkspaceUser } from "../types/table"
import { evaluateSummary, formatNumber } from "../utils/fields"
import { FieldValue } from "./field-value"
import { RecordFormDialog } from "./record-form-dialog"

/** `{"loai": "xuat_kho"}` → equality filters; invalid JSON or non-scalar values are ignored. */
function extraFilters(json?: string): Record<string, string> {
  try {
    const o = JSON.parse(json?.trim() || "{}")
    if (!o || typeof o !== "object" || Array.isArray(o)) return {}
    return Object.fromEntries(Object.entries(o).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v)).map(([k, v]) => [k, String(v)]))
  } catch {
    return {}
  }
}

/** Records in another table whose reference field points at this record. */
export function RelatedRecords({ config, recordId, users }: { config: RefRecordsConfig; recordId: string; users: WorkspaceUser[] }) {
  const navigate = useNavigate()
  const { data: table } = useTable(config.refTableId)
  const { data: records = [] } = useRecords(config.refTableId, { filters: { ...extraFilters(config.extraFilter), [config.refField]: recordId } })
  const [open, setOpen] = useState(false)
  if (!table) return null
  const cols = config.displayFields.map((n) => table.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{config.title} <span className="font-normal text-muted-foreground">· {records.length}</span></h3>
          {config.description && <p className="truncate text-xs text-muted-foreground">{config.description}</p>}
        </div>
        {config.showCreate !== false && <Button size="xs" variant="ghost" onClick={() => setOpen(true)}><HugeiconsIcon icon={Add01Icon} />Thêm</Button>}
      </div>
      {config.layout === "cards" ? (
        <ul className="grid gap-2 p-3 sm:grid-cols-2">
          {records.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => navigate(`/tables/${table.id}/records/${r.id}`)} className="grid w-full gap-1.5 rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted/50">
                {cols.map((c, i) => (
                  <div key={c.name} className={cn("grid grid-cols-[88px_minmax(0,1fr)] gap-2", i === 0 && "font-medium")}>
                    <span className="truncate text-xs leading-5 font-normal text-muted-foreground">{c.label}</span>
                    <span className="min-w-0 truncate"><FieldValue field={c} value={r.record[c.name]} users={users} /></span>
                  </div>
                ))}
              </button>
            </li>
          ))}
          {!records.length && <li className="col-span-full py-6 text-center text-xs text-muted-foreground">Chưa có bản ghi liên quan</li>}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                {cols.map((c) => <th key={c.name} className="px-4 py-2 font-medium">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/tables/${table.id}/records/${r.id}`)} className="cursor-pointer border-t hover:bg-muted/50">
                  {cols.map((c) => <td key={c.name} className="max-w-60 px-4 py-2"><FieldValue field={c} value={r.record[c.name]} users={users} /></td>)}
                </tr>
              ))}
              {!records.length && (
                <tr><td colSpan={cols.length || 1} className="px-4 py-6 text-center text-xs text-muted-foreground">Chưa có bản ghi liên quan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!!config.totalSumFields?.length && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t px-4 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><HugeiconsIcon icon={CalculatorIcon} className="size-3.5" />Tổng hợp</span>
          {config.totalSumFields.map((t, i) => {
            const v = evaluateSummary(t.formula, records)
            return <span key={i} className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">{t.label}:</span><span className="text-[13px] font-semibold tabular-nums">{v == null ? "—" : formatNumber(v, 2)}</span></span>
          })}
        </div>
      )}
      <RecordFormDialog table={table} open={open} onOpenChange={setOpen} initial={{ [config.refField]: recordId }} />
    </div>
  )
}
