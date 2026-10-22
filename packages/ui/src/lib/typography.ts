import type { CSSProperties } from "react"

export type TypeToken = `heading-h${1 | 2 | 3 | 4 | 5 | 6}` | `body-${"small" | "default" | "large"}`

/** Inline style applying one reference type-ramp token (size / line-height / weight / tracking / family vars from globals.css). */
export function typeStyle(token: TypeToken, weight?: CSSProperties["fontWeight"]): CSSProperties {
  return {
    fontSize: `var(--font-${token}-size)`,
    lineHeight: `var(--font-${token}-line-height)`,
    fontWeight: weight ?? `var(--font-${token}-weight)`,
    letterSpacing: `var(--font-${token}-letter-spacing)`,
    fontFamily: `var(--font-${token}-family)`,
  }
}

export const headingStyle = (level: 1 | 2 | 3 | 4 | 5 | 6) => typeStyle(`heading-h${level}`)
export const bodyStyle = (size: "small" | "default" | "large", weight?: CSSProperties["fontWeight"]) => typeStyle(`body-${size}`, weight)

/** The common ramp steps, precomputed. */
export const TYPE = {
  h1: headingStyle(1),
  h2: headingStyle(2),
  h3: headingStyle(3),
  h4: headingStyle(4),
  body: bodyStyle("default"),
  bodyMedium: bodyStyle("default", "var(--font-weight-medium)"),
  small: bodyStyle("small"),
  smallMedium: bodyStyle("small", "var(--font-weight-medium)"),
} satisfies Record<string, CSSProperties>
