import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateTable, useCreateWorkGroup, useWorkGroups } from "../api/tables.queries"
import { TEMPLATES } from "../data/table-templates"
import type { TableTemplate } from "../types/table"
import { FormRow, NativeSelect, Textarea } from "./form-controls"
import { TableIcon } from "./table-icon"

const NEW_GROUP = "__new__"

export function CreateTableDialog({ open, onOpenChange, defaultGroupId }: { open: boolean; onOpenChange: (o: boolean) => void; defaultGroupId?: string }) {
  const navigate = useNavigate()
  const { data: groups = [] } = useWorkGroups()
  const createTable = useCreateTable()
  const createGroup = useCreateWorkGroup()
  const [template, setTemplate] = useState<TableTemplate>("BLANK")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState("")
  const [groupName, setGroupName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setTemplate("BLANK")
    setName("")
    setDescription("")
    setGroupId(defaultGroupId ?? groups[0]?.id ?? NEW_GROUP)
    setGroupName("")
    setError("")
  }, [open, defaultGroupId, groups])

  const pending = createTable.isPending || createGroup.isPending

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError("Tên bảng là bắt buộc")
    if (groupId === NEW_GROUP && !groupName.trim()) return setError("Nhập tên nhóm mới")
    const wg = groupId === NEW_GROUP ? (await createGroup.mutateAsync({ name: groupName })).id : groupId
    const t = await createTable.mutateAsync({ name, description, workGroupId: wg, template })
    onOpenChange(false)
    navigate(`/tables/${t.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo bảng mới</DialogTitle>
          <DialogDescription>Chọn mẫu có sẵn hoặc bắt đầu từ bảng trống. Có thể chỉnh trường sau khi tạo.</DialogDescription>
        </DialogHeader>
        <form id="create-table" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t.id)
                  if (!name || TEMPLATES.some((x) => x.name === name)) setName(t.id === "BLANK" ? "" : t.name)
                }}
                className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60", template === t.id && "border-brand ring-1 ring-brand")}
              >
                <TableIcon icon={t.icon} color={t.iconColor} />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </span>
              </button>
            ))}
          </div>
          <FormRow label="Tên bảng" required error={error && !name.trim() ? error : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Khách hàng" autoFocus />
          </FormRow>
          <FormRow label="Nhóm">
            <NativeSelect value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              <option value={NEW_GROUP}>+ Tạo nhóm mới…</option>
            </NativeSelect>
          </FormRow>
          {groupId === NEW_GROUP && (
            <FormRow label="Tên nhóm mới" required error={error && !groupName.trim() ? error : undefined}>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </FormRow>
          )}
          <FormRow label="Mô tả">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </FormRow>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Huỷ</Button>
          <Button type="submit" form="create-table" disabled={pending}>{pending ? "Đang tạo…" : "Tạo bảng"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
