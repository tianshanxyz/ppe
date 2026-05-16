import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { membershipService } from './service'
import { MembershipPermissions, MembershipLimits } from './types'

export function withPermission(permission: keyof MembershipPermissions) {
  return async function permissionMiddleware(
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

    return handler(request)
  }
}

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

    await membershipService.incrementUsage(userId, limitType, incrementBy)

    return handler(request)
  }
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

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
