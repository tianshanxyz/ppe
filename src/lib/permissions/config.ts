export type UserRole = 'guest' | 'user' | 'vip'
export type VipTier = 'professional' | 'enterprise'
export type AdminRole = 'editor' | 'admin'
export type AnyRole = UserRole | AdminRole
export type RoleConfigKey = 'guest' | 'user' | 'vip_professional' | 'vip_enterprise'

export type FeatureAccessLevel = boolean | string | number

export interface QuotaLimit {
  limit: number
  period: 'daily' | 'monthly' | 'permanent'
}

export interface RoleQuotas {
  searches: QuotaLimit
  complianceChecks: QuotaLimit
  downloads: QuotaLimit
  reports: QuotaLimit
  aiChat: QuotaLimit
  trackerProducts: QuotaLimit
  alertRules: QuotaLimit
  apiCalls: QuotaLimit
  apiRateLimit?: number
  savedSearches: number
  searchResultsDisplay: number
  teamMembers: number
}

export interface RoleFeatures {
  basicSearch: FeatureAccessLevel
  semanticSearch: FeatureAccessLevel
  aiSearch: FeatureAccessLevel
  productDatabase: FeatureAccessLevel
  manufacturerDirectory: FeatureAccessLevel
  regulationLibrary: FeatureAccessLevel
  marketAccess: FeatureAccessLevel
  certificationComparison: FeatureAccessLevel
  complianceTracker: FeatureAccessLevel
  certificateAlerts: FeatureAccessLevel
  regulatoryAlerts: FeatureAccessLevel
  aiChat: FeatureAccessLevel
  competitorAnalysis: FeatureAccessLevel
  marketAnalysis: FeatureAccessLevel
  creditScore: FeatureAccessLevel
  pricePrediction: FeatureAccessLevel
  reportGeneration: FeatureAccessLevel
  whiteLabelReports: FeatureAccessLevel
  documentGenerator: FeatureAccessLevel
  supplyChainTracker: FeatureAccessLevel
  batchQuery: FeatureAccessLevel
  apiAccess: FeatureAccessLevel
  webhooks: FeatureAccessLevel
  sso: FeatureAccessLevel
  teamCollaboration: FeatureAccessLevel
  favorites: FeatureAccessLevel
  searchHistory: FeatureAccessLevel
  statistics: FeatureAccessLevel
}

export interface RoleConfig {
  quotas: RoleQuotas
  features: RoleFeatures
  exportFormats: ('csv' | 'excel' | 'pdf')[]
}

export const ROLE_CONFIG: Record<RoleConfigKey, RoleConfig> = {
  guest: {
    quotas: {
      searches: { limit: 3, period: 'daily' },
      complianceChecks: { limit: 1, period: 'daily' },
      downloads: { limit: 0, period: 'daily' },
      reports: { limit: 0, period: 'monthly' },
      aiChat: { limit: 0, period: 'daily' },
      trackerProducts: { limit: 0, period: 'permanent' },
      alertRules: { limit: 0, period: 'permanent' },
      apiCalls: { limit: 0, period: 'daily' },
      savedSearches: 0,
      searchResultsDisplay: 10,
      teamMembers: 0,
    },
    features: {
      basicSearch: true,
      semanticSearch: false,
      aiSearch: false,
      productDatabase: 'summary',
      manufacturerDirectory: 'summary',
      regulationLibrary: 'title_only',
      marketAccess: 'overview',
      certificationComparison: false,
      complianceTracker: false,
      certificateAlerts: false,
      regulatoryAlerts: false,
      aiChat: false,
      competitorAnalysis: false,
      marketAnalysis: false,
      creditScore: false,
      pricePrediction: false,
      reportGeneration: false,
      whiteLabelReports: false,
      documentGenerator: false,
      supplyChainTracker: false,
      batchQuery: false,
      apiAccess: false,
      webhooks: false,
      sso: false,
      teamCollaboration: false,
      favorites: false,
      searchHistory: false,
      statistics: false,
    },
    exportFormats: [],
  },

  user: {
    quotas: {
      searches: { limit: 30, period: 'daily' },
      complianceChecks: { limit: 5, period: 'daily' },
      downloads: { limit: 50, period: 'monthly' },
      reports: { limit: 2, period: 'monthly' },
      aiChat: { limit: 0, period: 'daily' },
      trackerProducts: { limit: 5, period: 'permanent' },
      alertRules: { limit: 3, period: 'permanent' },
      apiCalls: { limit: 0, period: 'daily' },
      savedSearches: 10,
      searchResultsDisplay: 50,
      teamMembers: 0,
    },
    features: {
      basicSearch: true,
      semanticSearch: false,
      aiSearch: false,
      productDatabase: 'full',
      manufacturerDirectory: 'full',
      regulationLibrary: 'full',
      marketAccess: 'detail',
      certificationComparison: 'basic',
      complianceTracker: true,
      certificateAlerts: true,
      regulatoryAlerts: 'email',
      aiChat: false,
      competitorAnalysis: false,
      marketAnalysis: false,
      creditScore: false,
      pricePrediction: false,
      reportGeneration: true,
      whiteLabelReports: false,
      documentGenerator: false,
      supplyChainTracker: false,
      batchQuery: false,
      apiAccess: false,
      webhooks: false,
      sso: false,
      teamCollaboration: false,
      favorites: true,
      searchHistory: '7days',
      statistics: false,
    },
    exportFormats: ['csv'],
  },

  vip_professional: {
    quotas: {
      searches: { limit: -1, period: 'monthly' },
      complianceChecks: { limit: -1, period: 'daily' },
      downloads: { limit: 2000, period: 'monthly' },
      reports: { limit: 20, period: 'monthly' },
      aiChat: { limit: 50, period: 'daily' },
      trackerProducts: { limit: 50, period: 'permanent' },
      alertRules: { limit: 20, period: 'permanent' },
      apiCalls: { limit: 1000, period: 'daily' },
      apiRateLimit: 60,
      savedSearches: 50,
      searchResultsDisplay: 200,
      teamMembers: 0,
    },
    features: {
      basicSearch: true,
      semanticSearch: true,
      aiSearch: true,
      productDatabase: 'full_history',
      manufacturerDirectory: 'full',
      regulationLibrary: 'full_interpretation',
      marketAccess: 'detail_recommendation',
      certificationComparison: 'full',
      complianceTracker: true,
      certificateAlerts: true,
      regulatoryAlerts: 'email_inapp',
      aiChat: true,
      competitorAnalysis: true,
      marketAnalysis: true,
      creditScore: true,
      pricePrediction: true,
      reportGeneration: true,
      whiteLabelReports: false,
      documentGenerator: true,
      supplyChainTracker: true,
      batchQuery: '100',
      apiAccess: true,
      webhooks: false,
      sso: false,
      teamCollaboration: false,
      favorites: true,
      searchHistory: '90days',
      statistics: true,
    },
    exportFormats: ['csv', 'excel', 'pdf'],
  },

  vip_enterprise: {
    quotas: {
      searches: { limit: -1, period: 'monthly' },
      complianceChecks: { limit: -1, period: 'daily' },
      downloads: { limit: -1, period: 'monthly' },
      reports: { limit: -1, period: 'monthly' },
      aiChat: { limit: -1, period: 'daily' },
      trackerProducts: { limit: -1, period: 'permanent' },
      alertRules: { limit: -1, period: 'permanent' },
      apiCalls: { limit: 10000, period: 'daily' },
      apiRateLimit: 120,
      savedSearches: 200,
      searchResultsDisplay: 1000,
      teamMembers: 10,
    },
    features: {
      basicSearch: true,
      semanticSearch: true,
      aiSearch: true,
      productDatabase: 'full_history',
      manufacturerDirectory: 'full',
      regulationLibrary: 'full_interpretation',
      marketAccess: 'detail_recommendation',
      certificationComparison: 'full',
      complianceTracker: true,
      certificateAlerts: true,
      regulatoryAlerts: 'email_inapp_webhook',
      aiChat: true,
      competitorAnalysis: true,
      marketAnalysis: true,
      creditScore: true,
      pricePrediction: true,
      reportGeneration: true,
      whiteLabelReports: true,
      documentGenerator: true,
      supplyChainTracker: true,
      batchQuery: '1000',
      apiAccess: true,
      webhooks: true,
      sso: true,
      teamCollaboration: '10members',
      favorites: true,
      searchHistory: '365days',
      statistics: true,
    },
    exportFormats: ['csv', 'excel', 'pdf'],
  },
}

export const VIP_PRICING = {
  professional: {
    monthly: 99,
    yearly: 948,
    yearlyDiscount: 20,
    label: 'Professional',
    labelZh: '专业版',
  },
  enterprise: {
    monthly: 299,
    yearly: 2868,
    yearlyDiscount: 20,
    label: 'Enterprise',
    labelZh: '企业版',
  },
} as const

export function getRoleConfigKey(role: UserRole, vipTier?: VipTier): RoleConfigKey {
  if (role === 'vip' && vipTier) {
    return `vip_${vipTier}` as RoleConfigKey
  }
  return role as RoleConfigKey
}

export function getRoleConfig(role: UserRole, vipTier?: VipTier): RoleConfig {
  const key = getRoleConfigKey(role, vipTier)
  return ROLE_CONFIG[key] || ROLE_CONFIG.guest
}

export function hasFeatureAccess(
  role: UserRole,
  vipTier: VipTier | undefined,
  feature: keyof RoleFeatures
): boolean {
  const config = getRoleConfig(role, vipTier)
  const value = config.features[feature]
  return value !== false && value !== 0
}

export function getFeatureAccessLevel(
  role: UserRole,
  vipTier: VipTier | undefined,
  feature: keyof RoleFeatures
): FeatureAccessLevel {
  const config = getRoleConfig(role, vipTier)
  return config.features[feature]
}

export function getQuotaLimit(
  role: UserRole,
  vipTier: VipTier | undefined,
  metric: keyof RoleQuotas
): QuotaLimit {
  const config = getRoleConfig(role, vipTier)
  const value = config.quotas[metric]
  if (typeof value === 'number') {
    return { limit: value, period: 'permanent' }
  }
  return value as QuotaLimit
}

export function isUnlimited(limit: number): boolean {
  return limit === -1
}

export const ROLE_LABELS: Record<UserRole | AdminRole, { en: string; zh: string }> = {
  guest: { en: 'Guest', zh: '游客' },
  user: { en: 'Registered User', zh: '注册用户' },
  vip: { en: 'VIP Member', zh: 'VIP会员' },
  editor: { en: 'Editor', zh: '编辑' },
  admin: { en: 'Admin', zh: '管理员' },
}

export const VIP_TIER_LABELS: Record<VipTier, { en: string; zh: string }> = {
  professional: { en: 'Professional', zh: '专业版' },
  enterprise: { en: 'Enterprise', zh: '企业版' },
}
