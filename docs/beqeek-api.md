# API tham khảo theo từng trang (beqeek.com)

Ghi lại 2026-10-08 bằng cách gọi **chỉ các đầu đọc (`/get/`)** với tài khoản của workspace tham khảo. Response đã được **che dữ liệu**: chuỗi → `<string>`, id → `<id>`/`<snowflake-id>`, thời gian → `<datetime>`, số → `0`, URL → `<url>`, khoá mã hoá → `<redacted>`; mảng chỉ giữ 1 phần tử mẫu (`…` = còn nữa). Bản gốc (chưa che) chỉ nằm trong thư mục tạm, không đưa vào repo.

## Quy ước chung

- Base URL: `https://api.beqeek.com`. Header `Authorization: Bearer <accessToken>` (lấy từ `localStorage['auth-store'].state.accessToken`; làm mới qua `/api/auth/post/refresh_token`).
- **Mọi request đều là `POST`**; động từ nằm trong path: `/get/`, `/post/` (tạo), `/patch/` (sửa), `/delete/`.
- Đầu theo workspace có dạng `/api/workspace/{workspaceId}/<module>/<verb>/<resource>[/{id}]`.
- Body đọc thường cần `queries.fields` (danh sách trường, hỗ trợ lồng `user{id,fullName}`); thiếu `queries` → 400 `The queries field is required`; xin trường không cho phép → 400 `UNSELECTABLE_FIELD`.
- Danh sách bản ghi: `{ paging: "cursor", limit, direction: "desc"|"asc", filtering: {...}, sorting?: [...] }` → trả `data[]` + `next_id`/`previous_id`.
- Envelope thường gặp: `{ httpCode, status: "success", data, meta?: { limit, sort } }`. Một số đầu (records, labels, comments, permission bảng) trả thẳng `{ data, ... }`.
- Lỗi: `{ message, errors: { "$.field": "..." } }` với HTTP 400.
- Dữ liệu bản ghi có thể **mã hoá phía client** (bảng bật E2EE): text là AES base64, lựa chọn là hash HMAC của value. Tago hiện lưu dạng rõ.

## Bảng tra: trang → API

| Trang | Route | API dùng |
|---|---|---|
| Đăng nhập / chọn workspace | `/workspaces` | [user-me](#user-me), [user-workspaces](#user-workspaces), [user-pending-workspaces](#user-pending-workspaces) |
| Khung app (sidebar, header) — mọi trang trong workspace | `/workspaces/:workspaceId/*` | [workspace-me](#workspace-me), [system-config](#system-config), [permission-me](#permission-me), [notif-unread](#notif-unread), [invitations](#invitations), [work-groups](#work-groups), [tables](#tables) |
| Thông báo | `/workspaces/:workspaceId/notifications` | [notifications](#notifications), [notif-unread](#notif-unread) |
| Apps — danh sách bảng | `/workspaces/:workspaceId/tables` | [work-groups](#work-groups), [tables](#tables), [table-permission-me](#table-permission-me) |
| Bản ghi của bảng (Danh sách / Kanban) | `/workspaces/:workspaceId/tables/:tableId/records` | [table-detail](#table-detail), [records](#records), [users](#users), [table-permission-me](#table-permission-me) |
| Chi tiết bản ghi | `/workspaces/:workspaceId/tables/:tableId/records/:recordId` | [table-detail](#table-detail), [record-detail](#record-detail), [comments](#comments), [users](#users) |
| Cài đặt bảng | `/workspaces/:workspaceId/tables/:tableId/settings` | [table-detail](#table-detail), [work-groups](#work-groups), [tables](#tables), [teams](#teams), [labels](#labels) |
| Cloud Logic (Workflow) | `/workspaces/:workspaceId/workflow-units[/:unitId]` | [workflow-units](#workflow-units), [workflow-unit-detail](#workflow-unit-detail), [workflow-events](#workflow-events) |
| Biểu mẫu | `/workspaces/:workspaceId/workflow-forms[/:formId]` | [workflow-forms](#workflow-forms) |
| Kết nối | `/workspaces/:workspaceId/workflow-connectors[/:connectorId]` | [connector-types](#connector-types), [connectors](#connectors), [connector-detail](#connector-detail) |
| Cài đặt workspace (thành viên, đội nhóm, vai trò, nhãn) | `/workspaces/:workspaceId/settings` | [users](#users), [teams](#teams), [team-roles](#team-roles), [labels](#labels), [system-config](#system-config), [permission-me](#permission-me) |

### Đăng nhập / chọn workspace

`/workspaces`

Sau đăng nhập lấy user hiện tại và danh sách workspace.

API: `/api/user/get/me`, `/api/user/me/get/workspaces`, `/api/user/me/get/pending-workspaces`

### Khung app (sidebar, header) — mọi trang trong workspace

`/workspaces/:workspaceId/*`

system-config quyết định bật/tắt mục menu (Social, Analytics…); work-groups + tables dựng cây Apps; notif-unread cho badge Thông báo; invitations quyết định có hiện mục Lời mời.

API: `/api/workspace/{workspaceId}/workspace/get/me`, `/api/workspace/{workspaceId}/system/get/system-config`, `/api/workspace/{workspaceId}/workspace_permission/permission/get/me`, `/api/workspace/{workspaceId}/notification/get/notifications/unread_count`, `/api/workspace/{workspaceId}/me/get/incoming-invitations`, `/api/workspace/{workspaceId}/workflow/get/p/active_work_groups`, `/api/workspace/{workspaceId}/workflow/get/active_tables`

### Thông báo

`/workspaces/:workspaceId/notifications`

API: `/api/workspace/{workspaceId}/notification/get/notifications`, `/api/workspace/{workspaceId}/notification/get/notifications/unread_count`

### Apps — danh sách bảng

`/workspaces/:workspaceId/tables`

table-permission-me lọc bảng/hành động user được phép.

API: `/api/workspace/{workspaceId}/workflow/get/p/active_work_groups`, `/api/workspace/{workspaceId}/workflow/get/active_tables`, `/api/workspace/{workspaceId}/workflow/get/active_tables/permission/me`

### Bản ghi của bảng (Danh sách / Kanban)

`/workspaces/:workspaceId/tables/:tableId/records`

config.fields định nghĩa cột; recordListConfig/kanbanConfigs/quickFilters định nghĩa màn hình. users để hiện người phụ trách.

API: `/api/workspace/{workspaceId}/workflow/get/active_tables/{id}`, `/api/workspace/{workspaceId}/workflow/get/active_tables/{id}/records`, `/api/workspace/{workspaceId}/workspace/get/users`, `/api/workspace/{workspaceId}/workflow/get/active_tables/permission/me`

### Chi tiết bản ghi

`/workspaces/:workspaceId/tables/:tableId/records/:recordId`

Bản ghi đơn lấy qua chính endpoint records với filtering.id. recordDetailConfig.refRecords → gọi thêm records của bảng liên quan.

API: `/api/workspace/{workspaceId}/workflow/get/active_tables/{id}`, `/api/workspace/{workspaceId}/workflow/get/active_tables/{id}/records`, `/api/workspace/{workspaceId}/workflow/active_tables/{id}/records/{id}/get/comments`, `/api/workspace/{workspaceId}/workspace/get/users`

### Cài đặt bảng

`/workspaces/:workspaceId/tables/:tableId/settings`

Toàn bộ tab (Trường, Danh sách, Bộ lọc, Chi tiết, Kanban…) đọc/ghi trong table.config. tables dùng cho trường tham chiếu; teams/team-roles cho Phân quyền.

API: `/api/workspace/{workspaceId}/workflow/get/active_tables/{id}`, `/api/workspace/{workspaceId}/workflow/get/p/active_work_groups`, `/api/workspace/{workspaceId}/workflow/get/active_tables`, `/api/workspace/{workspaceId}/workspace/get/p/teams`, `/api/workspace/{workspaceId}/label/get/p/labels`

### Cloud Logic (Workflow)

`/workspaces/:workspaceId/workflow-units[/:unitId]`

Mỗi unit có nhiều event; event chứa trigger (eventSourceType/Params) và YAML workflow.

API: `/api/workspace/{workspaceId}/workflow/get/workflow_units`, `/api/workspace/{workspaceId}/workflow/get/workflow_units/{id}`, `/api/workspace/{workspaceId}/workflow/get/workflow_events`

### Biểu mẫu

`/workspaces/:workspaceId/workflow-forms[/:formId]`

API: `/api/workspace/{workspaceId}/workflow/get/workflow_forms`

### Kết nối

`/workspaces/:workspaceId/workflow-connectors[/:connectorId]`

API: `/api/workspace/{workspaceId}/workflow/get/workflow_connector_types`, `/api/workspace/{workspaceId}/workflow/get/workflow_connectors`, `/api/workspace/{workspaceId}/workflow/get/workflow_connectors/{id}`

### Cài đặt workspace (thành viên, đội nhóm, vai trò, nhãn)

`/workspaces/:workspaceId/settings`

API: `/api/workspace/{workspaceId}/workspace/get/users`, `/api/workspace/{workspaceId}/workspace/get/p/teams`, `/api/workspace/{workspaceId}/workspace/get/p/team_roles`, `/api/workspace/{workspaceId}/label/get/p/labels`, `/api/workspace/{workspaceId}/system/get/system-config`, `/api/workspace/{workspaceId}/workspace_permission/permission/get/me`

## Chi tiết từng API

### comments

`POST /api/workspace/{workspaceId}/workflow/active_tables/{id}/records/{id}/get/comments` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,commentContent,createdBy,createdAt,updatedAt",
    "limit": 5
  }
}
```

Response (đã che):

```json
{
  "data": [],
  "next_id": null,
  "previous_id": null
}
```

### connector-detail

`POST /api/workspace/{workspaceId}/workflow/get/workflow_connectors/{id}` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,connectorType,description,config,documentation,createdBy,updatedBy,createdAt,updatedAt,isReady,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "name": "<string>",
    "connectorType": "ACTIVE_TABLE",
    "description": "",
    "config": {
      "tableId": "<snowflake-id>",
      "tableKey": "<redacted>"
    },
    "documentation": "<string>",
    "createdBy": "<id>",
    "updatedBy": "<string>",
    "createdAt": "<datetime>",
    "updatedAt": null,
    "isReady": false,
    "userPermission": {
      "access": false,
      "update": false,
      "delete": false
    }
  },
  "meta": {
    "limit": 1000
  }
}
```

### connector-types

`POST /api/workspace/{workspaceId}/workflow/get/workflow_connector_types` → HTTP 200

Request body:

```json
{}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "type": "SMTP",
      "name": "<string>",
      "description": "<string>",
      "logo": "<url>",
      "oauth": false,
      "configFields": [
        {
          "name": "<string>",
          "type": "text",
          "label": "<string>",
          "required": true,
          "secret": "<redacted>"
        },
        "…"
      ]
    },
    "…"
  ]
}
```

### connectors

`POST /api/workspace/{workspaceId}/workflow/get/workflow_connectors` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,connectorType,description,config,documentation,createdBy,updatedBy,createdAt,updatedAt,isReady,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "connectorType": "ACTIVE_TABLE",
      "description": "",
      "config": {
        "tableId": "<snowflake-id>",
        "tableKey": "<redacted>"
      },
      "documentation": "<string>",
      "createdBy": "<id>",
      "updatedBy": "<string>",
      "createdAt": "<datetime>",
      "updatedAt": null,
      "isReady": false,
      "userPermission": {
        "access": true,
        "update": true,
        "delete": true
      }
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### invitations

`POST /api/workspace/{workspaceId}/me/get/incoming-invitations` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,workspaceTeamId,workspaceTeamRoleId,invitedBy,invitedAt,invitedByUser{id,fullName,avatar},workspaceTeam{id,teamName},workspaceTeamRole{id,roleName}"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "meta": {
    "sort": {
      "id": "<string>"
    }
  }
}
```

### labels

`POST /api/workspace/{workspaceId}/label/get/p/labels` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,labelName,labelType"
  }
}
```

Response (đã che):

```json
{
  "data": [
    {
      "id": "<id>",
      "labelType": "workspace_team_role",
      "labelName": "<string>"
    }
  ],
  "limit": 1000,
  "sort": {
    "id": "<string>"
  }
}
```

### notif-unread

`POST /api/workspace/{workspaceId}/notification/get/notifications/unread_count` → HTTP 200

Request body:

```json
{}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "unreadCount": 0
  }
}
```

### notifications

`POST /api/workspace/{workspaceId}/notification/get/notifications` → HTTP 200

Request body:

```json
{
  "paging": "cursor",
  "limit": 5
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "pagination": {
    "nextCursor": null,
    "previousCursor": null
  },
  "meta": {
    "limit": 1000,
    "sort": {
      "id": "<string>"
    }
  }
}
```

### permission-me

`POST /api/workspace/{workspaceId}/workspace_permission/permission/get/me` → HTTP 200

Request body:

```json
{}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "workspaceId": "<snowflake-id>",
    "userId": "<id>",
    "canGrantPermission": true,
    "canAccessSystemInfo": true,
    "canAccessSocial": true,
    "canAccessSetting": true,
    "settingStaticSubjectCodes": [
      "<string>",
      "…"
    ],
    "socialStaticSubjectCodes": [
      "<string>",
      "…"
    ],
    "activeSubjects": [],
    "staticSubjects": {
      "WORKSPACE_TEAM": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "ACTIVE_TABLE": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "OPTIN_FORM": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "WORKFLOW_UNIT": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "WORKFLOW_CONNECTOR": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "SHIPMENT_ORDER": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [],
            "isAllowed": false
          },
          "…"
        ]
      },
      "E_INVOICE": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [],
            "isAllowed": false
          },
          "…"
        ]
      },
      "WORKSPACE_LABEL": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "WORK_GROUP": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "FACEBOOK": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "ZALO": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "WHATSAPP": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [
              "all"
            ],
            "isAllowed": true
          },
          "…"
        ]
      },
      "INSTAGRAM": {
        "staticSubjectCode": "<string>",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "<string>",
            "scopes": [],
            "isAllowed": false
          },
          "…"
        ]
      }
    }
  }
}
```

### record-detail

`POST /api/workspace/{workspaceId}/workflow/get/active_tables/{id}/records` → HTTP 200

Request body:

```json
{
  "paging": "cursor",
  "limit": 1,
  "filtering": {
    "id": "1CdPAUaGZ6VJGVRZN6pMge"
  }
}
```

Response (đã che):

```json
{
  "data": [
    {
      "id": "<id>",
      "record": {
        "ma_don_hang": "<string>",
        "khach_hang": "<id>",
        "trang_thai": "<string>",
        "trang_thai_thanh_toan": "<string>",
        "trang_thai_xuat_kho": "<string>",
        "nguoi_phu_trach": "<id>",
        "ghi_chu": "<string>"
      },
      "items": [
        {
          "id": "<string>",
          "_item_hashes": [],
          "mat_hang": "<id>",
          "so_luong": "<string>",
          "don_gia": "<string>",
          "vat": "<string>"
        }
      ],
      "itemTotalSum": {
        "tong_tien_hang": "<string>",
        "tong_vat": "<string>",
        "tong_cong": "<string>"
      },
      "createdBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": null,
      "valueUpdatedAt": {
        "khach_hang": "<datetime>",
        "trang_thai": "<datetime>",
        "trang_thai_thanh_toan": "<datetime>",
        "trang_thai_xuat_kho": "<datetime>",
        "nguoi_phu_trach": "<datetime>"
      },
      "historicalUpdatedAt": {
        "khach_hang": [
          {
            "value": "<id>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai_thanh_toan": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai_xuat_kho": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "nguoi_phu_trach": [
          {
            "value": "<id>",
            "updatedAt": "<datetime>"
          }
        ]
      },
      "relatedUserIds": [
        "<id>"
      ],
      "social": [],
      "assignedUserIds": [
        "<id>"
      ],
      "disableCloudLogic": false,
      "permissions": {
        "access": true,
        "update": true,
        "delete": true,
        "comment_create": true,
        "custom_019d80ba-b3e6-7d-8e-125c556387f9": true,
        "custom_019d80bb-df62-78-bd-86a42c764d67": true,
        "custom_019e3593-a093-7b-b5-1394fd2119ca": true
      }
    }
  ],
  "next_id": null,
  "previous_id": null
}
```

### records

`POST /api/workspace/{workspaceId}/workflow/get/active_tables/{id}/records` → HTTP 200

Request body:

```json
{
  "paging": "cursor",
  "limit": 3,
  "filtering": {},
  "direction": "desc"
}
```

Response (đã che):

```json
{
  "data": [
    {
      "id": "<id>",
      "record": {
        "ma_don_hang": "<string>",
        "khach_hang": "<id>",
        "trang_thai": "<string>",
        "trang_thai_thanh_toan": "<string>",
        "trang_thai_xuat_kho": "<string>",
        "nguoi_phu_trach": "<id>",
        "ghi_chu": "<string>"
      },
      "items": [
        {
          "id": "<string>",
          "_item_hashes": [],
          "mat_hang": "<id>",
          "so_luong": "<string>",
          "don_gia": "<string>",
          "vat": "<string>"
        }
      ],
      "itemTotalSum": {
        "tong_tien_hang": "<string>",
        "tong_vat": "<string>",
        "tong_cong": "<string>"
      },
      "createdBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": null,
      "valueUpdatedAt": {
        "khach_hang": "<datetime>",
        "trang_thai": "<datetime>",
        "trang_thai_thanh_toan": "<datetime>",
        "trang_thai_xuat_kho": "<datetime>",
        "nguoi_phu_trach": "<datetime>"
      },
      "historicalUpdatedAt": {
        "khach_hang": [
          {
            "value": "<id>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai_thanh_toan": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "trang_thai_xuat_kho": [
          {
            "value": "<string>",
            "updatedAt": "<datetime>"
          }
        ],
        "nguoi_phu_trach": [
          {
            "value": "<id>",
            "updatedAt": "<datetime>"
          }
        ]
      },
      "relatedUserIds": [
        "<id>"
      ],
      "social": [],
      "assignedUserIds": [
        "<id>"
      ],
      "disableCloudLogic": false,
      "permissions": {
        "access": true,
        "update": true,
        "delete": true,
        "comment_create": true,
        "custom_019d80ba-b3e6-7d-8e-125c556387f9": true,
        "custom_019d80bb-df62-78-bd-86a42c764d67": true,
        "custom_019e3593-a093-7b-b5-1394fd2119ca": true
      }
    },
    "…"
  ],
  "next_id": null,
  "previous_id": null
}
```

### system-config

`POST /api/workspace/{workspaceId}/system/get/system-config` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "timeZone,e2eeEncryption,cpuLimit,staticSubject,activeTableSubject,startTime,endTime"
  }
}
```

Response (đã che):

```json
{
  "data": {
    "timeZone": "GMT+7",
    "e2eeEncryption": "<redacted>",
    "allowDeleteActiveTableSubject": false,
    "isSocialChatEnabled": false,
    "cpuLimit": 1,
    "staticSubject": [
      {
        "limit": 10,
        "usedCount": 0,
        "name": "<string>"
      },
      "…"
    ],
    "activeTableSubject": [
      {
        "limit": 50000,
        "usedCount": 0,
        "id": "<snowflake-id>"
      },
      "…"
    ],
    "startTime": "<datetime>",
    "endTime": "<datetime>"
  }
}
```

### table-detail

`POST /api/workspace/{workspaceId}/workflow/get/active_tables/{id}` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,icon,iconColor,workGroupId,tableType,description,config,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<snowflake-id>",
    "name": "<string>",
    "icon": "FileText",
    "iconColor": "<string>",
    "workGroupId": "<id>",
    "tableType": "",
    "description": "",
    "config": {
      "title": "<string>",
      "fields": [
        {
          "type": "AUTO_GENERATED_CODE",
          "label": "<string>",
          "name": "<string>",
          "placeholder": "<string>",
          "codeTemplate": "<string>",
          "columnWidth": null
        },
        "…"
      ],
      "itemFieldLabel": "<string>",
      "itemFields": [
        {
          "type": "SELECT_ONE_RECORD",
          "label": "<string>",
          "name": "<string>",
          "placeholder": "",
          "defaultValue": "",
          "required": false,
          "referenceTableId": "<snowflake-id>",
          "referenceLabelField": "<string>",
          "additionalCondition": "",
          "autoFillSelected": "",
          "autoFillSelectedFieldTarget": "",
          "columnWidth": null,
          "isLocked": false
        },
        "…"
      ],
      "totalSumItemFields": [
        {
          "sumField": "<string>",
          "field": "<string>",
          "label": "<string>",
          "customFormula": "<string>",
          "manualUpdate": false,
          "decimalPlaces": null,
          "unit": null
        },
        "…"
      ],
      "itemAutoInit": {
        "enabled": false,
        "triggerField": "",
        "itemFieldMappings": [],
        "totalSumItemFieldMappings": []
      },
      "actions": [
        {
          "name": "<string>",
          "type": "create",
          "icon": "create",
          "actionId": "<string>",
          "inputFields": []
        },
        "…"
      ],
      "quickFilters": [
        {
          "fieldName": "<string>"
        },
        "…"
      ],
      "tableLimit": 1000,
      "e2eeEncryption": "<redacted>",
      "encryptionKey": "<redacted>",
      "encryptionAuthKey": "<redacted>",
      "hashedKeywordFields": [
        "<string>"
      ],
      "defaultSort": "desc",
      "defaultScreen": {
        "type": "list",
        "screenId": ""
      },
      "kanbanConfigs": [
        {
          "kanbanScreenId": "<string>",
          "screenName": "<string>",
          "screenDescription": "",
          "statusField": "<string>",
          "kanbanHeadlineField": "<string>",
          "displayFields": [
            "<string>",
            "…"
          ]
        },
        "…"
      ],
      "recordListConfig": {
        "layout": "generic-table",
        "displayFields": [
          "<string>",
          "…"
        ],
        "totalSumFields": [
          {
            "field": "<string>",
            "label": "<string>",
            "dependentFields": [],
            "customFormula": null,
            "decimalPlaces": null,
            "unit": null
          },
          "…"
        ]
      },
      "recordDetailConfig": {
        "layout": "head-detail",
        "commentsPosition": "hidden",
        "rowTailFields": [
          "<string>",
          "…"
        ],
        "headTitleField": "<string>",
        "headSubLineFields": [
          "<string>",
          "…"
        ],
        "refRecords": [
          {
            "title": "<string>",
            "subTitle": "",
            "refTableId": "<snowflake-id>",
            "refField": "<string>",
            "refFieldType": "fields",
            "showCreateButton": true,
            "extraConditions": "<string>",
            "layout": "generic-table",
            "displayFields": [
              "<string>",
              "…"
            ],
            "titleField": "",
            "subLineFields": [],
            "tailFields": [],
            "totalSumFields": [
              {
                "field": "",
                "label": "<string>",
                "dependentFields": [],
                "customFormula": "<string>",
                "decimalPlaces": null,
                "unit": null
              },
              "…"
            ]
          },
          "…"
        ]
      },
      "permissionsConfig": [],
      "ganttCharts": [],
      "conversionConfigs": [],
      "pivotConfigs": [],
      "objectiveCardConfigs": []
    },
    "createdBy": "<id>",
    "updatedBy": "<id>",
    "createdAt": "<datetime>",
    "updatedAt": "<datetime>",
    "userPermission": {
      "access": false,
      "update": false,
      "delete": false
    }
  },
  "meta": {
    "limit": 1000
  }
}
```

### table-permission-me

`POST /api/workspace/{workspaceId}/workflow/get/active_tables/permission/me` → HTTP 200

Request body:

```json
{}
```

Response (đã che):

```json
{
  "data": [
    {
      "tableId": "<snowflake-id>",
      "permissions": [
        {
          "type": "create",
          "actionId": "<string>",
          "allow": true,
          "scopes": [
            "self_created"
          ]
        },
        "…"
      ]
    },
    "…"
  ]
}
```

### tables

`POST /api/workspace/{workspaceId}/workflow/get/active_tables` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,icon,iconColor,workGroupId,tableType,description,config,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<snowflake-id>",
      "name": "<string>",
      "icon": "Users",
      "iconColor": "<string>",
      "workGroupId": "<id>",
      "tableType": "CUSTOMER_PIPELINE",
      "description": "<string>",
      "config": {
        "title": "<string>",
        "fields": [
          {
            "type": "SHORT_TEXT",
            "label": "<string>",
            "name": "<string>",
            "placeholder": "<string>",
            "defaultValue": "",
            "required": true,
            "autoFillSelected": "",
            "autoFillSelectedFieldTarget": "",
            "maxLength": null,
            "isUnique": false,
            "columnWidth": null,
            "isLocked": false
          },
          "…"
        ],
        "itemFieldLabel": "",
        "itemFields": [],
        "totalSumItemFields": [],
        "itemAutoInit": {
          "enabled": false,
          "triggerField": "",
          "itemFieldMappings": [],
          "totalSumItemFieldMappings": []
        },
        "actions": [
          {
            "name": "<string>",
            "type": "create",
            "icon": "create",
            "actionId": "<string>",
            "inputFields": []
          },
          "…"
        ],
        "quickFilters": [
          {
            "fieldName": "<string>"
          },
          "…"
        ],
        "tableLimit": 1000,
        "e2eeEncryption": "<redacted>",
        "encryptionKey": "<redacted>",
        "encryptionAuthKey": "<redacted>",
        "hashedKeywordFields": [
          "<string>",
          "…"
        ],
        "defaultSort": "desc",
        "defaultScreen": {
          "type": "list",
          "screenId": ""
        },
        "kanbanConfigs": [
          {
            "kanbanScreenId": "<string>",
            "screenName": "<string>",
            "screenDescription": "",
            "statusField": "<string>",
            "kanbanHeadlineField": "<string>",
            "displayFields": [
              "<string>",
              "…"
            ]
          },
          "…"
        ],
        "recordListConfig": {
          "layout": "generic-table",
          "displayFields": [
            "<string>",
            "…"
          ],
          "totalSumFields": [
            {
              "field": "",
              "label": "<string>",
              "dependentFields": [],
              "customFormula": "<string>",
              "decimalPlaces": null,
              "unit": null
            },
            "…"
          ]
        },
        "recordDetailConfig": {
          "layout": "head-detail",
          "commentsPosition": "right-panel",
          "rowTailFields": [
            "<string>",
            "…"
          ],
          "headTitleField": "<string>",
          "headSubLineFields": [
            "<string>",
            "…"
          ],
          "refRecords": [
            {
              "title": "<string>",
              "subTitle": "",
              "refTableId": "<snowflake-id>",
              "refField": "<string>",
              "refFieldType": "fields",
              "showCreateButton": true,
              "extraConditions": "",
              "layout": "generic-table",
              "displayFields": [
                "<string>",
                "…"
              ],
              "titleField": "",
              "subLineFields": [],
              "tailFields": [],
              "totalSumFields": [
                {
                  "field": "",
                  "label": "<string>",
                  "dependentFields": [],
                  "customFormula": "<string>",
                  "decimalPlaces": null,
                  "unit": null
                }
              ]
            },
            "…"
          ]
        },
        "permissionsConfig": [],
        "ganttCharts": [],
        "conversionConfigs": [],
        "pivotConfigs": [],
        "objectiveCardConfigs": []
      },
      "createdBy": "<id>",
      "updatedBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>",
      "userPermission": {
        "access": true,
        "update": true,
        "delete": true
      }
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### team-roles

`POST /api/workspace/{workspaceId}/workspace/get/p/team_roles` → HTTP 400

Request body:

```json
{
  "constraints": {},
  "queries": {
    "fields": "id,roleName,roleCode,roleDescription,isDefault"
  }
}
```

Response (đã che):

```json
{
  "message": "<string>",
  "errors": {
    "$.constraints": "<string>"
  }
}
```

### teams

`POST /api/workspace/{workspaceId}/workspace/get/p/teams` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,teamName,teamDescription"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "teamName": "<string>",
      "teamDescription": ""
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### user-me

`POST /api/user/get/me` → HTTP 200

Request body:

```json
{}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>"
  }
}
```

### user-pending-workspaces

`POST /api/user/me/get/pending-workspaces` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,namespace,workspaceName,logo"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "meta": {
    "limit": 1000
  }
}
```

### user-workspaces

`POST /api/user/me/get/workspaces` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,namespace,workspaceName,myWorkspaceUser{id,fullName,email,phone,avatar},ownedByUser,ownedBy,logo,thumbnailLogo,createdAt,updatedAt"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<snowflake-id>",
      "namespace": "<string>",
      "workspaceName": "<string>",
      "myWorkspaceUser": {
        "id": "<id>",
        "fullName": "<string>",
        "email": "<string>",
        "phone": "",
        "avatar": "<url>"
      },
      "ownedByUser": {
        "id": "<id>"
      },
      "ownedBy": "<id>",
      "logo": "",
      "thumbnailLogo": "",
      "createdAt": "<datetime>",
      "updatedAt": null
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### users

`POST /api/workspace/{workspaceId}/workspace/get/users` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,fullName,avatar,thumbnailAvatar",
    "filtering": {}
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "fullName": "<string>",
      "avatar": "<url>",
      "thumbnailAvatar": ""
    }
  ],
  "meta": {
    "limit": 1000,
    "sort": {
      "id": "<string>"
    }
  }
}
```

### work-groups

`POST /api/workspace/{workspaceId}/workflow/get/p/active_work_groups` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,description"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "description": ""
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### workflow-events

`POST /api/workspace/{workspaceId}/workflow/get/workflow_events` → HTTP 200

Request body:

```json
{
  "filtering": {
    "workflowUnit": "1CZ5AJoq9zJqDoHEDP9AWd"
  },
  "queries": {
    "fields": "id,eventName,eventActive,responseId,eventSourceType,eventSourceParams,workflowCode,workflowDefaultData,workflowUnit,yaml,createdBy,updatedBy,createdAt,updatedAt"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "eventName": "<string>",
      "eventActive": false,
      "responseId": "<string>",
      "eventSourceType": "ACTIVE_TABLE",
      "eventSourceParams": {
        "webhookId": "<string>",
        "tableId": "<snowflake-id>"
      },
      "workflowCode": "<string>",
      "workflowDefaultData": [],
      "workflowUnit": "<id>",
      "yaml": "<string>",
      "createdBy": "<id>",
      "updatedBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>"
    },
    "…"
  ],
  "meta": {
    "filtering": {
      "workflowUnit =": "<id>"
    },
    "limit": 1000
  }
}
```

### workflow-forms

`POST /api/workspace/{workspaceId}/workflow/get/workflow_forms` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,formType,description,config,formLink,formEmbedCode,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "meta": {
    "limit": 1000
  }
}
```

### workflow-unit-detail

`POST /api/workspace/{workspaceId}/workflow/get/workflow_units/{id}` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,description,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "name": "<string>",
    "description": "",
    "createdBy": "<id>",
    "updatedBy": "<id>",
    "createdAt": "<datetime>",
    "updatedAt": "<datetime>",
    "userPermission": {
      "access": false,
      "update": false,
      "delete": false
    }
  },
  "meta": {
    "limit": 1000
  }
}
```

### workflow-units

`POST /api/workspace/{workspaceId}/workflow/get/workflow_units` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,name,description,createdAt,updatedAt"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "description": "",
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>"
    },
    "…"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### workspace-me

`POST /api/workspace/{workspaceId}/workspace/get/me` → HTTP 200

Request body:

```json
{
  "queries": {
    "fields": "id,fullName,avatar,thumbnailAvatar,email,phone,phoneCountryCode,globalUser{username},workspaceMemberships{userId,workspaceTeamRoleId,workspaceTeamId,invitedAt},createdAt,updatedAt"
  }
}
```

Response (đã che):

```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "fullName": "<string>",
    "avatar": "<url>",
    "thumbnailAvatar": "",
    "email": "<string>",
    "phone": "",
    "phoneCountryCode": "",
    "globalUser": {
      "username": "<string>"
    },
    "workspaceMemberships": [
      {
        "userId": "<id>",
        "workspaceTeamRoleId": "<id>",
        "workspaceTeamId": "<id>",
        "invitedAt": "<datetime>"
      }
    ],
    "createdAt": 0,
    "updatedAt": null
  }
}
```

## Đầu ghi (chỉ liệt kê, không gọi)

Tạo/sửa/xoá dùng cùng mẫu path với động từ khác, ví dụ:

- `/api/workspace/{workspaceId}/workflow/post/active_tables`
- `/api/workspace/{workspaceId}/workflow/patch/active_tables/{tableId}`
- `/api/workspace/{workspaceId}/workflow/delete/active_tables/{tableId}`
- `/api/workspace/{workspaceId}/workflow/post/active_tables/{tableId}/records`
- `/api/workspace/{workspaceId}/workflow/patch/active_tables/{tableId}/records/{recordId}`
- `/api/workspace/{workspaceId}/workflow/delete/active_tables/{tableId}/records/{recordId}`
- `/api/workspace/{workspaceId}/workflow/delete/active_tables/{tableId}/batch_delete`
- `/api/workspace/{workspaceId}/workflow/post/active_tables/{tableId}/records/{recordId}/action/{actionId}`
- `/api/workspace/{workspaceId}/workflow/post/active_tables/{tableId}/batch_action/{actionId}`
- `/api/workspace/{workspaceId}/workflow/active_tables/{tableId}/records/{recordId}/post|patch|delete/comments[/{commentId}]`
- `/api/workspace/{workspaceId}/workflow/post|patch|delete/workflow_units[/{id}]`
- `/api/workspace/{workspaceId}/workflow/post|patch|delete/workflow_events[/{id}]`
- `/api/workspace/{workspaceId}/workflow/post|patch|delete/workflow_forms[/{id}]`
- `/api/workspace/{workspaceId}/notification/patch/notifications/{id}/read`
- `/api/workspace/{workspaceId}/notification/patch/notifications/read_all`
