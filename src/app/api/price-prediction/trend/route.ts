/**
 * 市场价格趋势 API 路由
 * GET /api/price-prediction/trend - 获取市场价格趋势和预测
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  pricePredictionEngine,
  ProductCategory,
  MarketRegion,
} from '@/lib/ai/price-prediction'
import { rateLimit } from '@/lib/middleware/rateLimit'

/**
 * GET /api/price-prediction/trend
 * 获取市场价格趋势
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 速率限制检查
    const rateLimitResult = await rateLimit(request, {
      anonymous: 20,
      authenticated: 100,
    })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '请求过于频繁，请稍后再试',
          retry_after: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productCategory = searchParams.get('category') as ProductCategory
    const marketRegion = searchParams.get('market') as MarketRegion
    const compare = searchParams.get('compare')?.split(',') as MarketRegion[] | undefined

    // 如果没有指定参数，返回示例
    if (!productCategory || !marketRegion) {
      return NextResponse.json({
        success: true,
        message: '请提供查询参数',
        usage: {
          endpoint: '/api/price-prediction/trend',
          parameters: {
            category: '产品类别 (respiratory, hand_protection, eye_protection等)',
            market: '市场区域 (us, eu, china, japan等)',
            compare: '可选，对比其他市场 (us,eu,china)',
          },
          example: '/api/price-prediction/trend?category=respiratory&market=us&compare=eu,china',
        },
        processing_time_ms: Date.now() - startTime,
      })
    }

    // 获取价格趋势
    const trend = pricePredictionEngine.predictPriceTrend({
      product_category: productCategory,
      market_region: marketRegion,
      timeframe: 'medium_term',
    })

    if (!trend) {
      return NextResponse.json(
        {
          success: false,
          error: '无法获取指定类别和市场的价格趋势',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 404 }
      )
    }

    // 如果需要对比其他市场
    let comparisons = null
    if (compare && compare.length > 0) {
      const compareResult = pricePredictionEngine.compareMarketCertificationCosts(
        productCategory,
        compare
      )
      comparisons = compareResult
    }

    // 获取价格预警建议
    const alertThresholds = pricePredictionEngine.getPriceAlertRecommendations(
      productCategory,
      marketRegion
    )

    return NextResponse.json({
      success: true,
      trend,
      comparisons,
      alert_thresholds: alertThresholds,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取价格趋势失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
