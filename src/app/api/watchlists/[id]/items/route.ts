import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/watchlists/:id/items - 获取监控列表项
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
      const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (watchlistError || !watchlist || watchlist.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or watchlist not found' },
        { status: 404 }
      )
    }

    const { data: items, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('watchlist_id', id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching watchlist items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist items' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('Watchlist items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/watchlists/:id/items - 添加监控列表项
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    
      const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (watchlistError || !watchlist || watchlist.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or watchlist not found' },
        { status: 404 }
      )
    }

    const { data: item, error } = await supabase
      .from('watchlist_items')
      .insert({
        watchlist_id: id,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding watchlist item:', error)
      return NextResponse.json(
        { error: 'Failed to add watchlist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('Watchlist item creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/watchlists/:id/items/:itemId - 删除监控列表项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    
      const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, itemId } = await params

    const { data: watchlist, error: watchlistError } = await supabase
      .from('watchlists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (watchlistError || !watchlist || watchlist.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or watchlist not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', itemId)
      .eq('watchlist_id', id)

    if (error) {
      console.error('Error deleting watchlist item:', error)
      return NextResponse.json(
        { error: 'Failed to delete watchlist item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watchlist item deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
