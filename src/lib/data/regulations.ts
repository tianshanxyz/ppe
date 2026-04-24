import { createClient } from '@/lib/supabase/client'
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/service'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

export interface Regulation {
  id: string
  title: string
  title_zh?: string
  description?: string
  description_zh?: string
  market: string
  category?: string
  document_type: 'regulation' | 'standard' | 'guidance' | 'directive'
  issuing_authority?: string
  effective_date?: string
  expiry_date?: string
  status: 'active' | 'draft' | 'expired' | 'superseded'
  document_url?: string
  related_regulations?: string[]
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface RegulationFilters {
  market?: string
  category?: string
  document_type?: string
  status?: string
  search?: string
}

const supabase = createClient()

export async function getRegulations(filters?: RegulationFilters, limit = 50, offset = 0) {
  const cacheKey = cacheKeys.regulations.list(JSON.stringify({ filters, limit, offset }))
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      let query = supabase
        .from('regulations')
        .select('*', { count: 'exact' })
        .eq('status', filters?.status || 'active')
        .order('effective_date', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filters?.market) {
        query = query.eq('market', filters.market)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${escapeIlikeSearch(filters.search)}%,description.ilike.%${escapeIlikeSearch(filters.search)}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching regulations:', error)
        return { regulations: [], count: 0, error }
      }

      return { 
        regulations: data as Regulation[], 
        count: count || 0,
        error: null 
      }
    },
    cacheTTL.medium
  )
}

export async function getRegulationById(id: string) {
  const cacheKey = cacheKeys.regulations.detail(id)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('regulations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching regulation:', error)
        return { regulation: null, error }
      }

      return { regulation: data as Regulation, error: null }
    },
    cacheTTL.medium
  )
}

export async function getRegulationsByMarket(market: string) {
  const cacheKey = cacheKeys.regulations.byMarket(market)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('regulations')
        .select('*')
        .eq('market', market)
        .eq('status', 'active')
        .order('effective_date', { ascending: false })

      if (error) {
        console.error('Error fetching regulations by market:', error)
        return { regulations: [], error }
      }

      return { regulations: data as Regulation[], error: null }
    },
    cacheTTL.long
  )
}

// 获取合规要求
export async function getComplianceRequirements(category: string, market: string) {
  const cacheKey = cacheKeys.compliance.requirements(category, market)
  
  return cache.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select(`
          *,
          regulation:regulation_id (*)
        `)
        .eq('category', category)
        .eq('market', market)
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching compliance requirements:', error)
        return { requirements: [], error }
      }

      return { requirements: data, error: null }
    },
    cacheTTL.long
  )
}

// 创建法规
export async function createRegulation(regulation: Partial<Regulation>) {
  const { data, error } = await supabase
    .from('regulations')
    .insert(regulation)
    .select()
    .single()

  if (error) {
    console.error('Error creating regulation:', error)
    return { regulation: null, error }
  }

  // 清除相关缓存
  if (regulation.market) {
    cache.delete(cacheKeys.regulations.byMarket(regulation.market))
  }

  return { regulation: data as Regulation, error: null }
}

// 更新法规
export async function updateRegulation(id: string, updates: Partial<Regulation>) {
  const { data, error } = await supabase
    .from('regulations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating regulation:', error)
    return { regulation: null, error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.regulations.detail(id))
  if (updates.market) {
    cache.delete(cacheKeys.regulations.byMarket(updates.market))
  }

  return { regulation: data as Regulation, error: null }
}

// 删除法规
export async function deleteRegulation(id: string) {
  const { error } = await supabase
    .from('regulations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting regulation:', error)
    return { error }
  }

  // 清除相关缓存
  cache.delete(cacheKeys.regulations.detail(id))

  return { error: null }
}
