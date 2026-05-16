import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { calculateTrustScore, TrustScoreData } from '@/lib/trust/scoring'

export interface CompanyComparisonData {
  id: string
  name: string
  legal_name?: string
  registration_number?: string
  country?: string
  trust_score?: number
  markets?: string[]
  riskAlerts?: { level: string }[]
  [key: string]: string | number | boolean | string[] | { level: string }[] | null | undefined
}

export interface CompanyComparison {
  companies: CompanyComparisonData[]
  comparison: {
    markets: string[]
    totalProducts: number
    averageTrustScore: number
    riskDistribution: Record<string, number>
  }
}

/**
 * POST /api/comparison/companies
 * 企业对比 API
 * 
 * Body: { companyIds: string[] }
 * Response: 企业对比数据矩阵
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyIds } = body

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { error: 'companyIds array is required' },
        { status: 400 }
      )
    }

    if (companyIds.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 companies can be compared at once' },
        { status: 400 }
      )
    }

    
      const supabase = await createClient()

    // 获取企业数据
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .in('id', companyIds)

    if (companiesError) {
      console.error('Company comparison error:', companiesError)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'No companies found' },
        { status: 404 }
      )
    }

    // 获取各企业的产品数量
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('company_id, market')
      .in('company_id', companyIds)

    if (productsError) {
      console.error('Products fetch error:', productsError)
    }

    // 获取各企业的风险警报
    const { data: alerts, error: alertsError } = await supabase
      .from('risk_alerts')
      .select('entity_id, risk_level')
      .in('entity_id', companyIds)
      .eq('entity_type', 'company')

    if (alertsError) {
      console.error('Alerts fetch error:', alertsError)
    }

    // 构建对比数据
    const companyData = companies.map((company: any) => {
      const companyProducts = (products || []).filter((p: any) => p.company_id === company.id)
      const companyAlerts = (alerts || []).filter((a: any) => a.entity_id === company.id)
      
      const trustScore = calculateTrustScore(company, { data: { alerts: companyAlerts } })
      
      const markets = Array.from(new Set(companyProducts.map((p: any) => p.market).filter(Boolean)))

      return {
        id: company.id,
        name: company.name,
        country: company.country,
        website: company.website,
        status: company.status,
        productCount: companyProducts.length,
        markets,
        marketCount: markets.length,
        trustScore: trustScore.score,
        trustLevel: trustScore.level,
        riskCount: companyAlerts.length,
        riskAlerts: companyAlerts.map((a: any) => ({
          level: a.risk_level,
        })),
        createdAt: company.created_at,
      }
    })

    const allMarkets = Array.from(
      new Set(companyData.flatMap((c: any) => c.markets))
    )
    const totalProducts = companyData.reduce((sum: number, c: any) => sum + c.productCount, 0)
    const averageTrustScore = companyData.reduce((sum: number, c: any) => sum + c.trustScore, 0) / companyData.length
    
    // 风险分布统计
    const riskDistribution: Record<string, number> = {}
    companyData.forEach((c: any) => {
      c.riskAlerts.forEach((a: any) => {
        riskDistribution[a.level] = (riskDistribution[a.level] || 0) + 1
      })
    })

    const comparison: CompanyComparison = {
      companies: companyData,
      comparison: {
        markets: allMarkets as string[],
        totalProducts,
        averageTrustScore,
        riskDistribution,
      },
    }

    return NextResponse.json({ data: comparison })
  } catch (error) {
    console.error('Company comparison error:', error)
    return NextResponse.json(
      { error: 'Company comparison failed' },
      { status: 500 }
    )
  }
}
