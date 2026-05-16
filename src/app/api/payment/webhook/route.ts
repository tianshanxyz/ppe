import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, handleWebhookEvent } from '@/lib/payment/stripe-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const event = verifyWebhookSignature(body, signature)
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
