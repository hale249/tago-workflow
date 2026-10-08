import type { SystemActionType, TableAction, TableConfig, TableField, TableTemplate } from "../types/table"
import { makeOption, uid } from "../utils/fields"

export const TEMPLATES: { id: TableTemplate; name: string; description: string; icon: string; iconColor: string }[] = [
  { id: "BLANK", name: "Bảng trống", description: "Tự thiết kế các trường từ đầu", icon: "table", iconColor: "#64748b" },
  { id: "CUSTOMER_PIPELINE", name: "Khách hàng (Pipeline)", description: "Theo dõi khách hàng qua các giai đoạn bán hàng", icon: "users", iconColor: "#2563eb" },
  { id: "TASK_EISENHOWER", name: "Công việc (Eisenhower)", description: "Quản lý công việc theo mức độ khẩn cấp & quan trọng", icon: "check-square", iconColor: "#16a34a" },
  { id: "INVENTORY", name: "Mặt hàng / Tồn kho", description: "Danh mục mặt hàng, giá và số lượng tồn", icon: "package", iconColor: "#ea580c" },
]

export const SYSTEM_ACTIONS: { type: SystemActionType; name: string; icon: string }[] = [
  { type: "create", name: "Tạo mới bản ghi", icon: "create" },
  { type: "access", name: "Truy cập bản ghi", icon: "access" },
  { type: "update", name: "Cập nhật bản ghi", icon: "update" },
  { type: "delete", name: "Xoá bản ghi", icon: "delete" },
  { type: "comment_create", name: "Thêm bình luận", icon: "create" },
  { type: "comment_access", name: "Truy cập bình luận", icon: "access" },
  { type: "comment_update", name: "Cập nhật bình luận", icon: "update" },
  { type: "comment_delete", name: "Xoá bình luận", icon: "delete" },
]

export const systemActions = (): TableAction[] => SYSTEM_ACTIONS.map((a) => ({ ...a, actionId: uid(), inputFields: [] }))

/** Config keys every table has regardless of template — also used to migrate older saved data. */
export const extraConfigDefaults = () => ({
  items: { enabled: false, label: "", fields: [], sums: [] },
  actions: systemActions(),
  permissions: [],
  ganttCharts: [],
  pivotConfigs: [],
  objectiveCards: [],
  conversions: [],
})

const text = (name: string, label: string, extra: Partial<TableField> = {}): TableField => ({ type: "SHORT_TEXT", name, label, ...extra })

function blank(): TableConfig {
  const fields: TableField[] = [text("title", "Tiêu đề", { required: true, placeholder: "Nhập tiêu đề" })]
  return {
    ...extraConfigDefaults(),
    fields,
    quickFilters: [],
    defaultSort: "desc",
    defaultScreen: { type: "list", screenId: "" },
    recordList: { displayFields: ["title"], totalSumFields: [{ label: "Tổng", formula: "COUNT(*)" }] },
    recordDetail: { headTitleField: "title", headSubLineFields: [], rowTailFields: ["title"], refRecords: [] },
    kanbanConfigs: [],
  }
}

function customerPipeline(): TableConfig {
  const stages = ["Tiếp cận", "Quan tâm", "Đàm phán", "Chốt", "Thất bại"].map((t, i) => makeOption(t, i))
  const sources = ["Website", "Facebook", "Giới thiệu", "Sự kiện", "Khác"].map((t, i) => makeOption(t, i))
  const fields: TableField[] = [
    text("customer_name", "Tên khách hàng", { required: true, placeholder: "Tên khách hàng hoặc công ty" }),
    { type: "AUTO_GENERATED_CODE", name: "customer_code", label: "Mã khách hàng", codeTemplate: "KH{{auto.increment.padLeft(5,0)}}" },
    { type: "PHONE", name: "phone", label: "Số điện thoại", isUnique: true },
    { type: "EMAIL", name: "email", label: "Email" },
    { type: "SELECT_ONE", name: "sales_stage", label: "Giai đoạn", required: true, options: stages, defaultValue: stages[0].value },
    { type: "SELECT_ONE", name: "source", label: "Nguồn", options: sources },
    { type: "NUMERIC", name: "deal_value", label: "Giá trị tiềm năng", unit: "đ", decimalPlaces: 0, min: 0 },
    { type: "SELECT_ONE_WORKSPACE_USER", name: "assignee", label: "Người phụ trách" },
    { type: "DATE", name: "expected_close_date", label: "Ngày dự kiến chốt" },
    { type: "RICH_TEXT", name: "notes", label: "Ghi chú" },
  ]
  const kanbanId = uid()
  return {
    ...extraConfigDefaults(),
    fields,
    quickFilters: ["sales_stage", "source", "assignee"],
    defaultSort: "desc",
    defaultScreen: { type: "list", screenId: "" },
    recordList: {
      displayFields: ["customer_code", "customer_name", "phone", "email", "sales_stage", "source", "deal_value", "assignee"],
      totalSumFields: [
        { label: "Tổng", formula: "COUNT(*)" },
        { label: "Giá trị tiềm năng", formula: "SUM(deal_value)" },
      ],
    },
    recordDetail: {
      headTitleField: "customer_name",
      headSubLineFields: ["customer_code", "sales_stage", "phone"],
      rowTailFields: fields.map((f) => f.name),
      refRecords: [],
    },
    kanbanConfigs: [{ id: kanbanId, name: "Bán hàng", statusField: "sales_stage", headlineField: "customer_name", displayFields: ["customer_code", "deal_value", "assignee"] }],
  }
}

function taskEisenhower(): TableConfig {
  const matrix = [
    makeOption("Khẩn cấp & Quan trọng", 3, "do_now"),
    makeOption("Quan trọng, không khẩn cấp", 0, "schedule"),
    makeOption("Khẩn cấp, không quan trọng", 1, "delegate"),
    makeOption("Không khẩn cấp & không quan trọng", 6, "eliminate"),
  ]
  const status = [makeOption("Chưa làm", 6, "todo"), makeOption("Đang làm", 0, "in_progress"), makeOption("Hoàn thành", 2, "done")]
  const fields: TableField[] = [
    text("task_title", "Công việc", { required: true }),
    { type: "SELECT_ONE", name: "matrix_quadrant", label: "Ma trận Eisenhower", options: matrix, defaultValue: "do_now", required: true },
    { type: "SELECT_ONE", name: "status", label: "Trạng thái", options: status, defaultValue: "todo", required: true },
    { type: "SELECT_ONE_WORKSPACE_USER", name: "assignee", label: "Người thực hiện" },
    { type: "SELECT_LIST_WORKSPACE_USER", name: "followers", label: "Người theo dõi" },
    { type: "DATETIME", name: "start_date", label: "Thời gian bắt đầu" },
    { type: "DATETIME", name: "due_date", label: "Hạn hoàn thành" },
    { type: "NUMERIC", name: "progress", label: "Tiến độ", unit: "%", min: 0, max: 100, decimalPlaces: 0 },
    { type: "CHECKBOX_YES_NO", name: "is_blocked", label: "Đang bị chặn" },
    { type: "RICH_TEXT", name: "description", label: "Mô tả" },
  ]
  return {
    ...extraConfigDefaults(),
    fields,
    quickFilters: ["status", "matrix_quadrant", "assignee"],
    defaultSort: "desc",
    defaultScreen: { type: "list", screenId: "" },
    recordList: {
      displayFields: ["task_title", "matrix_quadrant", "status", "assignee", "due_date"],
      totalSumFields: [{ label: "Tổng", formula: "COUNT(*)" }],
    },
    recordDetail: { headTitleField: "task_title", headSubLineFields: ["status", "matrix_quadrant"], rowTailFields: fields.map((f) => f.name), refRecords: [] },
    kanbanConfigs: [
      { id: uid(), name: "Trạng thái", statusField: "status", headlineField: "task_title", displayFields: ["matrix_quadrant", "assignee", "due_date"] },
      { id: uid(), name: "Ma trận", statusField: "matrix_quadrant", headlineField: "task_title", displayFields: ["status", "assignee"] },
    ],
    ganttCharts: [{
      id: uid(), name: "Timeline công việc", description: "", taskNameField: "task_title", startDateField: "start_date", endDateField: "due_date",
      progressField: "progress", dependencyField: null, statusField: "status", statusCompleteValue: "done",
    }],
  }
}

function inventory(): TableConfig {
  const categories = ["Nguyên liệu", "Thành phẩm", "Bao bì", "Khác"].map((t, i) => makeOption(t, i))
  const fields: TableField[] = [
    { type: "AUTO_GENERATED_CODE", name: "sku", label: "Mã hàng", codeTemplate: "SP{{auto.increment.padLeft(4,0)}}" },
    text("item_name", "Tên mặt hàng", { required: true, isUnique: true }),
    { type: "SELECT_ONE", name: "category", label: "Nhóm hàng", options: categories },
    text("unit_name", "Đơn vị tính"),
    { type: "NUMERIC", name: "price", label: "Đơn giá", unit: "đ", decimalPlaces: 0, min: 0 },
    { type: "NUMERIC", name: "quantity", label: "Tồn kho", decimalPlaces: 0 },
    { type: "CHECKBOX_YES_NO", name: "active", label: "Đang kinh doanh", defaultValue: "true" },
  ]
  return {
    ...extraConfigDefaults(),
    fields,
    quickFilters: ["category", "active"],
    defaultSort: "desc",
    defaultScreen: { type: "list", screenId: "" },
    recordList: {
      displayFields: ["sku", "item_name", "category", "unit_name", "price", "quantity", "active"],
      totalSumFields: [
        { label: "Tổng", formula: "COUNT(*)" },
        { label: "Tổng tồn", formula: "SUM(quantity)" },
      ],
    },
    recordDetail: { headTitleField: "item_name", headSubLineFields: ["sku", "category"], rowTailFields: fields.map((f) => f.name), refRecords: [] },
    kanbanConfigs: [{ id: uid(), name: "Theo nhóm", statusField: "category", headlineField: "item_name", displayFields: ["sku", "quantity"] }],
  }
}

export function buildTemplateConfig(template: TableTemplate): TableConfig {
  switch (template) {
    case "CUSTOMER_PIPELINE":
      return customerPipeline()
    case "TASK_EISENHOWER":
      return taskEisenhower()
    case "INVENTORY":
      return inventory()
    default:
      return blank()
  }
}
