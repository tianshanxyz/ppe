/**
 * API密钥使用情况 API
 *
 * B-002: API密钥管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiKeyService } from '@/lib/api-keys'

/**
 * GET /api/api-keys/:id/usage
 * 获取API密钥使用情况
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await apiKeyService.getApiKeyUsage(params.id, user.id)

    return NextResponse.json({
      ...result,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取API密钥使用情况失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取API密钥使用情况失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
