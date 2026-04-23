'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle2, Clock, Filter, Search, ExternalLink, ChevronDown, ChevronUp, BellRing, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
type AlertCategory = 'regulation' | 'standard' | 'recall' | 'ban' | 'guidance'

interface RegulatoryAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  category: AlertCategory
  marketCode: string
  categoryIds: string[]
  publishDate: string
  effectiveDate?: string
  source: string
  sourceUrl?: string
  read: boolean
  bookmarked: boolean
}

const DEMO_ALERTS: RegulatoryAlert[] = [
  {
    id: '1',
    title: 'EU PPE Regulation (EU) 2016/425 Amendment 2024',
    description: 'New amendment introduces updated conformity assessment procedures for Category III PPE. Manufacturers must update technical documentation by December 2024.',
    severity: 'critical',
    category: 'regulation',
    marketCode: 'EU',
    categoryIds: ['respiratory-protection', 'protective-clothing', 'safety-footwear', 'protective-gloves', 'eye-protection'],
    publishDate: '2024-01-15',
    effectiveDate: '2024-12-31',
    source: 'European Commission',
    sourceUrl: 'https://eur-lex.europa.eu',
    read: false,
    bookmarked: true,
  },
  {
    id: '2',
    title: 'FDA Updates N95 Respirator Guidance',
    description: 'FDA releases updated enforcement policy for N95 respirators during public health emergencies. New testing requirements for imported respirators.',
    severity: 'high',
    category: 'guidance',
    marketCode: 'US',
    categoryIds: ['respiratory-protection'],
    publishDate: '2024-02-20',
    effectiveDate: '2024-03-01',
    source: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov',
    read: false,
    bookmarked: false,
  },
  {
    id: '3',
    title: 'EN 149:2001+A1:2009 Under Revision',
    description: 'CEN announces revision of EN 149 standard for filtering facepieces. Draft standard includes new requirements for breathability and fit testing.',
    severity: 'high',
    category: 'standard',
    marketCode: 'EU',
    categoryIds: ['respiratory-protection'],
    publishDate: '2024-03-01',
    effectiveDate: '2025-06-01',
    source: 'CEN',
    sourceUrl: 'https://www.cencenelec.eu',
    read: true,
    bookmarked: true,
  },
  {
    id: '4',
    title: 'UKCA Marking Transition Period Extended',
    description: 'UK government extends recognition of CE marking for PPE products until December 2024. Manufacturers can continue using CE marking on UK market.',
    severity: 'medium',
    category: 'regulation',
    marketCode: 'UK',
    categoryIds: ['respiratory-protection', 'protective-clothing', 'safety-footwear', 'protective-gloves', 'eye-protection'],
    publishDate: '2024-01-30',
    effectiveDate: '2024-12-31',
    source: 'UK Department for Business',
    sourceUrl: 'https://www.gov.uk',
    read: true,
    bookmarked: false,
  },
  {
    id: '5',
    title: 'NMPA Updates Medical Mask Registration Requirements',
    description: 'China NMPA introduces new biocompatibility testing requirements for medical face masks. Additional cytotoxicity and sensitization tests required.',
    severity: 'high',
    category: 'regulation',
    marketCode: 'CN',
    categoryIds: ['respiratory-protection'],
    publishDate: '2024-02-10',
    effectiveDate: '2024-07-01',
    source: 'NMPA China',
    sourceUrl: 'https://www.nmpa.gov.cn',
    read: false,
    bookmarked: false,
  },
  {
    id: '6',
    title: 'Product Recall: Brand X Safety Gloves - Chemical Resistance Failure',
    description: 'RAPEX alert issued for Brand X chemical protective gloves failing EN 374 penetration tests. Batch numbers 2023-A45 through 2023-A52 affected.',
    severity: 'critical',
    category: 'recall',
    marketCode: 'EU',
    categoryIds: ['protective-gloves'],
    publishDate: '2024-03-15',
    source: 'RAPEX',
    sourceUrl: 'https://ec.europa.eu/safety-gate',
    read: false,
    bookmarked: true,
  },
  {
    id: '7',
    title: 'ASTM F2413-18 Updated to F2413-24',
    description: 'New version of ASTM F2413 standard for foot protection published. Updates include new impact resistance levels and conductive footwear requirements.',
    severity: 'medium',
    category: 'standard',
    marketCode: 'US',
    categoryIds: ['safety-footwear'],
    publishDate: '2024-03-01',
    effectiveDate: '2025-01-01',
    source: 'ASTM International',
    sourceUrl: 'https://www.astm.org',
    read: true,
    bookmarked: false,
  },
  {
    id: '8',
    title: 'Saudi Arabia Bans Import of Non-Certified PPE',
    description: 'SASO announces immediate ban on PPE products without valid SASO conformity certificates. All PPE must have G-Mark certification.',
    severity: 'critical',
    category: 'ban',
    marketCode: 'GCC',
    categoryIds: ['respiratory-protection', 'protective-clothing', 'safety-footwear', 'protective-gloves', 'eye-protection'],
    publishDate: '2024-03-10',
    effectiveDate: '2024-03-10',
    source: 'SASO',
    sourceUrl: 'https://www.saso.gov.sa',
    read: false,
    bookmarked: false,
  },
]

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100', icon: <AlertTriangle className="w-4 h-4" /> },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <BellRing className="w-4 h-4" /> },
  medium: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: <Info className="w-4 h-4" /> },
  low: { label: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Info className="w-4 h-4" /> },
}

const CATEGORY_CONFIG: Record<AlertCategory, { label: string; color: string }> = {
  regulation: { label: 'Regulation', color: 'bg-purple-100 text-purple-700' },
  standard: { label: 'Standard', color: 'bg-blue-100 text-blue-700' },
  recall: { label: 'Recall', color: 'bg-red-100 text-red-700' },
  ban: { label: 'Import Ban', color: 'bg-red-100 text-red-700' },
  guidance: { label: 'Guidance', color: 'bg-green-100 text-green-700' },
}

export default function RegulatoryAlertsPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [alerts, setAlerts] = useState<RegulatoryAlert[]>(DEMO_ALERTS)
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<AlertCategory | 'all'>('all')
  const [filterMarket, setFilterMarket] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesCategory = filterCategory === 'all' || alert.category === filterCategory
    const matchesMarket = filterMarket === 'all' || alert.marketCode === filterMarket
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnread = !showUnreadOnly || !alert.read
    return matchesSeverity && matchesCategory && matchesMarket && matchesSearch && matchesUnread
  })

  const handleMarkRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const handleToggleBookmark = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a))
  }

  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    bookmarked: alerts.filter(a => a.bookmarked).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <BellRing className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Regulatory Alerts
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay ahead of regulatory changes, recalls, and compliance updates across global markets
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Alerts', value: stats.total, color: 'bg-gray-100 text-gray-900' },
              { label: 'Unread', value: stats.unread, color: 'bg-blue-100 text-blue-700' },
              { label: 'Critical', value: stats.critical, color: 'bg-red-100 text-red-700' },
              { label: 'Bookmarked', value: stats.bookmarked, color: 'bg-yellow-100 text-yellow-700' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className={`${stat.color} rounded-xl p-6 text-center`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterSeverity('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterSeverity === 'all' ? 'bg-[#339999] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Severities
                </button>
                {(Object.keys(SEVERITY_CONFIG) as AlertSeverity[]).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      filterSeverity === sev ? 'bg-[#339999] text-white' : `${SEVERITY_CONFIG[sev].bgColor} ${SEVERITY_CONFIG[sev].color} hover:opacity-80`
                    }`}
                  >
                    {SEVERITY_CONFIG[sev].icon}
                    {SEVERITY_CONFIG[sev].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as AlertCategory | 'all')}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {(Object.keys(CATEGORY_CONFIG) as AlertCategory[]).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                  ))}
                </select>
                <select
                  value={filterMarket}
                  onChange={(e) => setFilterMarket(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                >
                  <option value="all">All Markets</option>
                  {markets.map(m => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showUnreadOnly ? 'bg-[#339999] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Unread Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const severity = SEVERITY_CONFIG[alert.severity]
              const category = CATEGORY_CONFIG[alert.category]
              const market = markets.find(m => m.code === alert.marketCode)
              const isExpanded = expandedAlert === alert.id

              return (
                <motion.div
                  key={alert.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                    !alert.read ? 'border-l-4 border-l-[#339999]' : 'border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${severity.bgColor} ${severity.color}`}>
                            {severity.icon}
                            {severity.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                            {category.label}
                          </span>
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                            {market?.flag_emoji} {market?.name}
                          </span>
                          {!alert.read && (
                            <span className="w-2 h-2 bg-[#339999] rounded-full" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">{alert.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleBookmark(alert.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            alert.bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        {!alert.read && (
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Published: {alert.publishDate}
                      </span>
                      {alert.effectiveDate && (
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Effective: {alert.effectiveDate}
                        </span>
                      )}
                      <span>Source: {alert.source}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-6 bg-gray-50 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Product Categories</h4>
                            <div className="flex flex-wrap gap-2">
                              {alert.categoryIds.map(catId => {
                                const cat = categories.find(c => c.id === catId)
                                return cat ? (
                                  <span key={catId} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">
                                    {cat.name}
                                  </span>
                                ) : null
                              })}
                            </div>
                          </div>
                          {alert.sourceUrl && (
                            <a
                              href={alert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Official Source
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
