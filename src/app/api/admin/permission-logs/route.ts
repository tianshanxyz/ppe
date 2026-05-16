import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { getCurrentUser } from '@/lib/permissions-server'
import { isAdmin } from '@/lib/data-store'

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  const supabase = createServiceClient()
  let query = supabase.from('mdlooker_permission_log').select('*').order('created_at', { ascending: false }).limit(limit)

  if (userId) query = query.eq('user_id', userId)
  if (action) query = query.eq('action', action)

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs })
}