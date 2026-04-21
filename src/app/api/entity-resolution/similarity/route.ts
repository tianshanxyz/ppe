/**
 * 企业名称相似度计算 API
 *
 * A-007: 实体关联模型（企业去重）
 */

import { NextRequest, NextResponse } from 'next/server'
import { similarityCalculator } from '@/lib/ai/entity-resolution'

/**
 * POST /api/entity-resolution/similarity
 * 计算两个企业名称的相似度
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.name1 || !body.name2) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: name1 和 name2',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const similarity = similarityCalculator.calculate(body.name1, body.name2)

    return NextResponse.json({
      success: true,
      name1: body.name1,
      name2: body.name2,
      similarity,
      is_match: similarity >= 0.85,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('相似度计算失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '相似度计算失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
