'use client'

import { useState, useEffect } from 'react'
import { Search, Building, Globe, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEManufacturersClient } from '@/lib/ppe-database-client'

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

// Error Boundary Component
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message || 'Failed to load manufacturers page'}</p>
        <button
          onClick={resetError}
          className="px-6 py-2.5 bg-[#339999] text-white rounded-xl font-medium hover:bg-[#2d8b8b] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [availableCountries, setAvailableCountries] = useState<string[]>([])

  const limit = 20

  useEffect(() => {
    loadManufacturers()
  }, [page, selectedCountry, activeSearchQuery, searchTrigger])

  // 加载国家列表
  useEffect(() => {
    loadCountries()
  }, [])

  async function loadCountries() {
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data, error } = await supabase
        .from('ppe_manufacturers')
        .select('country')
      
      if (!error && data) {
        const countries = new Set<string>()
        data.forEach((m: any) => {
          if (m.country) {
            countries.add(m.country)
          }
        })
        setAvailableCountries(Array.from(countries).sort())
      }
    } catch (err) {
      console.error('Failed to load countries:', err)
    }
  }

  async function loadManufacturers() {
    console.log('loadManufacturers called, activeSearchQuery:', activeSearchQuery)
    setLoading(true)
    setError(null)
    try {
      const result = await getPPEManufacturersClient({
        page,
        limit,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
        search: activeSearchQuery || undefined,
      })
      console.log('Manufacturers loaded:', result.total, result.data?.length)
      setManufacturers(result.data || [])
      setTotal(result.total || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load manufacturers'
      console.error('Failed to load manufacturers:', err)
      setError(new Error(errorMessage))
      setManufacturers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = () => {
    console.log('Manufacturer handleSearch called with:', searchQuery)
    setPage(1)
    setActiveSearchQuery(searchQuery)
    setSearchTrigger(prev => prev + 1)
  }

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit + 1
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

  if (error) {
    return <ErrorFallback error={error} resetError={() => { setError(null); loadManufacturers() }} />
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
                <Building className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              PPE Manufacturers Directory
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse verified PPE manufacturers from around the world
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters */}
      <motion.section 
        className="py-8 bg-white border-b"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="flex flex-col sm:flex-row items-center justify-between gap-4" variants={fadeInUp}>
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Search manufacturers..."
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700">
                Country:
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              >
                <option value="all">All Countries</option>
                {availableCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="text-sm font-medium text-gray-600 bg-[#339999]/5 px-4 py-2 rounded-xl">
              {total} manufacturers found
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.section 
        className="py-12"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <motion.div className="text-center py-20" variants={fadeInUp}>
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
              <p className="mt-6 text-lg text-gray-600 font-medium">Loading manufacturers...</p>
            </motion.div>
          )}

          {!loading && manufacturers.length === 0 && (
            <motion.div className="text-center py-20 bg-white rounded-2xl border border-gray-100" variants={fadeInUp}>
              <Building className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No manufacturers found
              </h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </motion.div>
          )}

          {!loading && manufacturers.length > 0 && (
            <>
              {/* Results count */}
              <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600 font-medium">
                  Showing {startIndex}-{endIndex} of {total} manufacturers
                </p>
              </div>

              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {manufacturers.map((manufacturer, index) => (
                  <div key={manufacturer.id}>
                    <Link
                      href={`/manufacturers/${manufacturer.id}`}
                      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                            {manufacturer.name}
                          </h3>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </div>

                      <div className="space-y-3 mb-6">
                        {manufacturer.country && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                            <span>{manufacturer.country}</span>
                          </div>
                        )}
                        {manufacturer.website && (
                          <div className="flex items-center text-sm text-[#339999]">
                            <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate hover:underline">{manufacturer.website}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-500 group-hover:text-[#339999] transition-colors">
                          View Details
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  className="mt-10 flex items-center justify-center gap-2"
                  variants={fadeInUp}
                >
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
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.section>
    </div>
  )
}
