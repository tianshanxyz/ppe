import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const market = searchParams.get('market') || ''
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const searchInFulltext = searchParams.get('fulltext') === 'true'
    const offset = (page - 1) * limit

    const supabase = createServiceClient()

    let dbQuery = supabase
      .from('ppe_regulations')
      .select('*', { count: 'exact' })

    if (market) {
      const regionMap: Record<string, string> = { 'UK': 'GB' }
      const dbRegion = regionMap[market] || market
      dbQuery = dbQuery.eq('region', dbRegion)
    }

    if (query) {
      const term = escapeIlikeSearch(query)
      if (searchInFulltext) {
        dbQuery = dbQuery.or(`name.ilike.%${term}%,code.ilike.%${term}%,description.ilike.%${term}%`)
      } else {
        dbQuery = dbQuery.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
      }
    }

    dbQuery = dbQuery.order('created_at', { ascending: false })
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Regulation search error:', error)
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      )
    }

    const total = count || 0
    const regulations = (data || []).map((reg: any) => ({
      id: reg.id,
      category_id: '',
      market_code: reg.region || '',
      title: reg.name || '',
      title_zh: reg.name || '',
      regulation_number: reg.code || '',
      document_type: type || 'regulation',
      issuing_authority: reg.region || '',
      effective_date: '',
      status: 'active',
      summary: (reg.description || '').substring(0, 300),
      summary_zh: '',
      full_text: reg.description || '',
      keywords: [],
      source_url: '',
    }))

    return NextResponse.json({
      success: true,
      data: regulations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Regulation search error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}
