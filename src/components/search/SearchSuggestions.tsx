'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react'

interface SearchSuggestion {
  id: string
  text: string
  type: 'history' | 'trending' | 'product' | 'company' | 'regulation'
  icon?: string
}

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: string) => void
  onClose: () => void
  visible: boolean
}

// 热门搜索
const TRENDING_SEARCHES: SearchSuggestion[] = [
  { id: '1', text: 'N95 mask FDA approved', type: 'trending' },
  { id: '2', text: '3M respirator CE marking', type: 'trending' },
  { id: '3', text: 'surgical gown EN 13795', type: 'trending' },
  { id: '4', text: 'nitrile gloves powder-free', type: 'trending' },
  { id: '5', text: 'face shield medical grade', type: 'trending' },
]

// 产品建议
const PRODUCT_SUGGESTIONS: SearchSuggestion[] = [
  { id: 'p1', text: 'N95 respirator', type: 'product', icon: '😷' },
  { id: 'p2', text: 'surgical mask', type: 'product', icon: '😷' },
  { id: 'p3', text: 'protective gown', type: 'product', icon: '👕' },
  { id: 'p4', text: 'nitrile gloves', type: 'product', icon: '🧤' },
  { id: 'p5', text: 'face shield', type: 'product', icon: '🛡️' },
  { id: 'p6', text: 'safety goggles', type: 'product', icon: '🥽' },
]

// 公司建议
const COMPANY_SUGGESTIONS: SearchSuggestion[] = [
  { id: 'c1', text: '3M', type: 'company', icon: '🏢' },
  { id: 'c2', text: 'Honeywell', type: 'company', icon: '🏢' },
  { id: 'c3', text: 'Medline', type: 'company', icon: '🏢' },
  { id: 'c4', text: 'Cardinal Health', type: 'company', icon: '🏢' },
  { id: 'c5', text: 'Ansell', type: 'company', icon: '🏢' },
]

// 法规建议
const REGULATION_SUGGESTIONS: SearchSuggestion[] = [
  { id: 'r1', text: 'CE marking PPE', type: 'regulation', icon: '📋' },
  { id: 'r2', text: 'FDA 510(k)', type: 'regulation', icon: '📋' },
  { id: 'r3', text: 'NMPA registration', type: 'regulation', icon: '📋' },
  { id: 'r4', text: 'EN 149 standard', type: 'regulation', icon: '📋' },
  { id: 'r5', text: 'ASTM F2100', type: 'regulation', icon: '📋' },
]

export default function SearchSuggestions({ query, onSelect, onClose, visible }: SearchSuggestionsProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // 从localStorage加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // 根据输入过滤建议
  useEffect(() => {
    if (!query.trim()) {
      setFilteredSuggestions([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const allSuggestions = [...PRODUCT_SUGGESTIONS, ...COMPANY_SUGGESTIONS, ...REGULATION_SUGGESTIONS]
    
    const filtered = allSuggestions.filter(s => 
      s.text.toLowerCase().includes(lowerQuery)
    ).slice(0, 8)

    setFilteredSuggestions(filtered)
  }, [query])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  // 保存搜索历史
  const saveToHistory = (term: string) => {
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  const handleSelect = (suggestion: SearchSuggestion) => {
    saveToHistory(suggestion.text)
    onSelect(suggestion.text)
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  const removeFromHistory = (term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newHistory = searchHistory.filter(h => h !== term)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  if (!visible) return null

  // 如果有输入，显示过滤后的建议
  if (query.trim()) {
    return (
      <div
        ref={containerRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
      >
        {filteredSuggestions.length > 0 ? (
          <>
            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              Suggestions
            </div>
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1">
                  <span className="text-gray-900">{suggestion.text}</span>
                  <span className="ml-2 text-xs text-gray-400 capitalize">{suggestion.type}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No suggestions found</p>
            <p className="text-sm">Press Enter to search for &quot;{query}&quot;</p>
          </div>
        )}
      </div>
    )
  }

  // 没有输入时显示历史和热门
  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
    >
      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <>
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Recent Searches</span>
            <button
              onClick={clearHistory}
              className="text-xs text-[#339999] hover:underline"
            >
              Clear
            </button>
          </div>
          {searchHistory.slice(0, 5).map((term, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(term)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-gray-700">{term}</span>
              <button
                onClick={(e) => removeFromHistory(term, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </button>
          ))}
        </>
      )}

      {/* 热门搜索 */}
      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
        Trending Searches
      </div>
      {TRENDING_SEARCHES.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => handleSelect(suggestion)}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
        >
          <TrendingUp className="w-4 h-4 text-[#339999]" />
          <span className="text-gray-700">{suggestion.text}</span>
        </button>
      ))}

      {/* 快速分类 */}
      <div className="border-t border-gray-100">
        <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
          Popular Categories
        </div>
        <div className="p-4 grid grid-cols-3 gap-2">
          {['Products', 'Companies', 'Regulations'].map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat.toLowerCase())}
              className="px-3 py-2 bg-gray-100 hover:bg-[#339999]/10 hover:text-[#339999] rounded-lg text-sm text-gray-700 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
