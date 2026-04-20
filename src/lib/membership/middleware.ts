/**
 * 会员等级系统 - 中间件
 *
 * B-001: 会员等级系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { membershipService } from './service'
import { MembershipPermissions, MembershipLimits } from './types'

/**
 * 检查功能权限的中间件
 */
export function withPermission(permission: keyof MembershipPermissions) {
  return async function permissionMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // 获取用户ID（从session或token中）
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: '未登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const check = await membershipService.checkPermission(userId, permission)

    if (!check.success) {
      return NextResponse.json(
        { error: check.message || '权限检查失败', code: 'CHECK_FAILED' },
        { status: 500 }
      )
    }

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: check.message || '权限不足',
          code: 'FORBIDDEN',
          currentTier: check.currentTier,
          requiredTier: check.requiredTier,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      )
    }

    // 继续处理请求
    return handler(request)
  }
}

/**
 * 检查使用限制的中间件
 */
export function withLimit(limitType: keyof MembershipLimits, incrementBy: number = 1) {
  return async function limitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: '未登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const check = await membershipService.checkLimit(userId, limitType, incrementBy)

    if (!check.success) {
      return NextResponse.json(
        { error: check.message || '限制检查失败', code: 'CHECK_FAILED' },
        { status: 500 }
      )
    }

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: check.message || '已达到使用限制',
          code: 'LIMIT_EXCEEDED',
          currentUsage: check.currentUsage,
          limit: check.limit,
          remaining: check.remaining,
          resetAt: check.resetAt,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      )
    }

    // 增加使用量
    await membershipService.incrementUsage(userId, limitType, incrementBy)

    // 继续处理请求
    return handler(request)
  }
}

/**
 * 从请求中获取用户ID
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // 从Authorization header获取
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // 这里应该验证token并提取用户ID
    // 简化处理，实际应该使用supabase auth
    return null
  }

  // 从session cookie获取
  // 这里简化处理
  return null
}

/**
 * 组合多个中间件
 */
export function composeMiddleware(...middlewares: Function[]) {
  return async function composedMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    let index = 0

    async function next(): Promise<NextResponse> {
      if (index >= middlewares.length) {
        return handler(request)
      }

      const middleware = middlewares[index++]
      return middleware(request, next)
    }

    return next()
  }
}
