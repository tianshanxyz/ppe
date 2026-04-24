/**
 * 会员等级系统 API
 *
 * B-001: 会员等级系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { membershipService, getAllMembershipConfigs } from '@/lib/membership'

/**
 * GET /api/membership
 * 获取当前用户的会员信息
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

    // 获取会员信息
    const result = await membershipService.getUserMembership(user.id)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取会员信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取会员信息失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/membership/upgrade
 * 升级会员等级
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

    if (!body.target_tier || !['free', 'professional', 'enterprise'].includes(body.target_tier)) {
      return NextResponse.json(
        { success: false, error: '无效的会员等级', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const result = await membershipService.upgradeMembership(
      user.id,
      body.target_tier,
      body.billing_cycle || 'monthly'
    )

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('升级会员失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '升级会员失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/membership
 * 取消订阅
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}))

    const result = await membershipService.cancelMembership(user.id, body.reason)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('取消订阅失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '取消订阅失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
