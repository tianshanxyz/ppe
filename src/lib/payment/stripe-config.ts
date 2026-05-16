import type { VipTier } from '../permissions/config'

export const STRIPE_PRODUCTS: Record<string, string> = {
  professional_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  professional_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  enterprise_monthly: process.env.STRIPE_ENT_MONTHLY_PRICE_ID || '',
  enterprise_yearly: process.env.STRIPE_ENT_YEARLY_PRICE_ID || '',
}

export const PRICE_MAPPING: Record<VipTier, { monthly: number; yearly: number }> = {
  professional: { monthly: 9900, yearly: 94800 },
  enterprise: { monthly: 29900, yearly: 286800 },
}

export const DISPLAY_PRICING: Record<VipTier, { monthly: number; yearly: number; yearlyDiscount: number }> = {
  professional: { monthly: 99, yearly: 948, yearlyDiscount: 20 },
  enterprise: { monthly: 299, yearly: 2868, yearlyDiscount: 20 },
}

export function getStripePriceId(tier: VipTier, cycle: 'monthly' | 'yearly'): string {
  const key = `${tier}_${cycle}`
  return STRIPE_PRODUCTS[key] || ''
}

export function getTrialPeriodDays(): number {
  return 7
}

export function getGracePeriodDays(): number {
  return 3
}

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
] as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number]
