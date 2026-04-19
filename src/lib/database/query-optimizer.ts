/**
 * 数据库查询优化工具
 * 
 * 提供查询性能分析、缓存和索引建议功能
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logDatabaseQuery, logPerformance } from '../logging/logger';

export interface QueryMetrics {
  duration: number;
  rowsAffected: number;
  cacheHit: boolean;
  indexUsed: boolean;
}

export interface CachedQuery {
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number;
}

/**
 * 查询缓存管理器
 */
class QueryCache {
  private cache: Map<string, CachedQuery>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 分钟
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 生成缓存键
   */
  private generateKey(query: string, params?: unknown[]): string {
    return `${query}:${JSON.stringify(params || [])}`;
  }

  /**
   * 获取缓存数据
   */
  get<T>(query: string, params?: unknown[]): T | null {
    const key = this.generateKey(query, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存数据
   */
  set<T>(query: string, params: unknown[] | undefined, data: T, ttl?: number): void {
    const key = this.generateKey(query, params);
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * 清除缓存
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * 查询优化器
 */
class QueryOptimizer {
  private cache: QueryCache;
  private slowQueryThreshold: number;

  constructor(slowQueryThreshold: number = 1000) {
    this.cache = new QueryCache();
    this.slowQueryThreshold = slowQueryThreshold;
  }

  /**
   * 执行带缓存的查询
   */
  async executeWithCache<T>(
    supabase: SupabaseClient,
    queryBuilder: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>,
    cacheKey: string,
    useCache: boolean = true
  ): Promise<{ data: T | null; error: unknown; fromCache: boolean }> {
    // 尝试从缓存获取
    if (useCache) {
      const cachedData = this.cache.get<T>(cacheKey, []);
      if (cachedData) {
        logPerformance('cache_hit', 0, this.slowQueryThreshold, { cacheKey });
        return { data: cachedData, error: null, fromCache: true };
      }
    }

    // 执行实际查询
    const startTime = Date.now();
    const result = await queryBuilder(supabase);
    const duration = Date.now() - startTime;

    // 记录查询性能
    logDatabaseQuery(cacheKey, duration, []);

    // 检查是否为慢查询
    if (duration > this.slowQueryThreshold) {
      logPerformance('slow_query', duration, this.slowQueryThreshold, {
        query: cacheKey,
        suggestion: 'Consider adding index or optimizing query',
      });
    }

    // 缓存成功结果
    if (!result.error && result.data) {
      this.cache.set(cacheKey, [], result.data);
    }

    return {
      data: result.data,
      error: result.error,
      fromCache: false,
    };
  }

  /**
   * 优化搜索查询
   */
  async optimizeSearch(
    supabase: SupabaseClient,
    table: string,
    searchColumn: string,
    searchTerm: string,
    filters?: Record<string, any>
  ): Promise<{ data: unknown[]; error: unknown }> {
    const startTime = Date.now();

    try {
      let query = supabase
        .from(table)
        .select('*')
        .ilike(searchColumn, `%${searchTerm}%`);

      // 应用过滤器
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // 限制结果数量
      query = query.limit(100);

      const { data, error } = await query;
      const duration = Date.now() - startTime;

      logDatabaseQuery(`search:${table}:${searchColumn}`, duration, [searchTerm]);

      if (error) {
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量查询优化
   */
  async executeBatch<T>(
    supabase: SupabaseClient,
    queries: Array<(client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>>,
    batchSize: number = 5
  ): Promise<Array<{ data: T | null; error: unknown }>> {
    const results: Array<{ data: T | null; error: unknown }> = [];

    // 分批执行查询
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      const batchResults = await Promise.all(batch.map(q => q(supabase)));
      results.push(...batchResults);

      const batchDuration = Date.now() - batchStartTime;
      logPerformance(`batch_execution_${i / batchSize}`, batchDuration, this.slowQueryThreshold);
    }

    return results;
  }

  /**
   * 分析查询性能
   */
  analyzeQuery(duration: number, rowsReturned: number): {
    performance: 'fast' | 'normal' | 'slow' | 'very_slow';
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    let performance: 'fast' | 'normal' | 'slow' | 'very_slow';

    if (duration < 100) {
      performance = 'fast';
    } else if (duration < 500) {
      performance = 'normal';
    } else if (duration < 2000) {
      performance = 'slow';
      suggestions.push('Consider adding an index on filtered/sorted columns');
    } else {
      performance = 'very_slow';
      suggestions.push('Urgent: Query needs optimization');
      suggestions.push('Add appropriate indexes');
      suggestions.push('Consider query result caching');
      suggestions.push('Review query execution plan');
    }

    if (rowsReturned > 1000) {
      suggestions.push('Consider pagination to reduce data transfer');
    }

    return { performance, suggestions };
  }

  /**
   * 获取缓存实例
   */
  getCache(): QueryCache {
    return this.cache;
  }
}

/**
 * 创建查询优化器实例
 */
export function createQueryOptimizer(slowQueryThreshold?: number): QueryOptimizer {
  return new QueryOptimizer(slowQueryThreshold);
}

/**
 * 默认查询优化器
 */
export const defaultOptimizer = createQueryOptimizer();

/**
 * 索引建议生成器
 */
export function suggestIndexes(
  table: string,
  queries: Array<{
    columns: string[];
    filters: string[];
    sorts: string[];
  }>
): string[] {
  const indexes: string[] = [];

  queries.forEach((query, index) => {
    // 为过滤列建议索引
    query.filters.forEach((column) => {
      indexes.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});`);
    });

    // 为排序列建议索引
    query.sorts.forEach((column) => {
      indexes.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${column}_sort ON ${table}(${column});`);
    });

    // 为组合查询建议复合索引
    if (query.filters.length > 1) {
      const compositeColumns = query.filters.slice(0, 3).join(', ');
      indexes.push(
        `CREATE INDEX IF NOT EXISTS idx_${table}_composite_${index} ON ${table}(${compositeColumns});`
      );
    }
  });

  // 去重
  return Array.from(new Set(indexes));
}

/**
 * 查询性能监控中间件
 */
export function withQueryMonitoring<T extends (...args: unknown[]) => Promise<any>>(
  fn: T,
  queryName: string
): T {
  return (async (...args: unknown[]) => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      logDatabaseQuery(queryName, duration, args);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logDatabaseQuery(`${queryName} (failed)`, duration, args);
      throw error;
    }
  }) as T;
}

export default QueryOptimizer;
