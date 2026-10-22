import { useRef, useState, type ChangeEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, ArrowLeft01Icon, Clock01Icon, Download01Icon, FileSpreadsheetIcon, FileUploadIcon, Loading03Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Select } from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { identifierFields, importSheet, recordHistory, type ImportResult } from "../api/excel-import.api"
import { tableKeys } from "../api/tables.queries"
import { useImportHistoryStore, type ImportHistoryEntry } from "../store/import-history.store"
import type { ActiveTable } from "../types/table"
import { autoMatch, cellText, columnLetter, downloadErrorReport, downloadTemplate, ExcelImportError, readFirstSheet, XLSX_ACCEPT, type SheetRows } from "../utils/excel"
import { formatDateValue } from "../utils/fields"

const BTN8 = "h-8 gap-1.5 px-2.5 has-[>svg]:px-2"
const FOOTER_BTN = "h-8 gap-1.5 px-3 py-1.5 has-[>svg]:px-2.5"
const HISTORY_PAGE = 10
const MAX_LISTED_ERRORS = 50

/** "Nhập Excel" button for the records page header; owns the dialog so an import keeps running when it is closed. */
export function ImportExcelButton({ table, className }: { table: ActiveTable; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" className={cn("h-8 gap-1.5 px-2.5 has-[>svg]:px-2", className)} onClick={() => setOpen(true)} aria-label="Nhập Excel">
        <HugeiconsIcon icon={FileUploadIcon} className="size-3.5" />Nhập Excel
      </Button>
      <ImportExcelDialog table={table} open={open} onOpenChange={setOpen} />
    </>
  )
}

type Phase = { kind: "idle" } | { kind: "running"; done: number; total: number } | { kind: "done"; result: ImportResult } | { kind: "error" }

export function ImportExcelDialog({ table, open, onOpenChange }: { table: ActiveTable; open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<"main" | "history">("main")
  const [file, setFile] = useState<File | null>(null)
  const [sheet, setSheet] = useState<SheetRows | null>(null)
  const [mapping, setMapping] = useState<string[]>([])
  const [identifier, setIdentifier] = useState("")
  const [update, setUpdate] = useState(false)
  const [reading, setReading] = useState(false)
  const [notice, setNotice] = useState("")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })

  const fields = table.config.fields
  const idCandidates = identifierFields(fields)
  const mappedCount = mapping.filter(Boolean).length
  const idField = idCandidates.find((f) => f.name === identifier && mapping.includes(f.name))

  const reset = () => {
    setFile(null)
    setSheet(null)
    setMapping([])
    setIdentifier("")
    setUpdate(false)
    setNotice("")
    setPhase({ kind: "idle" })
  }
  const changeOpen = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setView("main")
      if (phase.kind !== "running") reset()
    }
  }

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = "" // picking the same file again still fires onChange
    if (!f) return
    setReading(true)
    setNotice("")
    try {
      const s = await readFirstSheet(f)
      setFile(f)
      setSheet(s)
      setMapping(autoMatch(s.headers, fields))
      setIdentifier("")
      setUpdate(false)
    } catch (err) {
      setNotice(err instanceof ExcelImportError ? err.message : "Không đọc được file. Hãy chọn file .xlsx hợp lệ.")
    } finally {
      setReading(false)
    }
  }

  const template = () => downloadTemplate(table.name, fields).catch(() => setNotice("Không tải được file mẫu. Vui lòng thử lại."))

  const run = async () => {
    if (!file || !sheet || !mappedCount) return
    setNotice("")
    setPhase({ kind: "running", done: 0, total: sheet.rows.length })
    try {
      const result = await importSheet(table, file.name, sheet, { mapping, identifier: idField?.name ?? "", update: !!idField && update }, (done, total) =>
        setPhase({ kind: "running", done, total }),
      )
      setPhase({ kind: "done", result })
    } catch {
      recordHistory(table.id, file.name, { total: sheet.rows.length, created: 0, updated: 0, failed: sheet.rows.length, status: "failed" })
      setPhase({ kind: "error" })
    } finally {
      qc.invalidateQueries({ queryKey: tableKeys.all })
    }
  }

  const downloadErrors = (r: ImportResult) =>
    file && sheet && downloadErrorReport(file.name, sheet.headers, r.errors).catch(() => setNotice("Không tải được file lỗi. Vui lòng thử lại."))

  const setColumn = (i: number, name: string) => {
    setMapping((m) => m.map((v, j) => (j === i ? name : v)))
    if (!name && mapping[i] === identifier) setIdentifier("")
  }

  const result = phase.kind === "done" ? phase.result : null
  const failedAll = phase.kind === "error" || result?.status === "failed"
  const title = view === "history" ? "Lịch sử nhập" : result || phase.kind === "error" ? (failedAll ? "Nhập dữ liệu thất bại" : "Kết quả nhập dữ liệu") : "Nhập dữ liệu từ Excel"

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-4 overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6 tracking-tight">
            {title}
            {view === "main" ? (
              <Button variant="ghost" className="h-7 gap-1.5 px-2.5 text-muted-foreground has-[>svg]:px-2" onClick={() => setView("history")}>
                <HugeiconsIcon icon={Clock01Icon} className="size-4" />Lịch sử nhập
              </Button>
            ) : (
              <Button variant="ghost" className="h-7 gap-1.5 px-2.5 text-muted-foreground has-[>svg]:px-2" onClick={() => setView("main")}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />Quay lại
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">Chọn file Excel có dòng đầu là tên cột. Sau đó bạn ghép từng cột với trường dữ liệu.</DialogDescription>
        </DialogHeader>

        {view === "history" ? (
          <ImportHistory tableId={table.id} running={phase.kind === "running" ? file?.name ?? "" : null} />
        ) : phase.kind === "running" ? (
          <div className="flex flex-col gap-3 rounded-md border border-border px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-muted-foreground" />
              {phase.done === 0 ? "Đang tải file lên…" : "Đang nhập dữ liệu…"}
              <span className="ml-auto text-muted-foreground tabular-nums">{phase.done}/{phase.total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${phase.total ? (phase.done / phase.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Đóng cửa sổ hay tắt trang không dừng việc nhập. Hệ thống sẽ báo khi có kết quả.</p>
          </div>
        ) : phase.kind === "error" ? (
          <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />Không thể nhập dữ liệu. Vui lòng thử lại.
          </p>
        ) : result ? (
          <ImportResultView result={result} onDownloadErrors={() => downloadErrors(result)} />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <input ref={fileRef} type="file" accept={XLSX_ACCEPT} className="hidden" onChange={pick} />
            <div className="flex min-w-0 flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <HugeiconsIcon icon={FileSpreadsheetIcon} className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  {file && sheet ? (
                    <>
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{sheet.rows.length} dòng · {sheet.headers.length} cột</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chọn file Excel có dòng đầu là tên cột. Sau đó bạn ghép từng cột với trường dữ liệu.</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="ghost" className={BTN8} onClick={template}><HugeiconsIcon icon={Download01Icon} className="size-4" />Tải file mẫu</Button>
                <Button type="button" variant="outline" className={BTN8} disabled={reading} onClick={() => fileRef.current?.click()}>
                  {reading && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />}{file ? "Đổi file" : "Chọn file .xlsx"}
                </Button>
              </div>
            </div>

            {notice && <Notice>{notice}</Notice>}

            {sheet && (
              <>
                <div className="max-h-[45dvh] min-w-0 overflow-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="w-12 px-3 py-2 font-medium">Cột</th>
                        <th className="px-3 py-2 font-medium">Tiêu đề</th>
                        <th className="px-3 py-2 font-medium max-sm:hidden">Ví dụ</th>
                        <th className="w-56 px-3 py-2 font-medium">Trường dữ liệu</th>
                        {idCandidates.length > 0 && <th className="w-24 px-3 py-2 text-center font-medium">Khoá định danh</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sheet.headers.map((h, i) => {
                        const example = sheet.rows.map((r) => cellText(r.cells[i])).find(Boolean) ?? ""
                        const canBeId = idCandidates.some((f) => f.name === mapping[i])
                        return (
                          <tr key={i} className={cn(!mapping[i] && "text-muted-foreground")}>
                            <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{columnLetter(i)}</td>
                            <td className="max-w-48 truncate px-3 py-1.5 font-medium" title={h}>{h || <span className="font-normal text-muted-foreground italic">(không có tiêu đề)</span>}</td>
                            <td className="max-w-48 truncate px-3 py-1.5 text-muted-foreground max-sm:hidden" title={example}>{example}</td>
                            <td className="px-3 py-1">
                              <Select className="h-8 bg-background" value={mapping[i] ?? ""} onChange={(e) => setColumn(i, e.target.value)} aria-label={`Chọn trường cho cột ${columnLetter(i)}`}>
                                <option value="">Bỏ cột</option>
                                {fields.map((f) => (
                                  <option key={f.name} value={f.name} disabled={mapping.some((m, j) => j !== i && m === f.name)}>{f.label}</option>
                                ))}
                              </Select>
                            </td>
                            {idCandidates.length > 0 && (
                              <td className="px-3 py-1.5 text-center">
                                <input
                                  type="radio"
                                  name="import-identifier"
                                  className="size-4 accent-brand disabled:opacity-30"
                                  disabled={!canBeId}
                                  checked={canBeId && identifier === mapping[i]}
                                  onChange={() => setIdentifier(mapping[i]!)}
                                  onClick={() => identifier === mapping[i] && setIdentifier("")}
                                  aria-label={`Khoá định danh: ${h}`}
                                />
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-md border border-border px-3 py-2.5">
                  {idCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bảng chưa có trường nào bật Giá trị duy nhất để làm khoá định danh.</p>
                  ) : !idField ? (
                    <p className="text-sm text-muted-foreground">Đánh dấu một trường có giá trị duy nhất làm khoá định danh để cập nhật bản ghi đã tồn tại.</p>
                  ) : (
                    <label className="flex cursor-pointer items-start gap-3">
                      <Switch checked={update} onChange={setUpdate} label="Cập nhật bản ghi đã tồn tại" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">Cập nhật bản ghi đã tồn tại <span className="font-normal text-muted-foreground">· {idField.label}</span></span>
                        <span className="block text-xs text-muted-foreground">Bản ghi trùng khoá định danh được cập nhật, dòng chi tiết được thay toàn bộ. Tắt thì mọi dòng đều tạo bản ghi mới.</span>
                      </span>
                    </label>
                  )}
                </div>

                {mappedCount === 0 && <Notice>Chọn ít nhất một trường của bản ghi, không tính dòng chi tiết.</Notice>}
              </>
            )}
          </div>
        )}

        {view === "main" && (
          <DialogFooter>
            {result || phase.kind === "error" ? (
              <>
                <Button variant="outline" className={FOOTER_BTN} onClick={reset}>Nhập file khác</Button>
                {phase.kind === "error" ? (
                  <Button className={FOOTER_BTN} onClick={run}>Thử lại</Button>
                ) : (
                  <Button className={FOOTER_BTN} onClick={() => changeOpen(false)}>Đóng</Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" className={FOOTER_BTN} onClick={() => changeOpen(false)}>{phase.kind === "running" ? "Đóng" : "Hủy"}</Button>
                <Button className={FOOTER_BTN} disabled={!sheet || !mappedCount || !sheet.rows.length || phase.kind === "running"} onClick={run}>
                  {phase.kind === "running" ? "Đang nhập…" : "Nhập dữ liệu"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Notice({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <HugeiconsIcon icon={AlertCircleIcon} className="mt-0.5 size-4 shrink-0" />{children}
    </p>
  )
}

function ImportResultView({ result, onDownloadErrors }: { result: ImportResult; onDownloadErrors: () => void }) {
  const stats = [
    { label: "Tổng bản ghi", value: result.total, className: "" },
    { label: "Tạo mới", value: result.created, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Cập nhật", value: result.updated, className: "text-brand" },
    { label: "Lỗi", value: result.failed, className: result.failed ? "text-destructive" : "" },
  ]
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums", s.className)}>{s.value}</p>
          </div>
        ))}
      </div>
      {result.created + result.updated === 0 && <p className="text-sm text-muted-foreground">Không có bản ghi nào được tạo mới hoặc cập nhật.</p>}
      {result.errors.length > 0 && (
        <div className="flex min-w-0 flex-col gap-2">
          <ul className="max-h-60 divide-y overflow-y-auto rounded-md border border-border text-sm">
            {result.errors.slice(0, MAX_LISTED_ERRORS).map((e) => (
              <li key={e.line} className="flex gap-3 px-3 py-1.5">
                <span className="w-16 shrink-0 text-muted-foreground tabular-nums">Dòng {e.line}</span>
                <span className="min-w-0 text-destructive">{e.message}</span>
              </li>
            ))}
          </ul>
          <div>
            <Button variant="outline" className={BTN8} onClick={onDownloadErrors}><HugeiconsIcon icon={Download01Icon} className="size-4" />Tải báo cáo lỗi đối soát (.xlsx)</Button>
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS: Record<ImportHistoryEntry["status"] | "processing", { label: string; className: string }> = {
  completed: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  failed: { label: "Thất bại", className: "bg-destructive/10 text-destructive" },
  processing: { label: "Đang xử lý", className: "bg-brand/8 text-brand" },
}

function StatusBadge({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status]
  return <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium", s.className)}>{s.label}</span>
}

function ImportHistory({ tableId, running }: { tableId: string; running: string | null }) {
  const all = useImportHistoryStore((s) => s.entries)
  const entries = all.filter((e) => e.tableId === tableId)
  const [shown, setShown] = useState(HISTORY_PAGE)
  if (!entries.length && running === null) return <p className="py-8 text-center text-sm text-muted-foreground">Bảng này chưa có lần nhập nào.</p>
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ul className="divide-y rounded-md border border-border">
        {running !== null && (
          <li className="flex items-center gap-3 px-3 py-2.5">
            <HugeiconsIcon icon={FileSpreadsheetIcon} className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{running}</p>
            <StatusBadge status="processing" />
          </li>
        )}
        {entries.slice(0, shown).map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
            <HugeiconsIcon icon={FileSpreadsheetIcon} className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={e.fileName}>{e.fileName}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDateValue(e.at, true)} · Tổng bản ghi {e.total} · Tạo mới {e.created} · Cập nhật {e.updated} · Lỗi {e.failed}
              </p>
            </div>
            <StatusBadge status={e.status} />
          </li>
        ))}
      </ul>
      {entries.length > shown && (
        <Button variant="outline" className={cn(BTN8, "self-center")} onClick={() => setShown((n) => n + HISTORY_PAGE)}>Tải thêm</Button>
      )}
    </div>
  )
}
