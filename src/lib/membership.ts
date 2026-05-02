/**
 * Membership and permission utilities
 *
 * Provides functions to check the current user's membership tier
 * and whether they can access specific features.
 */

export type MembershipTier = 'free' | 'professional' | 'enterprise'

const PERMISSIONS: Record<MembershipTier, string[]> = {
  free: ['browse', 'search', 'view'],
  professional: ['browse', 'search', 'view', 'download', 'generate', 'compliance-check'],
  enterprise: ['browse', 'search', 'view', 'download', 'generate', 'compliance-check', 'api-access', 'bulk-export'],
}

/**
 * Get the current user's membership tier from localStorage.
 * Returns 'free' if no user is found or on the server.
 */
export function getUserMembership(): MembershipTier {
  if (typeof window === 'undefined') return 'free'
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return 'free'
    const user = JSON.parse(userStr)
    const membership = user.membership || 'free'
    if (membership in PERMISSIONS) return membership as MembershipTier
    return 'free'
  } catch {
    return 'free'
  }
}

/**
 * Check if the current user can access a specific feature.
 *
 * Available features:
 * - browse: View document listings
 * - search: Search documents and products
 * - view: View document details and filling guides
 * - download: Download document templates
 * - generate: Generate custom compliance documents
 * - compliance-check: Run compliance checks
 * - api-access: Access the API
 * - bulk-export: Bulk export data
 */
export function canAccessFeature(feature: string): boolean {
  const membership = getUserMembership()
  return PERMISSIONS[membership]?.includes(feature) || false
}

/**
 * Get the display name for a membership tier.
 */
export function getMembershipName(tier: MembershipTier): string {
  const names: Record<MembershipTier, string> = {
    free: 'Basic (Free)',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }
  return names[tier]
}

/**
 * Get all permissions for the current user's membership tier.
 */
export function getUserPermissions(): string[] {
  const membership = getUserMembership()
  return PERMISSIONS[membership] || []
}

export interface MembershipConfig {
  tier: MembershipTier
  name: string
  nameEn: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  features: string[]
  permissions: string[]
  limits: {
    maxSearchResults: number
    maxApiCallsPerDay: number
    maxExportRecordsPerMonth: number
    maxReportsPerMonth: number
    maxMonitoredProducts: number
    maxMonitoredCompanies: number
    maxTeamMembers: number
  }
}

export function getAllMembershipConfigs(): MembershipConfig[] {
  return [
    {
      tier: 'free',
      name: 'Basic (Free)',
      nameEn: 'Basic (Free)',
      description: 'Browse and search the PPE database',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'USD',
      features: ['Browse PPE database', 'Search products & regulations', 'View document listings'],
      permissions: PERMISSIONS.free,
      limits: { maxSearchResults: 10, maxApiCallsPerDay: 0, maxExportRecordsPerMonth: 0, maxReportsPerMonth: 0, maxMonitoredProducts: 0, maxMonitoredCompanies: 0, maxTeamMembers: 1 },
    },
    {
      tier: 'professional',
      name: 'Professional',
      nameEn: 'Professional',
      description: 'Full access to compliance tools and document generation',
      monthlyPrice: 99,
      yearlyPrice: 948,
      currency: 'USD',
      features: ['All Basic features', 'Download document templates', 'Generate compliance documents', 'Compliance check wizard'],
      permissions: PERMISSIONS.professional,
      limits: { maxSearchResults: 100, maxApiCallsPerDay: 0, maxExportRecordsPerMonth: 100, maxReportsPerMonth: 50, maxMonitoredProducts: 50, maxMonitoredCompanies: 20, maxTeamMembers: 5 },
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      nameEn: 'Enterprise',
      description: 'Unlimited access with API and bulk export',
      monthlyPrice: 299,
      yearlyPrice: 2868,
      currency: 'USD',
      features: ['All Professional features', 'API access', 'Bulk data export', 'Priority support'],
      permissions: PERMISSIONS.enterprise,
      limits: { maxSearchResults: -1, maxApiCallsPerDay: 1000, maxExportRecordsPerMonth: -1, maxReportsPerMonth: -1, maxMonitoredProducts: -1, maxMonitoredCompanies: -1, maxTeamMembers: -1 },
    },
  ]
}

export const membershipService = {
  getTier: getUserMembership,
  canAccess: canAccessFeature,
  getConfigs: getAllMembershipConfigs,
  getPermissions: getUserPermissions,
  checkPermission: async (userId: string, permission: string): Promise<{ allowed: boolean; remaining?: number }> => {
    const tier = 'free'
    const allowed = PERMISSIONS[tier]?.includes(permission) || false
    return { allowed }
  },
  checkLimit: async (userId: string, limitType: string, amount: number = 1): Promise<{ allowed: boolean; remaining?: number; limit?: number }> => {
    return { allowed: true, remaining: 999, limit: 999 }
  },
  getUserMembership: async (userId: string): Promise<{ tier: MembershipTier; permissions: string[]; limits: MembershipLimits }> => {
    return { tier: 'free', permissions: PERMISSIONS.free, limits: getMembershipLimits('free') }
  },
  upgradeMembership: async (userId: string, tier: MembershipTier, billingCycle?: string): Promise<{ success: boolean; tier: MembershipTier }> => {
    return { success: true, tier }
  },
  cancelMembership: async (userId: string, reason?: string): Promise<{ success: boolean }> => {
    return { success: true }
  },
}

export interface MembershipPermissions {
  browse: boolean
  search: boolean
  view: boolean
  download: boolean
  generate: boolean
  'compliance-check': boolean
  'api-access': boolean
  'bulk-export': boolean
}

export interface MembershipLimits {
  dailySearches: number
  dailyDownloads: number
  monthlyGenerations: number
  apiCallsPerDay: number
}

export function getMembershipPermissions(tier: MembershipTier): MembershipPermissions {
  const perms = PERMISSIONS[tier]
  return {
    browse: perms.includes('browse'),
    search: perms.includes('search'),
    view: perms.includes('view'),
    download: perms.includes('download'),
    generate: perms.includes('generate'),
    'compliance-check': perms.includes('compliance-check'),
    'api-access': perms.includes('api-access'),
    'bulk-export': perms.includes('bulk-export'),
  }
}

export function getMembershipLimits(tier: MembershipTier): MembershipLimits {
  const limits: Record<MembershipTier, MembershipLimits> = {
    free: { dailySearches: 10, dailyDownloads: 0, monthlyGenerations: 0, apiCallsPerDay: 0 },
    professional: { dailySearches: 100, dailyDownloads: 20, monthlyGenerations: 50, apiCallsPerDay: 0 },
    enterprise: { dailySearches: -1, dailyDownloads: -1, monthlyGenerations: -1, apiCallsPerDay: 1000 },
  }
  return limits[tier]
}
