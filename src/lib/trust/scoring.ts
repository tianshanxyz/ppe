export type TrustLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERIFIED'

export interface TrustFactor {
  name: string
  weight: number
  score: number
  description: string
  details?: string
}

export interface TrustScore {
  score: number
  level: TrustLevel
  factors: TrustFactor[]
  lastUpdated: string
}

export interface TrustScoreOptions {
  data?: TrustScoreData
  includeDetails?: boolean
}

export interface TrustScoreData {
  updated_at?: string
  last_updated?: string
  source?: string
  data_source?: string
  website?: string
  phone?: string
  agent?: string
  verified?: boolean
  verification_status?: string
  alerts?: RiskAlert[]
  name?: string
  address?: string
  contact_email?: string
  [key: string]: string | number | boolean | null | undefined | RiskAlert[] | undefined
}

export interface RiskAlert {
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title?: string
  description?: string
  created_at?: string
  [key: string]: string | number | boolean | null | undefined
}

const MAX_SCORE = 1.0

export function getScoreLevel(score: number): TrustLevel {
  if (score >= 0.8) return 'VERIFIED'
  if (score >= 0.6) return 'HIGH'
  if (score >= 0.4) return 'MEDIUM'
  return 'LOW'
}

export function calculateRecencyScore(updatedAt: string | null): number {
  if (!updatedAt) return 0

  const now = new Date()
  const updated = new Date(updatedAt)
  const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceUpdate < 30) return 1.0
  if (daysSinceUpdate < 90) return 0.8
  if (daysSinceUpdate < 180) return 0.6
  if (daysSinceUpdate < 365) return 0.4
  return 0.2
}

export function calculateSourceScore(source: string | null): number {
  const authoritativeSources = ['FDA', 'EUDAMED', 'NMPA', 'PMDA', 'MHRA', 'TGA']
  if (!source) return 0.3
  return authoritativeSources.includes(source) ? 1.0 : 0.5
}

export function calculateCompletenessScore(data: TrustScoreData): number {
  const requiredFields = ['name', 'address', 'contact_email']
  const optionalFields = ['website', 'phone', 'agent']

  let score = 0
  let totalWeight = 0

  for (const field of requiredFields) {
    if (data[field]) {
      score += 0.4
    }
    totalWeight += 0.4
  }

  for (const field of optionalFields) {
    if (data[field]) {
      score += 0.2
    }
    totalWeight += 0.2
  }

  return totalWeight > 0 ? score / totalWeight : 0
}

export function calculateVerificationScore(data: TrustScoreData): number {
  if (data.verified) return 1.0
  if (data.verification_status === 'verified') return 1.0
  return 0.5
}

export function calculateRiskScore(alerts: RiskAlert[]): number {
  if (!alerts || alerts.length === 0) return 1.0

  let penalty = 0
  for (const alert of alerts) {
    switch (alert.risk_level) {
      case 'CRITICAL':
        penalty += 0.3
        break
      case 'HIGH':
        penalty += 0.2
        break
      case 'MEDIUM':
        penalty += 0.1
        break
      case 'LOW':
        penalty += 0.05
        break
    }
  }

  return Math.max(0, 1 - penalty)
}

export function calculateHistoryScore(changeHistory: Array<{ changed_at?: string; created_at?: string }>): number {
  if (!changeHistory || changeHistory.length === 0) return 0.5

  const recentChanges = changeHistory.filter((change) => {
    const dateStr = change.changed_at || change.created_at
    if (!dateStr) return false
    const changeDate = new Date(dateStr)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return changeDate > sixMonthsAgo
  })

  if (recentChanges.length === 0) return 1.0
  if (recentChanges.length <= 2) return 0.8
  if (recentChanges.length <= 5) return 0.6
  return 0.4
}

export function calculateTrustScore(data: TrustScoreData, options: TrustScoreOptions = {}): TrustScore {
  const factors: TrustFactor[] = []

  // 1. 数据时效性 (权重 0.3)
  const recencyScore = calculateRecencyScore(data.updated_at || data.last_updated || null)
  factors.push({
    name: 'data_recency',
    weight: 0.3,
    score: recencyScore,
    description: '数据时效性',
    details: data.updated_at
      ? `最后更新: ${new Date(data.updated_at).toLocaleDateString()}`
      : '未提供更新时间',
  })

  // 2. 数据源权威性 (权重 0.4)
  const sourceScore = calculateSourceScore(data.source || data.data_source || null)
  factors.push({
    name: 'source_authority',
    weight: 0.4,
    score: sourceScore,
    description: '数据源权威性',
    details: data.source || '未指定数据源',
  })

  // 3. 数据完整性 (权重 0.2)
  const completenessScore = calculateCompletenessScore(data)
  factors.push({
    name: 'completeness',
    weight: 0.2,
    score: completenessScore,
    description: '数据完整性',
    details: `${Object.keys(data).length} 个字段`,
  })

  // 4. 验证状态 (权重 0.1)
  const verificationScore = calculateVerificationScore(data)
  factors.push({
    name: 'verification',
    weight: 0.1,
    score: verificationScore,
    description: '是否已验证',
    details: data.verified ? '已验证' : '未验证',
  })

  // 计算总分
  const totalScore = factors.reduce(
    (sum, factor) => sum + factor.weight * factor.score,
    0
  )

  // 添加风险惩罚（如果有风险警报）
  if (options.data?.alerts) {
    const riskPenalty = calculateRiskScore(options.data.alerts)
    const riskFactor: TrustFactor = {
      name: 'risk_penalty',
      weight: 0.1,
      score: riskPenalty,
      description: '风险惩罚',
      details: `${options.data.alerts.length} 个风险警报`,
    }
    factors.push(riskFactor)

    // 重新计算总分
    const weightedRiskScore = riskFactor.weight * riskPenalty
    const originalTotal = totalScore
    const newTotal = originalTotal - (0.1 * 0.5) + weightedRiskScore // 替换验证分数
    return {
      score: Math.min(MAX_SCORE, Math.max(0, newTotal)),
      level: getScoreLevel(newTotal),
      factors,
      lastUpdated: new Date().toISOString(),
    }
  }

  return {
    score: Math.min(MAX_SCORE, Math.max(0, totalScore)),
    level: getScoreLevel(totalScore),
    factors,
    lastUpdated: new Date().toISOString(),
  }
}

export function formatTrustScore(score: number): string {
  return (score * 100).toFixed(1)
}

export function getTrustScoreColor(level: TrustLevel): string {
  switch (level) {
    case 'VERIFIED':
      return 'bg-green-500'
    case 'HIGH':
      return 'bg-blue-500'
    case 'MEDIUM':
      return 'bg-yellow-500'
    case 'LOW':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function getTrustScoreBadgeColor(level: TrustLevel): string {
  switch (level) {
    case 'VERIFIED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'HIGH':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'LOW':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}
