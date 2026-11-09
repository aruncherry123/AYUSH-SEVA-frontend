import type { Database, User } from '../types'

export interface PermissionGroup {
  module: string
  permissions: string[]
}

/**
 * The single permission catalogue used by the roles screen, the route guards
 * and every action-level check. Keys are always `module.action`.
 */
export const permissionGroups: PermissionGroup[] = [
  { module: 'Dashboard', permissions: ['view'] },
  { module: 'Patients', permissions: ['view', 'create', 'edit', 'delete'] },
  { module: 'Appointments', permissions: ['view', 'create', 'edit', 'cancel'] },
  { module: 'Clinical', permissions: ['view', 'edit'] },
  { module: 'Pharmacy', permissions: ['view', 'dispense', 'manage'] },
  { module: 'Inventory', permissions: ['view', 'manage'] },
  { module: 'Workforce', permissions: ['view', 'manage', 'approve'] },
  { module: 'Reports', permissions: ['view', 'export'] },
  { module: 'Access', permissions: ['view', 'manage'] },
  { module: 'Settings', permissions: ['view', 'manage'] },
]

export const permissionKey = (module: string, permission: string) =>
  `${module.toLowerCase()}.${permission}`

export const allPermissionKeys = permissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permissionKey(group.module, permission)),
)

export const describePermission = (key: string) => {
  if (key === 'all') return 'Full access'
  const [module, permission] = key.split('.')
  if (!module || !permission) return key
  return `${module.charAt(0).toUpperCase()}${module.slice(1)} · ${permission}`
}

/** Role grants are looked up from the role catalogue so the Roles page stays authoritative. */
export function permissionsForRole(db: Database, role: string): string[] {
  const record = db.roles.find(
    (item) => item.name.toLowerCase() === role.toLowerCase() && item.status === 'Active',
  )
  return record?.permissions ?? []
}

export function effectivePermissions(db: Database, user: User | null): string[] {
  if (!user) return []
  if (user.role === 'Super Admin') return ['all']
  if (user.permissions && user.permissions.length > 0) return user.permissions
  return permissionsForRole(db, user.role)
}

/** Super Admin is intentionally unstoppable; every other grant comes from the catalogue. */
export function hasPermission(db: Database, user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.role === 'Super Admin') return true
  const granted = effectivePermissions(db, user)
  if (granted.includes('all')) return true
  if (granted.includes(permission)) return true
  const [module, action] = permission.split('.')
  if (action === 'view' && module) return granted.includes(`${module}.manage`)
  return false
}

/** The first page a user is allowed to open. */
export function homePathFor(db: Database, user: User | null): string {
  const order: { path: string; permission: string }[] = [
    { path: '/dashboard', permission: 'dashboard.view' },
    { path: '/workforce/tasks', permission: 'workforce.view' },
    { path: '/patients', permission: 'patients.view' },
    { path: '/people/users', permission: 'access.view' },
    { path: '/settings', permission: 'settings.view' },
  ]
  const match = order.find((entry) => hasPermission(db, user, entry.permission))
  return match?.path ?? '/access-denied'
}
