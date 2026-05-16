import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/payment/stripe-service'
import { createServiceClient } from '@/lib/supabase/service-client'
import { getCurrentUserWithRole } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithRole(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data: userData } = await supabase
      .from('mdlooker_users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://mdlooker.com'

    const session = await createPortalSession({
      customerId: userData.stripe_customer_id,
      returnUrl: `${origin}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal session creation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
