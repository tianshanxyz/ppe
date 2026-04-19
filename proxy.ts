import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 简单的速率限制存储（生产环境应使用Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// 速率限制配置
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100, // 每分钟最多100个请求
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // 1. 安全响应头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co;"
  )

  // 2. API 路由速率限制
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const now = Date.now()
    
    const record = rateLimitMap.get(ip)
    if (!record || now > record.resetTime) {
      // 新窗口或窗口已过期
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT.windowMs,
      })
    } else {
      // 当前窗口内
      record.count++
      if (record.count > RATE_LIMIT.maxRequests) {
        return new NextResponse(
          JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            },
          }
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
