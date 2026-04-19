'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, BookOpen, ExternalLink, Globe, Shield, FileText, CheckCircle } from 'lucide-react'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'

export default function RegulationsPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 获取所有合规数据
  const allComplianceData = useMemo(() => {
    const data = []
    for (const category of categories) {
      for (const market of markets) {
        const compliance = getComplianceData(category.id, market.code)
        if (compliance) {
          data.push({
            category,
            market,
            compliance
          })
        }
      }
    }
    return data
  }, [categories, markets])

  // 筛选数据
  const filteredData = useMemo(() => {
    return allComplianceData.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category.id === selectedCategory
      const matchMarket = selectedMarket === 'all' || item.market.code === selectedMarket
      
      const matchSearch = searchQuery === '' || 
        item.compliance.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.compliance.standards.some(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        item.compliance.certification_requirements.some(r => 
          r.toLowerCase().includes(searchQuery.toLowerCase())
        )
      
      return matchCategory && matchMarket && matchSearch
    })
  }, [allComplianceData, selectedCategory, selectedMarket, searchQuery])

  // 统计数据
  const stats = useMemo(() => {
    const categoryCount = new Set(filteredData.map(d => d.category.id)).size
    const marketCount = new Set(filteredData.map(d => d.market.code)).size
    const standardCount = filteredData.reduce((sum, d) => sum + d.compliance.standards.length, 0)
    
    return { categoryCount, marketCount, standardCount }
  }, [filteredData])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <BookOpen className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              PPE Regulation Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive database of global PPE regulations, standards, and compliance requirements
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#339999] mb-2">
                {stats.categoryCount}
              </div>
              <div className="text-gray-600">Product Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#339999] mb-2">
                {stats.marketCount}
              </div>
              <div className="text-gray-600">Target Markets</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#339999] mb-2">
                {stats.standardCount}
              </div>
              <div className="text-gray-600">Standards & Regulations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search standards, regulations, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Filter */}
              <div>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                >
                  <option value="all">All Markets</option>
                  {markets.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.flag_emoji} {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory !== 'all' || selectedMarket !== 'all' || searchQuery) && (
              <div className="mt-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 hover:text-[#339999]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedMarket !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    {markets.find(m => m.code === selectedMarket)?.flag_emoji} {markets.find(m => m.code === selectedMarket)?.name}
                    <button
                      onClick={() => setSelectedMarket('all')}
                      className="ml-2 hover:text-[#339999]"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#339999]/10 text-[#339999]">
                    &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-[#339999]"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedMarket('all')
                    setSearchQuery('')
                  }}
                  className="text-sm text-[#339999] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredData.length} Regulation{filteredData.length !== 1 ? 's' : ''} Found
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{item.category.icon}</span>
                        <span className="text-3xl">{item.market.flag_emoji}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.category.name}
                      </h3>
                      <p className="text-gray-600">
                        {item.market.name} • {item.market.regulation_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-6">
                  {/* Classification */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-[#339999]" />
                      <h4 className="font-semibold text-gray-900">Classification</h4>
                    </div>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                      {item.compliance.classification}
                    </p>
                  </div>

                  {/* Standards */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-[#339999]" />
                      <h4 className="font-semibold text-gray-900">Applicable Standards</h4>
                    </div>
                    <div className="space-y-3">
                      {item.compliance.standards.map((standard, sIdx) => (
                        <div key={sIdx} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <a
                                href={standard.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#339999] font-semibold hover:underline flex items-center gap-2"
                              >
                                {standard.name}
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <p className="text-gray-600 text-sm mt-1">
                                {standard.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certification Requirements */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-[#339999]" />
                      <h4 className="font-semibold text-gray-900">Certification Requirements</h4>
                    </div>
                    <ul className="space-y-2">
                      {item.compliance.certification_requirements.map((req, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-[#339999]">
                        ${item.compliance.estimated_cost.min.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Starting Cost</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-[#339999]">
                        {item.compliance.estimated_timeline.min}-{item.compliance.estimated_timeline.max}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{item.compliance.estimated_timeline.unit}</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full py-3 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors">
                    View Full Compliance Report
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredData.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No regulations found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedMarket('all')
                  setSearchQuery('')
                }}
                className="px-6 py-3 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
