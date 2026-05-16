import { createServiceClient } from './supabase/service-client'
import { getCurrentUser } from './data-store'
import type { UserRecord } from './data-store'

export type UserRole = 'guest' | 'user' | 'vip' | 'editor' | 'admin'

export interface QuotaLimit { limit: number; period: 'daily' | 'monthly' | 'permanent' }
export interface RolePermissions {
  role: UserRole; searches: QuotaLimit; downloads: QuotaLimit; trackerProducts: QuotaLimit
  apiAccess: boolean; aiSearch: boolean; complianceTracker: boolean; favorites: boolean; reports: boolean
}
export interface PermissionCheckResult { allowed: boolean; reason: string; quota?: { used: number; limit: number; remaining: number; period: string } }

export { getCurrentUser }

const PERMISSIONS: Record<UserRole, RolePermissions> = {
  guest: { role: 'guest', searches: { limit: 3, period: 'daily' }, downloads: { limit: 0, period: 'daily' }, trackerProducts: { limit: 0, period: 'permanent' }, apiAccess: false, aiSearch: false, complianceTracker: false, favorites: false, reports: false },
  user: { role: 'user', searches: { limit: 999, period: 'monthly' }, downloads: { limit: 999, period: 'monthly' }, trackerProducts: { limit: 5, period: 'permanent' }, apiAccess: false, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  vip: { role: 'vip', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  editor: { role: 'editor', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
  admin: { role: 'admin', searches: { limit: -1, period: 'monthly' }, downloads: { limit: -1, period: 'monthly' }, trackerProducts: { limit: -1, period: 'permanent' }, apiAccess: true, aiSearch: true, complianceTracker: true, favorites: true, reports: true },
}

export function getRolePermissions(role: UserRole): RolePermissions { return PERMISSIONS[role] || PERMISSIONS.guest }

export function detectUserRole(user: UserRecord | null): UserRole {
  if (!user) return 'guest'
  if (user.role === 'admin') return 'admin'
  if (user.role === 'editor') return 'editor'
  if (user.role === 'vip' || user.membership === 'enterprise') return 'vip'
  return 'user'
}

export async function getCurrentUserWithRole(request: Request): Promise<UserRecord | null> {
  const baseUser = getCurrentUser(request)
  if (!baseUser) return null
  
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('mdlooker_users')
      .select('id, email, name, company, role, membership, created_at')
      .eq('id', baseUser.id)
      .maybeSingle()
    
    if (data) {
      return {
        id: data.id,
        email: data.email,
        passwordHash: '',
        name: data.name || '',
        company: data.company || '',
        role: data.role || 'user',
        membership: data.membership || 'free',
        createdAt: data.created_at || new Date().toISOString(),
      }
    }
  } catch (e) {
    console.error('getCurrentUserWithRole error:', e)
  }
  
  return baseUser
}

export function getUserRoleLabel(role: UserRole, locale: string = 'en'): string {
  const labels: Record<UserRole, { en: string; zh: string }> = {
    guest: { en: 'Guest', zh: '游客' }, user: { en: 'Registered', zh: '注册用户' },
    vip: { en: 'VIP', zh: 'VIP会员' }, editor: { en: 'Editor', zh: '编辑' }, admin: { en: 'Admin', zh: '管理员' },
  }
  return labels[role]?.[locale === 'zh' ? 'zh' : 'en'] || role
}

function getDayKey(): string { return new Date().toISOString().split('T')[0] }
function getMonthKey(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function getPeriodKey(period: 'daily' | 'monthly' | 'permanent'): string {
  switch (period) { case 'daily': return getDayKey(); case 'monthly': return getMonthKey(); case 'permanent': return 'FOREVER' }
}

export async function getQuota(userId: string, role: UserRole, metric: 'searches' | 'downloads' | 'trackerProducts'): Promise<{ used: number; limit: number; remaining: number; period: string }> {
  const permissions = getRolePermissions(role)
  const limit = permissions[metric].limit
  const period = permissions[metric].period
  if (limit === -1) return { used: 0, limit: -1, remaining: -1, period: 'unlimited' }

  const supabase = createServiceClient()
  const { data } = await supabase.from('mdlooker_quotas').select('count, last_reset').eq('user_id', userId).eq('metric', metric).maybeSingle()
  const periodKey = getPeriodKey(period)

  if (data && data.last_reset !== periodKey) {
    await supabase.from('mdlooker_quotas').update({ count: 0, last_reset: periodKey }).eq('user_id', userId).eq('metric', metric)
    return { used: 0, limit, remaining: limit, period }
  }
  const used = data?.count || 0
  return { used, limit, remaining: Math.max(0, limit - used), period }
}

export async function incrementQuota(userId: string, role: UserRole, metric: 'searches' | 'downloads' | 'trackerProducts'): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const permissions = getRolePermissions(role)
  const limit = permissions[metric].limit
  const period = permissions[metric].period
  const periodKey = getPeriodKey(period)
  if (limit === -1) return { allowed: true, used: 0, limit: -1, remaining: -1 }

  const supabase = createServiceClient()
  const { data: existing } = await supabase.from('mdlooker_quotas').select('count, last_reset').eq('user_id', userId).eq('metric', metric).maybeSingle()

  if (existing && existing.last_reset !== periodKey) {
    await supabase.from('mdlooker_quotas').update({ count: 0, last_reset: periodKey }).eq('user_id', userId).eq('metric', metric)
  }
  const currentCount = (existing && existing.last_reset === periodKey) ? existing.count : 0

  if (currentCount >= limit) {
    return { allowed: false, used: currentCount, limit, remaining: 0 }
  }

  if (existing) {
    await supabase.from('mdlooker_quotas').update({ count: currentCount + 1, last_reset: periodKey }).eq('user_id', userId).eq('metric', metric)
  } else {
    await supabase.from('mdlooker_quotas').insert({ user_id: userId, user_role: role, metric, count: 1, last_reset: periodKey })
  }
  return { allowed: true, used: currentCount + 1, limit, remaining: Math.max(0, limit - currentCount - 1) }
}

export async function checkSearchPermission(userId: string, role: UserRole): Promise<PermissionCheckResult> {
  const limit = getRolePermissions(role).searches.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  const quota = await getQuota(userId, role, 'searches')
  if (quota.remaining <= 0) return { allowed: false, reason: role === 'guest' ? 'Guest daily search limit (3) reached. Please register.' : 'Monthly limit reached. Upgrade to VIP.', quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkDownloadPermission(userId: string, role: UserRole): Promise<PermissionCheckResult> {
  const limit = getRolePermissions(role).downloads.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Downloads require registration.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = await getQuota(userId, role, 'downloads')
  if (quota.remaining <= 0) return { allowed: false, reason: 'Monthly download limit reached. Upgrade to VIP.', quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkTrackerPermission(userId: string, role: UserRole): Promise<PermissionCheckResult> {
  const limit = getRolePermissions(role).trackerProducts.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Tracker requires registration.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = await getQuota(userId, role, 'trackerProducts')
  if (quota.remaining <= 0) return { allowed: false, reason: `Tracker limited to ${limit} products. Upgrade to VIP.`, quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export function getGuestId(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/guest_id=([^;]+)/)
  if (match) return match[1]
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `guest_${ip.replace(/[.:]/g, '_')}`
}

export function setGuestIdCookie(userId: string): { name: string; value: string; maxAge: number } {
  return { name: 'guest_id', value: userId, maxAge: 86400 * 365 }
}

export function getClientUserRole(): UserRole {
  if (typeof window === 'undefined') return 'guest'
  try {
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return 'guest'
    const user = JSON.parse(stored)
    if (!user || !user.id) return 'guest'
    return detectUserRole(user)
  } catch { return 'guest' }
}