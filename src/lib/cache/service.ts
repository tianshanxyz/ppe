// 缓存服务 - 用于性能优化
// 支持内存缓存和Redis（生产环境）

interface CacheEntry<T> {
  value: T
  expiry: number | null
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly defaultTTL: number = 5 * 60 * 1000
  private readonly maxSize: number = 1000

  private evictIfNeeded(): void {
    if (this.memoryCache.size < this.maxSize) return

    const now = Date.now()
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.memoryCache.delete(key)
        if (this.memoryCache.size < this.maxSize) return
      }
      if (entry.expiry !== null && entry.expiry < oldestTime) {
        oldestTime = entry.expiry
        oldestKey = key
      }
    }

    if (oldestKey && this.memoryCache.size >= this.maxSize) {
      this.memoryCache.delete(oldestKey)
    }
  }

  // 获取缓存值
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      return null
    }

    // 检查是否过期
    if (entry.expiry && Date.now() > entry.expiry) {
      this.memoryCache.delete(key)
      return null
    }

    return entry.value as T
  }

  // 设置缓存值
  set<T>(key: string, value: T, ttl?: number): void {
    this.evictIfNeeded()

    const expiry = ttl !== undefined 
      ? Date.now() + (ttl === 0 ? 0 : ttl)
      : Date.now() + this.defaultTTL

    this.memoryCache.set(key, {
      value,
      expiry: ttl === 0 ? null : expiry,
    })
  }

  // 删除缓存值
  delete(key: string): void {
    this.memoryCache.delete(key)
  }

  // 清空缓存
  clear(): void {
    this.memoryCache.clear()
  }

  // 获取或设置缓存
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttl)
    return value
  }

  // 批量获取
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key))
  }

  // 批量设置
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl)
    })
  }

  // 获取缓存统计
  getStats(): {
    size: number
    keys: string[]
  } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    }
  }

  // 清理过期缓存
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// 导出单例实例
export const cache = new CacheService()

// 缓存键生成器
export const cacheKeys = {
  // 产品相关
  products: {
    list: (filters: string) => `products:list:${filters}`,
    detail: (id: string) => `products:detail:${id}`,
    categories: () => 'products:categories',
    byCategory: (category: string) => `products:category:${category}`,
  },
  
  // 制造商相关
  manufacturers: {
    list: (filters: string) => `manufacturers:list:${filters}`,
    detail: (id: string) => `manufacturers:detail:${id}`,
    stats: () => 'manufacturers:stats',
  },
  
  // 法规相关
  regulations: {
    list: (filters: string) => `regulations:list:${filters}`,
    detail: (id: string) => `regulations:detail:${id}`,
    byMarket: (market: string) => `regulations:market:${market}`,
  },
  
  // 合规检查相关
  compliance: {
    checkResult: (productId: string, market: string) => 
      `compliance:check:${productId}:${market}`,
    requirements: (category: string, market: string) => 
      `compliance:requirements:${category}:${market}`,
  },
  
  // 用户相关
  user: {
    profile: (userId: string) => `user:profile:${userId}`,
    certificates: (userId: string) => `user:certificates:${userId}`,
    alerts: (userId: string) => `user:alerts:${userId}`,
  },
  
  // 搜索相关
  search: {
    suggestions: (query: string) => `search:suggestions:${query}`,
    results: (query: string, filters: string) => `search:results:${query}:${filters}`,
    popular: () => 'search:popular',
  },
  
  // 统计数据
  stats: {
    dashboard: () => 'stats:dashboard',
    marketAnalysis: (market: string) => `stats:market:${market}`,
    categoryStats: (category: string) => `stats:category:${category}`,
  },
}

// 缓存时间配置（毫秒）
export const cacheTTL = {
  // 短时间缓存（频繁变化的数据）
  short: 60 * 1000,        // 1分钟
  
  // 中等时间缓存
  medium: 5 * 60 * 1000,   // 5分钟
  
  // 长时间缓存（相对稳定的数据）
  long: 30 * 60 * 1000,    // 30分钟
  
  // 超长时间缓存（很少变化的数据）
  extended: 60 * 60 * 1000, // 1小时
  
  // 永久缓存（需要手动清除）
  permanent: 0,
}
