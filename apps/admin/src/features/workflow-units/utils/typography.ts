import type { CSSProperties } from "react"

/** Inline type-ramp styles matching the reference UI (theme vars from globals.css). */
export function headingStyle(level: 1 | 2 | 3 | 4 | 5 | 6): CSSProperties {
  const v = `--font-heading-h${level}`
  return {
    fontSize: `var(${v}-size)`,
    lineHeight: `var(${v}-line-height)`,
    fontWeight: `var(${v}-weight)`,
    letterSpacing: `var(${v}-letter-spacing)`,
    fontFamily: `var(${v}-family)`,
  }
}

export function bodyStyle(size: "small" | "default" | "large"): CSSProperties {
  const v = `--font-body-${size}`
  return {
    fontSize: `var(${v}-size)`,
    lineHeight: `var(${v}-line-height)`,
    fontWeight: "var(--font-weight-regular)",
    fontFamily: `var(${v}-family)`,
    letterSpacing: `var(${v}-letter-spacing)`,
  }
}
