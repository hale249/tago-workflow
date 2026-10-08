# Cài đặt workspace — cấu trúc trang & API (tham khảo)

Ghi 2026-10-08, **chỉ đọc**: xem trang `/workspaces/{id}/settings` + response các API `/get/` (đã che dữ liệu thật). Dùng để dựng UI Tago và làm backend sau.

## Bố cục trang

Tiêu đề `<Tên workspace> - Cài đặt`, 5 tab:

| Tab | Nội dung | API |
|---|---|---|
| Thông tin hệ thống | Thông tin cơ bản: múi giờ, giới hạn CPU, ngày bắt đầu / hết hạn. Bảng *Giới hạn tài nguyên* (thành viên, bảng dữ liệu, sự kiện quy trình tuỳ chỉnh / thường, đơn vị workflow, biểu mẫu, kết nối, nhóm làm việc, vai trò). Bảng *Giới hạn bản ghi theo Active Table*: tên + id bảng, giới hạn, đã dùng | `system/get/system-config` |
| Nhóm công việc | Danh sách work group (nhóm của các bảng ở mục Apps): tên, mô tả; thêm / sửa / xoá | `workflow/get/active_work_groups` |
| Nhóm | Đội nhóm (team) + vai trò trong đội + thành viên | `workspace/get/p/teams`, `workspace/get/p/team_roles`, `workspace/get/users` |
| Quyền | Ma trận quyền theo đội × vai trò cho từng đối tượng (bảng, workflow, biểu mẫu, kết nối, nhãn, đội, vai trò, người dùng, Facebook/Zalo/…) | `workspace_permission/get/permissions/{teamId}`, `workspace_permission/permission/get/me` |
| Nhãn | Nhãn theo loại: nhóm, vai trò, thông báo — tên, ngày cập nhật | `label/get/p/labels` |

Quy ước chung như `docs/beqeek-api.md`: mọi request POST, động từ trong path, base `/api/workspace/{workspaceId}`.

## Endpoint liên quan (từ bundle)

- `/api/workspace/{id}/label/get/p/labels`
- `/api/workspace/{id}/workspace/get/me`
- `/api/workspace/{id}/workspace/post/invitations/bulk`
- `/api/workspace/{id}/workspace/post/users`
- `/api/workspace/{id}/workspace_permission/patch/grant_permission`
- `/api/workspace/{id}/workspace_permission/patch/static_subject_actions`
- `/label/delete/labels/{id}`
- `/label/get/labels`
- `/label/get/p/labels`
- `/label/patch/labels/{id}`
- `/label/post/labels`
- `/workspace/delete/team_roles/{id}`
- `/workspace/delete/teams/{id}`
- `/workspace/get/p/team_roles`
- `/workspace/get/p/teams`
- `/workspace/get/users`
- `/workspace/patch/team_roles/{id}`
- `/workspace/patch/teams/{id}`
- `/workspace/post/team_roles`
- `/workspace/post/teams`
- `/workspace_permission/get/permissions/{id}`

## Dữ liệu mẫu (đã che)

### system-config

`POST /api/workspace/{workspaceId}/system/get/system-config` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "timeZone,e2eeEncryption,cpuLimit,staticSubject,activeTableSubject,startTime,endTime"
  }
}
```
Response:
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

### work-groups

`POST /api/workspace/{workspaceId}/workflow/get/p/active_work_groups` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "id,name,description"
  }
}
```
Response:
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

### teams

`POST /api/workspace/{workspaceId}/workspace/get/p/teams` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "id,teamName,teamDescription"
  }
}
```
Response:
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

### team-roles

`POST /api/workspace/{workspaceId}/workspace/get/p/team_roles` → HTTP 400

Body:
```json
{
  "constraints": {},
  "queries": {
    "fields": "id,roleName,roleCode,roleDescription,isDefault"
  }
}
```
Response:
```json
{
  "message": "<string>",
  "errors": {
    "$.constraints": "<string>"
  }
}
```

### labels

`POST /api/workspace/{workspaceId}/label/get/p/labels` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "id,labelName,labelType"
  }
}
```
Response:
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

### permission-me

`POST /api/workspace/{workspaceId}/workspace_permission/permission/get/me` → HTTP 200

Body:
```json
{}
```
Response:
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
            "staticActionType": "<
```

### users

`POST /api/workspace/{workspaceId}/workspace/get/users` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "id,fullName,avatar,thumbnailAvatar",
    "filtering": {}
  }
}
```
Response:
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

### workspace-me

`POST /api/workspace/{workspaceId}/workspace/get/me` → HTTP 200

Body:
```json
{
  "queries": {
    "fields": "id,fullName,avatar,thumbnailAvatar,email,phone,phoneCountryCode,globalUser{username},workspaceMemberships{userId,workspaceTeamRoleId,workspaceTeamId,invitedAt},createdAt,updatedAt"
  }
}
```
Response:
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

Ghi chú: `team-roles` trả 400 vì cần thêm tham số `constraints` (chưa xác định) — backend tự định nghĩa khi làm.
