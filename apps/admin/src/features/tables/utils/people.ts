import type { RecordData, TableField } from "../types/table"
import { isBlank } from "./fields"

/** People in user fields flagged as related / assigned. */
export function deriveUsers(fields: TableField[], record: RecordData) {
  const pick = (flag: "isRelatedUser" | "isAssignedUser") => [
    ...new Set(fields.filter((f) => f.type.includes("WORKSPACE_USER") && f[flag]).flatMap((f) => {
      const v = record[f.name]
      return Array.isArray(v) ? v : isBlank(v) ? [] : [String(v)]
    })),
  ]
  return { relatedUserIds: pick("isRelatedUser"), assignedUserIds: pick("isAssignedUser") }
}
