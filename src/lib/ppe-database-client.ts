import { createClient } from '@/lib/supabase/client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

/**
 * PPE 产品数据访问服务（客户端专用）
 * 
 * 提供 PPE 产品、法规等数据的浏览器端访问接口
 * 注意：此服务仅在客户端组件中使用，不包含认证相关功能
 */

export interface PPEProduct {
  id: string
  name: string
  model: string
  category: string
  subcategory: string
  description: string
  manufacturer_id: string
  country_of_origin: string
  created_at: string
  updated_at: string
  product_name: string
  product_category: string
  manufacturer_country: string
  product_code: string
  manufacturer_name: string
  risk_level: string
}

// 默认产品数据（当数据库不可用时作为回退）
const DEFAULT_PRODUCTS: PPEProduct[] = [
  {
    id: '1',
    name: 'N95 Respirator Mask',
    model: 'N95-001',
    category: 'Respiratory Protection',
    subcategory: 'Respirators',
    description: 'NIOSH-approved N95 particulate respirator with 95% filtration efficiency against solid and liquid aerosols.',
    manufacturer_id: 'm1',
    country_of_origin: 'United States',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    product_name: 'N95 Respirator Mask',
    product_category: 'Respiratory Protection',
    manufacturer_country: 'United States',
    product_code: 'N95-001',
    manufacturer_name: '3M Company',
    risk_level: 'high',
  },
  {
    id: '2',
    name: '3M Safety Goggles',
    model: 'SG-200',
    category: 'Eye Protection',
    subcategory: 'Goggles',
    description: 'Chemical splash goggles with anti-fog coating and indirect ventilation.',
    manufacturer_id: 'm1',
    country_of_origin: 'United States',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    product_name: '3M Safety Goggles',
    product_category: 'Eye Protection',
    manufacturer_country: 'United States',
    product_code: 'SG-200',
    manufacturer_name: '3M Company',
    risk_level: 'medium',
  },
  {
    id: '3',
    name: 'Honeywell North 7700 Half Mask',
    model: 'HW-7700',
    category: 'Respiratory Protection',
    subcategory: 'Half Masks',
    description: 'Silicone half mask respirator compatible with NIOSH-approved cartridges and filters.',
    manufacturer_id: 'm2',
    country_of_origin: 'United States',
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
    product_name: 'Honeywell North 7700 Half Mask',
    product_category: 'Respiratory Protection',
    manufacturer_country: 'United States',
    product_code: 'HW-7700',
    manufacturer_name: 'Honeywell International',
    risk_level: 'high',
  },
  {
    id: '4',
    name: '3M Peltor Optime 105 Earmuffs',
    model: 'PE-105',
    category: 'Hearing Protection',
    subcategory: 'Earmuffs',
    description: 'High-attenuation earmuffs with NRR 30dB for extreme noise environments.',
    manufacturer_id: 'm1',
    country_of_origin: 'United States',
    created_at: '2024-04-05T00:00:00Z',
    updated_at: '2024-04-05T00:00:00Z',
    product_name: '3M Peltor Optime 105 Earmuffs',
    product_category: 'Hearing Protection',
    manufacturer_country: 'United States',
    product_code: 'PE-105',
    manufacturer_name: '3M Company',
    risk_level: 'medium',
  },
  {
    id: '5',
    name: 'Honeywell Rig Dog Xtreme Gloves',
    model: 'HW-RDX',
    category: 'Safety Gloves',
    subcategory: 'Cut-Resistant Gloves',
    description: 'Cut-resistant work gloves with impact protection and oil-resistant grip.',
    manufacturer_id: 'm2',
    country_of_origin: 'United States',
    created_at: '2024-05-12T00:00:00Z',
    updated_at: '2024-05-12T00:00:00Z',
    product_name: 'Honeywell Rig Dog Xtreme Gloves',
    product_category: 'Safety Gloves',
    manufacturer_country: 'United States',
    product_code: 'HW-RDX',
    manufacturer_name: 'Honeywell International',
    risk_level: 'medium',
  },
  {
    id: '6',
    name: 'Drager HPS 6200 Firefighter Helmet',
    model: 'DRA-HPS6200',
    category: 'Safety Helmets',
    subcategory: 'Hard Hats',
    description: 'High-performance firefighter helmet with integrated visor and communication system.',
    manufacturer_id: 'm5',
    country_of_origin: 'Germany',
    created_at: '2024-06-18T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
    product_name: 'Drager HPS 6200 Firefighter Helmet',
    product_category: 'Safety Helmets',
    manufacturer_country: 'Germany',
    product_code: 'DRA-HPS6200',
    manufacturer_name: 'Dragerwerk AG',
    risk_level: 'high',
  },
  {
    id: '7',
    name: 'Ansell HyFlex 11-800 Gloves',
    model: 'AN-11800',
    category: 'Safety Gloves',
    subcategory: 'General Purpose Gloves',
    description: 'Multi-purpose industrial gloves with foam nitrile coating for excellent grip.',
    manufacturer_id: 'm3',
    country_of_origin: 'Australia',
    created_at: '2024-07-22T00:00:00Z',
    updated_at: '2024-07-22T00:00:00Z',
    product_name: 'Ansell HyFlex 11-800 Gloves',
    product_category: 'Safety Gloves',
    manufacturer_country: 'Australia',
    product_code: 'AN-11800',
    manufacturer_name: 'Ansell Limited',
    risk_level: 'low',
  },
  {
    id: '8',
    name: 'MSA V-Gard Hard Hat',
    model: 'MSA-VG',
    category: 'Safety Helmets',
    subcategory: 'Hard Hats',
    description: 'Industry-standard hard hat with Fas-Trac suspension and accessory slots.',
    manufacturer_id: 'm4',
    country_of_origin: 'United States',
    created_at: '2024-08-30T00:00:00Z',
    updated_at: '2024-08-30T00:00:00Z',
    product_name: 'MSA V-Gard Hard Hat',
    product_category: 'Safety Helmets',
    manufacturer_country: 'United States',
    product_code: 'MSA-VG',
    manufacturer_name: 'MSA Safety Incorporated',
    risk_level: 'medium',
  },
  {
    id: '9',
    name: 'Uvex i-3 Safety Goggles',
    model: 'UVX-I3',
    category: 'Eye Protection',
    subcategory: 'Goggles',
    description: 'Wide-vision safety goggles with anti-scratch and anti-fog coating for industrial use.',
    manufacturer_id: 'm6',
    country_of_origin: 'Germany',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-15T00:00:00Z',
    product_name: 'Uvex i-3 Safety Goggles',
    product_category: 'Eye Protection',
    manufacturer_country: 'Germany',
    product_code: 'UVX-I3',
    manufacturer_name: 'Uvex Safety Group',
    risk_level: 'low',
  },
  {
    id: '10',
    name: 'Delta Plus Vostok Safety Boots',
    model: 'DP-VK-S5',
    category: 'Safety Footwear',
    subcategory: 'Impact-Resistant Shoes',
    description: 'S5-certified safety boots with steel toe cap, puncture-resistant sole, and waterproof construction.',
    manufacturer_id: 'm7',
    country_of_origin: 'France',
    created_at: '2024-10-08T00:00:00Z',
    updated_at: '2024-10-08T00:00:00Z',
    product_name: 'Delta Plus Vostok Safety Boots',
    product_category: 'Safety Footwear',
    manufacturer_country: 'France',
    product_code: 'DP-VK-S5',
    manufacturer_name: 'Delta Plus Group',
    risk_level: 'medium',
  }
]

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
    search?: string
  }
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('ppe_products')
      .select('*', { count: 'exact' })
    
    if (filters.country) {
      query = query.eq('country_of_origin', filters.country)
    }
    
    if (filters.category) {
      query = query.eq('product_category', filters.category)
    }
    
    if (filters.search) {
      const searchTerm = escapeIlikeSearch(filters.search)
      query = query.or(`name.ilike.%${searchTerm}%,product_name.ilike.%${searchTerm}%,product_code.ilike.%${searchTerm}%,manufacturer_name.ilike.%${searchTerm}%,product_category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }
    
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to).order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Failed to fetch PPE product list:', error)
      // 数据库查询失败时返回默认数据
      let filteredData = DEFAULT_PRODUCTS
      if (filters.country) {
        filteredData = filteredData.filter(p => p.country_of_origin === filters.country)
      }
      if (filters.category) {
        filteredData = filteredData.filter(p => p.product_category === filters.category)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.product_name.toLowerCase().includes(searchLower) ||
          p.product_code.toLowerCase().includes(searchLower) ||
          p.manufacturer_name.toLowerCase().includes(searchLower) ||
          p.product_category.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        )
      }
      const from = (page - 1) * limit
      const paginatedData = filteredData.slice(from, from + limit)
      return { data: paginatedData, total: filteredData.length, page, limit }
    }
    
    // 如果数据库中没有数据，也返回默认数据
    if (!data || data.length === 0) {
      let filteredData = DEFAULT_PRODUCTS
      if (filters.country) {
        filteredData = filteredData.filter(p => p.country_of_origin === filters.country)
      }
      if (filters.category) {
        filteredData = filteredData.filter(p => p.product_category === filters.category)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.product_name.toLowerCase().includes(searchLower) ||
          p.product_code.toLowerCase().includes(searchLower) ||
          p.manufacturer_name.toLowerCase().includes(searchLower) ||
          p.product_category.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        )
      }
      const from = (page - 1) * limit
      const paginatedData = filteredData.slice(from, from + limit)
      return { data: paginatedData, total: filteredData.length, page, limit }
    }
    
    return {
      data: (data as PPEProduct[]) || [],
      total: count || 0,
      page,
      limit,
    }
  } catch (error) {
    console.error('Error in getPPEProductsClient:', error)
    // 发生异常时返回默认数据
    let filteredData = DEFAULT_PRODUCTS
    if (filters.country) {
      filteredData = filteredData.filter(p => p.country_of_origin === filters.country)
    }
    if (filters.category) {
      filteredData = filteredData.filter(p => p.product_category === filters.category)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.product_name.toLowerCase().includes(searchLower) ||
        p.product_code.toLowerCase().includes(searchLower) ||
        p.manufacturer_name.toLowerCase().includes(searchLower) ||
        p.product_category.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    const from = (page - 1) * limit
    const paginatedData = filteredData.slice(from, from + limit)
    return { data: paginatedData, total: filteredData.length, page, limit }
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
    query = query.or(`regulation_name.ilike.%${escapeIlikeSearch(filters.search)}%,regulation_name_en.ilike.%${escapeIlikeSearch(filters.search)}%,content.ilike.%${escapeIlikeSearch(filters.search)}%`)
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
  totalProducts: DEFAULT_PRODUCTS.length,
  countryCount: DEFAULT_PRODUCTS.reduce((acc, p) => {
    const country = p.country_of_origin || p.manufacturer_country
    if (country) {
      acc[country] = (acc[country] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>),
  categoryCount: DEFAULT_PRODUCTS.reduce((acc, p) => {
    const category = p.product_category || p.category
    if (category) {
      acc[category] = (acc[category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>),
  riskLevelCount: DEFAULT_PRODUCTS.reduce((acc, p) => {
    if (p.risk_level) {
      acc[p.risk_level] = (acc[p.risk_level] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
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
      .select('country_of_origin')
    
    const countryCount: Record<string, number> = {}
    countries?.forEach((p: any) => {
      const country = p.country_of_origin
      if (country) {
        countryCount[country] = (countryCount[country] || 0) + 1
      }
    })
  
    // 获取分类分布
    const { data: categories } = await supabase
      .from('ppe_products')
      .select('category,product_category')
    
    const categoryCount: Record<string, number> = {}
    categories?.forEach((p: any) => {
      const category = p.product_category || p.category
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1
      }
    })
    
    // 获取风险等级分布
    const { data: riskLevels } = await supabase
      .from('ppe_products')
      .select('risk_level')
    
    const riskLevelCount: Record<string, number> = {}
    riskLevels?.forEach((p: any) => {
      if (p.risk_level) {
        riskLevelCount[p.risk_level] = (riskLevelCount[p.risk_level] || 0) + 1
      }
    })
    
    // 如果没有数据，返回默认统计数据
    if (!totalProducts || totalProducts === 0) {
      return DEFAULT_STATS
    }
    
    return {
      totalProducts: totalProducts || 0,
      countryCount,
      categoryCount,
      riskLevelCount,
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
      .select('category,product_category')
    
    if (error) {
      console.error('Failed to fetch category list:', error)
      return DEFAULT_CATEGORIES
    }
    
    const categories = new Set<string>()
    data?.forEach((p: any) => {
      if (p.product_category) {
        categories.add(p.product_category)
      }
      if (p.category && p.category !== p.product_category) {
        categories.add(p.category)
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
      .select('country_of_origin')
    
    if (error) {
      console.error('Failed to fetch country list:', error)
      return DEFAULT_COUNTRIES
    }
    
    const countries = new Set<string>()
    data?.forEach((p: any) => {
      if (p.country_of_origin) {
        countries.add(p.country_of_origin)
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
  
  const marketStats = marketData?.reduce((acc: any, market: any) => {
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
export { DEFAULT_MANUFACTURERS }
export { DEFAULT_PRODUCTS }

export interface PPEManufacturer {
  id: string
  name: string
  country: string
  website: string
  created_at: string
  updated_at: string
}

// 默认制造商数据（作为回退数据）
const DEFAULT_MANUFACTURERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '3M Company',
    country: 'US',
    website: 'https://www.3m.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Honeywell International',
    country: 'US',
    website: 'https://www.honeywell.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Ansell Limited',
    country: 'AU',
    website: 'https://www.ansell.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'MSA Safety Incorporated',
    country: 'US',
    website: 'https://www.msasafety.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Dragerwerk AG',
    country: 'DE',
    website: 'https://www.draeger.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Uvex Safety Group',
    country: 'DE',
    website: 'https://www.uvex-safety.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Delta Plus Group',
    country: 'FR',
    website: 'https://www.deltaplus.fr',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
]

/**
 * 获取制造商列表（客户端）
 */
export async function getPPEManufacturersClient({
  page = 1,
  limit = 20,
  country,
  search,
}: {
  page?: number
  limit?: number
  country?: string
  search?: string
}) {
  const supabase = createClient()
  
  try {
    let query = supabase
      .from('ppe_manufacturers')
      .select('*', { count: 'exact' })
    
    if (country) {
      query = query.eq('country', country)
    }

    if (search) {
      const term = escapeIlikeSearch(search.trim())
      query = query.or(`name.ilike.%${term}%,country.ilike.%${term}%,address.ilike.%${term}%,province.ilike.%${term}%,city.ilike.%${term}%,business_scope.ilike.%${term}%`)
    }
    
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to).order('name', { ascending: true })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Failed to load manufacturers:', error)
      let filteredData = DEFAULT_MANUFACTURERS
      if (country) {
        filteredData = filteredData.filter(m => m.country === country)
      }
      if (search) {
        filteredData = filteredData.filter(m => 
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.country.toLowerCase().includes(search.toLowerCase())
        )
      }
      return { 
        data: filteredData, 
        total: filteredData.length, 
        page, 
        limit 
      }
    }
    
    if (!data || data.length === 0) {
      let filteredData = DEFAULT_MANUFACTURERS
      if (country) {
        filteredData = filteredData.filter(m => m.country === country)
      }
      if (search) {
        filteredData = filteredData.filter(m => 
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.country.toLowerCase().includes(search.toLowerCase())
        )
      }
      return { 
        data: filteredData, 
        total: filteredData.length, 
        page, 
        limit 
      }
    }
    
    return {
      data: data as any[],
      total: count || 0,
      page,
      limit,
    }
  } catch (error) {
    console.error('Error in getPPEManufacturersClient:', error)
    let filteredData = DEFAULT_MANUFACTURERS
    if (country) {
      filteredData = DEFAULT_MANUFACTURERS.filter(m => m.country === country)
    }
    return { 
      data: filteredData, 
      total: filteredData.length, 
      page, 
      limit 
    }
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
    .order('name')
  
  if (error) {
    console.error('获取竞争对手列表失败:', error)
    return []
  }
  
  return data || []
}

// 导出别名
export const getCompetitors = getCompetitorsClient
