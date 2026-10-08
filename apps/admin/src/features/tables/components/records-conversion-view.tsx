import { useQueries } from "@tanstack/react-query"
import { ArrowRight, Settings } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { recordsQuery, tableQuery } from "../api/tables.queries"
import type { ActiveTable, ConversionConfig, TableRecord, TotalSumField } from "../types/table"
import { formatNumber } from "../utils/fields"
import { evaluateFormula } from "../utils/formula"
import { EmptyBox } from "./settings-card"
import { TableIcon } from "./table-icon"

type Props = { table: ActiveTable; config: ConversionConfig; records: TableRecord[]; filters: Record<string, string> }

const metric = (s: TotalSumField, rs: TableRecord[]) => evaluateFormula(s.formula, rs.map((r) => r.record))

function Column({ title, subtitle, table, metrics, records, loading, primary, rate }: {
  title: string; subtitle?: string; table?: ActiveTable; metrics: TotalSumField[]; records: TableRecord[]; loading?: boolean; primary?: string; rate?: number | null
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b p-3">
        {table && <TableIcon icon={table.icon} color={table.iconColor} className="size-8" />}
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3 p-3">
        {loading ? (
          <Skeleton className="h-16" />
        ) : metrics.length ? (
          metrics.map((m) => (
            <div key={m.label + m.formula} className={m.formula === primary ? "rounded-lg bg-brand/5 p-2" : "px-2"}>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={m.formula === primary ? "text-2xl font-semibold tabular-nums" : "text-base font-medium tabular-nums"}>{formatNumber(metric(m, records), 0)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Không có chỉ số</p>
        )}
      </div>
      {rate != null && (
        <p className="mt-auto border-t px-3 py-2 text-xs text-muted-foreground">
          Tỷ lệ so với cột trước: <b className="text-foreground">{formatNumber(rate, 1)}%</b>
        </p>
      )}
    </div>
  )
}

/** Funnel-style report: main table + one column per target table, filters carried across via mappings. */
export function RecordsConversionView({ table, config, records, filters }: Props) {
  const targets = useQueries({ queries: config.columns.map((c) => tableQuery(c.tableId)) })
  const targetRecords = useQueries({
    queries: config.columns.map((c) => {
      const mapped: Record<string, string> = {}
      for (const m of c.filterMappings) if (filters[m.from]) mapped[m.to] = filters[m.from]
      return recordsQuery(c.tableId, { filters: mapped })
    }),
  })

  if (!config.columns.length) {
    return (
      <div className="p-6">
        <EmptyBox title="Chưa có cột nào trong báo cáo chuyển đổi" hint="Vui lòng cấu hình báo cáo trong trang Cài đặt." />
        <div className="mt-3 text-center">
          <Button asChild size="sm" variant="outline"><Link to={`/tables/${table.id}/settings`}><Settings />Mở cài đặt</Link></Button>
        </div>
      </div>
    )
  }

  const mainMetrics = table.config.recordList.totalSumFields
  const primaryOf = (metrics: TotalSumField[], formula?: string) => formula ?? metrics[0]?.formula
  // Conversion rate compares each column's primary metric with the previous column's.
  const values: (number | null)[] = [
    mainMetrics[0] ? metric(mainMetrics[0], records) : null,
    ...config.columns.map((c, i) => {
      const t = targets[i].data
      const m = t?.config.recordList.totalSumFields.find((s) => s.formula === c.formula) ?? t?.config.recordList.totalSumFields[0]
      return m && targetRecords[i].data ? metric(m, targetRecords[i].data) : null
    }),
  ]
  const active = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="border-b px-4 py-2 text-xs text-muted-foreground">
        {config.name} · {active ? `Đang đồng bộ ${active} bộ lọc nhanh sang các bảng đích` : "Không có bộ lọc đang hoạt động"}
      </p>
      <div className="flex flex-1 items-stretch gap-2 overflow-x-auto p-4">
        <Column title={table.name} subtitle="Chính" table={table} metrics={mainMetrics} records={records} primary={primaryOf(mainMetrics)} />
        {config.columns.map((c, i) => {
          const t = targets[i].data
          const metrics = t?.config.recordList.totalSumFields ?? []
          const prev = values[i]
          const cur = values[i + 1]
          return (
            <div key={i} className="flex items-stretch gap-2">
              <ArrowRight className="size-4 shrink-0 self-center text-muted-foreground" />
              <Column
                title={c.label}
                subtitle={t?.name}
                table={t}
                metrics={metrics}
                records={targetRecords[i].data ?? []}
                loading={targets[i].isLoading || targetRecords[i].isLoading}
                primary={primaryOf(metrics, c.formula)}
                rate={prev && cur != null ? (cur / prev) * 100 : null}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
