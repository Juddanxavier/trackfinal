export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer',
}

const ADMIN_ROLES = new Set([Role.SUPERADMIN, Role.ADMIN]);

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role as Role);
}
