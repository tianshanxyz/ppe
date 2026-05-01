import { createClient } from '@/lib/supabase/client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

/**
 * PPE 数据访问服务
 * 
 * 提供 PPE 相关数据的数据库访问接口
 */

/**
 * 获取所有 PPE 品类
 */
export async function getPPECategories() {
  const categories = [
    { id: 'head-protection', name: 'Head Protection', name_zh: '头部防护', icon: '⛑️' },
    { id: 'eye-protection', name: 'Eye & Face Protection', name_zh: '眼面防护', icon: '🥽' },
    { id: 'respiratory-protection', name: 'Respiratory Protection', name_zh: '呼吸防护', icon: '😷' },
    { id: 'body-protection', name: 'Body Protection', name_zh: '身体防护', icon: '🥼' },
    { id: 'hand-protection', name: 'Hand Protection', name_zh: '手部防护', icon: '🧤' },
    { id: 'foot-protection', name: 'Foot Protection', name_zh: '足部防护', icon: '👢' },
    { id: 'fall-protection', name: 'Fall Protection', name_zh: '坠落防护', icon: '🪢' },
    { id: 'hearing-protection', name: 'Hearing Protection', name_zh: '听力防护', icon: '🎧' },
    { id: 'high-visibility', name: 'High Visibility', name_zh: '高可视警示', icon: '🦺' },
    { id: 'firefighting', name: 'Firefighting Equipment', name_zh: '消防装备', icon: '🧯' },
    { id: 'welding', name: 'Welding Protection', name_zh: '焊接防护', icon: '🔥' },
    { id: 'cold-protection', name: 'Cold Protection', name_zh: '低温防护', icon: '❄️' },
    { id: 'diving', name: 'Diving Protection', name_zh: '潜水防护', icon: '🤿' },
    { id: 'electrical', name: 'Electrical Protection', name_zh: '电气防护', icon: '⚡' },
  ]
  
  return categories
}

/**
 * 获取所有目标市场
 */
export async function getTargetMarkets() {
  const markets = [
    { code: 'EU', name: 'European Union', name_zh: '欧盟', flag_emoji: '🇪🇺' },
    { code: 'US', name: 'United States', name_zh: '美国', flag_emoji: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', name_zh: '英国', flag_emoji: '🇬🇧' },
    { code: 'CN', name: 'China', name_zh: '中国', flag_emoji: '🇨🇳' },
    { code: 'JP', name: 'Japan', name_zh: '日本', flag_emoji: '🇯🇵' },
    { code: 'AU', name: 'Australia', name_zh: '澳大利亚', flag_emoji: '🇦🇺' },
    { code: 'CA', name: 'Canada', name_zh: '加拿大', flag_emoji: '🇨🇦' },
    { code: 'GCC', name: 'Gulf Cooperation Council', name_zh: '海湾六国', flag_emoji: '🌍' },
    { code: 'SEA', name: 'Southeast Asia', name_zh: '东南亚', flag_emoji: '🌏' },
  ]
  
  return markets
}

/**
 * 获取 PPE 产品列表
 */
export async function getPPEProducts(filters?: {
  category?: string
  market?: string
  certification?: string
  search?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_products')
    .select('*')
  
  // 应用筛选条件
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters?.market) {
    query = query.contains('target_markets', [filters.market])
  }
  
  if (filters?.certification) {
    query = query.contains('certifications', [filters.certification])
  }
  
  if (filters?.search) {
    query = query.or(`product_name.ilike.%${escapeIlikeSearch(filters.search)}%,brand.ilike.%${escapeIlikeSearch(filters.search)}%`)
  }
  
  const { data, error } = await query.order('product_name', { ascending: true })
  
  if (error) {
    console.error('获取 PPE 产品失败:', error)
    return []
  }
  
  return data || []
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
      ppe_product_regulations (
        ppe_regulations (*)
      ),
      ppe_product_manufacturers (
        ppe_manufacturers (*)
      )
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
 * 获取 PPE 法规列表
 */
export async function getPPERegulations(filters?: {
  country_region?: string
  regulation_type?: string
  product_category?: string
  search?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('ppe_regulations')
    .select('*')
  
  // 应用筛选条件
  if (filters?.country_region) {
    query = query.eq('country_region', filters.country_region)
  }
  
  if (filters?.regulation_type) {
    query = query.eq('regulation_type', filters.regulation_type)
  }
  
  if (filters?.search) {
    query = query.or(`regulation_name.ilike.%${escapeIlikeSearch(filters.search)}%,description.ilike.%${escapeIlikeSearch(filters.search)}%`)
  }
  
  const { data, error } = await query.order('regulation_name', { ascending: true })
  
  if (error) {
    console.error('获取 PPE 法规失败:', error)
    return []
  }
  
  return data || []
}

/**
 * 获取单个 PPE 法规详情
 */
export async function getPPERegulation(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ppe_regulations')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('获取 PPE 法规详情失败:', error)
    return null
  }
  
  return data
}

/**
 * 获取 PPE 统计数据
 */
export async function getPPEStats() {
  const supabase = createClient()
  
  // 产品统计
  const { count: productsCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
  
  // 法规统计
  const { count: regulationsCount } = await supabase
    .from('ppe_regulations')
    .select('*', { count: 'exact', head: true })
  
  // 企业统计
  const { count: manufacturersCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
  
  // 按品类统计
  const { data: categoryStats } = await supabase
    .from('ppe_products')
    .select('category')
  
  const categoryCount = categoryStats?.reduce((acc: Record<string, number>, product: any) => {
    acc[product.category] = (acc[product.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  // 按市场统计
  const { data: marketStats } = await supabase
    .from('ppe_products')
    .select('target_markets')
  
  const marketCount: Record<string, number> = {}
  marketStats?.forEach((product: any) => {
    product.target_markets?.forEach((market: string) => {
      marketCount[market] = (marketCount[market] || 0) + 1
    })
  })
  
  return {
    totalProducts: productsCount || 0,
    totalRegulations: regulationsCount || 0,
    totalManufacturers: manufacturersCount || 0,
    categoryCount,
    marketCount,
  }
}

/**
 * 搜索 PPE 产品
 */
export async function searchPPEProducts(query: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('search_ppe_products', { search_query: query })
  
  if (error) {
    console.error('搜索 PPE 产品失败:', error)
    return []
  }
  
  return data || []
}

/**
 * 获取合规数据（用于合规自检工具）
 */
export async function getComplianceData(categoryId: string, marketCode: string) {
  const supabase = createClient()
  
  // 查询该品类和市场的产品
  const { data: products } = await supabase
    .from('ppe_products')
    .select(`
      *,
      ppe_product_regulations (
        ppe_regulations (*)
      )
    `)
    .eq('category', categoryId)
    .contains('target_markets', [marketCode])
    .limit(5)
  
  if (!products || products.length === 0) {
    return null
  }
  
  // 汇总合规要求
  const allRegulations = products.flatMap((product: any) => 
    product.ppe_product_regulations?.map((pr: any) => pr.ppe_regulations) || []
  )
  
  const uniqueRegulations = allRegulations.filter(
    (reg: any, index: number, self: any[]) => index === self.findIndex((r: any) => r.id === reg.id)
  )
  
  // 生成合规报告
  return {
    category_id: categoryId,
    market_code: marketCode,
    classification: getCategoryRiskLevel(categoryId, marketCode),
    standards: uniqueRegulations.map((reg: any) => ({
      name: reg.regulation_name,
      title: reg.description,
      url: reg.official_source_url || '#',
    })),
    certification_requirements: getCertificationRequirements(categoryId, marketCode),
    estimated_cost: getEstimatedCost(categoryId, marketCode),
    estimated_timeline: getEstimatedTimeline(categoryId, marketCode),
    customs_documents: getCustomsDocuments(marketCode),
    risk_warnings: getRiskWarnings(categoryId, marketCode),
  }
}

/**
 * 辅助函数：获取品类风险等级
 */
function getCategoryRiskLevel(categoryId: string, marketCode: string): string {
  // 根据品类和市场返回风险等级
  const riskLevels: Record<string, string> = {
    'masks': 'Class IIa / Class IIb',
    'protective-clothing': 'Category II / III',
    'gloves': 'Class I / Class IIa',
    'eye-protection': 'Category II / III',
    'head-protection': 'Category II',
  }
  
  return riskLevels[categoryId] || 'Category II'
}

/**
 * 辅助函数：获取认证要求
 */
function getCertificationRequirements(categoryId: string, marketCode: string): string[] {
  const requirements: Record<string, string[]> = {
    'EU': [
      'CE Marking under EU MDR 2017/745 or PPE Regulation 2016/425',
      'Notified Body assessment (if applicable)',
      'Technical documentation',
      'Quality management system (ISO 13485)',
    ],
    'US': [
      'FDA 510(k) Pre-market Notification (if applicable)',
      'FDA Establishment Registration',
      'Medical Device Listing',
      'Quality System Regulation (21 CFR Part 820)',
    ],
    'UK': [
      'UKCA Marking',
      'UK Responsible Person',
      'MHRA Registration',
      'Technical documentation',
    ],
  }
  
  return requirements[marketCode] || requirements['EU']
}

/**
 * 辅助函数：获取费用估算
 */
function getEstimatedCost(categoryId: string, marketCode: string) {
  const costRanges: Record<string, { min: number; max: number }> = {
    'EU': { min: 15000, max: 35000 },
    'US': { min: 12000, max: 25000 },
    'UK': { min: 12000, max: 28000 },
    'CN': { min: 8000, max: 20000 },
  }
  
  const range = costRanges[marketCode] || { min: 10000, max: 30000 }
  
  return {
    min: range.min,
    max: range.max,
    currency: 'USD',
  }
}

/**
 * 辅助函数：获取时间估算
 */
function getEstimatedTimeline(categoryId: string, marketCode: string) {
  const timelineRanges: Record<string, { min: number; max: number; unit: string }> = {
    'EU': { min: 6, max: 12, unit: 'months' },
    'US': { min: 4, max: 8, unit: 'months' },
    'UK': { min: 4, max: 10, unit: 'months' },
    'CN': { min: 3, max: 6, unit: 'months' },
  }
  
  return timelineRanges[marketCode] || { min: 3, max: 8, unit: 'months' }
}

/**
 * 辅助函数：获取清关文件
 */
function getCustomsDocuments(marketCode: string): string[] {
  const documents: Record<string, string[]> = {
    'EU': [
      'CE Certificate',
      'Declaration of Conformity',
      'Technical File',
      'Test Reports',
      'Commercial Invoice',
      'Packing List',
    ],
    'US': [
      'FDA 510(k) Clearance Letter',
      'FDA Registration Certificate',
      'Test Reports',
      'Commercial Invoice',
      'Packing List',
    ],
    'UK': [
      'UKCA Certificate',
      'UK Declaration of Conformity',
      'Technical File',
      'Test Reports',
      'Commercial Invoice',
      'Packing List',
    ],
  }
  
  return documents[marketCode] || documents['EU']
}

/**
 * 辅助函数：获取风险警告
 */
function getRiskWarnings(categoryId: string, marketCode: string): string[] {
  const warnings: Record<string, string[]> = {
    'EU': [
      'Ensure proper classification based on intended use',
      'Notified Body involvement may be required',
      'Post-market surveillance mandatory',
      'Language requirements for labeling',
    ],
    'US': [
      'Different requirements for different product types',
      'State-specific requirements may apply',
      'FDA inspection possible for foreign manufacturers',
      'Adverse event reporting mandatory',
    ],
    'UK': [
      'UK Responsible Person required for non-UK manufacturers',
      'Separate registration required even with CE marking',
      'Different requirements for Northern Ireland',
    ],
  }
  
  return warnings[marketCode] || warnings['EU']
}
