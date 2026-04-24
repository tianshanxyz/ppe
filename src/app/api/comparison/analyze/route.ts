import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateComparisonAnalysis } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyIds, productIds, type } = body

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (company or product)' },
        { status: 400 }
      )
    }

    
      const supabase = await createClient()

    let items = []
    let comparisonData = null

    if (type === 'company' && companyIds) {
      // 获取企业数据
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)

      if (companiesError || !companies || companies.length === 0) {
        return NextResponse.json(
          { error: 'No companies found' },
          { status: 404 }
        )
      }

      items = companies

      // 获取对比数据
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('company_id, market')
        .in('company_id', companyIds)

      if (productsError) {
        console.error('Products fetch error:', productsError)
      }

      const { data: alerts, error: alertsError } = await supabase
        .from('risk_alerts')
        .select('entity_id, risk_level')
        .in('entity_id', companyIds)
        .eq('entity_type', 'company')

      if (alertsError) {
        console.error('Alerts fetch error:', alertsError)
      }

      // 构建对比数据
      const companyData = companies.map(company => {
        const companyProducts = (products || []).filter(p => p.company_id === company.id)
        const companyAlerts = (alerts || []).filter(a => a.entity_id === company.id)
        
        const markets = Array.from(new Set(companyProducts.map(p => p.market).filter(Boolean)))

        return {
          id: company.id,
          name: company.name,
          country: company.country,
          status: company.status,
          productCount: companyProducts.length,
          markets,
          marketCount: markets.length,
          riskCount: companyAlerts.length,
          riskAlerts: companyAlerts.map(a => ({
            level: a.risk_level,
          })),
        }
      })

      const allMarkets = Array.from(new Set(companyData.flatMap(c => c.markets)))
      const totalProducts = companyData.reduce((sum, c) => sum + c.productCount, 0)

      comparisonData = {
        companies: companyData,
        comparison: {
          markets: allMarkets,
          totalProducts,
          averageProductCount: totalProducts / companyData.length,
          riskDistribution: companyData.reduce((acc: Record<string, number>, c) => {
            acc[c.riskCount] = (acc[c.riskCount] || 0) + 1
            return acc
          }, {}),
        },
      }
    } else if (type === 'product' && productIds) {
      // 获取产品数据
      const { data: products, error } = await supabase
        .from('all_products')
        .select('*')
        .in('id', productIds)

      if (error || !products || products.length === 0) {
        return NextResponse.json(
          { error: 'No products found' },
          { status: 404 }
        )
      }

      items = products

      // 构建对比数据
      const markets = Array.from(new Set(products.map(p => p.market).filter(Boolean)))
      const deviceClasses = Array.from(new Set(products.map(p => p.device_class).filter(Boolean)))

      const statusComparison: Record<string, number> = {}
      products.forEach(p => {
        const status = p.status || 'active'
        statusComparison[status] = (statusComparison[status] || 0) + 1
      })

      const companyComparison: Record<string, number> = {}
      products.forEach(p => {
        const company = p.company_name || 'Unknown'
        companyComparison[company] = (companyComparison[company] || 0) + 1
      })

      comparisonData = {
        products: products.map(p => ({
          id: p.id,
          name: p.product_name,
          company: p.company_name,
          market: p.market,
          deviceClass: p.device_class,
          productCode: p.product_code,
          status: p.status,
        })),
        comparison: {
          markets,
          deviceClasses,
          statusComparison,
          companyComparison,
        },
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // 生成 AI 增强的对比分析
    const aiAnalysis = await generateComparisonAnalysis(type, items, comparisonData)

    return NextResponse.json({
      data: {
        type,
        items,
        comparison: comparisonData,
        aiAnalysis,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Comparison analysis error:', error)
    return NextResponse.json(
      { error: 'Comparison analysis failed' },
      { status: 500 }
    )
  }
}
