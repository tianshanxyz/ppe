/**
 * API密钥管理系统 - 中间件
 *
 * B-002: API密钥管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from './service'
import { checkPermission } from './types'

/**
 * 从请求中提取API密钥
 */
export function extractApiKey(request: NextRequest): string | null {
  // 从Authorization header获取
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // 从X-API-Key header获取
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  // 从查询参数获取（不推荐，仅用于开发测试）
  const url = new URL(request.url)
  const apiKeyParam = url.searchParams.get('api_key')
  if (apiKeyParam) {
    return apiKeyParam
  }

  return null
}

/**
 * 获取客户端IP
 */
export function getClientIp(request: NextRequest): string {
  // 从X-Forwarded-For获取（如果通过代理）
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // 从X-Real-IP获取
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // 默认返回未知
  return 'unknown'
}

/**
 * API密钥验证中间件
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (req: NextRequest, apiKey: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const apiKeyString = extractApiKey(request)

  if (!apiKeyString) {
    return NextResponse.json(
      {
        error: 'API key is required',
        code: 'MISSING_API_KEY',
      },
      { status: 401 }
    )
  }

  const clientIp = getClientIp(request)
  const endpoint = new URL(request.url).pathname

  const validation = await apiKeyService.validateApiKey(apiKeyString, endpoint, clientIp)

  if (!validation.valid) {
    const statusCode =
      validation.errorCode === 'RATE_LIMITED'
        ? 429
        : validation.errorCode === 'IP_NOT_ALLOWED'
          ? 403
          : 401

    return NextResponse.json(
      {
        error: validation.error,
        code: validation.errorCode,
      },
      { status: statusCode }
    )
  }

  // 继续处理请求，传入验证通过的API密钥信息
  return handler(request, validation.apiKey)
}

/**
 * 权限检查中间件
 */
export function withApiKeyPermission(resource: string, action: string) {
  return async function permissionMiddleware(
    request: NextRequest,
    apiKey: any,
    handler: (req: NextRequest, apiKey: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (!checkPermission(apiKey, resource, action)) {
      return NextResponse.json(
        {
          error: `Permission denied: ${action} on ${resource}`,
          code: 'PERMISSION_DENIED',
          required: { resource, action },
        },
        { status: 403 }
      )
    }

    return handler(request, apiKey)
  }
}

/**
 * 组合API密钥认证和权限检查
 */
export function withApiKeyAuthAndPermission(resource: string, action: string) {
  return async function authAndPermissionMiddleware(
    request: NextRequest,
    handler: (req: NextRequest, apiKey: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    return withApiKeyAuth(request, async (req, apiKey) => {
      return withApiKeyPermission(resource, action)(req, apiKey, handler)
    })
  }
}
