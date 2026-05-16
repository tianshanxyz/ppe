'use client'

import React from 'react'
import type { RoleFeatures } from '@/lib/permissions/config'
import Link from 'next/link'

interface UpgradePromptProps {
  feature: keyof RoleFeatures
  requiredTier: 'professional' | 'enterprise' | null
}

const FEATURE_LABELS: Record<string, string> = {
  semanticSearch: 'Semantic Search',
  aiSearch: 'AI Smart Search',
  aiChat: 'AI Chat Assistant',
  competitorAnalysis: 'Competitor Analysis',
  marketAnalysis: 'Market Analysis',
  creditScore: 'Credit Score',
  pricePrediction: 'Price Prediction',
  whiteLabelReports: 'White-Label Reports',
  documentGenerator: 'Document Generator',
  supplyChainTracker: 'Supply Chain Tracker',
  batchQuery: 'Batch Query',
  apiAccess: 'API Access',
  webhooks: 'Webhook Integration',
  sso: 'SSO Single Sign-On',
  teamCollaboration: 'Team Collaboration',
  statistics: 'Statistics Dashboard',
  reportGeneration: 'Report Generation',
}

export function UpgradePrompt({ feature, requiredTier }: UpgradePromptProps) {
  const featureLabel = FEATURE_LABELS[feature] || feature
  const tierLabel = requiredTier === 'enterprise' ? 'Enterprise' : 'Professional'
  const price = requiredTier === 'enterprise' ? '$299/mo' : '$99/mo'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#339999]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#339999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {featureLabel} requires {tierLabel}
        </h3>
        <p className="text-gray-600 mb-4">
          Upgrade to VIP {tierLabel} ({price}) to unlock {featureLabel} and more premium features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors font-medium"
          >
            Upgrade Now
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View All Plans
          </Link>
        </div>
      </div>
    </div>
  )
}
