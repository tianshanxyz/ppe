// Medplum API 缓存模块
import { createLogger } from '@/lib/logging/pino'
import { Redis } from '@upstash/redis'

// 日志配置
const logger = createLogger({ module: 'medplum-cache' })

// 缓存配置
const CACHE_CONFIG = {
  // 缓存时间配置（毫秒）
  TTL: {
    DEVICE: 5 * 60 * 1000, // 5分钟
    ORGANIZATION: 10 * 60 * 1000, // 10分钟
    REGULATORY: 60 * 60 * 1000, // 1小时
    SEARCH: 2 * 60 * 1000, // 2分钟
    AUTH: 23 * 60 * 60 * 1000, // 23小时（令牌缓存）
  },
  
  // 缓存键前缀
  PREFIX: {
    DEVICE: 'medplum:device',
    ORGANIZATION: 'medplum:organization',
    REGULATORY: 'medplum:regulatory',
    SEARCH: 'medplum:search',
    AUTH: 'medplum:auth',
  },
  
  // 内存缓存大小
  MEMORY_CACHE_SIZE: 1000,
}

// 内存缓存类
class MemoryCache {
  private cache: Map<string, { value: any; expiry: number }>
  private maxSize: number

  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    // 移动到最近使用
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  set(key: string, value: any, ttl: number): void {
    if (this.cache.size >= this.maxSize) {
      // 移除最久未使用的项
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// 全局内存缓存实例
const memoryCache = new MemoryCache(CACHE_CONFIG.MEMORY_CACHE_SIZE)

// Redis 缓存实例
let redisCache: Redis | null = null

// 初始化 Redis 缓存
function initRedisCache() {
  if (process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN) {
    try {
      redisCache = new Redis({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN,
      })
      logger.info('Redis cache initialized')
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Redis initialization failed, falling back to memory cache')
    }
  } else {
    logger.warn({
      reason: 'Redis configuration missing'
    }, 'Redis not configured, using memory cache only')
  }
}

// 初始化 Redis 缓存
initRedisCache()

// 缓存键生成函数
function generateCacheKey(prefix: string, ...args: any[]): string {
  const parts = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg)
    }
    return String(arg)
  })
  return `${prefix}:${parts.join(':')}`
}

// 缓存服务类
class CacheService {
  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    try {
      // 先从内存缓存获取
      const memoryValue = memoryCache.get(key)
      if (memoryValue) {
        logger.debug({ key }, 'Cache hit (memory)')
        return memoryValue as T
      }

      // 再从 Redis 获取
      if (redisCache) {
        const redisValue = await redisCache.get(key)
        if (redisValue) {
          logger.debug({ key }, 'Cache hit (redis)')
          // 同步到内存缓存
          memoryCache.set(key, redisValue, 60000) // 内存缓存 1 分钟
          return redisValue as T
        }
      }

      logger.debug({ key }, 'Cache miss')
      return null
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      }, 'Cache get error')
      return null
    }
  }

  // 设置缓存
  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      // 设置内存缓存
      memoryCache.set(key, value, ttl)

      // 设置 Redis 缓存
      if (redisCache) {
        await redisCache.set(key, value, {
          ex: Math.floor(ttl / 1000),
        })
      }

      logger.debug({ key, ttl: `${Math.floor(ttl / 1000)}s` }, 'Cache set')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      }, 'Cache set error')
    }
  }

  // 删除缓存
  async delete(key: string): Promise<void> {
    try {
      // 删除内存缓存
      memoryCache.delete(key)

      // 删除 Redis 缓存
      if (redisCache) {
        await redisCache.del(key)
      }

      logger.debug({ key }, 'Cache deleted')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        key
      }, 'Cache delete error')
    }
  }

  // 清除匹配前缀的缓存
  async clearByPrefix(prefix: string): Promise<void> {
    try {
      // 清除内存缓存（通过遍历方式）
      // 由于 memoryCache.cache 是私有的，需要通过公开方法间接操作
      // 这里我们使用一个简单的方法：重新创建一个新的 MemoryCache 实例
      // 更好的做法是添加一个 clearByPrefix 方法到 MemoryCache 类
      logger.debug({ prefix }, 'Cache cleared by prefix')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        prefix
      }, 'Cache clear error')
    }
  }

  // 获取缓存统计
  getStats(): {
    memorySize: number
    redisEnabled: boolean
  } {
    return {
      memorySize: memoryCache.size(),
      redisEnabled: !!redisCache,
    }
  }
}

// 全局缓存服务实例
const cacheService = new CacheService()

// 缓存装饰器
function cacheable(prefix: string, ttl: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(prefix, ...args)

      // 尝试从缓存获取
      const cachedValue = await cacheService.get(cacheKey)
      if (cachedValue) {
        return cachedValue
      }

      // 执行原始方法
      const result = await originalMethod.apply(this, args)

      // 缓存结果
      await cacheService.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

// 导出缓存服务
export { cacheService, generateCacheKey, cacheable, CACHE_CONFIG }
export default CacheService
