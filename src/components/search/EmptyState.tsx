'use client'

import { useState, useEffect } from 'react'
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

function EmptyState({ type, message, onReset, searchQuery }: EmptyStateProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  const handlePopularSearch = (term: string) => {
    window.location.href = `/search?q=${encodeURIComponent(term)}`
  }

  if (type === 'initial') {
    return (
      <div className={`transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/5 rounded-2xl mb-6">
            <Search className="w-10 h-10 text-[#339999]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Start Your Search
          </h3>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Search for PPE products, manufacturers, or compliance regulations. Get instant access to certification requirements and market data.
          </p>

          {/* 热门搜索 */}
          <div className="max-w-2xl mx-auto">
            <p className="text-sm font-medium text-gray-500 mb-4">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePopularSearch(item.term)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-[#339999] hover:text-[#339999] transition-all shadow-sm hover:shadow-md"
                >
                  {item.type === 'product' && <Package className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.type === 'company' && <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.type === 'regulation' && <FileQuestion className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.term}
                </button>
              ))}
            </div>
          </div>

          {/* 搜索提示 */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-xl p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Search Tips</h4>
              </div>
              <ul className="space-y-2">
                {SEARCH_TIPS.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                    <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'no-results') {
    return (
      <div className={`transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No results found
          </h3>
          {searchQuery && (
            <p className="text-lg text-gray-600 mb-2">
              for &quot;<span className="font-medium text-[#339999]">{searchQuery}</span>&quot;
            </p>
          )}
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {message || 'Try adjusting your search terms or browse our popular searches below'}
          </p>

          {/* 操作按钮 */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {onReset && (
              <Button
                onClick={onReset}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:border-[#339999] hover:text-[#339999]"
              >
                <X className="w-4 h-4 mr-2" />
                Clear filters
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/search'}
              className="bg-[#339999] hover:bg-[#2a8080] text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              New search
            </Button>
          </div>

          {/* 推荐搜索 */}
          <div className="max-w-2xl mx-auto">
            <p className="text-sm font-medium text-gray-500 mb-4">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePopularSearch(item.term)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-[#339999] hover:text-[#339999] transition-all shadow-sm hover:shadow-md"
                >
                  {item.type === 'product' && <Package className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.type === 'company' && <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.type === 'regulation' && <FileQuestion className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                  {item.term}
                </button>
              ))}
            </div>
          </div>

          {/* 帮助链接 */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <div className="flex justify-center gap-4">
              <a href="/help" className="text-sm text-[#339999] hover:underline">
                Visit Help Center
              </a>
              <span className="text-gray-300">|</span>
              <a href="/api-docs" className="text-sm text-[#339999] hover:underline">
                API Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className={`transition-all duration-500 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-2xl mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {message || 'We encountered an error while searching. Please try again.'}
          </p>
          {onReset && (
            <Button
              onClick={onReset}
              className="bg-[#339999] hover:bg-[#2a8080] text-white"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#339999]/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#339999] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Searching...</p>
        <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
      </div>
    </div>
  )
}

export { EmptyState, LoadingState }
