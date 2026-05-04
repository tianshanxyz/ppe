'use client'

import { useState, useEffect } from 'react'
import { Award, Search, Clock, AlertTriangle, CheckCircle2, XCircle, Calendar, Building, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

const CERTIFICATE_ALERTS = [
  {
    id: '1',
    productName: 'N95 Respirator Model XR-500',
    manufacturer: 'SafeGuard PPE Co., Ltd.',
    certificateType: 'NIOSH Approval',
    certificateNumber: 'NIOSH-2024-1234',
    issueDate: '2024-03-15',
    expiryDate: '2026-03-15',
    daysRemaining: 325,
    status: 'valid',
    market: 'US'
  },
  {
    id: '2',
    productName: 'Safety Helmet ProShield X1',
    manufacturer: 'HeadGuard Industries',
    certificateType: 'CE Certificate',
    certificateNumber: 'CE-2023-5678',
    issueDate: '2023-06-20',
    expiryDate: '2026-06-20',
    daysRemaining: 422,
    status: 'valid',
    market: 'EU'
  },
  {
    id: '3',
    productName: 'Chemical Protective Suit CPS-200',
    manufacturer: 'ChemSafe Manufacturing',
    certificateType: 'CE Category III',
    certificateNumber: 'CE-2022-9012',
    issueDate: '2022-01-10',
    expiryDate: '2026-01-10',
    daysRemaining: 260,
    status: 'expiring_soon',
    market: 'EU'
  },
  {
    id: '4',
    productName: 'Medical Face Mask Type IIR',
    manufacturer: 'MediShield Corp.',
    certificateType: 'FDA 510(k)',
    certificateNumber: 'K240567',
    issueDate: '2024-02-28',
    expiryDate: '2026-02-28',
    daysRemaining: 309,
    status: 'valid',
    market: 'US'
  },
  {
    id: '5',
    productName: 'Anti-impact Gloves AG-100',
    manufacturer: 'HandSafe Solutions',
    certificateType: 'UKCA Certificate',
    certificateNumber: 'UKCA-2023-3456',
    issueDate: '2023-09-01',
    expiryDate: '2026-09-01',
    daysRemaining: 495,
    status: 'valid',
    market: 'UK'
  },
  {
    id: '6',
    productName: 'Safety Footwear SteelToe Pro',
    manufacturer: 'StepSafe Ltd.',
    certificateType: 'CE Certificate',
    certificateNumber: 'CE-2021-7890',
    issueDate: '2021-11-15',
    expiryDate: '2026-05-15',
    daysRemaining: 20,
    status: 'expiring_soon',
    market: 'EU'
  }
]

export default function CertificateAlertsPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setIsLoggedIn(!!parsed && !!parsed.id)
      } catch {
        setIsLoggedIn(false)
      }
    }
  }, [])

  const statuses = ['all', 'valid', 'expiring_soon', 'expired']

  const filteredAlerts = CERTIFICATE_ALERTS.filter(alert => {
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus
    const matchesSearch = !searchQuery ||
      alert.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'expired' || daysRemaining <= 0) {
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> {t.expiredStatus}</span>
    }
    if (status === 'expiring_soon' || daysRemaining <= 90) {
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3" /> {t.expiringSoonStatus}</span>
    }
    return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> {t.validStatus}</span>
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all': return t.allLabel
      case 'valid': return t.validStatus
      case 'expiring_soon': return t.expiringSoonStatus
      case 'expired': return t.expiredStatus
      default: return status.replace('_', ' ')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Award className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.certificateAlertsTitle}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.certificateAlertsSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Demo Data Banner - shown when not logged in */}
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

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form
              className="relative w-full md:w-96"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchCertificates}
                className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                {t.search}
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === status
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getStatusLabel(status)}
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
                <div key={alert.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{alert.productName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{alert.manufacturer}</span>
                      </div>
                    </div>
                    {getStatusBadge(alert.status, alert.daysRemaining)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t.certificateTypeLabel}</p>
                      <p className="text-sm font-medium text-gray-700">{alert.certificateType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t.certificateNo}</p>
                      <p className="text-sm font-medium text-gray-700">{alert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t.marketCode}</p>
                      <p className="text-sm font-medium text-gray-700">{alert.market}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t.daysRemainingLabel}</p>
                      <p className={`text-sm font-bold ${alert.daysRemaining <= 90 ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.daysRemaining} {locale === 'zh' ? '天' : 'days'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {t.issued}: {alert.issueDate}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {t.expires}: {alert.expiryDate}</span>
                    </div>
                    <button className="text-sm text-[#339999] hover:text-[#2d8b8b] font-medium">
                      {t.setReminder}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t.noCertificateAlerts}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
