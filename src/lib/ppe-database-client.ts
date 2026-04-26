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
  product_name: string
  product_code: string
  category: string
  product_category: string
  ppe_category: 'I' | 'II' | 'III'
  manufacturer_name: string
  manufacturer_country: string
  description: string
  risk_level: 'low' | 'medium' | 'high'
  registration_status: 'active' | 'expired' | 'suspended' | 'cancelled'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
}

// 默认产品数据（当数据库不可用时作为回退）
const DEFAULT_PRODUCTS: PPEProduct[] = [
  {
    id: '1',
    name: 'N95 Respirator Mask',
    product_name: 'N95 Respirator Mask',
    product_code: 'N95-001',
    category: 'Respiratory Protection',
    product_category: 'Respiratory Protection',
    ppe_category: 'III',
    manufacturer_name: '3M Company',
    manufacturer_country: 'United States',
    description: 'NIOSH-approved N95 particulate respirator with 95% filtration efficiency against solid and liquid aerosols.',
    risk_level: 'high',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: '3M Safety Goggles',
    product_name: '3M Safety Goggles',
    product_code: 'SG-200',
    category: 'Eye Protection',
    product_category: 'Eye Protection',
    ppe_category: 'II',
    manufacturer_name: '3M Company',
    manufacturer_country: 'United States',
    description: 'Chemical splash goggles with anti-fog coating and indirect ventilation.',
    risk_level: 'medium',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-02-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Honeywell North 7700 Half Mask',
    product_name: 'Honeywell North 7700 Half Mask',
    product_code: 'HW-7700',
    category: 'Respiratory Protection',
    product_category: 'Respiratory Protection',
    ppe_category: 'III',
    manufacturer_name: 'Honeywell International',
    manufacturer_country: 'United States',
    description: 'Silicone half mask respirator compatible with NIOSH-approved cartridges and filters.',
    risk_level: 'high',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-03-10T00:00:00Z'
  },
  {
    id: '4',
    name: '3M Peltor Optime 105 Earmuffs',
    product_name: '3M Peltor Optime 105 Earmuffs',
    product_code: 'PE-105',
    category: 'Hearing Protection',
    product_category: 'Hearing Protection',
    ppe_category: 'II',
    manufacturer_name: '3M Company',
    manufacturer_country: 'United States',
    description: 'High-attenuation earmuffs with NRR 30dB for extreme noise environments.',
    risk_level: 'medium',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-04-05T00:00:00Z'
  },
  {
    id: '5',
    name: 'Honeywell Rig Dog Xtreme Gloves',
    product_name: 'Honeywell Rig Dog Xtreme Gloves',
    product_code: 'HW-RDX',
    category: 'Safety Gloves',
    product_category: 'Safety Gloves',
    ppe_category: 'II',
    manufacturer_name: 'Honeywell International',
    manufacturer_country: 'United States',
    description: 'Cut-resistant work gloves with impact protection and oil-resistant grip.',
    risk_level: 'medium',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-05-12T00:00:00Z'
  },
  {
    id: '6',
    name: '3M SecureFit Safety Helmet',
    product_name: '3M SecureFit Safety Helmet',
    product_code: 'SF-500',
    category: 'Safety Helmets',
    product_category: 'Safety Helmets',
    ppe_category: 'II',
    manufacturer_name: '3M Company',
    manufacturer_country: 'United States',
    description: 'Lightweight safety helmet with UV indicator and adjustable suspension system.',
    risk_level: 'medium',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-06-18T00:00:00Z'
  },
  {
    id: '7',
    name: 'Ansell HyFlex 11-800 Gloves',
    product_name: 'Ansell HyFlex 11-800 Gloves',
    product_code: 'AN-11800',
    category: 'Safety Gloves',
    product_category: 'Safety Gloves',
    ppe_category: 'II',
    manufacturer_name: 'Ansell Limited',
    manufacturer_country: 'Australia',
    description: 'Multi-purpose industrial gloves with foam nitrile coating for excellent grip.',
    risk_level: 'low',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-07-22T00:00:00Z'
  },
  {
    id: '8',
    name: 'MSA V-Gard Hard Hat',
    product_name: 'MSA V-Gard Hard Hat',
    product_code: 'MSA-VG',
    category: 'Safety Helmets',
    product_category: 'Safety Helmets',
    ppe_category: 'II',
    manufacturer_name: 'MSA Safety Incorporated',
    manufacturer_country: 'United States',
    description: 'Industry-standard hard hat with Fas-Trac suspension and accessory slots.',
    risk_level: 'medium',
    registration_status: 'active',
    status: 'active',
    created_at: '2024-08-30T00:00:00Z'
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
      .eq('status', 'active')
    
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
        filteredData = filteredData.filter(p => p.manufacturer_country === filters.country)
      }
      if (filters.category) {
        filteredData = filteredData.filter(p => p.product_category === filters.category)
      }
      if (filters.ppe_category) {
        filteredData = filteredData.filter(p => p.ppe_category === filters.ppe_category)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(p =>
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
        filteredData = filteredData.filter(p => p.manufacturer_country === filters.country)
      }
      if (filters.category) {
        filteredData = filteredData.filter(p => p.product_category === filters.category)
      }
      if (filters.ppe_category) {
        filteredData = filteredData.filter(p => p.ppe_category === filters.ppe_category)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(p =>
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
      filteredData = filteredData.filter(p => p.manufacturer_country === filters.country)
    }
    if (filters.category) {
      filteredData = filteredData.filter(p => p.product_category === filters.category)
    }
    if (filters.ppe_category) {
      filteredData = filteredData.filter(p => p.ppe_category === filters.ppe_category)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(p =>
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
      .select('category,product_category')
    
    const categoryCount: Record<string, number> = {}
    categories?.forEach(p => {
      const category = p.product_category || p.category
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1
      }
    })
    
    // 获取 PPE 分类分布
    const { data: ppeCategories } = await supabase
      .from('ppe_products')
      .select('ppe_category')
    
    const ppeCategoryCount: Record<string, number> = {}
    ppeCategories?.forEach(p => {
      if (p.ppe_category) {
        ppeCategoryCount[p.ppe_category] = (ppeCategoryCount[p.ppe_category] || 0) + 1
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
      .select('category,product_category')
    
    if (error) {
      console.error('Failed to fetch category list:', error)
      return DEFAULT_CATEGORIES
    }
    
    const categories = new Set<string>()
    data?.forEach(p => {
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

// 默认制造商数据（作为回退数据）
const DEFAULT_MANUFACTURERS = [
  {
    id: '1',
    company_name: 'SafeStep Manufacturing Co., Ltd.',
    company_name_zh: '安全步伐制造有限公司',
    country: 'China',
    city: 'Shenzhen',
    business_type: ['manufacturer'],
    product_categories: ['Safety Footwear', 'Safety Gloves'],
    certifications: ['ISO9001', 'CE', 'FDA'],
    credit_score: 85,
    risk_level: 'low',
    year_established: 2005,
    employee_count: '201-500',
    main_markets: ['EU', 'US', 'Asia'],
    description: 'Leading manufacturer of safety footwear and gloves with 18+ years experience.',
    status: 'active',
    verified: true
  },
  {
    id: '2',
    company_name: 'ChemSafe GmbH',
    country: 'Germany',
    city: 'Munich',
    business_type: ['manufacturer', 'distributor'],
    product_categories: ['Safety Gloves', 'Chemical Protection'],
    certifications: ['ISO9001', 'CE', 'ISO14001'],
    credit_score: 92,
    risk_level: 'low',
    year_established: 1998,
    employee_count: '500+',
    main_markets: ['EU', 'US'],
    description: 'German manufacturer specializing in chemical resistant PPE.',
    status: 'active',
    verified: true
  },
  {
    id: '3',
    company_name: 'HeadGuard Industries',
    company_name_zh: '头部防护工业公司',
    country: 'China',
    city: 'Shanghai',
    business_type: ['manufacturer'],
    product_categories: ['Safety Helmets', 'Eye Protection'],
    certifications: ['CE', 'ANSI'],
    credit_score: 78,
    risk_level: 'medium',
    year_established: 2010,
    employee_count: '51-200',
    main_markets: ['Asia', 'Africa'],
    description: 'Professional safety helmet and eye protection manufacturer.',
    status: 'active',
    verified: false
  },
  {
    id: '4',
    company_name: 'VisionSafe Corp',
    country: 'USA',
    city: 'Chicago',
    business_type: ['manufacturer', 'trader'],
    product_categories: ['Eye Protection', 'Face Protection'],
    certifications: ['ANSI', 'OSHA', 'CE'],
    credit_score: 88,
    risk_level: 'low',
    year_established: 2002,
    employee_count: '201-500',
    main_markets: ['US', 'EU', 'Canada'],
    description: 'American leader in eye and face protection equipment.',
    status: 'active',
    verified: true
  },
  {
    id: '5',
    company_name: 'BreatheSafe Ltd',
    country: 'UK',
    city: 'Manchester',
    business_type: ['manufacturer', 'distributor'],
    product_categories: ['Respiratory Protection'],
    certifications: ['CE', 'ISO13485'],
    credit_score: 90,
    risk_level: 'low',
    year_established: 2008,
    employee_count: '51-200',
    main_markets: ['EU', 'UK', 'US'],
    description: 'UK-based respiratory protection specialist.',
    status: 'active',
    verified: true
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
      const term = search.trim()
      query = query.or(`company_name.ilike.%${term}%,country.ilike.%${term}%,city.ilike.%${term}%`)
    }
    
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to).order('company_name', { ascending: true })
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Failed to load manufacturers:', error)
      let filteredData = DEFAULT_MANUFACTURERS
      if (country) {
        filteredData = filteredData.filter(m => m.country === country)
      }
      if (search) {
        filteredData = filteredData.filter(m => 
          m.company_name.toLowerCase().includes(search.toLowerCase()) ||
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
          m.company_name.toLowerCase().includes(search.toLowerCase()) ||
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
    .order('company_name')
  
  if (error) {
    console.error('获取竞争对手列表失败:', error)
    return []
  }
  
  return data || []
}

// 导出别名
export const getCompetitors = getCompetitorsClient
