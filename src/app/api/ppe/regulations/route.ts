import { createServiceClient } from '@/lib/supabase/service-client'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

/**
 * GET /api/ppe/regulations
 * Fetch PPE regulation list (supports pagination, filtering, search)
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const search = searchParams.get('search') || ''
      const region = searchParams.get('region') || ''
      const sortBy = searchParams.get('sortBy') || 'created_at'
      const sortOrder = searchParams.get('sortOrder') || 'desc'

      const supabase = createServiceClient()

      let query = supabase
        .from('ppe_regulations')
        .select('*', { count: 'exact' })

      // Search conditions
      if (search) {
        const term = escapeIlikeSearch(search)
        query = query.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,code.ilike.%${term}%,region.ilike.%${term}%`
        )
      }

      // Region filter
      if (region) {
        query = query.eq('region', region)
      }

      // Sort
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('PPE regulations API error:', error)
        // Return empty data instead of 500 so the UI can still render
        return NextResponse.json({
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            filters: { search, region },
            sort: { by: sortBy, order: sortOrder },
          },
        })
      }

      const safeCount = count ?? 0

      return NextResponse.json({
        data: data || [],
        meta: {
          page,
          limit,
          total: safeCount,
          totalPages: Math.ceil(safeCount / limit),
          filters: {
            search,
            region,
          },
          sort: {
            by: sortBy,
            order: sortOrder,
          },
        },
      })
    } catch (error) {
      console.error('PPE regulations API error:', error)
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
