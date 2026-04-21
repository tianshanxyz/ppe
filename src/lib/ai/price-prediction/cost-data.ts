/**
 * 价格预测模型 - 认证成本数据
 * 基于行业基准数据的认证成本数据库
 */

import {
  CertificationType,
  ProductCategory,
  MarketRegion,
  CostType,
  CertificationCostPrediction,
  CertificationCostItem,
} from './types'

/**
 * 基础认证成本数据
 * 基于2024-2025年行业基准数据
 */
const baseCostDatabase: Record<string, Partial<CertificationCostPrediction>> = {
  // FDA 510(k) - 美国
  'fda_510k_respiratory_us': {
    total_cost_min: 15000,
    total_cost_max: 75000,
    total_cost_typical: 35000,
    timeline_months_min: 3,
    timeline_months_max: 12,
    timeline_months_typical: 6,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 3500, max_cost: 3500, typical_cost: 3500, currency: 'USD', notes: 'FDA申请费（2025年标准）' },
      { cost_type: CostType.TESTING_FEE, min_cost: 8000, max_cost: 40000, typical_cost: 18000, currency: 'USD', notes: '生物相容性、性能测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 3000, max_cost: 25000, typical_cost: 10000, currency: 'USD', notes: '510(k)文档准备' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 6500, typical_cost: 3500, currency: 'USD', notes: '年度注册费' },
    ],
  },
  'fda_510k_hand_protection_us': {
    total_cost_min: 10000,
    total_cost_max: 45000,
    total_cost_typical: 22000,
    timeline_months_min: 2,
    timeline_months_max: 8,
    timeline_months_typical: 4,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 3500, max_cost: 3500, typical_cost: 3500, currency: 'USD', notes: 'FDA申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 3000, max_cost: 20000, typical_cost: 8000, currency: 'USD', notes: '化学抗性、物理性能测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 2000, max_cost: 15000, typical_cost: 6000, currency: 'USD', notes: '技术文档准备' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 6500, typical_cost: 2500, currency: 'USD', notes: '年度注册费' },
    ],
  },
  'fda_510k_eye_protection_us': {
    total_cost_min: 12000,
    total_cost_max: 50000,
    total_cost_typical: 25000,
    timeline_months_min: 2,
    timeline_months_max: 10,
    timeline_months_typical: 5,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 3500, max_cost: 3500, typical_cost: 3500, currency: 'USD', notes: 'FDA申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 5000, max_cost: 25000, typical_cost: 12000, currency: 'USD', notes: '冲击测试、光学测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 2500, max_cost: 15000, typical_cost: 7000, currency: 'USD', notes: '510(k)文档' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 6500, typical_cost: 2500, currency: 'USD', notes: '年度注册费' },
    ],
  },
  'fda_510k_body_protection_us': {
    total_cost_min: 15000,
    total_cost_max: 60000,
    total_cost_typical: 30000,
    timeline_months_min: 3,
    timeline_months_max: 10,
    timeline_months_typical: 6,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 3500, max_cost: 3500, typical_cost: 3500, currency: 'USD', notes: 'FDA申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 8000, max_cost: 35000, typical_cost: 15000, currency: 'USD', notes: '生物相容性、防护性能' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 3000, max_cost: 18000, typical_cost: 8000, currency: 'USD', notes: '技术文档' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 6500, typical_cost: 3000, currency: 'USD', notes: '年度注册费' },
    ],
  },

  // CE Mark - 欧盟
  'ce_mark_respiratory_eu': {
    total_cost_min: 8000,
    total_cost_max: 45000,
    total_cost_typical: 20000,
    timeline_months_min: 2,
    timeline_months_max: 8,
    timeline_months_typical: 4,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 3000, max_cost: 15000, typical_cost: 6000, currency: 'USD', notes: '公告机构审核费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 3000, max_cost: 20000, typical_cost: 10000, currency: 'USD', notes: 'EN标准测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 1000, max_cost: 8000, typical_cost: 3000, currency: 'USD', notes: '技术文件准备' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 1000, max_cost: 2000, typical_cost: 1000, currency: 'USD', notes: '年度监督审核' },
    ],
  },
  'ce_mark_hand_protection_eu': {
    total_cost_min: 5000,
    total_cost_max: 25000,
    total_cost_typical: 12000,
    timeline_months_min: 1,
    timeline_months_max: 6,
    timeline_months_typical: 3,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 2000, max_cost: 10000, typical_cost: 4000, currency: 'USD', notes: '公告机构审核' },
      { cost_type: CostType.TESTING_FEE, min_cost: 2000, max_cost: 12000, typical_cost: 6000, currency: 'USD', notes: 'EN 388, EN 374测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 500, max_cost: 2000, typical_cost: 1500, currency: 'USD', notes: '技术文件' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 1000, typical_cost: 500, currency: 'USD', notes: '年度监督' },
    ],
  },
  'ce_mark_eye_protection_eu': {
    total_cost_min: 6000,
    total_cost_max: 30000,
    total_cost_typical: 15000,
    timeline_months_min: 2,
    timeline_months_max: 6,
    timeline_months_typical: 4,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 2500, max_cost: 12000, typical_cost: 5000, currency: 'USD', notes: '公告机构审核' },
      { cost_type: CostType.TESTING_FEE, min_cost: 2500, max_cost: 15000, typical_cost: 8000, currency: 'USD', notes: 'EN 166测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 500, max_cost: 2500, typical_cost: 1500, currency: 'USD', notes: '技术文件' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 500, max_cost: 1000, typical_cost: 500, currency: 'USD', notes: '年度监督' },
    ],
  },
  'ce_mark_body_protection_eu': {
    total_cost_min: 8000,
    total_cost_max: 35000,
    total_cost_typical: 18000,
    timeline_months_min: 2,
    timeline_months_max: 8,
    timeline_months_typical: 5,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 3000, max_cost: 12000, typical_cost: 5500, currency: 'USD', notes: '公告机构审核' },
      { cost_type: CostType.TESTING_FEE, min_cost: 3000, max_cost: 18000, typical_cost: 10000, currency: 'USD', notes: 'EN标准测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 1000, max_cost: 4000, typical_cost: 2000, currency: 'USD', notes: '技术文件' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 1000, max_cost: 1000, typical_cost: 500, currency: 'USD', notes: '年度监督' },
    ],
  },

  // ISO 13485 - 全球
  'iso_13485_respiratory_us': {
    total_cost_min: 15000,
    total_cost_max: 50000,
    total_cost_typical: 28000,
    timeline_months_min: 3,
    timeline_months_max: 12,
    timeline_months_typical: 6,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 8000, max_cost: 25000, typical_cost: 15000, currency: 'USD', notes: '第一阶段+第二阶段审核' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 5000, max_cost: 20000, typical_cost: 10000, currency: 'USD', notes: '体系建立咨询' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 2000, max_cost: 5000, typical_cost: 3000, currency: 'USD', notes: '年度监督审核' },
    ],
  },
  'iso_13485_hand_protection_us': {
    total_cost_min: 12000,
    total_cost_max: 40000,
    total_cost_typical: 22000,
    timeline_months_min: 2,
    timeline_months_max: 10,
    timeline_months_typical: 5,
    cost_breakdown: [
      { cost_type: CostType.AUDIT_FEE, min_cost: 6000, max_cost: 20000, typical_cost: 12000, currency: 'USD', notes: '审核费' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 4000, max_cost: 15000, typical_cost: 8000, currency: 'USD', notes: '体系咨询' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 2000, max_cost: 5000, typical_cost: 2000, currency: 'USD', notes: '年度监督' },
    ],
  },

  // NIOSH - 美国
  'niosh_respiratory_us': {
    total_cost_min: 25000,
    total_cost_max: 100000,
    total_cost_typical: 50000,
    timeline_months_min: 6,
    timeline_months_max: 18,
    timeline_months_typical: 12,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 0, max_cost: 0, typical_cost: 0, currency: 'USD', notes: 'NIOSH申请免费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 20000, max_cost: 80000, typical_cost: 40000, currency: 'USD', notes: 'NPPTL测试费' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 5000, max_cost: 20000, typical_cost: 10000, currency: 'USD', notes: '申请文档准备' },
      { cost_type: CostType.ANNUAL_FEE, min_cost: 0, max_cost: 0, typical_cost: 0, currency: 'USD', notes: '无年费' },
    ],
  },

  // 中国GB标准
  'gb_standard_respiratory_china': {
    total_cost_min: 30000,
    total_cost_max: 120000,
    total_cost_typical: 60000,
    timeline_months_min: 4,
    timeline_months_max: 12,
    timeline_months_typical: 8,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 5000, max_cost: 10000, typical_cost: 8000, currency: 'CNY', notes: '申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 20000, max_cost: 80000, typical_cost: 40000, currency: 'CNY', notes: '检测机构测试费' },
      { cost_type: CostType.AUDIT_FEE, min_cost: 5000, max_cost: 20000, typical_cost: 10000, currency: 'CNY', notes: '工厂审核' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 0, max_cost: 10000, typical_cost: 2000, currency: 'CNY', notes: '咨询服务（可选）' },
    ],
  },
  'gb_standard_hand_protection_china': {
    total_cost_min: 20000,
    total_cost_max: 80000,
    total_cost_typical: 40000,
    timeline_months_min: 3,
    timeline_months_max: 8,
    timeline_months_typical: 5,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 3000, max_cost: 8000, typical_cost: 5000, currency: 'CNY', notes: '申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 15000, max_cost: 60000, typical_cost: 30000, currency: 'CNY', notes: '测试费' },
      { cost_type: CostType.AUDIT_FEE, min_cost: 2000, max_cost: 10000, typical_cost: 5000, currency: 'CNY', notes: '工厂审核' },
    ],
  },

  // 日本JIS
  'jis_respiratory_japan': {
    total_cost_min: 800000,
    total_cost_max: 2500000,
    total_cost_typical: 1500000,
    timeline_months_min: 4,
    timeline_months_max: 12,
    timeline_months_typical: 8,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 100000, max_cost: 200000, typical_cost: 150000, currency: 'JPY', notes: '申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 500000, max_cost: 1800000, typical_cost: 1000000, currency: 'JPY', notes: '测试费' },
      { cost_type: CostType.AUDIT_FEE, min_cost: 200000, max_cost: 500000, typical_cost: 350000, currency: 'JPY', notes: '审核费' },
    ],
  },

  // 加拿大CSA
  'csa_respiratory_canada': {
    total_cost_min: 12000,
    total_cost_max: 45000,
    total_cost_typical: 25000,
    timeline_months_min: 3,
    timeline_months_max: 10,
    timeline_months_typical: 6,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 2000, max_cost: 5000, typical_cost: 3500, currency: 'CAD', notes: '申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 8000, max_cost: 35000, typical_cost: 18000, currency: 'CAD', notes: 'CSA测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 2000, max_cost: 6000, typical_cost: 3500, currency: 'CAD', notes: '文档准备' },
    ],
  },

  // 澳大利亚TGA
  'tga_respiratory_australia': {
    total_cost_min: 15000,
    total_cost_max: 60000,
    total_cost_typical: 32000,
    timeline_months_min: 4,
    timeline_months_max: 12,
    timeline_months_typical: 8,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 1000, max_cost: 4000, typical_cost: 2500, currency: 'AUD', notes: 'TGA申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 10000, max_cost: 50000, typical_cost: 25000, currency: 'AUD', notes: '测试费' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 4000, max_cost: 10000, typical_cost: 4500, currency: 'AUD', notes: 'ARTG申请咨询' },
    ],
  },

  // 巴西ANVISA
  'anvisa_respiratory_brazil': {
    total_cost_min: 25000,
    total_cost_max: 100000,
    total_cost_typical: 50000,
    timeline_months_min: 6,
    timeline_months_max: 18,
    timeline_months_typical: 12,
    cost_breakdown: [
      { cost_type: CostType.APPLICATION_FEE, min_cost: 5000, max_cost: 15000, typical_cost: 8000, currency: 'BRL', notes: 'ANVISA申请费' },
      { cost_type: CostType.TESTING_FEE, min_cost: 15000, max_cost: 70000, typical_cost: 35000, currency: 'BRL', notes: 'INMETRO测试' },
      { cost_type: CostType.CONSULTING_FEE, min_cost: 5000, max_cost: 15000, typical_cost: 7000, currency: 'BRL', notes: 'BGMP咨询' },
    ],
  },
}

/**
 * 复杂度调整因子
 */
const complexityFactors: Record<string, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.5,
}

/**
 * 企业规模调整因子
 */
const companySizeFactors: Record<string, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.1,
}

/**
 * 紧急程度调整因子
 */
const urgencyFactors: Record<string, number> = {
  normal: 1.0,
  urgent: 1.3,
  emergency: 1.8,
}

/**
 * 生成成本数据键
 */
function generateCostKey(
  certificationType: CertificationType,
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): string {
  return `${certificationType}_${productCategory}_${marketRegion}`
}

/**
 * 获取认证成本数据
 */
export function getCertificationCost(
  certificationType: CertificationType,
  productCategory: ProductCategory,
  marketRegion: MarketRegion,
  options?: {
    productComplexity?: 'low' | 'medium' | 'high'
    companySize?: 'small' | 'medium' | 'large'
    urgencyLevel?: 'normal' | 'urgent' | 'emergency'
  }
): CertificationCostPrediction | null {
  const key = generateCostKey(certificationType, productCategory, marketRegion)
  const baseData = baseCostDatabase[key]

  if (!baseData) {
    // 如果没有精确匹配，尝试使用通用数据
    const genericKey = `${certificationType}_${ProductCategory.RESPIRATORY}_${marketRegion}`
    const genericData = baseCostDatabase[genericKey]
    if (!genericData) return null
    
    // 根据产品类别调整
    return adjustCostByCategory(genericData as CertificationCostPrediction, productCategory, options)
  }

  // 应用调整因子
  let adjustedData = { ...baseData } as CertificationCostPrediction

  // 复杂度调整
  if (options?.productComplexity) {
    const factor = complexityFactors[options.productComplexity]
    adjustedData = applyCostFactor(adjustedData, factor)
    adjustedData.timeline_months_min *= options.productComplexity === 'high' ? 1.5 : options.productComplexity === 'low' ? 0.7 : 1
    adjustedData.timeline_months_max *= options.productComplexity === 'high' ? 1.5 : options.productComplexity === 'low' ? 0.7 : 1
    adjustedData.timeline_months_typical *= options.productComplexity === 'high' ? 1.5 : options.productComplexity === 'low' ? 0.7 : 1
  }

  // 企业规模调整
  if (options?.companySize) {
    const factor = companySizeFactors[options.companySize]
    adjustedData = applyCostFactor(adjustedData, factor)
  }

  // 紧急程度调整
  if (options?.urgencyLevel) {
    const factor = urgencyFactors[options.urgencyLevel]
    adjustedData = applyCostFactor(adjustedData, factor)
    adjustedData.timeline_months_min /= options.urgencyLevel === 'emergency' ? 1.5 : options.urgencyLevel === 'urgent' ? 1.2 : 1
    adjustedData.timeline_months_max /= options.urgencyLevel === 'emergency' ? 1.5 : options.urgencyLevel === 'urgent' ? 1.2 : 1
    adjustedData.timeline_months_typical /= options.urgencyLevel === 'emergency' ? 1.5 : options.urgencyLevel === 'urgent' ? 1.2 : 1
  }

  // 设置元数据
  adjustedData.certification_type = certificationType
  adjustedData.product_category = productCategory
  adjustedData.market_region = marketRegion
  adjustedData.confidence_score = calculateConfidenceScore(certificationType, productCategory, marketRegion)
  adjustedData.last_updated = new Date().toISOString()

  return adjustedData
}

/**
 * 应用成本因子
 */
function applyCostFactor(
  data: CertificationCostPrediction,
  factor: number
): CertificationCostPrediction {
  return {
    ...data,
    total_cost_min: Math.round(data.total_cost_min * factor),
    total_cost_max: Math.round(data.total_cost_max * factor),
    total_cost_typical: Math.round(data.total_cost_typical * factor),
    cost_breakdown: data.cost_breakdown.map((item) => ({
      ...item,
      min_cost: Math.round(item.min_cost * factor),
      max_cost: Math.round(item.max_cost * factor),
      typical_cost: Math.round(item.typical_cost * factor),
    })),
  }
}

/**
 * 根据产品类别调整成本
 */
function adjustCostByCategory(
  baseData: CertificationCostPrediction,
  targetCategory: ProductCategory,
  options?: {
    productComplexity?: 'low' | 'medium' | 'high'
    companySize?: 'small' | 'medium' | 'large'
    urgencyLevel?: 'normal' | 'urgent' | 'emergency'
  }
): CertificationCostPrediction {
  // 产品类别复杂度系数
  const categoryComplexity: Record<ProductCategory, number> = {
    [ProductCategory.RESPIRATORY]: 1.0,
    [ProductCategory.HAND_PROTECTION]: 0.6,
    [ProductCategory.EYE_PROTECTION]: 0.7,
    [ProductCategory.BODY_PROTECTION]: 0.85,
    [ProductCategory.HEAD_PROTECTION]: 0.65,
    [ProductCategory.FOOT_PROTECTION]: 0.6,
    [ProductCategory.HEARING_PROTECTION]: 0.55,
    [ProductCategory.FALL_PROTECTION]: 0.9,
  }

  const factor = categoryComplexity[targetCategory] || 1.0
  let adjusted = applyCostFactor(baseData, factor)

  // 应用其他选项
  if (options?.productComplexity) {
    adjusted = applyCostFactor(adjusted, complexityFactors[options.productComplexity])
  }
  if (options?.companySize) {
    adjusted = applyCostFactor(adjusted, companySizeFactors[options.companySize])
  }
  if (options?.urgencyLevel) {
    adjusted = applyCostFactor(adjusted, urgencyFactors[options.urgencyLevel])
  }

  adjusted.product_category = targetCategory
  adjusted.confidence_score = calculateConfidenceScore(
    baseData.certification_type,
    targetCategory,
    baseData.market_region
  ) * 0.9 // 通用数据置信度稍低
  adjusted.last_updated = new Date().toISOString()

  return adjusted
}

/**
 * 计算置信度分数
 */
function calculateConfidenceScore(
  certificationType: CertificationType,
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): number {
  const key = generateCostKey(certificationType, productCategory, marketRegion)
  const hasExactData = baseCostDatabase[key] !== undefined

  if (hasExactData) {
    return 0.92 // 精确匹配数据
  }

  // 检查是否有同认证类型+市场的数据
  const hasCertMarketData = Object.keys(baseCostDatabase).some(
    (k) => k.startsWith(`${certificationType}_`) && k.endsWith(`_${marketRegion}`)
  )

  if (hasCertMarketData) {
    return 0.78 // 基于同类产品推算
  }

  return 0.65 // 基于通用基准估算
}

/**
 * 获取所有可用的认证类型
 */
export function getAvailableCertificationTypes(): CertificationType[] {
  return Object.values(CertificationType)
}

/**
 * 获取所有可用的产品类别
 */
export function getAvailableProductCategories(): ProductCategory[] {
  return Object.values(ProductCategory)
}

/**
 * 获取所有可用的市场区域
 */
export function getAvailableMarketRegions(): MarketRegion[] {
  return Object.values(MarketRegion)
}

/**
 * 获取特定市场的所有认证成本
 */
export function getAllCertificationCostsForMarket(
  marketRegion: MarketRegion,
  productCategory: ProductCategory
): CertificationCostPrediction[] {
  const results: CertificationCostPrediction[] = []

  for (const certType of getAvailableCertificationTypes()) {
    const cost = getCertificationCost(certType, productCategory, marketRegion)
    if (cost) {
      results.push(cost)
    }
  }

  return results.sort((a, b) => a.total_cost_typical - b.total_cost_typical)
}

/**
 * 获取成本统计信息
 */
export function getCostStatistics(): {
  totalDataPoints: number
  coverageByCertification: Record<string, number>
  coverageByMarket: Record<string, number>
  averageCostRange: { min: number; max: number; typical: number }
} {
  const allCosts = Object.values(baseCostDatabase)
  const totalDataPoints = allCosts.length

  // 按认证类型统计
  const coverageByCertification: Record<string, number> = {}
  for (const key of Object.keys(baseCostDatabase)) {
    const certType = key.split('_')[0]
    coverageByCertification[certType] = (coverageByCertification[certType] || 0) + 1
  }

  // 按市场统计
  const coverageByMarket: Record<string, number> = {}
  for (const key of Object.keys(baseCostDatabase)) {
    const market = key.split('_').pop() || 'unknown'
    coverageByMarket[market] = (coverageByMarket[market] || 0) + 1
  }

  // 平均成本范围
  const validCosts = allCosts.filter((c) => c.total_cost_typical)
  const avgMin = validCosts.reduce((sum, c) => sum + (c.total_cost_min || 0), 0) / validCosts.length
  const avgMax = validCosts.reduce((sum, c) => sum + (c.total_cost_max || 0), 0) / validCosts.length
  const avgTypical = validCosts.reduce((sum, c) => sum + (c.total_cost_typical || 0), 0) / validCosts.length

  return {
    totalDataPoints,
    coverageByCertification,
    coverageByMarket,
    averageCostRange: {
      min: Math.round(avgMin),
      max: Math.round(avgMax),
      typical: Math.round(avgTypical),
    },
  }
}
