/**
 * API密钥管理 API
 *
 * B-002: API密钥管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiKeyService } from '@/lib/api-keys'

/**
 * GET /api/api-keys
 * 列出用户的所有API密钥
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

    const result = await apiKeyService.listApiKeys(user.id)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取API密钥列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取API密钥列表失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/api-keys
 * 创建新的API密钥
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

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: '缺少name参数', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const result = await apiKeyService.createApiKey(user.id, {
      name: body.name,
      description: body.description,
      permissions: body.permissions,
      allowedEndpoints: body.allowed_endpoints,
      allowedIps: body.allowed_ips,
      rateLimit: body.rate_limit,
      usageQuota: body.usage_quota,
      expiresInDays: body.expires_in_days,
    })

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('创建API密钥失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建API密钥失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
