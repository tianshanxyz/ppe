/**
 * API Key Usage API Route
 * 
 * B-002: API密钥管理 - 使用情况查询
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/api-keys/service'
import { getCurrentUser } from '@/lib/auth'

// GET /api/api-keys/usage?id={keyId} - Get usage statistics for a specific API key
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Key ID is required' },
        { status: 400 }
      )
    }

    const result = await apiKeyService.getApiKeyUsage(keyId, user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get API key usage:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
