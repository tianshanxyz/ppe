'use client'

import React from 'react'
import { SubscriptionPanel } from '@/components/subscription/SubscriptionPanel'
import { PaymentHistory } from '@/components/subscription/PaymentHistory'

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage your plan, billing, and payment history</p>
        </div>

        <div className="space-y-6">
          <SubscriptionPanel />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            </div>
            <div className="p-6">
              <PaymentHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
