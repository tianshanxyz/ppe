/**
 * 市场准入推荐 API
 *
 * A-004: 市场准入推荐引擎
 */

import { NextRequest, NextResponse } from 'next/server'
import { marketRecommendationEngine } from '@/lib/ai/market-recommendation'
import type { MarketRecommendationRequest } from '@/lib/ai/market-recommendation'

/**
 * POST /api/market-recommendation
 * 生成市场准入推荐
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.product || !body.company) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: product 和 company',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    // 构建请求
    const recommendationRequest: MarketRecommendationRequest = {
      product: {
        product_type: body.product.product_type,
        product_category: body.product.product_category,
        ppe_category: body.product.ppe_category,
        intended_use: body.product.intended_use || [],
        target_users: body.product.target_users || [],
        features: body.product.features || {},
      },
      company: {
        company_name: body.company.company_name,
        existing_certifications: body.company.existing_certifications || [],
        manufacturing_capabilities: body.company.manufacturing_capabilities || {
          iso_certified: false,
          has_qms: false,
        },
        target_markets: body.company.target_markets || [],
        budget_constraint: body.company.budget_constraint,
        timeline_constraint: body.company.timeline_constraint,
      },
      preferences: body.preferences,
      constraints: body.constraints,
    }

    // 生成推荐
    const result = await marketRecommendationEngine.generateRecommendations(
      recommendationRequest
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('市场准入推荐失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成推荐失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
