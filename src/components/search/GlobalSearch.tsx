'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2, Sparkles, ArrowRight, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  query: string
  answer: string
  suggestions: string[]
  relatedTopics: string[]
  confidence: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 加载最近搜索
  useEffect(() => {
    const stored = localStorage.getItem('recent_searches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])

  // 保存搜索记录
  const saveSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent_searches', JSON.stringify(updated))
  }

  // 执行AI搜索
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setShowResults(true)
    saveSearch(query)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Search error:', error)
      setResult({
        query,
        answer: 'Sorry, the search service is temporarily unavailable. Please try again later or use the navigation menu to find what you need.',
        suggestions: ['Try searching for "CE certification"', 'Search for "safety gloves"', 'Look up "FDA registration"'],
        relatedTopics: [],
        confidence: 'low',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理回车键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 快速导航到相关页面
  const handleQuickAction = (path: string) => {
    router.push(path)
    setShowResults(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* 搜索框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about PPE compliance, products, or regulations..."
          className="block w-full pl-12 pr-24 py-4 border-2 border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 transition-all text-base"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResult(null)
                inputRef.current?.focus()
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="ml-2 px-4 py-2 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 搜索结果面板 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#339999] mx-auto mb-4" />
              <p className="text-gray-600">AI is analyzing your question...</p>
            </div>
          ) : result ? (
            <div className="p-6">
              {/* 答案区域 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-[#339999]" />
                  <h3 className="font-semibold text-gray-900">AI Answer</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.confidence === 'high' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {result.confidence} confidence
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result.answer}
                </div>
              </div>

              {/* 建议操作 */}
              {result.suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Suggested Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(suggestion)
                          handleSearch()
                        }}
                        className="px-3 py-2 bg-[#339999]/5 text-[#339999] rounded-lg text-sm hover:bg-[#339999]/10 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 快速导航 */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Quick Navigation</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickAction('/market-access')}
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <ArrowRight className="h-4 w-4 text-[#339999]" />
                    <span className="text-sm text-gray-700">Compliance Check</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction('/products')}
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <ArrowRight className="h-4 w-4 text-[#339999]" />
                    <span className="text-sm text-gray-700">Product Database</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction('/certification-comparison')}
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <ArrowRight className="h-4 w-4 text-[#339999]" />
                    <span className="text-sm text-gray-700">Market Comparison</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 最近搜索 */}
      {!showResults && recentSearches.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Recent:</span>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(search)
                handleSearch()
              }}
              className="text-sm text-[#339999] hover:text-[#2d8b8b] underline"
            >
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
