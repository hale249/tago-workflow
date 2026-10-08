import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { recordLabel } from "../api/tables.api"
import type { ActiveTable, PivotConfig, PivotGroupBy, TableRecord, WorkspaceUser } from "../types/table"
import { formatNumber, valueToText } from "../utils/fields"
import { evaluateFormula } from "../utils/formula"

function bucket(iso: string, by: PivotGroupBy): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "(Không có ngày)"
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  if (by === "year") return String(y)
  if (by === "quarter") return `Q${Math.ceil(m / 3)}/${y}`
  if (by === "month") return `${String(m).padStart(2, "0")}/${y}`
  if (by === "week") {
    const t = new Date(Date.UTC(y, d.getMonth(), d.getDate()))
    const day = t.getUTCDay() || 7
    t.setUTCDate(t.getUTCDate() + 4 - day)
    const week = Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7)
    return `T${week}/${t.getUTCFullYear()}`
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}
/** Sortable key for a bucket label (labels above are not lexically ordered). */
const bucketKey = (iso: string, by: PivotGroupBy) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "9999" : by === "year" ? `${d.getFullYear()}` : by === "day" ? iso.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${by}-${bucket(iso, by)}`
}

export function RecordsPivotView({ table, config, records, users }: { table: ActiveTable; config: PivotConfig; records: TableRecord[]; users: WorkspaceUser[] }) {
  const [q, setQ] = useState("")
  const rowField = table.config.fields.find((f) => f.name === config.rowField)
  const dateOf = (r: TableRecord) => String((config.columnField ? r.record[config.columnField] : r.createdAt) ?? "")

  const { rowKeys, colKeys, cells } = useMemo(() => {
    const cols = new Map<string, string>()
    const groups = new Map<string, Map<string, TableRecord[]>>()
    for (const r of records) {
      const rk = rowField ? valueToText(rowField, r.record[rowField.name], { users, recordLabel }) || "(Trống)" : "Tất cả"
      const iso = dateOf(r)
      const label = bucket(iso, config.groupBy)
      cols.set(label, bucketKey(iso, config.groupBy))
      const row = groups.get(rk) ?? new Map<string, TableRecord[]>()
      row.set(label, [...(row.get(label) ?? []), r])
      groups.set(rk, row)
    }
    return { rowKeys: [...groups.keys()].sort(), colKeys: [...cols.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([l]) => l), cells: groups }
  }, [records, rowField, config, users]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleRows = rowKeys.filter((k) => k.toLowerCase().includes(q.trim().toLowerCase()))
  const val = (rs: TableRecord[], formula: string) => evaluateFormula(formula, rs.map((r) => r.record))
  const fmt = (n: number, m: PivotConfig["measures"][number]) => formatNumber(n, m.decimalPlaces ?? 0, m.unit)
  const rowsOf = (rk: string) => [...(cells.get(rk)?.values() ?? [])].flat()
  const colOf = (ck: string) => visibleRows.flatMap((rk) => cells.get(rk)?.get(ck) ?? [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-3">
        <div className="relative max-w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm dòng…" className="h-8 pl-8" />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="sticky left-0 z-20 border-r border-b bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground">{rowField?.label ?? "Dòng"}</th>
              <th className="border-r border-b px-3 py-2 text-left text-xs font-medium text-muted-foreground">Chỉ số</th>
              {colKeys.map((c) => <th key={c} className="border-r border-b px-3 py-2 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">{c}</th>)}
              {config.rowTotals && <th className="border-b bg-muted/40 px-3 py-2 text-right text-xs font-semibold">Tổng dòng</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((rk) =>
              config.measures.map((m, mi) => (
                <tr key={rk + mi} className="hover:bg-muted/30">
                  {mi === 0 && <td rowSpan={config.measures.length} className="sticky left-0 border-r border-b bg-background px-3 py-2 align-top font-medium">{rk}</td>}
                  <td className="border-r border-b px-3 py-2 text-xs text-muted-foreground">{m.label}</td>
                  {colKeys.map((ck) => {
                    const rs = cells.get(rk)?.get(ck) ?? []
                    return <td key={ck} className="border-r border-b px-3 py-2 text-right tabular-nums">{rs.length ? fmt(val(rs, m.formula), m) : <span className="text-muted-foreground/50">—</span>}</td>
                  })}
                  {config.rowTotals && <td className="border-b bg-muted/40 px-3 py-2 text-right font-medium tabular-nums">{fmt(val(rowsOf(rk), m.formula), m)}</td>}
                </tr>
              )),
            )}
            {config.columnTotals &&
              config.measures.map((m, mi) => (
                <tr key={`total${mi}`} className="bg-muted/40 font-medium">
                  {mi === 0 && <td rowSpan={config.measures.length} className="sticky left-0 border-r border-b bg-muted px-3 py-2 align-top">Tổng cột</td>}
                  <td className="border-r border-b px-3 py-2 text-xs text-muted-foreground">{m.label}</td>
                  {colKeys.map((ck) => <td key={ck} className="border-r border-b px-3 py-2 text-right tabular-nums">{fmt(val(colOf(ck), m.formula), m)}</td>)}
                  {config.rowTotals && (
                    <td className="border-b px-3 py-2 text-right tabular-nums" title={config.grandTotal ? "Tổng toàn bảng" : undefined}>
                      {config.grandTotal ? <b>{fmt(val(visibleRows.flatMap(rowsOf), m.formula), m)}</b> : ""}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
        {!visibleRows.length && <p className="p-10 text-center text-sm text-muted-foreground">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>}
      </div>
    </div>
  )
}
