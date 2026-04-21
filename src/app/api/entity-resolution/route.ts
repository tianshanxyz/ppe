/**
 * 实体解析（企业去重）API
 *
 * A-007: 实体关联模型（企业去重）
 */

import { NextRequest, NextResponse } from 'next/server'
import { entityResolutionEngine } from '@/lib/ai/entity-resolution'
import type { EntityResolutionRequest, CompanyEntity } from '@/lib/ai/entity-resolution'

/**
 * POST /api/entity-resolution
 * 执行实体解析（去重）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.entities || !Array.isArray(body.entities) || body.entities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: entities (非空数组)',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const resolutionRequest: EntityResolutionRequest = {
      entities: body.entities,
      config: body.config,
    }

    const result = await entityResolutionEngine.resolve(resolutionRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('实体解析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '实体解析失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/entity-resolution
 * 查询相似实体
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const threshold = parseFloat(searchParams.get('threshold') || '0.7')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: name',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    // 这里应该从数据库获取所有实体
    // 暂时返回空结果
    return NextResponse.json({
      success: true,
      query: name,
      results: [],
      total: 0,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('查询相似实体失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
