/**
 * 搜索服务 - 支持模糊搜索和智能建议
 */

import { createClient } from './supabase/client'

export interface SearchResult {
  id: string
  type: 'product' | 'manufacturer' | 'regulation'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  similarity: number
}

export interface SearchSuggestion {
  keyword: string
  category: string
  searchCount: number
}

/**
 * 智能搜索 - 搜索产品、制造商和法规
 */
export async function intelligentSearch(
  query: string,
  options: {
    category?: string
    country?: string
    limit?: number
  } = {}
): Promise<{
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  total: number
}> {
  const supabase = createClient()
  const { category, country, limit = 20 } = options

  try {
    // 并行执行搜索和建议查询
    const [productsResult, manufacturersResult, suggestionsResult] = await Promise.all([
      // 搜索产品
      supabase.rpc('search_products', {
        search_query: query,
        category_filter: category || null,
        country_filter: country || null
      }),
      // 搜索制造商
      supabase.rpc('search_manufacturers', {
        search_query: query,
        country_filter: country || null
      }),
      // 获取搜索建议
      supabase.rpc('get_search_suggestions', {
        partial_query: query,
        limit_count: 5
      })
    ])

    const results: SearchResult[] = []

    // 处理产品结果
    if (productsResult.data && !productsResult.error) {
      productsResult.data.forEach((product: any) => {
        results.push({
          id: product.id,
          type: 'product',
          title: product.product_name || product.name,
          subtitle: product.product_category || product.category,
          description: product.description,
          metadata: {
            manufacturerCountry: product.manufacturer_country,
            manufacturerName: product.manufacturer_name,
            riskLevel: product.risk_level
          },
          similarity: product.similarity || 0
        })
      })
    }

    // 处理制造商结果
    if (manufacturersResult.data && !manufacturersResult.error) {
      manufacturersResult.data.forEach((mfg: any) => {
        results.push({
          id: mfg.id,
          type: 'manufacturer',
          title: mfg.company_name,
          subtitle: mfg.country,
          description: mfg.product_categories?.join(', '),
          metadata: {
            creditScore: mfg.credit_score,
            riskLevel: mfg.risk_level,
            verified: mfg.verified,
            businessType: mfg.business_type
          },
          similarity: mfg.similarity || 0
        })
      })
    }

    // 按相似度排序
    results.sort((a, b) => b.similarity - a.similarity)

    // 处理建议
    const suggestions: SearchSuggestion[] = suggestionsResult.data?.map((s: any) => ({
      keyword: s.keyword,
      category: s.category,
      searchCount: s.search_count
    })) || []

    // 如果没有结果但有建议，返回建议
    if (results.length === 0 && suggestions.length > 0) {
      return {
        results: [],
        suggestions,
        total: 0
      }
    }

    // 记录搜索（异步，不阻塞）
    supabase.rpc('record_search', {
      search_keyword: query,
      search_category: results.length > 0 ? results[0].type : 'general'
    }).then(() => {}, () => {})

    return {
      results: results.slice(0, limit),
      suggestions,
      total: results.length
    }

  } catch (error) {
    console.error('Search error:', error)
    return {
      results: [],
      suggestions: [],
      total: 0
    }
  }
}

/**
 * 获取热门搜索
 */
export async function getTrendingSearches(limit: number = 10): Promise<SearchSuggestion[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('search_suggestions')
      .select('keyword, category, search_count')
      .order('search_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get trending searches:', error)
      return []
    }

    return data?.map((s: any) => ({
      keyword: s.keyword,
      category: s.category,
      searchCount: s.search_count
    })) || []

  } catch (error) {
    console.error('Error getting trending searches:', error)
    return []
  }
}

/**
 * 获取搜索建议（实时）
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 8
): Promise<SearchSuggestion[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      partial_query: partialQuery,
      limit_count: limit
    })

    if (error) {
      console.error('Failed to get search suggestions:', error)
      return []
    }

    return data?.map((s: any) => ({
      keyword: s.keyword,
      category: s.category,
      searchCount: s.search_count
    })) || []

  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return []
  }
}

/**
 * 简单文本搜索（备用方案）
 */
export async function simpleTextSearch(
  query: string,
  table: 'ppe_products' | 'ppe_manufacturers' | 'ppe_regulations',
  searchFields: string[]
): Promise<any[]> {
  const supabase = createClient()

  try {
    // 构建 OR 条件
    const orConditions = searchFields.map(field => 
      `${field}.ilike.%${query}%`
    ).join(',')

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .or(orConditions)
      .limit(20)

    if (error) {
      console.error(`Search error in ${table}:`, error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('Simple search error:', error)
    return []
  }
}
