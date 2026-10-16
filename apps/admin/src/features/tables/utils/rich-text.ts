/** Formatted-text helpers (Văn bản có định dạng). Values are HTML; older values may be plain text. */

const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "S", "A", "P", "DIV", "BR", "UL", "OL", "LI", "BLOCKQUOTE", "H3", "H4", "SPAN"])

export const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*?>/i.test(s)

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Plain text → minimal HTML (keeps line breaks). */
export const textToHtml = (s: string) => escapeHtml(s).replace(/\r?\n/g, "<br>")

/** Keeps a small whitelist of formatting tags; drops scripts, styles, event handlers and non-http(s) links. */
export function sanitizeHtml(html: string): string {
  if (!html) return ""
  if (typeof DOMParser === "undefined") return escapeHtml(html)
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  const clean = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove()
        continue
      }
      const el = child as Element
      if (!ALLOWED.has(el.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(el.tagName)) el.remove()
        else {
          clean(el)
          el.replaceWith(...el.childNodes)
        }
        continue
      }
      for (const attr of [...el.attributes]) {
        const keep = el.tagName === "A" && attr.name === "href" && /^(https?:|mailto:|tel:)/i.test(attr.value.trim())
        if (!keep) el.removeAttribute(attr.name)
      }
      if (el.tagName === "A") {
        el.setAttribute("target", "_blank")
        el.setAttribute("rel", "noreferrer")
      }
      clean(el)
    }
  }
  clean(doc.body)
  const out = doc.body.innerHTML
  // An editor left with only empty blocks counts as blank.
  return htmlToText(out).trim() ? out : ""
}

/** HTML → plain text (search, list cells, CSV, character limits). */
export function htmlToText(value: string): string {
  if (!value || !looksLikeHtml(value)) return value ?? ""
  if (typeof DOMParser === "undefined") return value.replace(/<[^>]+>/g, " ")
  const doc = new DOMParser().parseFromString(value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h3|h4)>/gi, "$&\n"), "text/html")
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim()
}

/** Value ready for an editor / renderer: sanitised HTML, plain text converted. */
export const toDisplayHtml = (value: string) => (looksLikeHtml(value) ? sanitizeHtml(value) : textToHtml(value))
