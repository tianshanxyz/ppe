'use client'

import React, { useState, useEffect } from 'react'
import { usePermission } from '@/lib/permissions/use-permission'
import { VIP_PRICING, VIP_TIER_LABELS } from '@/lib/permissions/config'
import type { VipTier } from '@/lib/permissions/config'
import Link from 'next/link'

export function SubscriptionPanel() {
  const { user, role, vipTier, isVip, isProfessional, isEnterprise } = usePermission()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetch('/api/payment/subscription')
        .then(res => res.json())
        .then(data => {
          setSubscription(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  const currentTierLabel = isEnterprise
    ? 'Enterprise'
    : isProfessional
    ? 'Professional'
    : 'Free'

  const currentPrice = isEnterprise
    ? VIP_PRICING.enterprise
    : isProfessional
    ? VIP_PRICING.professional
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] px-6 py-4">
        <h2 className="text-xl font-bold text-white">Subscription</h2>
        <p className="text-white/80 text-sm">Manage your plan and billing</p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900">{currentTierLabel}</p>
          </div>
          {currentPrice && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Monthly Price</p>
              <p className="text-2xl font-bold text-[#339999]">${currentPrice.monthly}/mo</p>
            </div>
          )}
        </div>

        {subscription?.subscription && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${
                subscription.subscription.status === 'active' ? 'text-green-600' :
                subscription.subscription.status === 'trial' ? 'text-blue-600' :
                subscription.subscription.status === 'past_due' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {subscription.subscription.status?.charAt(0).toUpperCase() + subscription.subscription.status?.slice(1)}
              </span>
            </div>
            {subscription.subscription.current_period_end && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {subscription.subscription.cancel_at_period_end ? 'Expires' : 'Renews'}
                </span>
                <span className="font-medium text-gray-900">
                  {new Date(subscription.subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription.subscription.billing_cycle && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Billing Cycle</span>
                <span className="font-medium text-gray-900 capitalize">
                  {subscription.subscription.billing_cycle}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!isVip && (
            <Link
              href="/pricing"
              className="w-full py-3 px-4 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors text-center"
            >
              Upgrade to VIP
            </Link>
          )}

          {isProfessional && (
            <Link
              href="/pricing"
              className="w-full py-3 px-4 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors text-center"
            >
              Upgrade to Enterprise
            </Link>
          )}

          {isVip && subscription?.subscription && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  fetch('/api/payment/portal', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => { if (data.url) window.location.href = data.url })
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Billing
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? You will lose access to premium features at the end of your billing period.')) {
                    fetch('/api/payment/cancel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: 'User initiated' }),
                    })
                    .then(res => res.json())
                    .then(() => window.location.reload())
                  }
                }}
                className="flex-1 py-3 px-4 border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
