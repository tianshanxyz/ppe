/**
 * 法规变更影响分析 API
 *
 * A-008: 法规变更影响分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { impactAnalyzer, reportGenerator } from '@/lib/ai/regulation-impact'
import type { ImpactAnalysisRequest, RegulationChange } from '@/lib/ai/regulation-impact'

/**
 * POST /api/regulation-impact/analyze
 * 执行法规变更影响分析
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.change) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: change',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const analysisRequest: ImpactAnalysisRequest = {
      change: body.change as RegulationChange,
      analysis_depth: body.analysis_depth || 'detailed',
      include_historical_data: body.include_historical_data ?? false,
      max_results: body.max_results,
    }

    const analysis = await impactAnalyzer.analyze(analysisRequest)

    return NextResponse.json({
      success: true,
      analysis,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('影响分析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影响分析失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
