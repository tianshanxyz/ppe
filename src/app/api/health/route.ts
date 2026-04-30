/**
 * 健康检查 API
 * 
 * 提供系统健康状态检查端点，用于监控和运维
 * 
 * @module app/api/health/route
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'

/**
 * 健康状态接口
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: ServiceStatus
    redis?: ServiceStatus
    api: ServiceStatus
  }
  checks: {
    database_connected: boolean
    redis_connected: boolean
    environment_valid: boolean
  }
}

/**
 * 服务状态接口
 */
interface ServiceStatus {
  status: 'ok' | 'error' | 'warning'
  message?: string
  latency_ms?: number
  last_check: string
}

/**
 * 检查数据库连接
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    
      const supabase = await createClient()
    
    // 执行简单的查询测试连接
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('id')
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      console.error('Database health check failed:', error)
      return {
        status: 'error',
        message: error.message,
        latency_ms: latency,
        last_check: new Date().toISOString(),
      }
    }
    
    return {
      status: 'ok',
      message: 'Database connection successful',
      latency_ms: latency,
      last_check: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Database health check error:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
    }
  }
}

/**
 * 检查 Redis 连接
 */
async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    // 检查环境变量
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (!redisUrl || !redisToken) {
      return {
        status: 'warning',
        message: 'Redis not configured (optional service)',
        last_check: new Date().toISOString(),
      }
    }
    
    // 创建 Redis 客户端并测试连接
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
    
    // 执行 PING 测试
    const result = await redis.ping()
    const latency = Date.now() - startTime
    
    if (result === 'PONG') {
      return {
        status: 'ok',
        message: 'Redis connection successful',
        latency_ms: latency,
        last_check: new Date().toISOString(),
      }
    } else {
      return {
        status: 'error',
        message: 'Redis ping failed',
        latency_ms: latency,
        last_check: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Redis health check error:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
    }
  }
}

/**
 * 检查环境变量
 */
function checkEnvironment(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  return requiredEnvVars.every(envVar => !!process.env[envVar])
}

/**
 * 计算整体健康状态
 */
function calculateOverallStatus(
  dbStatus: ServiceStatus,
  redisStatus: ServiceStatus | null,
  envValid: boolean
): 'healthy' | 'degraded' | 'unhealthy' {
  // 如果数据库或环境变量有问题，整体不健康
  if (dbStatus.status === 'error' || !envValid) {
    return 'unhealthy'
  }
  
  // 如果 Redis 有问题但不是关键服务，降级
  if (redisStatus && redisStatus.status === 'error') {
    return 'degraded'
  }
  
  // 如果有警告，降级
  if (dbStatus.status === 'warning' || (redisStatus && redisStatus.status === 'warning')) {
    return 'degraded'
  }
  
  return 'healthy'
}

/**
 * 验证 Authorization header
 * 
 * 支持 Bearer token 和 Basic auth 两种方式
 * Bearer token 需与环境变量 HEALTH_CHECK_TOKEN 匹配
 * Basic auth 需与环境变量 HEALTH_CHECK_USER/HEALTH_CHECK_PASS 匹配
 * 生产环境必须配置环境变量，否则拒绝访问
 */
function verifyAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    return false
  }
  
  // 生产环境必须配置环境变量
  const expectedToken = process.env.HEALTH_CHECK_TOKEN
  const expectedUser = process.env.HEALTH_CHECK_USER
  const expectedPass = process.env.HEALTH_CHECK_PASS
  
  // 如果没有配置任何环境变量，拒绝访问（生产安全）
  if (!expectedToken && !expectedUser && !expectedPass) {
    console.warn('Health check authentication not configured - access denied')
    return false
  }
  
  // Bearer Token 验证
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (!expectedToken) return false
    return token === expectedToken
  }
  
  // Basic Auth 验证
  if (authHeader.startsWith('Basic ')) {
    const credentials = authHeader.substring(6)
    if (!expectedUser || !expectedPass) return false
    const expectedCredentials = Buffer.from(`${expectedUser}:${expectedPass}`).toString('base64')
    return credentials === expectedCredentials
  }
  
  return false
}

/**
 * GET /api/health
 * 
 * 健康检查端点
 * 
 * 查询参数:
 * - detailed: 是否返回详细信息 (默认：false) - 需要认证
 * - service: 检查特定服务 (database|redis|api)
 * 
 * 认证说明:
 * - 普通健康检查（不带 detailed）公开访问
 * - detailed=true 时需要 Authorization header
 * - 支持 Bearer token 和 Basic auth
 * 
 * @returns 健康状态报告
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'
  const serviceFilter = searchParams.get('service')
  
  // detailed 模式需要认证
  if (detailed && !verifyAuth(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Authorization header required for detailed health check',
        message: 'Provide Authorization header with Bearer token or Basic auth',
      },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="Health Check API"',
        },
      }
    )
  }
  
  try {
    // 并行执行所有检查
    const [dbStatus, redisStatus, envValid] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkEnvironment(),
    ])
    
    // 如果指定了服务过滤，只返回该服务状态
    if (serviceFilter) {
      const serviceStatusMap: Record<string, ServiceStatus> = {
        database: dbStatus,
        redis: redisStatus,
        api: {
          status: 'ok',
          message: 'API is running',
          last_check: new Date().toISOString(),
        },
      }
      
      const serviceStatus = serviceStatusMap[serviceFilter]
      
      if (!serviceStatus) {
        return NextResponse.json(
          {
            success: false,
            error: `Unknown service: ${serviceFilter}. Valid options: database, redis, api`,
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        service: serviceFilter,
        status: serviceStatus,
        timestamp: new Date().toISOString(),
      })
    }
    
    // 计算整体状态
    const overallStatus = calculateOverallStatus(dbStatus, redisStatus, envValid)
    
    // 构建响应
    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        api: {
          status: 'ok',
          message: 'API is running',
          last_check: new Date().toISOString(),
        },
      },
      checks: {
        database_connected: dbStatus.status === 'ok',
        redis_connected: redisStatus ? redisStatus.status === 'ok' : false,
        environment_valid: envValid,
      },
    }
    
    // 如果 Redis 已配置，添加到响应
    if (redisStatus) {
      response.services.redis = redisStatus
    }
    
    // 如果请求详细信息，添加额外信息
    if (detailed) {
      const detailedResponse = response as HealthStatus & {
        environment: Record<string, boolean>
        performance: {
          total_check_time_ms: number
          database_latency_ms: number
          redis_latency_ms?: number
        }
      }
      
      detailedResponse.environment = {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        redis_url: !!process.env.UPSTASH_REDIS_REST_URL,
        redis_token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      }
      
      detailedResponse.performance = {
        total_check_time_ms: Date.now() - startTime,
        database_latency_ms: dbStatus.latency_ms || 0,
        redis_latency_ms: redisStatus?.latency_ms,
      }
      
      return NextResponse.json(detailedResponse)
    }
    
    // 简化响应（默认）
    const simpleResponse = {
      status: response.status,
      timestamp: response.timestamp,
      version: response.version,
      checks: response.checks,
    }
    
    // 根据健康状态设置 HTTP 状态码
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200
    
    return NextResponse.json(simpleResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overallStatus,
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}

/**
 * HEAD /api/health
 * 
 * 轻量级健康检查（只检查 API 是否响应）
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': 'ok',
    },
  })
}
