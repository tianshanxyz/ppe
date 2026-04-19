'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Filter, Building2, Package, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/search/EmptyState'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const [searchType, setSearchType] = useState<'all' | 'product' | 'company'>('all')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [deviceClass, setDeviceClass] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const query = searchParams.get('q') || ''
    const type = (searchParams.get('type') as 'all' | 'product' | 'company') || 'all'
    
    setSearchType(type)
    
    if (query) {
      performSearch(query, type)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const performSearch = async (query: string, type: 'all' | 'product' | 'company') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        type,
        limit: '50'
      })

      if (selectedMarkets.length > 0) {
        params.append('market', selectedMarkets.join(','))
      }

      if (deviceClass) {
        params.append('deviceClass', deviceClass)
      }

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      
      if (data.data) {
        setResults(data.data.products || data.data.companies || [])
      }
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
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    router.push(`/search?q=${query}&type=${type}`)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results
              </h1>
              <p className="text-sm text-gray-500">
                {loading ? 'Searching...' : `Found ${results.length} results`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {selectedMarkets.length > 0 || deviceClass ? (
                  <span className="w-2 h-2 rounded-full bg-[#339999]" />
                ) : null}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar 
              initialQuery={searchParams.get('q') || ''}
              placeholder="Search products, companies..."
            />
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={searchType === 'all' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => {
                const query = searchParams.get('q') || ''
                router.push(`/search?q=${query}&type=all`)
              }}
              className={searchType === 'all' ? 'border-[#339999] text-[#339999]' : ''}
            >
              All
            </Button>
            <Button
              variant={searchType === 'product' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => {
                const query = searchParams.get('q') || ''
                router.push(`/search?q=${query}&type=product`)
              }}
              className={searchType === 'product' ? 'border-[#339999] text-[#339999]' : ''}
            >
              <Package className="w-4 h-4 mr-1" />
              Products
            </Button>
            <Button
              variant={searchType === 'company' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => {
                const query = searchParams.get('q') || ''
                router.push(`/search?q=${query}&type=company`)
              }}
              className={searchType === 'company' ? 'border-[#339999] text-[#339999]' : ''}
            >
              <Building2 className="w-4 h-4 mr-1" />
              Companies
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Filters
                </h3>
                
                {/* Market Filters */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    Market
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

                {/* Device Class Filter */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    Device Class
                  </label>
                  <select
                    value={deviceClass}
                    onChange={(e) => setDeviceClass(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#339999]"
                  >
                    <option value="">All Classes</option>
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
                    Clear all filters
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

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState 
            type="no-results" 
            message="Try adjusting your search or filters"
            onReset={() => router.push('/search')}
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
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-4 border-[#339999] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
