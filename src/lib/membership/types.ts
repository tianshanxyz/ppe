import type { UserRole, VipTier } from '../permissions/config'

export type MembershipTier = 'free' | 'professional' | 'enterprise'

export interface MembershipConfig {
  tier: MembershipTier
  name: string
  nameEn: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyDiscount: number
  features: string[]
  limitations: string[]
  recommendedFor: string
  popular?: boolean
}

export interface MembershipLimits {
  maxSearchResults: number
  maxSavedSearches: number
  maxSearchHistoryDays: number
  maxApiCallsPerDay: number
  maxApiCallsPerMinute: number
  maxExportRecordsPerMonth: number
  allowedExportFormats: ('csv' | 'excel' | 'pdf')[]
  maxMonitoredProducts: number
  maxMonitoredCompanies: number
  maxAlertRules: number
  maxReportsPerMonth: number
  maxReportHistoryDays: number
  maxTeamMembers: number
  maxProjects: number
  maxComplianceChecksPerDay: number
  maxAiChatPerDay: number
}

export interface MembershipPermissions {
  canAccessBasicData: boolean
  canAccessAdvancedData: boolean
  canAccessHistoricalData: boolean
  canAccessRealTimeData: boolean
  canUseSemanticSearch: boolean
  canUseAiAssistant: boolean
  canUseComparisonTool: boolean
  canUseRiskAnalysis: boolean
  canUseMarketTrends: boolean
  canExportData: boolean
  canScheduleExports: boolean
  canCreateAlerts: boolean
  canCustomizeAlertRules: boolean
  canGenerateReports: boolean
  canCustomizeReports: boolean
  canWhiteLabelReports: boolean
  canUseApi: boolean
  canUseWebhooks: boolean
  canUseSso: boolean
  canUseDocumentGenerator: boolean
  canUseSupplyChainTracker: boolean
  canUseBatchQuery: boolean
  canUseCompetitorAnalysis: boolean
  canUseCreditScore: boolean
  canUsePricePrediction: boolean
}

export interface UserMembership {
  userId: string
  currentTier: MembershipTier
  role: UserRole
  vipTier?: VipTier
  subscription: {
    status: 'active' | 'cancelled' | 'expired' | 'trial' | 'paused' | 'past_due'
    startedAt: string
    expiresAt: string
    billingCycle: 'monthly' | 'yearly'
    autoRenew: boolean
    paymentMethod?: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
  }
  usage: {
    apiCallsToday: number
    apiCallsThisMonth: number
    exportsThisMonth: number
    reportsThisMonth: number
    searchesToday: number
    complianceChecksToday: number
    aiChatToday: number
    lastResetAt: string
  }
  history: MembershipHistoryItem[]
  metadata: {
    upgradedAt?: string
    downgradedAt?: string
    cancelledAt?: string
    trialStartedAt?: string
    trialEndsAt?: string
    cancellationReason?: string
    scheduledDowngradeTier?: MembershipTier
    scheduledDowngradeAt?: string
  }
}

export interface MembershipHistoryItem {
  id: string
  fromTier: MembershipTier
  toTier: MembershipTier
  reason: 'upgrade' | 'downgrade' | 'cancellation' | 'expiration' | 'admin' | 'trial_start' | 'trial_end'
  changedAt: string
  changedBy: string
  notes?: string
}

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
  paymentMethodId?: string
  couponCode?: string
}

export interface UpgradeResponse {
  success: boolean
  clientSecret?: string
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
  effectiveAt?: 'immediately' | 'period_end'
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

export const MEMBERSHIP_TIERS: Record<MembershipTier, MembershipConfig> = {
  free: {
    tier: 'free',
    name: '免费版',
    nameEn: 'Free',
    description: '适合个人用户基础查询',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    features: [
      '基础搜索功能（3次/天）',
      '合规检查（1次/天）',
      '查看产品摘要信息',
      '查看制造商摘要信息',
      '法规标题和摘要浏览',
      '市场准入概览',
      '法规新闻浏览',
      '知识库基础内容',
      '案例分析摘要',
    ],
    limitations: [
      '无数据导出',
      '无合规追踪',
      '无证书提醒',
      '无AI助手',
      '无API访问',
      '无报告生成',
    ],
    recommendedFor: 'Individual users exploring PPE compliance',
  },
  professional: {
    tier: 'professional',
    name: '专业版',
    nameEn: 'Professional',
    description: '适合专业合规人员和中小团队',
    monthlyPrice: 99,
    yearlyPrice: 948,
    yearlyDiscount: 20,
    features: [
      '无限基础搜索',
      '无限合规检查',
      '语义搜索 + AI智能搜索',
      'AI聊天助手（50次/天）',
      '完整产品/制造商/法规信息',
      '合规追踪（50个产品）',
      '证书到期提醒（20条规则）',
      '法规变更提醒（邮件+站内）',
      '竞品分析 + 市场分析',
      '企业信用评分 + 价格预测',
      '报告生成（20份/月）',
      '文档生成器（DoC等）',
      '供应链追踪',
      '批量查询（100条/次）',
      'API访问（1000次/天）',
      '全格式导出（2000条/月）',
      '收藏和搜索历史（90天）',
    ],
    limitations: [
      '无白标报告',
      '无Webhook集成',
      '无SSO单点登录',
      '无团队协作',
    ],
    recommendedFor: 'Compliance managers and medium businesses',
    popular: true,
  },
  enterprise: {
    tier: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '适合大型企业和合规服务商',
    monthlyPrice: 299,
    yearlyPrice: 2868,
    yearlyDiscount: 20,
    features: [
      '所有专业版功能',
      '无限搜索/导出/报告',
      '无限AI聊天助手',
      '无限合规追踪和提醒',
      '白标报告',
      'API访问（10000次/天）',
      'Webhook集成',
      'SSO单点登录',
      '团队协作（10人）',
      '法规变更Webhook推送',
      '批量查询（1000条/次）',
      '优先客服支持',
      '专属客户经理',
    ],
    limitations: [],
    recommendedFor: 'Large enterprises and compliance service providers',
  },
}

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
    const config = MEMBERSHIP_TIERS[tier]
    if (config && getPermissionForTier(tier)[feature]) {
      return tier
    }
  }
  return null
}

function getPermissionForTier(tier: MembershipTier): Record<keyof MembershipPermissions, boolean> {
  const defaults: Record<keyof MembershipPermissions, boolean> = {
    canAccessBasicData: true,
    canAccessAdvancedData: false,
    canAccessHistoricalData: false,
    canAccessRealTimeData: false,
    canUseSemanticSearch: false,
    canUseAiAssistant: false,
    canUseComparisonTool: false,
    canUseRiskAnalysis: false,
    canUseMarketTrends: false,
    canExportData: false,
    canScheduleExports: false,
    canCreateAlerts: false,
    canCustomizeAlertRules: false,
    canGenerateReports: false,
    canCustomizeReports: false,
    canWhiteLabelReports: false,
    canUseApi: false,
    canUseWebhooks: false,
    canUseSso: false,
    canUseDocumentGenerator: false,
    canUseSupplyChainTracker: false,
    canUseBatchQuery: false,
    canUseCompetitorAnalysis: false,
    canUseCreditScore: false,
    canUsePricePrediction: false,
  }

  if (tier === 'free') return defaults

  if (tier === 'professional') {
    return {
      ...defaults,
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
      canUseApi: true,
      canUseDocumentGenerator: true,
      canUseSupplyChainTracker: true,
      canUseBatchQuery: true,
      canUseCompetitorAnalysis: true,
      canUseCreditScore: true,
      canUsePricePrediction: true,
    }
  }

  if (tier === 'enterprise') {
    return {
      ...defaults,
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
      canUseDocumentGenerator: true,
      canUseSupplyChainTracker: true,
      canUseBatchQuery: true,
      canUseCompetitorAnalysis: true,
      canUseCreditScore: true,
      canUsePricePrediction: true,
    }
  }

  return defaults
}

export function membershipTierToUserRole(tier: MembershipTier): UserRole {
  switch (tier) {
    case 'free': return 'user'
    case 'professional':
    case 'enterprise': return 'vip'
    default: return 'guest'
  }
}

export function membershipTierToVipTier(tier: MembershipTier): VipTier | undefined {
  switch (tier) {
    case 'professional': return 'professional'
    case 'enterprise': return 'enterprise'
    default: return undefined
  }
}
