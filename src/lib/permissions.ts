// Client-safe permissions module - no server-side dependencies

export type UserRole = 'guest' | 'user' | 'vip' | 'editor' | 'admin'

export interface QuotaLimit {
  limit: number
  period: 'daily' | 'monthly' | 'permanent'
}

export interface RolePermissions {
  role: UserRole
  searches: QuotaLimit
  downloads: QuotaLimit
  trackerProducts: QuotaLimit
  apiAccess: boolean
  aiSearch: boolean
  complianceTracker: boolean
  favorites: boolean
  reports: boolean
}

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  guest: { role: 'guest', searches: { limit: 3, period: 'daily' }, downloads: { limit: 0, period: 'daily' }, trackerProducts: { limit: 0, period: 'permanent' }, apiAccess: false, aiSearch: false, complianceTracker: false, favorites: false, reports: false },
  user: { role: 'user', searches: { limit: 999, period: 'monthly' }, downloads: { limit: 999, period: 'monthly' }, trackerProducts: { limit: 5, period: 'permanent' }, apiAccess: false, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  vip: { role: 'vip', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  editor: { role: 'editor', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  admin: { role: 'admin', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
}

export function getRolePermissions(role: UserRole): RolePermissions {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.guest
}

export function detectUserRole(user: { role?: string; membership?: string } | null): UserRole {
  if (!user) return 'guest'
  if (user.role === 'admin') return 'admin'
  if (user.role === 'editor') return 'editor'
  if (user.role === 'vip' || user.membership === 'enterprise') return 'vip'
  return 'user'
}

export function getUserRoleLabel(role: UserRole, locale: string = 'en'): string {
  const labels: Record<UserRole, { en: string; zh: string }> = {
    guest: { en: 'Guest', zh: '游客' },
    user: { en: 'Registered', zh: '注册用户' },
    vip: { en: 'VIP', zh: 'VIP会员' },
    editor: { en: 'Editor', zh: '编辑' },
    admin: { en: 'Admin', zh: '管理员' },
  }
  return labels[role]?.[locale === 'zh' ? 'zh' : 'en'] || role
}

export function getClientUserRole(): UserRole {
  if (typeof window === 'undefined') return 'guest'
  try {
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return 'guest'
    const { user } = JSON.parse(stored)
    return detectUserRole(user)
  } catch { return 'guest' }
}

export function getClientUserId(): string {
  if (typeof window === 'undefined') return 'guest_unknown'
  try {
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) {
      const match = document.cookie.match(/guest_id=([^;]+)/)
      return match ? match[1] : 'guest_unknown'
    }
    const { user } = JSON.parse(stored)
    return user?.id || 'guest_unknown'
  } catch { return 'guest_unknown' }
}