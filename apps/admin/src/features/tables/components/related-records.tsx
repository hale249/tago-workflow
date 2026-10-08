import { useState } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useRecords, useTable } from "../api/tables.queries"
import type { RefRecordsConfig, TableField, WorkspaceUser } from "../types/table"
import { FieldValue } from "./field-value"
import { RecordFormDialog } from "./record-form-dialog"

/** Records in another table whose reference field points at this record. */
export function RelatedRecords({ config, recordId, users }: { config: RefRecordsConfig; recordId: string; users: WorkspaceUser[] }) {
  const navigate = useNavigate()
  const { data: table } = useTable(config.refTableId)
  const { data: records = [] } = useRecords(config.refTableId, { filters: { [config.refField]: recordId } })
  const [open, setOpen] = useState(false)
  if (!table) return null
  const cols = config.displayFields.map((n) => table.config.fields.find((f) => f.name === n)).filter((f): f is TableField => !!f)

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">{config.title} <span className="font-normal text-muted-foreground">· {records.length}</span></h3>
        <Button size="xs" variant="ghost" onClick={() => setOpen(true)}><Plus />Thêm</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              {cols.map((c) => <th key={c.name} className="px-4 py-2 font-medium">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/tables/${table.id}/records/${r.id}`)} className="cursor-pointer border-t hover:bg-muted/50">
                {cols.map((c) => <td key={c.name} className="max-w-60 px-4 py-2"><FieldValue field={c} value={r.record[c.name]} users={users} /></td>)}
              </tr>
            ))}
            {!records.length && (
              <tr><td colSpan={cols.length || 1} className="px-4 py-6 text-center text-xs text-muted-foreground">Chưa có bản ghi liên quan</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <RecordFormDialog table={table} open={open} onOpenChange={setOpen} initial={{ [config.refField]: recordId }} />
    </div>
  )
}
