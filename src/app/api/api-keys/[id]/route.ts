/**
 * API密钥管理 API - 单个密钥操作
 *
 * B-002: API密钥管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { apiKeyService } from '@/lib/api-keys'

/**
 * GET /api/api-keys/:id
 * 获取单个API密钥详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

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

    const apiKey = await apiKeyService.getApiKey(id, user.id)

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API密钥不存在', processing_time_ms: Date.now() - startTime },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      key: apiKey,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取API密钥失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取API密钥失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/api-keys/:id
 * 更新API密钥
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

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

    const result = await apiKeyService.updateApiKey(id, user.id, {
      name: body.name,
      description: body.description,
      status: body.status,
      permissions: body.permissions,
      allowedEndpoints: body.allowed_endpoints,
      allowedIps: body.allowed_ips,
      rateLimit: body.rate_limit,
      usageQuota: body.usage_quota,
    })

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('更新API密钥失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新API密钥失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/api-keys/:id
 * 撤销API密钥
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

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

    const result = await apiKeyService.revokeApiKey(id, user.id, body.reason)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('撤销API密钥失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '撤销API密钥失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
