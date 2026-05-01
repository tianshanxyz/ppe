'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Filter, Package, BarChart3, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEProductsClient, getPPEProductStats, getPPECategories, getPPECountries } from '@/lib/ppe-database-client'

// Default translations to avoid SSR/hydration issues
const t = {
  ppeProductDatabase: 'PPE Product Database',
  browseSearchComprehensive: 'Browse and search our comprehensive database of PPE products',
  totalProducts: 'Total Products',
  countries: 'Countries',
  categories: 'Categories',
  filters: 'Filters',
  country: 'Country',
  allCountries: 'All Countries',
  category: 'Category',
  allCategories: 'All Categories',
  resetFilters: 'Reset Filters',
  searchProducts: 'Search products by name, code, or manufacturer...',
  search: 'Search',
  searching: 'Searching...',
  errorLoadingProducts: 'Error Loading Products',
  tryAgain: 'Try Again',
  loadingProducts: 'Loading products...',
  showing: 'Showing',
  of: 'of',
  products: 'products',
  previous: 'Previous',
  next: 'Next',
  noProductsFound: 'No products found',
  noSearchResults: 'No search results',
  tryAdjustingSearch: 'Try adjusting your search or filters',
}

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

// 风险等级颜色映射
function getRiskLevelStyle(riskLevel: string) {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'low':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Client-side filter function for robust search
function filterProductsClientSide(
  products: any[],
  searchQuery: string,
  selectedCountry: string,
  selectedCategory: string
): any[] {
  return products.filter((product) => {
    const matchesSearch = !searchQuery.trim() || (
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.product_name && product.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.product_code && product.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.manufacturer_name && product.manufacturer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.product_category && product.product_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const matchesCountry = selectedCountry === 'all' ||
      product.country_of_origin === selectedCountry ||
      product.manufacturer_country === selectedCountry

    const matchesCategory = selectedCategory === 'all' ||
      product.product_category === selectedCategory ||
      product.category === selectedCategory

    return matchesSearch && matchesCountry && matchesCategory
  })
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [countries, setCountries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // All loaded products for client-side filtering
  const [allProducts, setAllProducts] = useState<any[]>([])

  const limit = 20

  // 加载筛选选项（只在组件挂载时加载一次）
  useEffect(() => {
    let mounted = true
    async function loadFilterOptions() {
      try {
        const [countriesList, categoriesList] = await Promise.all([
          getPPECountries(),
          getPPECategories()
        ])
        if (mounted) {
          setCountries(countriesList)
          setCategories(categoriesList)
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    loadFilterOptions()
    return () => { mounted = false }
  }, [])

  // 加载产品数据 - simplified, robust version
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Load all products without search filter first, then filter client-side
      const filters: any = {}
      if (selectedCountry !== 'all') filters.country = selectedCountry
      if (selectedCategory !== 'all') filters.category = selectedCategory

      const result = await getPPEProductsClient({
        page: 1,
        limit: 1000, // Load more for client-side filtering
        filters,
      })

      const loaded = result.data || []
      setAllProducts(loaded)

      // Apply client-side search if needed
      let filtered = loaded
      if (searchQuery.trim()) {
        filtered = filterProductsClientSide(loaded, searchQuery, selectedCountry, selectedCategory)
      }

      // Paginate
      const from = (page - 1) * limit
      const paginated = filtered.slice(from, from + limit)

      setProducts(paginated)
      setTotal(filtered.length)

      // 加载统计数据
      try {
        const statsData = await getPPEProductStats()
        setStats(statsData)
      } catch (statsErr) {
        console.error('Failed to load stats (non-critical):', statsErr)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
      setProducts([])
      setTotal(0)
      setError('Failed to load products. The database may be temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [page, selectedCountry, selectedCategory, searchQuery, limit])

  // 当筛选条件、分页变化时加载产品数据
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // 处理搜索
  const handleSearch = () => {
    setPage(1)
    // Trigger reload which will apply search
    loadProducts()
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

  // 生成分页页码（最多显示5页）
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
              {t.ppeProductDatabase}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.browseSearchComprehensive}
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
                { value: stats.totalProducts ?? 0, label: t.totalProducts },
                { value: Object.keys(stats.countryCount ?? {}).length, label: t.countries },
                { value: Object.keys(stats.categoryCount ?? {}).length, label: t.categories },
                { value: Object.keys(stats.riskLevelCount ?? {}).length, label: 'Risk Levels' },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="text-4xl font-bold text-[#339999] mb-1">{stat.value}</div>
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
                  <h2 className="text-xl font-bold text-gray-900">{t.filters}</h2>
                </div>

                <div className="space-y-6">
                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.country}
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="all">{t.allCountries}</option>
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.category}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="all">{t.allCategories}</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setSelectedCountry('all')
                      setSelectedCategory('all')
                      setSearchQuery('')
                      setPage(1)
                    }}
                    className="w-full py-3 px-4 text-sm font-semibold text-[#339999] hover:text-[#2d8b8b] bg-[#339999]/5 hover:bg-[#339999]/10 rounded-xl transition-all duration-300"
                  >
                    {t.resetFilters}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Products List */}
            <motion.div className="flex-1" variants={fadeInUp}>
              {/* Search Bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t.searchProducts}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.searching : t.search}
                  </button>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">{t.errorLoadingProducts}</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={loadProducts}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    {t.tryAgain}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
                  <p className="mt-6 text-lg text-gray-600 font-medium">{t.loadingProducts}</p>
                </div>
              )}

              {/* Products Grid */}
              {!loading && products.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      {t.showing} {startIndex}-{endIndex} {t.of} {total} {t.products}
                    </p>
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {products.map((product) => (
                      <div key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                                {product.name || product.product_name}
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
                            {(product.product_category || product.category) && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Package className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{product.product_category || product.category}</span>
                              </div>
                            )}
                            {(product.country_of_origin || product.manufacturer_country) && (
                              <div className="flex items-center text-sm text-gray-600">
                                <BarChart3 className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{product.country_of_origin || product.manufacturer_country}</span>
                              </div>
                            )}
                            {product.risk_level && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Shield className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="capitalize">{product.risk_level} Risk</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 font-medium truncate mr-2">
                                {product.manufacturer_name}
                              </span>
                              {product.risk_level && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getRiskLevelStyle(product.risk_level)}`}>
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
                    <div
                      className="mt-10 flex items-center justify-center gap-2"
                    >
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t.previous}
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
                        {t.next}
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
                    {searchQuery.trim() ? t.noSearchResults : t.noProductsFound}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery.trim()
                      ? `No products found for "${searchQuery}". Try different keywords or adjust filters.`
                      : t.tryAdjustingSearch
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
