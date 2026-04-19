'use client'

import { useState, useEffect } from 'react'
import { Shield, Scale, BookOpen, TrendingUp, Users, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { MarketAccessWizard } from './MarketAccessWizard'
import { RegulationsLibrary } from './RegulationsLibrary'

type TabType = 'wizard' | 'news' | 'library'

export default function RegulationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('wizard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const tabs = [
    { id: 'wizard' as TabType, label: 'Market Access Wizard', icon: Scale, description: 'Get step-by-step guidance for product registration' },
    { id: 'news' as TabType, label: 'Compliance Intelligence', icon: TrendingUp, description: 'Daily updates on regulatory changes' },
    { id: 'library' as TabType, label: 'Regulations Library', icon: BookOpen, description: 'Search official regulations and standards' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#339999] mx-auto mb-4" />
          <p className="text-gray-600">Loading regulations data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999] to-[#2a7a7a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Regulatory Compliance Center
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Your intelligent compliance partner. Navigate global medical device regulations with confidence.
            </p>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">Smart Guidance</h3>
              <p className="text-sm text-white/70">AI-powered market access recommendations</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">Real-time Updates</h3>
              <p className="text-sm text-white/70">Stay informed on regulatory changes</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">Comprehensive Library</h3>
              <p className="text-sm text-white/70">Access official regulations worldwide</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">Community Support</h3>
              <p className="text-sm text-white/70">Connect with regulatory experts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-[#339999] text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'wizard' && (
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#339999]/10 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-8 h-8 text-[#339999]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Market Access Wizard
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Not sure how to register your medical device in a specific market? Our intelligent wizard guides you through the entire process, from understanding requirements to generating a personalized checklist.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Step-by-step guidance
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <CheckCircle className="w-4 h-4" />
                      Cost & timeline estimates
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-sm text-purple-700">
                      <CheckCircle className="w-4 h-4" />
                      Downloadable checklists
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wizard Component */}
            <MarketAccessWizard />
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#339999]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-[#339999]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Compliance Intelligence
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Stay ahead of regulatory changes with our daily compliance news feed. Get real-time updates on new regulations, guidance documents, safety alerts, and product recalls from major regulatory authorities worldwide.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Daily updates
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <CheckCircle className="w-4 h-4" />
                      Multi-region coverage
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-sm text-purple-700">
                      <CheckCircle className="w-4 h-4" />
                      Customizable alerts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* News Component - TODO: Implement */}
            {activeTab === 'news' && (
              <div className="text-center py-20">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Compliance Intelligence</h3>
                <p className="text-gray-500">Coming soon...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#339999]/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-[#339999]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Regulations Library
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Access a comprehensive database of official regulations, guidance documents, and international standards. Search by region, category, or keyword to find the information you need.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Official sources only
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <CheckCircle className="w-4 h-4" />
                      8+ regulatory authorities
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-sm text-purple-700">
                      <CheckCircle className="w-4 h-4" />
                      Regular updates
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Component */}
            <RegulationsLibrary />
          </div>
        )}
      </div>
    </div>
  )
}
