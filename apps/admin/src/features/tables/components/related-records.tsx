import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowUpRight01Icon, CalculatorIcon } from "@hugeicons/core-free-icons"

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

/** Heroicons "document-text" used by the reference's empty related list. */
function DocIcon() {
  return (
    <svg className="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

/** Tab-bar actions for a related tab (reference: outline "Mở" + primary "Tạo mới", h-8). */
export function RelatedActions({ config, onCreate }: { config: RefRecordsConfig; onCreate: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 gap-1 border-input px-2.5 shadow-xs has-[>svg]:px-2" onClick={() => navigate(`/tables/${config.refTableId}`)}>
        <HugeiconsIcon icon={ArrowUpRight01Icon} className="h-3.5 w-3.5" /><span>Mở</span>
      </Button>
      {config.showCreate !== false && (
        <Button size="sm" className="h-8 gap-1 px-2.5 shadow-xs has-[>svg]:px-2" onClick={onCreate} aria-label="Tạo mới">
          <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tạo mới</span>
        </Button>
      )}
    </div>
  )
}

/** Records in another table whose reference field points at this record. */
export function RelatedRecords({ config, recordId, users, createOpen, onCreateOpenChange }: {
  config: RefRecordsConfig; recordId: string; users: WorkspaceUser[]; createOpen: boolean; onCreateOpenChange: (o: boolean) => void
}) {
  const navigate = useNavigate()
  const { data: table } = useTable(config.refTableId)
  const { data: records = [] } = useRecords(config.refTableId, { filters: { ...extraFilters(config.extraFilter), [config.refField]: recordId } })
  if (!table) return null
  const cols = config.displayFields.map((n) => table.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)
  const open = (id: string) => navigate(`/tables/${table.id}/records/${id}`)

  return (
    <div className="flex min-w-0 flex-col items-stretch justify-start gap-[var(--space-400)]">
      {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
      <div className="scrollbar-thin max-h-[600px] overflow-auto rounded-md border border-border bg-background">
        {!records.length ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"><DocIcon /></div>
            <p className="text-sm font-medium text-foreground">Chưa có bản ghi liên kết</p>
          </div>
        ) : config.layout === "cards" ? (
          <ul className="grid gap-2 p-3 sm:grid-cols-2">
            {records.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => open(r.id)} className="grid w-full gap-1.5 rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted/50">
                  {cols.map((c, i) => (
                    <div key={c.name} className={cn("grid grid-cols-[88px_minmax(0,1fr)] gap-2", i === 0 && "font-medium")}>
                      <span className="truncate text-xs leading-5 font-normal text-muted-foreground">{c.label}</span>
                      <span className="min-w-0 truncate"><FieldValue field={c} value={r.record[c.name]} users={users} /></span>
                    </div>
                  ))}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-left text-xs text-muted-foreground">
                {cols.map((c) => <th key={c.name} className="h-9 px-3 font-medium whitespace-nowrap">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} onClick={() => open(r.id)} className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50">
                  {cols.map((c) => <td key={c.name} className="max-w-60 px-3 py-2"><FieldValue field={c} value={r.record[c.name]} users={users} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 border-t pt-4">
        {!!config.totalSumFields?.length && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><HugeiconsIcon icon={CalculatorIcon} className="size-3.5" />Tổng hợp</span>
            {config.totalSumFields.map((t, i) => {
              const v = evaluateSummary(t.formula, records)
              return <span key={i} className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">{t.label}:</span><span className="text-[13px] font-semibold tabular-nums">{v == null ? "—" : formatNumber(v, 2)}</span></span>
            })}
          </div>
        )}
      </div>
      <RecordFormDialog table={table} open={createOpen} onOpenChange={onCreateOpenChange} initial={{ [config.refField]: recordId }} />
    </div>
  )
}
