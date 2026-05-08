'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Building2,
  Globe,
  BadgeCheck,
  AlertTriangle,
  TrendingUp,
  Filter,
  ChevronDown,
  CheckSquare,
  Square,
  BarChart3,
  Star,
  ArrowRight,
  X,
  MapPin,
  Package,
  Activity,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Button, Badge, Card } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'

// Company data interface
interface Company {
  id: string
  name: string
  country?: string
  countryCode?: string
  industry?: string
  productCount?: number
  marketCoverage?: number
  riskLevel?: 'low' | 'medium' | 'high'
  trustScore?: number
  trustLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
  lastUpdate?: string
  logo?: string
  recentChanges?: number
  annualRevenue?: string
}

// Statistics interface
interface CompanyStats {
  totalCompanies: number
  newThisWeek: number
  highRisk: number
  activeMarkets: number
  updatedToday: number
}

// Compare company interface
interface CompareCompany {
  id: string
  name: string
  country?: string
  productCount?: number
  marketCoverage?: number
  trustScore?: number
  trustLevel?: string
  riskLevel?: string
  annualRevenue?: string
}

// Filter options
const countries = ['All', 'United States', 'Germany', 'Switzerland', 'Netherlands', 'China', 'Japan']
const industries = ['All', 'Cardiovascular', 'Orthopedics', 'Diagnostic Imaging', 'IVD', 'Interventional', 'Multi-Specialty']
const riskLevels = ['All', 'Low', 'Medium', 'High']

export default function CompaniesPage() {
  const locale = useLocale()
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedIndustry, setSelectedIndustry] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState('All')
  const [sortBy, setSortBy] = useState('trustScore')
  
  // Data and loading state
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<CompanyStats>({
    totalCompanies: 0,
    newThisWeek: 0,
    highRisk: 0,
    activeMarkets: 52,
    updatedToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Compare and favorites state
  const [compareList, setCompareList] = useState<string[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareData, setCompareData] = useState<CompareCompany[]>([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch company list
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCountry !== 'All') params.append('country', selectedCountry)
      if (selectedIndustry !== 'All') params.append('industry', selectedIndustry)
      if (selectedRisk !== 'All') params.append('riskLevel', selectedRisk.toLowerCase())
      params.append('type', 'company')
      params.append('limit', '50')
      
      const response = await fetch(`/api/search?${params.toString()}`)
      const result = await response.json()
      
      if (result.data && result.data.companies) {
        const formattedCompanies = result.data.companies.map((c: any) => ({
          id: c.id,
          name: c.name,
          country: c.country || (locale === 'zh' ? '未知' : 'Unknown'),
          industry: c.industry || (locale === 'zh' ? '医疗器械' : 'Medical Devices'),
          productCount: c.product_count || 0,
          marketCoverage: c.market_coverage || 0,
          riskLevel: c.risk_level || 'low',
          trustScore: c.trust_score || 0,
          trustLevel: c.trust_level,
          lastUpdate: c.updated_at,
          recentChanges: c.recent_changes || 0,
        }))
        setCompanies(formattedCompanies)
      } else {
        setCompanies([])
      }
      
      // Update statistics
      setStats({
        totalCompanies: result.meta?.total || 0,
        newThisWeek: result.meta?.newThisWeek || 0,
        highRisk: result.meta?.highRisk || 0,
        activeMarkets: 52,
        updatedToday: result.meta?.updatedToday || 0
      })
    } catch (err) {
      setError(locale === 'zh' ? '加载企业数据失败，请重试。' : 'Failed to load companies. Please try again.')
      console.error('Failed to fetch companies:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCountry, selectedIndustry, selectedRisk])

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fetch('/api/bookmarks')
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          const favoriteIds = result.data
            .filter((b: any) => b.entity_type === 'company')
            .map((b: any) => b.entity_id)
          setFavorites(favoriteIds)
        }
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchCompanies()
    fetchFavorites()
  }, [fetchCompanies, fetchFavorites])

  // Sort
  const sortedCompanies = [...companies].sort((a, b) => {
    if (sortBy === 'trustScore') return (b.trustScore || 0) - (a.trustScore || 0)
    if (sortBy === 'productCount') return (b.productCount || 0) - (a.productCount || 0)
    if (sortBy === 'marketCoverage') return (b.marketCoverage || 0) - (a.marketCoverage || 0)
    return a.name.localeCompare(b.name)
  })

  // Toggle compare
  const toggleCompare = (id: string) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter(c => c !== id))
    } else if (compareList.length < 4) {
      setCompareList([...compareList, id])
    }
  }

  // Fetch comparison data
  const fetchCompareData = async () => {
    if (compareList.length < 2) return
    
    try {
      setCompareLoading(true)
      const response = await fetch('/api/comparison/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: compareList })
      })
      
      if (response.ok) {
        const result = await response.json()
        setCompareData(result.data?.companies || [])
        setShowCompareModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err)
    } finally {
      setCompareLoading(false)
    }
  }

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    try {
      if (favorites.includes(id)) {
        // Remove favorite
        await fetch(`/api/bookmarks/company/${id}`, { method: 'DELETE' })
        setFavorites(favorites.filter(f => f !== id))
      } else {
        // Add favorite
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'company', entityId: id })
        })
        setFavorites([...favorites, id])
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  // Get risk level style
  const getRiskStyle = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Search and filter section */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search box */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={locale === 'zh' ? '搜索企业、产品或注册号...' : 'Search companies, products, or registration numbers...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCompanies()}
              className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>{locale === 'zh' ? '筛选：' : 'Filters:'}</span>
            </div>

            {/* Country filter */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Industry filter */}
            <div className="relative">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Risk level filter */}
            <div className="relative">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? (locale === 'zh' ? '所有风险' : 'All') : (locale === 'zh' ? (r === 'Low' ? '低' : r === 'Medium' ? '中' : '高') : r) + (locale === 'zh' ? '风险' : ' Risk')}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                <option value="trustScore">{locale === 'zh' ? '按信任评分排序' : 'Sort by Trust Score'}</option>
                <option value="productCount">{locale === 'zh' ? '按产品数排序' : 'Sort by Products'}</option>
                <option value="marketCoverage">{locale === 'zh' ? '按市场数排序' : 'Sort by Markets'}</option>
                <option value="name">{locale === 'zh' ? '按名称排序' : 'Sort by Name'}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[#339999] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                  <div className="bg-current rounded-sm" />
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[#339999] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="w-4 h-4 flex flex-col gap-0.5">
                  <div className="h-1 bg-current rounded-sm" />
                  <div className="h-1 bg-current rounded-sm" />
                  <div className="h-1 bg-current rounded-sm" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data overview cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-[#339999]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{locale === 'zh' ? '企业总数' : 'Total Companies'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies.toLocaleString()}</p>
              </div>
              <Building2 className="w-8 h-8 text-[#339999]" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{locale === 'zh' ? '本周新增' : 'New This Week'}</p>
                <p className="text-2xl font-bold text-gray-900">+{stats.newThisWeek}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{locale === 'zh' ? '高风险' : 'High Risk'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{locale === 'zh' ? '活跃市场' : 'Active Markets'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMarkets}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Compare bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">{compareList.length} {locale === 'zh' ? '家企业已选择' : 'companies selected'}</span>
              </div>
              <div className="h-6 w-px bg-gray-700" />
              <button
                onClick={fetchCompareData}
                disabled={compareLoading || compareList.length < 2}
                className="px-4 py-2 bg-[#339999] rounded-lg hover:bg-[#2a7a7a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compareLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  locale === 'zh' ? '立即对比' : 'Compare Now'
                )}
              </button>
              <button
                onClick={() => setCompareList([])}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? (locale === 'zh' ? '加载中...' : 'Loading...') : (locale === 'zh' ? `显示 ${sortedCompanies.length} 家企业` : `Showing ${sortedCompanies.length} companies`)}
          </p>
          {compareList.length > 0 && (
            <p className="text-sm text-[#339999] font-medium">
              {compareList.length} {locale === 'zh' ? '家已选对比' : 'selected for comparison'}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#339999]" />
          </div>
        ) : sortedCompanies.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{locale === 'zh' ? '未找到企业' : 'No companies found'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedCompanies.map((company) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="h-full p-5 hover:shadow-lg transition-all border-gray-200 hover:border-[#339999]/30">
                  {/* Header: Logo + Favorite + Compare */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 flex items-center justify-center text-[#339999] font-bold text-lg">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(company.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${favorites.includes(company.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                      <button
                        onClick={() => toggleCompare(company.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {compareList.includes(company.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#339999]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Company name */}
                  <Link href={`/company/${company.id}`}>
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#339999] transition-colors mb-1 line-clamp-1">
                      {company.name}
                    </h3>
                  </Link>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{company.country}</span>
                    {company.industry && (
                      <>
                        <span className="mx-1">·</span>
                        <span>{company.industry}</span>
                      </>
                    )}
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Package className="w-3 h-3" />
                        {locale === 'zh' ? '产品' : 'Products'}
                      </div>
                      <p className="font-semibold text-gray-900">{company.productCount || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Globe className="w-3 h-3" />
                        {locale === 'zh' ? '市场' : 'Markets'}
                      </div>
                      <p className="font-semibold text-gray-900">{company.marketCoverage || 0}</p>
                    </div>
                  </div>

                  {/* Footer: Risk + Trust */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <Badge className={`text-xs ${getRiskStyle(company.riskLevel)}`}>
                      {locale === 'zh' ? ((company.riskLevel || 'Low') === 'low' ? '低' : (company.riskLevel || 'Low') === 'medium' ? '中' : '高') + '风险' : `${(company.riskLevel || 'Low').charAt(0).toUpperCase() + (company.riskLevel || 'Low').slice(1)} Risk`}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <BadgeCheck className="w-4 h-4 text-[#339999]" />
                      <span className="font-medium text-gray-900">{company.trustScore || 0}</span>
                    </div>
                  </div>

                  {/* Recent updates */}
                  {company.recentChanges && company.recentChanges > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-[#339999]">
                      <Activity className="w-3 h-3" />
                      <span>{company.recentChanges} {locale === 'zh' ? '项近期更新' : 'updates recently'}</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-3">
            {sortedCompanies.map((company) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 hover:shadow-md transition-all border-gray-200 hover:border-[#339999]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 flex items-center justify-center text-[#339999] font-bold text-lg flex-shrink-0">
                      {company.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/company/${company.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-[#339999] transition-colors">
                            {company.name}
                          </h3>
                        </Link>
                        <Badge className={`text-xs ${getRiskStyle(company.riskLevel)}`}>
                          {(company.riskLevel || 'Low').charAt(0).toUpperCase() + (company.riskLevel || 'Low').slice(1)}
                        </Badge>
                        {company.recentChanges && company.recentChanges > 0 && (
                          <span className="text-xs text-[#339999] flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {company.recentChanges} {locale === 'zh' ? '项更新' : 'updates'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {company.country} · {company.industry || (locale === 'zh' ? '医疗器械' : 'Medical Devices')} · {company.productCount || 0} {locale === 'zh' ? '个产品' : 'products'} · {company.marketCoverage || 0} {locale === 'zh' ? '个市场' : 'markets'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{company.trustScore || 0}</p>
                        <p className="text-xs text-gray-500">{locale === 'zh' ? '信任评分' : 'Trust Score'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(company.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${favorites.includes(company.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                      <button
                        onClick={() => toggleCompare(company.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {compareList.includes(company.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#339999]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <Link href={`/company/${company.id}`}>
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Compare modal */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{locale === 'zh' ? '企业对比' : 'Company Comparison'}</h2>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto">
                {compareData.length > 0 ? (
                  <>
                    <div className={`grid gap-4 ${compareData.length === 2 ? 'grid-cols-2' : compareData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      {compareData.map(company => (
                        <div key={company.id} className="text-center">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 flex items-center justify-center text-[#339999] font-bold text-2xl mx-auto mb-3">
                            {company.name.charAt(0)}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
                          <p className="text-sm text-gray-500">{company.country}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 space-y-4">
                      {[(locale === 'zh' ? '信任评分' : 'Trust Score'), (locale === 'zh' ? '产品' : 'Products'), (locale === 'zh' ? '市场' : 'Markets'), (locale === 'zh' ? '风险等级' : 'Risk Level')].map((metric, metricIndex) => (
                        <div key={metric} className="grid gap-4 items-center py-3 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-500">{metric}</div>
                          <div className={`grid gap-4 ${compareData.length === 2 ? 'grid-cols-2' : compareData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                            {compareData.map(company => {
                              let value = ''
                              switch (metricIndex) {
                                case 0: value = `${company.trustScore || 0}%`; break
                                case 1: value = (company.productCount || 0).toString(); break
                                case 2: value = (company.marketCoverage || 0).toString(); break
                                case 3: value = locale === 'zh' ? ((company.riskLevel || 'Low') === 'low' ? '低' : (company.riskLevel || 'Low') === 'medium' ? '中' : '高') : (company.riskLevel || 'Low').charAt(0).toUpperCase() + (company.riskLevel || 'Low').slice(1); break
                              }
                              return (
                                <div key={company.id} className="text-center font-semibold text-gray-900">
                                  {value}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    {locale === 'zh' ? '暂无对比数据' : 'No comparison data available'}
                  </div>
                )}

                <div className="mt-6 flex justify-center gap-3">
                  <Button className="bg-[#339999] hover:bg-[#2a7a7a]">
                    <Download className="w-4 h-4 mr-2" />
                    {locale === 'zh' ? '导出对比' : 'Export Comparison'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCompareModal(false)}>
                    {locale === 'zh' ? '关闭' : 'Close'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
