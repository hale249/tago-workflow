# API bản tham khảo — ảnh chụp 2026-10-22

Ghi lại **chỉ-đọc** trên bản mới nhất của beqeek.com: mở từng trang, một script trong trang ghi lại đúng các request mà trang tự gọi (không gửi thêm request nào, không bấm thao tác ghi). 251 request → 37 đầu API, tất cả là `POST …/get/…` (đọc) trừ `websocket/subscribe|unsubscribe` (trang tự đăng ký kênh realtime).

Response đã **che dữ liệu**: chuỗi → `<string>`, id → `<id>`, thời gian → `<datetime>`, email → `<email>`, URL → `<url>`, khoá/mã băm → `<redacted>`, số → `0` (trừ `httpCode`, `limit`); giữ nguyên mã cố định (vd `SHORT_TEXT`, `success`) và mã màu. Mảng chỉ giữ 1 phần tử mẫu. Quy ước chung (Bearer token, động từ trong path, `queries.fields`, phân trang cursor) xem `docs/beqeek-api.md`.

**Mới so với `docs/beqeek-api.md` (08/10)** được đánh dấu 🆕.

## Trang → API

| Trang | API gọi khi mở trang |
|---|---|
| `apps` | `/workspace/get/users`, `/workflow/get/active_tables` |
| `connector-detail` | `/workflow/get/workflow_connectors/{id}`, `/workflow/get/active_tables/{tableId}` |
| `connector-select` | `/workflow/get/workflow_connector_types`, `/workflow/get/active_tables` |
| `connectors` | `/workflow/get/workflow_connector_types`, `/workflow/get/workflow_connectors` |
| `dashboard` | `/user/me/get/pending-workspaces` |
| `event-console` | `/workflow/get/workflow_events/{id}`, `/workflow/get/active_tables` |
| `event-edit` | `/workflow/get/workflow_events/{id}`, `/workflow/get/workflow_forms`, `/workflow/get/active_tables`, `/workflow/get/workflow_events` |
| `forms` | `/workflow/get/workflow_forms`, `/workflow/get/active_tables` |
| `invitations` | `/workflow/get/active_tables`, `/user/me/get/pending-workspaces` |
| `notifications` | `/workspace/get/users`, `/workflow/get/active_tables`, `/label/get/p/labels`, `/notification/get/notifications` |
| `profile` | `/user/get/me` |
| `record-detail-order` | `/workspace/get/users`, `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables/{tableId}/records`, `/workflow/get/active_tables`, `/workflow/active_tables/{tableId}/records/{id}/get/comments` |
| `record-edit` | `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables/{tableId}/records` |
| `record-new` | `/workspace/get/users`, `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables` |
| `records-customers` | `/workspace/get/users`, `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables/{tableId}/records`, `/workflow/get/active_tables` |
| `records-orders` | `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables/{tableId}/records` |
| `records-tasks` | `/workspace/get/users`, `/workflow/get/active_tables/{tableId}`, `/workflow/get/active_tables/{tableId}/records`, `/workflow/get/active_tables` |
| `settings-labels` | `/workflow/get/active_tables`, `/label/get/labels` |
| `settings-permissions` | `/workspace/get/p/teams`, `/workspace_permission/get/permissions/{id}` |
| `settings-system` | `/workflow/get/active_tables` |
| `settings-teams` | `/workflow/get/active_tables`, `/label/get/labels`, `/workspace/get/p/teams` |
| `settings-workgroups` | `/workflow/get/active_work_groups` |
| `social-facebook` | `/workflow/get/active_tables` |
| `social-instagram` | `/workspace/get/users`, `/workflow/get/active_tables`, `/workflow/ig_chat/get/setting`, `/workflow/ig_chat/get/connectors` |
| `social-whatsapp` | `/workflow/wa_chat/get/setting`, `/workflow/wa_chat/get/connectors` |
| `social-zalo` | `/workflow/zl_chat/get/connectors`, `/workflow/zl_chat/get/setting` |
| `table-settings` | `/workspace/get/users`, `/workflow/get/active_tables` |
| `team` | `/label/get/labels`, `/workspace/get/p/teams` |
| `team-detail` | `/workspace/get/users`, `/label/get/labels`, `/workspace/get/p/team_roles` |
| `unit-detail` | `/workflow/get/workflow_events`, `/workflow/get/workflow_units/{id}` |
| `units` | `/workflow/get/active_tables`, `/workflow/get/workflow_units` |

Mọi trang trong workspace còn gọi chung (khung app): `/workspace/get/me`, `/system/get/system-config`, `/me/get/incoming-invitations`, `/workflow/get/p/active_work_groups`, `/notification/get/notifications/unread_count`, `/workspace_permission/permission/get/me`, `/websocket/unsubscribe`, `/workflow/get/active_tables/permission/me`, `/websocket/subscribe`.

## Chi tiết từng API

### `POST /api/workspace/{workspaceId}/workspace/get/users`

Trang: `apps`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `social-instagram`, `table-settings`, `team-detail`

Request body:
```json
{
  "queries": {
    "fields": "id,fullName",
    "filtering": {}
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "fullName": "<string>"
    }
  ],
  "meta": {
    "limit": 1000,
    "sort": {
      "id": "desc"
    }
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_connectors/{id}`

Trang: `connector-detail`

Request body:
```json
{
  "queries": {
    "fields": "id,name,connectorType,description,config,documentation,createdBy,updatedBy,createdAt,updatedAt,isReady,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "name": "<string>",
    "connectorType": "ACTIVE_TABLE",
    "description": "<string>",
    "config": {
      "tableId": "<id>",
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

### `POST /api/workspace/{workspaceId}/workflow/get/active_tables/{tableId}`

Trang: `connector-detail`, `record-detail-order`, `record-edit`, `record-new`, `records-customers`, `records-orders`, `records-tasks`

Request body:
```json
{
  "queries": {
    "fields": "id,name,icon,iconColor,workGroupId,displayOrder,tableType,description,config,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "name": "<string>",
    "icon": "Users",
    "iconColor": "#2563EB",
    "workGroupId": "<id>",
    "displayOrder": 0,
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
          "defaultValue": "<string>",
          "required": true,
          "autoFillSelected": "<string>",
          "autoFillSelectedFieldTarget": "<string>",
          "maxLength": null,
          "isUnique": false,
          "columnWidth": null,
          "isLocked": false
        },
        "… (14 phần tử)"
      ],
      "itemFieldLabel": "<string>",
      "itemFields": [],
      "totalSumItemFields": [],
      "itemAutoInit": {
        "enabled": false,
        "triggerField": "<string>",
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
        "… (8 phần tử)"
      ],
      "quickFilters": [
        {
          "fieldName": "<string>"
        },
        "… (6 phần tử)"
      ],
      "tableLimit": 0,
      "e2eeEncryption": false,
      "encryptionKey": "<redacted>",
      "encryptionAuthKey": "<redacted>",
      "hashedKeywordFields": [
        "<redacted>",
        "… (7 phần tử)"
      ],
      "defaultSort": "desc",
      "defaultScreen": {
        "type": "list",
        "screenId": "<string>"
      },
      "kanbanConfigs": [
        {
          "kanbanScreenId": "<string>",
          "screenName": "<string>",
          "screenDescription": "<string>",
          "statusField": "<string>",
          "kanbanHeadlineField": "<string>",
          "displayFields": [
            "<string>",
            "… (6 phần tử)"
          ]
        },
        "… (3 phần tử)"
      ],
      "recordListConfig": {
        "layout": "<string>",
        "displayFields": [
          "<string>",
          "… (16 phần tử)"
        ],
        "totalSumFields": [
          {
            "field": "<string>",
            "label": "<string>",
            "dependentFields": [],
            "customFormula": "<string>",
            "decimalPlaces": null,
            "unit": null
          },
          "… (2 phần tử)"
        ]
      },
      "recordDetailConfig": {
        "layout": "<string>",
        "commentsPosition": "<string>",
        "rowTailFields": [
          "<string>",
          "… (20 phần tử)"
        ],
        "headTitleField": "<string>",
        "headSubLineFields": [
          "<string>",
          "… (5 phần tử)"
        ],
        "refRecords": [
          {
            "title": "<string>",
            "subTitle": "<string>",
            "refTableId": "<id>",
            "refField": "<string>",
            "refFieldType": "<string>",
            "showCreateButton": true,
            "extraConditions": "<string>",
            "layout": "<string>",
            "displayFields": [
              "<string>",
              "… (3 phần tử)"
            ],
            "titleField": "<string>",
            "subLineFields": [],
            "tailFields": [],
            "totalSumFields": [
              {
                "field": "<string>",
                "label": "<string>",
                "dependentFields": [],
                "customFormula": "<string>",
                "decimalPlaces": null,
                "unit": null
              }
            ]
          },
          "… (3 phần tử)"
        ]
      },
      "permissionsConfig": [],
      "ganttCharts": [],
      "conversionConfigs": [],
      "pivotConfigs": [],
      "objectiveCardConfigs": [],
      "calendarConfigs": []
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
  … (cắt bớt, 165 dòng)
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_connector_types`

Trang: `connector-select`, `connectors`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "type": "SMTP",
      "name": "SMTP",
      "description": "<string>",
      "logo": "<url>",
      "oauth": false,
      "configFields": [
        {
          "name": "<string>",
          "type": "text",
          "label": "<string>",
          "required": true,
          "secret": false
        },
        "… (8 phần tử)"
      ]
    },
    "… (24 phần tử)"
  ]
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_connectors`

Trang: `connectors`

Request body:
```json
{
  "queries": {
    "fields": "id,name,connectorType,description,config,documentation,createdBy,updatedBy,createdAt,updatedAt,isReady,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "connectorType": "ACTIVE_TABLE",
      "description": "<string>",
      "config": {
        "tableId": "<id>",
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
    "… (4 phần tử)"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_events/{id}`

Trang: `event-console`, `event-edit`

Request body:
```json
{
  "queries": {
    "fields": "id,eventName,eventActive,responseId,eventSourceType,eventSourceParams,workflowCode,workflowDefaultData,workflowUnit,yaml,createdBy,updatedBy,createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "eventName": "<string>",
    "eventActive": false,
    "responseId": "<string>",
    "eventSourceType": "ACTIVE_TABLE",
    "eventSourceParams": {
      "webhookId": "<string>",
      "tableId": "<id>"
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
  "meta": {
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_forms`

Trang: `event-edit`, `forms`

Request body:
```json
{
  "queries": {
    "fields": "id,name,formType,description,config,formLink,formEmbedCode,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```
Response (HTTP 200):
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

### `POST /api/workspace/{workspaceId}/workspace/get/me`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `social-instagram`, `social-whatsapp`, `social-zalo`, `table-settings`, `units`

Request body:
```json
{
  "queries": {
    "fields": "id,fullName,avatar,thumbnailAvatar,email,phone,phoneCountryCode,globalUser{username},workspaceMemberships{userId,workspaceTeamRoleId,workspaceTeamId,invitedAt},createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "fullName": "<string>",
    "avatar": "<url>",
    "thumbnailAvatar": "<string>",
    "email": "<email>",
    "phone": "<string>",
    "phoneCountryCode": "<string>",
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

### `POST /api/user/get/me`

Trang: `profile`

Request body:
```json
{
  "queries": {
    "fields": "id,username,fullName,email,phone,phoneCountryCode,avatar,emailVerifiedAt,phoneVerifiedAt,createdAt,updatedAt,password"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "username": "<string>",
    "fullName": "<string>",
    "email": "<email>",
    "phone": "<string>",
    "phoneCountryCode": "<string>",
    "avatar": "<url>",
    "emailVerifiedAt": null,
    "phoneVerifiedAt": null,
    "createdAt": null,
    "updatedAt": "<datetime>",
    "password": "<redacted>"
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/active_tables/{tableId}/records`

Trang: `record-detail-order`, `record-edit`, `records-customers`, `records-orders`, `records-tasks`

Request body:
```json
{
  "limit": 1,
  "offset": 0,
  "filtering": {
    "id:eq": "<id>"
  }
}
```
Response (HTTP 200):
```json
{
  "data": [
    {
      "id": "<id>",
      "record": {
        "ma_don_hang": "DH000004",
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
          "so_luong": "<email>",
          "don_gia": "<email>",
          "vat": "<email>"
        }
      ],
      "itemTotalSum": {
        "tong_tien_hang": "<email>",
        "tong_vat": "<email>",
        "tong_cong": "<email>"
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

### `POST /api/workspace/{workspaceId}/workflow/get/active_tables`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-system`, `settings-teams`, `social-facebook`, `social-instagram`, `table-settings`, `units`

Request body:
```json
{
  "filtering": {
    "id:in": [
      "<id>",
      "… (2 phần tử)"
    ]
  },
  "queries": {
    "fields": "id,name,icon,iconColor,workGroupId,displayOrder,tableType,description,config,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "icon": "Users",
      "iconColor": "#2563EB",
      "workGroupId": "<id>",
      "displayOrder": 0,
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
            "defaultValue": "<string>",
            "required": true,
            "autoFillSelected": "<string>",
            "autoFillSelectedFieldTarget": "<string>",
            "maxLength": null,
            "isUnique": false,
            "columnWidth": null,
            "isLocked": false
          },
          "… (14 phần tử)"
        ],
        "itemFieldLabel": "<string>",
        "itemFields": [],
        "totalSumItemFields": [],
        "itemAutoInit": {
          "enabled": false,
          "triggerField": "<string>",
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
          "… (8 phần tử)"
        ],
        "quickFilters": [
          {
            "fieldName": "<string>"
          },
          "… (6 phần tử)"
        ],
        "tableLimit": 0,
        "e2eeEncryption": false,
        "encryptionKey": "<redacted>",
        "encryptionAuthKey": "<redacted>",
        "hashedKeywordFields": [
          "<redacted>",
          "… (7 phần tử)"
        ],
        "defaultSort": "desc",
        "defaultScreen": {
          "type": "list",
          "screenId": "<string>"
        },
        "kanbanConfigs": [
          {
            "kanbanScreenId": "<string>",
            "screenName": "<string>",
            "screenDescription": "<string>",
            "statusField": "<string>",
            "kanbanHeadlineField": "<string>",
            "displayFields": [
              "<string>",
              "… (6 phần tử)"
            ]
          },
          "… (3 phần tử)"
        ],
        "recordListConfig": {
          "layout": "<string>",
          "displayFields": [
            "<string>",
            "… (16 phần tử)"
          ],
          "totalSumFields": [
            {
              "field": "<string>",
              "label": "<string>",
              "dependentFields": [],
              "customFormula": "<string>",
              "decimalPlaces": null,
              "unit": null
            },
            "… (2 phần tử)"
          ]
        },
        "recordDetailConfig": {
          "layout": "<string>",
          "commentsPosition": "<string>",
          "rowTailFields": [
            "<string>",
            "… (20 phần tử)"
          ],
          "headTitleField": "<string>",
          "headSubLineFields": [
            "<string>",
            "… (5 phần tử)"
          ],
          "refRecords": [
            {
              "title": "<string>",
              "subTitle": "<string>",
              "refTableId": "<id>",
              "refField": "<string>",
              "refFieldType": "<string>",
              "showCreateButton": true,
              "extraConditions": "<string>",
              "layout": "<string>",
              "displayFields": [
                "<string>",
                "… (3 phần tử)"
              ],
              "titleField": "<string>",
              "subLineFields": [],
              "tailFields": [],
              "totalSumFields": [
                {
                  "field": "<string>",
                  "label": "<string>",
                  "dependentFields": [],
                  "customFormula": "<string>",
                  "decimalPlaces": null,
                  "unit": null
                }
              ]
            },
            "… (3 phần tử)"
          ]
        },
        "permissionsConfig": [],
        "ganttCharts": [],
        "conversionConfigs": [],
        "pivotConfigs": [],
        "objectiveCardConfigs": [],
        "calendarConfigs": []
      },
      "createdBy": "<id>",
      "updatedBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>",
      "userPermission": {
        "access": true,
        "update": true,
        "delete": true
  … (cắt bớt, 168 dòng)
```

### 🆕 `POST /api/workspace/{workspaceId}/label/get/labels`

Trang: `settings-labels`, `settings-teams`, `team`, `team-detail`

Request body:
```json
{
  "queries": {
    "fields": "id,labelType,labelName,createdAt,createdBy,updatedAt,updatedBy",
    "filtering": {
      "labelType": "<string>"
    }
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "meta": {
    "filtering": {
      "labelType =": "<string>"
    },
    "limit": 1000,
    "sort": {
      "id": "desc"
    }
  }
}
```

### `POST /api/workspace/{workspaceId}/workspace/get/p/teams`

Trang: `settings-permissions`, `settings-teams`, `team`

Request body:
```json
{
  "queries": {
    "fields": "id,teamName,teamDescription,labelIds"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "teamName": "<string>",
      "teamDescription": "<string>",
      "labelIds": []
    },
    "… (3 phần tử)"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workspace_permission/get/permissions/{id}`

Trang: `settings-permissions`

Request body:
```json
{
  "constraints": {
    "workspaceTeamId": "<id>"
  }
}
```
Response (HTTP 200):
```json
"<không phải JSON>"
```

### `POST /api/workspace/{workspaceId}/system/get/system-config`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-system`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{
  "queries": {
    "fields": "timeZone,e2eeEncryption,cpuLimit,staticSubject,activeTableSubject,startTime,endTime"
  }
}
```
Response (HTTP 200):
```json
{
  "data": {
    "timeZone": "<string>",
    "e2eeEncryption": true,
    "allowDeleteActiveTableSubject": false,
    "isSocialChatEnabled": false,
    "cpuLimit": 0,
    "staticSubject": [
      {
        "limit": 10,
        "usedCount": 0,
        "name": "WORKSPACE_USER"
      },
      "… (9 phần tử)"
    ],
    "activeTableSubject": [
      {
        "limit": 50000,
        "usedCount": 0,
        "id": "<id>"
      },
      "… (8 phần tử)"
    ],
    "startTime": "<datetime>",
    "endTime": "<datetime>"
  }
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/get/active_work_groups`

Trang: `settings-workgroups`

Request body:
```json
{
  "queries": {
    "fields": "id,name,description,config,userIds,displayOrder,createdBy,updatedBy,createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "CRM",
      "description": "<string>",
      "config": [],
      "userIds": [],
      "displayOrder": 0,
      "createdBy": "<id>",
      "updatedBy": "<string>",
      "createdAt": "<datetime>",
      "updatedAt": null
    },
    "… (3 phần tử)"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/ig_chat/get/setting`

Trang: `social-instagram`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "workspaceId": "<id>",
    "activeTableId": "<string>",
    "assignableUserIds": [],
    "messageTemplateGroups": [],
    "messageTemplates": [],
    "tags": [],
    "created_at": null,
    "updated_at": null,
    "activeTable": null
  }
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/ig_chat/get/connectors`

Trang: `social-instagram`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": []
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/wa_chat/get/setting`

Trang: `social-whatsapp`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "workspaceId": "<id>",
    "activeTableId": "<string>",
    "assignableUserIds": [],
    "messageTemplateGroups": [],
    "messageTemplates": [],
    "tags": [],
    "created_at": null,
    "updated_at": null,
    "activeTable": null
  }
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/wa_chat/get/connectors`

Trang: `social-whatsapp`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": []
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/zl_chat/get/connectors`

Trang: `social-zalo`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": []
}
```

### 🆕 `POST /api/workspace/{workspaceId}/workflow/zl_chat/get/setting`

Trang: `social-zalo`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "workspaceId": "<id>",
    "activeTableId": "<string>",
    "assignableUserIds": [],
    "messageTemplateGroups": [],
    "messageTemplates": [],
    "tags": [],
    "created_at": null,
    "updated_at": null,
    "activeTable": null
  }
}
```

### `POST /api/workspace/{workspaceId}/workspace/get/p/team_roles`

Trang: `team-detail`

Request body:
```json
{
  "constraints": {
    "workspaceTeamId": "<id>"
  },
  "queries": {
    "fields": "id,isDefault,isOwner,workspaceTeamId,roleCode,roleName,roleDescription,createdBy,updatedBy,createdAt,updatedAt,labelIds"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "isDefault": true,
      "isOwner": true,
      "workspaceTeamId": "<id>",
      "roleCode": "<string>",
      "roleName": "<string>",
      "roleDescription": "<string>",
      "createdBy": "<id>",
      "updatedBy": "<id>",
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>",
      "labelIds": [
        "<id>"
      ]
    }
  ],
  "meta": {
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_events`

Trang: `event-edit`, `unit-detail`

Request body:
```json
{
  "filtering": {
    "workflowUnit": "<id>"
  },
  "queries": {
    "fields": "id,eventName,eventActive,responseId,eventSourceType,eventSourceParams,workflowCode,workflowDefaultData,workflowUnit,yaml,createdBy,updatedBy,createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
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
        "tableId": "<id>"
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
    "… (2 phần tử)"
  ],
  "meta": {
    "filtering": {
      "workflowUnit =": "<id>"
    },
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_units/{id}`

Trang: `unit-detail`

Request body:
```json
{
  "queries": {
    "fields": "id,name,description,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "id": "<id>",
    "name": "<string>",
    "description": "<string>",
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

### `POST /api/workspace/{workspaceId}/workflow/get/workflow_units`

Trang: `units`

Request body:
```json
{
  "queries": {
    "fields": "id,name,description,createdBy,updatedBy,createdAt,updatedAt,userPermission"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "<string>",
      "description": "<string>",
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
    "… (2 phần tử)"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/me/get/incoming-invitations`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{
  "queries": {
    "fields": "id,workspaceTeamId,workspaceTeamRoleId,invitedBy,invitedAt,invitedByUser{id,fullName,avatar},workspaceTeam{id,teamName},workspaceTeamRole{id,roleName}"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [],
  "meta": {
    "sort": {
      "id": "desc"
    }
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/p/active_work_groups`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{
  "queries": {
    "fields": "id,name,description,config,userIds,displayOrder,createdBy,updatedBy,createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": [
    {
      "id": "<id>",
      "name": "CRM",
      "description": "<string>",
      "config": [],
      "userIds": [],
      "displayOrder": 0,
      "createdBy": "<id>",
      "updatedBy": "<string>",
      "createdAt": "<datetime>",
      "updatedAt": null
    },
    "… (3 phần tử)"
  ],
  "meta": {
    "limit": 1000
  }
}
```

### `POST /api/workspace/{workspaceId}/notification/get/notifications/unread_count`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "unreadCount": 0
  }
}
```

### `POST /api/workspace/{workspaceId}/workspace_permission/permission/get/me`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "httpCode": 200,
  "status": "success",
  "data": {
    "workspaceId": "<id>",
    "userId": "<id>",
    "canGrantPermission": true,
    "canAccessSystemInfo": true,
    "canAccessSocial": true,
    "canAccessSetting": true,
    "settingStaticSubjectCodes": [
      "WORKSPACE_TEAM",
      "… (2 phần tử)"
    ],
    "socialStaticSubjectCodes": [
      "FACEBOOK",
      "… (4 phần tử)"
    ],
    "activeSubjects": [],
    "staticSubjects": {
      "WORKSPACE_TEAM": {
        "staticSubjectCode": "WORKSPACE_TEAM",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (6 phần tử)"
        ]
      },
      "ACTIVE_TABLE": {
        "staticSubjectCode": "ACTIVE_TABLE",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "OPTIN_FORM": {
        "staticSubjectCode": "OPTIN_FORM",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "WORKFLOW_UNIT": {
        "staticSubjectCode": "WORKFLOW_UNIT",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "WORKFLOW_CONNECTOR": {
        "staticSubjectCode": "WORKFLOW_CONNECTOR",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "SHIPMENT_ORDER": {
        "staticSubjectCode": "SHIPMENT_ORDER",
        "staticSubjectName": "SHIPMENT_ORDER",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [],
            "isAllowed": false
          },
          "… (4 phần tử)"
        ]
      },
      "E_INVOICE": {
        "staticSubjectCode": "E_INVOICE",
        "staticSubjectName": "E_INVOICE",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [],
            "isAllowed": false
          },
          "… (4 phần tử)"
        ]
      },
      "WORKSPACE_LABEL": {
        "staticSubjectCode": "WORKSPACE_LABEL",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "WORK_GROUP": {
        "staticSubjectCode": "WORK_GROUP",
        "staticSubjectName": "WORK_GROUP",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
            ],
            "isAllowed": true
          },
          "… (4 phần tử)"
        ]
      },
      "FACEBOOK": {
        "staticSubjectCode": "FACEBOOK",
        "staticSubjectName": "<string>",
        "staticActions": [
          {
            "staticActionName": "<string>",
            "staticActionType": "ACCESS",
            "scopes": [
              "<string>"
  … (cắt bớt, 212 dòng)
```

### 🆕 `POST /api/workspace/{workspaceId}/websocket/unsubscribe`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{
  "responseId": "<string>"
}
```
Response (HTTP 200):
```json
{
  "success": true,
  "data": {
    "responseId": "<string>",
    "eventKeys": [],
    "message": "<string>"
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/get/active_tables/permission/me`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{}
```
Response (HTTP 200):
```json
{
  "data": [
    {
      "tableId": "<id>",
      "permissions": [
        {
          "type": "create",
          "actionId": "<string>",
          "allow": true,
          "scopes": [
            "<string>"
          ]
        },
        "… (8 phần tử)"
      ]
    },
    "… (8 phần tử)"
  ]
}
```

### 🆕 `POST /api/workspace/{workspaceId}/websocket/subscribe`

Trang: `apps`, `connector-select`, `event-console`, `event-edit`, `forms`, `invitations`, `notifications`, `record-detail-order`, `record-new`, `records-customers`, `records-tasks`, `settings-labels`, `settings-teams`, `social-facebook`, `table-settings`, `units`

Request body:
```json
{
  "responseId": "<string>"
}
```
Response (HTTP 200):
```json
{
  "success": true,
  "data": {
    "responseId": "<string>",
    "userId": "<id>",
    "eventKeys": [
      "<redacted>",
      "… (16 phần tử)"
    ],
    "expiresIn": 0
  }
}
```

### `POST /api/user/me/get/pending-workspaces`

Trang: `dashboard`, `invitations`

Request body:
```json
{
  "queries": {
    "fields": "id,namespace,workspaceName,ownedByUser,ownedBy,logo,thumbnailLogo,createdAt,updatedAt"
  }
}
```
Response (HTTP 200):
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

### `POST /api/workspace/{workspaceId}/label/get/p/labels`

Trang: `notifications`

Request body:
```json
{
  "queries": {
    "fields": "id,labelType,labelName,createdAt,createdBy,updatedAt,updatedBy",
    "filtering": {
      "labelType": "<string>"
    }
  }
}
```
Response (HTTP 200):
```json
{
  "data": [],
  "filtering": {
    "labelType =": "<string>"
  },
  "limit": 1000,
  "sort": {
    "id": "desc"
  }
}
```

### `POST /api/workspace/{workspaceId}/notification/get/notifications`

Trang: `notifications`

Request body:
```json
{
  "queries": {
    "fields": "id,notificationType,notificationTitle,notificationContent,notificationMetaContents,target,labelIds,taggedUserIds,isRead,createdBy,createdAt",
    "filtering": {},
    "pagination": {
      "type": "cursor"
    },
    "limit": 20
  }
}
```
Response (HTTP 200):
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
    "limit": 20,
    "sort": {
      "id": "desc"
    }
  }
}
```

### `POST /api/workspace/{workspaceId}/workflow/active_tables/{tableId}/records/{id}/get/comments`

Trang: `record-detail-order`

Request body:
```json
{
  "paging": "cursor",
  "direction": "desc",
  "limit": 50
}
```
Response (HTTP 200):
```json
{
  "data": [],
  "next_id": null,
  "previous_id": null
}
```
