import type { WorkflowEvent, WorkflowStep, WorkflowUnit } from "../types/workflow"

const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const step = (id: string, name: string, type: string, deps: string[], x: number, y: number, config: Record<string, unknown> = {}): WorkflowStep =>
  ({ id, name, type, config, depends_on: deps, position: { x, y } })

export const SEED_UNITS: WorkflowUnit[] = [
  { id: "wu_care", name: "Chăm sóc sau bán", description: "Nhắc lịch và gửi email cho khách sau khi chốt đơn", createdAt: ago(30), updatedAt: ago(4) },
  { id: "wu_sales", name: "Theo dõi bán hàng", description: "", createdAt: ago(20), updatedAt: ago(20) },
]

export const SEED_EVENTS: WorkflowEvent[] = [
  {
    id: "we_order_done", unitId: "wu_care", name: "Đơn hàng hoàn thành", active: true,
    trigger: { type: "ACTIVE_TABLE", params: { tableId: "t_orders", action: "update" } },
    startPosition: { x: 40, y: 220 },
    steps: [
      step("get_order", "Lấy chi tiết đơn", "table_operation", ["start-node"], 340, 220, { action: "get_one", record: "{{ .workflowData.id }}" }),
      step("is_done", "Đơn đã hoàn thành?", "condition", ["get_order"], 640, 220, { expression: "status == 'hoan_thanh'" }),
      step("thanks", "Gửi email cảm ơn", "smtp_email", ["is_done"], 940, 80, { subject: "Cảm ơn bạn đã mua hàng" }),
      step("wait7", "Chờ 7 ngày", "delay", ["is_done"], 940, 330, { durationValue: 7, durationUnit: "days", targetTime: "09:00" }),
      step("feedback", "Hỏi thăm trải nghiệm", "smtp_email", ["wait7"], 1240, 330, { subject: "Bạn thấy sản phẩm thế nào?" }),
      step("note", "Ghi bình luận", "table_comment_create", ["thanks"], 1240, 80, { content: "Khách đã mở email cảm ơn" }),
    ],
    edges: [
      { source: "is_done", target: "thanks", label: "true" },
      { source: "is_done", target: "wait7", label: "true" },
      { source: "thanks", target: "note", label: "on_open" },
    ],
    createdAt: ago(28), updatedAt: ago(4),
  },
  {
    id: "we_birthday", unitId: "wu_care", name: "Chúc mừng sinh nhật", active: false,
    trigger: { type: "SCHEDULE", params: { expression: "0 8 * * *" } },
    startPosition: { x: 40, y: 160 },
    steps: [
      step("find", "Tìm khách sinh nhật hôm nay", "table_operation", ["start-node"], 340, 160, { action: "get_list", tableId: "t_customers" }),
      step("each", "Với từng khách", "loop", ["find"], 640, 160, { items: "{{ .find.data }}" }),
      step("wish", "Gửi lời chúc", "notification", ["each"], 940, 160, { message: "Chúc mừng sinh nhật {{ .item.customer_name }}!" }),
    ],
    createdAt: ago(25), updatedAt: ago(25),
  },
  {
    id: "we_lead", unitId: "wu_sales", name: "Khách mới từ website", active: true,
    trigger: { type: "WEBHOOK", params: { path: "/hooks/lead" } },
    startPosition: { x: 40, y: 160 },
    steps: [
      step("create", "Tạo khách hàng", "table_operation", ["start-node"], 340, 160, { action: "create", tableId: "t_customers" }),
      step("notify", "Báo cho sale", "notification", ["create"], 640, 160, { message: "Có khách mới: {{ .create.customer_name }}" }),
    ],
    createdAt: ago(18), updatedAt: ago(18),
  },
]
