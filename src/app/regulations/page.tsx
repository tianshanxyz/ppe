'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Filter, BookOpen, ExternalLink, Globe, Scale, FileText, CheckCircle, ChevronDown, ChevronUp, X, Eye } from 'lucide-react'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

interface Regulation {
  id: string
  category_id: string
  market_code: string
  title: string
  title_zh?: string
  regulation_number: string
  document_type: string
  issuing_authority: string
  effective_date: string
  status: string
  summary: string
  summary_zh?: string
  full_text: string
}

export default function RegulationsPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInFulltext, setSearchInFulltext] = useState(false)
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null)
  const [showModal, setShowModal] = useState(false)

  const searchRegulations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '12',
        fulltext: searchInFulltext.toString(),
        ...(selectedMarket !== 'all' ? { market: selectedMarket } : {}),
        ...(selectedCategory !== 'all' ? { category: selectedCategory } : {}),
        ...(selectedType !== 'all' ? { type: selectedType } : {}),
      })

      const response = await fetch(`/api/regulations/search?${params}`)
      const result = await response.json()

      if (result.success) {
        setRegulations(result.data)
        setTotalPages(result.pagination.totalPages)
        setTotalCount(result.pagination.total)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page, selectedMarket, selectedCategory, selectedType, searchInFulltext])

  useEffect(() => {
    const debounceTimer = setTimeout(searchRegulations, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchRegulations])

  const openRegulationDetail = (reg: Regulation) => {
    setSelectedRegulation(reg)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRegulation(null)
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'regulation': 'Regulation',
      'standard': 'Standard',
      'guidance': 'Guidance',
      'directive': 'Directive'
    }
    return labels[type] || type
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'regulation': 'bg-red-100 text-red-700',
      'standard': 'bg-blue-100 text-blue-700',
      'guidance': 'bg-green-100 text-green-700',
      'directive': 'bg-purple-100 text-purple-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.name : categoryId
  }

  const getMarketInfo = (marketCode: string) => {
    return markets.find(m => m.code === marketCode)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <BookOpen className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              PPE Regulation Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive database of global PPE regulations, standards, and compliance requirements with full-text search
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#339999] mb-1">{totalCount}</div>
              <div className="text-gray-600 text-sm">Total Regulations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#339999] mb-1">{markets.length}</div>
              <div className="text-gray-600 text-sm">Markets Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#339999] mb-1">{categories.length}</div>
              <div className="text-gray-600 text-sm">Product Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#339999] mb-1">4</div>
              <div className="text-gray-600 text-sm">Document Types</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search regulations by title, number, authority, or keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                />
              </div>
            </div>

            {/* Full-text search toggle */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="fulltext-search"
                checked={searchInFulltext}
                onChange={(e) => {
                  setSearchInFulltext(e.target.checked)
                  setPage(1)
                }}
                className="w-4 h-4 text-[#339999] rounded focus:ring-[#339999]"
              />
              <label htmlFor="fulltext-search" className="text-sm text-gray-700 cursor-pointer">
                Search in full regulation text (includes all articles, requirements, and technical details)
              </label>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                <select
                  value={selectedMarket}
                  onChange={(e) => {
                    setSelectedMarket(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999]"
                >
                  <option value="all">All Markets</option>
                  {markets.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.flag_emoji} {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999]"
                >
                  <option value="all">All Types</option>
                  <option value="regulation">Regulation</option>
                  <option value="standard">Standard</option>
                  <option value="guidance">Guidance</option>
                  <option value="directive">Directive</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedMarket('all')
                    setSelectedType('all')
                    setSearchQuery('')
                    setSearchInFulltext(false)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory !== 'all' || selectedMarket !== 'all' || selectedType !== 'all' || searchQuery) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    {categories.find(c => c.id === selectedCategory)?.icon} {getCategoryName(selectedCategory)}
                    <button onClick={() => setSelectedCategory('all')} className="ml-2 hover:text-[#339999]">×</button>
                  </span>
                )}
                {selectedMarket !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    {getMarketInfo(selectedMarket)?.flag_emoji} {getMarketInfo(selectedMarket)?.name}
                    <button onClick={() => setSelectedMarket('all')} className="ml-2 hover:text-[#339999]">×</button>
                  </span>
                )}
                {selectedType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    {getDocumentTypeLabel(selectedType)}
                    <button onClick={() => setSelectedType('all')} className="ml-2 hover:text-[#339999]">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="ml-2 hover:text-[#339999]">×</button>
                  </span>
                )}
                {searchInFulltext && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                    Full-text search enabled
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Searching...' : `${totalCount} Regulation${totalCount !== 1 ? 's' : ''} Found`}
            </h2>
            {totalPages > 1 && (
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
              <p className="mt-4 text-gray-600">Searching regulations...</p>
            </div>
          ) : regulations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No regulations found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedMarket('all')
                  setSelectedType('all')
                  setSearchQuery('')
                  setSearchInFulltext(false)
                  setPage(1)
                }}
                className="px-6 py-3 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {regulations.map((reg) => (
                <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 p-5 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getDocumentTypeColor(reg.document_type)}`}>
                            {getDocumentTypeLabel(reg.document_type)}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {reg.market_code}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            {reg.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {reg.title}
                        </h3>
                        {reg.title_zh && (
                          <p className="text-sm text-gray-600">{reg.title_zh}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-[#339999]" />
                      <span className="font-medium">{reg.regulation_number}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 text-[#339999]" />
                      <span>{reg.issuing_authority}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Scale className="w-4 h-4 text-[#339999]" />
                      <span>{getCategoryName(reg.category_id)}</span>
                    </div>

                    <p className="text-gray-700 text-sm line-clamp-3">
                      {reg.summary}
                    </p>

                    <div className="pt-3 border-t flex gap-2">
                      <button
                        onClick={() => openRegulationDetail(reg)}
                        className="flex-1 py-2.5 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Text
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pageNum
                        ? 'bg-[#339999] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Regulation Detail Modal */}
      {showModal && selectedRegulation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getDocumentTypeColor(selectedRegulation.document_type)}`}>
                      {getDocumentTypeLabel(selectedRegulation.document_type)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {selectedRegulation.market_code}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      {selectedRegulation.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedRegulation.title}</h3>
                  {selectedRegulation.title_zh && (
                    <p className="text-sm text-gray-600 mt-1">{selectedRegulation.title_zh}</p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Regulation Number</div>
                    <div className="font-semibold text-gray-900">{selectedRegulation.regulation_number}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Issuing Authority</div>
                    <div className="font-semibold text-gray-900">{selectedRegulation.issuing_authority}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Effective Date</div>
                    <div className="font-semibold text-gray-900">{selectedRegulation.effective_date}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Category</div>
                    <div className="font-semibold text-gray-900">{getCategoryName(selectedRegulation.category_id)}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700">{selectedRegulation.summary}</p>
                  {selectedRegulation.summary_zh && (
                    <p className="text-gray-700 mt-2">{selectedRegulation.summary_zh}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Full Text</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedRegulation.full_text}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
