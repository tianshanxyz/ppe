/**
 * PPE产品分类 API
 *
 * A-006: PPE产品自动分类模型
 */

import { NextRequest, NextResponse } from 'next/server'
import { ppeProductClassifier, PPECategory, CATEGORY_LABELS } from '@/lib/ai/product-classification'
import type { ProductClassificationRequest, BatchClassificationRequest } from '@/lib/ai/product-classification'

/**
 * POST /api/product-classification
 * 分类单个产品
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.product_name) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: product_name',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const classificationRequest: ProductClassificationRequest = {
      product_name: body.product_name,
      product_description: body.product_description,
      product_image_url: body.product_image_url,
    }

    const result = await ppeProductClassifier.classify(classificationRequest)

    return NextResponse.json({
      success: true,
      result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('产品分类失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '产品分类失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/product-classification
 * 获取分类类别列表
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      // 获取特定类别信息
      const categoryInfo = CATEGORY_LABELS[category as PPECategory]
      if (!categoryInfo) {
        return NextResponse.json(
          {
            success: false,
            error: '类别不存在',
            processing_time_ms: Date.now() - startTime,
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        category: {
          code: category,
          ...categoryInfo,
        },
        processing_time_ms: Date.now() - startTime,
      })
    }

    // 获取所有类别
    const categories = Object.values(PPECategory).map((cat) => ({
      code: cat,
      ...CATEGORY_LABELS[cat],
    }))

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取分类类别失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取分类类别失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
