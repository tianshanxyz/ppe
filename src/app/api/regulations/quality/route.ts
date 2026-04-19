/**
 * 法规数据质量监控 - API 路由
 * 提供法规数据质量监控的查询接口
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 获取 Supabase 客户端
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    throw new Error('Supabase 配置错误：缺少必要的环境变量')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * 获取法规数据质量报告
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction')
    const limit = parseInt(searchParams.get('limit') || '100')

    // 查询所有法规
    const { data: regulations, error: regulationsError } = await supabase
      .from('regulations')
      .select('*')
      .limit(10000)
    
    if (regulationsError) {
      return NextResponse.json(
        { error: '查询法规失败', details: regulationsError.message },
        { status: 500 }
      )
    }
    
    if (!regulations || regulations.length === 0) {
      return NextResponse.json(
        { error: '没有找到法规数据' },
        { status: 404 }
      )
    }
    
    // 计算质量指标
    const total = regulations.length
    
    // 完整度检查
    const completeness = {
      total,
      title_complete: regulations.filter(r => r.title).length,
      jurisdiction_complete: regulations.filter(r => r.jurisdiction).length,
      effective_date_complete: regulations.filter(r => r.effective_date).length,
      content_complete: regulations.filter(r => r.content).length,
      score: 0
    }
    
    completeness.score = (
      (completeness.title_complete / total) +
      (completeness.jurisdiction_complete / total) +
      (completeness.effective_date_complete / total) +
      (completeness.content_complete / total)
    ) / 4 * 100
    
    // 市场分布
    const marketDistribution: Record<string, number> = {}
    for (const reg of regulations) {
      marketDistribution[reg.jurisdiction] = (marketDistribution[reg.jurisdiction] || 0) + 1
    }
    
    // 类型分布
    const typeDistribution: Record<string, number> = {}
    for (const reg of regulations) {
      typeDistribution[reg.type] = (typeDistribution[reg.type] || 0) + 1
    }
    
    // 分类分布
    const categoryDistribution: Record<string, number> = {}
    for (const reg of regulations) {
      const category = reg.category || '未分类'
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
    }
    
    // 重复率检查
    const titleDuplicates: Record<string, number> = {}
    for (const reg of regulations) {
      const key = `${reg.title}-${reg.jurisdiction}`
      titleDuplicates[key] = (titleDuplicates[key] || 0) + 1
    }
    
    const duplicateCount = Object.values(titleDuplicates).filter(count => count > 1).length
    const duplicateRate = duplicateCount / total
    
    // 最后更新时间
    const { data: lastUpdate } = await supabase
      .from('data_update_logs')
      .select('created_at')
      .eq('source', 'regulations')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    // 生成质量报告
    const qualityReport = {
      timestamp: new Date().toISOString(),
      total,
      completeness: {
        ...completeness,
        score: completeness.score.toFixed(2)
      },
      distribution: {
        market: marketDistribution,
        type: typeDistribution,
        category: categoryDistribution
      },
      duplicateRate: {
        count: duplicateCount,
        rate: duplicateRate.toFixed(4),
        threshold: 0.05
      },
      lastUpdate: lastUpdate?.created_at,
      status: duplicateRate < 0.05 && completeness.score >= 90 ? 'healthy' : 'warning'
    }
    
    // 按市场过滤
    const filteredRegulations = jurisdiction
      ? regulations.filter(r => r.jurisdiction === jurisdiction)
      : regulations.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      qualityReport,
      regulations: filteredRegulations,
      metadata: {
        jurisdiction_filter: jurisdiction,
        limit: limit,
        total_available: regulations.length
      }
    })
    
  } catch (error) {
    console.error('获取质量报告失败:', error)
    return NextResponse.json(
      { error: '获取质量报告失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 手动触发质量检查
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction')

    // 查询所有法规
    const { data: regulations, error: regulationsError } = await supabase
      .from('regulations')
      .select('*')
      .limit(10000)
    
    if (regulationsError) {
      return NextResponse.json(
        { error: '查询法规失败', details: regulationsError.message },
        { status: 500 }
      )
    }
    
    // 计算质量指标
    const total = regulations.length
    
    // 完整度检查
    const completeness = {
      total,
      title_complete: regulations.filter(r => r.title).length,
      jurisdiction_complete: regulations.filter(r => r.jurisdiction).length,
      effective_date_complete: regulations.filter(r => r.effective_date).length,
      content_complete: regulations.filter(r => r.content).length,
      score: 0
    }
    
    completeness.score = (
      (completeness.title_complete / total) +
      (completeness.jurisdiction_complete / total) +
      (completeness.effective_date_complete / total) +
      (completeness.content_complete / total)
    ) / 4 * 100
    
    // 重复率检查
    const titleDuplicates: Record<string, number> = {}
    for (const reg of regulations) {
      const key = `${reg.title}-${reg.jurisdiction}`
      titleDuplicates[key] = (titleDuplicates[key] || 0) + 1
    }
    
    const duplicateCount = Object.values(titleDuplicates).filter(count => count > 1).length
    const duplicateRate = duplicateCount / total
    
    // 生成质量报告
    const qualityReport = {
      timestamp: new Date().toISOString(),
      total,
      completeness: {
        ...completeness,
        score: completeness.score.toFixed(2)
      },
      duplicateRate: {
        count: duplicateCount,
        rate: duplicateRate.toFixed(4),
        threshold: 0.05
      },
      status: duplicateRate < 0.05 && completeness.score >= 90 ? 'healthy' : 'warning'
    }
    
    // 保存到审计日志
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        audit_type: 'regulation_quality',
        score: qualityReport.completeness.score,
        status: qualityReport.status,
        details: qualityReport,
        detected_at: new Date().toISOString()
      })
    
    if (logError) {
      console.error('保存审计日志失败:', logError.message)
    }
    
    return NextResponse.json({
      success: true,
      message: '质量检查完成',
      qualityReport
    })
    
  } catch (error) {
    console.error('触发质量检查失败:', error)
    return NextResponse.json(
      { error: '触发质量检查失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
