/**
 * PPE API 客户端
 * 
 * 对接新的后端API，提供完整的PPE数据查询功能
 */

const API_BASE = '/api/ppe'

export interface PPEProduct {
  id: string
  name: string
  model: string
  category: string
  subcategory: string
  description: string
  manufacturer_name: string
  country_of_origin: string
  product_code: string
  risk_level: string
  data_source: string
  created_at: string
  updated_at: string
}

export interface PPEManufacturer {
  id: string
  name: string
  country: string
  address: string
  province: string
  city: string
  business_scope: string
  created_at: string
  updated_at: string
}

export interface PPERegulation {
  id: string
  name: string
  code: string
  region: string
  description: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    filters?: Record<string, string>
    sort?: { by: string; order: string }
  }
}

export interface PPEStats {
  overview: {
    totalProducts: number
    totalManufacturers: number
    totalRegulations: number
  }
  distributions: {
    category: Record<string, number>
    country: Record<string, number>
    riskLevel: Record<string, number>
    dataSource: Record<string, number>
  }
}

// ============================================
// 产品API
// ============================================

export async function getPPEProducts({
  page = 1,
  limit = 20,
  search = '',
  category = '',
  subcategory = '',
  country = '',
  riskLevel = '',
  dataSource = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
}: {
  page?: number
  limit?: number
  search?: string
  category?: string
  subcategory?: string
  country?: string
  riskLevel?: string
  dataSource?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<PPEProduct[]>> {
  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(limit))
  if (search) params.append('search', search)
  if (category) params.append('category', category)
  if (subcategory) params.append('subcategory', subcategory)
  if (country) params.append('country', country)
  if (riskLevel) params.append('riskLevel', riskLevel)
  if (dataSource) params.append('dataSource', dataSource)
  params.append('sortBy', sortBy)
  params.append('sortOrder', sortOrder)

  const response = await fetch(`${API_BASE}/products?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`)
  }
  return response.json()
}

// ============================================
// 制造商API
// ============================================

export async function getPPEManufacturers({
  page = 1,
  limit = 20,
  search = '',
  country = '',
  sortBy = 'name',
  sortOrder = 'asc',
}: {
  page?: number
  limit?: number
  search?: string
  country?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<PPEManufacturer[]>> {
  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(limit))
  if (search) params.append('search', search)
  if (country) params.append('country', country)
  params.append('sortBy', sortBy)
  params.append('sortOrder', sortOrder)

  const response = await fetch(`${API_BASE}/manufacturers?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch manufacturers: ${response.statusText}`)
  }
  return response.json()
}

// ============================================
// 法规API
// ============================================

export async function getPPERegulations({
  page = 1,
  limit = 20,
  search = '',
  region = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
}: {
  page?: number
  limit?: number
  search?: string
  region?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<PPERegulation[]>> {
  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(limit))
  if (search) params.append('search', search)
  if (region) params.append('region', region)
  params.append('sortBy', sortBy)
  params.append('sortOrder', sortOrder)

  const response = await fetch(`${API_BASE}/regulations?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch regulations: ${response.statusText}`)
  }
  return response.json()
}

// ============================================
// 统计API
// ============================================

export async function getPPEStats(): Promise<{ data: PPEStats; meta: { timestamp: string } }> {
  const response = await fetch(`${API_BASE}/stats`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`)
  }
  return response.json()
}

// ============================================
// 筛选选项API
// ============================================

export async function getPPEFilterOptions(): Promise<{
  categories: string[]
  subcategories: string[]
  countries: string[]
  riskLevels: string[]
  dataSources: string[]
}> {
  const stats = await getPPEStats()
  const { distributions } = stats.data

  return {
    categories: Object.keys(distributions.category),
    subcategories: [], // 需要额外查询
    countries: Object.keys(distributions.country),
    riskLevels: Object.keys(distributions.riskLevel),
    dataSources: Object.keys(distributions.dataSource),
  }
}
