'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Package, TrendingUp, BarChart3, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getPPEProductsClient, getPPEProductStats, getPPECategories, getPPECountries } from '@/lib/ppe-database-client'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPPECategory, setSelectedPPECategory] = useState<string>('all')
  const [countries, setCountries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  const limit = 20

  // 加载数据
  useEffect(() => {
    loadData()
  }, [page, selectedCountry, selectedCategory, selectedPPECategory])

  async function loadData() {
    setLoading(true)
    
    try {
      // 加载产品列表
      const filters: any = {}
      if (selectedCountry !== 'all') filters.country = selectedCountry
      if (selectedCategory !== 'all') filters.category = selectedCategory
      if (selectedPPECategory !== 'all') filters.ppe_category = selectedPPECategory
      if (searchQuery) filters.search = searchQuery
      
      const result = await getPPEProductsClient({
        page,
        limit,
        filters,
      })
      
      setProducts(result.data)
      setTotal(result.total)
      
      // 加载统计数据
      const statsData = await getPPEProductStats()
      setStats(statsData)
      
      // 加载筛选选项
      const countriesList = await getPPECountries()
      setCountries(countriesList)
      
      const categoriesList = await getPPECategories()
      setCategories(categoriesList)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  // 计算分页
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <Package className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              PPE Product Database
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse and search our comprehensive database of PPE products
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <section className="py-6 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.totalProducts}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.countryCount).length}</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.categoryCount).length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['II'] || 0}</div>
                <div className="text-sm text-gray-600">Class II</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['III'] || 0}</div>
                <div className="text-sm text-gray-600">Class III</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <div className="flex items-center mb-4">
                  <Filter className="w-5 h-5 text-[#339999] mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>

                <div className="space-y-4">
                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value)
                        setPage(1)
                      }}
                      className="w-full rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
                    >
                      <option value="all">All Countries</option>
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setPage(1)
                      }}
                      className="w-full rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PPE Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PPE Class
                    </label>
                    <select
                      value={selectedPPECategory}
                      onChange={(e) => {
                        setSelectedPPECategory(e.target.value)
                        setPage(1)
                      }}
                      className="w-full rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
                    >
                      <option value="all">All Classes</option>
                      <option value="I">Class I</option>
                      <option value="II">Class II</option>
                      <option value="III">Class III</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setSelectedCountry('all')
                      setSelectedCategory('all')
                      setSelectedPPECategory('all')
                      setSearchQuery('')
                      setPage(1)
                    }}
                    className="w-full py-2 px-4 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search products by name, code, or manufacturer..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-[#339999]"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              )}

              {/* Products Grid */}
              {!loading && products.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {startIndex}-{endIndex} of {total} products
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/ppe/products/${product.id}`}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#339999] transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#339999] transition-colors">
                              {product.product_name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {product.product_code}
                            </p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] transition-colors" />
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="w-4 h-4 mr-2" />
                            <span>{product.product_category}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            <span>Class {product.ppe_category}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            <span>{product.manufacturer_country}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {product.manufacturer_name}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              product.registration_status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {product.registration_status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            pageNum === page
                              ? 'bg-[#339999] text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
