'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Building2, Package, X, Loader2, AlertCircle, Lightbulb, FileQuestion, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'

interface EmptyStateProps {
  type: 'no-results' | 'no-filters' | 'error' | 'initial'
  message?: string
  onReset?: () => void
  searchQuery?: string
}

// 热门搜索推荐
const POPULAR_SEARCHES = [
  { term: 'N95 mask', type: 'product' },
  { term: '3M', type: 'company' },
  { term: 'surgical gown', type: 'product' },
  { term: 'CE certification', type: 'regulation' },
  { term: 'FDA 510k', type: 'regulation' },
]

// 搜索建议
const SEARCH_TIPS = [
  'Try using product names like "N95 mask" or "surgical gloves"',
  'Search for company names like "3M" or "Honeywell"',
  'Use certification types like "CE", "FDA", or "NMPA"',
  'Try product categories like "respirator" or "protective clothing"',
]

export function EmptyState({ type, message, onReset, searchQuery }: EmptyStateProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  const handlePopularSearch = (term: string) => {
    window.location.href = `/search?q=${encodeURIComponent(term)}`
  }

  const renderContent = () => {
    switch (type) {
      case 'no-results':
        return (
          <div className="text-center py-16">
            <div className={`transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No results found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                {message || `We couldn't find any results for "${searchQuery}". Try different keywords or browse our popular searches below.`}
              </p>
            </div>

            {/* 搜索建议 */}
            <div className={`transition-all duration-500 delay-100 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Search Tips</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {SEARCH_TIPS.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 热门搜索 */}
            <div className={`transition-all duration-500 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Searches</h4>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {POPULAR_SEARCHES.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularSearch(item.term)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#339999] hover:bg-[#339999]/5 transition-colors group"
                  >
                    {item.type === 'product' && <Package className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    {item.type === 'company' && <Building2 className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    {item.type === 'regulation' && <Filter className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    <span className="text-sm text-gray-700 group-hover:text-[#339999]">{item.term}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`transition-all duration-500 delay-300 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Button
                onClick={onReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear search
              </Button>
            </div>
          </div>
        )

      case 'no-filters':
        return (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No results match your filters
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Try adjusting your filter criteria or clear some filters to see more results.
            </p>
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear filters
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Something went wrong
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {message || 'An error occurred while searching. Please try again.'}
            </p>
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              Try again
            </Button>
          </div>
        )

      case 'initial':
      default:
        return (
          <div className="text-center py-16">
            <div className={`transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/5 rounded-full mb-6">
                <Search className="w-10 h-10 text-[#339999]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Start your PPE compliance search
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Search across FDA, NMPA, and EUDAMED databases for products, manufacturers, and regulations.
              </p>
            </div>

            {/* 快捷搜索入口 */}
            <div className={`transition-all duration-500 delay-100 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Link href="/search?type=product" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#339999] hover:bg-[#339999]/5 transition-colors group">
                  <Package className="w-5 h-5 text-gray-400 group-hover:text-[#339999]" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#339999]">Browse Products</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />
                </Link>
                <Link href="/search?type=company" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#339999] hover:bg-[#339999]/5 transition-colors group">
                  <Building2 className="w-5 h-5 text-gray-400 group-hover:text-[#339999]" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#339999]">Browse Companies</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />
                </Link>
                <Link href="/search?type=regulation" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#339999] hover:bg-[#339999]/5 transition-colors group">
                  <Filter className="w-5 h-5 text-gray-400 group-hover:text-[#339999]" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#339999]">Browse Regulations</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />
                </Link>
              </div>
            </div>

            {/* 热门搜索 */}
            <div className={`transition-all duration-500 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Searches</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularSearch(item.term)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#339999] hover:bg-[#339999]/5 transition-colors group"
                  >
                    {item.type === 'product' && <Package className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    {item.type === 'company' && <Building2 className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    {item.type === 'regulation' && <Filter className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />}
                    <span className="text-sm text-gray-700 group-hover:text-[#339999]">{item.term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {renderContent()}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/5 rounded-full mb-6">
        <Loader2 className="w-10 h-10 text-[#339999] animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        Searching...
      </h3>
      <p className="text-gray-600">
        Looking across multiple databases for matching results
      </p>
    </div>
  )
}

export { LoadingState }
