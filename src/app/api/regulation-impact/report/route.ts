/**
 * 法规变更影响报告 API
 *
 * A-008: 法规变更影响分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { impactAnalyzer, reportGenerator } from '@/lib/ai/regulation-impact'
import type { RegulationChange, ImpactAnalysis } from '@/lib/ai/regulation-impact'

/**
 * POST /api/regulation-impact/report
 * 生成法规变更影响报告
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.changes || !Array.isArray(body.changes) || body.changes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: changes (非空数组)',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const changes = body.changes as RegulationChange[]
    const analysisDepth = body.analysis_depth || 'detailed'

    // 执行影响分析
    const analyses: ImpactAnalysis[] = []
    for (const change of changes) {
      const analysis = await impactAnalyzer.analyze({
        change,
        analysis_depth: analysisDepth,
        include_historical_data: false,
      })
      analyses.push(analysis)
    }

    // 生成报告
    const report = reportGenerator.generateReport(
      body.title || '法规变更影响分析报告',
      body.description || '',
      analyses,
      body.valid_days || 30
    )

    // 根据格式返回
    const format = body.format || 'json'

    switch (format) {
      case 'markdown':
        return new NextResponse(reportGenerator.generateMarkdownReport(report), {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="regulation-impact-report-${report.id}.md"`,
          },
        })

      case 'html':
        return new NextResponse(reportGenerator.generateHtmlReport(report), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="regulation-impact-report-${report.id}.html"`,
          },
        })

      case 'json':
      default:
        return NextResponse.json({
          success: true,
          report,
          processing_time_ms: Date.now() - startTime,
        })
    }
  } catch (error) {
    console.error('报告生成失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '报告生成失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
