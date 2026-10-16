/**
 * Chat palette of the reference inbox (data-chat-theme="lunar"), sampled from beqeek screenshots:
 * slate text ramp, #f8fafc sidebar, #f0f0f0 incoming bubbles. Dark mode maps onto our theme tokens.
 * Applied on the inbox root; children use bg-[var(--chat-…)] / text-[var(--chat-…)] like the reference.
 */
export const CHAT_THEME = [
  "[--chat-bg-sidebar:#f8fafc] [--chat-bg-main:var(--background)] [--chat-bg-header:color-mix(in_srgb,var(--background)_85%,transparent)]",
  "[--chat-bg-composer:color-mix(in_srgb,#f8fafc_85%,transparent)] [--chat-bubble-incoming:#f0f0f0] [--chat-bubble-incoming-text:#1c1e21]",
  "[--chat-text-primary:#1e293b] [--chat-text-secondary:#64748b] [--chat-text-tertiary:#94a3b8]",
  "[--chat-border:#f0f0f0] [--chat-border-strong:#dee0e2] [--chat-green:#16a34a] [--chat-red:#ef4444]",
  "[--chat-shadow-toolbar:0_2px_8px_rgb(0_0_0/0.08)] [--chat-shadow-md:0_4px_12px_rgb(0_0_0/0.1)]",
  "dark:[--chat-bg-sidebar:color-mix(in_srgb,var(--muted)_50%,var(--background))] dark:[--chat-bg-composer:color-mix(in_srgb,var(--background)_85%,transparent)]",
  "dark:[--chat-bubble-incoming:var(--muted)] dark:[--chat-bubble-incoming-text:var(--foreground)]",
  "dark:[--chat-text-primary:var(--foreground)] dark:[--chat-text-secondary:var(--muted-foreground)] dark:[--chat-text-tertiary:color-mix(in_srgb,var(--muted-foreground)_75%,transparent)]",
  "dark:[--chat-border:var(--border)] dark:[--chat-border-strong:var(--border)]",
].join(" ")

/** First letter of the customer's name, like the reference avatars ("Nguyễn An" → "N"). */
export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase()

/** Compact relative time of the reference list: 2m / 1h / 3d. */
export const relTime = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (min < 60) return `${min}m`
  if (min < 1440) return `${Math.floor(min / 60)}h`
  return `${Math.floor(min / 1440)}d`
}

/** Customers active in the last 15 minutes get the green "online" dot. */
export const isOnline = (iso: string) => Date.now() - Date.parse(iso) < 15 * 60_000
