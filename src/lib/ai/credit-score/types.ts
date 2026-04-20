/**
 * 制造商信用评分系统 - 类型定义
 *
 * A-001: 制造商信用评分算法
 */

// ============================================
// 评分维度详情
// ============================================

export interface ComplianceHistoryDetail {
  score: number // 0-100
  total_certifications: number
  active_certifications: number
  expired_certifications: number
  revoked_certifications: number
  avg_certification_duration_days: number
  longest_certification_duration_days: number
  first_certification_date?: string
  last_certification_date?: string
  certification_trend: 'increasing' | 'stable' | 'decreasing'
}

export interface RiskEventsDetail {
  score: number // 0-100
  recalls_count: number
  recall_severity_score: number // 基于召回等级计算
  warning_letters_count: number
  import_alerts_count: number
  consent_decrees_count: number
  seizures_count: number
  last_incident_date?: string
  incidents_last_year: number
  incidents_trend: 'improving' | 'stable' | 'worsening'
}

export interface ActivityDetail {
  score: number // 0-100
  certifications_last_year: number
  certifications_last_6_months: number
  new_markets_last_year: number
  new_products_last_year: number
  last_activity_date?: string
  activity_frequency: 'high' | 'medium' | 'low' // 基于每年认证数
}

export interface DiversityDetail {
  score: number // 0-100
  market_count: number
  market_coverage_score: number // 基于市场重要性加权
  product_category_count: number
  product_diversity_score: number
  certification_type_count: number
  regulatory_frameworks: string[] // FDA, CE, NMPA等
}

// ============================================
// 完整信用评分
// ============================================

export interface ManufacturerCreditScore {
  overall_score: number // 0-100
  last_calculated: string
  next_calculation_due: string
  calculation_version: string

  // 评分维度
  dimensions: {
    compliance_history: ComplianceHistoryDetail // 权重: 40%
    risk_events: RiskEventsDetail // 权重: 30%
    activity: ActivityDetail // 权重: 20%
    diversity: DiversityDetail // 权重: 10%
  }

  // 维度权重配置
  weights: {
    compliance_history: number
    risk_events: number
    activity: number
    diversity: number
  }

  // 风险评级
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_level_numeric: number // 1-4

  // 风险因素
  risk_factors: RiskFactor[]
  positive_factors: PositiveFactor[]

  // 行业对比
  industry_comparison: {
    percentile: number // 百分位排名
    average_score: number
    top_performer_score: number
    comparison_group: string
  }

  // 历史趋势
  score_history: ScoreHistoryPoint[]
  trend_direction: 'improving' | 'stable' | 'declining'
  trend_percentage: number // 变化百分比

  // 元数据
  metadata: {
    data_completeness: number // 0-100
    calculation_method: 'rule_based' | 'ml_based' | 'hybrid'
    confidence_level: number // 0-1
  }
}

export interface RiskFactor {
  type: 'recall' | 'warning_letter' | 'import_alert' | 'consent_decree' | 'seizure' | 'expired_certification'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact_score: number // 对总分的负面影响
  date?: string
  related_product?: string
}

export interface PositiveFactor {
  type: 'long_compliance_history' | 'multi_market' | 'diverse_portfolio' | 'recent_activity' | 'no_incidents'
  description: string
  impact_score: number // 对总分的正面影响
}

export interface ScoreHistoryPoint {
  date: string
  overall_score: number
  dimension_scores: {
    compliance_history: number
    risk_events: number
    activity: number
    diversity: number
  }
  change_reason?: string
}

// ============================================
// 评分解释
// ============================================

export interface ScoreExplanation {
  summary: string
  overall_assessment: string

  dimension_explanations: {
    compliance_history: DimensionExplanation
    risk_events: DimensionExplanation
    activity: DimensionExplanation
    diversity: DimensionExplanation
  }

  key_strengths: string[]
  key_concerns: string[]
  recommendations: Recommendation[]

  comparison_summary: string
  trend_summary: string
}

export interface DimensionExplanation {
  score: number
  max_score: number
  weight: number
  weighted_contribution: number
  explanation: string
  key_metrics: { label: string; value: string; impact: 'positive' | 'negative' | 'neutral' }[]
  details: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: 'compliance' | 'risk_management' | 'market_expansion' | 'documentation'
  title: string
  description: string
  expected_impact: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// ============================================
// 评分计算配置
// ============================================

export interface CreditScoreConfig {
  version: string
  weights: {
    compliance_history: number
    risk_events: number
    activity: number
    diversity: number
  }
  thresholds: {
    critical: number // < 40
    high: number // < 60
    medium: number // < 80
    low: number // >= 80
  }
  scoring_rules: {
    max_certification_age_days: number
    activity_lookback_days: number
    incident_decay_days: number
    min_data_completeness: number
  }
}

// ============================================
// API请求/响应类型
// ============================================

export interface CalculateScoreRequest {
  manufacturer_id: string
  force_recalculate?: boolean
  include_explanation?: boolean
  include_history?: boolean
}

export interface CalculateScoreResponse {
  success: boolean
  score?: ManufacturerCreditScore
  explanation?: ScoreExplanation
  error?: string
  processing_time_ms: number
}

export interface BatchCalculateRequest {
  manufacturer_ids?: string[] // 空数组表示全部
  filters?: {
    min_score?: number
    max_score?: number
    risk_level?: string
    last_calculated_before?: string // 重新计算超过此日期的
  }
}

export interface BatchCalculateResponse {
  success: boolean
  processed_count: number
  failed_count: number
  errors: { manufacturer_id: string; error: string }[]
  processing_time_ms: number
}

export interface CompareScoresRequest {
  manufacturer_ids: string[]
  dimensions?: Array<'compliance_history' | 'risk_events' | 'activity' | 'diversity' | 'overall'>
}

export interface CompareScoresResponse {
  success: boolean
  comparison: {
    manufacturer_id: string
    overall_score: number
    dimension_scores: Record<string, number>
    risk_level: string
  }[]
  rankings: {
    overall: { manufacturer_id: string; rank: number }[]
    by_dimension: Record<string, { manufacturer_id: string; rank: number }[]>
  }
  analysis: string
}

// ============================================
// 评分规则定义
// ============================================

export interface ScoringRule {
  id: string
  name: string
  description: string
  condition: string
  impact: 'positive' | 'negative'
  score_impact: number
  applicable_dimensions: string[]
}

export interface ScoringRuleSet {
  version: string
  rules: ScoringRule[]
  last_updated: string
}
