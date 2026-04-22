/**
 * 市场准入推荐引擎 - 核心算法
 *
 * A-004: 市场准入推荐引擎
 */

import {
  MarketRecommendationRequest,
  MarketRecommendationResponse,
  MarketRecommendation,
  MarketComparisonMatrix,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  RequiredCertification,
} from './types'
import {
  MARKETS,
  getMarketInfo,
  getProductTypeRequirements,
  getCertificationReciprocity,
  CERTIFICATION_DETAILS,
} from './market-data'

/**
 * 市场准入推荐引擎
 */
export class MarketRecommendationEngine {
  private weights: ScoringWeights

  constructor(weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS) {
    this.weights = weights
  }

  /**
   * 生成市场准入推荐
   */
  async generateRecommendations(
    request: MarketRecommendationRequest
  ): Promise<MarketRecommendationResponse> {
    const startTime = Date.now()

    try {
      // 1. 过滤市场
      const candidateMarkets = this.filterMarkets(request)

      // 2. 计算每个市场的推荐分数
      const recommendations: MarketRecommendation[] = candidateMarkets.map(
        (market, index) => {
          const scores = this.calculateScores(market, request)
          const entryPath = this.generateEntryPath(market, request)
          const recs = this.generateMarketRecommendations(market, request, scores)

          return {
            market,
            recommendation_score: scores.overall,
            ranking: 0, // 稍后设置
            match_analysis: {
              overall_match: scores.overall,
              product_fit_score: scores.product_fit,
              certification_advantage_score: scores.certification_advantage,
              market_opportunity_score: scores.market_opportunity,
              difficulty_adjusted_score: scores.difficulty_adjusted,
            },
            entry_path: entryPath,
            recommendations: recs,
          }
        }
      )

      // 3. 排序并设置排名
      recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score)
      recommendations.forEach((rec, index) => {
        rec.ranking = index + 1
      })

      // 4. 应用限制
      const maxRecommendations = request.constraints?.max_recommendations || 5
      const finalRecommendations = recommendations.slice(0, maxRecommendations)

      // 5. 生成比较矩阵
      const comparisonMatrix = this.generateComparisonMatrix(finalRecommendations)

      // 6. 生成执行建议
      const actionPlan = this.generateActionPlan(finalRecommendations)

      // 7. 生成摘要
      const summary = this.generateSummary(finalRecommendations)

      return {
        success: true,
        recommendations: finalRecommendations,
        total_recommendations: finalRecommendations.length,
        summary,
        comparison_matrix: comparisonMatrix,
        action_plan: actionPlan,
        processing_time_ms: Date.now() - startTime,
      }
    } catch (error) {
      console.error('生成市场准入推荐失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成推荐失败',
        recommendations: [],
        total_recommendations: 0,
        summary: {
          top_market: '',
          fastest_entry: '',
          lowest_cost: '',
          best_overall: '',
        },
        comparison_matrix: {
          markets: [],
          criteria: [],
        },
        action_plan: {
          immediate_actions: [],
          short_term_actions: [],
          medium_term_actions: [],
        },
        processing_time_ms: Date.now() - startTime,
      }
    }
  }

  /**
   * 过滤市场
   */
  private filterMarkets(request: MarketRecommendationRequest) {
    let markets = [...MARKETS]

    // 排除指定市场
    if (request.preferences?.exclude_markets) {
      markets = markets.filter(
        m => !request.preferences!.exclude_markets!.includes(m.code)
      )
    }

    // 按地区过滤
    if (request.preferences?.regions_of_interest) {
      markets = markets.filter(m =>
        request.preferences!.regions_of_interest!.includes(m.region)
      )
    }

    // 按市场规模过滤
    if (request.constraints?.min_market_size_usd) {
      markets = markets.filter(
        m => m.market_size.total_value_usd >= request.constraints!.min_market_size_usd!
      )
    }

    // 按难度过滤
    if (request.constraints?.max_difficulty_score) {
      markets = markets.filter(
        m => m.difficulty_score <= request.constraints!.max_difficulty_score!
      )
    }

    return markets
  }

  /**
   * 计算各项分数
   */
  private calculateScores(
    market: any,
    request: MarketRecommendationRequest
  ) {
    const productFit = this.calculateProductFitScore(market, request)
    const marketOpportunity = this.calculateMarketOpportunityScore(market)
    const difficultyAdjusted = this.calculateDifficultyAdjustedScore(market)
    const costEfficiency = this.calculateCostEfficiencyScore(market, request)
    const speedToMarket = this.calculateSpeedToMarketScore(market, request)
    const certAdvantage = this.calculateCertificationAdvantageScore(market, request)

    // 根据用户偏好调整权重
    let weights = { ...this.weights }
    if (request.preferences?.prioritize_speed) {
      weights.speed_to_market *= 1.5
      weights.cost_efficiency *= 0.8
    }
    if (request.preferences?.prioritize_cost) {
      weights.cost_efficiency *= 1.5
      weights.speed_to_market *= 0.8
    }
    if (request.preferences?.prioritize_market_size) {
      weights.market_opportunity *= 1.5
    }

    // 归一化权重
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
    weights = Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, v / totalWeight])
    ) as unknown as ScoringWeights

    // 计算综合得分
    const overall =
      productFit * weights.product_fit +
      marketOpportunity * weights.market_opportunity +
      difficultyAdjusted * weights.entry_difficulty +
      costEfficiency * weights.cost_efficiency +
      speedToMarket * weights.speed_to_market +
      certAdvantage * weights.certification_advantage

    return {
      overall: Math.round(overall),
      product_fit: Math.round(productFit),
      market_opportunity: Math.round(marketOpportunity),
      difficulty_adjusted: Math.round(difficultyAdjusted),
      cost_efficiency: Math.round(costEfficiency),
      speed_to_market: Math.round(speedToMarket),
      certification_advantage: Math.round(certAdvantage),
    }
  }

  /**
   * 计算产品适配度分数
   */
  private calculateProductFitScore(
    market: any,
    request: MarketRecommendationRequest
  ): number {
    let score = 70 // 基础分

    const productType = request.product.product_type
    const requirements = getProductTypeRequirements(productType)

    // 检查市场是否支持该产品类型的认证
    const supportedCerts = market.entry_requirements.certification_types
    const requiredCerts = requirements.certifications
    const matchingCerts = requiredCerts.filter(cert =>
      supportedCerts.some((sc: string) =>
        cert.toLowerCase().includes(sc.toLowerCase()) ||
        sc.toLowerCase().includes(cert.toLowerCase())
      )
    )

    score += (matchingCerts.length / requiredCerts.length) * 20

    // PPE类别匹配
    if (request.product.ppe_category) {
      // 高风险产品在所有市场都需要认证，基础分相同
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * 计算市场机会分数
   */
  private calculateMarketOpportunityScore(market: any): number {
    let score = 50

    // 市场规模（30分）
    const marketSize = market.market_size.total_value_usd
    if (marketSize > 10000000000) score += 30 // >$10B
    else if (marketSize > 5000000000) score += 25 // >$5B
    else if (marketSize > 2000000000) score += 20 // >$2B
    else if (marketSize > 1000000000) score += 15 // >$1B
    else score += 10

    // 增长率（20分）
    const growthRate = market.market_size.growth_rate
    if (growthRate > 0.12) score += 20
    else if (growthRate > 0.08) score += 15
    else if (growthRate > 0.05) score += 10
    else score += 5

    // 竞争程度（反向计分，竞争越低分越高）
    if (market.competition_level === 'low') score += 10
    else if (market.competition_level === 'medium') score += 5

    return Math.min(100, score)
  }

  /**
   * 计算难度调整分数
   */
  private calculateDifficultyAdjustedScore(market: any): number {
    // 难度越高，分数越低（反向）
    const difficulty = market.difficulty_score
    return Math.max(0, 100 - difficulty)
  }

  /**
   * 计算成本效率分数
   */
  private calculateCostEfficiencyScore(
    market: any,
    request: MarketRecommendationRequest
  ): number {
    const avgCost = market.estimated_cost.average_usd
    const budget = request.company.budget_constraint?.max_budget_usd

    if (budget) {
      // 有预算限制
      if (avgCost <= budget * 0.5) return 100
      if (avgCost <= budget * 0.8) return 80
      if (avgCost <= budget) return 60
      return 30
    }

    // 无预算限制，按绝对值评分
    if (avgCost < 30000) return 100
    if (avgCost < 60000) return 80
    if (avgCost < 100000) return 60
    if (avgCost < 200000) return 40
    return 20
  }

  /**
   * 计算上市速度分数
   */
  private calculateSpeedToMarketScore(
    market: any,
    request: MarketRecommendationRequest
  ): number {
    const avgTimeline = market.estimated_timeline.average_months
    const urgency = request.company.timeline_constraint?.urgency

    if (urgency === 'critical') {
      if (avgTimeline <= 6) return 100
      if (avgTimeline <= 12) return 70
      return 40
    }

    if (urgency === 'high') {
      if (avgTimeline <= 9) return 100
      if (avgTimeline <= 15) return 70
      return 40
    }

    // 正常情况
    if (avgTimeline <= 6) return 100
    if (avgTimeline <= 12) return 80
    if (avgTimeline <= 18) return 60
    if (avgTimeline <= 24) return 40
    return 20
  }

  /**
   * 计算已有认证优势分数
   */
  private calculateCertificationAdvantageScore(
    market: any,
    request: MarketRecommendationRequest
  ): number {
    const existingCerts = request.company.existing_certifications
    if (!existingCerts || existingCerts.length === 0) return 50

    let advantage = 50

    for (const cert of existingCerts) {
      if (cert.status !== 'active') continue

      // 检查认证是否被目标市场认可
      const reciprocity = getCertificationReciprocity(cert.type)
      if (reciprocity.recognized_by.includes(market.code)) {
        advantage += 15
      }

      // 如果是同一市场已有认证
      if (cert.market === market.code) {
        advantage += 25
      }
    }

    return Math.min(100, advantage)
  }

  /**
   * 生成准入路径
   */
  private generateEntryPath(market: any, request: MarketRecommendationRequest) {
    const productType = request.product.product_type
    const requirements = getProductTypeRequirements(productType)

    // 确定需要的认证
    const requiredCertifications: RequiredCertification[] = []

    for (const certType of requirements.certifications) {
      const certDetail = CERTIFICATION_DETAILS[certType]
      if (certDetail) {
        // 检查是否已有此认证
        const hasCert = request.company.existing_certifications.some(
          c => c.type === certType && c.status === 'active'
        )

        if (!hasCert) {
          requiredCertifications.push({
            type: certType,
            name: certDetail.name,
            mandatory: true,
            estimated_timeline_months: certDetail.estimated_timeline_months,
            estimated_cost_usd: certDetail.estimated_cost_usd,
            prerequisites: certDetail.prerequisites,
            description: certDetail.description,
          })
        }
      }
    }

    // 计算总体时间和成本
    const totalTimeline = requiredCertifications.reduce(
      (sum, cert) => sum + cert.estimated_timeline_months,
      0
    )
    const totalCost = requiredCertifications.reduce(
      (sum, cert) => sum + cert.estimated_cost_usd,
      0
    )

    return {
      primary_path: `${market.name_zh} - ${requirements.certifications.join(' + ')}`,
      alternative_paths: this.generateAlternativePaths(market, request),
      required_certifications: requiredCertifications,
      estimated_timeline_months: Math.max(
        market.estimated_timeline.average_months,
        totalTimeline
      ),
      estimated_cost_usd: Math.max(market.estimated_cost.average_usd, totalCost),
    }
  }

  /**
   * 生成替代路径
   */
  private generateAlternativePaths(market: any, request: MarketRecommendationRequest): string[] {
    const paths: string[] = []

    // 如果有FDA认证，可以利用FDA-to-Health Canada路径
    const hasFDA = request.company.existing_certifications.some(
      c => c.type === 'FDA_510K' && c.status === 'active'
    )
    if (hasFDA && ['CA', 'AU', 'SG'].includes(market.code)) {
      paths.push(`利用已有FDA认证加速${market.name_zh}注册`)
    }

    // 如果有CE认证
    const hasCE = request.company.existing_certifications.some(
      c => c.type === 'CE' && c.status === 'active'
    )
    if (hasCE && ['UK', 'AU', 'SG'].includes(market.code)) {
      paths.push(`利用已有CE认证简化${market.name_zh}流程`)
    }

    return paths
  }

  /**
   * 生成市场建议
   */
  private generateMarketRecommendations(
    market: any,
    request: MarketRecommendationRequest,
    scores: any
  ) {
    const actions: string[] = []
    const risks: string[] = []
    const opportunities: string[] = []

    // 根据分数生成建议
    if (scores.overall >= 80) {
      actions.push('优先考虑进入该市场')
      opportunities.push('市场匹配度高，成功概率大')
    } else if (scores.overall >= 60) {
      actions.push('可作为第二梯队市场考虑')
    } else {
      actions.push('建议充分评估后再决定')
      risks.push('市场匹配度一般，需要更多准备')
    }

    // 根据认证优势生成建议
    if (scores.certification_advantage >= 70) {
      actions.push('利用已有认证优势加速准入')
      opportunities.push('可节省认证成本和时间')
    }

    // 根据难度生成建议
    if (market.difficulty_score > 75) {
      risks.push('准入难度较高，建议寻求专业咨询')
      actions.push('提前准备充分的临床数据和技术文档')
    }

    // 根据成本生成建议
    if (market.estimated_cost.average_usd > 100000) {
      risks.push('准入成本较高，需要充足预算')
      actions.push('考虑分期投入或寻找合作伙伴')
    }

    // 根据时间生成建议
    if (market.estimated_timeline.average_months > 18) {
      risks.push('准入周期较长，需要耐心等待')
      actions.push('提前规划，尽早启动注册流程')
    }

    // 根据竞争生成建议
    if (market.competition_level === 'high') {
      risks.push('市场竞争激烈，需要差异化策略')
      actions.push('重点关注产品创新和品牌建设')
    } else if (market.competition_level === 'low') {
      opportunities.push('市场竞争较少，有机会获得先发优势')
    }

    // 确定优先级
    let priority: 'high' | 'medium' | 'low' = 'medium'
    if (scores.overall >= 80 && market.difficulty_score < 70) {
      priority = 'high'
    } else if (scores.overall < 50 || market.difficulty_score > 85) {
      priority = 'low'
    }

    return {
      priority,
      actions,
      risks,
      opportunities,
    }
  }

  /**
   * 生成比较矩阵
   */
  private generateComparisonMatrix(
    recommendations: MarketRecommendation[]
  ): MarketComparisonMatrix {
    const markets = recommendations.map(r => r.market.name_zh)

    const criteria = [
      {
        name: '综合推荐分',
        weights: 1.0,
        scores: Object.fromEntries(
          recommendations.map(r => [r.market.name_zh, r.recommendation_score])
        ),
      },
      {
        name: '产品适配度',
        weights: 0.8,
        scores: Object.fromEntries(
          recommendations.map(r => [r.market.name_zh, r.match_analysis.product_fit_score])
        ),
      },
      {
        name: '市场机会',
        weights: 0.9,
        scores: Object.fromEntries(
          recommendations.map(r => [r.market.name_zh, r.match_analysis.market_opportunity_score])
        ),
      },
      {
        name: '准入难度',
        weights: 0.7,
        scores: Object.fromEntries(
          recommendations.map(r => [
            r.market.name_zh,
            100 - r.market.difficulty_score, // 反转，难度越低分越高
          ])
        ),
      },
      {
        name: '成本效率',
        weights: 0.6,
        scores: Object.fromEntries(
          recommendations.map(r => [
            r.market.name_zh,
            Math.max(0, 100 - r.entry_path.estimated_cost_usd / 2000),
          ])
        ),
      },
      {
        name: '上市速度',
        weights: 0.7,
        scores: Object.fromEntries(
          recommendations.map(r => [
            r.market.name_zh,
            Math.max(0, 100 - r.entry_path.estimated_timeline_months * 3),
          ])
        ),
      },
    ]

    return {
      markets,
      criteria,
    }
  }

  /**
   * 生成执行建议
   */
  private generateActionPlan(recommendations: MarketRecommendation[]) {
    const top3 = recommendations.slice(0, 3)

    const immediate_actions: string[] = [
      `确定首选目标市场：${top3[0]?.market.name_zh || '待定'}`,
      '准备产品技术文档和质量管理体系文件',
      '评估现有认证是否可加速目标市场准入',
    ]

    const short_term_actions: string[] = [
      ...top3.map(
        r =>
          `启动${r.market.name_zh}市场准入调研，联系当地代理商或咨询公司`
      ),
      '制定详细的认证时间表和预算计划',
      '开始准备认证所需的技术文档和测试报告',
    ]

    const medium_term_actions: string[] = [
      '提交首个市场的认证申请',
      '建立当地代表或寻找合作伙伴',
      '准备产品本地化和标签翻译',
      '制定市场推广策略',
    ]

    return {
      immediate_actions,
      short_term_actions,
      medium_term_actions,
    }
  }

  /**
   * 生成摘要
   */
  private generateSummary(recommendations: MarketRecommendation[]) {
    if (recommendations.length === 0) {
      return {
        top_market: '',
        fastest_entry: '',
        lowest_cost: '',
        best_overall: '',
      }
    }

    const bestOverall = recommendations[0]

    const fastestEntry = [...recommendations].sort(
      (a, b) => a.entry_path.estimated_timeline_months - b.entry_path.estimated_timeline_months
    )[0]

    const lowestCost = [...recommendations].sort(
      (a, b) => a.entry_path.estimated_cost_usd - b.entry_path.estimated_cost_usd
    )[0]

    return {
      top_market: bestOverall.market.name_zh,
      fastest_entry: fastestEntry.market.name_zh,
      lowest_cost: lowestCost.market.name_zh,
      best_overall: bestOverall.market.name_zh,
    }
  }
}

// 导出单例
export const marketRecommendationEngine = new MarketRecommendationEngine()
