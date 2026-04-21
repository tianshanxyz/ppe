/**
 * 认证路径优化 API 路由
 * POST /api/price-prediction/optimize - 获取最优认证路径和成本优化建议
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  pricePredictionEngine,
  ProductCategory,
  MarketRegion,
} from '@/lib/ai/price-prediction'
import { rateLimit } from '@/lib/middleware/rateLimit'

/**
 * POST /api/price-prediction/optimize
 * 获取最优认证路径
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

    // 验证必填字段
    if (!body.product_category || !body.target_markets) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: product_category, target_markets',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const productCategory = body.product_category as ProductCategory
    const targetMarkets = body.target_markets as MarketRegion[]
    const budgetConstraint = body.budget_constraint as number | undefined
    const timeConstraint = body.time_constraint as number | undefined

    // 生成最优路径
    const optimalPath = pricePredictionEngine.getOptimalCertificationPath(
      productCategory,
      targetMarkets,
      budgetConstraint,
      timeConstraint
    )

    // 计算ROI（如果提供了预期收入）
    let roiAnalysis = null
    if (body.expected_revenue) {
      roiAnalysis = pricePredictionEngine.calculateCertificationROI(
        optimalPath.totalCost.typical,
        body.expected_revenue,
        optimalPath.totalTimeline.typical
      )
    }

    return NextResponse.json({
      success: true,
      optimal_path: optimalPath,
      roi_analysis: roiAnalysis,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('认证路径优化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '优化失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/price-prediction/optimize
 * 获取认证路径优化示例
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const productCategory = searchParams.get('product_category') as ProductCategory
    const markets = searchParams.get('markets')?.split(',') as MarketRegion[]

    if (!productCategory || !markets) {
      return NextResponse.json({
        success: true,
        message: '使用示例',
        example: {
          request: {
            product_category: 'respiratory',
            target_markets: ['us', 'eu', 'china'],
            budget_constraint: 100000,
            time_constraint: 12,
            expected_revenue: 500000,
          },
          response: {
            optimal_path: {
              phases: [
                {
                  phase: 1,
                  certifications: ['ISO 13485'],
                  estimatedCost: 28000,
                  estimatedTimeline: 6,
                },
                {
                  phase: 2,
                  certifications: ['FDA 510(k)', 'CE Mark', 'GB Standard'],
                  estimatedCost: 68000,
                  estimatedTimeline: 8,
                },
              ],
              totalCost: { min: 75000, max: 150000, typical: 96000 },
              totalTimeline: { min: 8, max: 20, typical: 12 },
            },
          },
        },
        processing_time_ms: Date.now() - startTime,
      })
    }

    // 执行优化
    const optimalPath = pricePredictionEngine.getOptimalCertificationPath(
      productCategory,
      markets
    )

    return NextResponse.json({
      success: true,
      optimal_path: optimalPath,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取优化示例失败:', error)
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
