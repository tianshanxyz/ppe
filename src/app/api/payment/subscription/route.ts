import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/permissions'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithRole(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: subscription } = await supabase
      .from('mdlooker_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: payments } = await supabase
      .from('mdlooker_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      subscription: subscription || null,
      payments: payments || [],
      currentTier: user.membership || 'free',
      vipTier: user.vipTier || null,
    })
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
