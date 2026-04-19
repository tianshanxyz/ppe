/**
 * 法规更新提醒系统 - API 路由
 * 处理法规更新提醒的检测和查询
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectRegulationUpdates, generateAlertSummary, getHighPriorityAlerts, groupAlertsByMarket } from '@/lib/regulations/alerts-detector'
import { regulationConfigs } from '@/lib/regulations/alerts-config'

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 获取法规更新提醒
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction')
    const limit = parseInt(searchParams.get('limit') || '100')
    const onlyHighPriority = searchParams.get('high_priority') === 'true'
    
    // 查询所有法规
    const { data: regulations, error: regulationsError } = await supabase
      .from('regulations')
      .select('*')
      .limit(10000)
    
    if (regulationsError) {
      console.error('查询法规失败:', regulationsError)
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
    
    // 获取上次同步时间
    const { data: syncLog, error: syncError } = await supabase
      .from('data_update_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    const lastSync = syncLog ? new Date(syncLog.created_at) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // 检测更新
    const alerts = detectRegulationUpdates(regulations, lastSync)
    
    // 过滤高优先级
    const filteredAlerts = onlyHighPriority 
      ? getHighPriorityAlerts(alerts) 
      : alerts
    
    // 按市场过滤
    const finalAlerts = jurisdiction
      ? filteredAlerts.filter(a => a.jurisdiction === jurisdiction)
      : filteredAlerts
    
    // 分页
    const paginatedAlerts = finalAlerts.slice(0, limit)
    
    // 生成摘要
    const summary = generateAlertSummary(finalAlerts)
    
    // 按市场分组
    const groupedByMarket = groupAlertsByMarket(finalAlerts)
    
    return NextResponse.json({
      success: true,
      total: finalAlerts.length,
      high_priority_count: getHighPriorityAlerts(finalAlerts).length,
      summary: summary,
      alerts: paginatedAlerts,
      by_market: groupedByMarket,
      metadata: {
        last_sync: lastSync.toISOString(),
        regulations_count: regulations.length
      }
    })
    
  } catch (error) {
    console.error('获取法规提醒失败:', error)
    return NextResponse.json(
      { error: '获取法规提醒失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 手动触发法规更新检测
 */
export async function POST(request: NextRequest) {
  try {
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
    
    // 获取上次同步时间
    const { data: syncLog } = await supabase
      .from('data_update_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    const lastSync = syncLog ? new Date(syncLog.created_at) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // 检测更新
    const alerts = detectRegulationUpdates(regulations, lastSync)
    const highPriorityAlerts = getHighPriorityAlerts(alerts)
    
    // 保存提醒到数据库
    for (const alert of alerts) {
      const { error: insertError } = await supabase
        .from('alerts')
        .upsert({
          alert_type: 'regulation_update',
          regulation_id: alert.regulation_id,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          jurisdiction: alert.jurisdiction,
          metadata: alert.metadata,
          detected_at: alert.detected_at
        }, {
          onConflict: 'regulation_id,alert_type'
        })
      
      if (insertError) {
        console.error(`保存提醒失败 ${alert.id}:`, insertError)
      }
    }
    
    // 生成摘要
    const summary = generateAlertSummary(alerts)
    
    return NextResponse.json({
      success: true,
      message: '法规更新检测完成',
      total: alerts.length,
      high_priority_count: highPriorityAlerts.length,
      summary: summary,
      high_priority_alerts: highPriorityAlerts.slice(0, 10)
    })
    
  } catch (error) {
    console.error('触发法规检测失败:', error)
    return NextResponse.json(
      { error: '触发法规检测失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
