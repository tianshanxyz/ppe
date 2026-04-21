/**
 * 价格预测 API 路由
 * POST /api/price-prediction - 获取认证成本预测和价格趋势
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  pricePredictionEngine,
  CertificationType,
  ProductCategory,
  MarketRegion,
  PredictionTimeframe,
  CostPredictionRequest,
  PriceTrendRequest,
} from '@/lib/ai/price-prediction'
import { withMembershipCheck } from '@/lib/membership'
import { rateLimit } from '@/lib/middleware/rateLimit'

/**
 * POST /api/price-prediction
 * 获取价格预测
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 速率限制检查
    const rateLimitResult = await rateLimit(request, {
      anonymous: 10,
      authenticated: 60,
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

    const body = await request.json()

    // 验证请求参数
    if (!body.cost_requests && !body.price_requests) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: cost_requests 或 price_requests',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    // 构建成本预测请求
    const costRequests: CostPredictionRequest[] = (body.cost_requests || []).map(
      (req: Partial<CostPredictionRequest>) => ({
        certification_type: req.certification_type as CertificationType,
        product_category: req.product_category as ProductCategory,
        market_region: req.market_region as MarketRegion,
        product_complexity: req.product_complexity,
        company_size: req.company_size,
        urgency_level: req.urgency_level,
      })
    )

    // 构建价格趋势请求
    const priceRequests: PriceTrendRequest[] = (body.price_requests || []).map(
      (req: Partial<PriceTrendRequest>) => ({
        product_category: req.product_category as ProductCategory,
        market_region: req.market_region as MarketRegion,
        timeframe: (req.timeframe as PredictionTimeframe) || PredictionTimeframe.MEDIUM_TERM,
      })
    )

    // 执行预测
    const result = pricePredictionEngine.getFullPrediction(costRequests, priceRequests)

    return NextResponse.json({
      success: true,
      result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('价格预测失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '价格预测失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/price-prediction
 * 获取可用选项和统计数据
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'options') {
      // 返回可用选项
      const options = pricePredictionEngine.getAvailableOptions()
      return NextResponse.json({
        success: true,
        options,
        processing_time_ms: Date.now() - startTime,
      })
    }

    if (type === 'statistics') {
      // 返回统计数据
      const stats = pricePredictionEngine.getStatistics()
      return NextResponse.json({
        success: true,
        statistics: stats,
        processing_time_ms: Date.now() - startTime,
      })
    }

    // 默认返回所有信息
    return NextResponse.json({
      success: true,
      options: pricePredictionEngine.getAvailableOptions(),
      statistics: pricePredictionEngine.getStatistics(),
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取价格预测信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取信息失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
