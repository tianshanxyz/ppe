'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search,
  Package,
  Building2,
  Globe,
  Shield,
  Filter,
  ChevronDown,
  Star,
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Button, Badge, Card } from '@/components/ui'

// Product data interface
interface Product {
  id: string
  name: string
  company?: string
  companyId?: string
  category?: string
  market?: string
  status?: string
  registrationNumber?: string
  approvalDate?: string
  lastUpdate?: string
  riskLevel?: 'low' | 'medium' | 'high'
  trustScore?: number
}

// Statistics interface
interface ProductStats {
  totalProducts: number
  newThisWeek: number
  highRisk: number
  activeMarkets: number
}

// Filter options
const categories = ['All', 'Cardiovascular', 'Orthopedics', 'Diagnostic Imaging', 'IVD', 'Interventional', 'Surgical']
const markets = ['All', 'FDA', 'EUDAMED', 'NMPA', 'PMDA', 'Health Canada']
const riskLevels = ['All', 'Low', 'Medium', 'High']

export default function ProductsPage() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMarket, setSelectedMarket] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState('All')
  const [sortBy, setSortBy] = useState('trustScore')

  // Data and loading state
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    newThisWeek: 0,
    highRisk: 0,
    activeMarkets: 5
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch product list
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      if (selectedMarket !== 'All') params.append('market', selectedMarket)
      if (selectedRisk !== 'All') params.append('riskLevel', selectedRisk.toLowerCase())
      params.append('type', 'product')
      params.append('limit', '50')

      const response = await fetch(`/api/search?${params.toString()}`)
      const result = await response.json()

      if (result.data && result.data.products) {
        const formattedProducts = result.data.products.map((p: unknown) => ({
          id: p.id,
          name: p.name,
          company: p.company_name || p.company,
          companyId: p.company_id,
          category: p.category || 'Medical Device',
          market: p.market || 'Unknown',
          status: p.status || 'Active',
          registrationNumber: p.registration_number,
          approvalDate: p.approval_date,
          lastUpdate: p.updated_at,
          riskLevel: p.risk_level || 'low',
          trustScore: p.trust_score || 0
        }))
        setProducts(formattedProducts)
      } else {
        setProducts([])
      }

      // Update statistics
      setStats({
        totalProducts: result.meta?.total || 0,
        newThisWeek: result.meta?.newThisWeek || 0,
        highRisk: result.meta?.highRisk || 0,
        activeMarkets: 5
      })
    } catch (err) {
      setError('Failed to load products. Please try again.')
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedMarket, selectedRisk])

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Sort
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'trustScore') return (b.trustScore || 0) - (a.trustScore || 0)
    if (sortBy === 'approvalDate') return new Date(b.approvalDate || 0).getTime() - new Date(a.approvalDate || 0).getTime()
    return a.name.localeCompare(b.name)
  })

  // Get risk level style
  const getRiskStyle = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Search and filter section */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search box */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, companies, or registration numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Market filter */}
            <div className="relative">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {markets.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Risk level filter */}
            <div className="relative">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                {riskLevels.map(r => <option key={r} value={r}>{r} Risk</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none bg-white cursor-pointer"
              >
                <option value="trustScore">Sort by Trust Score</option>
                <option value="approvalDate">Sort by Approval Date</option>
                <option value="name">Sort by Name</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Data overview cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-[#339999]/5 to-transparent border-[#339999]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#339999]/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#339999]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">+{stats.newThisWeek}</p>
                <p className="text-sm text-gray-500">New This Week</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-transparent border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
                <p className="text-sm text-gray-500">High Risk</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-transparent border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMarkets}</p>
                <p className="text-sm text-gray-500">Active Markets</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Product list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#339999]" />
            <span className="ml-3 text-gray-500">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Link href={`/product/${product.id}`}>
                  <Card className="h-full p-5 hover:shadow-lg hover:border-[#339999]/30 transition-all cursor-pointer">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                          {product.name}
                        </h3>
                        {product.company && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{product.company}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category and Market */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="gray" className="text-xs">
                        {product.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {product.market}
                      </Badge>
                    </div>

                    {/* Registration info */}
                    {product.registrationNumber && (
                      <p className="text-xs text-gray-400 mb-3">
                        Reg: {product.registrationNumber}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRiskStyle(product.riskLevel)}`}
                        >
                          {product.riskLevel?.toUpperCase() || 'LOW'} Risk
                        </Badge>
                        {product.trustScore !== undefined && product.trustScore > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Shield className="w-3 h-3 text-[#339999]" />
                            <span>{product.trustScore}</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#339999] transition-colors" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
