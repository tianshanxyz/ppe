'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Package, BarChart3, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Globe, Factory } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEProductsClient, getPPEProductStatsClient, PPEProduct } from '@/lib/ppe-database-client'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

function getRiskLevelStyle(riskLevel: string) {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case '呼吸防护装备':
      return '😷'
    case '手部防护装备':
      return '🧤'
    case '身体防护装备':
      return '🥼'
    case '眼面部防护装备':
      return '🥽'
    case '头部防护装备':
      return '⛑️'
    case '足部防护装备':
      return '👢'
    default:
      return '🔧'
  }
}

const COUNTRY_DISPLAY: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  CN: 'China',
  GB: 'United Kingdom',
  DE: 'Germany',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  AU: 'Australia',
  IN: 'India',
  MY: 'Malaysia',
  TH: 'Thailand',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  SE: 'Sweden',
  MX: 'Mexico',
  ZA: 'South Africa',
  RU: 'Russia',
  SG: 'Singapore',
  ID: 'Indonesia',
  VN: 'Vietnam',
  PH: 'Philippines',
  NZ: 'New Zealand',
  IL: 'Israel',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PL: 'Poland',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  FI: 'Finland',
  NO: 'Norway',
  PT: 'Portugal',
  IE: 'Ireland',
  GR: 'Greece',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  AE: 'UAE',
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
  China: 'China',
  Germany: 'Germany',
  France: 'France',
  Japan: 'Japan',
  'South Korea': 'South Korea',
  India: 'India',
  Brazil: 'Brazil',
  Australia: 'Australia',
  Canada: 'Canada',
  Italy: 'Italy',
  Spain: 'Spain',
  Netherlands: 'Netherlands',
  Sweden: 'Sweden',
  Mexico: 'Mexico',
  Switzerland: 'Switzerland',
  Malaysia: 'Malaysia',
  Thailand: 'Thailand',
  Singapore: 'Singapore',
  Indonesia: 'Indonesia',
  Vietnam: 'Vietnam',
  Russia: 'Russia',
  'South Africa': 'South Africa',
  'New Zealand': 'New Zealand',
  中国: 'China',
  美国: 'United States',
  德国: 'Germany',
  法国: 'France',
  英国: 'United Kingdom',
  日本: 'Japan',
  韩国: 'South Korea',
  印度: 'India',
  巴西: 'Brazil',
  澳大利亚: 'Australia',
  加拿大: 'Canada',
  意大利: 'Italy',
  西班牙: 'Spain',
  荷兰: 'Netherlands',
  瑞典: 'Sweden',
}

function getCountryDisplay(country: string): string {
  return COUNTRY_DISPLAY[country] || country
}

export default function ProductsPage() {
  const [products, setProducts] = useState<PPEProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('')
  const [countries, setCountries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [riskLevels, setRiskLevels] = useState<string[]>([])

  const limit = 20

  // 加载统计数据和筛选选项
  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEProductStatsClient()
        if (mounted) {
          setStats(statsData)
          if (statsData.countryCount) {
            const sortedCountries = Object.keys(statsData.countryCount).sort((a, b) => {
              const nameA = getCountryDisplay(a)
              const nameB = getCountryDisplay(b)
              return nameA.localeCompare(nameB)
            })
            setCountries(sortedCountries)
          }
          if (statsData.categoryCount) {
            setCategories(Object.keys(statsData.categoryCount))
          }
          if (statsData.riskLevelCount) {
            setRiskLevels(Object.keys(statsData.riskLevelCount))
          }
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  // 加载产品数据
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPPEProductsClient({
        page,
        limit,
        filters: {
          search: appliedSearch,
          country: selectedCountry,
          category: selectedCategory,
        },
      })

      setProducts(result.data)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [page, selectedCountry, selectedCategory, appliedSearch])

  // 当筛选条件、分页变化时加载产品数据
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // 处理搜索
  const handleSearch = () => {
    setAppliedSearch(searchQuery)
    setPage(1)
  }

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 计算分页
  const totalPages = Math.ceil(total / limit)
  const startIndex = total > 0 ? (page - 1) * limit + 1 : 0
  const endIndex = Math.min(page * limit, total)

  // 生成分页页码
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Package className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Global PPE Database
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse and search our comprehensive database of {stats?.totalProducts?.toLocaleString() || '...'} PPE products from around the world
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Bar */}
      {stats && (
        <motion.section
          className="py-8 bg-white border-b"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: stats.totalProducts ?? 0, label: 'Total Products', icon: Package },
                { value: Object.keys(stats.countryCount ?? {}).length, label: 'Countries', icon: Globe },
                { value: Object.keys(stats.categoryCount ?? {}).length, label: 'Categories', icon: BarChart3 },
                { value: Object.keys(stats.riskLevelCount ?? {}).length, label: 'Risk Levels', icon: AlertCircle },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-[#339999]" />
                  </div>
                  <div className="text-3xl font-bold text-[#339999] mb-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Content */}
      <motion.section
        className="py-12"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <motion.div className="lg:w-64 flex-shrink-0" variants={fadeInUp}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <Filter className="w-6 h-6 text-[#339999] mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                </div>

                <div className="space-y-6">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Search
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Product name, code..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2.5 bg-[#339999] text-white rounded-xl hover:bg-[#2d8b8b] transition-all duration-300 text-sm font-semibold flex-shrink-0"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">All Countries</option>
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {getCountryDisplay(country)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Risk Level Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Risk Level
                    </label>
                    <select
                      value={selectedRiskLevel}
                      onChange={(e) => {
                        setSelectedRiskLevel(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">All Risk Levels</option>
                      {riskLevels.map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setSelectedCountry('')
                      setSelectedCategory('')
                      setSelectedRiskLevel('')
                      setSearchQuery('')
                      setAppliedSearch('')
                      setPage(1)
                    }}
                    className="w-full py-3 px-4 text-sm font-semibold text-[#339999] hover:text-[#2d8b8b] bg-[#339999]/5 hover:bg-[#339999]/10 rounded-xl transition-all duration-300"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Products List */}
            <motion.div className="flex-1" variants={fadeInUp}>
              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error Loading Products</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={loadProducts}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
                  <p className="mt-6 text-lg text-gray-600 font-medium">Loading products...</p>
                </div>
              )}

              {/* Products Grid */}
              {!loading && products.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      Showing {startIndex}-{endIndex} of {total.toLocaleString()} products
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                                {product.name}
                              </h3>
                              {product.product_code && (
                                <p className="text-sm text-gray-500 mt-1 font-mono truncate">
                                  {product.product_code}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>

                          <div className="space-y-3 mb-6">
                            {product.category && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Package className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{getCategoryIcon(product.category)} {product.category}</span>
                              </div>
                            )}
                            {product.country_of_origin && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{getCountryDisplay(product.country_of_origin)}</span>
                              </div>
                            )}
                            {product.subcategory && (
                              <div className="flex items-center text-sm text-gray-600">
                                <BarChart3 className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="capitalize">{product.subcategory}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 font-medium truncate mr-2">
                                {product.manufacturer_name || 'Unknown Manufacturer'}
                              </span>
                              {product.risk_level && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 border ${getRiskLevelStyle(product.risk_level)}`}>
                                  {product.risk_level}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white shadow-lg'
                              : 'border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {appliedSearch.trim() ? 'No Search Results' : 'No Products Found'}
                  </h3>
                  <p className="text-gray-600">
                    {appliedSearch.trim()
                      ? `No products found for "${appliedSearch}". Try different keywords or adjust filters.`
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
