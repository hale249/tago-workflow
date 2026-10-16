import { useAttachmentsStore } from "../store/attachments.store"
import type { Attachment } from "../types/table"
import { nowIso, uid } from "../utils/fields"

/** Per-file cap of the mock storage. */
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024

const store = useAttachmentsStore

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
}

/** Does `file` match an accept list like "image/*, .pdf, application/zip"? Empty list accepts everything. */
export function acceptsFile(accept: string | undefined, file: { name: string; type: string }) {
  const rules = (accept ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
  if (!rules.length) return true
  const name = file.name.toLowerCase()
  const type = (file.type || "").toLowerCase()
  return rules.some((r) => (r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r))
}

const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const attachmentsApi = {
  /** Stores the file and returns its metadata; throws a user-facing message when rejected. */
  async upload(file: File, accept?: string): Promise<Attachment> {
    if (file.size > MAX_ATTACHMENT_SIZE) throw new Error(`“${file.name}” lớn hơn ${formatFileSize(MAX_ATTACHMENT_SIZE)}`)
    if (!acceptsFile(accept, file)) throw new Error(`“${file.name}” không đúng loại tệp cho phép (${accept})`)
    const a: Attachment = { id: uid(), name: file.name, size: file.size, type: file.type || "application/octet-stream", dataUrl: await readDataUrl(file), createdAt: nowIso() }
    store.setState((s) => ({ files: { ...s.files, [a.id]: a } }))
    return a
  },
  get: (id: string): Attachment | undefined => store.getState().files[id],
  /** Drops stored files (when a record no longer references them). */
  remove(ids: string[]) {
    if (!ids.length) return
    store.setState((s) => {
      const files = { ...s.files }
      for (const id of ids) delete files[id]
      return { files }
    })
  },
}
