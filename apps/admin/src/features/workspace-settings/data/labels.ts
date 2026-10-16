import type { LabelType } from "@/features/teams"

/** Label contexts in the reference order; `team` / `role` are the labels the teams feature uses. */
export const LABEL_TYPES: { id: LabelType; label: string }[] = [
  { id: "notification", label: "Thông báo" },
  { id: "role", label: "Vai trò" },
  { id: "team", label: "Nhóm" },
]
export const labelTypeName = (t: LabelType) => LABEL_TYPES.find((x) => x.id === t)?.label ?? t
