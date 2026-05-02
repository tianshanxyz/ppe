import { createServiceClient } from '@/lib/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'

/**
 * Paginated fetch of all records for statistics computation.
 * Returns an empty distribution on any error.
 */
async function fetchAllForStats(supabase: any, table: string, column: string) {
  const distribution: Record<string, number> = {}
  const pageSize = 1000
  let page = 0
  let hasMore = true

  try {
    while (hasMore) {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error } = await supabase
        .from(table)
        .select(column)
        .range(from, to)

      if (error) {
        console.warn(`Stats fetch warning for ${table}.${column}:`, error.message)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      data.forEach((p: any) => {
        const value = p[column] || 'Unknown'
        distribution[value] = (distribution[value] || 0) + 1
      })

      if (data.length < pageSize) {
        hasMore = false
      }
      page++
    }
  } catch (error) {
    console.warn(`Stats fetch error for ${table}.${column}:`, error)
  }

  return distribution
}

/**
 * GET /api/ppe/stats
 * Fetch PPE data statistics overview
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const supabase = createServiceClient()

      // Fetch all stats in parallel — each individual failure is non-fatal
      const [
        productsCount,
        manufacturersCount,
        regulationsCount,
        categoryDistribution,
        countryDistribution,
        riskLevelDistribution,
        dataSourceDistribution,
      ] = await Promise.all([
        // Total products
        supabase.from('ppe_products').select('*', { count: 'exact', head: true }),

        // Total manufacturers
        supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }),

        // Total regulations
        supabase.from('ppe_regulations').select('*', { count: 'exact', head: true }),

        // Category distribution
        fetchAllForStats(supabase, 'ppe_products', 'category'),

        // Country distribution
        fetchAllForStats(supabase, 'ppe_products', 'country_of_origin'),

        // Risk level distribution
        fetchAllForStats(supabase, 'ppe_products', 'risk_level'),

        // Data source distribution
        fetchAllForStats(supabase, 'ppe_products', 'data_source'),
      ])

      return NextResponse.json({
        data: {
          overview: {
            totalProducts: productsCount?.count ?? 0,
            totalManufacturers: manufacturersCount?.count ?? 0,
            totalRegulations: regulationsCount?.count ?? 0,
          },
          distributions: {
            category: categoryDistribution || {},
            country: countryDistribution || {},
            riskLevel: riskLevelDistribution || {},
            dataSource: dataSourceDistribution || {},
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('PPE stats API error:', error)
      // Return empty stats instead of 500 so the UI can still render
      return NextResponse.json({
        data: {
          overview: {
            totalProducts: 0,
            totalManufacturers: 0,
            totalRegulations: 0,
          },
          distributions: {
            category: {},
            country: {},
            riskLevel: {},
            dataSource: {},
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      })
    }
  }, {
    maxRequests: 100,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}
