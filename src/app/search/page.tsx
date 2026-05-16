'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Filter, Building2, Package, X, Sparkles, TrendingUp, Scale } from 'lucide-react'
import { Button } from '@/components/ui'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, LoadingState } from '@/components/search/EmptyState'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { UserQuotaBar } from '@/components/permissions/UserQuotaBar'

function SearchContent() {
  const locale = useLocale()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const [searchType, setSearchType] = useState<'all' | 'product' | 'company' | 'regulation'>('all')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [deviceClass, setDeviceClass] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    console.log('[Search] Component mounted')
    console.log('[Search] window.location.search:', window.location.search)
    console.log('[Search] window.location.href:', window.location.href)

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || ''
    const type = (params.get('type') as 'all' | 'product' | 'company' | 'regulation') || 'all'

    console.log('[Search] Parsed params:', { q, type })

    setQuery(q)
    setSearchType(type)

    if (q) {
      console.log('[Search] Will search for:', q)
      performSearch(q, type)
    } else {
      console.log('[Search] No query, showing initial state')
      setLoading(false)
      setHasSearched(false)
    }
  }, [])

  const performSearch = async (searchQuery: string, type: 'all' | 'product' | 'company' | 'regulation') => {
    console.log('[Search] performSearch called:', { searchQuery, type })
    setLoading(true)
    setHasSearched(true)

    try {
      const allResults: any[] = []

      if (type === 'all' || type === 'product' || type === 'company') {
        const params = new URLSearchParams({
          q: searchQuery,
          type,
          limit: '50'
        })

        if (selectedMarkets.length > 0) {
          params.append('market', selectedMarkets.join(','))
        }

        if (deviceClass) {
          params.append('deviceClass', deviceClass)
        }

        console.log('[Search] Fetching:', `/api/search?${params}`)
        const response = await fetch(`/api/search?${params}`)
        console.log('[Search] Response status:', response.status)
        const data = await response.json()
        console.log('[Search] API data:', data)

        if (!response.ok) {
          console.error('Search API error:', data)
        } else if (data.data) {
          if (data.data.products && Array.isArray(data.data.products)) {
            console.log('[Search] Products found:', data.data.products.length)
            allResults.push(...data.data.products.map((p: any) => ({ ...p, _resultType: 'product' })))
          }
          if (data.data.companies && Array.isArray(data.data.companies)) {
            console.log('[Search] Companies found:', data.data.companies.length)
            allResults.push(...data.data.companies.map((c: any) => ({ ...c, _resultType: 'company' })))
          }
        }
      }

      if (type === 'all' || type === 'regulation') {
        try {
          const regParams = new URLSearchParams({
            q: searchQuery,
            limit: '50'
          })

          if (selectedMarkets.length > 0) {
            regParams.append('market', selectedMarkets.join(','))
          }

          const regResponse = await fetch(`/api/regulations/search?${regParams}`)
          const regData = await regResponse.json()

          if (regData.success && regData.data) {
            allResults.push(...regData.data.map((r: any) => ({ ...r, _resultType: 'regulation' })))
          }
        } catch (regError) {
          console.error('Regulation search error:', regError)
        }
      }

      console.log('[Search] Total results:', allResults.length)
      setResults(allResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarketToggle = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : [...prev, market]
    )
  }

  const clearFilters = () => {
    setSelectedMarkets([])
    setDeviceClass('')
    window.location.href = `/search?q=${query}&type=${searchType}`
  }

  // 初始状态 - 没有搜索词
  if (!hasSearched && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#339999]/20 to-[#339999]/5 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-[#339999]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {locale === 'zh' ? '搜索PPE数据库' : 'Search PPE Database'}
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {locale === 'zh' ? '搜索FDA、NMPA和EUDAMED数据库中的产品、制造商和合规法规' : 'Search for products, manufacturers, and compliance regulations across FDA, NMPA, and EUDAMED databases'}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SearchBar
                initialQuery=""
                placeholder={locale === 'zh' ? '搜索产品、企业或法规...' : 'Search products, companies, or regulations...'}
              />
              <div className="mt-3">
                <UserQuotaBar />
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Link href="/search?type=product">
                <Button variant="outline" size="sm" className="border-gray-200">
                  <Package className="w-4 h-4 mr-1" />
                  {locale === 'zh' ? '产品' : 'Products'}
                </Button>
              </Link>
              <Link href="/search?type=company">
                <Button variant="outline" size="sm" className="border-gray-200">
                  <Building2 className="w-4 h-4 mr-1" />
                  {locale === 'zh' ? '企业' : 'Companies'}
                </Button>
              </Link>
              <Link href="/search?type=regulation">
                <Button variant="outline" size="sm" className="border-gray-200">
                  <Scale className="w-4 h-4 mr-1" />
                  {locale === 'zh' ? '法规' : 'Regulations'}
                </Button>
              </Link>
              <Link href="/search?q=CE+FDA">
                <Button variant="outline" size="sm" className="border-gray-200">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {locale === 'zh' ? '热门' : 'Popular'}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState type="initial" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'zh' ? '搜索结果' : 'Search Results'}
              </h1>
              <p className="text-sm text-gray-500">
                {loading ? (locale === 'zh' ? '搜索中...' : 'Searching...') : (locale === 'zh' ? `找到 ${results.length} 条结果` : `Found ${results.length} results`)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {locale === 'zh' ? '筛选' : 'Filters'}
                {selectedMarkets.length > 0 || deviceClass ? (
                  <span className="w-2 h-2 rounded-full bg-[#339999]" />
                ) : null}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              initialQuery={query}
              placeholder={locale === 'zh' ? '搜索产品、企业、法规...' : 'Search products, companies, regulations...'}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link href={`/search?q=${query}&type=all`}>
              <Button
                variant={searchType === 'all' ? 'outline' : 'ghost'}
                size="sm"
                className={searchType === 'all' ? 'border-[#339999] text-[#339999]' : ''}
              >
                {locale === 'zh' ? '全部' : 'All'}
              </Button>
            </Link>
            <Link href={`/search?q=${query}&type=product`}>
              <Button
                variant={searchType === 'product' ? 'outline' : 'ghost'}
                size="sm"
                className={searchType === 'product' ? 'border-[#339999] text-[#339999]' : ''}
              >
                <Package className="w-4 h-4 mr-1" />
                {locale === 'zh' ? '产品' : 'Products'}
              </Button>
            </Link>
            <Link href={`/search?q=${query}&type=company`}>
              <Button
                variant={searchType === 'company' ? 'outline' : 'ghost'}
                size="sm"
                className={searchType === 'company' ? 'border-[#339999] text-[#339999]' : ''}
              >
                <Building2 className="w-4 h-4 mr-1" />
                {locale === 'zh' ? '企业' : 'Companies'}
              </Button>
            </Link>
            <Link href={`/search?q=${query}&type=regulation`}>
              <Button
                variant={searchType === 'regulation' ? 'outline' : 'ghost'}
                size="sm"
                className={searchType === 'regulation' ? 'border-[#339999] text-[#339999]' : ''}
              >
                <Scale className="w-4 h-4 mr-1" />
                {locale === 'zh' ? '法规' : 'Regulations'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {locale === 'zh' ? '筛选' : 'Filters'}
                </h3>

                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    {locale === 'zh' ? '市场' : 'Market'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['FDA', 'NMPA', 'EUDAMED'] as string[]).map((market) => (
                      <button
                        key={market}
                        onClick={() => handleMarketToggle(market)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all
                          ${selectedMarkets.includes(market)
                            ? 'bg-[#339999] text-white border-[#339999]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#339999]'
                          }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    {locale === 'zh' ? '器械类别' : 'Device Class'}
                  </label>
                  <select
                    value={deviceClass}
                    onChange={(e) => setDeviceClass(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#339999]"
                  >
                    <option value="">{locale === 'zh' ? '所有类别' : 'All Classes'}</option>
                    <option value="Class I">Class I</option>
                    <option value="Class II">Class II</option>
                    <option value="Class III">Class III</option>
                  </select>
                </div>

                {(selectedMarkets.length > 0 || deviceClass) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    {locale === 'zh' ? '清除所有筛选' : 'Clear all filters'}
                  </Button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingState />
        ) : results.length === 0 ? (
          <EmptyState
            type="no-results"
            searchQuery={query}
            message={locale === 'zh' ? '请尝试调整搜索词，或浏览以下热门搜索' : 'Try adjusting your search terms or browse our popular searches below'}
            onReset={() => { window.location.href = '/search' }}
          />
        ) : (
          <SearchResults results={results} type={searchType} />
        )}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
