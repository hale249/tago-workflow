import type { CSSProperties } from "react"

type TypeToken = "heading-h1" | "heading-h2" | "heading-h3" | "body-default" | "body-small"

/** Inline style that applies one of the reference type-ramp tokens (size / line-height / weight / tracking / family). */
export function typeStyle(token: TypeToken): CSSProperties {
  return {
    fontSize: `var(--font-${token}-size)`,
    lineHeight: `var(--font-${token}-line-height)`,
    fontWeight: `var(--font-${token}-weight)`,
    letterSpacing: `var(--font-${token}-letter-spacing)`,
    fontFamily: `var(--font-${token}-family)`,
  }
}

export const H1_STYLE = typeStyle("heading-h1")
export const H2_STYLE = typeStyle("heading-h2")
export const BODY_DEFAULT_STYLE = typeStyle("body-default")
export const BODY_SMALL_STYLE = typeStyle("body-small")
