'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building, Globe, Mail, Phone, MapPin, FileText,
  Package, CheckCircle, ExternalLink, Download
} from 'lucide-react'
import { getPPEManufacturer } from '@/lib/ppe-database-service'

export default function ManufacturerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [manufacturer, setManufacturer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadManufacturer()
  }, [id])

  async function loadManufacturer() {
    try {
      const data = await getPPEManufacturer(id)
      setManufacturer(data)
    } catch (error) {
      console.error('加载制造商详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
          <p className="mt-4 text-gray-600">Loading manufacturer details...</p>
        </div>
      </div>
    )
  }

  if (!manufacturer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manufacturer Not Found</h1>
          <p className="text-gray-600 mb-4">The manufacturer you're looking for doesn't exist</p>
          <Link
            href="/ppe/manufacturers"
            className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Manufacturers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/ppe/manufacturers"
              className="text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Manufacturers
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]">
              <Download className="w-5 h-5 mr-2" />
              Export Profile
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {manufacturer.company_name}
              </h1>
              {manufacturer.company_name_en && (
                <p className="text-xl text-gray-600 mb-4">
                  {manufacturer.company_name_en}
                </p>
              )}
              <div className="flex flex-wrap gap-6">
                {manufacturer.country && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-2" />
                    <span className="font-medium">{manufacturer.country}</span>
                  </div>
                )}
                {manufacturer.business_type && (
                  <div className="flex items-center text-gray-600">
                    <Building className="w-5 h-5 mr-2" />
                    <span className="font-medium capitalize">{manufacturer.business_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  Company Information
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                    <dd className="mt-1 text-lg text-gray-900">{manufacturer.company_name}</dd>
                  </div>
                  {manufacturer.company_name_zh && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Chinese Name</dt>
                      <dd className="mt-1 text-lg text-gray-900">{manufacturer.company_name_zh}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Country</dt>
                    <dd className="mt-1 text-lg text-gray-900">{manufacturer.country}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Business Type</dt>
                    <dd className="mt-1 text-lg text-gray-900 capitalize">
                      {manufacturer.business_type}
                    </dd>
                  </div>
                  {manufacturer.address && (
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-lg text-gray-900">{manufacturer.address}</dd>
                    </div>
                  )}
                  {manufacturer.description && (
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-gray-900 whitespace-pre-wrap">
                        {manufacturer.description}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Mail className="w-6 h-6 text-[#339999] mr-3" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {manufacturer.website && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:underline"
                      >
                        {manufacturer.website}
                      </a>
                    </div>
                  )}
                  {manufacturer.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <a
                        href={`mailto:${manufacturer.email}`}
                        className="text-[#339999] hover:underline"
                      >
                        {manufacturer.email}
                      </a>
                    </div>
                  )}
                  {manufacturer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <a
                        href={`tel:${manufacturer.phone}`}
                        className="text-[#339999] hover:underline"
                      >
                        {manufacturer.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {manufacturer.certifications && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <CheckCircle className="w-6 h-6 text-[#339999] mr-3" />
                    Certifications
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(manufacturer.certifications).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {key}
                        </h3>
                        <p className="text-gray-600">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capabilities */}
              {manufacturer.capabilities && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 text-[#339999] mr-3" />
                    Capabilities
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(manufacturer.capabilities).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">{key}</dt>
                        <dd className="mt-1 text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  {manufacturer.website && (
                    <a
                      href={manufacturer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Visit Website
                    </a>
                  )}
                  {manufacturer.email && (
                    <a
                      href={`mailto:${manufacturer.email}`}
                      className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Send Email
                    </a>
                  )}
                  {manufacturer.phone && (
                    <a
                      href={`tel:${manufacturer.phone}`}
                      className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Now
                    </a>
                  )}
                </div>
              </div>

              {/* Products */}
              {manufacturer.ppe_product_manufacturers && manufacturer.ppe_product_manufacturers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 text-[#339999] mr-3" />
                    Products ({manufacturer.ppe_product_manufacturers.length})
                  </h2>
                  <div className="space-y-3">
                    {manufacturer.ppe_product_manufacturers.map((relation: any, index: number) => {
                      const product = relation.ppe_products
                      if (!product) return null
                      return (
                        <Link
                          key={index}
                          href={`/ppe/products/${product.id}`}
                          className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.product_code}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
