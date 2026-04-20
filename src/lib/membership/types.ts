/**
 * 会员等级系统 - 类型定义
 *
 * B-001: 会员等级系统
 */

// ============================================
// 会员等级定义
// ============================================

export type MembershipTier = 'free' | 'professional' | 'enterprise'

export interface MembershipConfig {
  tier: MembershipTier
  name: string
  nameEn: string
  description: string
  monthlyPrice: number // 美元
  yearlyPrice: number // 美元，通常有折扣
  features: string[]
  limits: MembershipLimits
  permissions: MembershipPermissions
}

export interface MembershipLimits {
  // 搜索限制
  maxSearchResults: number
  maxSavedSearches: number
  maxSearchHistoryDays: number

  // API限制
  maxApiCallsPerDay: number
  maxApiCallsPerMinute: number

  // 数据导出限制
  maxExportRecordsPerMonth: number
  allowedExportFormats: ('csv' | 'excel' | 'pdf')[]

  // 监控限制
  maxMonitoredProducts: number
  maxMonitoredCompanies: number
  maxAlertRules: number

  // 报告限制
  maxReportsPerMonth: number
  maxReportHistoryDays: number

  // 团队协作
  maxTeamMembers: number
  maxProjects: number
}

export interface MembershipPermissions {
  // 数据访问权限
  canAccessBasicData: boolean
  canAccessAdvancedData: boolean
  canAccessHistoricalData: boolean
  canAccessRealTimeData: boolean

  // 功能权限
  canUseSemanticSearch: boolean
  canUseAiAssistant: boolean
  canUseComparisonTool: boolean
  canUseRiskAnalysis: boolean
  canUseMarketTrends: boolean

  // 导出权限
  canExportData: boolean
  canScheduleExports: boolean

  // 监控权限
  canCreateAlerts: boolean
  canCustomizeAlertRules: boolean

  // 报告权限
  canGenerateReports: boolean
  canCustomizeReports: boolean
  canWhiteLabelReports: boolean

  // 集成权限
  canUseApi: boolean
  canUseWebhooks: boolean
  canUseSso: boolean
}

// ============================================
// 用户会员信息
// ============================================

export interface UserMembership {
  userId: string
  currentTier: MembershipTier

  // 订阅信息
  subscription: {
    status: 'active' | 'cancelled' | 'expired' | 'trial' | 'paused'
    startedAt: string
    expiresAt: string
    billingCycle: 'monthly' | 'yearly'
    autoRenew: boolean
    paymentMethod?: string
  }

  // 使用统计
  usage: {
    apiCallsToday: number
    apiCallsThisMonth: number
    exportsThisMonth: number
    reportsThisMonth: number
    searchesToday: number
    lastResetAt: string
  }

  // 升级/降级历史
  history: MembershipHistoryItem[]

  // 元数据
  metadata: {
    upgradedAt?: string
    downgradedAt?: string
    cancelledAt?: string
    trialStartedAt?: string
    trialEndsAt?: string
  }
}

export interface MembershipHistoryItem {
  id: string
  fromTier: MembershipTier
  toTier: MembershipTier
  reason: 'upgrade' | 'downgrade' | 'cancellation' | 'expiration' | 'admin'
  changedAt: string
  changedBy: string
  notes?: string
}

// ============================================
// API请求/响应类型
// ============================================

export interface GetMembershipResponse {
  success: boolean
  membership?: UserMembership
  config?: MembershipConfig
  usagePercentage?: {
    apiCalls: number
    exports: number
    reports: number
  }
  error?: string
}

export interface UpgradeRequest {
  targetTier: MembershipTier
  billingCycle: 'monthly' | 'yearly'
  paymentMethodId: string
  couponCode?: string
}

export interface UpgradeResponse {
  success: boolean
  clientSecret?: string // Stripe client secret
  membership?: UserMembership
  error?: string
}

export interface DowngradeRequest {
  targetTier: MembershipTier
  effectiveAt: 'immediately' | 'period_end'
  reason?: string
}

export interface CancelRequest {
  reason?: string
  feedback?: string
}

export interface CheckPermissionRequest {
  permission: keyof MembershipPermissions
}

export interface CheckPermissionResponse {
  success: boolean
  allowed: boolean
  currentTier: MembershipTier
  requiredTier?: MembershipTier
  message?: string
}

export interface CheckLimitRequest {
  limitType: keyof MembershipLimits
  requestedAmount?: number
}

export interface CheckLimitResponse {
  success: boolean
  allowed: boolean
  currentUsage: number
  limit: number
  remaining: number
  resetAt?: string
  message?: string
}

// ============================================
// 权益检查中间件类型
// ============================================

export interface FeatureAccessCheck {
  feature: keyof MembershipPermissions
  fallback?: 'deny' | 'redirect' | 'upgrade_prompt'
  redirectUrl?: string
}

export interface LimitCheck {
  limitType: keyof MembershipLimits
  incrementBy?: number
  errorMessage?: string
}

// ============================================
// 会员等级配置
// ============================================

export const MEMBERSHIP_TIERS: Record<MembershipTier, MembershipConfig> = {
  free: {
    tier: 'free',
    name: '免费版',
    nameEn: 'Free',
    description: '适合个人用户基础查询',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '基础搜索功能',
      '查看企业基本信息',
      '查看产品基本信息',
      '5次/天搜索额度',
      'CSV导出（10条/月）',
    ],
    limits: {
      maxSearchResults: 10,
      maxSavedSearches: 3,
      maxSearchHistoryDays: 7,
      maxApiCallsPerDay: 0,
      maxApiCallsPerMinute: 0,
      maxExportRecordsPerMonth: 10,
      allowedExportFormats: ['csv'],
      maxMonitoredProducts: 0,
      maxMonitoredCompanies: 0,
      maxAlertRules: 0,
      maxReportsPerMonth: 0,
      maxReportHistoryDays: 0,
      maxTeamMembers: 1,
      maxProjects: 1,
    },
    permissions: {
      canAccessBasicData: true,
      canAccessAdvancedData: false,
      canAccessHistoricalData: false,
      canAccessRealTimeData: false,
      canUseSemanticSearch: false,
      canUseAiAssistant: false,
      canUseComparisonTool: false,
      canUseRiskAnalysis: false,
      canUseMarketTrends: false,
      canExportData: true,
      canScheduleExports: false,
      canCreateAlerts: false,
      canCustomizeAlertRules: false,
      canGenerateReports: false,
      canCustomizeReports: false,
      canWhiteLabelReports: false,
      canUseApi: false,
      canUseWebhooks: false,
      canUseSso: false,
    },
  },
  professional: {
    tier: 'professional',
    name: '专业版',
    nameEn: 'Professional',
    description: '适合专业买手和合规经理',
    monthlyPrice: 49,
    yearlyPrice: 468, // 20%折扣
    features: [
      '所有免费版功能',
      '语义搜索',
      'AI助手问答',
      '竞品对比分析',
      '风险分析雷达',
      '100次/天搜索额度',
      '全格式导出（1000条/月）',
      '10个监控预警',
      '5份报告/月',
      'API访问（1000次/天）',
    ],
    limits: {
      maxSearchResults: 100,
      maxSavedSearches: 20,
      maxSearchHistoryDays: 90,
      maxApiCallsPerDay: 1000,
      maxApiCallsPerMinute: 60,
      maxExportRecordsPerMonth: 1000,
      allowedExportFormats: ['csv', 'excel', 'pdf'],
      maxMonitoredProducts: 10,
      maxMonitoredCompanies: 10,
      maxAlertRules: 10,
      maxReportsPerMonth: 5,
      maxReportHistoryDays: 365,
      maxTeamMembers: 1,
      maxProjects: 5,
    },
    permissions: {
      canAccessBasicData: true,
      canAccessAdvancedData: true,
      canAccessHistoricalData: true,
      canAccessRealTimeData: true,
      canUseSemanticSearch: true,
      canUseAiAssistant: true,
      canUseComparisonTool: true,
      canUseRiskAnalysis: true,
      canUseMarketTrends: true,
      canExportData: true,
      canScheduleExports: true,
      canCreateAlerts: true,
      canCustomizeAlertRules: true,
      canGenerateReports: true,
      canCustomizeReports: true,
      canWhiteLabelReports: false,
      canUseApi: true,
      canUseWebhooks: false,
      canUseSso: false,
    },
  },
  enterprise: {
    tier: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '适合企业团队和大型组织',
    monthlyPrice: 199,
    yearlyPrice: 1908, // 20%折扣
    features: [
      '所有专业版功能',
      '无限搜索额度',
      '无限导出',
      '无限监控预警',
      '无限报告生成',
      '白标报告',
      'API访问（10000次/天）',
      'Webhook集成',
      'SSO单点登录',
      '10个团队成员',
      '优先客服支持',
    ],
    limits: {
      maxSearchResults: 1000,
      maxSavedSearches: 100,
      maxSearchHistoryDays: 365,
      maxApiCallsPerDay: 10000,
      maxApiCallsPerMinute: 120,
      maxExportRecordsPerMonth: 10000,
      allowedExportFormats: ['csv', 'excel', 'pdf'],
      maxMonitoredProducts: 100,
      maxMonitoredCompanies: 100,
      maxAlertRules: 100,
      maxReportsPerMonth: 100,
      maxReportHistoryDays: 730,
      maxTeamMembers: 10,
      maxProjects: 50,
    },
    permissions: {
      canAccessBasicData: true,
      canAccessAdvancedData: true,
      canAccessHistoricalData: true,
      canAccessRealTimeData: true,
      canUseSemanticSearch: true,
      canUseAiAssistant: true,
      canUseComparisonTool: true,
      canUseRiskAnalysis: true,
      canUseMarketTrends: true,
      canExportData: true,
      canScheduleExports: true,
      canCreateAlerts: true,
      canCustomizeAlertRules: true,
      canGenerateReports: true,
      canCustomizeReports: true,
      canWhiteLabelReports: true,
      canUseApi: true,
      canUseWebhooks: true,
      canUseSso: true,
    },
  },
}

// ============================================
// 工具函数
// ============================================

export function getMembershipConfig(tier: MembershipTier): MembershipConfig {
  return MEMBERSHIP_TIERS[tier]
}

export function getAllMembershipConfigs(): MembershipConfig[] {
  return Object.values(MEMBERSHIP_TIERS)
}

export function compareTiers(tier1: MembershipTier, tier2: MembershipTier): number {
  const order: MembershipTier[] = ['free', 'professional', 'enterprise']
  return order.indexOf(tier1) - order.indexOf(tier2)
}

export function isHigherTier(tier1: MembershipTier, tier2: MembershipTier): boolean {
  return compareTiers(tier1, tier2) > 0
}

export function getRequiredTierForFeature(
  feature: keyof MembershipPermissions
): MembershipTier | null {
  for (const tier of ['enterprise', 'professional', 'free'] as MembershipTier[]) {
    if (MEMBERSHIP_TIERS[tier].permissions[feature]) {
      return tier
    }
  }
  return null
}
