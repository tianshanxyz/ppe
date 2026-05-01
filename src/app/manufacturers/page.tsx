'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Building, Globe, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Factory, MapPin, Mail, Phone } from 'lucide-react'
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

// Rich default mock manufacturer data - always shown when API returns empty
const DEFAULT_MANUFACTURERS = [
  {
    id: 'm1',
    name: '3M Company',
    country: 'United States',
    city: 'Saint Paul',
    website: 'https://www.3m.com',
    email: 'safety@3m.com',
    phone: '+1-800-364-3577',
    address: '3M Center, Saint Paul, MN 55144',
    description: 'Global leader in personal protective equipment, offering respiratory protection, hearing protection, and safety eyewear.',
    certifications: ['ISO 9001', 'ISO 14001'],
    product_count: 1200,
  },
  {
    id: 'm2',
    name: 'Honeywell International Inc.',
    country: 'United States',
    city: 'Charlotte',
    website: 'https://safety.honeywell.com',
    email: 'safety@honeywell.com',
    phone: '+1-855-237-2673',
    address: '855 S Mint St, Charlotte, NC 28202',
    description: 'Leading provider of industrial safety solutions including gas detection, respiratory protection, and fall protection.',
    certifications: ['ISO 9001', 'ANSI Z87.1'],
    product_count: 850,
  },
  {
    id: 'm3',
    name: 'Ansell Limited',
    country: 'Australia',
    city: 'Richmond',
    website: 'https://www.ansell.com',
    email: 'info@ansell.com',
    phone: '+61-3-9270-7400',
    address: '678 Victoria St, Richmond VIC 3121',
    description: 'World leader in hand protection and industrial gloves, serving healthcare, industrial, and life sciences markets.',
    certifications: ['ISO 13485', 'CE Certified'],
    product_count: 640,
  },
  {
    id: 'm4',
    name: 'MSA Safety Incorporated',
    country: 'United States',
    city: 'Cranberry Township',
    website: 'https://www.msasafety.com',
    email: 'customerservice@msasafety.com',
    phone: '+1-800-672-2222',
    address: '1000 Cranberry Woods Dr, Cranberry Township, PA 16066',
    description: 'Global safety equipment manufacturer specializing in fixed gas and flame detection, breathing apparatus, and fall protection.',
    certifications: ['ISO 9001', 'ATEX'],
    product_count: 520,
  },
  {
    id: 'm5',
    name: 'DuPont Personal Protection',
    country: 'United States',
    city: 'Wilmington',
    website: 'https://www.dupont.com',
    email: 'protection@dupont.com',
    phone: '+1-833-338-7668',
    address: '974 Centre Rd, Wilmington, DE 19805',
    description: 'Innovator in protective apparel including Tyvek, Tychem, and Nomex for chemical, thermal, and arc flash protection.',
    certifications: ['NFPA 2112', 'EN 14126'],
    product_count: 380,
  },
  {
    id: 'm6',
    name: 'UVEX Safety Group',
    country: 'Germany',
    city: 'Fuerth',
    website: 'https://www.uvex-safety.com',
    email: 'info@uvex.de',
    phone: '+49-911-975-0',
    address: 'Wuerzburger Str. 181, 90766 Fuerth',
    description: 'German manufacturer of safety eyewear, hearing protection, and protective helmets with premium quality standards.',
    certifications: ['DIN EN 166', 'CE Certified'],
    product_count: 420,
  },
  {
    id: 'm7',
    name: 'Delta Plus Group',
    country: 'France',
    city: 'Vieux',
    website: 'https://www.deltaplus.eu',
    email: 'contact@deltaplus.eu',
    phone: '+33-4-74-97-66-66',
    address: 'Z.I. Mas de Pong, 07200 Vieux',
    description: 'European leader in design and manufacture of personal protective equipment for all professional risks.',
    certifications: ['ISO 9001', 'CE Certified'],
    product_count: 1100,
  },
  {
    id: 'm8',
    name: 'Kimberly-Clark Professional',
    country: 'United States',
    city: 'Irving',
    website: 'https://www.kcprofessional.com',
    email: 'support@kcc.com',
    phone: '+1-888-346-4652',
    address: '351 Phelps Dr, Irving, TX 75038',
    description: 'Provider of contamination control solutions, cleanroom apparel, and industrial wiping solutions.',
    certifications: ['ISO 9001', 'ISO 13485'],
    product_count: 290,
  },
  {
    id: 'm9',
    name: 'Showa Glove Co.',
    country: 'Japan',
    city: 'Tokyo',
    website: 'https://www.showagroup.com',
    email: 'global@showa-glove.com',
    phone: '+81-3-3865-6111',
    address: '1-1-1 Shibaura, Minato-ku, Tokyo',
    description: 'Japanese manufacturer of high-quality protective gloves with innovative coating technologies.',
    certifications: ['ISO 9001', 'JIS'],
    product_count: 350,
  },
  {
    id: 'm10',
    name: 'Intech Safety Pvt. Ltd.',
    country: 'India',
    city: 'Mumbai',
    website: 'https://www.intechsafety.com',
    email: 'sales@intechsafety.com',
    phone: '+91-22-2687-4400',
    address: 'Andheri East, Mumbai 400059',
    description: 'Leading Indian manufacturer of safety helmets, safety shoes, and fall protection equipment.',
    certifications: ['ISI Marked', 'CE Certified'],
    product_count: 180,
  },
]

// Client-side filter function
function filterManufacturersClientSide(
  manufacturers: any[],
  searchQuery: string,
  selectedCountry: string
): any[] {
  return manufacturers.filter((m) => {
    const matchesSearch = !searchQuery.trim() || (
      (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.city && m.city.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const matchesCountry = selectedCountry === 'all' || m.country === selectedCountry

    return matchesSearch && matchesCountry
  })
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [usingFallback, setUsingFallback] = useState(false)

  const limit = 12

  // Extract unique countries from default data
  useEffect(() => {
    const countries = Array.from(new Set(DEFAULT_MANUFACTURERS.map(m => m.country))).sort()
    setAvailableCountries(countries)
  }, [])

  const loadManufacturers = useCallback(async () => {
    console.log('loadManufacturers called')
    setLoading(true)
    setError(null)
    try {
      const result = await getPPEManufacturersClient({
        page: 1,
        limit: 1000,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
        search: searchQuery || undefined,
      })
      console.log('Manufacturers loaded:', result.total, result.data?.length)

      let data = result.data || []
      let isFallback = false

      // If API returns empty, use default mock data
      if (!data || data.length === 0) {
        console.log('Using fallback manufacturer data')
        data = DEFAULT_MANUFACTURERS
        isFallback = true
      }

      // Apply client-side filtering
      let filtered = data
      if (searchQuery.trim() || selectedCountry !== 'all') {
        filtered = filterManufacturersClientSide(data, searchQuery, selectedCountry)
      }

      // Paginate
      const from = (page - 1) * limit
      const paginated = filtered.slice(from, from + limit)

      setManufacturers(paginated)
      setTotal(filtered.length)
      setUsingFallback(isFallback)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load manufacturers'
      console.error('Failed to load manufacturers:', err)
      setError(errorMessage)
      // Always show fallback data on error
      const filtered = filterManufacturersClientSide(DEFAULT_MANUFACTURERS, searchQuery, selectedCountry)
      const from = (page - 1) * limit
      setManufacturers(filtered.slice(from, from + limit))
      setTotal(filtered.length)
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }, [page, selectedCountry, searchQuery, limit])

  useEffect(() => {
    loadManufacturers()
  }, [loadManufacturers])

  // 处理搜索
  const handleSearch = () => {
    console.log('Manufacturer handleSearch called with:', searchQuery)
    setPage(1)
    loadManufacturers()
  }

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

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
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
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
          {/* Error State */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-amber-800">Using Demo Data</h3>
                  <p className="text-amber-600 text-sm">{error} Showing sample manufacturers for demonstration.</p>
                </div>
              </div>
            </div>
          )}

          {/* Fallback notice */}
          {usingFallback && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
              <p className="text-blue-700 text-sm text-center">
                Showing sample manufacturer data. Connect to database to see live results.
              </p>
            </div>
          )}

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
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCountry('all')
                  setPage(1)
                }}
                className="px-6 py-2.5 bg-[#339999] text-white rounded-xl font-medium hover:bg-[#2d8b8b] transition-colors"
              >
                Reset Filters
              </button>
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
                {manufacturers.map((manufacturer) => (
                  <div key={manufacturer.id}>
                    <Link
                      href={`/manufacturers/${manufacturer.id}`}
                      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300 h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                            {manufacturer.name}
                          </h3>
                          {manufacturer.city && (
                            <p className="text-sm text-gray-500 mt-1">{manufacturer.city}</p>
                          )}
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
                        {manufacturer.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                            <span className="truncate">{manufacturer.address}</span>
                          </div>
                        )}
                        {manufacturer.website && (
                          <div className="flex items-center text-sm text-[#339999]">
                            <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate hover:underline">{manufacturer.website.replace(/^https?:\/\//, '')}</span>
                          </div>
                        )}
                        {manufacturer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                            <span>{manufacturer.phone}</span>
                          </div>
                        )}
                        {manufacturer.product_count && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Factory className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                            <span>{manufacturer.product_count} products</span>
                          </div>
                        )}
                      </div>

                      {manufacturer.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {manufacturer.description}
                        </p>
                      )}

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
