import { createClient } from '@/lib/supabase/client'
import categoryConfig from '@/data/ppe/categories.json'
import marketConfig from '@/data/ppe/markets.json'
import complianceConfig from '@/data/ppe/compliance-data.json'
import membershipConfig from '@/data/ppe/membership-tiers.json'

export interface PPECategory {
  id: string
  name: string
  name_zh: string
  description: string
  icon: string
  sort_order: number
  subcategories?: Array<{
    id: string
    name: string
    name_zh: string
    description: string
    parent_id: string
  }>
  product_features?: {
    materials: string[]
    protection_levels: string[]
    intended_uses: string[]
  }
}

export interface TargetMarket {
  code: string
  name: string
  name_zh: string
  flag_emoji: string
  regulation_name: string
  authority: string
}

export interface ComplianceData {
  category_id: string
  market_code: string
  classification: string
  standards: Array<{
    name: string
    title: string
    url: string
  }>
  certification_requirements: string[]
  estimated_cost: {
    min: number
    max: number
    currency: string
  }
  estimated_timeline: {
    min: number
    max: number
    unit: string
  }
  customs_documents: string[]
  risk_warnings: string[]
}

export interface MembershipTier {
  id: string
  name: string
  name_zh: string
  price: number
  currency: string
  billing_period: string
  features: string[]
  limitations: string[]
  recommended_for: string
  popular?: boolean
}

export interface PPEStats {
  totalProducts: number
  totalRegulations: number
  totalManufacturers: number
  categoryCount: Record<string, number>
  marketCount: Record<string, number>
}

export function getPPECategories(): PPECategory[] {
  return categoryConfig.sort((a, b) => a.sort_order - b.sort_order)
}

export function getTargetMarkets(): TargetMarket[] {
  return marketConfig
}

export function getComplianceData(categoryId: string, marketCode: string): ComplianceData | null {
  return complianceConfig.find(
    data => data.category_id === categoryId && data.market_code === marketCode
  ) || null
}

export function getMembershipTiers(): MembershipTier[] {
  return membershipConfig
}

export function getPPECategoryById(id: string): PPECategory | undefined {
  return categoryConfig.find(cat => cat.id === id)
}

export function getTargetMarketByCode(code: string): TargetMarket | undefined {
  return marketConfig.find(market => market.code === code)
}

export async function getPPEStats(): Promise<PPEStats> {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  try {
    const supabase = createClient()

    const { count: totalProducts } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })

    const { data: categoryData } = await supabase
      .from('ppe_products')
      .select('product_category')

    const { data: marketData } = await supabase
      .from('ppe_products')
      .select('market')

    const { count: totalManufacturers } = await supabase
      .from('ppe_manufacturers')
      .select('id', { count: 'exact', head: true })

    const { count: totalRegulations } = await supabase
      .from('ppe_regulations')
      .select('id', { count: 'exact', head: true })

    const categoryCount: Record<string, number> = {}
    if (categoryData) {
      categoryData.forEach((row: { product_category: string | null }) => {
        const cat = row.product_category
        if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })
    }

    const marketCount: Record<string, number> = {}
    if (marketData) {
      marketData.forEach((row: { market: string | null }) => {
        const m = row.market
        if (m) marketCount[m] = (marketCount[m] || 0) + 1
      })
    }

    return {
      totalProducts: totalProducts || 0,
      totalRegulations: totalRegulations || 0,
      totalManufacturers: totalManufacturers || 0,
      categoryCount,
      marketCount,
    }
  } catch {
    const categoryCount: Record<string, number> = {}
    categories.forEach(cat => {
      categoryCount[cat.id] = 0
    })

    const marketCount: Record<string, number> = {}
    markets.forEach(market => {
      marketCount[market.code] = 0
    })

    return {
      totalProducts: 0,
      totalRegulations: 0,
      totalManufacturers: 0,
      categoryCount,
      marketCount,
    }
  }
}
