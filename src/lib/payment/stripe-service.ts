import Stripe from 'stripe'
import { createServiceClient } from '../supabase/service-client'
import { getStripePriceId, PRICE_MAPPING, getTrialPeriodDays } from './stripe-config'
import type { VipTier } from '../permissions/config'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key)
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const sub = subscription as any
  const start = typeof sub.current_period_start === 'number'
    ? sub.current_period_start
    : Math.floor(new Date(sub.current_period_start as string || Date.now()).getTime() / 1000)
  const end = typeof sub.current_period_end === 'number'
    ? sub.current_period_end
    : Math.floor(new Date(sub.current_period_end as string || Date.now()).getTime() / 1000)
  return { start, end }
}

export async function createCheckoutSession(params: {
  userId: string
  email: string
  tier: VipTier
  cycle: 'monthly' | 'yearly'
  successUrl: string
  cancelUrl: string
  trial?: boolean
}): Promise<{ sessionId: string; url?: string }> {
  const stripe = getStripe()
  const priceId = getStripePriceId(params.tier, params.cycle)

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${params.tier}_${params.cycle}`)
  }

  let customerId: string | undefined

  const supabase = createServiceClient()
  const { data: user } = await supabase
    .from('mdlooker_users')
    .select('stripe_customer_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (user?.stripe_customer_id) {
    customerId = user.stripe_customer_id
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: params.email,
      metadata: { userId: params.userId },
    })
    customerId = customer.id

    await supabase
      .from('mdlooker_users')
      .update({ stripe_customer_id: customerId })
      .eq('id', params.userId)
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      tier: params.tier,
      cycle: params.cycle,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        tier: params.tier,
        cycle: params.cycle,
      },
    },
  }

  if (params.trial) {
    sessionParams.subscription_data!.trial_period_days = getTrialPeriodDays()
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return { sessionId: session.id, url: session.url || undefined }
}

export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
  return { url: session.url }
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const tier = session.metadata?.tier as VipTier
      const cycle = session.metadata?.cycle as 'monthly' | 'yearly'

      if (!userId || !tier) break

      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const period = getSubscriptionPeriod(subscription)

      await supabase.from('mdlooker_users').update({
        role: 'vip',
        vip_tier: tier,
        membership: tier,
        subscription_status: 'active',
        billing_cycle: cycle,
        auto_renew: true,
        stripe_subscription_id: subscription.id,
        subscription_started_at: new Date(period.start * 1000).toISOString(),
        subscription_expires_at: new Date(period.end * 1000).toISOString(),
      }).eq('id', userId)

      await supabase.from('mdlooker_subscriptions').upsert({
        user_id: userId,
        tier,
        billing_cycle: cycle,
        status: 'active',
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        current_period_start: new Date(period.start * 1000).toISOString(),
        current_period_end: new Date(period.end * 1000).toISOString(),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      }, { onConflict: 'stripe_subscription_id' })

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) break

      const tier = subscription.metadata?.tier as VipTier || 'professional'
      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'trialing' ? 'trial'
        : subscription.status === 'past_due' ? 'past_due'
        : subscription.status === 'canceled' ? 'cancelled'
        : 'active'

      const period = getSubscriptionPeriod(subscription)

      await supabase.from('mdlooker_users').update({
        vip_tier: tier,
        membership: tier,
        subscription_status: status,
        subscription_expires_at: new Date(period.end * 1000).toISOString(),
        auto_renew: !subscription.cancel_at_period_end,
      }).eq('id', userId)

      await supabase.from('mdlooker_subscriptions').update({
        status,
        current_period_start: new Date(period.start * 1000).toISOString(),
        current_period_end: new Date(period.end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }).eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) break

      await supabase.from('mdlooker_users').update({
        role: 'user',
        vip_tier: null,
        membership: 'free',
        subscription_status: 'expired',
        auto_renew: false,
      }).eq('id', userId)

      await supabase.from('mdlooker_subscriptions').update({
        status: 'expired',
      }).eq('stripe_subscription_id', subscription.id)

      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      if (invoice.billing_reason === 'subscription_cycle') {
        const { data: user } = await supabase
          .from('mdlooker_users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (user) {
          await supabase.from('mdlooker_payments').insert({
            user_id: user.id,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency,
            payment_method: 'stripe',
            stripe_payment_intent_id: (invoice as any).payment_intent as string,
            status: 'succeeded',
          })
        }
      }

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: user } = await supabase
        .from('mdlooker_users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (user) {
        await supabase.from('mdlooker_users').update({
          subscription_status: 'past_due',
        }).eq('id', user.id)

        await supabase.from('mdlooker_payments').insert({
          user_id: user.id,
          amount_cents: invoice.amount_due,
          currency: invoice.currency,
          payment_method: 'stripe',
          stripe_payment_intent_id: (invoice as any).payment_intent as string,
          status: 'failed',
        })
      }

      break
    }

    case 'customer.subscription.trial_will_end': {
      break
    }
  }
}

export async function cancelSubscription(params: {
  userId: string
  immediately?: boolean
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe()
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('mdlooker_users')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (!user?.stripe_subscription_id) {
    return { success: false, error: 'No active subscription found' }
  }

  try {
    if (params.immediately) {
      await stripe.subscriptions.cancel(user.stripe_subscription_id)
    } else {
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    await supabase.from('mdlooker_subscriptions').update({
      cancel_at_period_end: !params.immediately,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: params.reason || null,
    }).eq('stripe_subscription_id', user.stripe_subscription_id)

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' }
  }
}

export async function resumeSubscription(params: {
  userId: string
}): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe()
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('mdlooker_users')
    .select('stripe_subscription_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (!user?.stripe_subscription_id) {
    return { success: false, error: 'No subscription found' }
  }

  try {
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    await supabase.from('mdlooker_subscriptions').update({
      cancel_at_period_end: false,
      cancelled_at: null,
      cancellation_reason: null,
    }).eq('stripe_subscription_id', user.stripe_subscription_id)

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Resume failed' }
  }
}

export async function upgradeSubscription(params: {
  userId: string
  targetTier: VipTier
  cycle: 'monthly' | 'yearly'
}): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe()
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('mdlooker_users')
    .select('stripe_subscription_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (!user?.stripe_subscription_id) {
    return { success: false, error: 'No active subscription found. Please create a new one.' }
  }

  const newPriceId = getStripePriceId(params.targetTier, params.cycle)
  if (!newPriceId) {
    return { success: false, error: 'Invalid tier or cycle' }
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return { success: false, error: 'No subscription item found' }
    }

    await stripe.subscriptions.update(user.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      metadata: {
        userId: params.userId,
        tier: params.targetTier,
        cycle: params.cycle,
      },
      proration_behavior: 'create_prorations',
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upgrade failed' }
  }
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
