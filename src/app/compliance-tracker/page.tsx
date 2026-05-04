'use client'

import { useState, useEffect } from 'react'
import { ClipboardCheck, Search, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, Building, Calendar, LogIn, UserPlus, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

interface ComplianceStep {
  name: string
  status: 'completed' | 'in_progress' | 'pending'
  date: string
}

interface ComplianceItem {
  id: string
  productName: string
  manufacturer: string
  market: string
  regulation: string
  steps: ComplianceStep[]
  overallProgress: number
  estimatedCompletion: string
  isExample?: boolean
}

const EXAMPLE_ITEMS: ComplianceItem[] = [
  {
    id: 'example-1',
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
    estimatedCompletion: '2026-08-15',
    isExample: true
  },
  {
    id: 'example-2',
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
    estimatedCompletion: '2026-07-20',
    isExample: true
  },
  {
    id: 'example-3',
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
    estimatedCompletion: '2026-06-30',
    isExample: true
  },
  {
    id: 'example-4',
    productName: 'Medical Face Mask Type IIR',
    manufacturer: 'MediShield Corp.',
    market: 'China',
    regulation: 'NMPA Registration',
    steps: [
      { name: 'Product Classification', status: 'completed', date: '2025-08-01' },
      { name: 'Type Testing at NMPA Lab', status: 'in_progress', date: '2025-10-15' },
      { name: 'Clinical Evaluation', status: 'pending', date: '' },
      { name: 'Registration Application', status: 'pending', date: '' },
      { name: 'GMP Inspection', status: 'pending', date: '' },
      { name: 'Registration Certificate', status: 'pending', date: '' }
    ],
    overallProgress: 25,
    estimatedCompletion: '2027-02-28',
    isExample: true
  }
]

const STORAGE_KEY = 'ppe_user_compliance_items'

function readUserItems(): ComplianceItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeUserItems(items: ComplianceItem[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* */ }
}

export default function ComplianceTrackerPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userItems, setUserItems] = useState<ComplianceItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [newManufacturer, setNewManufacturer] = useState('')
  const [newMarket, setNewMarket] = useState('US')
  const [newRegulation, setNewRegulation] = useState('FDA 510(k)')
  const [newEstDate, setNewEstDate] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setIsLoggedIn(!!parsed && !!parsed.id)
      } catch { setIsLoggedIn(false) }
    }
    setUserItems(readUserItems())
  }, [])

  const markets = ['all', 'EU', 'US', 'China', 'UK']

  const allItems = [...userItems, ...EXAMPLE_ITEMS]

  const filteredItems = allItems.filter(item => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return locale === 'zh' ? '已完成' : 'Completed'
      case 'in_progress': return locale === 'zh' ? '进行中' : 'In Progress'
      case 'pending': return locale === 'zh' ? '待处理' : 'Pending'
      default: return status
    }
  }

  const handleAddItem = () => {
    if (!newProduct.trim()) return
    const regulationSteps: Record<string, ComplianceStep[]> = {
      'FDA 510(k)': [
        { name: 'Predicate Device Identification', status: 'pending', date: '' },
        { name: 'Performance Testing', status: 'pending', date: '' },
        { name: 'Biocompatibility Testing', status: 'pending', date: '' },
        { name: '510(k) Summary Preparation', status: 'pending', date: '' },
        { name: 'FDA Submission', status: 'pending', date: '' },
        { name: 'FDA Review & Clearance', status: 'pending', date: '' }
      ],
      'CE Category II': [
        { name: 'Risk Assessment', status: 'pending', date: '' },
        { name: 'Technical File Preparation', status: 'pending', date: '' },
        { name: 'Notified Body Application', status: 'pending', date: '' },
        { name: 'EU Type Examination (Module B)', status: 'pending', date: '' },
        { name: 'Conformity Assessment', status: 'pending', date: '' },
        { name: 'CE Marking & DoC', status: 'pending', date: '' }
      ],
      'CE Category III': [
        { name: 'Risk Assessment', status: 'pending', date: '' },
        { name: 'Technical File Preparation', status: 'pending', date: '' },
        { name: 'EU Type Examination (Module B)', status: 'pending', date: '' },
        { name: 'Quality System Assessment (Module D)', status: 'pending', date: '' },
        { name: 'Production Quality Assurance', status: 'pending', date: '' },
        { name: 'CE Marking & DoC', status: 'pending', date: '' }
      ],
      'NMPA Registration': [
        { name: 'Product Classification', status: 'pending', date: '' },
        { name: 'Type Testing at NMPA Lab', status: 'pending', date: '' },
        { name: 'Clinical Evaluation', status: 'pending', date: '' },
        { name: 'Registration Application', status: 'pending', date: '' },
        { name: 'GMP Inspection', status: 'pending', date: '' },
        { name: 'Registration Certificate', status: 'pending', date: '' }
      ]
    }

    const steps = regulationSteps[newRegulation] || regulationSteps['FDA 510(k)']
    const newItem: ComplianceItem = {
      id: `user-${Date.now()}`,
      productName: newProduct.trim(),
      manufacturer: newManufacturer.trim(),
      market: newMarket,
      regulation: newRegulation,
      steps,
      overallProgress: 0,
      estimatedCompletion: newEstDate || 'TBD',
      isExample: false
    }
    const updated = [newItem, ...userItems]
    setUserItems(updated)
    writeUserItems(updated)
    setNewProduct('')
    setNewManufacturer('')
    setNewMarket('US')
    setNewRegulation('FDA 510(k)')
    setNewEstDate('')
    setShowAddForm(false)
  }

  const handleDeleteItem = (id: string) => {
    const updated = userItems.filter(item => item.id !== id)
    setUserItems(updated)
    writeUserItems(updated)
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
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.complianceTrackerTitle}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.complianceTrackerSubtitle}
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

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchProductsPlaceholder}
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
                  {market === 'all' ? t.allMarkets : market}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Add Item Form */}
          <div className="mb-8">
            {showAddForm ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'zh' ? '添加跟踪项目' : 'Add Tracking Item'}
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
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      placeholder={locale === 'zh' ? '输入产品名称' : 'Enter product name'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '制造商' : 'Manufacturer'}
                    </label>
                    <input
                      type="text"
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value)}
                      placeholder={locale === 'zh' ? '输入制造商名称' : 'Enter manufacturer name'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '目标市场' : 'Target Market'}
                    </label>
                    <select
                      value={newMarket}
                      onChange={(e) => setNewMarket(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    >
                      <option value="US">US</option>
                      <option value="EU">EU</option>
                      <option value="CN">China</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '法规类型' : 'Regulation Type'}
                    </label>
                    <select
                      value={newRegulation}
                      onChange={(e) => setNewRegulation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    >
                      <option value="FDA 510(k)">FDA 510(k)</option>
                      <option value="CE Category II">CE Category II</option>
                      <option value="CE Category III">CE Category III</option>
                      <option value="NMPA Registration">NMPA Registration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'zh' ? '预计完成日期' : 'Estimated Completion Date'}
                    </label>
                    <input
                      type="date"
                      value={newEstDate}
                      onChange={(e) => setNewEstDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddItem}
                      disabled={!newProduct.trim()}
                      className="w-full px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locale === 'zh' ? '添加项目' : 'Add Item'}
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
                {locale === 'zh' ? '添加跟踪项目' : 'Add Tracking Item'}
              </button>
            )}
          </div>

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
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{item.productName}</h2>
                          {item.isExample && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {locale === 'zh' ? '示例' : 'Example'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Building className="w-4 h-4" />
                            {item.manufacturer}
                          </span>
                          <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-1 rounded">{item.market}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.regulation}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!item.isExample && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                            title={locale === 'zh' ? '删除' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#339999]">{item.overallProgress}%</div>
                          <div className="text-xs text-gray-400">{t.overallProgress}</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-[#339999] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.overallProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{t.estCompletion}: {item.estimatedCompletion}</span>
                      <span>{item.steps.filter(s => s.status === 'completed').length}/{item.steps.length} {t.stepsCompleted}</span>
                    </div>

                    {/* Step Progress Visual (always visible) */}
                    <div className="flex items-center mt-4 gap-1">
                      {item.steps.map((step, index) => (
                        <div key={index} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : step.status === 'in_progress' ? (
                              <Clock className="w-4 h-4 text-[#339999] animate-pulse" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className="text-[10px] text-gray-400 mt-1 text-center truncate w-full px-0.5">{step.name.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                          {index < item.steps.length - 1 && (
                            <div className={`h-0.5 w-2 flex-shrink-0 ${step.status === 'completed' ? 'bg-green-400' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {expandedItem === item.id && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">{t.complianceSteps}</h3>
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
                              {getStatusLabel(step.status)}
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
              <p className="text-gray-500">{t.noComplianceItems}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
