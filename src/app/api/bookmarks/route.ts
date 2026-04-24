import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/bookmarks
 * 获取用户收藏列表
 */
export async function GET() {
  try {
    
      const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: bookmarks, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch bookmarks error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: bookmarks || [] 
    })
  } catch (error) {
    console.error('Bookmarks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookmarks
 * 添加收藏
 * Body: { entityType: string, entityId: string }
 */
export async function POST(request: NextRequest) {
  try {
    
      const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    // 验证实体类型
    const validTypes = ['product', 'company', 'regulation']
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already bookmarked' },
        { status: 409 }
      )
    }

    // 添加收藏
    const { data: bookmark, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select()
      .single()

    if (error) {
      console.error('Add bookmark error:', error)
      return NextResponse.json(
        { error: 'Failed to add bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: bookmark,
      message: 'Bookmark added successfully'
    })
  } catch (error) {
    console.error('Bookmarks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookmarks/:entityType/:entityId
 * 删除收藏
 */
export async function DELETE(
  request: NextRequest
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

    // 从 URL 路径中获取参数
    const pathname = request.nextUrl.pathname
    const segments = pathname.split('/')
    const entityType = segments[segments.indexOf('bookmarks') + 1]
    const entityId = segments[segments.indexOf('bookmarks') + 2]

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) {
      console.error('Delete bookmark error:', error)
      return NextResponse.json(
        { error: 'Failed to delete bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Bookmark removed successfully'
    })
  } catch (error) {
    console.error('Bookmarks DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
