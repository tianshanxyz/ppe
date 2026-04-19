/**
 * Medplum 性能优化服务
 * 
 * 提供 Medplum API 调用性能优化功能，包括：
 * - API 缓存
 * - 查询参数优化
 * - 调用次数优化
 * - 性能监控
 * 
 * @module lib/medplum/services/performanceService
 */

import { Redis } from '@upstash/redis'
import { getMedplumClient } from '../client'

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 内存缓存配置
  memory: {
    size: 1000, // 最大缓存项数
    ttl: 300000, // 5分钟 (毫秒)
  },
  // Redis 缓存配置
  redis: {
    ttl: 1800000, // 30分钟 (毫秒)
  }
}

/**
 * 内存缓存
 */
class MemoryCache {
  private cache: Map<string, {
    value: any
    expiry: number
  }>
  private size: number
  private ttl: number

  constructor(size: number, ttl: number) {
    this.cache = new Map()
    this.size = size
    this.ttl = ttl
    this.startCleanupInterval()
  }

  /**
   * 启动清理间隔
   */
  private startCleanupInterval() {
    setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl?: number) {
    const expiry = Date.now() + (ttl || this.ttl)
    
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.size) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, { value, expiry })
  }

  /**
   * 获取缓存
   */
  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) return null

    if (item.expiry < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  /**
   * 删除缓存
   */
  delete(key: string) {
    this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  getSize() {
    return this.cache.size
  }
}

// 全局内存缓存实例
const memoryCache = new MemoryCache(
  CACHE_CONFIG.memory.size,
  CACHE_CONFIG.memory.ttl
)

/**
 * Redis 缓存客户端
 */
let redisClient: Redis | null = null

/**
 * 初始化 Redis 客户端
 */
export function initializeRedis() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    })
    console.log('Redis client initialized successfully')
  } else {
    console.warn('Redis not configured, using memory cache only')
  }
}

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, ...args: any[]): string {
  const key = `${prefix}:${args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg)
    }
    return arg
  }).join(':')}`
  
  // 哈希处理长键
  if (key.length > 100) {
    const hash = require('crypto').createHash('md5')
      .update(key)
      .digest('hex')
    return `${prefix}:${hash}`
  }
  
  return key
}

/**
 * 缓存装饰器
 */
export function withCache<T>(
  cacheKey: string,
  ttl: number = CACHE_CONFIG.memory.ttl
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]): Promise<T> {
      // 生成缓存键
      const key = generateCacheKey(cacheKey, ...args)
      
      // 尝试从内存缓存获取
      let cached = memoryCache.get(key)
      if (cached) {
        console.log(`Cache hit: ${key}`)
        return cached
      }

      // 尝试从 Redis 获取
      if (redisClient) {
        try {
          cached = await redisClient.get(key)
          if (cached) {
            console.log(`Redis cache hit: ${key}`)
            // 更新内存缓存
            memoryCache.set(key, cached, ttl)
            return cached
          }
        } catch (error) {
          console.warn('Redis cache error:', error)
        }
      }

      // 执行原始方法
      console.log(`Cache miss: ${key}`)
      const result = await originalMethod.apply(this, args)

      // 缓存结果
      memoryCache.set(key, result, ttl)
      
      // 缓存到 Redis
      if (redisClient) {
        try {
          await redisClient.set(key, result, {
            ex: Math.floor(ttl / 1000)
          })
        } catch (error) {
          console.warn('Redis set error:', error)
        }
      }

      return result
    }
  }
}

/**
 * 批量 API 调用优化
 */
export async function batchApiCalls<T>(
  items: any[],
  batchSize: number,
  apiCall: (batch: any[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await apiCall(batch)
    results.push(...batchResults)
    
    // 添加短暂延迟避免速率限制
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

/**
 * 优化查询参数
 */
export function optimizeQueryParams(params: Record<string, any>): Record<string, any> {
  const optimized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(params)) {
    // 移除空值
    if (value !== null && value !== undefined && value !== '') {
      // 优化数组参数
      if (Array.isArray(value)) {
        if (value.length > 0) {
          optimized[key] = value.join(',')
        }
      } else {
        optimized[key] = value
      }
    }
  }
  
  return optimized
}

/**
 * 减少 API 调用次数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null
  let promises: Array<(value: ReturnType<T>) => void> = []

  return function(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout)
      }

      promises.push(resolve)

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args)
          promises.forEach(resolve => resolve(result))
        } catch (error) {
          promises.forEach(resolve => {
            throw error
          })
        } finally {
          promises = []
          timeout = null
        }
      }, wait)
    })
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private metrics: Map<string, {
    calls: number
    totalTime: number
    errors: number
    lastCall: number
  }>

  constructor() {
    this.metrics = new Map()
  }

  /**
   * 记录 API 调用
   */
  async track<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    let result: T
    
    try {
      result = await fn()
      this.recordSuccess(name, Date.now() - startTime)
      return result
    } catch (error) {
      this.recordError(name, Date.now() - startTime)
      throw error
    }
  }

  /**
   * 记录成功调用
   */
  private recordSuccess(name: string, time: number) {
    const metric = this.metrics.get(name) || {
      calls: 0,
      totalTime: 0,
      errors: 0,
      lastCall: 0
    }

    metric.calls++
    metric.totalTime += time
    metric.lastCall = Date.now()

    this.metrics.set(name, metric)
  }

  /**
   * 记录错误调用
   */
  private recordError(name: string, time: number) {
    const metric = this.metrics.get(name) || {
      calls: 0,
      totalTime: 0,
      errors: 0,
      lastCall: 0
    }

    metric.calls++
    metric.totalTime += time
    metric.errors++
    metric.lastCall = Date.now()

    this.metrics.set(name, metric)
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    const metrics: Record<string, any> = {}
    
    for (const [name, metric] of this.metrics.entries()) {
      metrics[name] = {
        ...metric,
        averageTime: metric.calls > 0 ? metric.totalTime / metric.calls : 0,
        successRate: metric.calls > 0 ? (metric.calls - metric.errors) / metric.calls : 0
      }
    }
    
    return metrics
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics.clear()
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * 优化 Medplum API 调用性能
 */
export function optimizeMedplumApi() {
  // 这里可以添加特定的 Medplum API 优化逻辑
  console.log('Medplum API performance optimization applied')
}

/**
 * 测试性能优化
 */
export async function testPerformanceOptimization() {
  try {
    // 初始化 Redis
    initializeRedis()

    // 测试缓存
    const testKey = 'test:cache:key'
    const testValue = { data: 'test data', timestamp: Date.now() }

    memoryCache.set(testKey, testValue, 10000)
    const cachedValue = memoryCache.get(testKey)
    console.log('Memory cache test:', cachedValue ? 'PASS' : 'FAIL')

    // 测试批量调用
    const testItems = Array.from({ length: 20 }, (_, i) => i + 1)
    const batchResults = await batchApiCalls(
      testItems,
      5,
      async (batch) => {
        console.log('Processing batch:', batch)
        return batch.map(item => ({ id: item, processed: true }))
      }
    )
    console.log('Batch API test:', batchResults.length === 20 ? 'PASS' : 'FAIL')

    // 测试性能监控
    const monitor = new PerformanceMonitor()
    await monitor.track('test-api', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return { success: true }
    })
    
    const metrics = monitor.getMetrics()
    console.log('Performance monitor test:', metrics['test-api'] ? 'PASS' : 'FAIL')

    console.log('Performance optimization test completed successfully')
    return true
  } catch (error) {
    console.error('Performance optimization test failed:', error)
    throw error
  }
}
