'use client'

import { useState, useEffect, useCallback } from 'react'
import { Scale, Search, Filter, Globe, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPERegulations, getPPEStats, PPERegulation } from '@/lib/ppe-api-client'

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

const regionNames: Record<string, string> = {
  'EU': 'European Union',
  'US': 'United States',
  'CN': 'China',
  'GB': 'United Kingdom',
  'JP': 'Japan',
  'KR': 'South Korea',
  'BR': 'Brazil',
  'AU': 'Australia',
  'IN': 'India',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'CA': 'Canada',
  'Global': 'Global',
}

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<PPERegulation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [regions, setRegions] = useState<string[]>([])

  const limit = 20

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEStats()
        if (mounted) {
          setStats(statsData.data)
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  const loadRegulations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPPERegulations({
        page,
        limit,
        search: appliedSearch,
        region: selectedRegion,
      })

      setRegulations(result.data)
      setTotal(result.meta.total)

      // Extract regions from data
      if (result.data.length > 0) {
        const uniqueRegions = [...new Set(result.data.map(r => r.region).filter(Boolean))]
        setRegions(uniqueRegions)
      }
    } catch (err) {
      console.error('Failed to load regulations:', err)
      setError('Failed to load regulations. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [page, selectedRegion, appliedSearch])

  useEffect(() => {
    loadRegulations()
  }, [loadRegulations])

  const handleSearch = () => {
    setAppliedSearch(searchQuery)
    setPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const totalPages = Math.ceil(total / limit)
  const startIndex = total > 0 ? (page - 1) * limit + 1 : 0
  const endIndex = Math.min(page * limit, total)

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
                <Scale className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Global PPE Regulations
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access {stats?.overview?.totalRegulations?.toLocaleString() || '...'} PPE regulations and standards from around the world
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
                { value: stats.overview?.totalRegulations ?? 0, label: 'Total Regulations', icon: Scale },
                { value: stats.overview?.totalProducts ?? 0, label: 'Products', icon: BookOpen },
                { value: stats.overview?.totalManufacturers ?? 0, label: 'Manufacturers', icon: Globe },
                { value: Object.keys(stats.distributions?.country ?? {}).length, label: 'Countries', icon: Globe },
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
                          placeholder="Regulation name, code..."
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Region
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">All Regions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>
                          {regionNames[region] || region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRegion('')
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

            {/* Regulations List */}
            <motion.div className="flex-1" variants={fadeInUp}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error Loading Regulations</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={loadRegulations}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
                  <p className="mt-6 text-lg text-gray-600 font-medium">Loading regulations...</p>
                </div>
              )}

              {!loading && regulations.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      Showing {startIndex}-{endIndex} of {total.toLocaleString()} regulations
                    </p>
                  </div>

                  <div className="space-y-4">
                    {regulations.map((reg) => (
                      <div key={reg.id}>
                        <Link
                          href={`/regulations/${reg.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                                {reg.name}
                              </h3>
                              {reg.code && (
                                <p className="text-sm text-gray-500 mt-1 font-mono">
                                  {reg.code}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            {reg.region && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span>{regionNames[reg.region] || reg.region}</span>
                              </div>
                            )}
                          </div>

                          {reg.description && (
                            <div className="pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-500 line-clamp-3">
                                {reg.description}
                              </p>
                            </div>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>

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

              {!loading && regulations.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Scale className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {appliedSearch.trim() ? 'No Search Results' : 'No Regulations Found'}
                  </h3>
                  <p className="text-gray-600">
                    {appliedSearch.trim()
                      ? `No regulations found for "${appliedSearch}". Try different keywords or adjust filters.`
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
