import { createClient } from '@/lib/supabase/client'
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/service'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

export interface Manufacturer {
  id: string
  name: string
  name_zh?: string
  description?: string
  country: string
  city?: string
  address?: string
  website?: string
  email?: string
  phone?: string
  certifications: string[]
  products_count: number
  credit_score?: number
  verification_status: 'verified' | 'pending' | 'rejected'
  logo_url?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ManufacturerFilters {
  country?: string
  verification_status?: string
  search?: string
  status?: string
}

const supabase = createClient()

export async function getManufacturers(filters?: ManufacturerFilters, limit = 50, offset = 0) {
  const cacheKey = cacheKeys.manufacturers.list(JSON.stringify({ filters, limit, offset }))
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      let query = supabase
        .from('manufacturers')
        .select('*', { count: 'exact' })
        .eq('status', filters?.status || 'active')
        .order('products_count', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters?.country) {
        query = query.eq('country', filters.country)
      }

      if (filters?.verification_status) {
        query = query.eq('verification_status', filters.verification_status)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${escapeIlikeSearch(filters.search)}%,description.ilike.%${escapeIlikeSearch(filters.search)}%,country.ilike.%${escapeIlikeSearch(filters.search)}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching manufacturers:', error)
        return { manufacturers: [], count: 0, error }
      }

      return { 
        manufacturers: data as Manufacturer[], 
        count: count || 0,
        error: null 
      }
    },
    cacheTTL.medium
  )
}

export async function getManufacturerById(id: string) {
  const cacheKey = cacheKeys.manufacturers.detail(id)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching manufacturer:', error)
        return { manufacturer: null, error }
      }

      return { manufacturer: data as Manufacturer, error: null }
    },
    cacheTTL.medium
  )
}

export async function getManufacturersByCountry(country: string) {
  const cacheKey = `manufacturers:country:${country}`
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('country', country)
        .eq('status', 'active')
        .order('products_count', { ascending: false })

      if (error) {
        console.error('Error fetching manufacturers by country:', error)
        return { manufacturers: [], error }
      }

      return { manufacturers: data as Manufacturer[], error: null }
    },
    cacheTTL.long
  )
}

// 获取制造商统计
export async function getManufacturerStats() {
  const cacheKey = cacheKeys.manufacturers.stats()
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('country, verification_status')
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching manufacturer stats:', error)
        return { stats: null, error }
      }

      // 统计
      const byCountry: Record<string, number> = {}
      const byVerification: Record<string, number> = {}

      data.forEach((m: any) => {
        byCountry[m.country] = (byCountry[m.country] || 0) + 1
        byVerification[m.verification_status] = (byVerification[m.verification_status] || 0) + 1
      })

      return {
        stats: {
          total: data.length,
          byCountry,
          byVerification,
        },
        error: null,
      }
    },
    cacheTTL.extended
  )
}

// 创建制造商
export async function createManufacturer(manufacturer: Partial<Manufacturer>) {
  const { data, error } = await supabase
    .from('manufacturers')
    .insert(manufacturer)
    .select()
    .single()

  if (error) {
    console.error('Error creating manufacturer:', error)
    return { manufacturer: null, error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.manufacturers.stats())

  return { manufacturer: data as Manufacturer, error: null }
}

// 更新制造商
export async function updateManufacturer(id: string, updates: Partial<Manufacturer>) {
  const { data, error } = await supabase
    .from('manufacturers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating manufacturer:', error)
    return { manufacturer: null, error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.manufacturers.detail(id))
  cache.delete(cacheKeys.manufacturers.stats())

  return { manufacturer: data as Manufacturer, error: null }
}

// 删除制造商
export async function deleteManufacturer(id: string) {
  const { error } = await supabase
    .from('manufacturers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting manufacturer:', error)
    return { error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.manufacturers.detail(id))
  cache.delete(cacheKeys.manufacturers.stats())

  return { error: null }
}
