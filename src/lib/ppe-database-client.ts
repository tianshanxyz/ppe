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
