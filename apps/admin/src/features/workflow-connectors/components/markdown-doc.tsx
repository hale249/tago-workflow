import type { ReactNode } from "react"

/** Inline `code` spans. */
const inline = (s: string): ReactNode[] => s.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") && p.endsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code> : p))

/**
 * Minimal markdown renderer (headings, paragraphs, `-` lists, fenced code, `|` tables, `---`).
 * Elements are left unstyled on purpose: the reference renders its docs with bare preflight styles.
 */
export function MarkdownDoc({ source }: { source: string }) {
  const lines = source.split("\n")
  const out: ReactNode[] = []
  for (let i = 0; i < lines.length; ) {
    const line = lines[i]!
    const k = out.length
    if (!line.trim()) { i++; continue }
    if (line.startsWith("```")) {
      const code: string[] = []
      for (i++; i < lines.length && !lines[i]!.startsWith("```"); i++) code.push(lines[i]!)
      i++
      out.push(<pre key={k} className="overflow-x-auto"><code>{code.join("\n")}</code></pre>)
    } else if (line.trim() === "---") {
      out.push(<hr key={k} />); i++
    } else if (/^#{1,3} /.test(line)) {
      const level = line.indexOf(" ")
      const Tag = (["h1", "h2", "h3"] as const)[level - 1]!
      out.push(<Tag key={k}>{inline(line.slice(level + 1))}</Tag>); i++
    } else if (line.startsWith("- ")) {
      const items: string[] = []
      for (; i < lines.length && lines[i]!.startsWith("- "); i++) items.push(lines[i]!.slice(2))
      out.push(<ul key={k}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
    } else if (line.startsWith("|")) {
      const rows: string[][] = []
      for (; i < lines.length && lines[i]!.startsWith("|"); i++) rows.push(lines[i]!.split("|").slice(1, -1).map((c) => c.trim()))
      const [head = [], ...body] = rows
      out.push(
        <table key={k}>
          <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>,
      )
    } else {
      out.push(<p key={k}>{inline(line)}</p>); i++
    }
  }
  return <div className="max-w-none text-[14px] text-foreground">{out}</div>
}
