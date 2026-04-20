/**
 * 会员权限检查 API
 *
 * B-001: 会员等级系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { membershipService, MembershipPermissions, MembershipLimits } from '@/lib/membership'

/**
 * POST /api/membership/check/permission
 * 检查用户是否有特定权限
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未登录', processing_time_ms: Date.now() - startTime },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.permission) {
      return NextResponse.json(
        { success: false, error: '缺少permission参数', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const result = await membershipService.checkPermission(
      user.id,
      body.permission as keyof MembershipPermissions
    )

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('权限检查失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '权限检查失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/membership/check/limit?type=maxApiCallsPerDay&amount=1
 * 检查用户是否达到使用限制
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '未登录', processing_time_ms: Date.now() - startTime },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limitType = searchParams.get('type') as keyof MembershipLimits
    const amount = parseInt(searchParams.get('amount') || '1', 10)

    if (!limitType) {
      return NextResponse.json(
        { success: false, error: '缺少type参数', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const result = await membershipService.checkLimit(user.id, limitType, amount)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('限制检查失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '限制检查失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
