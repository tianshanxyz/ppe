'use client'

import { useState, useEffect } from 'react'
import { Search, Building, Globe, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getPPEManufacturers } from '@/lib/ppe-database-service'

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')

  const limit = 20

  useEffect(() => {
    loadManufacturers()
  }, [page, selectedCountry])

  async function loadManufacturers() {
    setLoading(true)
    try {
      const result = await getPPEManufacturers({
        page,
        limit,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
      })
      setManufacturers(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error('加载制造商列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <Building className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              PPE Manufacturers Directory
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse verified PPE manufacturers from around the world
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Country:
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
              >
                <option value="all">All Countries</option>
                <option value="China">China</option>
                <option value="United States">United States</option>
                <option value="Germany">Germany</option>
                <option value="India">India</option>
                <option value="Japan">Japan</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {total} manufacturers found
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
              <p className="mt-4 text-gray-600">Loading manufacturers...</p>
            </div>
          )}

          {!loading && manufacturers.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No manufacturers found
              </h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          )}

          {!loading && manufacturers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {manufacturers.map((manufacturer) => (
                  <Link
                    key={manufacturer.id}
                    href={`/ppe/manufacturers/${manufacturer.id}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#339999] transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#339999] transition-colors">
                          {manufacturer.company_name}
                        </h3>
                        {manufacturer.company_name_en && (
                          <p className="text-sm text-gray-500 mt-1">
                            {manufacturer.company_name_en}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {manufacturer.country && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          <span>{manufacturer.country}</span>
                        </div>
                      )}
                      {manufacturer.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="truncate">{manufacturer.address}</span>
                        </div>
                      )}
                      {manufacturer.business_type && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2" />
                          <span className="capitalize">{manufacturer.business_type}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        {manufacturer.website && (
                          <span className="text-[#339999] hover:underline">
                            Visit Website
                          </span>
                        )}
                        <span className="text-gray-500">
                          View Details →
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
        </div>
      </section>
    </div>
  )
}
