'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Send, X, Sparkles, Clock, Trash2, ArrowRight, Package, Building2, FileText, Loader2, Zap, ExternalLink, AlertCircle, ChevronRight } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getTranslations } from '@/lib/i18n/translations'
import { classifySearchQuery, getCategoryLabel, getCategorySearchType, type SearchCategory, type ClassificationResult } from '@/lib/search/classifier'

interface HistoryItem {
  query: string
  category: SearchCategory
  timestamp: number
}

interface TraditionalSearchResult {
  id: string
  name: string
  type: 'product' | 'company' | 'regulation'
  subtitle?: string
  market?: string
}

const HISTORY_KEY = 'mdlooker_smart_search_history'
const MAX_HISTORY = 20

const CATEGORY_CONFIG: Record<SearchCategory, { icon: typeof Package; bgColor: string; textColor: string; borderColor: string; labelKey: string }> = {
  product: {
    icon: Package,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    labelKey: 'categoryProduct',
  },
  company: {
    icon: Building2,
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    labelKey: 'categoryCompany',
  },
  regulation: {
    icon: FileText,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    labelKey: 'categoryRegulation',
  },
  ai: {
    icon: Sparkles,
    bgColor: 'bg-[#339999]/5',
    textColor: 'text-[#339999]',
    borderColor: 'border-[#339999]/20',
    labelKey: 'categoryAi',
  },
}

export function DualModeSearch() {
  const locale = useLocale()
  const ct = getTranslations(
    {
      en: {
        searchPlaceholder: 'Search PPE products, manufacturers, regulations, or ask AI...',
        search: 'Search',
        searchHistory: 'Recent Searches',
        clearHistory: 'Clear All',
        noHistory: 'No search history yet',
        viewAllResults: 'View all results in Data Center',
        noResults: 'No results found',
        noResultsHint: 'Try different keywords or ask AI instead',
        searching: 'Searching...',
        detectedCategory: 'Detected:',
        goToDataCenter: 'Go to Data Center',
        askAiInstead: 'Ask AI instead',
        categoryProduct: 'Product',
        categoryCompany: 'Manufacturer',
        categoryRegulation: 'Regulation',
        categoryAi: 'AI Assistant',
        navigateToDataCenter: 'Navigate to Data Center →',
        openAiChat: 'Open AI Chat →',
        resultsFound: 'results found',
        inCategory: 'in',
      },
      zh: {
        searchPlaceholder: '搜索PPE产品、制造商、法规，或向AI提问...',
        search: '搜索',
        searchHistory: '最近搜索',
        clearHistory: '清除全部',
        noHistory: '暂无搜索历史',
        viewAllResults: '在数据中心查看所有结果',
        noResults: '未找到结果',
        noResultsHint: '请尝试不同的关键词或向AI提问',
        searching: '搜索中...',
        detectedCategory: '识别为：',
        goToDataCenter: '前往数据中心',
        askAiInstead: '改为AI提问',
        categoryProduct: '产品',
        categoryCompany: '企业',
        categoryRegulation: '法规',
        categoryAi: 'AI助手',
        navigateToDataCenter: '前往数据中心 →',
        openAiChat: '打开AI对话 →',
        resultsFound: '条结果',
        inCategory: '',
      },
    },
    locale
  )

  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const [traditionalResults, setTraditionalResults] = useState<TraditionalSearchResult[]>([])
  const [traditionalLoading, setTraditionalLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
        setShowHistory(false)
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addToHistory = useCallback((searchQuery: string, category: SearchCategory) => {
    if (!searchQuery.trim()) return
    const newItem: HistoryItem = { query: searchQuery.trim(), category, timestamp: Date.now() }
    const updated = [newItem, ...history.filter(h => h.query !== searchQuery.trim())].slice(0, MAX_HISTORY)
    setHistory(updated)
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch {}
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
  }, [])

  const updateClassification = useCallback((value: string) => {
    if (value.trim().length > 1) {
      const result = classifySearchQuery(value)
      setClassification(result)
    } else {
      setClassification(null)
    }
  }, [])

  const performTraditionalSearch = useCallback(async (searchQuery: string, category: SearchCategory) => {
    setTraditionalLoading(true)
    setShowResults(true)
    setShowHistory(false)
    setHasSearched(true)
    addToHistory(searchQuery, category)

    try {
      const searchType = getCategorySearchType(category)
      const params = new URLSearchParams({ q: searchQuery.trim(), type: searchType, limit: '8' })
      const res = await fetch(`/api/search?${params.toString()}`)
      const data = await res.json()

      const results: TraditionalSearchResult[] = []

      if (data.data?.products) {
        for (const p of data.data.products.slice(0, 4)) {
          results.push({ id: p.id, name: p.name, type: 'product', subtitle: p.company_name, market: p.market })
        }
      }
      if (data.data?.companies) {
        for (const c of data.data.companies.slice(0, 4)) {
          results.push({ id: c.id, name: c.name, type: 'company', subtitle: c.country })
        }
      }

      if (category === 'regulation') {
        try {
          const regParams = new URLSearchParams({ q: searchQuery.trim(), limit: '4' })
          const regRes = await fetch(`/api/regulations/search?${regParams.toString()}`)
          const regData = await regRes.json()
          const regulations = Array.isArray(regData.data) ? regData.data : (regData.data?.regulations || [])
          for (const r of regulations.slice(0, 4)) {
            results.push({ id: r.id, name: r.title, type: 'regulation', subtitle: r.issuing_authority })
          }
        } catch {}
      }

      setTraditionalResults(results)
    } catch {
      setTraditionalResults([])
    } finally {
      setTraditionalLoading(false)
    }
  }, [addToHistory])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const result = classifySearchQuery(query)
    setClassification(result)

    if (result.category === 'ai') {
      addToHistory(query, 'ai')
      const params = new URLSearchParams({ q: query.trim() })
      window.open(`/ai-chat?${params.toString()}`, '_blank')
    } else {
      performTraditionalSearch(query, result.category)
    }
  }, [query, addToHistory, performTraditionalSearch])

  const handleInputChange = useCallback((value: string) => {
    setQuery(value)
    updateClassification(value)
    setShowResults(false)
    setHasSearched(false)

    if (value.trim().length > 1) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const result = classifySearchQuery(value)
        if (result.category !== 'ai') {
          performTraditionalSearch(value, result.category)
        }
      }, 600)
    }
  }, [updateClassification, performTraditionalSearch])

  const navigateToDataCenter = useCallback(() => {
    if (!query.trim()) return
    const result = classification || classifySearchQuery(query)
    const searchType = getCategorySearchType(result.category)
    const params = new URLSearchParams({ q: query.trim(), type: searchType })
    if (locale !== 'en') params.set('lang', locale)
    window.location.href = `/search?${params.toString()}`
  }, [query, classification, locale])

  const navigateToAiChat = useCallback(() => {
    if (!query.trim()) return
    addToHistory(query, 'ai')
    const params = new URLSearchParams({ q: query.trim() })
    window.open(`/ai-chat?${params.toString()}`, '_blank')
  }, [query, addToHistory])

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setQuery(item.query)
    setShowHistory(false)

    const result = classifySearchQuery(item.query)
    setClassification(result)

    if (item.category === 'ai') {
      addToHistory(item.query, 'ai')
      const params = new URLSearchParams({ q: item.query })
      window.open(`/ai-chat?${params.toString()}`, '_blank')
    } else {
      performTraditionalSearch(item.query, result.category)
    }
  }, [addToHistory, performTraditionalSearch])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4 text-blue-500" />
      case 'company': return <Building2 className="w-4 h-4 text-green-500" />
      case 'regulation': return <FileText className="w-4 h-4 text-amber-500" />
      default: return <Search className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return ct.categoryProduct
      case 'company': return ct.categoryCompany
      case 'regulation': return ct.categoryRegulation
      default: return type
    }
  }

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return locale === 'zh' ? '刚刚' : 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${locale === 'zh' ? '分钟前' : 'min ago'}`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${locale === 'zh' ? '小时前' : 'h ago'}`
    return new Date(ts).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')
  }

  const showDropdown = isFocused && (showHistory || showResults || (traditionalLoading) || (!query.trim() && history.length > 0))

  const activeCategory = classification?.category || null
  const activeConfig = activeCategory ? CATEGORY_CONFIG[activeCategory] : null
  const ActiveIcon = activeConfig?.icon || Search

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative">
      {/* Search Input */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors ${
            activeConfig ? activeConfig.textColor : 'text-gray-400'
          }`}>
            <ActiveIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              if (!query.trim() && history.length > 0) setShowHistory(true)
            }}
            placeholder={ct.searchPlaceholder}
            className={`w-full pl-10 sm:pl-14 pr-24 sm:pr-32 py-3.5 sm:py-5 text-base sm:text-lg bg-white rounded-2xl border-2 shadow-lg transition-all outline-none ${
              activeConfig
                ? `${activeConfig.borderColor} focus:ring-4 focus:ring-current/10`
                : 'border-gray-200 focus:border-[#339999] focus:ring-4 focus:ring-[#339999]/10'
            }`}
            style={activeConfig ? { borderColor: undefined } : undefined}
          />

          {/* Category Badge (appears when typing) */}
          {classification && query.trim().length > 1 && (
            <div className={`absolute right-20 sm:right-28 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium ${activeConfig?.bgColor} ${activeConfig?.textColor} ${activeConfig?.borderColor} border transition-all`}>
              <ActiveIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{getCategoryLabel(classification.category, locale)}</span>
            </div>
          )}

          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setClassification(null)
                  setTraditionalResults([])
                  setShowResults(false)
                  setHasSearched(false)
                  inputRef.current?.focus()
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim()}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 text-white text-sm sm:text-base font-semibold rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                activeCategory === 'ai'
                  ? 'bg-[#339999] hover:bg-[#2d8b8b]'
                  : activeCategory === 'product'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : activeCategory === 'company'
                  ? 'bg-green-600 hover:bg-green-700'
                  : activeCategory === 'regulation'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#339999] hover:bg-[#2d8b8b]'
              }`}
            >
              {activeCategory === 'ai' ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">{ct.openAiChat.replace(' →', '')}</span>
                </span>
              ) : (
                ct.search
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Category Hint (below input) */}
      {classification && query.trim().length > 1 && !showResults && !traditionalLoading && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="text-gray-400">{ct.detectedCategory}</span>
          <span className={`flex items-center gap-1 font-medium ${activeConfig?.textColor}`}>
            <ActiveIcon className="w-3.5 h-3.5" />
            {getCategoryLabel(classification.category, locale)}
          </span>
          {classification.category === 'ai' ? (
            <span className="text-gray-400">· {locale === 'zh' ? '将在新标签页打开AI对话' : 'Will open AI chat in new tab'}</span>
          ) : (
            <span className="text-gray-400">· {locale === 'zh' ? '将导航至数据中心' : 'Will navigate to Data Center'}</span>
          )}
        </div>
      )}

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[500px] overflow-y-auto">
          {/* Search History */}
          {(showHistory || (!hasSearched && !traditionalLoading)) && history.length > 0 && !showResults && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {ct.searchHistory}
                </h4>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {ct.clearHistory}
                </button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 8).map((item, idx) => {
                  const itemConfig = CATEGORY_CONFIG[item.category]
                  const ItemIcon = itemConfig.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleHistorySelect(item)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="flex-shrink-0">
                        <ItemIcon className={`w-4 h-4 ${itemConfig.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.query}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${itemConfig.bgColor} ${itemConfig.textColor}`}>
                          {getCategoryLabel(item.category, locale)}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Loading */}
          {traditionalLoading && (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#339999] mx-auto mb-3" />
              <p className="text-sm text-gray-500">{ct.searching}</p>
              {classification && (
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <ActiveIcon className={`w-3 h-3 ${activeConfig?.textColor}`} />
                  {ct.inCategory} {getCategoryLabel(classification.category, locale)}
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {!traditionalLoading && showResults && traditionalResults.length > 0 && (
            <div>
              <div className={`px-4 py-2.5 ${activeConfig?.bgColor || 'bg-gray-50'} flex items-center justify-between`}>
                <span className={`text-xs font-medium ${activeConfig?.textColor || 'text-gray-500'} uppercase tracking-wider flex items-center gap-1.5`}>
                  <ActiveIcon className="w-3.5 h-3.5" />
                  {traditionalResults.length} {ct.resultsFound} — {getCategoryLabel(classification?.category || 'product', locale)}
                </span>
                <button
                  onClick={navigateToDataCenter}
                  className={`text-xs font-medium ${activeConfig?.textColor || 'text-[#339999]'} flex items-center gap-1 hover:underline`}
                >
                  {ct.viewAllResults}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {traditionalResults.map((result, idx) => (
                <button
                  key={`${result.type}-${result.id}-${idx}`}
                  onClick={() => {
                    const path = result.type === 'product'
                      ? `/products/${result.id}`
                      : result.type === 'company'
                      ? `/companies/${result.id}`
                      : `/regulations/${result.id}`
                    window.location.href = path
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors border-b border-gray-50 last:border-0"
                >
                  {getTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{result.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}

              {/* Action Bar */}
              <div className="border-t border-gray-100 p-3 flex items-center gap-2">
                <button
                  onClick={navigateToDataCenter}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    activeConfig
                      ? `${activeConfig.bgColor} ${activeConfig.textColor} hover:opacity-80`
                      : 'text-[#339999] hover:bg-[#339999]/5'
                  }`}
                >
                  {ct.navigateToDataCenter}
                </button>
                <button
                  onClick={navigateToAiChat}
                  className="flex-1 py-2.5 text-sm text-[#339999] font-medium hover:bg-[#339999]/5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {ct.askAiInstead}
                </button>
              </div>
            </div>
          )}

          {/* No Results */}
          {!traditionalLoading && showResults && traditionalResults.length === 0 && query.trim() && (
            <div className="p-6 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{ct.noResults}</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">{ct.noResultsHint}</p>
              <button
                onClick={navigateToAiChat}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {ct.openAiChat}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DualModeSearch
