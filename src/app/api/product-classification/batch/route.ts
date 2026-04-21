/**
 * PPE产品批量分类 API
 *
 * A-006: PPE产品自动分类模型
 */

import { NextRequest, NextResponse } from 'next/server'
import { ppeProductClassifier } from '@/lib/ai/product-classification'
import type { BatchClassificationRequest } from '@/lib/ai/product-classification'

/**
 * POST /api/product-classification/batch
 * 批量分类产品
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: products (非空数组)',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    // 限制批量大小
    const MAX_BATCH_SIZE = 100
    if (body.products.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `批量大小超过限制，最大支持 ${MAX_BATCH_SIZE} 个产品`,
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const batchRequest: BatchClassificationRequest = {
      products: body.products,
    }

    const result = await ppeProductClassifier.classifyBatch(batchRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('批量产品分类失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '批量产品分类失败',
        results: [],
        failed_indices: [],
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
