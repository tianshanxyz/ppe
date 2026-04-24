/**
 * 增强版PPE数据服务
 * 
 * 任务D-001/D-002/D-003: 数据模型和同步服务
 * 创建时间: 2026-04-20
 */

import { createClient } from '@/lib/supabase/client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'
import {
  EnhancedPPEProduct,
  EnhancedPPEManufacturer,
  DataSyncStatus,
  ManufacturerCreditScore,
  DB_TABLES,
  MarketCode,
  CertificationType,
} from './enhanced-types'

// ============================================
// 产品数据服务
// ============================================

/**
 * 获取增强版产品列表（分页）
 */
export async function getEnhancedProducts({
  page = 1,
  limit = 20,
  filters = {},
  sortBy = 'created_at',
  sortOrder = 'desc',
}: {
  page?: number
  limit?: number
  filters?: {
    search?: string
    category?: string
    ppeCategory?: 'I' | 'II' | 'III'
    manufacturerCountry?: string
    targetMarket?: MarketCode
    certificationType?: CertificationType
    registrationStatus?: string
    minQualityScore?: number
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const supabase = createClient()
  
  let query = supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select('*', { count: 'exact' })

  // 应用筛选条件
  if (filters.search) {
    // 使用全文搜索
    query = query.or(`search_vector.fts.${filters.search},product_name.ilike.%${escapeIlikeSearch(filters.search)}%`)
  }

  if (filters.category) {
    query = query.eq('product_category', filters.category)
  }

  if (filters.ppeCategory) {
    query = query.eq('ppe_category', filters.ppeCategory)
  }

  if (filters.manufacturerCountry) {
    query = query.eq('manufacturer_country', filters.manufacturerCountry)
  }

  if (filters.targetMarket) {
    query = query.contains('target_markets', [filters.targetMarket])
  }

  if (filters.certificationType) {
    // JSONB查询：检查certifications字段中是否存在该认证类型
    query = query.filter('certifications', 'cs', `{ "${filters.certificationType.toLowerCase()}": {} }`)
  }

  if (filters.registrationStatus) {
    query = query.eq('registration_status', filters.registrationStatus)
  }

  if (filters.minQualityScore) {
    query = query.gte('data_quality_score', filters.minQualityScore)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('获取产品列表失败:', error)
    return { data: [], total: 0, page, limit }
  }

  return {
    data: data as EnhancedPPEProduct[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取单个产品详情
 */
export async function getEnhancedProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select(`
      *,
      ${DB_TABLES.MANUFACTURERS_ENHANCED}(
        id,
        company_name,
        credit_score,
        compliance_stats
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('获取产品详情失败:', error)
    return null
  }

  return data as EnhancedPPEProduct
}

/**
 * 根据认证编号搜索产品
 */
export async function searchProductsByCertification(
  certType: CertificationType,
  certNumber: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select('*')
    .filter('certifications', 'cs', `{ "${certType.toLowerCase()}": { "certificate_number": "${certNumber}" } }`)
    .limit(10)

  if (error) {
    console.error('认证搜索失败:', error)
    return []
  }

  return data as EnhancedPPEProduct[]
}

/**
 * 获取产品统计数据
 */
export async function getProductStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select('registration_status, ppe_category, manufacturer_country')

  if (error) {
    console.error('获取统计数据失败:', error)
    return null
  }

  // 计算统计
  const stats = {
    total: data.length,
    byStatus: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byCountry: {} as Record<string, number>,
  }

  data.forEach((item: any) => {
    stats.byStatus[item.registration_status] = (stats.byStatus[item.registration_status] || 0) + 1
    stats.byCategory[item.ppe_category] = (stats.byCategory[item.ppe_category] || 0) + 1
    stats.byCountry[item.manufacturer_country] = (stats.byCountry[item.manufacturer_country] || 0) + 1
  })

  return stats
}

// ============================================
// 制造商数据服务
// ============================================

/**
 * 获取增强版制造商列表
 */
export async function getEnhancedManufacturers({
  page = 1,
  limit = 20,
  filters = {},
  sortBy = 'created_at',
  sortOrder = 'desc',
}: {
  page?: number
  limit?: number
  filters?: {
    search?: string
    country?: string
    businessType?: string
    minCreditScore?: number
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const supabase = createClient()
  
  let query = supabase
    .from(DB_TABLES.MANUFACTURERS_ENHANCED)
    .select('*', { count: 'exact' })

  // 应用筛选
  if (filters.search) {
    query = query.or(`search_vector.fts.${filters.search},company_name.ilike.%${escapeIlikeSearch(filters.search)}%`)
  }

  if (filters.country) {
    query = query.filter('headquarters_address', 'cs', `{ "country": "${filters.country}" }`)
  }

  if (filters.businessType) {
    query = query.eq('business_type', filters.businessType)
  }

  if (filters.minCreditScore) {
    query = query.filter('credit_score', 'cs', `{ "overall_score": { "gte": ${filters.minCreditScore} } }`)
  }

  if (filters.riskLevel) {
    query = query.filter('credit_score', 'cs', `{ "risk_level": "${filters.riskLevel}" }`)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('获取制造商列表失败:', error)
    return { data: [], total: 0, page, limit }
  }

  return {
    data: data as EnhancedPPEManufacturer[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * 获取制造商详情（含产品列表）
 */
export async function getEnhancedManufacturer(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from(DB_TABLES.MANUFACTURERS_ENHANCED)
    .select(`
      *,
      products:${DB_TABLES.PRODUCTS_ENHANCED}(
        id,
        product_name,
        product_category,
        certifications,
        registration_status
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('获取制造商详情失败:', error)
    return null
  }

  return data as EnhancedPPEManufacturer & { products: EnhancedPPEProduct[] }
}

/**
 * 计算制造商信用评分
 */
export async function calculateManufacturerCreditScore(
  manufacturerId: string
): Promise<ManufacturerCreditScore | null> {
  const supabase = createClient()
  
  // 获取制造商信息
  const { data: manufacturer, error: mfgError } = await supabase
    .from(DB_TABLES.MANUFACTURERS_ENHANCED)
    .select('*')
    .eq('id', manufacturerId)
    .single()

  if (mfgError || !manufacturer) {
    console.error('获取制造商信息失败:', mfgError)
    return null
  }

  // 获取该制造商的所有产品
  const { data: products, error: prodError } = await supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select('certifications, registration_status, target_markets, approval_date, expiry_date')
    .eq('manufacturer_id', manufacturerId)

  if (prodError) {
    console.error('获取产品信息失败:', prodError)
    return null
  }

  // 计算各维度得分
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  // 1. 合规历史分 (40%)
  const totalCertifications = products?.length || 0
  const activeCertifications = products?.filter((p: any) => p.registration_status === 'active').length || 0
  const avgDuration = products?.reduce((sum: number, p: any) => {
    if (p.approval_date && p.expiry_date) {
      const days = Math.floor((new Date(p.expiry_date).getTime() - new Date(p.approval_date).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }
    return sum
  }, 0) / (products?.length || 1)

  const complianceScore = Math.min(100, 
    (activeCertifications / Math.max(totalCertifications, 1)) * 50 +
    Math.min(avgDuration / 365, 1) * 50
  )

  // 2. 风险事件分 (30%) - 从compliance_stats获取
  const complianceStats = manufacturer.compliance_stats as any || {}
  const recalls = complianceStats.recalls_history?.total_recalls || 0
  const warnings = complianceStats.warning_letters?.total || 0
  const riskScore = Math.max(0, 100 - (recalls * 20 + warnings * 10))

  // 3. 活跃度分 (20%)
  const recentCerts = products?.filter((p: any) => {
    if (p.approval_date) {
      return new Date(p.approval_date) > oneYearAgo
    }
    return false
  }).length || 0
  const activityScore = Math.min(100, recentCerts * 20)

  // 4. 多样性分 (10%)
  const markets = new Set(products?.flatMap((p: any) => p.target_markets || []))
  const diversityScore = Math.min(100, markets.size * 10)

  // 计算总分
  const overallScore = Math.round(
    complianceScore * 0.4 +
    riskScore * 0.3 +
    activityScore * 0.2 +
    diversityScore * 0.1
  )

  // 确定风险等级
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (overallScore < 40) riskLevel = 'critical'
  else if (overallScore < 60) riskLevel = 'high'
  else if (overallScore < 80) riskLevel = 'medium'

  const creditScore: ManufacturerCreditScore = {
    overall_score: overallScore,
    last_calculated: now.toISOString(),
    dimensions: {
      compliance_history: {
        score: Math.round(complianceScore),
        total_certifications: totalCertifications,
        active_certifications: activeCertifications,
        avg_certification_duration_days: Math.round(avgDuration),
      },
      risk_events: {
        score: Math.round(riskScore),
        recalls_count: recalls,
        warning_letters_count: warnings,
        import_alerts_count: 0,
      },
      activity: {
        score: Math.round(activityScore),
        certifications_last_year: recentCerts,
        new_markets_last_year: 0,
      },
      diversity: {
        score: Math.round(diversityScore),
        market_count: markets.size,
        product_category_count: 0,
        certification_type_count: 0,
      },
    },
    risk_level: riskLevel,
    risk_factors: recalls > 0 ? ['有召回记录'] : warnings > 0 ? ['有警告信记录'] : [],
    score_history: [],
  }

  // 更新制造商信用评分
  await supabase
    .from(DB_TABLES.MANUFACTURERS_ENHANCED)
    .update({ credit_score: creditScore })
    .eq('id', manufacturerId)

  return creditScore
}

// ============================================
// 数据同步服务
// ============================================

/**
 * 获取数据同步状态
 */
export async function getDataSyncStatus(dataSource?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from(DB_TABLES.SYNC_STATUS)
    .select('*')

  if (dataSource) {
    query = query.eq('data_source', dataSource)
  }

  const { data, error } = await query
    .order('last_sync_at', { ascending: false })

  if (error) {
    console.error('获取同步状态失败:', error)
    return []
  }

  return data as DataSyncStatus[]
}

/**
 * 更新数据同步状态
 */
export async function updateDataSyncStatus(
  dataSource: string,
  status: Partial<DataSyncStatus>
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from(DB_TABLES.SYNC_STATUS)
    .upsert({
      data_source: dataSource,
      ...status,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'data_source',
    })

  if (error) {
    console.error('更新同步状态失败:', error)
    return false
  }

  return true
}

/**
 * 记录同步错误
 */
export async function logSyncError(
  dataSource: string,
  errorMessage: string,
  errorCode?: string
) {
  const supabase = createClient()
  
  const { data: current } = await supabase
    .from(DB_TABLES.SYNC_STATUS)
    .select('last_error')
    .eq('data_source', dataSource)
    .single()

  const retryCount = (current?.last_error as any)?.retry_count || 0

  await supabase
    .from(DB_TABLES.SYNC_STATUS)
    .update({
      last_sync_status: 'failed',
      last_error: {
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        retry_count: retryCount + 1,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('data_source', dataSource)
}

// ============================================
// 数据质量服务
// ============================================

/**
 * 计算数据完整度评分
 */
export function calculateDataCompleteness(product: Partial<EnhancedPPEProduct>): {
  basic_info: number
  specifications: number
  certifications: number
  test_reports: number
  overall: number
} {
  const checkFields = (obj: any, fields: string[]): number => {
    if (!obj) return 0
    const filled = fields.filter(f => {
      const val = obj[f]
      return val !== undefined && val !== null && val !== '' && 
        !(Array.isArray(val) && val.length === 0) &&
        !(typeof val === 'object' && Object.keys(val).length === 0)
    }).length
    return Math.round((filled / fields.length) * 100)
  }

  const basicFields = ['product_name', 'product_category', 'description', 'manufacturer_name', 'manufacturer_country']
  const specFields = ['dimensions', 'material', 'weight', 'packaging']
  const certFields = ['ce', 'fda_510k', 'nmpa', 'ukca']

  const basicScore = checkFields(product, basicFields)
  const specScore = checkFields(product.specifications, specFields)
  const certScore = checkFields(product.certifications, certFields)
  const testScore = product.test_reports && product.test_reports.length > 0 ? 100 : 0

  return {
    basic_info: basicScore,
    specifications: specScore,
    certifications: certScore,
    test_reports: testScore,
    overall: Math.round((basicScore + specScore + certScore + testScore) / 4),
  }
}

/**
 * 批量更新数据质量评分
 */
export async function updateDataQualityScores() {
  const supabase = createClient()
  
  // 获取所有产品
  const { data: products, error } = await supabase
    .from(DB_TABLES.PRODUCTS_ENHANCED)
    .select('id, specifications, certifications, test_reports')
    .is('data_quality_score', null)
    .limit(100)

  if (error || !products) {
    console.error('获取产品失败:', error)
    return
  }

  // 批量更新
  for (const product of products) {
    const completeness = calculateDataCompleteness(product as any)
    
    await supabase
      .from(DB_TABLES.PRODUCTS_ENHANCED)
      .update({
        data_quality_score: completeness.overall,
        data_completeness: completeness,
      })
      .eq('id', product.id)
  }

  console.log(`已更新 ${products.length} 个产品的质量评分`)
}

// ============================================
// 导出
// ============================================

export type {
  EnhancedPPEProduct,
  EnhancedPPEManufacturer,
  DataSyncStatus,
  ManufacturerCreditScore,
  MarketCode,
  CertificationType,
}

export {
  DB_TABLES,
}
