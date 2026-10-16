import { useEffect, useRef } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { LeftToRightListBulletIcon, LeftToRightListNumberIcon, Link01Icon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"
import { sanitizeHtml, toDisplayHtml } from "../utils/rich-text"

const TOOLS: { cmd: string; label: string; icon: IconSvgElement }[] = [
  { cmd: "bold", label: "In đậm", icon: TextBoldIcon },
  { cmd: "italic", label: "In nghiêng", icon: TextItalicIcon },
  { cmd: "underline", label: "Gạch chân", icon: TextUnderlineIcon },
  { cmd: "insertUnorderedList", label: "Danh sách dấu chấm", icon: LeftToRightListBulletIcon },
  { cmd: "insertOrderedList", label: "Danh sách đánh số", icon: LeftToRightListNumberIcon },
  { cmd: "createLink", label: "Chèn liên kết", icon: Link01Icon },
]

/** Preflight strips list / link styles — restore them inside formatted text. */
const PROSE = "[&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3"

type Props = { value: string; onChange: (html: string) => void; placeholder?: string; invalid?: boolean; id?: string; "aria-label"?: string; "aria-describedby"?: string }

/** Small formatted-text editor (bold / italic / underline / lists / links); emits sanitised HTML. */
export function RichTextEditor({ value, onChange, placeholder, invalid, id, ...aria }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef<string | null>(null)

  // Only push outside changes into the DOM — rewriting on every keystroke would reset the caret.
  useEffect(() => {
    if (!ref.current || value === last.current) return
    ref.current.innerHTML = toDisplayHtml(value ?? "")
    last.current = value
  }, [value])

  const emit = () => {
    const html = sanitizeHtml(ref.current?.innerHTML ?? "")
    last.current = html
    onChange(html)
  }

  const run = (cmd: string) => {
    ref.current?.focus()
    if (cmd === "createLink") {
      const url = window.prompt("Đường dẫn (https://…)")?.trim()
      if (!url) return
      document.execCommand(cmd, false, /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`)
    } else document.execCommand(cmd)
    emit()
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring", invalid && "border-destructive")}>
      <div className="flex items-center gap-0.5 border-b bg-muted/40 px-1 py-1">
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t.cmd)}
            className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon icon={t.icon} className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        id={id}
        role="textbox"
        aria-multiline
        aria-invalid={invalid || undefined}
        {...aria}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || "Nhập nội dung…"}
        onInput={emit}
        onBlur={emit}
        className={cn(PROSE, "min-h-28 px-3 py-2 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]")}
      />
    </div>
  )
}

/** Read-only formatted text. */
export function RichTextView({ value, className }: { value: string; className?: string }) {
  return <div className={cn(PROSE, "text-sm break-words", className)} dangerouslySetInnerHTML={{ __html: toDisplayHtml(value) }} />
}
