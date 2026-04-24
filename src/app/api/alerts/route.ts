/**
 * 风险预警 API 路由
 *
 * 任务A-002: 合规风险预警功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { ComplianceRiskMonitor, createUserAlertConfig, getUserAlertConfigs, updateUserAlertConfig, deleteUserAlertConfig } from '@/lib/alerts/risk-monitor'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * GET /api/alerts
 * 获取当前风险预警列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const status = searchParams.get('status') || 'active'

    const monitor = new ComplianceRiskMonitor()
    const alerts = await monitor.runFullScan()

    // 应用过滤
    let filteredAlerts = alerts
    if (severity) {
      filteredAlerts = filteredAlerts.filter((a) => a.severity === severity)
    }
    if (type) {
      filteredAlerts = filteredAlerts.filter((a) => a.type === type)
    }
    if (status) {
      filteredAlerts = filteredAlerts.filter((a) => a.status === status)
    }

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length,
    })
  } catch (error: any) {
    console.error('获取风险预警失败:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/alerts/config
 * 创建用户预警配置
 */
export async function POST(request: NextRequest) {
  try {
    
      const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const config = await createUserAlertConfig({
      ...body,
      userId: user.id,
    })

    if (!config) {
      return NextResponse.json(
        { success: false, error: '创建配置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error: any) {
    console.error('创建预警配置失败:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/alerts/config/:id
 * 更新用户预警配置
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const success = await updateUserAlertConfig(configId, body)

    if (!success) {
      return NextResponse.json(
        { success: false, error: '更新配置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('更新预警配置失败:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/alerts/config/:id
 * 删除用户预警配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      )
    }

    const success = await deleteUserAlertConfig(configId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: '删除配置失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('删除预警配置失败:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
