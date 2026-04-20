/**
 * 市场准入推荐引擎 - 类型定义
 *
 * A-004: 市场准入推荐引擎
 */

// ============================================
// 产品信息输入
// ============================================

export interface ProductInfo {
  product_type: string                    // 产品类型：口罩、手套、防护服等
  product_category: string                // 产品类别
  ppe_category?: 'I' | 'II' | 'III'       // PPE类别
  intended_use: string[]                  // 预期用途
  target_users: string[]                  // 目标用户
  
  // 产品特性
  features: {
    material?: string
    standards?: string[]                  // 符合的标准
    certifications?: string[]             // 已有认证
  }
}

export interface CompanyProfile {
  company_name: string
  existing_certifications: ExistingCertification[]
  manufacturing_capabilities: {
    iso_certified: boolean
    has_qms: boolean
    production_capacity?: string
  }
  target_markets?: string[]               // 已有市场
  budget_constraint?: BudgetConstraint
  timeline_constraint?: TimelineConstraint
}

export interface ExistingCertification {
  type: 'CE' | 'FDA_510K' | 'FDA_PMA' | 'NMPA' | 'UKCA' | 'ISO_9001' | 'ISO_13485' | 'other'
  market: string
  status: 'active' | 'expired' | 'pending'
  expiry_date?: string
}

export interface BudgetConstraint {
  max_budget_usd: number
  budget_flexibility: 'strict' | 'flexible' | 'very_flexible'
}

export interface TimelineConstraint {
  target_launch_date: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

// ============================================
// 市场信息
// ============================================

export interface MarketInfo {
  code: string
  name: string
  name_zh: string
  region: string
  
  // 市场规模
  market_size: {
    total_value_usd: number             // 市场总值（美元）
    growth_rate: number                 // 年增长率
    ppe_market_share: number            // PPE市场占比
  }
  
  // 准入要求
  entry_requirements: {
    mandatory_certification: boolean
    certification_types: string[]
    local_representative_required: boolean
    testing_required: boolean
    clinical_data_required: boolean
  }
  
  // 准入难度
  difficulty_score: number                // 0-100，越高越难
  
  // 时间和成本
  estimated_timeline: {
    min_months: number
    max_months: number
    average_months: number
  }
  
  estimated_cost: {
    min_usd: number
    max_usd: number
    average_usd: number
  }
  
  // 竞争情况
  competition_level: 'low' | 'medium' | 'high'
  
  // 法规信息
  regulation: {
    framework: string
    authority: string
    recent_changes?: string
  }
}

// ============================================
// 推荐结果
// ============================================

export interface MarketRecommendation {
  market: MarketInfo
  
  // 推荐评分
  recommendation_score: number            // 0-100
  ranking: number                         // 排名
  
  // 匹配度分析
  match_analysis: {
    overall_match: number                 // 0-100
    product_fit_score: number             // 产品适配度
    certification_advantage_score: number // 已有认证优势
    market_opportunity_score: number      // 市场机会分
    difficulty_adjusted_score: number     // 难度调整后得分
  }
  
  // 准入路径
  entry_path: {
    primary_path: string                  // 主要准入路径
    alternative_paths?: string[]          // 替代路径
    required_certifications: RequiredCertification[]
    estimated_timeline_months: number
    estimated_cost_usd: number
  }
  
  // 建议
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    actions: string[]                     // 建议行动
    risks: string[]                       // 风险提示
    opportunities: string[]               // 机会点
  }
  
  // 竞争对手分析（可选）
  competitive_analysis?: {
    key_competitors: string[]
    market_saturation: 'low' | 'medium' | 'high'
    differentiation_opportunities: string[]
  }
}

export interface RequiredCertification {
  type: string
  name: string
  mandatory: boolean
  estimated_timeline_months: number
  estimated_cost_usd: number
  prerequisites: string[]
  description: string
}

// ============================================
// 推荐请求和响应
// ============================================

export interface MarketRecommendationRequest {
  product: ProductInfo
  company: CompanyProfile
  
  // 偏好设置
  preferences?: {
    prioritize_speed?: boolean          // 优先考虑速度
    prioritize_cost?: boolean           // 优先考虑成本
    prioritize_market_size?: boolean    // 优先考虑市场规模
    risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
    regions_of_interest?: string[]      // 感兴趣的地区
    exclude_markets?: string[]          // 排除的市场
  }
  
  // 限制条件
  constraints?: {
    max_recommendations?: number
    min_market_size_usd?: number
    max_difficulty_score?: number
  }
}

export interface MarketRecommendationResponse {
  success: boolean
  error?: string
  
  // 推荐结果
  recommendations: MarketRecommendation[]
  total_recommendations: number
  
  // 分析摘要
  summary: {
    top_market: string
    fastest_entry: string
    lowest_cost: string
    best_overall: string
  }
  
  // 比较分析
  comparison_matrix: MarketComparisonMatrix
  
  // 执行建议
  action_plan: {
    immediate_actions: string[]         // 立即行动
    short_term_actions: string[]        // 短期行动（1-3个月）
    medium_term_actions: string[]       // 中期行动（3-6个月）
  }
  
  processing_time_ms: number
}

export interface MarketComparisonMatrix {
  markets: string[]
  criteria: {
    name: string
    weights: number
    scores: Record<string, number>      // market -> score
  }[]
}

// ============================================
// 市场数据配置
// ============================================

export interface MarketDataConfig {
  markets: MarketInfo[]
  
  // 产品类型到认证要求的映射
  product_type_requirements: Record<string, {
    certifications: string[]
    typical_timeline_months: number
    typical_cost_usd: number
  }>
  
  // 认证互认关系
  certification_reciprocity: Record<string, {
    recognized_by: string[]
    advantages: string[]
  }>
}

// ============================================
// 评分权重配置
// ============================================

export interface ScoringWeights {
  product_fit: number                    // 产品适配度权重
  market_opportunity: number             // 市场机会权重
  entry_difficulty: number               // 准入难度权重（反向）
  cost_efficiency: number                // 成本效率权重
  speed_to_market: number                // 上市速度权重
  certification_advantage: number        // 已有认证优势权重
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  product_fit: 0.20,
  market_opportunity: 0.25,
  entry_difficulty: 0.15,
  cost_efficiency: 0.15,
  speed_to_market: 0.15,
  certification_advantage: 0.10,
}
