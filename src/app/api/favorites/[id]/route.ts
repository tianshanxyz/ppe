import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    console.error('Error in DELETE /api/favorites/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        const { notes } = body

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
    console.error('Error in PATCH /api/favorites/[id]:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
