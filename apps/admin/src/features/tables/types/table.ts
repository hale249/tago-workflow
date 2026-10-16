export type FieldType =
  | "SHORT_TEXT"
  /** Long plain text (Văn bản dài). TEXTAREA is a legacy alias handled exactly like TEXT. */
  | "TEXT"
  | "TEXTAREA"
  /** Formatted text stored as sanitised HTML (Văn bản có định dạng). Older data may hold plain text. */
  | "RICH_TEXT"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "AUTO_GENERATED_CODE"
  /** string[] of attachment ids — file blobs live in the attachments store. */
  | "ATTACHMENT"
  | "DATE"
  | "DATETIME"
  /** "HH:mm" */
  | "TIME"
  /** Standalone integer parts of a date / time. */
  | "YEAR"
  | "MONTH"
  | "DAY"
  | "HOUR"
  | "MINUTE"
  | "SECOND"
  | "INTEGER"
  | "NUMERIC"
  /** Read-only number computed from `formula` over the record's other fields; stored on save. */
  | "NUMERIC_SUMMARY"
  | "CHECKBOX_YES_NO"
  /** Option value string — at most one checkbox of `options` ticked. */
  | "CHECKBOX_ONE"
  /** Option values string[] — checkbox group over `options`. */
  | "CHECKBOX_LIST"
  | "SELECT_ONE"
  | "SELECT_LIST"
  | "SELECT_ONE_RECORD"
  | "SELECT_LIST_RECORD"
  /** Read-only, derived on read: first record of `referenceTableId` whose `referenceField` points at this record. */
  | "FIRST_REFERENCE_RECORD"
  | "SELECT_ONE_WORKSPACE_USER"
  | "SELECT_LIST_WORKSPACE_USER"

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
  /** SELECT_ONE / SELECT_LIST / CHECKBOX_ONE / CHECKBOX_LIST */
  options?: FieldOption[]
  /** Text types: maximum number of characters. */
  maxLength?: number | null
  /** NUMERIC / INTEGER / NUMERIC_SUMMARY */
  min?: number | null
  max?: number | null
  decimalPlaces?: number | null
  unit?: string | null
  /** AUTO_GENERATED_CODE, e.g. "KH{{auto.increment.padLeft(5,0)}}" */
  codeTemplate?: string
  /** NUMERIC_SUMMARY: expression over field names, e.g. "quantity * unit_price". */
  formula?: string
  /** ATTACHMENT */
  allowMultiple?: boolean
  /** ATTACHMENT: comma-separated MIME types / extensions, e.g. "image/*, .pdf". */
  accept?: string
  /** SELECT_ONE_RECORD / SELECT_LIST_RECORD: target table. FIRST_REFERENCE_RECORD: source table that links back. */
  referenceTableId?: string
  referenceLabelField?: string
  /** FIRST_REFERENCE_RECORD: reference field in `referenceTableId` that points at this table. */
  referenceField?: string
  /**
   * "Tự động điền từ liên kết": when the SELECT_ONE_RECORD field `linkField` of this table gets a record,
   * copy that record's `sourceField` value into this field.
   */
  autoFill?: { linkField: string; sourceField: string } | null
}

/** File kept by the mock attachment storage (data URL so it survives reloads). */
export type Attachment = { id: string; name: string; size: number; type: string; dataUrl: string; createdAt: string }

export type KanbanConfig = {
  id: string
  name: string
  statusField: string
  headlineField: string
  displayFields: string[]
}

/** formula: COUNT(*), SUM(field), AVG(field), MIN(field), MAX(field) */
export type TotalSumField = { label: string; formula: string }

export type RefRecordsConfig = {
  title: string
  refTableId: string
  refField: string
  displayFields: string[]
  /** "table" = classic rows (default), "cards" = stacked cards. */
  layout?: "table" | "cards"
  /** Show the "Thêm" button on the tab (default true). */
  showCreate?: boolean
  /** Sub-title under the tab heading. */
  description?: string
  /** Extra equality filters as a JSON object, e.g. {"loai": "xuat_kho"}. */
  extraFilter?: string
  totalSumFields?: TotalSumField[]
}

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
  /** Text fields indexed for the list search box; empty = search every field. */
  searchableFields?: string[]
  /** Shown when another table picks a record from this one; empty = the reference field's label field. */
  lookupPrimaryField?: string
  lookupSecondaryFields?: string[]
  /** sortField empty = by creation time (defaultSort). */
  recordList: { displayFields: string[]; totalSumFields: TotalSumField[]; sortField?: string; sortOrder?: "asc" | "desc" }
  recordDetail: {
    /** "head-detail" = one column (default), "two-column" = leftFields / rightFields side by side. */
    layout?: "head-detail" | "two-column"
    commentsPosition?: "right-panel" | "hidden"
    headTitleField: string
    headSubLineFields: string[]
    rowTailFields: string[]
    leftFields?: string[]
    rightFields?: string[]
    refRecords: RefRecordsConfig[]
  }
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
  /** Field picked by clicking a list column header; overrides the configured sort field. */
  sortBy?: string
}

export type WorkspaceTeam = { id: string; name: string; roles: { id: string; name: string }[] }

export type RecordItem = { id: string } & RecordData
