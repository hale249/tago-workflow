const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export const formatCurrency = (v: number) => currency.format(v)
export const formatDate = (iso: string) => date.format(new Date(iso))

export function formatRelative(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (Math.abs(days) < 30) return relative.format(days, "day")
  return relative.format(Math.round(days / 30), "month")
}
