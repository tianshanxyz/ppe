import { createClient } from '@/lib/supabase/client'

/**
 * PPE 产品数据访问服务（客户端专用）
 * 
 * 提供 PPE 产品、法规等数据的浏览器端访问接口
 * 注意：此服务仅在客户端组件中使用，不包含认证相关功能
 */

export interface PPEProduct {
  id: string
  product_name: string
  product_code: string
  product_category: string
  ppe_category: 'I' | 'II' | 'III'
  manufacturer_name: string
  registration_status: 'active' | 'expired' | 'suspended' | 'cancelled'
  created_at: string
}

export interface PPERegulation {
  id: string
  regulation_name: string
  regulation_name_en: string
  regulation_name_zh: string
  regulation_type: string
  jurisdiction: string
  category: string
  effective_date: string
  content: string
  keywords: string[]
  source_url: string
  created_at: string
}

/**
 * 获取 PPE 产品列表（客户端）
 */
export async function getPPEProductsClient({
  page = 1,
  limit = 20,
  filters = {},
}: {
  page?: number
  limit?: number
  filters?: {
    country?: string
    category?: string
    ppe_category?: 'I' | 'II' | 'III'
    registration_status?: string
    search?: string
  }
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_products')
    .select('*', { count: 'exact' })
  
  // 应用筛选条件
  if (filters.country) {
    query = query.eq('manufacturer_country', filters.country)
  }
  
  if (filters.category) {
    query = query.eq('product_category', filters.category)
  }
  
  if (filters.ppe_category) {
    query = query.eq('ppe_category', filters.ppe_category)
  }
  
  if (filters.registration_status) {
    query = query.eq('registration_status', filters.registration_status)
  }
  
  if (filters.search) {
    query = query.or(`product_name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%,manufacturer_name.ilike.%${filters.search}%`)
  }
  
  // 分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to).order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('获取 PPE 产品列表失败:', error)
    return { data: [], total: 0, page, limit }
  }
  
  return {
    data: data as PPEProduct[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取法规列表（客户端）
 */
export async function getPPERegulationsClient({
  page = 1,
  limit = 20,
  filters = {},
}: {
  page?: number
  limit?: number
  filters?: {
    jurisdiction?: string
    category?: string
    search?: string
  }
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_regulations')
    .select('*', { count: 'exact' })
  
  // 应用筛选条件
  if (filters.jurisdiction) {
    query = query.eq('jurisdiction', filters.jurisdiction)
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters.search) {
    query = query.or(`regulation_name.ilike.%${filters.search}%,regulation_name_en.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }
  
  // 分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to).order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('获取法规列表失败:', error)
    return { data: [], total: 0, page, limit }
  }
  
  return {
    data: data as PPERegulation[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取单个产品详情（客户端）
 */
export async function getPPEProductByIdClient(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取产品详情失败:', error)
    return null
  }
  
  return data as PPEProduct
}

/**
 * 获取单个产品详情（客户端）- 别名
 */
export async function getPPEProduct(id: string) {
  return getPPEProductByIdClient(id)
}

/**
 * 获取单个法规详情（客户端）
 */
export async function getPPERegulationByIdClient(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_regulations')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取法规详情失败:', error)
    return null
  }
  
  return data as PPERegulation
}

/**
 * 获取产品统计数据（客户端）
 */
export async function getPPEProductStatsClient() {
  const supabase = createClient()
  
  // 获取总数
  const { count: totalProducts } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
  
  // 获取国家分布
  const { data: countries } = await supabase
    .from('ppe_products')
    .select('manufacturer_country')
  
  const countryCount: Record<string, number> = {}
  countries?.forEach(p => {
    countryCount[p.manufacturer_country] = (countryCount[p.manufacturer_country] || 0) + 1
  })
  
  // 获取分类分布
  const { data: categories } = await supabase
    .from('ppe_products')
    .select('product_category')
  
  const categoryCount: Record<string, number> = {}
  categories?.forEach(p => {
    categoryCount[p.product_category] = (categoryCount[p.product_category] || 0) + 1
  })
  
  // 获取 PPE 分类分布
  const { data: ppeCategories } = await supabase
    .from('ppe_products')
    .select('ppe_category')
  
  const ppeCategoryCount: Record<string, number> = {}
  ppeCategories?.forEach(p => {
    ppeCategoryCount[p.ppe_category] = (ppeCategoryCount[p.ppe_category] || 0) + 1
  })
  
  return {
    totalProducts: totalProducts || 0,
    countryCount,
    categoryCount,
    ppeCategoryCount: Object.keys(ppeCategoryCount).length,
  }
}

/**
 * 获取产品分类列表（客户端）
 */
export async function getPPECategoriesClient() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('product_category')
  
  if (error) {
    console.error('获取分类列表失败:', error)
    return []
  }
  
  const categories = new Set<string>()
  data?.forEach(p => {
    if (p.product_category) {
      categories.add(p.product_category)
    }
  })
  
  return Array.from(categories)
}

/**
 * 获取产品国家列表（客户端）
 */
export async function getPPECountriesClient() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('manufacturer_country')
  
  if (error) {
    console.error('获取国家列表失败:', error)
    return []
  }
  
  const countries = new Set<string>()
  data?.forEach(p => {
    if (p.manufacturer_country) {
      countries.add(p.manufacturer_country)
    }
  })
  
  return Array.from(countries)
}

/**
 * 获取市场统计数据（客户端）
 */
export async function getMarketStatsClient() {
  const supabase = createClient()
  
  // 获取所有市场数据
  const { data: marketData } = await supabase
    .from('ppe_product_markets')
    .select('market, market_name, status')
  
  const marketStats = marketData?.reduce((acc, market) => {
    const key = market.market || 'Unknown'
    if (!acc[key]) {
      acc[key] = {
        market: key,
        market_name: market.market_name || key,
        total: 0,
        approved: 0,
        expired: 0,
        suspended: 0,
      }
    }
    acc[key].total++
    if (market.status === 'approved') acc[key].approved++
    if (market.status === 'expired') acc[key].expired++
    if (market.status === 'suspended') acc[key].suspended++
    return acc
  }, {} as Record<string, any>) || {}
  
  return Object.values(marketStats)
}

// 导出别名，方便使用
export const getPPEProductStats = getPPEProductStatsClient
export const getPPECategories = getPPECategoriesClient
export const getPPECountries = getPPECountriesClient
export const getMarketStats = getMarketStatsClient

/**
 * 获取制造商列表（客户端）
 */
export async function getPPEManufacturersClient({
  page = 1,
  limit = 20,
  country,
}: {
  page?: number
  limit?: number
  country?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact' })
  
  if (country) {
    query = query.eq('country', country)
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to).order('company_name', { ascending: true })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('获取制造商列表失败:', error)
    return { data: [], total: 0, page, limit }
  }
  
  return {
    data: data as any[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取单个制造商详情（客户端）
 */
export async function getPPEManufacturerClient(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_manufacturers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取制造商详情失败:', error)
    return null
  }
  
  return data
}

// 导出别名
export const getPPEManufacturer = getPPEManufacturerClient
export const getPPEManufacturers = getPPEManufacturersClient

/**
 * 获取竞争对手列表（客户端）
 */
export async function getCompetitorsClient() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_competitors')
    .select('*')
    .order('company_name')
  
  if (error) {
    console.error('获取竞争对手列表失败:', error)
    return []
  }
  
  return data || []
}

// 导出别名
export const getCompetitors = getCompetitorsClient
