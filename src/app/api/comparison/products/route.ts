import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface ProductComparisonData {
  id: string
  name: string
  company_name?: string
  registration_number?: string
  classification?: string
  status?: string
  market?: string
  [key: string]: string | number | boolean | null | undefined
}

export interface ProductComparison {
  products: ProductComparisonData[]
  comparison: {
    markets: string[]
    deviceClasses: string[]
    statusComparison: Record<string, number>
    companyComparison: Record<string, number>
  }
}

/**
 * POST /api/comparison/products
 * 产品对比 API
 * 
 * Body: { productIds: string[] }
 * Response: 对比数据矩阵
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      )
    }

    if (productIds.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 products can be compared at once' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 从 all_products 视图获取产品数据
    const { data: products, error } = await supabase
      .from('all_products')
      .select('*')
      .in('id', productIds)

    if (error) {
      console.error('Product comparison error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      )
    }

    // 构建对比数据
    const markets = Array.from(new Set(products.map(p => p.market).filter(Boolean)))
    const deviceClasses = Array.from(new Set(products.map(p => p.device_class).filter(Boolean)))

    // 状态统计
    const statusComparison: Record<string, number> = {}
    products.forEach(p => {
      const status = p.status || 'active'
      statusComparison[status] = (statusComparison[status] || 0) + 1
    })

    // 公司统计
    const companyComparison: Record<string, number> = {}
    products.forEach(p => {
      const company = p.company_name || 'Unknown'
      companyComparison[company] = (companyComparison[company] || 0) + 1
    })

    const comparison: ProductComparison = {
      products: products.map(p => ({
        id: p.id,
        name: p.product_name,
        company: p.company_name,
        market: p.market,
        deviceClass: p.device_class,
        productCode: p.product_code,
        status: p.status,
        registrationNumber: p.registration_number,
        createdAt: p.created_at,
        updatedAt: p.last_updated || p.updated_at,
      })),
      comparison: {
        markets,
        deviceClasses,
        statusComparison,
        companyComparison,
      },
    }

    return NextResponse.json({ data: comparison })
  } catch (error) {
    console.error('Product comparison error:', error)
    return NextResponse.json(
      { error: 'Product comparison failed' },
      { status: 500 }
    )
  }
}
