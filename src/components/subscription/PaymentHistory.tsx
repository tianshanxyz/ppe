'use client'

import React, { useState, useEffect } from 'react'
import { usePermission } from '@/lib/permissions/use-permission'

interface PaymentRecord {
  id: string
  amount_cents: number
  currency: string
  payment_method: string
  status: string
  created_at: string
}

export function PaymentHistory() {
  const { user } = usePermission()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetch('/api/payment/subscription')
        .then(res => res.json())
        .then(data => {
          setPayments(data.payments || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No payment history yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.map(payment => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {new Date(payment.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                ${(payment.amount_cents / 100).toFixed(2)} {payment.currency?.toUpperCase()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                {payment.payment_method}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  payment.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                  payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                  payment.status === 'refunded' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {payment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
