import { createServiceClient } from '@/lib/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

/**
 * GET /api/ppe/products
 * Fetch PPE product list (supports pagination, filtering, search)
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const search = searchParams.get('search') || ''
      const category = searchParams.get('category') || ''
      const subcategory = searchParams.get('subcategory') || ''
      const country = searchParams.get('country') || ''
      const riskLevel = searchParams.get('riskLevel') || ''
      const dataSource = searchParams.get('dataSource') || ''
      const sortByRaw = searchParams.get('sortBy') || 'created_at'
      const sortBy = ['created_at', 'name', 'category', 'country_of_origin', 'risk_level', 'manufacturer_name', 'product_code'].includes(sortByRaw) ? sortByRaw : 'created_at'
      const sortOrderRaw = searchParams.get('sortOrder') || 'desc'
      const sortOrder = sortOrderRaw === 'asc' ? 'asc' : 'desc'

      const supabase = createServiceClient()

      // Build the base query string
      let selectQuery = '*'

      // First get the count — non-fatal: if count fails, default to 0
      let countQuery = supabase
        .from('ppe_products')
        .select('*', { count: 'exact', head: true })

      // Apply filters to count query
      if (search) {
        const term = escapeIlikeSearch(search)
        countQuery = countQuery.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,product_code.ilike.%${term}%,manufacturer_name.ilike.%${term}%,model.ilike.%${term}%`
        )
      }
      if (category) countQuery = countQuery.eq('category', category)
      if (subcategory) countQuery = countQuery.eq('subcategory', subcategory)
      if (country) countQuery = countQuery.eq('country_of_origin', country)
      if (riskLevel) countQuery = countQuery.eq('risk_level', riskLevel)
      if (dataSource) countQuery = countQuery.eq('data_source', dataSource)

      const { count, error: countError } = await countQuery

      // Count query failure is non-fatal — log and continue with count = 0
      if (countError) {
        console.warn('PPE products count warning:', countError.message)
      }
      const safeCount = count ?? 0

      // Then get the data
      let query = supabase
        .from('ppe_products')
        .select(selectQuery)

      // Search conditions
      if (search) {
        const term = escapeIlikeSearch(search)
        query = query.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,product_code.ilike.%${term}%,manufacturer_name.ilike.%${term}%,model.ilike.%${term}%`
        )
      }

      // Category filters
      if (category) query = query.eq('category', category)
      if (subcategory) query = query.eq('subcategory', subcategory)
      if (country) query = query.eq('country_of_origin', country)
      if (riskLevel) query = query.eq('risk_level', riskLevel)
      if (dataSource) query = query.eq('data_source', dataSource)

      // Sort
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) {
        console.error('PPE products API error:', error)
        // Return empty data instead of 500 so the UI can still render
        return NextResponse.json({
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            filters: { search, category, subcategory, country, riskLevel, dataSource },
            sort: { by: sortBy, order: sortOrder },
          },
        })
      }

      return NextResponse.json({
        data: data || [],
        meta: {
          page,
          limit,
          total: safeCount,
          totalPages: Math.ceil(safeCount / limit),
          filters: {
            search,
            category,
            subcategory,
            country,
            riskLevel,
            dataSource,
          },
          sort: {
            by: sortBy,
            order: sortOrder,
          },
        },
      })
    } catch (error) {
      console.error('PPE products API error:', error)
      // Return empty data instead of 500 so the UI can still render
      return NextResponse.json({
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          filters: {},
          sort: { by: 'created_at', order: 'desc' },
        },
      })
    }
  }, {
    maxRequests: 200,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}
