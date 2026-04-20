/**
 * Vector Store Service - 向量存储和检索服务
 * 
 * 功能：
 * 1. 向量数据的增删改查
 * 2. 相似度搜索（余弦相似度）
 * 3. 混合搜索（关键词+语义）
 * 4. 索引管理和优化
 */

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, cosineSimilarity, getEmbeddingDimension } from './embedding'

export type EntityType = 'product' | 'company' | 'regulation'

export interface VectorRecord {
  id: string
  entityType: EntityType
  entityId: string
  content: string
  embedding: number[]
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface SearchOptions {
  limit?: number
  threshold?: number
  filters?: Record<string, unknown>
  entityTypes?: EntityType[]
}

export interface HybridSearchOptions extends SearchOptions {
  keywordQuery?: string
  semanticWeight?: number
  keywordWeight?: number
}

export interface SearchResult {
  id: string
  entityType: EntityType
  entityId: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
}

export interface HybridSearchResult extends SearchResult {
  semanticScore: number
  keywordScore: number
  combinedScore: number
}

const DEFAULT_SEARCH_LIMIT = 20
const DEFAULT_SIMILARITY_THRESHOLD = 0.7
const DEFAULT_SEMANTIC_WEIGHT = 0.7
const DEFAULT_KEYWORD_WEIGHT = 0.3

/**
 * 存储向量记录
 */
export async function storeVector(record: VectorRecord): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vector_embeddings')
    .upsert({
      id: record.id,
      entity_type: record.entityType,
      entity_id: record.entityId,
      content: record.content,
      embedding: record.embedding,
      metadata: record.metadata || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })

  if (error) {
    console.error('Failed to store vector:', error)
    throw new Error(`Failed to store vector: ${error.message}`)
  }
}

/**
 * 批量存储向量记录
 */
export async function storeVectorsBatch(records: VectorRecord[]): Promise<void> {
  if (records.length === 0) return

  const supabase = await createClient()

  const { error } = await supabase
    .from('vector_embeddings')
    .upsert(
      records.map(record => ({
        id: record.id,
        entity_type: record.entityType,
        entity_id: record.entityId,
        content: record.content,
        embedding: record.embedding,
        metadata: record.metadata || {},
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Failed to store vectors batch:', error)
    throw new Error(`Failed to store vectors batch: ${error.message}`)
  }
}

/**
 * 语义相似度搜索
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = DEFAULT_SEARCH_LIMIT,
    threshold = DEFAULT_SIMILARITY_THRESHOLD,
    entityTypes,
  } = options

  const supabase = await createClient()

  // 生成查询向量
  const { embedding: queryEmbedding } = await generateEmbedding(query)

  // 构建基础查询
  let dbQuery = supabase
    .rpc('match_vectors', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    })

  // 执行查询
  const { data, error } = await dbQuery

  if (error) {
    console.error('Semantic search error:', error)
    throw new Error(`Semantic search failed: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // 过滤实体类型
  let results = data as Array<{
    id: string
    entity_type: EntityType
    entity_id: string
    content: string
    similarity: number
    metadata: Record<string, unknown>
  }>

  if (entityTypes && entityTypes.length > 0) {
    results = results.filter(r => entityTypes.includes(r.entity_type))
  }

  return results.map(r => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    content: r.content,
    similarity: r.similarity,
    metadata: r.metadata,
  }))
}

/**
 * 混合搜索（语义 + 关键词）
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult[]> {
  const {
    limit = DEFAULT_SEARCH_LIMIT,
    threshold = 0.5,
    keywordQuery = query,
    semanticWeight = DEFAULT_SEMANTIC_WEIGHT,
    keywordWeight = DEFAULT_KEYWORD_WEIGHT,
    entityTypes,
  } = options

  const supabase = await createClient()

  // 并行执行语义搜索和关键词搜索
  const [semanticResults, keywordResults] = await Promise.all([
    // 语义搜索
    semanticSearch(query, { limit: limit * 2, threshold: 0.5, entityTypes }),
    // 关键词搜索
    keywordSearch(keywordQuery, { limit: limit * 2, entityTypes }),
  ])

  // 合并结果并计算综合分数
  const resultMap = new Map<string, HybridSearchResult>()

  // 处理语义搜索结果
  semanticResults.forEach(result => {
    const key = `${result.entityType}:${result.entityId}`
    resultMap.set(key, {
      ...result,
      semanticScore: result.similarity,
      keywordScore: 0,
      combinedScore: result.similarity * semanticWeight,
    })
  })

  // 处理关键词搜索结果
  keywordResults.forEach(result => {
    const key = `${result.entityType}:${result.entityId}`
    const existing = resultMap.get(key)
    
    if (existing) {
      existing.keywordScore = result.similarity
      existing.combinedScore = existing.semanticScore * semanticWeight + result.similarity * keywordWeight
    } else {
      resultMap.set(key, {
        ...result,
        semanticScore: 0,
        keywordScore: result.similarity,
        combinedScore: result.similarity * keywordWeight,
      })
    }
  })

  // 排序并返回结果
  return Array.from(resultMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit)
    .filter(r => r.combinedScore >= threshold)
}

/**
 * 关键词搜索（基于pg_trgm）
 */
async function keywordSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = DEFAULT_SEARCH_LIMIT,
    entityTypes,
  } = options

  const supabase = await createClient()

  // 构建搜索查询
  let dbQuery = supabase
    .from('vector_embeddings')
    .select('*')
    .textSearch('content', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit)

  // 应用实体类型过滤
  if (entityTypes && entityTypes.length > 0) {
    dbQuery = dbQuery.in('entity_type', entityTypes)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Keyword search error:', error)
    return []
  }

  if (!data) return []

  // 计算关键词相似度分数（简化版）
  return data.map((record: VectorRecord) => ({
    id: record.id,
    entityType: record.entityType,
    entityId: record.entityId,
    content: record.content,
    similarity: 0.8, // 文本搜索返回的结果默认给较高分数
    metadata: record.metadata,
  }))
}

/**
 * 删除向量记录
 */
export async function deleteVector(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vector_embeddings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete vector:', error)
    throw new Error(`Failed to delete vector: ${error.message}`)
  }
}

/**
 * 根据实体删除向量记录
 */
export async function deleteVectorsByEntity(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vector_embeddings')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (error) {
    console.error('Failed to delete vectors by entity:', error)
    throw new Error(`Failed to delete vectors: ${error.message}`)
  }
}

/**
 * 获取向量记录统计
 */
export async function getVectorStats(): Promise<{
  total: number
  byType: Record<EntityType, number>
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vector_embeddings')
    .select('entity_type')

  if (error) {
    console.error('Failed to get vector stats:', error)
    throw new Error(`Failed to get stats: ${error.message}`)
  }

  const byType: Record<EntityType, number> = {
    product: 0,
    company: 0,
    regulation: 0,
  }

  data.forEach((record: { entity_type: EntityType }) => {
    byType[record.entity_type] = (byType[record.entity_type] || 0) + 1
  })

  return {
    total: data.length,
    byType,
  }
}

/**
 * 检查实体是否已存在向量
 */
export async function checkVectorExists(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vector_embeddings')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .limit(1)

  if (error) {
    console.error('Failed to check vector exists:', error)
    return false
  }

  return data && data.length > 0
}
