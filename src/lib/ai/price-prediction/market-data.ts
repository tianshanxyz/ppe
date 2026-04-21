/**
 * 价格预测模型 - 市场价格数据
 * 模拟历史价格数据和趋势分析
 */

import {
  ProductCategory,
  MarketRegion,
  PriceTrend,
  PredictionTimeframe,
  MarketPriceTrend,
  PriceDataPoint,
  PriceForecast,
  PriceFactor,
} from './types'

/**
 * 生成模拟历史价格数据
 */
function generateHistoricalData(
  basePrice: number,
  days: number,
  volatility: number,
  trend: number
): PriceDataPoint[] {
  const data: PriceDataPoint[] = []
  let currentPrice = basePrice
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // 添加随机波动和趋势
    const randomChange = (Math.random() - 0.5) * volatility * basePrice
    const trendChange = trend * basePrice * (days - i) / days
    currentPrice = basePrice + randomChange + trendChange

    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 10000) + 1000,
    })
  }

  return data
}

/**
 * 基础市场价格配置
 */
const baseMarketPrices: Record<string, { price: number; unit: string; volatility: number }> = {
  // 呼吸防护 - 美国
  'respiratory_us': { price: 2.5, unit: 'USD/unit', volatility: 0.15 },
  // 呼吸防护 - 欧盟
  'respiratory_eu': { price: 2.2, unit: 'EUR/unit', volatility: 0.12 },
  // 呼吸防护 - 中国
  'respiratory_china': { price: 12, unit: 'CNY/unit', volatility: 0.18 },
  // 手部防护 - 美国
  'hand_protection_us': { price: 0.35, unit: 'USD/pair', volatility: 0.08 },
  // 手部防护 - 欧盟
  'hand_protection_eu': { price: 0.32, unit: 'EUR/pair', volatility: 0.07 },
  // 眼部防护 - 美国
  'eye_protection_us': { price: 4.5, unit: 'USD/unit', volatility: 0.1 },
  // 身体防护 - 美国
  'body_protection_us': { price: 15, unit: 'USD/unit', volatility: 0.12 },
  // 头部防护 - 美国
  'head_protection_us': { price: 8, unit: 'USD/unit', volatility: 0.09 },
  // 足部防护 - 美国
  'foot_protection_us': { price: 45, unit: 'USD/pair', volatility: 0.11 },
  // 听力防护 - 美国
  'hearing_protection_us': { price: 1.2, unit: 'USD/pair', volatility: 0.06 },
  // 坠落防护 - 美国
  'fall_protection_us': { price: 120, unit: 'USD/unit', volatility: 0.14 },
}

/**
 * 获取基础价格配置
 */
function getBasePriceConfig(
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): { price: number; unit: string; volatility: number } | null {
  const key = `${productCategory}_${marketRegion}`
  return baseMarketPrices[key] || baseMarketPrices[`${ProductCategory.RESPIRATORY}_${marketRegion}`] || null
}

/**
 * 分析价格趋势
 */
function analyzeTrend(historicalData: PriceDataPoint[]): {
  trend: PriceTrend
  strength: number
  change30d: number
  change90d: number
  change1y: number
} {
  if (historicalData.length < 30) {
    return {
      trend: PriceTrend.STABLE,
      strength: 0.3,
      change30d: 0,
      change90d: 0,
      change1y: 0,
    }
  }

  const current = historicalData[historicalData.length - 1].price
  const price30d = historicalData[Math.max(0, historicalData.length - 30)].price
  const price90d = historicalData[Math.max(0, historicalData.length - 90)].price
  const price1y = historicalData[0].price

  const change30d = ((current - price30d) / price30d) * 100
  const change90d = ((current - price90d) / price90d) * 100
  const change1y = ((current - price1y) / price1y) * 100

  // 计算趋势强度和方向
  const avgChange = (change30d + change90d / 3 + change1y / 12) / 3
  const volatility = Math.abs(change30d) + Math.abs(change90d) / 3

  let trend: PriceTrend
  let strength: number

  if (volatility > 15) {
    trend = PriceTrend.VOLATILE
    strength = Math.min(volatility / 30, 1)
  } else if (avgChange > 5) {
    trend = PriceTrend.INCREASING
    strength = Math.min(Math.abs(avgChange) / 20, 1)
  } else if (avgChange < -5) {
    trend = PriceTrend.DECREASING
    strength = Math.min(Math.abs(avgChange) / 20, 1)
  } else {
    trend = PriceTrend.STABLE
    strength = 1 - Math.min(Math.abs(avgChange) / 10, 1)
  }

  return {
    trend,
    strength,
    change30d: Math.round(change30d * 100) / 100,
    change90d: Math.round(change90d * 100) / 100,
    change1y: Math.round(change1y * 100) / 100,
  }
}

/**
 * 生成价格影响因素
 */
function generatePriceFactors(
  productCategory: ProductCategory,
  marketRegion: MarketRegion,
  trend: PriceTrend
): PriceFactor[] {
  const factors: PriceFactor[] = []

  // 原材料成本因素
  factors.push({
    factor_name: '原材料成本',
    impact_direction: trend === PriceTrend.INCREASING ? 'positive' : trend === PriceTrend.DECREASING ? 'negative' : 'neutral',
    impact_weight: 0.35,
    description: '石油基原材料价格波动对PPE生产成本的影响',
  })

  // 供应链因素
  factors.push({
    factor_name: '供应链稳定性',
    impact_direction: Math.random() > 0.5 ? 'positive' : 'negative',
    impact_weight: 0.25,
    description: '全球物流和供应链中断风险',
  })

  // 法规因素
  factors.push({
    factor_name: '法规变更',
    impact_direction: 'neutral',
    impact_weight: 0.2,
    description: '新法规实施对合规成本的影响',
  })

  // 市场需求
  factors.push({
    factor_name: '市场需求',
    impact_direction: trend === PriceTrend.INCREASING ? 'positive' : 'negative',
    impact_weight: 0.15,
    description: '终端市场需求变化',
  })

  // 汇率因素（非美国市场）
  if (marketRegion !== MarketRegion.US) {
    factors.push({
      factor_name: '汇率波动',
      impact_direction: Math.random() > 0.5 ? 'positive' : 'negative',
      impact_weight: 0.05,
      description: '美元兑本地货币汇率变化',
    })
  }

  return factors
}

/**
 * 生成价格预测
 */
function generatePriceForecast(
  currentPrice: number,
  historicalData: PriceDataPoint[],
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): PriceForecast[] {
  const { trend, strength } = analyzeTrend(historicalData)
  const factors = generatePriceFactors(productCategory, marketRegion, trend)

  const forecasts: PriceForecast[] = []

  // 短期预测 (1-3个月)
  const shortTermChange = trend === PriceTrend.INCREASING ? 0.03 : trend === PriceTrend.DECREASING ? -0.02 : 0.01
  const shortTermPrice = currentPrice * (1 + shortTermChange)
  forecasts.push({
    timeframe: PredictionTimeframe.SHORT_TERM,
    predicted_price: Math.round(shortTermPrice * 100) / 100,
    confidence_interval_low: Math.round(shortTermPrice * 0.95 * 100) / 100,
    confidence_interval_high: Math.round(shortTermPrice * 1.05 * 100) / 100,
    confidence_score: 0.85,
    factors,
  })

  // 中期预测 (3-12个月)
  const mediumTermChange = trend === PriceTrend.INCREASING ? 0.08 : trend === PriceTrend.DECREASING ? -0.05 : 0.02
  const mediumTermPrice = currentPrice * (1 + mediumTermChange)
  forecasts.push({
    timeframe: PredictionTimeframe.MEDIUM_TERM,
    predicted_price: Math.round(mediumTermPrice * 100) / 100,
    confidence_interval_low: Math.round(mediumTermPrice * 0.88 * 100) / 100,
    confidence_interval_high: Math.round(mediumTermPrice * 1.12 * 100) / 100,
    confidence_score: 0.72,
    factors,
  })

  // 长期预测 (1-3年)
  const longTermChange = trend === PriceTrend.INCREASING ? 0.15 : trend === PriceTrend.DECREASING ? -0.08 : 0.05
  const longTermPrice = currentPrice * (1 + longTermChange)
  forecasts.push({
    timeframe: PredictionTimeframe.LONG_TERM,
    predicted_price: Math.round(longTermPrice * 100) / 100,
    confidence_interval_low: Math.round(longTermPrice * 0.75 * 100) / 100,
    confidence_interval_high: Math.round(longTermPrice * 1.25 * 100) / 100,
    confidence_score: 0.55,
    factors,
  })

  return forecasts
}

/**
 * 获取市场价格趋势
 */
export function getMarketPriceTrend(
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): MarketPriceTrend | null {
  const config = getBasePriceConfig(productCategory, marketRegion)
  if (!config) return null

  // 生成365天历史数据
  const trendDirection = Math.random() > 0.6 ? 0.0002 : Math.random() > 0.4 ? -0.0001 : 0
  const historicalData = generateHistoricalData(config.price, 365, config.volatility, trendDirection)

  const currentPrice = historicalData[historicalData.length - 1].price
  const trendAnalysis = analyzeTrend(historicalData)
  const forecast = generatePriceForecast(currentPrice, historicalData, productCategory, marketRegion)

  return {
    product_category: productCategory,
    market_region: marketRegion,
    current_price: Math.round(currentPrice * 100) / 100,
    price_unit: config.unit,
    trend: trendAnalysis.trend,
    trend_strength: Math.round(trendAnalysis.strength * 100) / 100,
    change_percent_30d: trendAnalysis.change30d,
    change_percent_90d: trendAnalysis.change90d,
    change_percent_1y: trendAnalysis.change1y,
    historical_data: historicalData.slice(-90), // 只返回最近90天
    forecast,
  }
}

/**
 * 获取多个市场的价格趋势
 */
export function getMultiMarketPriceTrends(
  productCategory: ProductCategory,
  marketRegions: MarketRegion[]
): MarketPriceTrend[] {
  return marketRegions
    .map((region) => getMarketPriceTrend(productCategory, region))
    .filter((trend): trend is MarketPriceTrend => trend !== null)
}

/**
 * 比较不同市场的价格
 */
export function compareMarketPrices(
  productCategory: ProductCategory,
  baseMarket: MarketRegion,
  compareMarkets: MarketRegion[]
): {
  baseMarket: MarketPriceTrend | null
  comparisons: Array<{
    market: MarketRegion
    priceDiff: number
    priceDiffPercent: number
    trend: PriceTrend
  }>
} {
  const baseTrend = getMarketPriceTrend(productCategory, baseMarket)
  if (!baseTrend) return { baseMarket: null, comparisons: [] }

  const comparisons = compareMarkets
    .map((market) => {
      const trend = getMarketPriceTrend(productCategory, market)
      if (!trend) return null

      const priceDiff = trend.current_price - baseTrend.current_price
      const priceDiffPercent = (priceDiff / baseTrend.current_price) * 100

      return {
        market,
        priceDiff: Math.round(priceDiff * 100) / 100,
        priceDiffPercent: Math.round(priceDiffPercent * 100) / 100,
        trend: trend.trend,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return { baseMarket: baseTrend, comparisons }
}

/**
 * 获取价格统计信息
 */
export function getPriceStatistics(): {
  totalMarkets: number
  categoriesCovered: number
  avgPriceRange: { min: number; max: number }
  mostVolatileCategory: ProductCategory | null
  mostStableCategory: ProductCategory | null
} {
  const allTrends: MarketPriceTrend[] = []

  // 收集所有可用的价格趋势数据
  for (const category of Object.values(ProductCategory)) {
    for (const region of [MarketRegion.US, MarketRegion.EU, MarketRegion.CHINA]) {
      const trend = getMarketPriceTrend(category, region)
      if (trend) allTrends.push(trend)
    }
  }

  if (allTrends.length === 0) {
    return {
      totalMarkets: 0,
      categoriesCovered: 0,
      avgPriceRange: { min: 0, max: 0 },
      mostVolatileCategory: null,
      mostStableCategory: null,
    }
  }

  const prices = allTrends.map((t) => t.current_price)
  const avgPriceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }

  // 找出波动最大和最小的类别
  const categoryVolatility: Record<string, number> = {}
  for (const trend of allTrends) {
    const cat = trend.product_category
    const volatility = Math.abs(trend.change_percent_30d) + Math.abs(trend.change_percent_90d)
    categoryVolatility[cat] = (categoryVolatility[cat] || 0) + volatility
  }

  const sortedCategories = Object.entries(categoryVolatility).sort((a, b) => b[1] - a[1])

  return {
    totalMarkets: allTrends.length,
    categoriesCovered: new Set(allTrends.map((t) => t.product_category)).size,
    avgPriceRange,
    mostVolatileCategory: sortedCategories[0]?.[0] as ProductCategory || null,
    mostStableCategory: sortedCategories[sortedCategories.length - 1]?.[0] as ProductCategory || null,
  }
}

/**
 * 获取价格预警阈值建议
 */
export function getPriceAlertThresholds(
  productCategory: ProductCategory,
  marketRegion: MarketRegion
): { low: number; high: number; current: number } | null {
  const trend = getMarketPriceTrend(productCategory, marketRegion)
  if (!trend) return null

  const current = trend.current_price
  const volatility = Math.abs(trend.change_percent_30d) / 100

  return {
    low: Math.round(current * (1 - volatility * 2) * 100) / 100,
    high: Math.round(current * (1 + volatility * 2) * 100) / 100,
    current,
  }
}
