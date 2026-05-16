/**
 * 制造商信用评分对比 API
 *
 * A-001: 制造商信用评分算法
 */

import { NextRequest, NextResponse } from 'next/server'
import { CompareScoresRequest, CompareScoresResponse } from '@/lib/ai/credit-score/types'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * POST /api/credit-score/compare
 * 对比多个制造商的信用评分
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: CompareScoresRequest = await request.json()

    // 验证请求
    if (!body.manufacturer_ids || body.manufacturer_ids.length < 2) {
      return NextResponse.json(
        { success: false, error: '至少需要提供2个制造商ID进行对比', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    if (body.manufacturer_ids.length > 10) {
      return NextResponse.json(
        { success: false, error: '最多支持10个制造商对比', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    
      const supabase = await createClient()

    // 获取制造商信用评分
    const { data: manufacturers, error } = await supabase
      .from('ppe_manufacturers_enhanced')
      .select('id, company_name, credit_score')
      .in('id', body.manufacturer_ids)

    if (error) {
      return NextResponse.json(
        { success: false, error: '查询失败', processing_time_ms: Date.now() - startTime },
        { status: 500 }
      )
    }

    // 构建对比数据
    const comparison = manufacturers?.map((m: any) => ({
      manufacturer_id: m.id,
      manufacturer_name: m.company_name,
      overall_score: m.credit_score?.overall_score || 0,
      dimension_scores: {
        compliance_history: m.credit_score?.dimensions?.compliance_history?.score || 0,
        risk_events: m.credit_score?.dimensions?.risk_events?.score || 0,
        activity: m.credit_score?.dimensions?.activity?.score || 0,
        diversity: m.credit_score?.dimensions?.diversity?.score || 0,
      },
      risk_level: m.credit_score?.risk_level || 'unknown',
    })) || []

    // 计算排名
    const rankings = {
      overall: comparison
        .sort((a: any, b: any) => b.overall_score - a.overall_score)
        .map((c: any, index: number) => ({ manufacturer_id: c.manufacturer_id, rank: index + 1 })),
      by_dimension: {} as Record<string, { manufacturer_id: string; rank: number }[]>,
    }

    const dimensions = ['compliance_history', 'risk_events', 'activity', 'diversity'] as const
    dimensions.forEach((dim) => {
      rankings.by_dimension[dim] = comparison
        .sort((a: any, b: any) => b.dimension_scores[dim] - a.dimension_scores[dim])
        .map((c: any, index: number) => ({ manufacturer_id: c.manufacturer_id, rank: index + 1 }))
    })

    // 生成分析文本
    const analysis = generateComparisonAnalysis(comparison)

    const response: CompareScoresResponse = {
      success: true,
      comparison,
      rankings,
      analysis,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('信用评分对比错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

/**
 * 生成对比分析文本
 */
function generateComparisonAnalysis(
  comparison: Array<{
    manufacturer_id: string
    manufacturer_name: string
    overall_score: number
    dimension_scores: Record<string, number>
    risk_level: string
  }>
): string {
  if (comparison.length === 0) return ''

  // 找出最高分和最低分
  const sorted = [...comparison].sort((a, b) => b.overall_score - a.overall_score)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  let analysis = `在${comparison.length}家制造商中，${best.manufacturer_name}信用评分最高（${best.overall_score}分），${worst.manufacturer_name}最低（${worst.overall_score}分）。`

  // 各维度最佳
  const dimensions = [
    { key: 'compliance_history', name: '合规历史' },
    { key: 'risk_events', name: '风险事件' },
    { key: 'activity', name: '活跃度' },
    { key: 'diversity', name: '多样性' },
  ]

  const bestInDimensions: string[] = []
  dimensions.forEach((dim) => {
    const bestInDim = comparison.reduce((best, current) =>
      current.dimension_scores[dim.key] > best.dimension_scores[dim.key] ? current : best
    )
    bestInDimensions.push(`${dim.name}最佳：${bestInDim.manufacturer_name}（${bestInDim.dimension_scores[dim.key]}分）`)
  })

  analysis += bestInDimensions.join('；') + '。'

  return analysis
}
