'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Clock, Mail, Download, Filter, Search, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
import { PPEIcon } from '@/components/ppe/PPEIcons'

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

type AlertStatus = 'active' | 'expired' | 'renewed'
type AlertType = 'expiry' | 'renewal' | 'change'

interface CertificateAlert {
  id: string
  certificateName: string
  certificateNumber: string
  categoryId: string
  marketCode: string
  issueDate: string
  expiryDate: string
  alertDays: number
  status: AlertStatus
  type: AlertType
  notes: string
  notified: boolean
}

const DEMO_ALERTS: CertificateAlert[] = [
  {
    id: '1',
    certificateName: 'CE Certificate - N95 Respirator',
    certificateNumber: 'CE-2024-001234-NB0459',
    categoryId: 'respiratory-protection',
    marketCode: 'EU',
    issueDate: '2024-01-15',
    expiryDate: '2029-01-14',
    alertDays: 180,
    status: 'active',
    type: 'expiry',
    notes: 'Module B + D certificate. Renewal requires updated test reports.',
    notified: false,
  },
  {
    id: '2',
    certificateName: 'FDA 510(k) - Surgical Mask',
    certificateNumber: 'K2401234',
    categoryId: 'respiratory-protection',
    marketCode: 'US',
    issueDate: '2024-03-01',
    expiryDate: '2024-12-31',
    alertDays: 90,
    status: 'active',
    type: 'renewal',
    notes: 'Annual registration renewal required. FDA user fee must be paid.',
    notified: true,
  },
  {
    id: '3',
    certificateName: 'UKCA Certificate - Safety Boots',
    certificateNumber: 'UKCA-2023-005678-AB',
    categoryId: 'safety-footwear',
    marketCode: 'UK',
    issueDate: '2023-06-01',
    expiryDate: '2024-05-31',
    alertDays: 90,
    status: 'expired',
    type: 'expiry',
    notes: 'Certificate expired. Renewal application submitted.',
    notified: true,
  },
  {
    id: '4',
    certificateName: 'NMPA Registration - Protective Gloves',
    certificateNumber: '国械注准20232140001',
    categoryId: 'protective-gloves',
    marketCode: 'CN',
    issueDate: '2023-08-15',
    expiryDate: '2028-08-14',
    alertDays: 365,
    status: 'active',
    type: 'expiry',
    notes: '5-year validity. Start renewal process 1 year before expiry.',
    notified: false,
  },
]

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getUrgencyColor(days: number, alertDays: number): string {
  if (days < 0) return 'text-red-600 bg-red-100'
  if (days <= 30) return 'text-red-600 bg-red-100'
  if (days <= alertDays) return 'text-orange-600 bg-orange-100'
  return 'text-green-600 bg-green-100'
}

function getUrgencyLabel(days: number, alertDays: number): string {
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires Today'
  if (days === 1) return '1 day left'
  if (days <= 30) return `${days} days left`
  if (days <= alertDays) return `${days} days left`
  return 'Active'
}

export default function CertificateAlertsPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [alerts, setAlerts] = useState<CertificateAlert[]>(DEMO_ALERTS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [newAlert, setNewAlert] = useState<Partial<CertificateAlert>>({
    status: 'active',
    type: 'expiry',
    alertDays: 90,
    notified: false,
  })

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    const matchesSearch = alert.certificateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleAddAlert = () => {
    if (!newAlert.certificateName || !newAlert.certificateNumber || !newAlert.expiryDate) return

    const alert: CertificateAlert = {
      id: Date.now().toString(),
      certificateName: newAlert.certificateName,
      certificateNumber: newAlert.certificateNumber,
      categoryId: newAlert.categoryId || categories[0].id,
      marketCode: newAlert.marketCode || markets[0].code,
      issueDate: newAlert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newAlert.expiryDate,
      alertDays: newAlert.alertDays || 90,
      status: newAlert.status as AlertStatus || 'active',
      type: newAlert.type as AlertType || 'expiry',
      notes: newAlert.notes || '',
      notified: false,
    }

    setAlerts(prev => [...prev, alert])
    setShowAddForm(false)
    setNewAlert({
      status: 'active',
      type: 'expiry',
      alertDays: 90,
      notified: false,
    })
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const handleMarkRenewed = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id !== id) return a
      return { ...a, status: 'renewed' as AlertStatus }
    }))
  }

  const handleExport = () => {
    const report = alerts.map(a => ({
      Certificate: a.certificateName,
      Number: a.certificateNumber,
      Category: categories.find(c => c.id === a.categoryId)?.name,
      Market: markets.find(m => m.code === a.marketCode)?.name,
      IssueDate: a.issueDate,
      ExpiryDate: a.expiryDate,
      DaysLeft: getDaysUntilExpiry(a.expiryDate),
      Status: a.status,
      Type: a.type,
      Notes: a.notes,
    }))

    const csv = [
      Object.keys(report[0]).join(','),
      ...report.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    expired: alerts.filter(a => a.status === 'expired').length,
    urgent: alerts.filter(a => {
      const days = getDaysUntilExpiry(a.expiryDate)
      return a.status === 'active' && days <= a.alertDays && days > 0
    }).length,
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
                <Bell className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Certificate Expiry Alerts
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Never miss a certificate renewal deadline. Track all your PPE certifications in one place.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Certificates', value: stats.total, color: 'bg-gray-100 text-gray-900' },
              { label: 'Active', value: stats.active, color: 'bg-green-100 text-green-700' },
              { label: 'Urgent', value: stats.urgent, color: 'bg-orange-100 text-orange-700' },
              { label: 'Expired', value: stats.expired, color: 'bg-red-100 text-red-700' },
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

      {/* Controls */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'expired', 'renewed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filterStatus === status ? 'bg-[#339999] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Certificate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-4 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Certificate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Certificate Name"
                    value={newAlert.certificateName || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, certificateName: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Certificate Number"
                    value={newAlert.certificateNumber || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, certificateNumber: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <select
                    value={newAlert.categoryId || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={newAlert.marketCode || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, marketCode: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  >
                    <option value="">Select Market</option>
                    {markets.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    placeholder="Issue Date"
                    value={newAlert.issueDate || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <input
                    type="date"
                    placeholder="Expiry Date"
                    value={newAlert.expiryDate || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Alert Days Before"
                    value={newAlert.alertDays || 90}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, alertDays: Number(e.target.value) }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <select
                    value={newAlert.type || 'expiry'}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as AlertType }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  >
                    <option value="expiry">Expiry Alert</option>
                    <option value="renewal">Renewal Reminder</option>
                    <option value="change">Regulation Change</option>
                  </select>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAlert}
                    className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
                  >
                    Add Certificate
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const daysLeft = getDaysUntilExpiry(alert.expiryDate)
              const urgencyClass = getUrgencyColor(daysLeft, alert.alertDays)
              const urgencyLabel = getUrgencyLabel(daysLeft, alert.alertDays)
              const category = categories.find(c => c.id === alert.categoryId)
              const market = markets.find(m => m.code === alert.marketCode)

              return (
                <motion.div
                  key={alert.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {category && <PPEIcon categoryId={category.id} size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{alert.certificateName}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyClass}`}>
                              {urgencyLabel}
                            </span>
                            {alert.notified && (
                              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Notified
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{alert.certificateNumber}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-500">{category?.name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-lg">{market?.flag_emoji}</span>
                            <span className="text-sm text-gray-500">{market?.name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{alert.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && daysLeft <= alert.alertDays && daysLeft > 0 && (
                          <button
                            onClick={() => handleMarkRenewed(alert.id)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Renewed
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dates & Progress */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Issued: {alert.issueDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Expires: {alert.expiryDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Bell className="w-4 h-4 text-gray-400" />
                        <span>Alert: {alert.alertDays} days before</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            daysLeft < 0 ? 'bg-red-500' :
                            daysLeft <= 30 ? 'bg-red-400' :
                            daysLeft <= alert.alertDays ? 'bg-orange-400' :
                            'bg-green-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, Math.min(100, (daysLeft / 365) * 100))}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    {alert.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {alert.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No certificates found</h3>
                <p className="text-gray-500">Add certificates to track their expiry dates</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
