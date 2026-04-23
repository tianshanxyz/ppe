import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 速率限制配置
export interface RateLimitConfig {
  // 时间窗口内允许的最大请求数
  maxRequests: number
  // 时间窗口（秒）
  windowInSeconds: number
  // 是否对认证用户提高限制
  enableAuthBoost?: boolean
  // 认证用户的倍数
  authBoostMultiplier?: number
}

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowInSeconds: 60,
  enableAuthBoost: true,
  authBoostMultiplier: 2,
}

// Redis 客户端（单例）
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('Upstash Redis 环境变量未配置，速率限制功能将不可用')
      return null
    }

    redisClient = new Redis({
      url,
      token,
    })
  }

  return redisClient
}

/**
 * 生成速率限制的 key
 */
function generateRateLimitKey(identifier: string, type: string = 'api'): string {
  return `ratelimit:${type}:${identifier}`
}

/**
 * 获取客户端的唯一标识
 */
function getClientIdentifier(request: NextRequest): string {
  // 优先使用用户 ID（如果已认证）
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // 使用 IP 地址
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

/**
 * 速率限制结果
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * 检查速率限制
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  // 如果 Redis 未配置，跳过速率限制
  if (!redis) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowInSeconds * 1000,
    }
  }

  try {
    const identifier = getClientIdentifier(request)
    const key = generateRateLimitKey(identifier)
    const now = Date.now()
    const windowMs = config.windowInSeconds * 1000

    // 获取当前窗口的请求数
    const currentCount = await redis.get(key)
    const count = currentCount ? parseInt(currentCount as string, 10) : 0

    // 计算重置时间
    const resetTime = now + windowMs

    // 检查是否超过限制
    if (count >= config.maxRequests) {
      const ttl = await redis.pttl(key)
      const retryAfter = ttl > 0 ? Math.ceil(ttl / 1000) : config.windowInSeconds

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: resetTime,
        retryAfter,
      }
    }

    // 增加计数
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.pexpire(key, windowMs)
    await pipeline.exec()

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - count - 1,
      reset: resetTime,
    }
  } catch (error) {
    console.error('速率限制检查失败:', error)
    
    // 失败时允许请求通过（安全优先）
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowInSeconds * 1000,
    }
  }
}

/**
 * 创建速率限制响应头
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  }
}

/**
 * 速率限制中间件
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  return async (request: NextRequest): Promise<Response> => {
    const result = await checkRateLimit(request, config)

    if (!result.success) {
      const headers = createRateLimitHeaders(result)
      
      return NextResponse.json(
        {
          success: false,
          error: '请求过于频繁，请稍后再试',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers,
        }
      )
    }

    // 添加速率限制头到响应
    const response = await handler(request)
    
    const headers = createRateLimitHeaders(result)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * 重置指定标识的速率限制
 */
export async function resetRateLimit(identifier: string, type: string = 'api'): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  const key = generateRateLimitKey(identifier, type)
  await redis.del(key)
}

/**
 * 获取指定标识的速率限制状态
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{
  count: number
  limit: number
  remaining: number
  reset: number
}> {
  const redis = getRedisClient()
  
  if (!redis) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowInSeconds * 1000,
    }
  }

  const key = generateRateLimitKey(identifier)
  const currentCount = await redis.get(key)
  const count = currentCount ? parseInt(currentCount as string, 10) : 0
  const ttl = await redis.pttl(key)

  return {
    count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    reset: Date.now() + (ttl > 0 ? ttl : config.windowInSeconds * 1000),
  }
}
