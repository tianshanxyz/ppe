/**
 * 企业名称标准化 API
 *
 * A-007: 实体关联模型（企业去重）
 */

import { NextRequest, NextResponse } from 'next/server'
import { companyNameNormalizer } from '@/lib/ai/entity-resolution'

/**
 * POST /api/entity-resolution/normalize
 * 标准化企业名称
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: name',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const result = companyNameNormalizer.normalize(body.name)

    return NextResponse.json({
      success: true,
      result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('名称标准化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '名称标准化失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
