/**
 * 制造商信用评分 API
 *
 * A-001: 制造商信用评分算法
 */

import { NextRequest, NextResponse } from 'next/server'
import { creditScoreCalculator } from '@/lib/ai/credit-score/calculator'
import { scoreExplainer } from '@/lib/ai/credit-score/explainer'
import {
  CalculateScoreRequest,
  CalculateScoreResponse,
  BatchCalculateRequest,
  BatchCalculateResponse,
  CompareScoresRequest,
  CompareScoresResponse,
} from '@/lib/ai/credit-score/types'
import { createClient } from '@/lib/supabase/server'

// ============================================
// 辅助函数
// ============================================

/**
 * 验证请求
 */
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '请求体不能为空' }
  }
  return { valid: true }
}

/**
 * 限流检查（简化版）
 */
async function checkRateLimit(request: NextRequest): Promise<boolean> {
  // 实际实现应该使用 Redis 或类似服务
  // 这里简化处理
  return true
}

// ============================================
// API 路由
// ============================================

/**
 * POST /api/credit-score
 * 计算单个制造商信用评分
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 限流检查
    const allowed = await checkRateLimit(request)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试', processing_time_ms: Date.now() - startTime },
        { status: 429 }
      )
    }

    // 解析请求体
    const body: CalculateScoreRequest = await request.json()

    // 验证请求
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    // 验证 manufacturer_id
    if (!body.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: 'manufacturer_id 不能为空', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    // 检查是否需要强制重新计算
    if (!body.force_recalculate) {
      const supabase = await createClient()
      const { data: existingScore } = await supabase
        .from('manufacturer_credit_scores')
        .select('*')
        .eq('manufacturer_id', body.manufacturer_id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      // 如果7天内计算过，直接返回缓存结果
      if (existingScore) {
        const lastCalculated = new Date(existingScore.calculated_at)
        const daysSinceCalculation = (Date.now() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceCalculation < 7) {
          // 获取完整评分数据
          const { data: manufacturer } = await supabase
            .from('ppe_manufacturers_enhanced')
            .select('credit_score')
            .eq('id', body.manufacturer_id)
            .single()

          if (manufacturer?.credit_score) {
            const response: CalculateScoreResponse = {
              success: true,
              score: manufacturer.credit_score,
              processing_time_ms: Date.now() - startTime,
            }

            // 如果需要解释
            if (body.include_explanation && manufacturer.credit_score) {
              response.explanation = scoreExplainer.explain(manufacturer.credit_score)
            }

            return NextResponse.json(response)
          }
        }
      }
    }

    // 计算评分
    const score = await creditScoreCalculator.calculate(body.manufacturer_id)

    if (!score) {
      return NextResponse.json(
        { success: false, error: '制造商不存在或计算失败', processing_time_ms: Date.now() - startTime },
        { status: 404 }
      )
    }

    // 构建响应
    const response: CalculateScoreResponse = {
      success: true,
      score,
      processing_time_ms: Date.now() - startTime,
    }

    // 如果需要解释
    if (body.include_explanation) {
      response.explanation = scoreExplainer.explain(score)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('信用评分计算错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credit-score?manufacturer_id=xxx
 * 获取制造商信用评分（不重新计算）
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const manufacturerId = searchParams.get('manufacturer_id')
    const includeExplanation = searchParams.get('include_explanation') === 'true'
    const includeHistory = searchParams.get('include_history') === 'true'

    if (!manufacturerId) {
      return NextResponse.json(
        { success: false, error: 'manufacturer_id 不能为空', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取制造商信息和信用评分
    const { data: manufacturer, error } = await supabase
      .from('ppe_manufacturers_enhanced')
      .select('id, company_name, credit_score')
      .eq('id', manufacturerId)
      .single()

    if (error || !manufacturer) {
      return NextResponse.json(
        { success: false, error: '制造商不存在', processing_time_ms: Date.now() - startTime },
        { status: 404 }
      )
    }

    // 如果没有评分，提示需要先计算
    if (!manufacturer.credit_score) {
      return NextResponse.json(
        {
          success: false,
          error: '该制造商尚未计算信用评分，请先调用 POST /api/credit-score 进行计算',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 404 }
      )
    }

    // 构建响应
    const response: CalculateScoreResponse = {
      success: true,
      score: manufacturer.credit_score,
      processing_time_ms: Date.now() - startTime,
    }

    // 如果需要解释
    if (includeExplanation) {
      response.explanation = scoreExplainer.explain(manufacturer.credit_score)
    }

    // 如果需要历史记录
    if (includeHistory) {
      const { data: history } = await supabase
        .from('manufacturer_credit_scores')
        .select('*')
        .eq('manufacturer_id', manufacturerId)
        .order('calculated_at', { ascending: false })
        .limit(12)

      if (history && response.score) {
        response.score.score_history = history.map((h: any) => ({
          date: h.calculated_at,
          overall_score: h.overall_score,
          dimension_scores: h.dimension_scores || {},
        }))
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取信用评分错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/credit-score
 * 批量计算信用评分
 */
export async function PATCH(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: BatchCalculateRequest = await request.json()
    const supabase = await createClient()

    let manufacturerIds: string[] = []

    // 如果提供了具体ID列表
    if (body.manufacturer_ids && body.manufacturer_ids.length > 0) {
      manufacturerIds = body.manufacturer_ids
    }
    // 如果提供了筛选条件
    else if (body.filters) {
      let query = supabase.from('ppe_manufacturers_enhanced').select('id')

      if (body.filters.last_calculated_before) {
        query = query.lt('credit_score->last_calculated', body.filters.last_calculated_before)
      }

      const { data } = await query
      manufacturerIds = data?.map((d: any) => d.id) || []
    }
    // 否则计算所有制造商
    else {
      const { data } = await supabase.from('ppe_manufacturers_enhanced').select('id')
      manufacturerIds = data?.map((d: any) => d.id) || []
    }

    // 批量计算
    let processedCount = 0
    let failedCount = 0
    const errors: { manufacturer_id: string; error: string }[] = []

    // 限制批量处理数量
    const batchSize = 100
    const idsToProcess = manufacturerIds.slice(0, batchSize)

    for (const manufacturerId of idsToProcess) {
      try {
        const score = await creditScoreCalculator.calculate(manufacturerId)
        if (score) {
          processedCount++
        } else {
          failedCount++
          errors.push({ manufacturer_id: manufacturerId, error: '计算失败' })
        }
      } catch (error) {
        failedCount++
        errors.push({
          manufacturer_id: manufacturerId,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    const response: BatchCalculateResponse = {
      success: true,
      processed_count: processedCount,
      failed_count: failedCount,
      errors: errors.slice(0, 10), // 只返回前10个错误
      processing_time_ms: Date.now() - startTime,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('批量计算信用评分错误:', error)
    return NextResponse.json(
      {
        success: false,
        processed_count: 0,
        failed_count: 0,
        errors: [{ manufacturer_id: 'batch', error: error instanceof Error ? error.message : '未知错误' }],
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
