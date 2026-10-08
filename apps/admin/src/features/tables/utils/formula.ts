import type { RecordData } from "../types/table"

/**
 * Tiny, safe formula engine — no eval. Grammar:
 *   formula := AGG "(" expr | "*" ")" | expr
 *   expr    := term (("+" | "-") term)*
 *   term    := factor (("*" | "/") factor)*
 *   factor  := number | field_name | "(" expr ")" | "-" factor
 * AGG ∈ SUM, AVG, MIN, MAX, COUNT. Unknown / blank fields count as 0.
 */
type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string }

function tokenize(src: string): Token[] {
  const out: Token[] = []
  const re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][\w.]*)|([-+*/()]))/y
  let m: RegExpExecArray | null
  let i = 0
  while (i < src.length) {
    re.lastIndex = i
    m = re.exec(src)
    if (!m) {
      if (/^\s*$/.test(src.slice(i))) break
      throw new Error(`Ký tự không hợp lệ tại vị trí ${i + 1}`)
    }
    if (m[1]) out.push({ t: "num", v: Number(m[1]) })
    else if (m[2]) out.push({ t: "id", v: m[2] })
    else out.push({ t: "op", v: m[3] })
    i = re.lastIndex
  }
  return out
}

function evalExpr(tokens: Token[], row: RecordData): number {
  let pos = 0
  const peek = () => tokens[pos]
  const take = () => tokens[pos++]
  const factor = (): number => {
    const tk = take()
    if (!tk) throw new Error("Công thức chưa hoàn chỉnh")
    if (tk.t === "num") return tk.v
    if (tk.t === "id") {
      const n = Number(row[tk.v])
      return Number.isFinite(n) ? n : 0
    }
    if (tk.v === "-") return -factor()
    if (tk.v === "(") {
      const v = expr()
      if (take()?.v !== ")") throw new Error("Thiếu dấu )")
      return v
    }
    throw new Error(`Không mong đợi “${tk.v}”`)
  }
  const term = (): number => {
    let v = factor()
    while (peek()?.t === "op" && (peek()!.v === "*" || peek()!.v === "/")) {
      const op = take().v
      const r = factor()
      v = op === "*" ? v * r : r === 0 ? 0 : v / r
    }
    return v
  }
  const expr = (): number => {
    let v = term()
    while (peek()?.t === "op" && (peek()!.v === "+" || peek()!.v === "-")) v = take().v === "+" ? v + term() : v - term()
    return v
  }
  const v = expr()
  if (pos < tokens.length) throw new Error("Thừa ký tự cuối công thức")
  return v
}

/** Evaluates `formula` over `rows`; plain expressions are summed over rows. */
export function evaluateFormula(formula: string, rows: RecordData[]): number {
  const m = formula.trim().match(/^(SUM|AVG|MIN|MAX|COUNT)\s*\(([\s\S]*)\)$/i)
  const fn = m ? m[1].toUpperCase() : "SUM"
  const body = m ? m[2].trim() : formula
  if (fn === "COUNT" && (body === "*" || body === "")) return rows.length
  const tokens = tokenize(body)
  const vals = rows.map((r) => evalExpr(tokens, r))
  if (fn === "COUNT") return vals.filter((v) => v !== 0).length
  if (!vals.length) return 0
  if (fn === "AVG") return vals.reduce((a, b) => a + b, 0) / vals.length
  if (fn === "MIN") return Math.min(...vals)
  if (fn === "MAX") return Math.max(...vals)
  return vals.reduce((a, b) => a + b, 0)
}

/** Returns an error message, or null when the formula parses. */
export function checkFormula(formula: string): string | null {
  try {
    evaluateFormula(formula, [{}])
    return null
  } catch (e) {
    return (e as Error).message
  }
}

/** Field names a formula refers to (for "trường phụ thuộc" hints). */
export const formulaFields = (formula: string) =>
  [...new Set((formula.match(/[A-Za-z_][\w.]*/g) ?? []).filter((w) => !/^(SUM|AVG|MIN|MAX|COUNT)$/i.test(w)))]
