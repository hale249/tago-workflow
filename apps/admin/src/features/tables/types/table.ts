export type FieldType =
  | "SHORT_TEXT"
  | "RICH_TEXT"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "NUMERIC"
  | "DATE"
  | "DATETIME"
  | "CHECKBOX_YES_NO"
  | "SELECT_ONE"
  | "SELECT_LIST"
  | "AUTO_GENERATED_CODE"
  | "SELECT_ONE_WORKSPACE_USER"
  | "SELECT_LIST_WORKSPACE_USER"
  | "SELECT_ONE_RECORD"

export type FieldOption = { text: string; value: string; textColor: string; backgroundColor: string }

export type TableField = {
  type: FieldType
  name: string
  label: string
  placeholder?: string
  required?: boolean
  isUnique?: boolean
  defaultValue?: string
  /** List-view column width in px; null/undefined = auto. */
  columnWidth?: number | null
  /** Editable on create, read-only on update. */
  isLocked?: boolean
  /** User fields: people here count as "related" / "assigned" for the record (filters, permission scopes). */
  isRelatedUser?: boolean
  isAssignedUser?: boolean
  /** User fields: viewers without update rights may add / remove people; selected people may leave. */
  accessUserCanAddUsers?: boolean
  accessUserCanRemoveUsers?: boolean
  allowSelfLeave?: boolean
  /** SELECT_ONE / SELECT_LIST */
  options?: FieldOption[]
  /** NUMERIC */
  min?: number | null
  max?: number | null
  decimalPlaces?: number | null
  unit?: string | null
  /** AUTO_GENERATED_CODE, e.g. "KH{{auto.increment.padLeft(5,0)}}" */
  codeTemplate?: string
  /** SELECT_ONE_RECORD */
  referenceTableId?: string
  referenceLabelField?: string
}

export type KanbanConfig = {
  id: string
  name: string
  statusField: string
  headlineField: string
  displayFields: string[]
}

/** formula: COUNT(*), SUM(field), AVG(field), MIN(field), MAX(field) */
export type TotalSumField = { label: string; formula: string }

export type RefRecordsConfig = { title: string; refTableId: string; refField: string; displayFields: string[] }

export type SystemActionType = "create" | "access" | "update" | "delete" | "comment_create" | "comment_access" | "comment_update" | "comment_delete"
export type TableAction = { actionId: string; name: string; type: SystemActionType | "custom"; icon: string; inputFields: TableField[] }

/** Scope values a role can get for an action ("not_allowed" = deny). */
export type PermissionScope = string
export type RolePermission = { teamId: string; roleId: string; actions: Record<string, PermissionScope> }

export type GanttConfig = {
  id: string
  name: string
  description: string
  taskNameField: string
  startDateField: string
  endDateField: string
  progressField: string | null
  dependencyField: string | null
  statusField: string
  statusCompleteValue: string
}

export type PivotGroupBy = "day" | "week" | "month" | "quarter" | "year"
export type PivotMeasure = { label: string; formula: string; unit: string | null; decimalPlaces: number | null }
export type PivotConfig = {
  id: string
  name: string
  description: string
  rowField: string
  columnField: string
  groupBy: PivotGroupBy
  measures: PivotMeasure[]
  rowTotals: boolean
  columnTotals: boolean
  grandTotal: boolean
}

export type ObjectiveMapping = { titleField: string; descriptionField: string; ownerField: string; startField: string; endField: string; progressField: string; statusField: string }
export type ObjectiveList = {
  id: string
  name: string
  tableId: string
  relationField: string
  titleField: string
  startField: string
  endField: string
  progressField: string
  currentField: string
  targetField: string
  unitField: string
  statusField: string
  limit: number
}
export type ObjectiveCardConfig = { id: string; name: string; description: string; objective: ObjectiveMapping; lists: ObjectiveList[] }

export type ConversionColumn = { label: string; tableId: string; formula: string; filterMappings: { from: string; to: string }[] }
export type ConversionConfig = { id: string; name: string; columns: ConversionColumn[] }

/** Line items embedded in a record (e.g. order lines) + roll-ups written back to parent fields. */
export type ItemSum = { sumField: string; label: string; formula: string }
export type FieldMapping = { source: string; target: string }
/** Copy line items from the record chosen in `triggerField` (a reference to a table that has items). */
export type ItemAutoInit = { enabled: boolean; triggerField: string; itemMappings: FieldMapping[]; sumMappings: FieldMapping[] }
export type ItemsConfig = { enabled: boolean; label: string; fields: TableField[]; sums: ItemSum[]; autoInit?: ItemAutoInit }

export type TableConfig = {
  fields: TableField[]
  items: ItemsConfig
  actions: TableAction[]
  permissions: RolePermission[]
  ganttCharts: GanttConfig[]
  pivotConfigs: PivotConfig[]
  objectiveCards: ObjectiveCardConfig[]
  conversions: ConversionConfig[]
  quickFilters: string[]
  defaultSort: "asc" | "desc"
  defaultScreen: { type: "list" | "kanban" | "gantt" | "pivot" | "objective" | "conversion"; screenId: string }
  recordList: { displayFields: string[]; totalSumFields: TotalSumField[] }
  recordDetail: { headTitleField: string; headSubLineFields: string[]; rowTailFields: string[]; refRecords: RefRecordsConfig[] }
  kanbanConfigs: KanbanConfig[]
}

export type TableTemplate = "BLANK" | "CUSTOMER_PIPELINE" | "TASK_EISENHOWER" | "INVENTORY"

export type ActiveTable = {
  id: string
  name: string
  description: string
  icon: string
  iconColor: string
  workGroupId: string
  tableType: TableTemplate
  config: TableConfig
  /** Workspace user who created the table; older data may lack it. */
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export type WorkGroup = { id: string; name: string; description: string }

export type WorkspaceUser = { id: string; fullName: string; color: string }

export type RecordValue = string | number | boolean | string[] | null
export type RecordData = Record<string, RecordValue>

export type TableRecord = {
  id: string
  tableId: string
  record: RecordData
  createdBy: string
  createdAt: string
  updatedAt: string | null
  /** Line items when the table has items enabled. */
  items?: RecordItem[]
  /** Derived from user fields flagged isRelatedUser / isAssignedUser. */
  relatedUserIds?: string[]
  assignedUserIds?: string[]
  /** When each field last changed — drives "time in stage" on kanban. */
  valueUpdatedAt: Record<string, string>
}

export type RecordComment = { id: string; recordId: string; content: string; createdBy: string; createdAt: string; updatedAt: string | null }

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "startsWith"
export type AdvancedCondition = { field: string; op: FilterOperator; value: string }

export type DatePreset = "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisQuarter" | "custom"
export type DateRange = { preset: DatePreset; from?: string; to?: string }

export type RecordQuery = {
  search?: string
  filters?: Record<string, string>
  conditions?: AdvancedCondition[]
  createdAt?: DateRange | null
  createdBy?: string
  /** "assigned" = Được giao cho tôi, "related" = Liên quan đến tôi. */
  mine?: "" | "assigned" | "related"
  sort?: "asc" | "desc"
}

export type WorkspaceTeam = { id: string; name: string; roles: { id: string; name: string }[] }

export type RecordItem = { id: string } & RecordData
