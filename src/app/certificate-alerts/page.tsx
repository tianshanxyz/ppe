'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Search, AlertTriangle, CheckCircle, Clock, XCircle, LogIn, UserPlus, Plus, Trash2, X, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

interface CertificateAlert {
  id: string
  productName: string
  certificateType: string
  certificateNumber: string
  expiryDate: string
  remindDaysBefore: number
  isExample?: boolean
}

const EXAMPLE_ALERTS: CertificateAlert[] = [
  {
    id: 'example-1',
    productName: 'N95 Respirator XR-500',
    certificateType: 'FDA 510(k)',
    certificateNumber: 'K251234',
    expiryDate: '2026-03-15',
    remindDaysBefore: 30,
    isExample: true
  },
  {
    id: 'example-2',
    productName: 'Safety Helmet ProShield X1',
    certificateType: 'CE Certificate',
    certificateNumber: 'CE-2024-00892',
    expiryDate: '2026-07-20',
    remindDaysBefore: 30,
    isExample: true
  },
  {
    id: 'example-3',
    productName: 'Chemical Protective Suit CPS-200',
    certificateType: 'CE Category III',
    certificateNumber: 'CE3-2023-01567',
    expiryDate: '2025-12-31',
    remindDaysBefore: 30,
    isExample: true
  },
  {
    id: 'example-4',
    productName: 'Medical Face Mask Type IIR',
    certificateType: 'NMPA Registration',
    certificateNumber: 'NMPA-2025-00341',
    expiryDate: '2027-06-30',
    remindDaysBefore: 30,
    isExample: true
  },
  {
    id: 'example-5',
    productName: 'Safety Goggles VisionPro 300',
    certificateType: 'ANSI Z87.1',
    certificateNumber: 'ANSI-Z87-2024-1122',
    expiryDate: '2026-11-15',
    remindDaysBefore: 30,
    isExample: true
  }
]

const STORAGE_KEY = 'ppe_user_certificate_alerts'

function readUserAlerts(): CertificateAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeUserAlerts(items: CertificateAlert[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* */ }
}

function getDaysUntilExpiry(dateStr: string): number {
  const expiry = new Date(dateStr)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type ExpiryLevel = 'expired' | 'critical' | 'warning' | 'safe'

function getExpiryLevel(dateStr: string): ExpiryLevel {
  const days = getDaysUntilExpiry(dateStr)
  if (days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'safe'
}

function getExpiryBadge(level: ExpiryLevel, locale: string) {
  switch (level) {
    case 'expired':
      return {
        label: locale === 'zh' ? '已过期' : 'Expired',
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    case 'critical':
      return {
        label: locale === 'zh' ? '即将到期' : 'Expiring Soon',
        className: 'bg-orange-100 text-orange-700 border-orange-200'
      }
    case 'warning':
      return {
        label: locale === 'zh' ? '注意' : 'Warning',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      }
    case 'safe':
      return {
        label: locale === 'zh' ? '有效' : 'Valid',
        className: 'bg-green-100 text-green-700 border-green-200'
      }
  }
}

export default function CertificateAlertsPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<ExpiryLevel | 'all'>('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userAlerts, setUserAlerts] = useState<CertificateAlert[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newCertType, setNewCertType] = useState('FDA 510(k)')
  const [newCertNumber, setNewCertNumber] = useState('')
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [newRemindDays, setNewRemindDays] = useState('30')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setIsLoggedIn(!!parsed && !!parsed.id)
      } catch { setIsLoggedIn(false) }
    }
    setUserAlerts(readUserAlerts())
  }, [])

  const allAlerts = [...userAlerts, ...EXAMPLE_ALERTS]

  const filteredAlerts = allAlerts.filter(item => {
    const matchesSearch = !searchQuery ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.certificateType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterLevel === 'all' || getExpiryLevel(item.expiryDate) === filterLevel
    return matchesSearch && matchesFilter
  })

  // Sort by urgency
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const levelOrder: Record<ExpiryLevel, number> = { expired: 0, critical: 1, warning: 2, safe: 3 }
    return levelOrder[getExpiryLevel(a.expiryDate)] - levelOrder[getExpiryLevel(b.expiryDate)]
  })

  const handleAddAlert = () => {
    if (!newProductName.trim() || !newExpiryDate) return
    const newAlert: CertificateAlert = {
      id: `user-${Date.now()}`,
      productName: newProductName.trim(),
      certificateType: newCertType,
      certificateNumber: newCertNumber.trim(),
      expiryDate: newExpiryDate,
      remindDaysBefore: parseInt(newRemindDays) || 30,
      isExample: false
    }
    const updated = [newAlert, ...userAlerts]
    setUserAlerts(updated)
    writeUserAlerts(updated)
    setNewProductName('')
    setNewCertType('FDA 510(k)')
    setNewCertNumber('')
    setNewExpiryDate('')
    setNewRemindDays('30')
    setShowAddForm(false)
  }

  const handleDeleteAlert = (id: string) => {
    const updated = userAlerts.filter(item => item.id !== id)
    setUserAlerts(updated)
    writeUserAlerts(updated)
  }

  const certTypes = [
    'FDA 510(k)', 'CE Certificate', 'CE Category II', 'CE Category III',
    'NMPA Registration', 'ANSI Z87.1', 'EN 149:2001+A1:2009',
    'ISO 13485', 'UKCA Marking', 'UL Certification'
  ]

  // Stats
  const stats = {
    expired: allAlerts.filter(a => getExpiryLevel(a.expiryDate) === 'expired').length,
    critical: allAlerts.filter(a => getExpiryLevel(a.expiryDate) === 'critical').length,
    warning: allAlerts.filter(a => getExpiryLevel(a.expiryDate) === 'warning').length,
    safe: allAlerts.filter(a => getExpiryLevel(a.expiryDate) === 'safe').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <ShieldAlert className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.certificateAlertsTitle}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.certificateAlertsSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Demo Data Banner */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{t.demoDataBanner}:</span>
                <span>{locale === 'zh' ? t.demoDataBannerCn : t.demoDataBannerDesc}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/auth/signup">
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#339999] text-white text-sm font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors">
                    <UserPlus className="w-4 h-4" />
                    {t.registerNow}
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#339999] text-[#339999] text-sm font-semibold rounded-lg hover:bg-[#339999]/5 transition-colors">
                    <LogIn className="w-4 h-4" />
                    {t.loginNow}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button onClick={() => setFilterLevel('expired')} className={`p-4 rounded-xl border-2 transition-all ${filterLevel === 'expired' ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white hover:border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600">{locale === 'zh' ? '已过期' : 'Expired'}</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </button>
            <button onClick={() => setFilterLevel('critical')} className={`p-4 rounded-xl border-2 transition-all ${filterLevel === 'critical' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">{locale === 'zh' ? '30天内' : 'Within 30d'}</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
            </button>
            <button onClick={() => setFilterLevel('warning')} className={`p-4 rounded-xl border-2 transition-all ${filterLevel === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 bg-white hover:border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">{locale === 'zh' ? '90天内' : 'Within 90d'}</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            </button>
            <button onClick={() => setFilterLevel('safe')} className={`p-4 rounded-xl border-2 transition-all ${filterLevel === 'safe' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">{locale === 'zh' ? '有效' : 'Valid'}</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.safe}</div>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'zh' ? '搜索产品、证书编号...' : 'Search products, cert numbers...'}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
            </div>
            {filterLevel !== 'all' && (
              <button onClick={() => setFilterLevel('all')} className="text-sm text-[#339999] hover:underline">
                {locale === 'zh' ? '清除筛选' : 'Clear Filter'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Add Alert Form */}
          <div className="mb-8">
            {showAddForm ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'zh' ? '添加证书提醒' : 'Add Certificate Alert'}
                  </h3>
                  <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '产品名称' : 'Product Name'} *
                    </label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder={locale === 'zh' ? '输入产品名称' : 'Enter product name'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '证书类型' : 'Certificate Type'}
                    </label>
                    <select
                      value={newCertType}
                      onChange={(e) => setNewCertType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    >
                      {certTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '证书编号' : 'Certificate Number'}
                    </label>
                    <input
                      type="text"
                      value={newCertNumber}
                      onChange={(e) => setNewCertNumber(e.target.value)}
                      placeholder={locale === 'zh' ? '输入证书编号' : 'Enter certificate number'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '到期日期' : 'Expiry Date'} *
                    </label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '提前提醒天数' : 'Remind Days Before'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={newRemindDays}
                      onChange={(e) => setNewRemindDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddAlert}
                      disabled={!newProductName.trim() || !newExpiryDate}
                      className="w-full px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locale === 'zh' ? '添加提醒' : 'Add Alert'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {locale === 'zh' ? '添加证书提醒' : 'Add Certificate Alert'}
              </button>
            )}
          </div>

          {sortedAlerts.length > 0 ? (
            <div className="space-y-4">
              {sortedAlerts.map(item => {
                const level = getExpiryLevel(item.expiryDate)
                const daysLeft = getDaysUntilExpiry(item.expiryDate)
                const badge = getExpiryBadge(level, locale)

                return (
                  <div key={item.id} className={`bg-white rounded-2xl shadow-lg border-l-4 overflow-hidden ${
                    level === 'expired' ? 'border-l-red-500' :
                    level === 'critical' ? 'border-l-orange-500' :
                    level === 'warning' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{item.productName}</h3>
                            {item.isExample && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {locale === 'zh' ? '示例' : 'Example'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <FileText className="w-4 h-4" />
                              {item.certificateType}
                            </span>
                            <span className="text-sm text-gray-400">#{item.certificateNumber}</span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {locale === 'zh' ? '到期' : 'Expires'}: {item.expiryDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          {!item.isExample && (
                            <button
                              onClick={() => handleDeleteAlert(item.id)}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                              title={locale === 'zh' ? '删除' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className="text-right">
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${badge.className}`}>
                              {badge.label}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">
                              {daysLeft < 0
                                ? (locale === 'zh' ? `已过期 ${Math.abs(daysLeft)} 天` : `${Math.abs(daysLeft)} days overdue`)
                                : (locale === 'zh' ? `剩余 ${daysLeft} 天` : `${daysLeft} days left`)
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{locale === 'zh' ? '暂无证书提醒' : 'No certificate alerts found'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
