'use client'

import { useState, useMemo } from 'react'
import { Bell, Search, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const REGULATORY_ALERTS = [
  {
    id: '1',
    title: 'FDA Draft Guidance on NIOSH-Approved Respirators - Comment Period Closing',
    severity: 'critical',
    market: 'US',
    date: '2026-06-19',
    summary: 'The 60-day public comment period for FDA draft guidance on NIOSH-approved air-purifying respirators closes on June 19, 2026. Manufacturers must submit comments or prepare for final guidance implementation.',
    action: 'Submit comments to FDA docket FDA-2026-D-XXXX before June 19, 2026. Review current 510(k) submissions for potential impact.',
    reference: 'Federal Register Document 2026-07613'
  },
  {
    id: '2',
    title: 'China NMPA GMP Requirements Effective November 1, 2026',
    severity: 'high',
    market: 'China',
    date: '2026-11-01',
    summary: 'NMPA Announcement No. 107 of 2025 revises Good Manufacturing Practice for Medical Devices. All PPE manufacturers exporting to China must comply by November 1, 2026.',
    action: 'Update quality management system documentation. Prepare for enhanced production environment monitoring and traceability requirements.',
    reference: 'NMPA Announcement No. 107 of 2025'
  },
  {
    id: '3',
    title: 'EU Safety Gate: Increased Market Surveillance on PPE CE Marking',
    severity: 'high',
    market: 'EU',
    date: '2026-04-30',
    summary: 'European Commission reports 35% increase in dangerous product alerts. PPE products with fraudulent CE marking are priority target for market surveillance authorities.',
    action: 'Verify CE marking authenticity. Ensure complete technical documentation and valid Notified Body certificates are available.',
    reference: 'EU Safety Gate Annual Report 2025 / Regulation (EU) 2019/1020'
  },
  {
    id: '4',
    title: 'UKCA Marking Transition Deadline December 31, 2027',
    severity: 'medium',
    market: 'UK',
    date: '2027-12-31',
    summary: 'CE marking will no longer be accepted in Great Britain after December 31, 2027. All PPE products must bear UKCA marking for GB market access.',
    action: 'Engage UK Approved Body for UKCA certification. Update product labeling and technical documentation for UKCA compliance.',
    reference: 'UK Statutory Instrument 2026/456'
  },
  {
    id: '5',
    title: 'NMPA Public Consultation on 26 Registration Guidelines - Comment Deadline',
    severity: 'medium',
    market: 'China',
    date: '2026-02-28',
    summary: 'Public consultation on 26 medical device registration guidelines closes February 28, 2026. Guidelines include enhanced requirements for PPE classified as medical devices.',
    action: 'Review draft guidelines and submit comments to NMPA. Prepare for updated registration requirements expected Q4 2026.',
    reference: 'NMPA Announcement (December 11, 2025)'
  },
  {
    id: '6',
    title: 'EU PPE Regulation Guidelines 5th Edition - Implementation Required',
    severity: 'medium',
    market: 'EU',
    date: '2025-10-15',
    summary: 'European Commission published 5th edition of PPE Regulation Guidelines. Notified Bodies and manufacturers must reference this edition for new certifications and renewals.',
    action: 'Update internal procedures to align with 5th edition guidelines. Review technical documentation for compliance with updated requirements.',
    reference: 'European Commission PPE Regulation Guidelines, 5th Edition'
  }
]

export default function RegulatoryAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [activeSearch, setActiveSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const severities = ['all', 'critical', 'high', 'medium', 'low']

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setCurrentPage(1)
  }

  const filteredAlerts = useMemo(() => REGULATORY_ALERTS.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const matchesSearch = !activeSearch ||
      alert.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      alert.summary.toLowerCase().includes(activeSearch.toLowerCase())
    return matchesSeverity && matchesSearch
  }), [activeSearch, selectedSeverity])

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSeverityChange = (severity: string) => {
    setSelectedSeverity(severity)
    setCurrentPage(1)
  }

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
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..."
                className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2a7a7a] transition-colors"
              >
                Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {severities.map(sev => (
                <button
                  key={sev}
                  onClick={() => handleSeverityChange(sev)}
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
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedAlerts.length > 0 ? (
            <div className="space-y-4">
              {paginatedAlerts.map(alert => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-[#339999] text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-[#339999] hover:text-[#339999]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
