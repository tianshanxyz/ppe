/**
 * 价格预测模型 - 成本优化建议
 * 生成认证成本优化策略和建议
 */

import {
  CertificationType,
  ProductCategory,
  MarketRegion,
  CertificationCostPrediction,
  CostOptimizationSuggestion,
  CostPredictionRequest,
} from './types'
import { getCertificationCost, getAllCertificationCostsForMarket } from './cost-data'

/**
 * 认证互认关系映射
 */
const certificationReciprocity: Record<string, string[]> = {
  'fda_510k': ['iso_13485', 'ce_mark'],
  'ce_mark': ['iso_13485'],
  'iso_13485': ['fda_510k', 'ce_mark'],
  'niosh': ['fda_510k'],
}

/**
 * 批量认证折扣规则
 */
const bundlingDiscounts: Record<number, number> = {
  2: 0.05,   // 2个认证：5%折扣
  3: 0.1,    // 3个认证：10%折扣
  4: 0.15,   // 4个认证：15%折扣
  5: 0.2,    // 5个及以上：20%折扣
}

/**
 * 季节性因素（最佳申请时间）
 */
const seasonalFactors: Record<string, { bestMonths: number[]; discount: number }> = {
  'fda_510k': { bestMonths: [1, 2, 9, 10], discount: 0.05 },
  'ce_mark': { bestMonths: [3, 4, 5, 6], discount: 0.08 },
  'iso_13485': { bestMonths: [1, 2, 3, 11, 12], discount: 0.03 },
}

/**
 * 生成时机优化建议
 */
function generateTimingSuggestions(
  requests: CostPredictionRequest[],
  costs: CertificationCostPrediction[]
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = []
  const currentMonth = new Date().getMonth() + 1

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]
    const cost = costs[i]
    const certKey = request.certification_type
    const seasonal = seasonalFactors[certKey]

    if (seasonal && !seasonal.bestMonths.includes(currentMonth)) {
      const nextBestMonth = seasonal.bestMonths.find((m) => m > currentMonth) || seasonal.bestMonths[0]
      const savingsPercent = seasonal.discount * 100
      const savingsAmount = cost.total_cost_typical * seasonal.discount

      suggestions.push({
        suggestion_type: 'timing',
        title: `${certKey.toUpperCase()} 申请时机优化`,
        description: `建议推迟到${nextBestMonth}月申请，此时审核机构工作负荷较低，可能获得更快的审核速度和潜在的咨询费用折扣`,
        potential_savings_percent: Math.round(savingsPercent * 10) / 10,
        potential_savings_amount: Math.round(savingsAmount),
        implementation_difficulty: 'easy',
        time_to_implement: `${nextBestMonth - currentMonth}个月`,
      })
    }
  }

  return suggestions
}

/**
 * 生成分批认证建议
 */
function generateBundlingSuggestions(
  requests: CostPredictionRequest[],
  costs: CertificationCostPrediction[]
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = []

  if (requests.length < 2) return suggestions

  // 按市场分组
  const marketGroups: Record<string, { requests: CostPredictionRequest[]; costs: CertificationCostPrediction[] }> = {}

  for (let i = 0; i < requests.length; i++) {
    const market = requests[i].market_region
    if (!marketGroups[market]) {
      marketGroups[market] = { requests: [], costs: [] }
    }
    marketGroups[market].requests.push(requests[i])
    marketGroups[market].costs.push(costs[i])
  }

  // 为每个市场生成批量建议
  for (const [market, group] of Object.entries(marketGroups)) {
    if (group.requests.length >= 2) {
      const discountRate = bundlingDiscounts[Math.min(group.requests.length, 5)] || 0.2
      const totalCost = group.costs.reduce((sum, c) => sum + c.total_cost_typical, 0)
      const savingsAmount = totalCost * discountRate

      suggestions.push({
        suggestion_type: 'bundling',
        title: `${market.toUpperCase()} 市场批量认证优惠`,
        description: `在${market.toUpperCase()}市场同时申请${group.requests.length}个认证，可享受打包服务折扣。建议寻找提供一站式服务的认证咨询公司`,
        potential_savings_percent: Math.round(discountRate * 100),
        potential_savings_amount: Math.round(savingsAmount),
        implementation_difficulty: 'medium',
        time_to_implement: '1-2周',
      })
    }
  }

  return suggestions
}

/**
 * 生成替代方案建议
 */
function generateAlternativeSuggestions(
  requests: CostPredictionRequest[]
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = []

  for (const request of requests) {
    // FDA PMA 替代建议
    if (request.certification_type === CertificationType.FDA_PMA) {
      suggestions.push({
        suggestion_type: 'alternative',
        title: '考虑FDA 510(k)途径',
        description: '如果产品可以与已上市的同类产品建立实质等效性，考虑通过510(k)途径而非PMA，可显著降低认证成本和时间',
        potential_savings_percent: 60,
        potential_savings_amount: 150000,
        implementation_difficulty: 'medium',
        time_to_implement: '2-4周评估',
      })
    }

    // 多市场策略建议
    if (request.market_region === MarketRegion.US && request.certification_type === CertificationType.FDA_510K) {
      suggestions.push({
        suggestion_type: 'alternative',
        title: '欧盟CE认证优先策略',
        description: '考虑先获得欧盟CE认证，通常成本更低、周期更短。CE认证可作为FDA 510(k)的支持文件，提高通过率',
        potential_savings_percent: 25,
        potential_savings_amount: 8000,
        implementation_difficulty: 'easy',
        time_to_implement: '立即',
      })
    }

    // ISO 13485 建议
    if (request.certification_type !== CertificationType.ISO_13485) {
      const hasISO13485 = requests.some(
        (r) => r.certification_type === CertificationType.ISO_13485
      )
      if (!hasISO13485) {
        suggestions.push({
          suggestion_type: 'alternative',
          title: '优先建立ISO 13485体系',
          description: 'ISO 13485是多数市场准入的基础要求。先建立质量管理体系，可为后续认证节省重复审核成本',
          potential_savings_percent: 15,
          potential_savings_amount: 5000,
          implementation_difficulty: 'hard',
          time_to_implement: '3-6个月',
        })
      }
    }
  }

  return suggestions
}

/**
 * 生成谈判策略建议
 */
function generateNegotiationSuggestions(
  requests: CostPredictionRequest[],
  costs: CertificationCostPrediction[]
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = []

  // 测试费用谈判建议
  const highTestingCosts = costs.filter(
    (c) => c.cost_breakdown.some((item) => item.cost_type === 'testing_fee' && item.typical_cost > 10000)
  )

  if (highTestingCosts.length > 0) {
    suggestions.push({
      suggestion_type: 'negotiation',
      title: '测试实验室价格谈判',
      description: '向多家测试实验室询价，利用竞争关系谈判。考虑与实验室签订长期合作协议获取批量折扣',
      potential_savings_percent: 10,
      potential_savings_amount: Math.round(
        highTestingCosts.reduce((sum, c) => {
          const testingCost = c.cost_breakdown.find((item) => item.cost_type === 'testing_fee')
          return sum + (testingCost?.typical_cost || 0) * 0.1
        }, 0)
      ),
      implementation_difficulty: 'medium',
      time_to_implement: '2-3周',
    })
  }

  // 咨询公司谈判建议
  const hasConsulting = costs.some((c) =>
    c.cost_breakdown.some((item) => item.cost_type === 'consulting_fee')
  )

  if (hasConsulting) {
    suggestions.push({
      suggestion_type: 'negotiation',
      title: '咨询服务费用优化',
      description: '考虑部分工作内部完成（如技术文档初稿），仅外包关键审核环节。或选择按项目计费而非按小时计费',
      potential_savings_percent: 20,
      potential_savings_amount: Math.round(
        costs.reduce((sum, c) => {
          const consultingCost = c.cost_breakdown.find((item) => item.cost_type === 'consulting_fee')
          return sum + (consultingCost?.typical_cost || 0) * 0.2
        }, 0)
      ),
      implementation_difficulty: 'easy',
      time_to_implement: '1周',
    })
  }

  return suggestions
}

/**
 * 生成成本优化建议
 */
export function generateOptimizationSuggestions(
  requests: CostPredictionRequest[],
  costs: CertificationCostPrediction[]
): CostOptimizationSuggestion[] {
  const allSuggestions: CostOptimizationSuggestion[] = [
    ...generateTimingSuggestions(requests, costs),
    ...generateBundlingSuggestions(requests, costs),
    ...generateAlternativeSuggestions(requests),
    ...generateNegotiationSuggestions(requests, costs),
  ]

  // 按潜在节省金额排序
  return allSuggestions.sort((a, b) => b.potential_savings_amount - a.potential_savings_amount)
}

/**
 * 生成认证路径优化方案
 */
export function generateOptimalCertificationPath(
  productCategory: ProductCategory,
  targetMarkets: MarketRegion[],
  budgetConstraint?: number,
  timeConstraint?: number
): {
  recommendedPath: CostPredictionRequest[]
  totalCost: { min: number; max: number; typical: number }
  totalTimeline: { min: number; max: number; typical: number }
  phases: Array<{
    phase: number
    certifications: CostPredictionRequest[]
    estimatedCost: number
    estimatedTimeline: number
  }>
  savings: {
    description: string
    amount: number
  }[]
} {
  const recommendedPath: CostPredictionRequest[] = []
  const phases: Array<{
    phase: number
    certifications: CostPredictionRequest[]
    estimatedCost: number
    estimatedTimeline: number
  }> = []
  const savings: Array<{ description: string; amount: number }> = []

  // 第一阶段：基础认证（ISO 13485）
  const phase1Requests: CostPredictionRequest[] = []
  let phase1Cost = 0

  // 检查是否需要ISO 13485
  const needsISO13485 = targetMarkets.some((m) =>
    [MarketRegion.US, MarketRegion.EU, MarketRegion.CANADA, MarketRegion.AUSTRALIA].includes(m)
  )

  if (needsISO13485) {
    const isoRequest: CostPredictionRequest = {
      certification_type: CertificationType.ISO_13485,
      product_category: productCategory,
      market_region: MarketRegion.US, // ISO 13485是全球通用的
    }
    const isoCost = getCertificationCost(
      CertificationType.ISO_13485,
      productCategory,
      MarketRegion.US
    )
    if (isoCost) {
      phase1Requests.push(isoRequest)
      phase1Cost += isoCost.total_cost_typical
    }
  }

  if (phase1Requests.length > 0) {
    phases.push({
      phase: 1,
      certifications: phase1Requests,
      estimatedCost: phase1Cost,
      estimatedTimeline: 6,
    })
    recommendedPath.push(...phase1Requests)
  }

  // 第二阶段：主要市场准入
  const phase2Requests: CostPredictionRequest[] = []
  let phase2Cost = 0

  for (const market of targetMarkets) {
    let certType: CertificationType | null = null

    switch (market) {
      case MarketRegion.US:
        certType = CertificationType.FDA_510K
        break
      case MarketRegion.EU:
        certType = CertificationType.CE_MARK
        break
      case MarketRegion.CHINA:
        certType = CertificationType.GB_STANDARD
        break
      case MarketRegion.JAPAN:
        certType = CertificationType.JIS
        break
      case MarketRegion.CANADA:
        certType = CertificationType.CSA
        break
      case MarketRegion.AUSTRALIA:
        certType = CertificationType.TGA
        break
      case MarketRegion.BRAZIL:
        certType = CertificationType.ANVISA
        break
    }

    if (certType) {
      const request: CostPredictionRequest = {
        certification_type: certType,
        product_category: productCategory,
        market_region: market,
      }
      const cost = getCertificationCost(certType, productCategory, market)
      if (cost) {
        phase2Requests.push(request)
        phase2Cost += cost.total_cost_typical
      }
    }
  }

  if (phase2Requests.length > 0) {
    // 应用批量折扣
    const discount = bundlingDiscounts[Math.min(phase2Requests.length, 5)] || 0.2
    const discountedCost = phase2Cost * (1 - discount)

    phases.push({
      phase: 2,
      certifications: phase2Requests,
      estimatedCost: Math.round(discountedCost),
      estimatedTimeline: 8,
    })
    recommendedPath.push(...phase2Requests)

    savings.push({
      description: '批量认证折扣',
      amount: Math.round(phase2Cost * discount),
    })
  }

  // 计算总成本和时间
  const totalCost = {
    min: 0,
    max: 0,
    typical: 0,
  }
  const totalTimeline = {
    min: 0,
    max: 0,
    typical: 0,
  }

  for (const request of recommendedPath) {
    const cost = getCertificationCost(
      request.certification_type,
      request.product_category,
      request.market_region
    )
    if (cost) {
      totalCost.min += cost.total_cost_min
      totalCost.max += cost.total_cost_max
      totalCost.typical += cost.total_cost_typical
      totalTimeline.min += cost.timeline_months_min
      totalTimeline.max += cost.timeline_months_max
      totalTimeline.typical += cost.timeline_months_typical
    }
  }

  // 考虑并行处理
  totalTimeline.min = Math.max(...phases.map((p) => p.estimatedTimeline))
  totalTimeline.typical = phases.reduce((sum, p) => sum + p.estimatedTimeline, 0) * 0.6
  totalTimeline.max = phases.reduce((sum, p) => sum + p.estimatedTimeline, 0)

  return {
    recommendedPath,
    totalCost,
    totalTimeline,
    phases,
    savings,
  }
}

/**
 * 计算投资回报率
 */
export function calculateROI(
  certificationCosts: number,
  expectedRevenue: number,
  timelineMonths: number
): {
  roi: number
  paybackPeriod: number
  netProfit: number
  breakEvenUnits: number
  assumptions: string[]
} {
  const netProfit = expectedRevenue - certificationCosts
  const roi = (netProfit / certificationCosts) * 100
  const monthlyProfit = expectedRevenue / Math.max(timelineMonths, 12)
  const paybackPeriod = certificationCosts / monthlyProfit
  const breakEvenUnits = Math.ceil(certificationCosts / (expectedRevenue / 10000)) // 假设10000单位销量

  return {
    roi: Math.round(roi * 100) / 100,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    netProfit: Math.round(netProfit),
    breakEvenUnits,
    assumptions: [
      '基于历史市场数据估算',
      '假设产品定价符合市场平均水平',
      '未考虑汇率波动影响',
      '未考虑市场竞争导致的定价压力',
    ],
  }
}
