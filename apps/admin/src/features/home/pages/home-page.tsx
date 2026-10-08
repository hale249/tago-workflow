import { DollarSign, Home, TrendingUp, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { useCustomers } from "@/features/customers"
import { formatCurrency } from "@/lib/format"

export function HomePage() {
  const { data = [] } = useCustomers()
  const total = data.reduce((s, c) => s + c.amount, 0)
  const avgRate = data.length ? Math.round(data.reduce((s, c) => s + c.responseRate, 0) / data.length) : 0
  const stats = [
    { label: "Customers", value: data.length.toString(), icon: Users },
    { label: "Total contract value", value: formatCurrency(total), icon: DollarSign },
    { label: "Avg. response rate", value: `${avgRate}%`, icon: TrendingUp },
  ]

  return (
    <>
      <PageHeader title="Home" icon={<Home className="size-4 text-muted-foreground" />} />
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-background p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {s.label}<s.icon className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </>
  )
}
