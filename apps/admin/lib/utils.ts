export { cn } from "@repo/utils/cn"
export {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatBytes,
  formatPhoneNumber,
  truncate,
} from "@repo/utils/format"
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  isToday,
  isYesterday,
} from "@repo/utils/date"

const ADMIN_ROLES = new Set(["admin", "superadmin"])

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.has(role)
}
