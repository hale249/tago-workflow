/**
 * Branding — the one place to re-skin the app.
 * Colors accept any CSS color (oklch, hex, rgb). Each can be overridden per
 * deployment via env: VITE_BRAND_NAME, VITE_BRAND_COLOR, VITE_BRAND_COLOR_DARK, VITE_BRAND_RADIUS.
 */
export type Branding = {
  name: string
  /** Accent: active nav icon, links, sort arrows, selection tint. */
  color: string
  /** Softer accent for dark mode (saturated colors glare on dark backgrounds). */
  colorDark: string
  /** Base corner radius; all rounded-* tokens derive from it. */
  radius: string
}

const env = import.meta.env

export const BRANDING: Branding = {
  name: env.VITE_BRAND_NAME ?? "Tago Admin",
  color: env.VITE_BRAND_COLOR ?? "var(--prep-blue-500)",
  colorDark: env.VITE_BRAND_COLOR_DARK ?? "var(--prep-blue-400)",
  radius: env.VITE_BRAND_RADIUS ?? "0.5rem",
}

/** Writes the branding into CSS variables; call once before render. */
export function applyBranding(b: Branding = BRANDING) {
  document.title = b.name
  let style = document.getElementById("branding") as HTMLStyleElement | null
  if (!style) {
    style = document.createElement("style")
    style.id = "branding"
    document.head.appendChild(style)
  }
  style.textContent = `:root{--brand:${b.color};--radius:${b.radius}}.dark{--brand:${b.colorDark}}`
}
