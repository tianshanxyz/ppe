'use client'

import { useState } from 'react'
import { ClipboardCheck, Search, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, Building, Calendar } from 'lucide-react'
import Link from 'next/link'

const COMPLIANCE_ITEMS = [
  {
    id: '1',
    productName: 'N95 Respirator XR-500',
    manufacturer: 'SafeGuard PPE Co., Ltd.',
    market: 'US',
    regulation: 'FDA 510(k)',
    steps: [
      { name: 'Predicate Device Identification', status: 'completed', date: '2025-11-15' },
      { name: 'Performance Testing', status: 'completed', date: '2025-12-20' },
      { name: 'Biocompatibility Testing', status: 'completed', date: '2026-01-10' },
      { name: '510(k) Summary Preparation', status: 'in_progress', date: '2026-02-01' },
      { name: 'FDA Submission', status: 'pending', date: '' },
      { name: 'FDA Review & Clearance', status: 'pending', date: '' }
    ],
    overallProgress: 50,
    estimatedCompletion: '2026-08-15'
  },
  {
    id: '2',
    productName: 'Safety Helmet ProShield X1',
    manufacturer: 'HeadGuard Industries',
    market: 'EU',
    regulation: 'CE Category II',
    steps: [
      { name: 'Risk Assessment', status: 'completed', date: '2025-09-01' },
      { name: 'Technical File Preparation', status: 'completed', date: '2025-10-15' },
      { name: 'Notified Body Application', status: 'completed', date: '2025-11-20' },
      { name: 'EU Type Examination (Module B)', status: 'in_progress', date: '2026-01-05' },
      { name: 'Conformity Assessment', status: 'pending', date: '' },
      { name: 'CE Marking & DoC', status: 'pending', date: '' }
    ],
    overallProgress: 55,
    estimatedCompletion: '2026-07-20'
  },
  {
    id: '3',
    productName: 'Chemical Protective Suit CPS-200',
    manufacturer: 'ChemSafe Manufacturing',
    market: 'EU',
    regulation: 'CE Category III',
    steps: [
      { name: 'Risk Assessment', status: 'completed', date: '2025-06-01' },
      { name: 'Technical File Preparation', status: 'completed', date: '2025-07-15' },
      { name: 'EU Type Examination (Module B)', status: 'completed', date: '2025-09-20' },
      { name: 'Quality System Assessment (Module D)', status: 'in_progress', date: '2025-11-10' },
      { name: 'Production Quality Assurance', status: 'pending', date: '' },
      { name: 'CE Marking & DoC', status: 'pending', date: '' }
    ],
    overallProgress: 60,
    estimatedCompletion: '2026-06-30'
  },
  {
    id: '4',
    productName: 'Medical Face Mask Type IIR',
    manufacturer: 'MediShield Corp.',
    market: 'China',
    regulation: 'NMPA Class II',
    steps: [
      { name: 'Product Classification', status: 'completed', date: '2025-08-01' },
      { name: 'Type Testing at NMPA Lab', status: 'in_progress', date: '2025-10-15' },
      { name: 'Clinical Evaluation', status: 'pending', date: '' },
      { name: 'Registration Application', status: 'pending', date: '' },
      { name: 'GMP Inspection', status: 'pending', date: '' },
      { name: 'Registration Certificate', status: 'pending', date: '' }
    ],
    overallProgress: 25,
    estimatedCompletion: '2027-02-28'
  }
]

export default function ComplianceTrackerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const markets = ['all', 'EU', 'US', 'China', 'UK']

  const filteredItems = COMPLIANCE_ITEMS.filter(item => {
    const matchesMarket = selectedMarket === 'all' || item.market === selectedMarket
    const matchesSearch = !searchQuery ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regulation.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMarket && matchesSearch
  })

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress': return <Clock className="w-5 h-5 text-[#339999] animate-pulse" />
      case 'pending': return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <ClipboardCheck className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Compliance Tracker</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track your product compliance progress across different markets in real-time
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {markets.map(market => (
                <button
                  key={market}
                  onClick={() => setSelectedMarket(market)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMarket === market
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {market === 'all' ? 'All Markets' : market}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredItems.length > 0 ? (
            <div className="space-y-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{item.productName}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Building className="w-4 h-4" />
                            {item.manufacturer}
                          </span>
                          <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-1 rounded">{item.market}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.regulation}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#339999]">{item.overallProgress}%</div>
                        <div className="text-xs text-gray-400">Overall Progress</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-[#339999] h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${item.overallProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Est. completion: {item.estimatedCompletion}</span>
                      <span>{item.steps.filter(s => s.status === 'completed').length}/{item.steps.length} steps completed</span>
                    </div>
                  </div>

                  {expandedItem === item.id && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance Steps</h3>
                      <div className="space-y-3">
                        {item.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-4">
                            {getStepIcon(step.status)}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                step.status === 'completed' ? 'text-gray-500 line-through' :
                                step.status === 'in_progress' ? 'text-[#339999]' :
                                'text-gray-700'
                              }`}>
                                {step.name}
                              </p>
                              {step.date && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {step.date}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              step.status === 'completed' ? 'bg-green-100 text-green-700' :
                              step.status === 'in_progress' ? 'bg-[#339999]/10 text-[#339999]' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {step.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No compliance items found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
