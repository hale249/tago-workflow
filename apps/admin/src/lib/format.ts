const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short", year: "numeric" })
const dayMonth = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short" })
const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
const relative = new Intl.RelativeTimeFormat("vi", { numeric: "auto" })

export const formatCurrency = (v: number) => currency.format(v)
export const formatDate = (iso: string) => date.format(new Date(iso))
/** "28 thg 7 lúc 13:04" — comment / activity timestamps, as on the reference. */
export const formatStamp = (iso: string) => `${dayMonth.format(new Date(iso))} lúc ${time.format(new Date(iso))}`

export function formatRelative(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (Math.abs(days) < 30) return relative.format(days, "day")
  return relative.format(Math.round(days / 30), "month")
}
