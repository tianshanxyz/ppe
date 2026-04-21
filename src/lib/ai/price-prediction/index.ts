/**
 * 价格预测模型 - 主入口模块
 * 提供认证成本预测和市场价格趋势分析功能
 */

import {
  CertificationType,
  ProductCategory,
  MarketRegion,
  PredictionTimeframe,
  CostPredictionRequest,
  PriceTrendRequest,
  BatchCostPredictionRequest,
  CertificationCostPrediction,
  MarketPriceTrend,
  PricePredictionResult,
  CostOptimizationSuggestion,
  PriceMonitorConfig,
  PriceAlert,
  PredictionAccuracyMetrics,
} from './types'

import {
  getCertificationCost,
  getAllCertificationCostsForMarket,
  getAvailableCertificationTypes,
  getAvailableProductCategories,
  getAvailableMarketRegions,
  getCostStatistics,
} from './cost-data'

import {
  getMarketPriceTrend,
  getMultiMarketPriceTrends,
  compareMarketPrices,
  getPriceStatistics,
  getPriceAlertThresholds,
} from './market-data'

import {
  generateOptimizationSuggestions,
  generateOptimalCertificationPath,
  calculateROI,
} from './optimizer'

// 重新导出类型
export * from './types'
export {
  getCertificationCost,
  getAllCertificationCostsForMarket,
  getAvailableCertificationTypes,
  getAvailableProductCategories,
  getAvailableMarketRegions,
  getCostStatistics,
  getMarketPriceTrend,
  getMultiMarketPriceTrends,
  compareMarketPrices,
  getPriceStatistics,
  getPriceAlertThresholds,
  generateOptimizationSuggestions,
  generateOptimalCertificationPath,
  calculateROI,
}

/**
 * 价格预测引擎
 */
export class PricePredictionEngine {
  /**
   * 预测单个认证成本
   */
  predictCertificationCost(request: CostPredictionRequest): CertificationCostPrediction | null {
    return getCertificationCost(
      request.certification_type,
      request.product_category,
      request.market_region,
      {
        productComplexity: request.product_complexity,
        companySize: request.company_size,
        urgencyLevel: request.urgency_level,
      }
    )
  }

  /**
   * 批量预测认证成本
   */
  predictCertificationCosts(requests: CostPredictionRequest[]): CertificationCostPrediction[] {
    return requests
      .map((request) => this.predictCertificationCost(request))
      .filter((cost): cost is CertificationCostPrediction => cost !== null)
  }

  /**
   * 预测市场价格趋势
   */
  predictPriceTrend(request: PriceTrendRequest): MarketPriceTrend | null {
    return getMarketPriceTrend(request.product_category, request.market_region)
  }

  /**
   * 获取完整价格预测结果
   */
  getFullPrediction(
    costRequests: CostPredictionRequest[],
    priceRequests: PriceTrendRequest[]
  ): PricePredictionResult {
    const costPredictions = this.predictCertificationCosts(costRequests)
    const priceTrends = priceRequests
      .map((req) => this.predictPriceTrend(req))
      .filter((trend): trend is MarketPriceTrend => trend !== null)

    const optimizationSuggestions = generateOptimizationSuggestions(costRequests, costPredictions)

    const validDays = 30
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    return {
      cost_predictions: costPredictions,
      price_trends: priceTrends,
      optimization_suggestions: optimizationSuggestions,
      generated_at: new Date().toISOString(),
      valid_until: validUntil.toISOString(),
    }
  }

  /**
   * 获取特定市场的所有认证成本
   */
  getMarketCertificationCosts(
    marketRegion: MarketRegion,
    productCategory: ProductCategory
  ): CertificationCostPrediction[] {
    return getAllCertificationCostsForMarket(marketRegion, productCategory)
  }

  /**
   * 比较多个市场的认证成本
   */
  compareMarketCertificationCosts(
    productCategory: ProductCategory,
    marketRegions: MarketRegion[]
  ): Array<{
    market: MarketRegion
    certifications: CertificationCostPrediction[]
    totalCost: number
    avgTimeline: number
  }> {
    return marketRegions.map((market) => {
      const certifications = this.getMarketCertificationCosts(market, productCategory)
      const totalCost = certifications.reduce((sum, c) => sum + c.total_cost_typical, 0)
      const avgTimeline =
        certifications.length > 0
          ? certifications.reduce((sum, c) => sum + c.timeline_months_typical, 0) /
            certifications.length
          : 0

      return {
        market,
        certifications,
        totalCost,
        avgTimeline: Math.round(avgTimeline * 10) / 10,
      }
    })
  }

  /**
   * 生成成本优化建议
   */
  getOptimizationSuggestions(
    requests: CostPredictionRequest[]
  ): CostOptimizationSuggestion[] {
    const costs = this.predictCertificationCosts(requests)
    return generateOptimizationSuggestions(requests, costs)
  }

  /**
   * 生成最优认证路径
   */
  getOptimalCertificationPath(
    productCategory: ProductCategory,
    targetMarkets: MarketRegion[],
    budgetConstraint?: number,
    timeConstraint?: number
  ) {
    return generateOptimalCertificationPath(
      productCategory,
      targetMarkets,
      budgetConstraint,
      timeConstraint
    )
  }

  /**
   * 计算认证投资回报率
   */
  calculateCertificationROI(
    certificationCosts: number,
    expectedRevenue: number,
    timelineMonths: number
  ) {
    return calculateROI(certificationCosts, expectedRevenue, timelineMonths)
  }

  /**
   * 获取价格预警建议
   */
  getPriceAlertRecommendations(
    productCategory: ProductCategory,
    marketRegion: MarketRegion
  ): { low: number; high: number; current: number } | null {
    return getPriceAlertThresholds(productCategory, marketRegion)
  }

  /**
   * 获取统计数据
   */
  getStatistics(): {
    costStats: ReturnType<typeof getCostStatistics>
    priceStats: ReturnType<typeof getPriceStatistics>
  } {
    return {
      costStats: getCostStatistics(),
      priceStats: getPriceStatistics(),
    }
  }

  /**
   * 获取可用选项
   */
  getAvailableOptions(): {
    certificationTypes: CertificationType[]
    productCategories: ProductCategory[]
    marketRegions: MarketRegion[]
    timeframes: PredictionTimeframe[]
  } {
    return {
      certificationTypes: getAvailableCertificationTypes(),
      productCategories: getAvailableProductCategories(),
      marketRegions: getAvailableMarketRegions(),
      timeframes: Object.values(PredictionTimeframe),
    }
  }
}

/**
 * 默认价格预测引擎实例
 */
export const pricePredictionEngine = new PricePredictionEngine()

/**
 * 便捷函数：预测认证成本
 */
export function predictCost(request: CostPredictionRequest): CertificationCostPrediction | null {
  return pricePredictionEngine.predictCertificationCost(request)
}

/**
 * 便捷函数：批量预测认证成本
 */
export function predictCosts(requests: CostPredictionRequest[]): CertificationCostPrediction[] {
  return pricePredictionEngine.predictCertificationCosts(requests)
}

/**
 * 便捷函数：预测价格趋势
 */
export function predictTrend(request: PriceTrendRequest): MarketPriceTrend | null {
  return pricePredictionEngine.predictPriceTrend(request)
}

/**
 * 便捷函数：获取完整预测
 */
export function getPrediction(
  costRequests: CostPredictionRequest[],
  priceRequests: PriceTrendRequest[]
): PricePredictionResult {
  return pricePredictionEngine.getFullPrediction(costRequests, priceRequests)
}

/**
 * 便捷函数：获取优化建议
 */
export function getOptimization(
  requests: CostPredictionRequest[]
): CostOptimizationSuggestion[] {
  return pricePredictionEngine.getOptimizationSuggestions(requests)
}

/**
 * 便捷函数：获取最优路径
 */
export function getOptimalPath(
  productCategory: ProductCategory,
  targetMarkets: MarketRegion[]
) {
  return pricePredictionEngine.getOptimalCertificationPath(productCategory, targetMarkets)
}
