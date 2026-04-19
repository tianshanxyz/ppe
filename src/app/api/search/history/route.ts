import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface SearchHistoryItem {
  id: string
  user_id: string
  query: string
  filters: unknown
  results_count: number
  clicked_results: string[]
  created_at: string
}

export interface SearchHistoryResponse {
  data: SearchHistoryItem[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

/**
 * GET /api/search/history
 * 获取搜索历史记录
 * 
 * Query Parameters:
 * - limit: 返回数量限制 (默认：20, 最大：100)
 * - offset: 偏移量 (默认：0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: history, error } = await supabase
      .from('search_queries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch search history error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch search history' },
        { status: 500 }
      )
    }

    const { count } = await supabase
      .from('search_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      data: history || [],
      meta: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Search history GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/search/history
 * 清空搜索历史记录
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('search_queries')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Clear search history error:', error)
      return NextResponse.json(
        { error: 'Failed to clear search history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Search history cleared successfully',
    })
  } catch (error) {
    console.error('Search history DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
