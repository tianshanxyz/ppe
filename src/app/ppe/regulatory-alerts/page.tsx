'use client'

import { useState } from 'react'
import { Bell, Search, AlertTriangle, Clock, ArrowRight, Tag, Filter } from 'lucide-react'
import Link from 'next/link'

const REGULATORY_ALERTS = [
  {
    id: '1',
    title: 'EU PPE Regulation Amendment 2026/XXX Published',
    severity: 'critical',
    market: 'EU',
    date: '2026-04-24',
    summary: 'New amendment to Regulation 2016/425 introduces additional requirements for smart PPE with electronic components.',
    action: 'Manufacturers of smart PPE must review and update technical documentation by October 2026.',
    reference: 'EU Official Journal L 123/45'
  },
  {
    id: '2',
    title: 'FDA Updates 510(k) Refuse to Accept Policy',
    severity: 'high',
    market: 'US',
    date: '2026-04-20',
    summary: 'FDA has updated the Refuse to Accept (RTA) checklist for 510(k) submissions, adding new acceptance criteria.',
    action: 'Review the updated RTA checklist before submitting new 510(k) applications.',
    reference: 'FDA Guidance Document'
  },
  {
    id: '3',
    title: 'EN 149:2026 Draft Standard Available for Comment',
    severity: 'medium',
    market: 'EU',
    date: '2026-04-15',
    summary: 'Draft revision of EN 149 standard for respiratory protective devices is now available for public comment.',
    action: 'Review and submit comments through your national standards body before the deadline.',
    reference: 'CEN/TC 79'
  },
  {
    id: '4',
    title: 'China GB Standard Update for Protective Clothing',
    severity: 'high',
    market: 'China',
    date: '2026-04-12',
    summary: 'Updated GB standard for chemical protective clothing published, with new testing requirements for liquid chemical penetration.',
    action: 'Update product testing protocols and submit for re-certification if currently certified.',
    reference: 'GB 24539-2026'
  },
  {
    id: '5',
    title: 'UK MHRA Post-Brexit Regulatory Change Notice',
    severity: 'medium',
    market: 'UK',
    date: '2026-04-08',
    summary: 'MHRA has issued guidance on post-Brexit regulatory changes affecting PPE with medical claims.',
    action: 'Verify UKCA marking status for products with dual PPE/medical device classification.',
    reference: 'MHRA Guidance 2026/04'
  },
  {
    id: '6',
    title: 'ISO 45001:2026 Amendment Released',
    severity: 'low',
    market: 'Global',
    date: '2026-04-05',
    summary: 'Minor amendment to ISO 45001 occupational health and safety management system standard published.',
    action: 'Review amendment and update OHS management system documentation if applicable.',
    reference: 'ISO/TC 283'
  }
]

export default function RegulatoryAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('all')

  const severities = ['all', 'critical', 'high', 'medium', 'low']

  const filteredAlerts = REGULATORY_ALERTS.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const matchesSearch = !searchQuery ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Bell className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Regulatory Alerts</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay ahead of regulatory changes that impact your PPE products and compliance status
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
                placeholder="Search alerts..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {severities.map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    selectedSeverity === sev
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className={`bg-white rounded-2xl shadow-lg border-l-4 p-6 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{alert.severity}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{alert.market}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {alert.date}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{alert.title}</h2>
                  <p className="text-gray-600 mb-3">{alert.summary}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Required Action</h3>
                    <p className="text-gray-600 text-sm">{alert.action}</p>
                  </div>
                  <div className="text-xs text-gray-400">Reference: {alert.reference}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No alerts found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
