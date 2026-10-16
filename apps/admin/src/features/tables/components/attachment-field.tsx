import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Attachment01Icon, Cancel01Icon, CloudUploadIcon, Download01Icon, File01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"
import { attachmentsApi, formatFileSize, MAX_ATTACHMENT_SIZE } from "../api/attachments.api"
import { useAttachmentsStore } from "../store/attachments.store"
import type { TableField } from "../types/table"

const CHIP = { sm: "h-5 text-[11px]", md: "h-[22px] text-xs" }

/** List-cell / kanban rendering: first file name + count. */
export function AttachmentSummary({ ids, size = "sm", className }: { ids: string[]; size?: "sm" | "md"; className?: string }) {
  const files = useAttachmentsStore((s) => s.files)
  const first = files[ids[0]]
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-1.5 font-medium whitespace-nowrap text-muted-foreground", CHIP[size], className)} title={ids.map((id) => files[id]?.name ?? "").join("\n")}>
      <HugeiconsIcon icon={Attachment01Icon} className="size-3 shrink-0" />
      <span className="truncate">{first ? first.name : `${ids.length} tệp`}</span>
      {first && ids.length > 1 && <span className="shrink-0">+{ids.length - 1}</span>}
    </span>
  )
}

/** Detail rendering: one row per file with name, size, download and (optionally) remove. */
export function AttachmentList({ ids, onRemove, className }: { ids: string[]; onRemove?: (id: string) => void; className?: string }) {
  const files = useAttachmentsStore((s) => s.files)
  if (!ids.length) return null
  return (
    <ul className={cn("grid gap-1.5", className)}>
      {ids.map((id) => {
        const f = files[id]
        return (
          <li key={id} className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm">
            <HugeiconsIcon icon={File01Icon} className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate" title={f?.name}>{f?.name ?? "Tệp không còn tồn tại"}</span>
            {f && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatFileSize(f.size)}</span>}
            {f && (
              <a href={f.dataUrl} download={f.name} onClick={(e) => e.stopPropagation()} aria-label={`Tải xuống ${f.name}`} title="Tải xuống" className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                <HugeiconsIcon icon={Download01Icon} className="size-4" />
              </a>
            )}
            {onRemove && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(id) }} aria-label={`Gỡ ${f?.name ?? "tệp"}`} title="Gỡ tệp" className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Upload control for ATTACHMENT fields (form + inline): files go to the mock storage, the value keeps their ids. */
export function AttachmentInput({ field, value, onChange, invalid, id }: { field: TableField; value: string[]; onChange: (v: string[]) => void; invalid?: boolean; id?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const canAdd = field.allowMultiple || value.length === 0

  const add = async (list: FileList | null) => {
    if (!list?.length) return
    setError("")
    setBusy(true)
    const picked = field.allowMultiple ? [...list] : [list[0]]
    const ids: string[] = []
    const errors: string[] = []
    for (const file of picked) {
      try {
        ids.push((await attachmentsApi.upload(file, field.accept)).id)
      } catch (e) {
        errors.push((e as Error).message)
      }
    }
    setBusy(false)
    if (errors.length) setError(errors.join(". "))
    if (ids.length) onChange(field.allowMultiple ? [...value, ...ids] : ids)
    if (input.current) input.current.value = ""
  }

  return (
    <div className="grid gap-2">
      <AttachmentList ids={value} onRemove={(x) => onChange(value.filter((v) => v !== x))} />
      {canAdd && (
        <button
          type="button"
          id={id}
          disabled={busy}
          aria-invalid={invalid || undefined}
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void add(e.dataTransfer.files)
          }}
          className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-input bg-background px-3 py-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50 aria-invalid:border-destructive disabled:opacity-60"
        >
          <HugeiconsIcon icon={CloudUploadIcon} className="size-5" />
          <span>{busy ? "Đang tải tệp lên…" : field.placeholder || "Kéo thả hoặc bấm để chọn tệp"}</span>
          <span className="text-xs">
            Tối đa {formatFileSize(MAX_ATTACHMENT_SIZE)} mỗi tệp{field.accept ? ` · ${field.accept}` : ""}
          </span>
        </button>
      )}
      <input ref={input} type="file" hidden multiple={!!field.allowMultiple} accept={field.accept || undefined} onChange={(e) => void add(e.target.files)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
