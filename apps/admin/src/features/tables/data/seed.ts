import type { ActiveTable, RecordComment, RecordData, TableRecord, TableTemplate, WorkGroup, WorkspaceTeam, WorkspaceUser } from "../types/table"
import { makeOption, renderCodeTemplate, uid } from "../utils/fields"
import { evaluateFormula } from "../utils/formula"
import { deriveUsers } from "../utils/people"
import { buildTemplateConfig, TEMPLATES } from "./table-templates"

export const CURRENT_USER_ID = "u_me"

export const WORKSPACE_USERS: WorkspaceUser[] = [
  { id: "u_me", fullName: "Bạn", color: "#2563eb" },
  { id: "u_lan", fullName: "Nguyễn Thị Lan", color: "#db2777" },
  { id: "u_minh", fullName: "Trần Văn Minh", color: "#16a34a" },
  { id: "u_huong", fullName: "Lê Thu Hương", color: "#ea580c" },
  { id: "u_khoa", fullName: "Phạm Đăng Khoa", color: "#7c3aed" },
]

export const WORKSPACE_TEAMS: WorkspaceTeam[] = [
  { id: "team_owner", name: "Ban quản trị", roles: [{ id: "role_owner", name: "Chủ workspace" }] },
  { id: "team_sales", name: "Kinh doanh", roles: [{ id: "role_sales_lead", name: "Trưởng nhóm" }, { id: "role_sales", name: "Nhân viên" }] },
  { id: "team_ops", name: "Vận hành", roles: [{ id: "role_ops_lead", name: "Trưởng nhóm" }, { id: "role_ops", name: "Nhân viên" }] },
]

export const SEED_WORK_GROUPS: WorkGroup[] = [
  { id: "wg_crm", name: "CRM", description: "Khách hàng & bán hàng" },
  { id: "wg_ops", name: "Quy trình", description: "Công việc nội bộ" },
  { id: "wg_stock", name: "Tồn kho", description: "Kho và mặt hàng" },
]

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

function table(id: string, name: string, tableType: TableTemplate, workGroupId: string): ActiveTable {
  const tpl = TEMPLATES.find((t) => t.id === tableType)!
  return {
    id,
    name,
    description: tpl.description,
    icon: tpl.icon,
    iconColor: tpl.iconColor,
    workGroupId,
    tableType,
    config: buildTemplateConfig(tableType),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(2),
  }
}

const customers = table("t_customers", "Khách hàng", "CUSTOMER_PIPELINE", "wg_crm")
const tasks = table("t_tasks", "Công việc", "TASK_EISENHOWER", "wg_ops")
const items = table("t_items", "Mặt hàng", "INVENTORY", "wg_stock")

// Link tasks -> customers and show related tasks on the customer detail page.
tasks.config.fields.splice(4, 0, { type: "SELECT_ONE_RECORD", name: "customer", label: "Khách hàng", referenceTableId: customers.id, referenceLabelField: "customer_name" })
tasks.config.recordDetail.rowTailFields = tasks.config.fields.map((f) => f.name)
customers.config.recordDetail.refRecords = [{ title: "Công việc", refTableId: tasks.id, refField: "customer", displayFields: ["task_title", "status", "assignee"] }]

// Orders: header fields + line items (product × qty × price × VAT) rolled up into totals.
const orders = table("t_orders", "Đơn hàng", "BLANK", "wg_crm")
orders.icon = "package"
orders.iconColor = "#0f766e"
orders.description = "Đơn bán hàng kèm danh sách mặt hàng"
const orderStatus = ["Nháp", "Đã xác nhận", "Đang xử lý", "Hoàn thành"].map((t, i) => makeOption(t, [6, 0, 1, 2][i]))
orders.config = {
  ...orders.config,
  fields: [
    { type: "AUTO_GENERATED_CODE", name: "order_code", label: "Mã đơn hàng", codeTemplate: "DH{{auto.increment.padLeft(6,0)}}", placeholder: "Mã tự động sinh ra" },
    { type: "SELECT_ONE_RECORD", name: "customer", label: "Khách hàng", referenceTableId: customers.id, referenceLabelField: "customer_name" },
    { type: "SELECT_ONE", name: "status", label: "Trạng thái", required: true, options: orderStatus, defaultValue: orderStatus[0].value },
    { type: "DATE", name: "order_date", label: "Ngày đặt" },
    { type: "SELECT_ONE_WORKSPACE_USER", name: "owner", label: "Người phụ trách", required: true },
    { type: "NUMERIC", name: "subtotal", label: "Tổng tiền hàng", unit: "đ", decimalPlaces: 0, isLocked: true },
    { type: "NUMERIC", name: "vat_total", label: "Tiền VAT", unit: "đ", decimalPlaces: 0, isLocked: true },
    { type: "NUMERIC", name: "grand_total", label: "Tổng cộng", unit: "đ", decimalPlaces: 0, isLocked: true },
    { type: "SHORT_TEXT", name: "note", label: "Ghi chú" },
  ],
  items: {
    enabled: true,
    label: "Mặt hàng",
    fields: [
      { type: "SELECT_ONE_RECORD", name: "product", label: "Mặt hàng", referenceTableId: items.id, referenceLabelField: "item_name" },
      { type: "NUMERIC", name: "qty", label: "Số lượng", min: 1, defaultValue: "1", decimalPlaces: 0 },
      { type: "NUMERIC", name: "price", label: "Đơn giá", min: 0, unit: "đ", decimalPlaces: 0 },
      { type: "NUMERIC", name: "vat", label: "VAT", min: 0, unit: "%", decimalPlaces: 0 },
    ],
    sums: [
      { sumField: "subtotal", label: "Tổng tiền hàng", formula: "SUM(qty * price)" },
      { sumField: "vat_total", label: "Tiền VAT", formula: "SUM(qty * price * vat / 100)" },
      { sumField: "grand_total", label: "Tổng cộng", formula: "SUM(qty * price * (1 + vat / 100))" },
    ],
  },
  quickFilters: ["status", "owner"],
  recordList: {
    displayFields: ["order_code", "customer", "status", "order_date", "owner", "grand_total"],
    totalSumFields: [{ label: "Tổng", formula: "COUNT(*)" }, { label: "Doanh thu", formula: "SUM(grand_total)" }],
  },
  recordDetail: { headTitleField: "order_code", headSubLineFields: ["customer", "status"], rowTailFields: ["customer", "status", "order_date", "owner", "subtotal", "vat_total", "grand_total", "note"], refRecords: [] },
  kanbanConfigs: [{ id: uid(), name: "Trạng thái", statusField: "status", headlineField: "order_code", displayFields: ["customer", "grand_total", "owner"] }],
  pivotConfigs: [{
    id: uid(), name: "Doanh thu theo trạng thái", description: "", rowField: "status", columnField: "order_date", groupBy: "month",
    measures: [{ label: "Doanh thu", formula: "SUM(grand_total)", unit: "đ", decimalPlaces: 0 }, { label: "Số đơn", formula: "COUNT(*)", unit: null, decimalPlaces: 0 }],
    rowTotals: true, columnTotals: true, grandTotal: true,
  }],
}
orders.config.actions = [...orders.config.actions, { actionId: uid(), name: "Yêu cầu xuất kho", type: "custom", icon: "package", inputFields: [{ type: "SHORT_TEXT", name: "warehouse", label: "Kho xuất" }] }]

// Objective cards + conversion report on customers, pulling tasks and orders that reference them.
customers.config.objectiveCards = [{
  id: uid(),
  name: "Mục tiêu khách hàng",
  description: "Theo dõi công việc và đơn hàng theo từng khách",
  objective: { titleField: "customer_name", descriptionField: "notes", ownerField: "assignee", startField: "", endField: "expected_close_date", progressField: "", statusField: "sales_stage" },
  lists: [
    { id: uid(), name: "Công việc", tableId: tasks.id, relationField: "customer", titleField: "task_title", startField: "start_date", endField: "due_date", progressField: "progress", currentField: "", targetField: "", unitField: "", statusField: "status", limit: 5 },
    { id: uid(), name: "Đơn hàng", tableId: orders.id, relationField: "customer", titleField: "order_code", startField: "order_date", endField: "", progressField: "", currentField: "grand_total", targetField: "", unitField: "", statusField: "status", limit: 5 },
  ],
}]
customers.config.conversions = [{
  id: uid(),
  name: "Phễu khách hàng",
  columns: [
    { label: "Công việc", tableId: tasks.id, formula: "COUNT(*)", filterMappings: [{ from: "assignee", to: "assignee" }] },
    { label: "Đơn hàng", tableId: orders.id, formula: "COUNT(*)", filterMappings: [{ from: "assignee", to: "owner" }] },
  ],
}]
tasks.config.recordList.totalSumFields = [{ label: "Tổng", formula: "COUNT(*)" }, { label: "Tiến độ TB", formula: "AVG(progress)" }]

// People roles: who counts as assigned / related on each table.
const flag = (t: ActiveTable, name: string, roles: { isAssignedUser?: boolean; isRelatedUser?: boolean }) => {
  const f = t.config.fields.find((x) => x.name === name)
  if (f) Object.assign(f, roles)
}
flag(customers, "assignee", { isAssignedUser: true, isRelatedUser: true })
flag(orders, "owner", { isAssignedUser: true, isRelatedUser: true })
flag(tasks, "assignee", { isAssignedUser: true, isRelatedUser: true })
flag(tasks, "followers", { isRelatedUser: true })

// Stock-out slips: picking an order copies its line items (product, qty, price) and its grand total.
const stockOut = table("t_stock_out", "Xuất kho", "BLANK", "wg_stock")
stockOut.icon = "package"
stockOut.iconColor = "#7c3aed"
stockOut.description = "Phiếu xuất kho, khởi tạo từ đơn hàng"
stockOut.config = {
  ...stockOut.config,
  fields: [
    { type: "AUTO_GENERATED_CODE", name: "slip_code", label: "Mã phiếu", codeTemplate: "PX{{auto.increment.padLeft(5,0)}}" },
    { type: "SELECT_ONE_RECORD", name: "order", label: "Đơn hàng", required: true, referenceTableId: orders.id, referenceLabelField: "order_code" },
    { type: "SHORT_TEXT", name: "warehouse", label: "Kho xuất", defaultValue: "Kho tổng" },
    { type: "DATE", name: "slip_date", label: "Ngày xuất" },
    { type: "SELECT_ONE_WORKSPACE_USER", name: "keeper", label: "Thủ kho", isAssignedUser: true, isRelatedUser: true },
    { type: "NUMERIC", name: "total_qty", label: "Tổng số lượng", decimalPlaces: 0, isLocked: true },
    { type: "NUMERIC", name: "order_value", label: "Giá trị đơn", unit: "đ", decimalPlaces: 0, isLocked: true },
  ],
  items: {
    enabled: true,
    label: "Hàng xuất",
    fields: [
      { type: "SELECT_ONE_RECORD", name: "product", label: "Mặt hàng", referenceTableId: items.id, referenceLabelField: "item_name" },
      { type: "NUMERIC", name: "qty", label: "Số lượng", min: 0, decimalPlaces: 0 },
      { type: "NUMERIC", name: "price", label: "Đơn giá", unit: "đ", decimalPlaces: 0 },
    ],
    sums: [
      { sumField: "total_qty", label: "Tổng số lượng", formula: "SUM(qty)" },
      { sumField: "order_value", label: "Giá trị đơn", formula: "SUM(qty * price)" },
    ],
    autoInit: {
      enabled: true,
      triggerField: "order",
      itemMappings: [{ source: "product", target: "product" }, { source: "qty", target: "qty" }, { source: "price", target: "price" }],
      sumMappings: [{ source: "grand_total", target: "order_value" }],
    },
  },
  quickFilters: ["order", "keeper"],
  recordList: { displayFields: ["slip_code", "order", "warehouse", "slip_date", "keeper", "total_qty", "order_value"], totalSumFields: [{ label: "Tổng", formula: "COUNT(*)" }, { label: "Tổng số lượng", formula: "SUM(total_qty)" }] },
  recordDetail: { headTitleField: "slip_code", headSubLineFields: ["order", "warehouse"], rowTailFields: ["order", "warehouse", "slip_date", "keeper", "total_qty", "order_value"], refRecords: [] },
}
orders.config.recordDetail.refRecords = [{ title: "Xuất kho", refTableId: stockOut.id, refField: "order", displayFields: ["slip_code", "warehouse", "slip_date", "total_qty"] }]

export const SEED_TABLES: ActiveTable[] = [customers, orders, tasks, items, stockOut]

const userIds = WORKSPACE_USERS.map((u) => u.id)
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]

function rec(tableId: string, i: number, record: RecordData, age: number): TableRecord {
  const at = daysAgo(age)
  return { id: `${tableId}_r${i + 1}`, tableId, record, createdBy: pick(userIds, i), createdAt: at, updatedAt: null, valueUpdatedAt: {} }
}

const NAMES = ["Công ty Minh Phát", "Anh Hoàng Nam", "Chị Thanh Vy", "Cửa hàng An Khang", "Công ty Sao Việt", "Anh Đức Long", "Chị Mai Anh", "Nhà hàng Bếp Quê", "Công ty Đại Dương", "Anh Quốc Bảo", "Spa Hoa Sen", "Chị Ngọc Hân"]
const stages = customers.config.fields.find((f) => f.name === "sales_stage")!.options!.map((o) => o.value)
const sources = customers.config.fields.find((f) => f.name === "source")!.options!.map((o) => o.value)

const customerRecords = NAMES.map((name, i) =>
  rec(customers.id, i, {
    customer_name: name,
    customer_code: renderCodeTemplate("KH{{auto.increment.padLeft(5,0)}}", i + 1),
    phone: `09${String(10000000 + i * 7654321).slice(0, 8)}`,
    email: i % 3 === 0 ? "" : `lienhe${i + 1}@example.com`,
    sales_stage: pick(stages, i),
    source: pick(sources, i * 2),
    deal_value: (i + 1) * 12_500_000,
    assignee: pick(userIds, i),
    expected_close_date: daysAgo(-((i % 5) + 1) * 7).slice(0, 10),
    notes: "",
  }, 30 - i * 2),
)

const TASKS = ["Gọi lại khách hàng", "Gửi báo giá", "Chuẩn bị hợp đồng", "Họp nội bộ tuần", "Cập nhật bảng giá", "Kiểm kê kho", "Viết bài giới thiệu sản phẩm", "Trả lời email tồn đọng", "Lên kế hoạch tháng"]
const quadrants = ["do_now", "schedule", "delegate", "eliminate"]
const statuses = ["todo", "in_progress", "done"]

const taskRecords = TASKS.map((title, i) =>
  rec(tasks.id, i, {
    task_title: title,
    matrix_quadrant: pick(quadrants, i),
    status: pick(statuses, i),
    assignee: pick(userIds, i + 1),
    followers: [pick(userIds, i + 2)],
    customer: i < 4 ? customerRecords[i].id : "",
    start_date: daysAgo(3 - i),
    due_date: daysAgo(-(i + 1)),
    progress: pick([0, 40, 100], i),
    is_blocked: i === 2,
    description: "",
  }, 20 - i),
)

const ITEMS = [["Cà phê hạt Robusta", "kg", 180_000, 120], ["Ly giấy 12oz", "cái", 1_200, 5000], ["Sữa đặc", "lon", 24_000, 340], ["Cà phê rang xay 500g", "gói", 95_000, 60], ["Túi zip", "cái", 800, 0]] as const
const itemRecords = ITEMS.map(([name, unit, price, qty], i) =>
  rec(items.id, i, {
    sku: renderCodeTemplate("SP{{auto.increment.padLeft(4,0)}}", i + 1),
    item_name: name,
    category: pick(["nguyen_lieu", "bao_bi", "nguyen_lieu", "thanh_pham", "bao_bi"], i),
    unit_name: unit,
    price,
    quantity: qty,
    active: qty > 0,
  }, 15 - i),
)

const orderRecords = Array.from({ length: 6 }, (_, i) => {
  const lines = [0, 1, 2].slice(0, (i % 3) + 1).map((k) => {
    const [, , price] = ITEMS[(i + k) % ITEMS.length]
    return { id: `ln_${i}_${k}`, product: itemRecords[(i + k) % itemRecords.length].id, qty: k + 2, price, vat: k === 1 ? 8 : 10 }
  })
  const r = rec(orders.id, i, {
    order_code: renderCodeTemplate("DH{{auto.increment.padLeft(6,0)}}", i + 1),
    customer: customerRecords[i * 2].id,
    status: orderStatus[i % 4].value,
    order_date: daysAgo(i * 12).slice(0, 10),
    owner: pick(userIds, i),
    note: "",
  }, i * 12)
  r.items = lines
  for (const s of orders.config.items.sums) r.record[s.sumField] = evaluateFormula(s.formula, lines)
  return r
})

// One stock-out slip built from the first order, the same way auto-init would do it.
const firstOrder = orderRecords[0]
const slip = rec(stockOut.id, 0, { slip_code: "PX00001", order: firstOrder.id, warehouse: "Kho tổng", slip_date: daysAgo(1).slice(0, 10), keeper: "u_minh" }, 1)
slip.items = (firstOrder.items ?? []).map((it, k) => ({ id: `px_${k}`, product: it.product, qty: it.qty, price: it.price }))
slip.record.total_qty = evaluateFormula("SUM(qty)", slip.items)
slip.record.order_value = firstOrder.record.grand_total

export const SEED_RECORDS: TableRecord[] = [...customerRecords, ...orderRecords, ...taskRecords, ...itemRecords, slip].map((r) => {
  const t = SEED_TABLES.find((x) => x.id === r.tableId)!
  return { ...r, ...deriveUsers(t.config.fields, r.record) }
})

export const SEED_COUNTERS: Record<string, number> = {
  [`${customers.id}:customer_code`]: customerRecords.length,
  [`${items.id}:sku`]: itemRecords.length,
  [`${orders.id}:order_code`]: 6,
  [`${stockOut.id}:slip_code`]: 1,
}

export const SEED_COMMENTS: RecordComment[] = [
  { id: "c1", recordId: customerRecords[0].id, content: "Khách hẹn gọi lại vào thứ Hai.", createdBy: "u_lan", createdAt: daysAgo(3), updatedAt: null },
  { id: "c2", recordId: customerRecords[0].id, content: "Đã gửi báo giá qua email.", createdBy: "u_me", createdAt: daysAgo(1), updatedAt: null },
]
