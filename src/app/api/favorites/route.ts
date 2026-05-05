import { NextRequest, NextResponse } from 'next/server'

const STORAGE_KEY = 'ppe_saved_items_v2'

function readFavoritesFromStorage(userId: string): any[] {
  return []
}

function writeFavoritesToStorage(userId: string, items: any[]): void {
}

export async function GET(request: NextRequest) {
  try {
    const isSupabaseConfigured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        const { data: favorites, error } = await supabase
          .from('favorites')
          .select('id, regulation_id, title, jurisdiction, category, status, effective_date, created_at, notes')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ favorites, total: favorites.length })
      } catch (error) {
        console.error('Supabase favorites error:', error)
      }
    }

    return NextResponse.json({ favorites: [], total: 0, message: 'Favorites are stored locally in your browser' })
  } catch (error) {
    console.error('Error in GET /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isSupabaseConfigured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const body = await request.json()
        const { regulationId, title, jurisdiction, category, status, effective_date } = body

        if (!regulationId || !title) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('regulation_id', regulationId)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
        }

        const { data: favorite, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            regulation_id: regulationId,
            title,
            jurisdiction,
            category,
            status,
            effective_date,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ favorite }, { status: 201 })
      } catch (error) {
        console.error('Supabase favorites POST error:', error)
      }
    }

    return NextResponse.json({ 
      favorite: null, 
      message: 'Favorites are stored locally in your browser. Use the client-side save button instead.' 
    })
  } catch (error) {
    console.error('Error in POST /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isSupabaseConfigured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const body = await request.json()
        const { id } = body

        if (!id) {
          return NextResponse.json({ error: 'Missing favorite ID' }, { status: 400 })
        }

        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Supabase favorites DELETE error:', error)
      }
    }

    return NextResponse.json({ success: true, message: 'Favorites are managed locally in your browser' })
  } catch (error) {
    console.error('Error in DELETE /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isSupabaseConfigured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const body = await request.json()
        const { id, notes } = body

        if (!id) {
          return NextResponse.json({ error: 'Missing favorite ID' }, { status: 400 })
        }

        const { error } = await supabase
          .from('favorites')
          .update({ notes })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Supabase favorites PATCH error:', error)
      }
    }

    return NextResponse.json({ success: true, message: 'Favorites are managed locally in your browser' })
  } catch (error) {
    console.error('Error in PATCH /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
