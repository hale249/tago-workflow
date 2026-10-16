import type { PermissionAction, PermissionOption, PermissionResource, RolePermissions } from "../types/permission"

// Option sets differ by action type, like the reference ("Các hành động khác nhau có tùy chọn phân quyền khác nhau dựa trên loại").
const NOT_ALLOWED: PermissionOption = { value: "not_allowed", label: "Không cho phép" }
const ALL: PermissionOption = { value: "all", label: "Tất cả" }
const TOGGLE: PermissionOption[] = [NOT_ALLOWED, { value: "allowed", label: "Cho phép" }]
const opt = (value: string, label: string): PermissionOption => ({ value, label })
// Record-scoped actions offer the full ownership / assignment / time-window list (same 20 entries and order as the reference).
const OWNERSHIP: PermissionOption[] = [
  NOT_ALLOWED,
  ALL,
  opt("self_created", "Do chính mình tạo"),
  opt("self_created_2h", "Do mình tạo (2 giờ đầu)"),
  opt("self_created_12h", "Do mình tạo (12 giờ đầu)"),
  opt("self_created_24h", "Do mình tạo (24 giờ đầu)"),
  opt("self_assigned", "Được phân công cho mình"),
  opt("related_user", "Có liên quan đến mình"),
  opt("self_created_or_assigned", "Do mình tạo hoặc được phân công"),
  opt("self_created_or_related", "Do mình tạo hoặc có liên quan"),
  opt("created_by_team_member", "Do thành viên nhóm tạo"),
  opt("created_by_team_2h", "Do thành viên nhóm tạo (2 giờ đầu)"),
  opt("created_by_team_12h", "Do thành viên nhóm tạo (12 giờ đầu)"),
  opt("created_by_team_24h", "Do thành viên nhóm tạo (24 giờ đầu)"),
  opt("created_by_team_48h", "Do thành viên nhóm tạo (48 giờ đầu)"),
  opt("created_by_team_72h", "Do thành viên nhóm tạo (72 giờ đầu)"),
  opt("assigned_team_member", "Được phân công cho thành viên nhóm"),
  opt("related_team_member", "Liên quan đến thành viên nhóm"),
  opt("created_or_assigned_team", "Do nhóm tạo hoặc được phân công cho nhóm"),
  opt("created_or_related_team", "Do nhóm tạo hoặc liên quan đến nhóm"),
]
const ASSIGNMENT: PermissionOption[] = [
  NOT_ALLOWED,
  ALL,
  opt("self_assigned", "Được phân công cho mình"),
  opt("assigned_team_member", "Được phân công cho thành viên nhóm"),
]

const act = (id: string, label: string, options: PermissionOption[]): PermissionAction => ({ id, label, options })
const CRUD = [act("access", "Truy cập", OWNERSHIP), act("create", "Tạo mới", TOGGLE), act("update", "Cập nhật", OWNERSHIP), act("delete", "Xóa", OWNERSHIP)]
const SOCIAL = [act("access", "Truy cập", ASSIGNMENT), act("reply_message", "Trả lời tin nhắn", ASSIGNMENT), act("assign", "Giao người phụ trách", ASSIGNMENT), act("setting", "Cài đặt", TOGGLE)]

/** Workspace resources in the reference order, incl. the workspace's plugin modules (SHIPMENT_ORDER, E_INVOICE). */
export const PERMISSION_RESOURCES: PermissionResource[] = [
  { id: "workspace_team", label: "Nhóm", actions: [...CRUD, act("invite_member", "Mời thành viên", OWNERSHIP), act("remove_member", "Xóa thành viên", OWNERSHIP)] },
  { id: "active_table", label: "Bảng dữ liệu", actions: CRUD },
  { id: "form", label: "Biểu mẫu", actions: CRUD },
  { id: "workflow", label: "Cloud Logic (Workflow)", actions: CRUD },
  { id: "connector", label: "Kết nối", actions: CRUD },
  { id: "SHIPMENT_ORDER", label: "SHIPMENT_ORDER", actions: CRUD },
  { id: "E_INVOICE", label: "E_INVOICE", actions: CRUD },
  { id: "label", label: "Nhãn", actions: CRUD },
  { id: "work_group", label: "Nhóm công việc", actions: CRUD },
  { id: "facebook", label: "Facebook", actions: SOCIAL },
  { id: "zalo", label: "Zalo", actions: SOCIAL },
  { id: "whatsapp", label: "WhatsApp", actions: SOCIAL },
  { id: "instagram", label: "Instagram", actions: SOCIAL },
]

export const permissionKey = (resource: string, action: string) => `${resource}.${action}`
export const ACTION_COUNT = PERMISSION_RESOURCES.reduce((n, r) => n + r.actions.length, 0)

/** Seed: the owner role has full access, except Instagram and the plugin modules which are explicitly "not allowed" (as in the reference workspace). */
const DENIED = new Set(["instagram", "SHIPMENT_ORDER", "E_INVOICE"])
const fullAccess = (): RolePermissions => ({
  canGrant: true,
  actions: Object.fromEntries(
    PERMISSION_RESOURCES.flatMap((r) => r.actions.map((a) => [permissionKey(r.id, a.id), DENIED.has(r.id) ? "not_allowed" : a.options === TOGGLE ? "allowed" : "all"])),
  ),
})
export const SEED_PERMISSIONS: Record<string, RolePermissions> = { "tm_owner:rl_owner": fullAccess() }
