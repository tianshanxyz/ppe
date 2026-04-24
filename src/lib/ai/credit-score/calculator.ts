/**
 * 制造商信用评分计算引擎
 *
 * 基于规则引擎的4维度评分算法
 * A-001: 制造商信用评分算法
 */

import { createClient } from '@/lib/supabase/client'
import {
  ManufacturerCreditScore,
  ComplianceHistoryDetail,
  RiskEventsDetail,
  ActivityDetail,
  DiversityDetail,
  RiskFactor,
  PositiveFactor,
  ScoreHistoryPoint,
  CreditScoreConfig,
} from './types'

// ============================================
// 评分配置
// ============================================

const DEFAULT_CONFIG: CreditScoreConfig = {
  version: '1.0.0',
  weights: {
    compliance_history: 0.4,
    risk_events: 0.3,
    activity: 0.2,
    diversity: 0.1,
  },
  thresholds: {
    critical: 40,
    high: 60,
    medium: 80,
    low: 100,
  },
  scoring_rules: {
    max_certification_age_days: 365 * 5, // 5年
    activity_lookback_days: 365,
    incident_decay_days: 365 * 3, // 3年衰减
    min_data_completeness: 60,
  },
}

// 市场重要性权重（用于多样性评分）
const MARKET_WEIGHTS: Record<string, number> = {
  US: 1.0,
  EU: 0.9,
  CN: 0.8,
  JP: 0.7,
  CA: 0.6,
  AU: 0.6,
  UK: 0.6,
  OTHER: 0.4,
}

// ============================================
// 评分计算引擎
// ============================================

export class CreditScoreCalculator {
  private config: CreditScoreConfig

  constructor(config: Partial<CreditScoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 计算制造商信用评分
   */
  async calculate(manufacturerId: string): Promise<ManufacturerCreditScore | null> {
    const supabase = createClient()
    const now = new Date()

    // 获取制造商信息
    const { data: manufacturer, error: mfgError } = await supabase
      .from('ppe_manufacturers_enhanced')
      .select('*')
      .eq('id', manufacturerId)
      .single()

    if (mfgError || !manufacturer) {
      console.error('获取制造商信息失败:', mfgError)
      return null
    }

    // 获取产品信息
    const { data: products, error: prodError } = await supabase
      .from('ppe_products_enhanced')
      .select('*')
      .eq('manufacturer_id', manufacturerId)

    if (prodError) {
      console.error('获取产品信息失败:', prodError)
      return null
    }

    // 获取历史评分
    const { data: historyData } = await supabase
      .from('manufacturer_credit_scores')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .order('calculated_at', { ascending: false })
      .limit(12)

    // 计算各维度得分
    const complianceDetail = this.calculateComplianceHistory(products || [], now)
    const riskDetail = this.calculateRiskEvents(manufacturer, products || [], now)
    const activityDetail = this.calculateActivity(products || [], now)
    const diversityDetail = this.calculateDiversity(products || [])

    // 计算总分
    const overallScore = Math.round(
      complianceDetail.score * this.config.weights.compliance_history +
      riskDetail.score * this.config.weights.risk_events +
      activityDetail.score * this.config.weights.activity +
      diversityDetail.score * this.config.weights.diversity
    )

    // 确定风险等级
    const riskLevel = this.determineRiskLevel(overallScore)
    const riskLevelNumeric = riskLevel === 'critical' ? 4 : riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1

    // 识别风险因素和正面因素
    const riskFactors = this.identifyRiskFactors(manufacturer, products || [], riskDetail)
    const positiveFactors = this.identifyPositiveFactors(complianceDetail, riskDetail, activityDetail, diversityDetail)

    // 计算行业对比（简化版，实际应该查询同类型制造商的平均分）
    const industryComparison = {
      percentile: Math.min(99, Math.max(1, overallScore)),
      average_score: 65,
      top_performer_score: 95,
      comparison_group: 'PPE Manufacturers',
    }

    // 计算趋势
    const scoreHistory: ScoreHistoryPoint[] = (historyData || []).map((h: any) => ({
      date: h.calculated_at,
      overall_score: h.overall_score,
      dimension_scores: h.dimension_scores || {},
    }))

    const trend = this.calculateTrend(overallScore, scoreHistory)

    // 计算数据完整度
    const dataCompleteness = this.calculateDataCompleteness(manufacturer, products || [])

    const creditScore: ManufacturerCreditScore = {
      overall_score: overallScore,
      last_calculated: now.toISOString(),
      next_calculation_due: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
      calculation_version: this.config.version,

      dimensions: {
        compliance_history: complianceDetail,
        risk_events: riskDetail,
        activity: activityDetail,
        diversity: diversityDetail,
      },

      weights: this.config.weights,

      risk_level: riskLevel,
      risk_level_numeric: riskLevelNumeric,

      risk_factors: riskFactors,
      positive_factors: positiveFactors,

      industry_comparison: industryComparison,

      score_history: scoreHistory,
      trend_direction: trend.direction,
      trend_percentage: trend.percentage,

      metadata: {
        data_completeness: dataCompleteness,
        calculation_method: 'rule_based',
        confidence_level: dataCompleteness >= 80 ? 0.9 : dataCompleteness >= 60 ? 0.75 : 0.6,
      },
    }

    // 保存评分结果
    await this.saveScore(supabase, manufacturerId, creditScore)

    return creditScore
  }

  /**
   * 计算合规历史分 (40%)
   */
  private calculateComplianceHistory(products: any[], now: Date): ComplianceHistoryDetail {
    const totalCertifications = products.length
    const activeCertifications = products.filter((p) => p.registration_status === 'active').length
    const expiredCertifications = products.filter((p) => p.registration_status === 'expired').length
    const revokedCertifications = products.filter((p) => p.registration_status === 'revoked').length

    // 计算平均认证持续时间
    let totalDuration = 0
    let maxDuration = 0
    let validCertCount = 0
    let firstCertDate: Date | null = null
    let lastCertDate: Date | null = null

    for (const product of products) {
      if (product.approval_date && product.expiry_date) {
        const approvalDate = new Date(product.approval_date)
        const expiryDate = new Date(product.expiry_date)
        const duration = Math.floor((expiryDate.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24))

        totalDuration += duration
        maxDuration = Math.max(maxDuration, duration)
        validCertCount++

        if (!firstCertDate || approvalDate < firstCertDate) {
          firstCertDate = approvalDate
        }
        if (!lastCertDate || approvalDate > lastCertDate) {
          lastCertDate = approvalDate
        }
      }
    }

    const avgDuration = validCertCount > 0 ? totalDuration / validCertCount : 0

    // 计算认证趋势
    const lastYearCerts = products.filter((p) => {
      if (p.approval_date) {
        const approvalDate = new Date(p.approval_date)
        return now.getTime() - approvalDate.getTime() < 365 * 24 * 60 * 60 * 1000
      }
      return false
    }).length

    const previousYearCerts = products.filter((p) => {
      if (p.approval_date) {
        const approvalDate = new Date(p.approval_date)
        const age = now.getTime() - approvalDate.getTime()
        return age >= 365 * 24 * 60 * 60 * 1000 && age < 2 * 365 * 24 * 60 * 60 * 1000
      }
      return false
    }).length

    let certificationTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (lastYearCerts > previousYearCerts * 1.2) certificationTrend = 'increasing'
    else if (lastYearCerts < previousYearCerts * 0.8) certificationTrend = 'decreasing'

    // 计算得分
    const activeRatio = totalCertifications > 0 ? activeCertifications / totalCertifications : 0
    const durationScore = Math.min(avgDuration / 365, 2) * 25 // 2年以上得满分
    const score = Math.min(100, activeRatio * 50 + durationScore + (revokedCertifications === 0 ? 10 : 0))

    return {
      score: Math.round(score),
      total_certifications: totalCertifications,
      active_certifications: activeCertifications,
      expired_certifications: expiredCertifications,
      revoked_certifications: revokedCertifications,
      avg_certification_duration_days: Math.round(avgDuration),
      longest_certification_duration_days: maxDuration,
      first_certification_date: firstCertDate?.toISOString(),
      last_certification_date: lastCertDate?.toISOString(),
      certification_trend: certificationTrend,
    }
  }

  /**
   * 计算风险事件分 (30%)
   */
  private calculateRiskEvents(manufacturer: any, products: any[], now: Date): RiskEventsDetail {
    const complianceStats = manufacturer.compliance_stats || {}
    const recalls = complianceStats.recalls_history?.total_recalls || 0
    const warnings = complianceStats.warning_letters?.total || 0
    const importAlerts = complianceStats.import_alerts?.total || 0

    // 计算召回严重性（简化版）
    const recallSeverity = recalls > 0 ? Math.min(100, recalls * 25) : 0

    // 计算去年事件数
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const incidentsLastYear = recalls + warnings // 简化计算

    // 计算趋势
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
    const incidentsLast2Years = recalls + warnings // 简化
    const incidentsPreviousYear = Math.max(0, incidentsLast2Years - incidentsLastYear)

    let incidentsTrend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (incidentsLastYear < incidentsPreviousYear) incidentsTrend = 'improving'
    else if (incidentsLastYear > incidentsPreviousYear) incidentsTrend = 'worsening'

    // 计算得分（每个召回-20分，每个警告信-10分）
    const score = Math.max(0, 100 - recalls * 20 - warnings * 10 - importAlerts * 15)

    return {
      score: Math.round(score),
      recalls_count: recalls,
      recall_severity_score: recallSeverity,
      warning_letters_count: warnings,
      import_alerts_count: importAlerts,
      consent_decrees_count: 0,
      seizures_count: 0,
      last_incident_date: complianceStats.last_incident_date,
      incidents_last_year: incidentsLastYear,
      incidents_trend: incidentsTrend,
    }
  }

  /**
   * 计算活跃度分 (20%)
   */
  private calculateActivity(products: any[], now: Date): ActivityDetail {
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const certsLastYear = products.filter((p) => {
      if (p.approval_date) return new Date(p.approval_date) > oneYearAgo
      return false
    }).length

    const certsLast6Months = products.filter((p) => {
      if (p.approval_date) return new Date(p.approval_date) > sixMonthsAgo
      return false
    }).length

    // 计算新市场
    const newMarkets = new Set<string>()
    products.forEach((p) => {
      if (p.approval_date && new Date(p.approval_date) > oneYearAgo) {
        ;(p.target_markets || []).forEach((m: string) => newMarkets.add(m))
      }
    })

    // 计算最后活动时间
    let lastActivityDate: Date | null = null
    products.forEach((p) => {
      if (p.approval_date) {
        const date = new Date(p.approval_date)
        if (!lastActivityDate || date > lastActivityDate) {
          lastActivityDate = date
        }
      }
    })

    // 确定活跃度频率
    let activityFrequency: 'high' | 'medium' | 'low' = 'low'
    if (certsLastYear >= 5) activityFrequency = 'high'
    else if (certsLastYear >= 2) activityFrequency = 'medium'

    // 计算得分（每年2个认证得60分，5个以上得100分）
    const score = Math.min(100, certsLastYear * 20 + certsLast6Months * 10)

    return {
      score: Math.round(score),
      certifications_last_year: certsLastYear,
      certifications_last_6_months: certsLast6Months,
      new_markets_last_year: newMarkets.size,
      new_products_last_year: certsLastYear,
      last_activity_date: lastActivityDate ? new Date(lastActivityDate).toISOString() : undefined,
      activity_frequency: activityFrequency,
    }
  }

  /**
   * 计算多样性分 (10%)
   */
  private calculateDiversity(products: any[]): DiversityDetail {
    const markets = new Set<string>()
    const categories = new Set<string>()
    const certTypes = new Set<string>()
    const frameworks = new Set<string>()

    products.forEach((p) => {
      // 市场
      ;(p.target_markets || []).forEach((m: string) => markets.add(m))

      // 产品类别
      if (p.product_category) categories.add(p.product_category)

      // 认证类型
      if (p.certifications) {
        Object.keys(p.certifications).forEach((type) => certTypes.add(type))
      }

      // 监管框架
      ;(p.target_markets || []).forEach((m: string) => {
        if (m === 'US') frameworks.add('FDA')
        if (m === 'EU') frameworks.add('CE')
        if (m === 'CN') frameworks.add('NMPA')
        if (m === 'JP') frameworks.add('PMDA')
      })
    })

    // 计算市场覆盖得分（加权）
    let marketCoverageScore = 0
    markets.forEach((m) => {
      marketCoverageScore += MARKET_WEIGHTS[m] || MARKET_WEIGHTS.OTHER
    })
    marketCoverageScore = Math.min(100, marketCoverageScore * 20)

    // 计算产品多样性得分
    const productDiversityScore = Math.min(100, categories.size * 15)

    // 计算总分
    const score = marketCoverageScore * 0.5 + productDiversityScore * 0.3 + Math.min(100, certTypes.size * 10) * 0.2

    return {
      score: Math.round(score),
      market_count: markets.size,
      market_coverage_score: Math.round(marketCoverageScore),
      product_category_count: categories.size,
      product_diversity_score: Math.round(productDiversityScore),
      certification_type_count: certTypes.size,
      regulatory_frameworks: Array.from(frameworks),
    }
  }

  /**
   * 确定风险等级
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < this.config.thresholds.critical) return 'critical'
    if (score < this.config.thresholds.high) return 'high'
    if (score < this.config.thresholds.medium) return 'medium'
    return 'low'
  }

  /**
   * 识别风险因素
   */
  private identifyRiskFactors(manufacturer: any, products: any[], riskDetail: RiskEventsDetail): RiskFactor[] {
    const factors: RiskFactor[] = []

    if (riskDetail.recalls_count > 0) {
      factors.push({
        type: 'recall',
        severity: riskDetail.recalls_count > 2 ? 'critical' : riskDetail.recalls_count > 1 ? 'high' : 'medium',
        description: `有${riskDetail.recalls_count}次产品召回记录`,
        impact_score: -riskDetail.recalls_count * 20,
      })
    }

    if (riskDetail.warning_letters_count > 0) {
      factors.push({
        type: 'warning_letter',
        severity: riskDetail.warning_letters_count > 2 ? 'high' : 'medium',
        description: `收到${riskDetail.warning_letters_count}封FDA警告信`,
        impact_score: -riskDetail.warning_letters_count * 10,
      })
    }

    // 检查过期认证
    const expiredCerts = products.filter((p) => p.registration_status === 'expired').length
    if (expiredCerts > 0) {
      factors.push({
        type: 'expired_certification',
        severity: expiredCerts > 5 ? 'high' : 'medium',
        description: `${expiredCerts}个认证已过期`,
        impact_score: -expiredCerts * 5,
      })
    }

    return factors
  }

  /**
   * 识别正面因素
   */
  private identifyPositiveFactors(
    compliance: ComplianceHistoryDetail,
    risk: RiskEventsDetail,
    activity: ActivityDetail,
    diversity: DiversityDetail
  ): PositiveFactor[] {
    const factors: PositiveFactor[] = []

    if (compliance.avg_certification_duration_days > 365 * 2) {
      factors.push({
        type: 'long_compliance_history',
        description: '拥有超过2年的平均认证持续时间',
        impact_score: 10,
      })
    }

    if (diversity.market_count >= 3) {
      factors.push({
        type: 'multi_market',
        description: `覆盖${diversity.market_count}个国际市场`,
        impact_score: 8,
      })
    }

    if (risk.recalls_count === 0 && risk.warning_letters_count === 0) {
      factors.push({
        type: 'no_incidents',
        description: '无召回记录和警告信',
        impact_score: 15,
      })
    }

    if (activity.certifications_last_year >= 3) {
      factors.push({
        type: 'recent_activity',
        description: `去年获得${activity.certifications_last_year}个新认证`,
        impact_score: 10,
      })
    }

    return factors
  }

  /**
   * 计算趋势
   */
  private calculateTrend(
    currentScore: number,
    history: ScoreHistoryPoint[]
  ): { direction: 'improving' | 'stable' | 'declining'; percentage: number } {
    if (history.length < 2) {
      return { direction: 'stable', percentage: 0 }
    }

    const previousScore = history[1].overall_score
    const change = currentScore - previousScore
    const percentage = previousScore > 0 ? (change / previousScore) * 100 : 0

    let direction: 'improving' | 'stable' | 'declining' = 'stable'
    if (change > 5) direction = 'improving'
    else if (change < -5) direction = 'declining'

    return { direction, percentage: Math.round(percentage * 10) / 10 }
  }

  /**
   * 计算数据完整度
   */
  private calculateDataCompleteness(manufacturer: any, products: any[]): number {
    let totalFields = 0
    let filledFields = 0

    // 制造商字段
    const mfgFields = ['company_name', 'country', 'registration_number', 'compliance_stats']
    mfgFields.forEach((field) => {
      totalFields++
      if (manufacturer[field]) filledFields++
    })

    // 产品字段（取平均值）
    if (products.length > 0) {
      const productFields = ['product_name', 'product_category', 'target_markets', 'certifications']
      products.forEach((p) => {
        productFields.forEach((field) => {
          totalFields++
          if (p[field]) filledFields++
        })
      })
    }

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }

  /**
   * 保存评分结果
   */
  private async saveScore(supabase: any, manufacturerId: string, score: ManufacturerCreditScore): Promise<void> {
    try {
      await supabase.from('manufacturer_credit_scores').insert({
        manufacturer_id: manufacturerId,
        overall_score: score.overall_score,
        dimension_scores: {
          compliance_history: score.dimensions.compliance_history.score,
          risk_events: score.dimensions.risk_events.score,
          activity: score.dimensions.activity.score,
          diversity: score.dimensions.diversity.score,
        },
        risk_level: score.risk_level,
        calculated_at: score.last_calculated,
        version: score.calculation_version,
      })

      // 更新制造商表的信用评分
      await supabase
        .from('ppe_manufacturers_enhanced')
        .update({ credit_score: score })
        .eq('id', manufacturerId)
    } catch (error) {
      console.error('保存评分失败:', error)
    }
  }
}

// 导出单例
export const creditScoreCalculator = new CreditScoreCalculator()
