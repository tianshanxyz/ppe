/**
 * 法规收藏管理 - API 路由
 * 提供法规收藏的增删改查功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 获取用户收藏的法规列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 从请求头获取用户 ID（需要认证）
    const userId = request.headers.get('x-user-id') || 'anonymous'

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        regulation_id,
        title,
        jurisdiction,
        category,
        status,
        effective_date,
        created_at,
        notes
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      favorites,
      total: favorites.length
    })
  } catch (error) {
    console.error('Error in GET /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

/**
 * 添加法规到收藏
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { regulationId, title, jurisdiction, category, status, effective_date } = body

    if (!regulationId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = request.headers.get('x-user-id') || 'anonymous'

    // 检查是否已收藏
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('regulation_id', regulationId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
    }

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
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
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

/**
 * 删除收藏
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing favorite ID' }, { status: 400 })
    }

    const userId = request.headers.get('x-user-id') || 'anonymous'

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting favorite:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}

/**
 * 更新收藏备注
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing favorite ID' }, { status: 400 })
    }

    const userId = request.headers.get('x-user-id') || 'anonymous'

    const { error } = await supabase
      .from('favorites')
      .update({ notes })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating favorite:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/favorites:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}
