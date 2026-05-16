import { createServiceClient } from './supabase/service-client'
import {
  UserRole,
  VipTier,
  RoleConfigKey,
  QuotaLimit,
  RoleConfig,
  getRoleConfig,
  getRoleConfigKey,
  hasFeatureAccess,
  getFeatureAccessLevel,
  getQuotaLimit,
  isUnlimited,
  ROLE_LABELS,
  VIP_TIER_LABELS,
  VIP_PRICING,
} from './permissions/config'

export type { UserRole, VipTier, RoleConfigKey, QuotaLimit, RoleConfig } from './permissions/config'
export type { AdminRole, AnyRole } from './permissions/config'
export { getRoleConfig, getRoleConfigKey, hasFeatureAccess, getFeatureAccessLevel, getQuotaLimit, isUnlimited, ROLE_LABELS, VIP_TIER_LABELS, VIP_PRICING }

export interface PermissionCheckResult {
  allowed: boolean
  reason: string
  quota?: { used: number; limit: number; remaining: number; period: string }
}

export function detectUserRole(user: { role?: string; membership?: string; vipTier?: string } | null): UserRole {
  if (!user) return 'guest'
  if (user.role === 'admin' || user.role === 'editor') return 'vip'
  if (user.role === 'vip' || user.membership === 'professional' || user.membership === 'enterprise') return 'vip'
  if (user.role === 'user') return 'user'
  return 'guest'
}

export function detectVipTier(user: { role?: string; membership?: string; vipTier?: string } | null): VipTier | undefined {
  if (!user) return undefined
  if (user.vipTier === 'enterprise' || user.membership === 'enterprise') return 'enterprise'
  if (user.role === 'admin' || user.role === 'editor') return 'enterprise'
  if (user.vipTier === 'professional' || user.membership === 'professional' || user.role === 'vip') return 'professional'
  return undefined
}

export function getUserRoleLabel(role: UserRole | string, locale: string = 'en'): string {
  const labels = ROLE_LABELS[role as UserRole]
  if (labels) return labels[locale === 'zh' ? 'zh' : 'en']
  return role
}

export function getVipTierLabel(tier: VipTier, locale: string = 'en'): string {
  const labels = VIP_TIER_LABELS[tier]
  return labels[locale === 'zh' ? 'zh' : 'en']
}

function getDayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getPeriodKey(period: 'daily' | 'monthly' | 'permanent'): string {
  switch (period) {
    case 'daily': return getDayKey()
    case 'monthly': return getMonthKey()
    case 'permanent': return 'FOREVER'
  }
}

export async function getQuota(
  userId: string,
  role: UserRole,
  vipTier: VipTier | undefined,
  metric: 'searches' | 'complianceChecks' | 'downloads' | 'reports' | 'aiChat' | 'trackerProducts' | 'alertRules' | 'apiCalls'
): Promise<{ used: number; limit: number; remaining: number; period: string }> {
  const config = getRoleConfig(role, vipTier)
  const quotaConfig = config.quotas[metric]
  if (!quotaConfig || typeof quotaConfig === 'number') {
    return { used: 0, limit: typeof quotaConfig === 'number' ? quotaConfig : 0, remaining: typeof quotaConfig === 'number' ? quotaConfig : 0, period: 'permanent' }
  }

  const limit = quotaConfig.limit
  const period = quotaConfig.period

  if (limit === -1) return { used: 0, limit: -1, remaining: -1, period: 'unlimited' }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('mdlooker_quotas')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('metric', metric)
    .maybeSingle()

  const periodKey = getPeriodKey(period)

  if (data && data.last_reset !== periodKey) {
    await supabase
      .from('mdlooker_quotas')
      .update({ count: 0, last_reset: periodKey })
      .eq('user_id', userId)
      .eq('metric', metric)
    return { used: 0, limit, remaining: limit, period }
  }

  const used = data?.count || 0
  return { used, limit, remaining: Math.max(0, limit - used), period }
}

export async function incrementQuota(
  userId: string,
  role: UserRole,
  vipTier: VipTier | undefined,
  metric: 'searches' | 'complianceChecks' | 'downloads' | 'reports' | 'aiChat' | 'trackerProducts' | 'alertRules' | 'apiCalls'
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const config = getRoleConfig(role, vipTier)
  const quotaConfig = config.quotas[metric]
  if (!quotaConfig || typeof quotaConfig === 'number') {
    return { allowed: false, used: 0, limit: 0, remaining: 0 }
  }

  const limit = quotaConfig.limit
  const period = quotaConfig.period
  const periodKey = getPeriodKey(period)

  if (limit === -1) return { allowed: true, used: 0, limit: -1, remaining: -1 }

  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('mdlooker_quotas')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('metric', metric)
    .maybeSingle()

  if (existing && existing.last_reset !== periodKey) {
    await supabase
      .from('mdlooker_quotas')
      .update({ count: 0, last_reset: periodKey })
      .eq('user_id', userId)
      .eq('metric', metric)
  }

  const currentCount = (existing && existing.last_reset === periodKey) ? existing.count : 0

  if (currentCount >= limit) {
    return { allowed: false, used: currentCount, limit, remaining: 0 }
  }

  if (existing) {
    await supabase
      .from('mdlooker_quotas')
      .update({ count: currentCount + 1, last_reset: periodKey })
      .eq('user_id', userId)
      .eq('metric', metric)
  } else {
    await supabase
      .from('mdlooker_quotas')
      .insert({ user_id: userId, user_role: role, metric, count: 1, last_reset: periodKey })
  }

  return { allowed: true, used: currentCount + 1, limit, remaining: Math.max(0, limit - currentCount - 1) }
}

export async function checkSearchPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.searches.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  const quota = await getQuota(userId, role, vipTier, 'searches')
  if (quota.remaining <= 0) {
    const reason = role === 'guest'
      ? 'Guest daily search limit (3) reached. Please register for more searches.'
      : 'Daily search limit reached. Upgrade to VIP for unlimited searches.'
    return { allowed: false, reason, quota: { ...quota, remaining: 0 } }
  }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkDownloadPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.downloads.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Downloads require registration.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = await getQuota(userId, role, vipTier, 'downloads')
  if (quota.remaining <= 0) return { allowed: false, reason: 'Monthly download limit reached. Upgrade to VIP.', quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkTrackerPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.trackerProducts.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Tracker requires registration.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = await getQuota(userId, role, vipTier, 'trackerProducts')
  if (quota.remaining <= 0) return { allowed: false, reason: `Tracker limited to ${limit} products. Upgrade to VIP.`, quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkComplianceCheckPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.complianceChecks.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  const quota = await getQuota(userId, role, vipTier, 'complianceChecks')
  if (quota.remaining <= 0) {
    const reason = role === 'guest'
      ? 'Guest daily compliance check limit (1) reached. Please register.'
      : 'Daily compliance check limit reached. Upgrade to VIP.'
    return { allowed: false, reason, quota: { ...quota, remaining: 0 } }
  }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkAiChatPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  if (!hasFeatureAccess(role, vipTier, 'aiChat')) {
    return { allowed: false, reason: 'AI Chat requires VIP Professional or higher.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  }
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.aiChat.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  const quota = await getQuota(userId, role, vipTier, 'aiChat')
  if (quota.remaining <= 0) return { allowed: false, reason: 'Daily AI chat limit reached.', quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export async function checkApiPermission(
  userId: string,
  role: UserRole,
  vipTier?: VipTier
): Promise<PermissionCheckResult> {
  if (!hasFeatureAccess(role, vipTier, 'apiAccess')) {
    return { allowed: false, reason: 'API access requires VIP Professional or higher.', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  }
  const config = getRoleConfig(role, vipTier)
  const limit = config.quotas.apiCalls.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: -1, period: 'unlimited' } }
  const quota = await getQuota(userId, role, vipTier, 'apiCalls')
  if (quota.remaining <= 0) return { allowed: false, reason: 'Daily API call limit reached.', quota: { ...quota, remaining: 0 } }
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
  } catch {
    return 'guest'
  }
}

export function getClientVipTier(): VipTier | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return undefined
    const user = JSON.parse(stored)
    return detectVipTier(user)
  } catch {
    return undefined
  }
}

export async function getCurrentUserWithRole(request: Request): Promise<{
  id: string
  email: string
  name: string
  company: string
  role: UserRole
  vipTier?: VipTier
  membership: string
  createdAt: string
} | null> {
  const cookieHeader = request.headers.get('cookie') || ''
  const sessionMatch = cookieHeader.match(/ppe_session=([^;]+)/)
  if (!sessionMatch) return null

  try {
    const token = decodeURIComponent(sessionMatch[1])
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    const userId = payload.sub || payload.userId
    if (!userId) return null

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('mdlooker_users')
      .select('id, email, name, company, role, membership, vip_tier, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      return {
        id: data.id,
        email: data.email,
        name: data.name || '',
        company: data.company || '',
        role: detectUserRole(data),
        vipTier: detectVipTier(data),
        membership: data.membership || 'free',
        createdAt: data.created_at || new Date().toISOString(),
      }
    }
  } catch (e) {
    console.error('getCurrentUserWithRole error:', e)
  }

  return null
}
