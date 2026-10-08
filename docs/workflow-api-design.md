# Cloud Logic (Workflow) — thiết kế API cho backend

Ghi lại 2026-10-08 từ việc **chỉ đọc** web tham khảo (beqeek): các request `/get/` thật, route và mã loại node trong bundle công khai.
Mục đích: frontend Tago đã dựng UI theo đúng mô hình này (`apps/admin/src/features/workflow-units`), backend sau này chỉ cần làm đúng hợp đồng dưới đây rồi thay phần thân `workflow.api.ts`.

Quy ước chung giống các API khác của hệ thống (xem `docs/beqeek-api.md`): mọi request là **POST**, động từ nằm trong path (`get` / `post` / `patch` / `delete`), header `Authorization: Bearer <accessToken>`, đọc dữ liệu phải gửi `queries.fields`.

Base: `/api/workspace/{workspaceId}/workflow`

## 1. Endpoint

| Mục đích | Path | Body |
|---|---|---|
| Danh sách workflow unit | `get/workflow_units` | `{ queries: { fields } }` |
| Chi tiết unit | `get/workflow_units/{unitId}` | `{ queries: { fields } }` |
| Tạo unit | `post/workflow_units` | `{ name, description }` |
| Sửa unit | `patch/workflow_units/{unitId}` | `{ name?, description? }` |
| Xoá unit | `delete/workflow_units/{unitId}` | — |
| Danh sách sự kiện của unit | `get/workflow_events` | `{ filtering: { workflowUnit: unitId }, queries: { fields } }` |
| Chi tiết sự kiện | `get/workflow_events/{eventId}` | `{ queries: { fields } }` |
| Tạo sự kiện | `post/workflow_events` | xem §3 |
| Sửa sự kiện / lưu workflow | `patch/workflow_events/{eventId}` | các trường cần đổi (vd `{ yaml }`) |
| Bật / tắt sự kiện | `patch/workflow_events/{eventId}` | `{ eventActive: true \| false }` |
| Xoá sự kiện | `delete/workflow_events/{eventId}` | — |
| Loại connector | `get/workflow_connector_types` | — |
| Connector (CRUD) | `get\|post\|patch\|delete/workflow_connectors[/{id}]` | — |
| Trạng thái OAuth của connector | `get/workflow_connectors/{id}/oauth2_state` | — |

Trường `fields` mà UI tham khảo xin:
- Unit: `id,name,description,createdBy,updatedBy,createdAt,updatedAt,userPermission`
- Event: `id,eventName,eventActive,responseId,eventSourceType,eventSourceParams,workflowCode,workflowDefaultData,workflowUnit,yaml,createdBy,updatedBy,createdAt,updatedAt`
- Connector: `id,name,connectorType,description,config,documentation,createdBy,updatedBy,createdAt,updatedAt,isReady,userPermission`

Response bọc trong `{ httpCode, status: "success", data, meta? }`.

## 2. Dữ liệu

### WorkflowUnit
```json
{ "id": "<id>", "name": "<string>", "description": "<string>",
  "createdBy": "<userId>", "updatedBy": "<userId>", "createdAt": "<datetime>", "updatedAt": "<datetime>",
  "userPermission": { "...": true } }
```

### WorkflowEvent
```json
{
  "id": "<id>",
  "eventName": "<string>",
  "eventActive": false,
  "workflowUnit": "<unitId>",
  "eventSourceType": "ACTIVE_TABLE | SCHEDULE | WEBHOOK | FORM",
  "eventSourceParams": { "...": "tuỳ loại, xem §4" },
  "workflowCode": "global/yaml",
  "workflowDefaultData": [],
  "responseId": "<id>",
  "yaml": "<tài liệu workflow, xem §5>",
  "createdAt": "<datetime>", "updatedAt": "<datetime>"
}
```
- `eventSourceType` + `eventSourceParams` dùng để **liệt kê & lọc** (cột "Loại kích hoạt").
- `yaml` là nguồn sự thật của các bước; UI Trực quan và UI YAML đều đọc/ghi trường này.
- `workflowCode` hiện luôn là `global/yaml` (engine chạy YAML).

## 3. Tạo sự kiện
```json
{
  "workflowUnit": "<unitId>",
  "eventName": "Đơn hàng hoàn thành",
  "eventActive": false,
  "eventSourceType": "ACTIVE_TABLE",
  "eventSourceParams": { "tableId": "<tableId>", "webhookId": "<actionId>" },
  "workflowCode": "global/yaml",
  "yaml": "version: '1.0'\ntrigger: ...\nsteps: []\n"
}
```

## 4. Kích hoạt (trigger)

| `eventSourceType` | `eventSourceParams` | `trigger.type` trong YAML |
|---|---|---|
| `ACTIVE_TABLE` | `{ tableId, webhookId }` — `webhookId` là **actionId** của hành động bảng (tạo / sửa / xoá / hành động tuỳ chỉnh) | `table` |
| `SCHEDULE` | `{ expression }` — cron 5 phần, vd `0 7 * * *` | `schedule` |
| `WEBHOOK` | `{ ... }` (đường dẫn / khoá nhận) | `webhook` |
| `FORM` | `{ formId }` | `form` |

Lưu ý: kích hoạt từ bảng **gắn với action**, không phải sự kiện chung — mỗi hành động trong tab "Hành động" của bảng có `actionId` riêng, hành động tuỳ chỉnh (vd "Yêu cầu xuất kho") chính là cách bấm nút trên bản ghi để chạy workflow.

## 5. Tài liệu YAML

```yaml
version: '1.0'
trigger:
  type: table            # table | schedule | webhook | form
  config:                # = eventSourceParams
    tableId: '<tableId>'
    webhookId: <actionId>
steps:
  - id: table_operation-1773591316672   # duy nhất, ≤128 ký tự
    name: Chi tiết khách hàng           # nhãn hiển thị
    type: table_operation               # mã loại node, xem §6
    config:                             # tuỳ loại node
      connector: <connectorId>
      action: get_one
      record: '{{ .workflowData.id }}'
    depends_on:                         # bước phía trước; bước đầu phụ thuộc "start-node"
      - start-node
    position: { x: 58, y: 308 }         # toạ độ trên canvas, chỉ để vẽ
```

Quy tắc:
- Thứ tự chạy theo đồ thị `depends_on` (không phải thứ tự trong mảng). Không được có vòng lặp phụ thuộc.
- Biến: `{{ .workflowData.<field> }}` = dữ liệu kích hoạt; `{{ .<stepId>.<field> }}` = kết quả bước trước; `{{ .state.<stateId> }}` = state; trong vòng lặp có biến lặp.
- Node có nhánh (điều kiện, email) nối cạnh bằng **handle**: điều kiện dùng `true` / `false`; email dùng các nhánh đã mở / đã click / không mở / không click.
- Đổi id bước phải đổi luôn mọi `depends_on` trỏ tới nó (UI Tago đã làm việc này).

## 6. Mã loại node (`steps[].type`) và `config`

Mã là mã thật của hệ thống tham khảo; `config` ghi các khoá UI Tago đang dùng (khoá có ✓ đã thấy trong dữ liệu thật).

### Logic
| type | Nhãn | config |
|---|---|---|
| `condition` | Điều kiện | `expression` (bản thật dùng `operator`, mặc định `equals`) |
| `compound_condition` | Điều kiện có nhánh then/else lồng bước | (chưa dựng UI) |
| `match` | So khớp switch/case | (chưa dựng UI) |
| `loop` | Vòng lặp | `items`, `iterator` |
| `compound_loop` | Vòng lặp có bước lồng | (chưa dựng UI) |
| `loop_control` | Điều khiển vòng lặp | `action`: `break` \| `continue` ✓ (mặc định `break`) |
| `math` | Toán học | bản thật: `operation` (vd `add`), `operands[]`; Tago: `firstOperand`, `operator`, `secondOperand` |
| `definition` | Biến số | `variables[]: { name, value }` |
| `object_lookup` | Tra cứu đối tượng | `object`, `key`, `default` |
| `collection_union` | Hợp nhất mảng | `collections`, `uniqueBy` |
| `validation` | Xác thực | `rules` |
| `stop_with_error` | Dừng kèm lỗi | `code`, `message` |
| `state_init` | Khởi tạo state | `stateType`, `initialValue` |
| `state_update` | Cập nhật state | `stateRef`, `action` (set, increment, decrement, add, subtract, multiply, divide, round/floor/ceil, push, push_many, pop, shift, unshift, concat, prepend, slice, replace, remove_value, uppercase, lowercase, trim, set_key, merge, reset), `key`, `value` |

### Actions
| type | Nhãn | config |
|---|---|---|
| `table_operation` | Thao tác bảng | `connector` ✓, `action`: `get_one` ✓ \| `get_list` \| `create` \| `update` \| `delete`, `record` ✓, `data`, `filter` (Tago thêm `tableId` để chọn bảng; bản thật chọn bảng qua connector loại `ACTIVE_TABLE`) |
| `active_table_html_upload` | Tải lên file nội dung | `record`, `target` (comment \| field), `field`, `format` (html \| pdf), `fileName`, `content` |
| `table_comment_create` | Tạo bình luận | `record`, `content` |
| `table_comment_get_one` | Lấy bình luận | `record`, `commentId` |
| `smtp_email` | Gửi email | `connector`, `to`, `subject`, `body` |
| `google_sheet` / `google_calendar` / `google_drive` / `google_task` / `google_gmail` / `google_photos` / `google_contacts` | Google | `connector`, `action`, `params` |
| `facebook_page` / `facebook_ads` | Facebook | `connector`, `action` (vd `get_page_info`, `get_ad_accounts` — thấy trong dữ liệu mặc định), `page_id`, `apiVersion` |
| `facebook_page_messaging` | Facebook Messenger | `connector`, `action` (vd `get_conversations`), `recipientId`, `message` |
| `facebook_chat` / `zalo_chat` / `instagram_chat` / `whatsapp_chat` | Hội thoại Social Chat | `connector`, `action`, `conversationId`, `message` |
| `think_agent` | Think Agent | `connector` (AI Provider), `prompt`, `outputSchema` |
| `image_generation` | Tạo ảnh AI | `connector`, `prompt`, `size` |
| `api_call` | Gọi API | `method`, `url`, `headers`, `body` |
| `user_operation` | Thao tác người dùng | `action`, `userId` |
| `notification` | Thông báo | `message` |
| `toast_notification` | Thông báo nổi | `variant`, `message` |
| `dock_message` | Dock tiến trình | `title`, `message`, `progress` |
| `delay` | Trì hoãn | `durationValue` ✓, `durationUnit` ✓ (seconds \| minutes \| hours \| days \| months), `targetTime` ✓ (`HH:mm`) |
| `log` | Nhật ký | `level`, `message` |

## 7. Console (log chạy)
Trang console bên tham khảo nhận log **realtime** (trạng thái "Connected"), có lọc mức Debug / Info / Warn / Error, Export, Clear. Backend nên đẩy log qua WebSocket/SSE theo `eventId`, mỗi dòng: `{ at, level, stepId?, message }` (đúng `WorkflowLog` của Tago).

## 8. Ánh xạ sang kiểu dữ liệu Tago (frontend)

| API | Tago (`types/workflow.ts`) |
|---|---|
| `eventName` | `name` |
| `eventActive` | `active` |
| `workflowUnit` | `unitId` |
| `eventSourceType` / `eventSourceParams` | `trigger.type` / `trigger.params` |
| `yaml` | `steps` + `startPosition` (dùng `toYaml` / `fromYaml` trong `utils/yaml.ts` để chuyển đổi) |

Khi có backend: trong `workflow.api.ts`, đọc event → `fromYaml(event.yaml, …)`; lưu → `patch/workflow_events/{id}` với `{ yaml: toYaml(draft) }` (+ `eventName`, `eventActive`, `eventSourceType`, `eventSourceParams` nếu đổi).
