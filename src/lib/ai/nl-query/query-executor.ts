/**
 * 查询执行器
 * 
 * 将结构化查询转换为数据库操作并执行
 * A-003: AI助手升级（自然语言查询）
 */

import { createClient } from '@/lib/supabase/client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'
import {
  StructuredQuery,
  QueryExecutionResult,
  QueryCondition,
  EntityType,
} from './types'

// ============================================
// 数据库表映射
// ============================================

const ENTITY_TABLE_MAP: Record<EntityType, { table: string; fields: string[] }> = {
  product: {
    table: 'ppe_products',
    fields: ['id', 'product_name', 'company_name', 'market', 'device_class', 'product_code', 'status', 'registration_number'],
  },
  company: {
    table: 'ppe_manufacturers',
    fields: ['id', 'company_name', 'country', 'registration_number', 'status', 'credit_score'],
  },
  regulation: {
    table: 'regulations',
    fields: ['id', 'title', 'jurisdiction', 'regulation_type', 'effective_date'],
  },
  certification: {
    table: 'certifications',
    fields: ['id', 'certificate_number', 'certification_type', 'status', 'issue_date', 'expiry_date'],
  },
  market: {
    table: 'markets',
    fields: ['id', 'name', 'code', 'region'],
  },
}

// ============================================
// 字段映射（别名到实际字段）
// ============================================

const FIELD_ALIASES: Record<string, Record<string, string>> = {
  product: {
    name: 'product_name',
    company: 'company_name',
    class: 'device_class',
    code: 'product_code',
  },
  company: {
    name: 'company_name',
    country: 'country',
    registration: 'registration_number',
  },
}

// ============================================
// 查询构建器
// ============================================

export class QueryBuilder {
  private entityType: EntityType
  private table: string

  constructor(entityType: EntityType) {
    this.entityType = entityType
    this.table = ENTITY_TABLE_MAP[entityType].table
  }

  /**
   * 构建 Supabase 查询
   */
  async buildQuery(structuredQuery: StructuredQuery) {
    const { filters, sort, pagination, fields } = structuredQuery

    // 开始构建查询
    const supabase = createClient()
    const defaultFields = ENTITY_TABLE_MAP[this.entityType].fields
    const selectFields = fields || defaultFields
    let query = supabase.from(this.table).select(selectFields.join(','), { count: 'exact' })

    // 应用过滤条件
    query = this.applyFilters(query, filters)

    // 应用排序
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    }

    // 应用分页
    query = query.range(pagination.offset, pagination.offset + pagination.pageSize - 1)

    return query
  }

  /**
   * 应用过滤条件
   */
  private applyFilters(query: any, filters: QueryCondition[]): any {
    for (const filter of filters) {
      const field = this.resolveFieldName(filter.field)
      const { operator, value } = filter

      switch (operator) {
        case 'eq':
          query = query.eq(field, value)
          break
        case 'neq':
          query = query.neq(field, value)
          break
        case 'gt':
          query = query.gt(field, value)
          break
        case 'gte':
          query = query.gte(field, value)
          break
        case 'lt':
          query = query.lt(field, value)
          break
        case 'lte':
          query = query.lte(field, value)
          break
        case 'like':
          query = query.ilike(field, `%${escapeIlikeSearch(String(value))}%`)
          break
        case 'in':
          if (Array.isArray(value)) {
            query = query.in(field, value)
          }
          break
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            query = query.gte(field, value[0]).lte(field, value[1])
          }
          break
      }
    }

    return query
  }

  /**
   * 解析字段名（处理别名）
   */
  private resolveFieldName(field: string): string {
    const aliases = FIELD_ALIASES[this.entityType] || {}
    return aliases[field] || field
  }
}

// ============================================
// 查询执行器
// ============================================

export class QueryExecutor {
  /**
   * 执行结构化查询
   */
  async execute<T = unknown>(structuredQuery: StructuredQuery): Promise<QueryExecutionResult<T>> {
    const startTime = Date.now()

    try {
      const builder = new QueryBuilder(structuredQuery.entityType)
      const query = await builder.buildQuery(structuredQuery)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database query error: ${error.message}`)
      }

      const executionTimeMs = Date.now() - startTime

      return {
        success: true,
        data: (data as T[]) || [],
        total: count || 0,
        page: structuredQuery.pagination.page,
        pageSize: structuredQuery.pagination.pageSize,
        executionTimeMs,
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        page: structuredQuery.pagination.page,
        pageSize: structuredQuery.pagination.pageSize,
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 执行聚合查询（用于分析）
   */
  async executeAggregation(
    entityType: EntityType,
    aggregation: { field: string; function: 'count' | 'sum' | 'avg' | 'max' | 'min' }
  ): Promise<number> {
    const ALLOWED_AGG_FUNCTIONS = ['count', 'sum', 'avg', 'max', 'min'] as const
    if (!ALLOWED_AGG_FUNCTIONS.includes(aggregation.function)) {
      throw new Error(`Invalid aggregation function: ${aggregation.function}`)
    }

    const supabase = createClient()
    const table = ENTITY_TABLE_MAP[entityType].table

    const { data, error } = await supabase
      .rpc(`get_${aggregation.function}`, {
        p_table: table,
        p_field: aggregation.field,
      })

    if (error) {
      console.error('Aggregation error:', error)
      return 0
    }

    return data || 0
  }

  /**
   * 获取相关数据（用于关联查询）
   */
  async getRelatedData(
    entityType: EntityType,
    entityId: string,
    relatedType: EntityType
  ): Promise<unknown[]> {
    const supabase = createClient()

    // 根据实体类型确定关联关系
    const relationMap: Record<string, Record<string, { table: string; field: string }>> = {
      company: {
        product: { table: 'ppe_products', field: 'company_id' },
        certification: { table: 'certifications', field: 'company_id' },
      },
      product: {
        company: { table: 'ppe_manufacturers', field: 'id' },
        certification: { table: 'certifications', field: 'product_id' },
      },
    }

    const relation = relationMap[entityType]?.[relatedType]
    if (!relation) {
      return []
    }

    const { data, error } = await supabase
      .from(relation.table)
      .select('*')
      .eq(relation.field, entityId)

    if (error) {
      console.error('Related data error:', error)
      return []
    }

    return data || []
  }
}

// 导出单例
export const queryExecutor = new QueryExecutor()
