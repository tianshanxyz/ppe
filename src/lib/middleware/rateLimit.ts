import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limit configuration
export interface RateLimitConfig {
  // Maximum requests allowed within the time window
  maxRequests: number
  // Time window in seconds
  windowInSeconds: number
  // Whether to increase limits for authenticated users
  enableAuthBoost?: boolean
  // Multiplier for authenticated users
  authBoostMultiplier?: number
}

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowInSeconds: 60,
  enableAuthBoost: true,
  authBoostMultiplier: 2,
}

// Redis client (singleton)
let redisClient: Redis | null = null

const memoryStore = new Map<string, { count: number; resetAt: number }>()
const MEMORY_STORE_MAX_SIZE = 10000

function getRedisClient(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      return null
    }

    try {
      redisClient = new Redis({
        url,
        token,
      })
    } catch (error) {
      console.warn('[rateLimit] Failed to create Redis client:', error)
      return null
    }
  }

  return redisClient
}

function checkMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowInSeconds * 1000
  const key = generateRateLimitKey(identifier)

  if (memoryStore.size >= MEMORY_STORE_MAX_SIZE) {
    const oldestKey = memoryStore.keys().next().value
    if (oldestKey) memoryStore.delete(oldestKey)
  }

  const entry = memoryStore.get(key)

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetAt,
  }
}

/**
 * Generate rate limit key
 */
function generateRateLimitKey(identifier: string, type: string = 'api'): string {
  return `ratelimit:${type}:${identifier}`
}

/**
 * Get client unique identifier
 */
function getClientIdentifier(request: NextRequest): string {
  try {
    // Prefer user ID (if authenticated)
    const userId = request.headers.get('x-user-id')
    if (userId) {
      return `user:${userId}`
    }

    // Use IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    return `ip:${ip}`
  } catch {
    return 'ip:unknown'
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  if (!redis) {
    const identifier = getClientIdentifier(request)
    return checkMemoryRateLimit(identifier, config)
  }

  try {
    const identifier = getClientIdentifier(request)
    const key = generateRateLimitKey(identifier)
    const now = Date.now()
    const windowMs = config.windowInSeconds * 1000

    // Get current window request count
    const currentCount = await redis.get(key)
    const count = currentCount ? parseInt(currentCount as string, 10) : 0

    // Calculate reset time
    const resetTime = now + windowMs

    // Check if limit exceeded
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

    // Increment count
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
    console.warn('[rateLimit] Rate limit check failed, allowing request through:', error)

    // On failure, allow the request through (availability over strictness)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowInSeconds * 1000,
    }
  }
}

/**
 * Create rate limit response headers
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
 * Rate limit middleware wrapper.
 *
 * Wraps an API handler with rate limiting. If the rate limit is exceeded,
 * returns 429 immediately. Otherwise calls the handler and appends rate
 * limit headers to the response.
 *
 * Errors from the rate limiter itself are caught and the request is allowed
 * through (availability over strictness). Errors from the handler are caught
 * and converted to a 500 response.
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  return async (request: NextRequest): Promise<Response> => {
    let result: RateLimitResult

    try {
      result = await checkRateLimit(request, config)
    } catch (error) {
      console.warn('[rateLimit] checkRateLimit threw unexpectedly, allowing request:', error)
      // If rate limit check itself throws, allow the request through
      return handler(request)
    }

    if (!result.success) {
      const headers = createRateLimitHeaders(result)

      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests, please try again later',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers,
        }
      )
    }

    try {
      // Call the wrapped handler
      const response = await handler(request)

      // Append rate limit headers — wrapped in try/catch because
      // response.headers may be immutable in some edge cases
      try {
        const headers = createRateLimitHeaders(result)
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      } catch {
        // Header setting is best-effort; don't fail the request over it
      }

      return response
    } catch (error) {
      console.error('[rateLimit] Handler threw an error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Reset rate limit for a given identifier
 */
export async function resetRateLimit(identifier: string, type: string = 'api'): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    const key = generateRateLimitKey(identifier, type)
    await redis.del(key)
  } catch (error) {
    console.warn('[rateLimit] Failed to reset rate limit:', error)
  }
}

/**
 * Get rate limit status for a given identifier
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

  try {
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
  } catch (error) {
    console.warn('[rateLimit] Failed to get rate limit status:', error)
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowInSeconds * 1000,
    }
  }
}
