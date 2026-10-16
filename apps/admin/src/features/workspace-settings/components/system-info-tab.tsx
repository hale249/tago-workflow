import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar02Icon, Clock01Icon, CpuIcon, DatabaseIcon, ServerStack01Icon } from "@hugeicons/core-free-icons"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { TableIcon, useRecordCounts, useTables } from "@/features/tables"
import { TD, TH, TR } from "@/features/teams"
import { SettingsCard, TYPE } from "./settings-ui"

// Plan values of the workspace (the reference reads them from the subscription; static in this mock).
const BASIC = [
  { icon: Clock01Icon, label: "Múi giờ", value: "GMT+7" },
  { icon: CpuIcon, label: "Giới hạn CPU", value: "1 WCPU" },
  { icon: Calendar02Icon, label: "Ngày bắt đầu", value: "2026-03-15 00:00:00" },
  { icon: Calendar02Icon, label: "Ngày hết hạn", value: "2027-03-15 23:59:59" },
]
const LIMITS: [string, number][] = [
  ["Thành viên Workspace", 10],
  ["Bảng dữ liệu (Active Table)", 20],
  ["Sự kiện quy trình tuỳ chỉnh", 30],
  ["Sự kiện quy trình", 1000],
  ["Đơn vị Workflow", 1000],
  ["Biểu mẫu (Opt-in Form)", 1000],
  ["Kết nối Workflow", 1000],
  ["Nhóm làm việc", 1000],
  ["Vai trò trong Workspace", 1000],
]
const RECORD_LIMIT = 50_000
const nf = new Intl.NumberFormat("en-US")

export function SystemInfoTab() {
  const { data: tables = [], isLoading } = useTables()
  const { data: counts = {} } = useRecordCounts()
  return (
    <div className="flex flex-col gap-6">
      <SettingsCard icon={ServerStack01Icon} title="Thông tin cơ bản" description="Các thông số cấu hình kỹ thuật của workspace">
        <div className="divide-y divide-border/70">
          {BASIC.map((r) => (
            <div key={r.label} className="flex h-10 items-center justify-between">
              <div className="flex items-center gap-2"><HugeiconsIcon icon={r.icon} className="size-4 text-muted-foreground" /><p className="text-foreground" style={TYPE.body}>{r.label}</p></div>
              <p className="text-muted-foreground tabular-nums" style={TYPE.body}>{r.value}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Giới hạn tài nguyên" description="Số lượng tối đa của từng loại tài nguyên trong workspace" flush>
        <div className="relative w-full overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead><tr className={TR}><th className={TH}>Tài nguyên</th><th className={cn(TH, "text-right")}>Giới hạn</th></tr></thead>
            <tbody className="[&_tr:last-child]:border-0">
              {LIMITS.map(([k, n]) => (
                <tr key={k} className={TR}><td className={cn(TD, "font-medium")}>{k}</td><td className={cn(TD, "text-right text-muted-foreground")}>{nf.format(n)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>

      <SettingsCard icon={DatabaseIcon} iconGap="gap-3" title="Giới hạn bản ghi theo Active Table" description="Giới hạn và số lượng bản ghi đã sử dụng cho từng bảng dữ liệu" flush>
        {isLoading ? <Skeleton className="mx-5 h-24" /> : (
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead><tr className={TR}><th className={TH}>Bảng dữ liệu</th><th className={cn(TH, "text-right")}>Giới hạn</th><th className={cn(TH, "text-right")}>Đã dùng</th></tr></thead>
              <tbody className="[&_tr:last-child]:border-0">
                {tables.map((t) => (
                  <tr key={t.id} className={TR}>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <TableIcon plain icon={t.icon} color="" className="text-muted-foreground" />
                        <div className="flex flex-col">
                          <p className="text-foreground" style={TYPE.bodyMedium}>{t.name}</p>
                          <p className="font-mono text-muted-foreground" style={TYPE.small}>{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn(TD, "text-right text-muted-foreground")}>{nf.format(RECORD_LIMIT)}</td>
                    <td className={cn(TD, "text-right text-muted-foreground")}>{nf.format(counts[t.id] ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tables.length && <p className="py-10 text-center text-sm text-muted-foreground">Không có bảng nào trong workspace này</p>}
          </div>
        )}
      </SettingsCard>
    </div>
  )
}
