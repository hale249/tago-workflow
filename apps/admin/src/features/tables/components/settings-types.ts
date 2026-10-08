import type { ActiveTable, TableConfig } from "../types/table"

/** Everything the settings page can change, edited as one draft and saved together. */
export type Draft = Pick<ActiveTable, "name" | "description" | "workGroupId" | "icon" | "iconColor"> & { config: TableConfig }
export type TabProps = { table: ActiveTable; draft: Draft; setDraft: (d: Draft) => void }

export const patchConfig = (p: TabProps, patch: Partial<TableConfig>) => p.setDraft({ ...p.draft, config: { ...p.draft.config, ...patch } })
