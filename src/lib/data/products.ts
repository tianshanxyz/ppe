import { createClient } from '@/lib/supabase/client'
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/service'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

export interface PPEProduct {
  id: string
  name: string
  name_zh?: string
  category: string
  subcategory?: string
  description?: string
  description_zh?: string
  hs_code?: string
  regulations: string[]
  certifications: string[]
  standards: string[]
  risk_level?: 'low' | 'medium' | 'high'
  image_url?: string
  manufacturer_id?: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ProductFilters {
  category?: string
  subcategory?: string
  risk_level?: string
  search?: string
  status?: string
}

const supabase = createClient()

export async function getProducts(filters?: ProductFilters, limit = 50, offset = 0) {
  const cacheKey = cacheKeys.products.list(JSON.stringify({ filters, limit, offset }))
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      let query = supabase
        .from('ppe_products')
        .select('*', { count: 'exact' })
        .eq('status', filters?.status || 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory)
      }

      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${escapeIlikeSearch(filters.search)}%,description.ilike.%${escapeIlikeSearch(filters.search)}%,hs_code.ilike.%${escapeIlikeSearch(filters.search)}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching products:', error)
        return { products: [], count: 0, error }
      }

      return { 
        products: data as PPEProduct[], 
        count: count || 0,
        error: null 
      }
    },
    cacheTTL.medium
  )
}

export async function getProductById(id: string) {
  const cacheKey = cacheKeys.products.detail(id)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('ppe_products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        return { product: null, error }
      }

      return { product: data as PPEProduct, error: null }
    },
    cacheTTL.medium
  )
}

export async function getProductsByCategory(category: string) {
  const cacheKey = cacheKeys.products.byCategory(category)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('ppe_products')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching products by category:', error)
        return { products: [], error }
      }

      return { products: data as PPEProduct[], error: null }
    },
    cacheTTL.long
  )
}

// 获取产品分类列表
export async function getProductCategories() {
  const cacheKey = cacheKeys.products.categories()
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('ppe_products')
        .select('category')
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching categories:', error)
        return { categories: [], error }
      }

      // 提取唯一的分类
      const categories = [...new Set(data.map((item: any) => item.category))]
      return { categories, error: null }
    },
    cacheTTL.extended
  )
}

// 创建产品
export async function createProduct(product: Partial<PPEProduct>) {
  const { data, error } = await supabase
    .from('ppe_products')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { product: null, error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.products.categories())
  if (product.category) {
    cache.delete(cacheKeys.products.byCategory(product.category))
  }

  return { product: data as PPEProduct, error: null }
}

// 更新产品
export async function updateProduct(id: string, updates: Partial<PPEProduct>) {
  const { data, error } = await supabase
    .from('ppe_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { product: null, error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.products.detail(id))
  cache.delete(cacheKeys.products.categories())
  if (updates.category) {
    cache.delete(cacheKeys.products.byCategory(updates.category))
  }

  return { product: data as PPEProduct, error: null }
}

// 删除产品
export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('ppe_products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return { error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.products.detail(id))
  cache.delete(cacheKeys.products.categories())

  return { error: null }
}
