/**
 * Semantic Search API - 语义搜索接口
 * 
 * 功能：
 * 1. 语义相似度搜索
 * 2. 混合搜索（语义+关键词）
 * 3. 实体类型过滤
 * 4. 搜索结果排序和阈值控制
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { semanticSearch, hybridSearch, EntityType } from '@/lib/ai/vector-store'
import { generateEmbedding } from '@/lib/ai/embedding'
import { validateSearchQuery, validatePagination, escapeIlikeSearch } from '@/lib/security/sanitize'

export interface SemanticSearchRequest {
  query: string
  searchType?: 'semantic' | 'hybrid' | 'keyword'
  entityTypes?: EntityType[]
  limit?: number
  threshold?: number
  semanticWeight?: number
  keywordWeight?: number
}

export interface SemanticSearchResponse {
  success: boolean
  results: Array<{
    id: string
    entityType: EntityType
    entityId: string
    content: string
    similarity: number
    semanticScore?: number
    keywordScore?: number
    combinedScore?: number
    metadata?: Record<string, unknown>
    entity?: unknown // 关联的完整实体数据
  }>
  total: number
  query: string
  searchType: string
  responseTimeMs: number
  tokenUsage?: number
}

/**
 * POST /api/search/semantic
 * 执行语义搜索
 */
export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const startTime = Date.now()
    
    try {
      const body: SemanticSearchRequest = await request.json()
      const { 
        query, 
        searchType = 'hybrid',
        entityTypes,
        limit = 20,
        threshold = 0.5,
        semanticWeight = 0.7,
        keywordWeight = 0.3,
      } = body

      // 验证搜索查询
      const queryValidation = validateSearchQuery(query)
      if (!queryValidation.valid) {
        return NextResponse.json(
          { error: queryValidation.error },
          { status: 400 }
        )
      }

      // 验证分页参数
      const paginationValidation = validatePagination(undefined, String(limit))
      if (!paginationValidation.valid) {
        return NextResponse.json(
          { error: paginationValidation.error },
          { status: 400 }
        )
      }

      const sanitizedQuery = queryValidation.sanitized
      const sanitizedLimit = Math.min(paginationValidation.limit, 50)

      let results
      let tokenUsage = 0

      // 执行搜索
      if (searchType === 'semantic') {
        results = await semanticSearch(sanitizedQuery, {
          limit: sanitizedLimit,
          threshold,
          entityTypes,
        })
      } else if (searchType === 'hybrid') {
        results = await hybridSearch(sanitizedQuery, {
          limit: sanitizedLimit,
          threshold,
          entityTypes,
          semanticWeight,
          keywordWeight,
        })
      } else {
        // 关键词搜索 - 使用原有的pg_trgm搜索
        results = await keywordSearchOnly(sanitizedQuery, {
          limit: sanitizedLimit,
          entityTypes,
        })
      }

      // 获取完整实体数据
      const enrichedResults = await enrichResults(results)

      // 记录搜索日志
      await logSearch(sanitizedQuery, enrichedResults.length, searchType, Date.now() - startTime)

      const responseTimeMs = Date.now() - startTime

      return NextResponse.json({
        success: true,
        results: enrichedResults,
        total: enrichedResults.length,
        query: sanitizedQuery,
        searchType,
        responseTimeMs,
        tokenUsage,
      } as SemanticSearchResponse)

    } catch (error) {
      console.error('Semantic search error:', error)
      
      const responseTimeMs = Date.now() - startTime
      
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed',
          results: [],
          total: 0,
          query: '',
          searchType: 'error',
          responseTimeMs,
        } as SemanticSearchResponse,
        { status: 500 }
      )
    }
  }, {
    maxRequests: 30,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}

/**
 * GET /api/search/semantic
 * 简化版语义搜索（用于快速查询）
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const startTime = Date.now()
    
    try {
      const searchParams = request.nextUrl.searchParams
      const query = searchParams.get('q') || ''
      const searchType = (searchParams.get('type') as 'semantic' | 'hybrid' | 'keyword') || 'hybrid'
      const entityTypeParam = searchParams.get('entityTypes')
      const limitParam = searchParams.get('limit') || '20'
      const thresholdParam = searchParams.get('threshold') || '0.5'

      // 验证查询
      const queryValidation = validateSearchQuery(query)
      if (!queryValidation.valid) {
        return NextResponse.json(
          { error: queryValidation.error },
          { status: 400 }
        )
      }

      const entityTypes = entityTypeParam 
        ? entityTypeParam.split(',').filter(Boolean) as EntityType[]
        : undefined

      const limit = Math.min(parseInt(limitParam) || 20, 50)
      const threshold = parseFloat(thresholdParam) || 0.5

      let results

      if (searchType === 'semantic') {
        results = await semanticSearch(queryValidation.sanitized, {
          limit,
          threshold,
          entityTypes,
        })
      } else if (searchType === 'hybrid') {
        results = await hybridSearch(queryValidation.sanitized, {
          limit,
          threshold,
          entityTypes,
        })
      } else {
        results = await keywordSearchOnly(queryValidation.sanitized, {
          limit,
          entityTypes,
        })
      }

      // 获取完整实体数据
      const enrichedResults = await enrichResults(results)

      const responseTimeMs = Date.now() - startTime

      return NextResponse.json({
        success: true,
        results: enrichedResults,
        total: enrichedResults.length,
        query: queryValidation.sanitized,
        searchType,
        responseTimeMs,
      } as SemanticSearchResponse)

    } catch (error) {
      console.error('Semantic search GET error:', error)
      
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed',
          results: [],
          total: 0,
          query: '',
          searchType: 'error',
          responseTimeMs: Date.now() - startTime,
        } as SemanticSearchResponse,
        { status: 500 }
      )
    }
  }, {
    maxRequests: 50,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}

/**
 * 仅关键词搜索（降级方案）
 */
async function keywordSearchOnly(
  query: string,
  options: { limit: number; entityTypes?: EntityType[] }
): Promise<Array<{
  id: string
  entityType: EntityType
  entityId: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
}>> {
  
      const supabase = await createClient()

  // 构建关键词搜索查询
  let dbQuery = supabase
    .from('vector_embeddings')
    .select('*')
    .ilike('content', `%${escapeIlikeSearch(query)}%`)
    .limit(options.limit)

  if (options.entityTypes && options.entityTypes.length > 0) {
    dbQuery = dbQuery.in('entity_type', options.entityTypes)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Keyword search error:', error)
    return []
  }

  return (data || []).map((record: {
    id: string
    entity_type: EntityType
    entity_id: string
    content: string
    metadata: Record<string, unknown>
  }) => ({
    id: record.id,
    entityType: record.entity_type,
    entityId: record.entity_id,
    content: record.content,
    similarity: 0.7, // 关键词匹配默认分数
    metadata: record.metadata,
  }))
}

/**
 * 丰富搜索结果（获取完整实体数据）
 */
async function enrichResults(
  results: Array<{
    id: string
    entityType: EntityType
    entityId: string
    content: string
    similarity: number
    semanticScore?: number
    keywordScore?: number
    combinedScore?: number
    metadata?: Record<string, unknown>
  }>
): Promise<Array<{
  id: string
  entityType: EntityType
  entityId: string
  content: string
  similarity: number
  semanticScore?: number
  keywordScore?: number
  combinedScore?: number
  metadata?: Record<string, unknown>
  entity?: unknown
}>> {
  if (results.length === 0) return []

  
      const supabase = await createClient()

  // 按实体类型分组
  const groupedByType = results.reduce((acc, result) => {
    if (!acc[result.entityType]) {
      acc[result.entityType] = []
    }
    acc[result.entityType].push(result)
    return acc
  }, {} as Record<EntityType, typeof results>)

  const enrichedResults: Array<{
    id: string
    entityType: EntityType
    entityId: string
    content: string
    similarity: number
    semanticScore?: number
    keywordScore?: number
    combinedScore?: number
    metadata?: Record<string, unknown>
    entity?: unknown
  }> = []

  // 并行获取各类型实体数据
  await Promise.all(
    Object.entries(groupedByType).map(async ([entityType, typeResults]) => {
      const entityIds = typeResults.map(r => r.entityId)

      let entityData: Record<string, unknown>[] = []

      if (entityType === 'product') {
        const { data } = await supabase
          .from('all_products')
          .select('*')
          .in('id', entityIds)
        entityData = data || []
      } else if (entityType === 'company') {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .in('id', entityIds)
        entityData = data || []
      } else if (entityType === 'regulation') {
        const { data } = await supabase
          .from('regulations')
          .select('*')
          .in('id', entityIds)
        entityData = data || []
      }

      // 创建实体ID到数据的映射
      const entityMap = new Map(entityData.map(e => [e.id, e]))

      // 合并结果
      typeResults.forEach(result => {
        enrichedResults.push({
          ...result,
          entity: entityMap.get(result.entityId),
        })
      })
    })
  )

  // 按相似度排序
  return enrichedResults.sort((a, b) => {
    const scoreA = a.combinedScore || a.similarity
    const scoreB = b.combinedScore || b.similarity
    return scoreB - scoreA
  })
}

/**
 * 记录搜索日志
 */
async function logSearch(
  query: string,
  resultsCount: number,
  searchType: string,
  responseTimeMs: number
): Promise<void> {
  try {
    
      const supabase = await createClient()

    await supabase
      .from('semantic_search_logs')
      .insert({
        query,
        results_count: resultsCount,
        search_type: searchType,
        response_time_ms: responseTimeMs,
      })
  } catch (error) {
    // 日志记录失败不影响主流程
    console.error('Failed to log search:', error)
  }
}
