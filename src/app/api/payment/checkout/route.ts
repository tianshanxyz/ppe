import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/payment/stripe-service'
import { getCurrentUserWithRole } from '@/lib/permissions'
import type { VipTier } from '@/lib/permissions/config'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithRole(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, cycle, trial } = body as {
      tier: VipTier
      cycle: 'monthly' | 'yearly'
      trial?: boolean
    }

    if (!tier || !['professional', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    if (!cycle || !['monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://mdlooker.com'

    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      tier,
      cycle,
      successUrl: `${origin}/dashboard/subscription?success=true`,
      cancelUrl: `${origin}/pricing?cancelled=true`,
      trial,
    })

    return NextResponse.json({ sessionId: session.sessionId, url: session.url })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
