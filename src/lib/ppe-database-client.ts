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

// 默认产品数据（作为回退数据）
const DEFAULT_PRODUCTS: PPEProduct[] = [
  {
    id: '1',
    product_name: 'Safety Work Boots - Steel Toe',
    product_code: 'SWB-2024-001',
    product_category: 'Safety Footwear',
    ppe_category: 'II',
    manufacturer_name: 'Industrial Safety Co.',
    registration_status: 'active',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    product_name: 'Chemical Resistant Gloves',
    product_code: 'CRG-2024-002',
    product_category: 'Safety Gloves',
    ppe_category: 'III',
    manufacturer_name: 'Protective Gear Ltd.',
    registration_status: 'active',
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: '3',
    product_name: 'Construction Safety Helmet',
    product_code: 'CSH-2024-003',
    product_category: 'Safety Helmets',
    ppe_category: 'II',
    manufacturer_name: 'Head Protection Inc.',
    registration_status: 'active',
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: '4',
    product_name: 'Anti-Fog Safety Goggles',
    product_code: 'AFSG-2024-004',
    product_category: 'Eye Protection',
    ppe_category: 'II',
    manufacturer_name: 'Vision Safety Corp.',
    registration_status: 'active',
    created_at: '2024-02-10T00:00:00Z'
  },
  {
    id: '5',
    product_name: 'Ear Protection Earmuffs',
    product_code: 'EPE-2024-005',
    product_category: 'Hearing Protection',
    ppe_category: 'II',
    manufacturer_name: 'HearSafe Manufacturing',
    registration_status: 'active',
    created_at: '2024-02-15T00:00:00Z'
  },
  {
    id: '6',
    product_name: 'N95 Respirator Mask',
    product_code: 'N95-2024-006',
    product_category: 'Respiratory Protection',
    ppe_category: 'III',
    manufacturer_name: 'BreatheSafe Ltd.',
    registration_status: 'active',
    created_at: '2024-03-01T00:00:00Z'
  }
]

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
  try {
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
      console.error('Failed to fetch PPE product list:', error)
      // 返回默认数据
      return { data: DEFAULT_PRODUCTS, total: DEFAULT_PRODUCTS.length, page, limit }
    }
    
    // 如果数据库中没有数据，返回默认数据
    if (!data || data.length === 0) {
      return { data: DEFAULT_PRODUCTS, total: DEFAULT_PRODUCTS.length, page, limit }
    }
    
    return {
      data: data as PPEProduct[],
      total: count || 0,
      page,
      limit,
    }
  } catch (error) {
    console.error('Error in getPPEProductsClient:', error)
    return { data: DEFAULT_PRODUCTS, total: DEFAULT_PRODUCTS.length, page, limit }
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

// 默认统计数据（作为回退数据）
const DEFAULT_STATS = {
  totalProducts: 6,
  countryCount: {
    'China': 2,
    'United States': 1,
    'Germany': 1,
    'United Kingdom': 1,
    'Japan': 1
  },
  categoryCount: {
    'Safety Footwear': 1,
    'Safety Gloves': 1,
    'Safety Helmets': 1,
    'Eye Protection': 1,
    'Hearing Protection': 1,
    'Respiratory Protection': 1
  },
  ppeCategoryCount: {
    'II': 4,
    'III': 2
  }
}

/**
 * 获取产品统计数据（客户端）
 */
export async function getPPEProductStatsClient() {
  try {
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
    
    // 如果没有数据，返回默认统计数据
    if (!totalProducts || totalProducts === 0) {
      return DEFAULT_STATS
    }
    
    return {
      totalProducts: totalProducts || 0,
      countryCount,
      categoryCount,
      ppeCategoryCount,
    }
  } catch (error) {
    console.error('Error in getPPEProductStatsClient:', error)
    return DEFAULT_STATS
  }
}

// 默认分类列表（作为回退数据）
const DEFAULT_CATEGORIES = [
  'Safety Footwear',
  'Safety Gloves',
  'Safety Helmets',
  'Eye Protection',
  'Hearing Protection',
  'Respiratory Protection',
  'Protective Clothing',
  'Fall Protection',
  'Face Protection',
  'Hand Protection'
]

// 默认国家列表（作为回退数据）
const DEFAULT_COUNTRIES = [
  'China',
  'United States',
  'Germany',
  'United Kingdom',
  'France',
  'Italy',
  'Japan',
  'South Korea',
  'India',
  'Brazil'
]

/**
 * 获取产品分类列表（客户端）
 */
export async function getPPECategoriesClient() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ppe_products')
      .select('product_category')
    
    if (error) {
      console.error('Failed to fetch category list:', error)
      return DEFAULT_CATEGORIES
    }
    
    const categories = new Set<string>()
    data?.forEach(p => {
      if (p.product_category) {
        categories.add(p.product_category)
      }
    })
    
    const result = Array.from(categories)
    return result.length > 0 ? result : DEFAULT_CATEGORIES
  } catch (error) {
    console.error('Error in getPPECategoriesClient:', error)
    return DEFAULT_CATEGORIES
  }
}

/**
 * 获取产品国家列表（客户端）
 */
export async function getPPECountriesClient() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ppe_products')
      .select('manufacturer_country')
    
    if (error) {
      console.error('Failed to fetch country list:', error)
      return DEFAULT_COUNTRIES
    }
    
    const countries = new Set<string>()
    data?.forEach(p => {
      if (p.manufacturer_country) {
        countries.add(p.manufacturer_country)
      }
    })
    
    const result = Array.from(countries)
    return result.length > 0 ? result : DEFAULT_COUNTRIES
  } catch (error) {
    console.error('Error in getPPECountriesClient:', error)
    return DEFAULT_COUNTRIES
  }
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
