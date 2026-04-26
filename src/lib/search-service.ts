import { createClient } from './supabase/client'
import { escapeIlikeSearch } from './security/sanitize'

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
  const searchTerm = query.trim()

  if (!searchTerm) {
    return { results: [], suggestions: [], total: 0 }
  }

  try {
    const results: SearchResult[] = []

    const escapedSearchTerm = escapeIlikeSearch(searchTerm)

    let productQuery = supabase
      .from('ppe_products')
      .select('id, name, product_name, category, product_category, description, manufacturer_country, manufacturer_name, risk_level')
      .or(`name.ilike.%${escapedSearchTerm}%,product_name.ilike.%${escapedSearchTerm}%,product_category.ilike.%${escapedSearchTerm}%,manufacturer_name.ilike.%${escapedSearchTerm}%,description.ilike.%${escapedSearchTerm}%,product_code.ilike.%${escapedSearchTerm}%`)
      .eq('status', 'active')

    if (category) {
      productQuery = productQuery.eq('product_category', category)
    }
    if (country) {
      productQuery = productQuery.eq('manufacturer_country', country)
    }
    productQuery = productQuery.limit(limit)

    let manufacturerQuery = supabase
      .from('ppe_manufacturers')
      .select('id, company_name, country, product_categories, credit_score, risk_level, verified, business_type')
      .or(`company_name.ilike.%${escapedSearchTerm}%,country.ilike.%${escapedSearchTerm}%`)
      .eq('status', 'active')

    if (country) {
      manufacturerQuery = manufacturerQuery.eq('country', country)
    }
    manufacturerQuery = manufacturerQuery.limit(limit)

    const [productsResult, manufacturersResult] = await Promise.all([
      productQuery,
      manufacturerQuery
    ])

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
          similarity: calculateSimilarity(searchTerm, [product.product_name, product.name, product.product_category, product.manufacturer_name])
        })
      })
    }

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
          similarity: calculateSimilarity(searchTerm, [mfg.company_name, mfg.country])
        })
      })
    }

    results.sort((a, b) => b.similarity - a.similarity)

    return {
      results: results.slice(0, limit),
      suggestions: [],
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

function calculateSimilarity(query: string, fields: (string | null | undefined)[]): number {
  const lowerQuery = query.toLowerCase()
  let maxScore = 0

  for (const field of fields) {
    if (!field) continue
    const lowerField = field.toLowerCase()
    if (lowerField === lowerQuery) {
      maxScore = Math.max(maxScore, 1.0)
    } else if (lowerField.startsWith(lowerQuery)) {
      maxScore = Math.max(maxScore, 0.9)
    } else if (lowerField.includes(lowerQuery)) {
      maxScore = Math.max(maxScore, 0.7)
    } else {
      const queryChars = lowerQuery.split('')
      const matchCount = queryChars.filter(c => lowerField.includes(c)).length
      const score = matchCount / queryChars.length * 0.3
      maxScore = Math.max(maxScore, score)
    }
  }

  return maxScore
}

export async function getTrendingSearches(limit: number = 10): Promise<SearchSuggestion[]> {
  return [
    { keyword: 'N95 respirator', category: 'product', searchCount: 1250 },
    { keyword: 'CE marking', category: 'compliance', searchCount: 980 },
    { keyword: 'safety gloves', category: 'product', searchCount: 870 },
    { keyword: 'FDA 510(k)', category: 'compliance', searchCount: 760 },
    { keyword: '3M', category: 'manufacturer', searchCount: 650 },
    { keyword: 'protective clothing', category: 'product', searchCount: 540 },
    { keyword: 'safety helmet', category: 'product', searchCount: 430 },
    { keyword: 'UKCA marking', category: 'compliance', searchCount: 380 },
    { keyword: 'Honeywell', category: 'manufacturer', searchCount: 320 },
    { keyword: 'NMPA registration', category: 'compliance', searchCount: 290 },
  ].slice(0, limit)
}

export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 8
): Promise<SearchSuggestion[]> {
  if (!partialQuery || partialQuery.length < 2) return []

  const allSuggestions = await getTrendingSearches(50)
  const lowerQuery = partialQuery.toLowerCase()

  return allSuggestions
    .filter(s => s.keyword.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
}

export async function simpleTextSearch(
  query: string,
  table: 'ppe_products' | 'ppe_manufacturers',
  searchFields: string[]
): Promise<any[]> {
  const supabase = createClient()

  try {
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
