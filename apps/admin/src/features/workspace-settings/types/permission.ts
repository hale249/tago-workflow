/** Value picked for one action, e.g. "all" | "allowed" | "not_allowed" | "self_created". */
export type PermissionValue = string
/** `${resource}.${action}` -> value. Missing keys mean "not_allowed". */
export type PermissionMap = Record<string, PermissionValue>
/** Permission matrix of one team role. */
export type RolePermissions = { canGrant: boolean; actions: PermissionMap }

export type PermissionOption = { value: PermissionValue; label: string }
export type PermissionAction = { id: string; label: string; options: PermissionOption[] }
export type PermissionResource = { id: string; label: string; actions: PermissionAction[] }
