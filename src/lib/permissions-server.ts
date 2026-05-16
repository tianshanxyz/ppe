import { readDataFile, writeDataFile, generateId, getCurrentUser } from './data-store'
import type { UserRecord } from './data-store'

// ---- Types ----
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

export interface QuotaRecord {
  userId: string
  userRole: UserRole
  metric: 'searches' | 'downloads' | 'trackerProducts'
  count: number
  lastReset: string
  expiresAt: string
}

export interface PermissionLogEntry {
  id: string
  userId: string
  userRole: UserRole
  action: 'search' | 'download' | 'tracker_add' | 'tracker_remove' | 'quota_exceeded' | 'quota_reset' | 'role_change'
  resource: string
  allowed: boolean
  reason: string
  quotaBefore?: number
  quotaAfter?: number
  createdAt: string
}

export interface PermissionCheckResult {
  allowed: boolean
  reason: string
  quota?: { used: number; limit: number; remaining: number; period: string }
}

// ---- Re-export getCurrentUser ----
export { getCurrentUser }

// ---- Helper Functions (no fs dependency) ----

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

// ---- Permission Config ----

function getPermissionsConfig(): RolePermissions[] {
  return readDataFile<RolePermissions>('permissions.json')
}

export function getRolePermissions(role: UserRole): RolePermissions {
  const configs = getPermissionsConfig()
  return configs.find(c => c.role === role) || configs.find(c => c.role === 'guest')!
}

// ---- User Identity Detection ----

export function detectUserRole(user: UserRecord | null): UserRole {
  if (!user) return 'guest'
  if (user.role === 'admin') return 'admin'
  if (user.role === 'editor') return 'editor'
  if (user.role === 'vip' || user.membership === 'enterprise') return 'vip'
  return 'user'
}

// ---- Quota Management ----

export function getQuota(userId: string, role: UserRole, metric: 'searches' | 'downloads' | 'trackerProducts'): { used: number; limit: number; remaining: number; period: string } {
  const permissions = getRolePermissions(role)
  const limit = permissions[metric].limit
  const period = permissions[metric].period

  if (limit === -1) return { used: 0, limit: -1, remaining: Infinity, period: 'unlimited' }

  const quotas = readDataFile<QuotaRecord>('quotas.json')
  const periodKey = getPeriodKey(period)
  let quota = quotas.find(q => q.userId === userId && q.metric === metric)
  if (quota && quota.lastReset !== periodKey) {
    quota.count = 0
    quota.lastReset = periodKey
  }
  const used = quota?.count || 0
  return { used, limit, remaining: Math.max(0, limit - used), period }
}

export function incrementQuota(userId: string, role: UserRole, metric: 'searches' | 'downloads' | 'trackerProducts'): { allowed: boolean; used: number; limit: number; remaining: number } {
  const permissions = getRolePermissions(role)
  const limit = permissions[metric].limit
  const period = permissions[metric].period
  const periodKey = getPeriodKey(period)

  if (limit === -1) return { allowed: true, used: 0, limit: -1, remaining: Infinity }

  const quotas = readDataFile<QuotaRecord>('quotas.json')
  let quota = quotas.find(q => q.userId === userId && q.metric === metric)

  if (quota && quota.lastReset !== periodKey) {
    quota.count = 0
    quota.lastReset = periodKey
    logPermission(userId, role, 'quota_reset', metric, true, `Period reset to ${periodKey}`)
  }

  if (!quota) {
    quota = { userId, userRole: role, metric, count: 0, lastReset: periodKey, expiresAt: new Date(Date.now() + 365 * 24 * 3600000).toISOString() }
    quotas.push(quota)
  }

  const quotaBefore = quota.count
  if (quota.count >= limit) {
    logPermission(userId, role, 'quota_exceeded', metric, false, `${metric} exceeded: ${quota.count}/${limit}`)
    writeDataFile('quotas.json', quotas)
    return { allowed: false, used: quota.count, limit, remaining: 0 }
  }

  quota.count += 1
  writeDataFile('quotas.json', quotas)
  logPermission(userId, role, metric as any, metric, true, `${metric}: ${quota.count}/${limit}`, quotaBefore, quota.count)
  return { allowed: true, used: quota.count, limit, remaining: Math.max(0, limit - quota.count) }
}

export function resetQuota(userId: string, metric: 'searches' | 'downloads' | 'trackerProducts'): void {
  const quotas = readDataFile<QuotaRecord>('quotas.json')
  const quota = quotas.find(q => q.userId === userId && q.metric === metric)
  if (quota) {
    quota.count = 0
    quota.lastReset = getPeriodKey(getRolePermissions(quota.userRole)[metric].period)
    writeDataFile('quotas.json', quotas)
  }
}

// ---- Permission Checks ----

export function checkSearchPermission(userId: string, role: UserRole): PermissionCheckResult {
  const permissions = getRolePermissions(role)
  const limit = permissions.searches.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: Infinity, period: 'unlimited' } }
  const quota = getQuota(userId, role, 'searches')
  if (quota.remaining <= 0) {
    return { allowed: false, reason: role === 'guest' ? 'Guest daily limit reached' : 'Monthly limit reached', quota: { ...quota, remaining: 0 } }
  }
  return { allowed: true, reason: 'OK', quota }
}

export function checkDownloadPermission(userId: string, role: UserRole): PermissionCheckResult {
  const permissions = getRolePermissions(role)
  const limit = permissions.downloads.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: Infinity, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Registration required', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = getQuota(userId, role, 'downloads')
  if (quota.remaining <= 0) return { allowed: false, reason: 'Monthly limit reached', quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

export function checkTrackerPermission(userId: string, role: UserRole): PermissionCheckResult {
  const permissions = getRolePermissions(role)
  const limit = permissions.trackerProducts.limit
  if (limit === -1) return { allowed: true, reason: 'Unlimited', quota: { used: 0, limit: -1, remaining: Infinity, period: 'unlimited' } }
  if (limit === 0) return { allowed: false, reason: 'Registration required', quota: { used: 0, limit: 0, remaining: 0, period: 'none' } }
  const quota = getQuota(userId, role, 'trackerProducts')
  if (quota.remaining <= 0) return { allowed: false, reason: `Limited to ${limit} products`, quota: { ...quota, remaining: 0 } }
  return { allowed: true, reason: 'OK', quota }
}

// ---- Permission Audit Log ----

function logPermission(userId: string, userRole: UserRole, action: PermissionLogEntry['action'], resource: string, allowed: boolean, reason: string, quotaBefore?: number, quotaAfter?: number): void {
  const logs = readDataFile<PermissionLogEntry>('permission_log.json')
  logs.push({ id: generateId('plog'), userId, userRole, action, resource, allowed, reason, quotaBefore, quotaAfter, createdAt: new Date().toISOString() })
  if (logs.length > 10000) logs.splice(0, logs.length - 10000)
  writeDataFile('permission_log.json', logs)
}

// ---- Guest Helpers ----

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