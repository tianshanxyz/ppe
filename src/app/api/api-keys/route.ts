import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const LOCAL_API_KEYS_PREFIX = 'ppe_local_api_keys_'

function generateApiKeyString(): string {
  return 'pk_live_' + randomBytes(24).toString('hex').substring(0, 32)
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function getLocalApiKeys(userId: string): any[] {
  return []
}

function saveLocalApiKey(userId: string, keyData: any): void {
}

function deleteLocalApiKey(userId: string, keyId: string): void {
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    try {
      const decoded = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString()
      const parsed = JSON.parse(decoded)
      if (parsed && parsed.id) return parsed.id
    } catch {}
  }

  const userIdHeader = request.headers.get('x-user-id')
  if (userIdHeader) return userIdHeader

  return null
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  if (isSupabaseConfigured) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
          { status: 401 }
        )
      }

      const { apiKeyService } = await import('@/lib/api-keys')
      const result = await apiKeyService.listApiKeys(user.id)

      return NextResponse.json({
        ...result,
        processing_time_ms: Date.now() - startTime,
      })
    } catch (error) {
      console.error('Supabase API keys GET error:', error)
    }
  }

  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
      { status: 401 }
    )
  }

  const keys = getLocalApiKeys(userId)
  return NextResponse.json({
    success: true,
    keys,
    total: keys.length,
    processing_time_ms: Date.now() - startTime,
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  if (isSupabaseConfigured) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
          { status: 401 }
        )
      }

      const body = await request.json()
      if (!body.name) {
        return NextResponse.json(
          { success: false, error: 'Missing name parameter', processing_time_ms: Date.now() - startTime },
          { status: 400 }
        )
      }

      const { apiKeyService } = await import('@/lib/api-keys')
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
      console.error('Supabase API keys POST error:', error)
    }
  }

  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'API key name is required', processing_time_ms: Date.now() - startTime },
        { status: 400 }
      )
    }

    const fullKey = generateApiKeyString()
    const keyPrefix = fullKey.substring(0, 12)
    const keyId = 'key_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

    const keyData = {
      id: keyId,
      userId,
      name: body.name.trim(),
      description: body.description || '',
      keyPrefix,
      keyHash: hashKey(fullKey),
      status: 'active',
      permissions: body.permissions || ['read'],
      allowedEndpoints: body.allowed_endpoints || ['*'],
      createdAt: new Date().toISOString(),
      expiresAt: body.expires_in_days
        ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null,
      usage: {
        totalRequests: 0,
        requestsThisMonth: 0,
        requestsToday: 0,
      },
    }

    saveLocalApiKey(userId, keyData)

    return NextResponse.json({
      success: true,
      apiKey: {
        ...keyData,
        fullKey,
      },
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Local API keys POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create API key', processing_time_ms: Date.now() - startTime },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()

  if (isSupabaseConfigured) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
          { status: 401 }
        )
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Missing API key ID', processing_time_ms: Date.now() - startTime },
          { status: 400 }
        )
      }

      const { apiKeyService } = await import('@/lib/api-keys')
      const result = await apiKeyService.revokeApiKey(id, user.id)

      return NextResponse.json({
        ...result,
        processing_time_ms: Date.now() - startTime,
      })
    } catch (error) {
      console.error('Supabase API keys DELETE error:', error)
    }
  }

  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', processing_time_ms: Date.now() - startTime },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Missing API key ID', processing_time_ms: Date.now() - startTime },
      { status: 400 }
    )
  }

  deleteLocalApiKey(userId, id)

  return NextResponse.json({
    success: true,
    processing_time_ms: Date.now() - startTime,
  })
}
