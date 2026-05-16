import { NextRequest, NextResponse } from 'next/server'
import { cancelSubscription } from '@/lib/payment/stripe-service'
import { getCurrentUserWithRole } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithRole(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { immediately, reason } = body as {
      immediately?: boolean
      reason?: string
    }

    const result = await cancelSubscription({
      userId: user.id,
      immediately: immediately || false,
      reason,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cancel failed' },
      { status: 500 }
    )
  }
}
