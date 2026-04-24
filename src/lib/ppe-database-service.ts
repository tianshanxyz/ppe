import { createClient } from '@/lib/supabase/client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

/**
 * PPE 产品数据访问服务（基于真实数据库结构）
 * 
 * 提供 PPE 产品、制造商、法规等数据的数据库访问接口
 */

/**
 * 产品类型定义
 */
export interface PPEProduct {
  id: string
  product_name: string
  product_code: string
  product_category: string
  sub_category: string
  ppe_category: 'I' | 'II' | 'III'
  description: string
  specifications: unknown
  features: unknown
  images: unknown
  manufacturer_id: string
  manufacturer_name: string
  manufacturer_address: string
  manufacturer_country: string
  brand_name: string
  certifications: unknown
  ce_certificate_number: string
  ce_expiry_date: string
  fda_k_number: string
  fda_decision_date: string
  nmpa_registration_number: string
  nmpa_expiry_date: string
  iso_certifications: string[]
  other_certifications: unknown
  target_markets: string[]
  market_approvals: unknown
  registration_status: 'active' | 'expired' | 'suspended' | 'cancelled'
  applicable_regulations: string[]
  harmonized_standards: string[]
  risk_classification: string
  essential_requirements: unknown
  performance_metrics: unknown
  test_reports: unknown
  approval_date: string
  expiry_date: string
  created_at: string
  updated_at: string
  last_sync_at: string
}

/**
 * 制造商类型定义
 */
export interface PPEManufacturer {
  id: string
  company_name: string
  company_name_en: string
  company_name_zh: string
  country: string
  address: string
  website: string
  email: string
  phone: string
  business_type: 'manufacturer' | 'distributor' | 'agent' | 'retailer'
  certifications: unknown
  description: string
  capabilities: unknown
  created_at: string
  updated_at: string
}

/**
 * 法规类型定义
 */
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
  source: string
  created_at: string
  updated_at: string
}

/**
 * 获取 PPE 产品列表（分页）
 */
export async function getPPEProducts({
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
    query = query.or(`product_name.ilike.%${escapeIlikeSearch(filters.search)}%,product_code.ilike.%${escapeIlikeSearch(filters.search)}%,manufacturer_name.ilike.%${escapeIlikeSearch(filters.search)}%`)
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
    data: data || [],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取单个 PPE 产品详情
 */
export async function getPPEProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select(`
      *,
      ppe_product_certifications (*),
      ppe_product_markets (*),
      ppe_manufacturers (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取 PPE 产品详情失败:', error)
    return null
  }
  
  return data
}

/**
 * 搜索 PPE 产品
 */
export async function searchPPEProducts(query: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('*')
    .or(`product_name.ilike.%${escapeIlikeSearch(query)}%,product_code.ilike.%${escapeIlikeSearch(query)}%,description.ilike.%${escapeIlikeSearch(query)}%`)
    .limit(20)
  
  if (error) {
    console.error('搜索 PPE 产品失败:', error)
    return []
  }
  
  return data || []
}

/**
 * 获取 PPE 产品统计数据
 */
export async function getPPEProductStats() {
  const supabase = createClient()
  
  const { count: totalCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
  
  const { data: allStats } = await supabase
    .from('ppe_products')
    .select('manufacturer_country, product_category, ppe_category, registration_status')
  
  const countryCount: Record<string, number> = {}
  const categoryCount: Record<string, number> = {}
  const ppeCategoryCount: Record<string, number> = {}
  const statusCount: Record<string, number> = {}

  allStats?.forEach((product) => {
    const country = product.manufacturer_country || 'Unknown'
    countryCount[country] = (countryCount[country] || 0) + 1

    const category = product.product_category || 'Unknown'
    categoryCount[category] = (categoryCount[category] || 0) + 1

    const ppeCat = product.ppe_category || 'Unknown'
    ppeCategoryCount[ppeCat] = (ppeCategoryCount[ppeCat] || 0) + 1

    const status = product.registration_status || 'Unknown'
    statusCount[status] = (statusCount[status] || 0) + 1
  })
  
  return {
    totalProducts: totalCount || 0,
    countryCount,
    categoryCount,
    ppeCategoryCount,
    statusCount,
  }
}

/**
 * 获取制造商列表
 */
export async function getPPEManufacturers({
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
  
  query = query.range(from, to).order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('获取制造商列表失败:', error)
    return { data: [], total: 0, page, limit }
  }
  
  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取制造商详情
 */
export async function getPPEManufacturer(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_manufacturers')
    .select(`
      *,
      ppe_product_manufacturers (
        ppe_products (*)
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取制造商详情失败:', error)
    return null
  }
  
  return data
}

/**
 * 获取法规列表
 */
export async function getPPERegulations({
  page = 1,
  limit = 20,
  jurisdiction,
  category,
}: {
  page?: number
  limit?: number
  jurisdiction?: string
  category?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_regulations')
    .select('*', { count: 'exact' })
  
  if (jurisdiction) {
    query = query.eq('jurisdiction', jurisdiction)
  }
  
  if (category) {
    query = query.eq('category', category)
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to).order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('获取法规列表失败:', error)
    return { data: [], total: 0, page, limit }
  }
  
  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取法规详情
 */
export async function getPPERegulation(id: string) {
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
  
  return data
}

/**
 * 获取所有国家列表
 */
export async function getPPECountries() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('manufacturer_country')
  
  if (error) {
    console.error('获取国家列表失败:', error)
    return []
  }
  
  const countries = Array.from(new Set(data?.map(p => p.manufacturer_country).filter(Boolean)))
  return countries.sort()
}

/**
 * 获取所有产品分类列表
 */
export async function getPPECategories() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_products')
    .select('product_category')
  
  if (error) {
    console.error('获取分类列表失败:', error)
    return []
  }
  
  const categories = Array.from(new Set(data?.map(p => p.product_category).filter(Boolean)))
  return categories.sort()
}

/**
 * 获取 PPE 风险等级列表
 */
export async function getPPERiskCategories() {
  return ['I', 'II', 'III']
}

/**
 * 获取认证机构列表
 */
export async function getPECertificationBodies() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_certification_bodies')
    .select('*')
    .order('body_name')
  
  if (error) {
    console.error('获取认证机构列表失败:', error)
    return []
  }
  
  return data || []
}

/**
 * 获取市场统计数据
 */
export async function getMarketStats() {
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

/**
 * 获取竞争对手列表
 */
export async function getCompetitors() {
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
