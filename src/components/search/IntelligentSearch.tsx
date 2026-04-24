'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, TrendingUp, Loader2, Package, Building2, FileText, Sparkles } from 'lucide-react'
import { intelligentSearch, getSearchSuggestions, getTrendingSearches, SearchResult, SearchSuggestion } from '@/lib/search-service'
import { useDebounce } from '@/hooks/useDebounce'

interface IntelligentSearchProps {
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export function IntelligentSearch({ 
  onResultSelect, 
  placeholder = 'Search products, manufacturers, regulations...',
  className = ''
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [trending, setTrending] = useState<SearchSuggestion[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  // 加载热门搜索
  useEffect(() => {
    getTrendingSearches(5).then(setTrending)
  }, [])

  // 实时搜索建议
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      getSearchSuggestions(debouncedQuery, 5).then(setSuggestions)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const searchResults = await intelligentSearch(searchQuery, { limit: 10 })
      setResults(searchResults.results)
      
      // 如果没有结果但有建议，显示建议
      if (searchResults.results.length === 0 && searchResults.suggestions.length > 0) {
        setSuggestions(searchResults.suggestions)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
    setShowDropdown(true)
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.keyword)
    performSearch(suggestion.keyword)
  }

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result)
    setShowDropdown(false)
    
    // 根据类型导航
    switch (result.type) {
      case 'product':
        window.location.href = `/ppe/products/${result.id}`
        break
      case 'manufacturer':
        window.location.href = `/ppe/manufacturers/${result.id}`
        break
      case 'regulation':
        window.location.href = `/ppe/regulations/${result.id}`
        break
    }
  }

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 获取图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-blue-500" />
      case 'manufacturer':
        return <Building2 className="w-4 h-4 text-green-500" />
      case 'regulation':
        return <FileText className="w-4 h-4 text-amber-500" />
      default:
        return <Sparkles className="w-4 h-4 text-gray-400" />
    }
  }

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Product'
      case 'manufacturer':
        return 'Manufacturer'
      case 'regulation':
        return 'Regulation'
      default:
        return type
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#339999] focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
                setHasSearched(false)
                inputRef.current?.focus()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* 下拉框 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[500px] overflow-y-auto">
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#339999]" />
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          )}

          {/* 搜索结果 */}
          {!isLoading && hasSearched && results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Search Results ({results.length})
              </div>
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                >
                  <div className="mt-0.5">{getTypeIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {result.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-500 mt-0.5">{result.subtitle}</p>
                    )}
                    {result.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{result.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 无结果但有建议 */}
          {!isLoading && hasSearched && results.length === 0 && suggestions.length > 0 && (
            <div className="py-4">
              <div className="px-4 py-2 text-sm text-gray-500">
                No exact matches found. Did you mean:
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{suggestion.keyword}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {suggestion.searchCount} searches
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 无结果无建议 */}
          {!isLoading && hasSearched && results.length === 0 && suggestions.length === 0 && (
            <div className="py-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or check your spelling</p>
            </div>
          )}

          {/* 实时建议 */}
          {!isLoading && !hasSearched && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{suggestion.keyword}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full ml-2">
                    {suggestion.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 热门搜索 */}
          {!isLoading && !hasSearched && suggestions.length === 0 && trending.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Searches
              </div>
              {trending.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-gray-400">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{item.keyword}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full ml-2">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
