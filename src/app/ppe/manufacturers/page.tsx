'use client'

import { useState, useEffect } from 'react'
import { Search, Building, Globe, Mail, Phone, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEManufacturers } from '@/lib/ppe-database-client'

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

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const limit = 20

  useEffect(() => {
    loadManufacturers()
  }, [page, selectedCountry, searchQuery])

  async function loadManufacturers() {
    setLoading(true)
    try {
      const result = await getPPEManufacturers({
        page,
        limit,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
        search: searchQuery || undefined,
      })
      setManufacturers(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to load manufacturers:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

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
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Search manufacturers..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
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
                <option value="China">China</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
                <option value="India">India</option>
                <option value="Japan">Japan</option>
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
              <p className="text-gray-600">Try adjusting your filters</p>
            </motion.div>
          )}

          {!loading && manufacturers.length > 0 && (
            <>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
              >
                {manufacturers.map((manufacturer, index) => (
                  <motion.div key={manufacturer.id} variants={fadeInUp} custom={index}>
                    <Link
                      href={`/ppe/manufacturers/${manufacturer.id}`}
                      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                            {manufacturer.company_name}
                          </h3>
                          {manufacturer.company_name_en && (
                            <p className="text-sm text-gray-500 mt-1">
                              {manufacturer.company_name_en}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all" />
                      </div>

                      <div className="space-y-3 mb-6">
                        {manufacturer.country && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="w-4 h-4 mr-2 text-[#339999]" />
                            <span>{manufacturer.country}</span>
                          </div>
                        )}
                        {manufacturer.address && (
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-[#339999] mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{manufacturer.address}</span>
                          </div>
                        )}
                        {manufacturer.business_type && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Building className="w-4 h-4 mr-2 text-[#339999]" />
                            <span className="capitalize">{manufacturer.business_type}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          {manufacturer.website && (
                            <span className="text-sm font-semibold text-[#339999] hover:underline">
                              Visit Website
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-500 group-hover:text-[#339999] transition-colors">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  className="mt-10 flex items-center justify-center gap-2"
                  variants={fadeInUp}
                >
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
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
                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Next
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
