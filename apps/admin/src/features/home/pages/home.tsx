import { HugeiconsIcon } from "@hugeicons/react"
import { ChartIncreaseIcon, Dollar01Icon, Home01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"

import { PageHeader } from "@/components/layout/page-header"
import { useCustomers } from "@/features/customers"
import { formatCurrency } from "@/lib/format"

export function HomePage() {
  const { data = [] } = useCustomers()
  const total = data.reduce((s, c) => s + c.amount, 0)
  const avgRate = data.length ? Math.round(data.reduce((s, c) => s + c.responseRate, 0) / data.length) : 0
  const stats = [
    { label: "Customers", value: data.length.toString(), icon: UserMultipleIcon },
    { label: "Total contract value", value: formatCurrency(total), icon: Dollar01Icon },
    { label: "Avg. response rate", value: `${avgRate}%`, icon: ChartIncreaseIcon },
  ]

  return (
    <>
      <PageHeader title="Home" icon={<HugeiconsIcon icon={Home01Icon} className="size-4 text-muted-foreground" />} />
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-background p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {s.label}<HugeiconsIcon icon={s.icon} className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </>
  )
}
