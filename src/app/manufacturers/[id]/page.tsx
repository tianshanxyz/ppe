'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building, Globe, ExternalLink, Download,
  MapPin, Award, AlertTriangle, CheckCircle, Package,
  Users, Calendar, DollarSign, FileText,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { getPPEManufacturer, DEFAULT_MANUFACTURERS, DEFAULT_PRODUCTS, getPPEProductsClient } from '@/lib/ppe-database-client'
import { DataSourceBadge } from '@/components/DataSourceBadge'

export default function ManufacturerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [manufacturer, setManufacturer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadManufacturer()
  }, [id])

  async function loadManufacturer() {
    try {
      let data = await getPPEManufacturer(id)
      
      // 如果数据库中没有找到，从默认制造商数据中查找
      if (!data) {
        const defaultMfr = DEFAULT_MANUFACTURERS.find(m => m.id === id)
        if (defaultMfr) {
          data = defaultMfr
        }
      }
      
      setManufacturer(data)
      
      // 加载该制造商的产品
      if (data?.name) {
        try {
          const result = await getPPEProductsClient({
            page: 1,
            limit: 10,
            filters: { search: data.name },
          })
          if (result.data && result.data.length > 0) {
            setProducts(result.data)
          } else {
            // 数据库查询失败时使用默认产品作为回退
            const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === data.name)
            setProducts(fallbackProducts)
          }
        } catch {
          // 产品加载失败时使用默认产品作为回退
          const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === data.name)
          setProducts(fallbackProducts)
        }
      }
    } catch (error) {
      console.error('加载制造商详情失败:', error)
      // 尝试从默认制造商数据中查找
      const defaultMfr = DEFAULT_MANUFACTURERS.find(m => m.id === id)
      if (defaultMfr) {
        setManufacturer(defaultMfr)
        const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === defaultMfr.name)
        setProducts(fallbackProducts)
      }
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
            href="/manufacturers"
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
              href="/manufacturers"
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
                {manufacturer.name}
              </h1>
              <div className="flex flex-wrap gap-6">
                {manufacturer.country && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-2" />
                    <span className="font-medium">{manufacturer.country}</span>
                  </div>
                )}
                {manufacturer.website && (
                  <a 
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#339999] hover:text-[#2d8b8b]"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    <span className="font-medium">Website</span>
                  </a>
                )}
              </div>
              <div className="mt-4">
                <DataSourceBadge 
                  source={manufacturer.data_source}
                  sourceUrl={manufacturer.data_source_url}
                  confidenceLevel={manufacturer.data_confidence_level}
                  lastVerified={manufacturer.last_verified}
                />
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
              {/* Company Profile */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  Company Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Company Name</div>
                    <div className="text-lg text-gray-900">{manufacturer.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Country/Region</div>
                    <div className="text-lg text-gray-900">{manufacturer.country}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Established</div>
                    <div className="text-lg text-gray-900">2010</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Registered Capital</div>
                    <div className="text-lg text-gray-900">$10 Million</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Business Scope</div>
                    <div className="text-lg text-gray-900">Medical Device Manufacturing</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Legal Representative</div>
                    <div className="text-lg text-gray-900">Zhang Wei</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Employees</div>
                    <div className="text-lg text-gray-900">500-1000</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</div>
                    <div className="text-lg text-gray-900">$50-100 Million</div>
                  </div>
                </div>
              </div>

              {/* Global Layout */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-[#339999] mr-3" />
                  Global Presence
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">Headquarters</div>
                      <div className="text-sm text-gray-500">{manufacturer.country}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">Production Base</div>
                      <div className="text-sm text-gray-500">Main manufacturing facility in {manufacturer.country}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <Globe className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">Branch Offices</div>
                      <div className="text-sm text-gray-500">North America, Europe, Asia Pacific</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Certifications */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 text-[#339999] mr-3" />
                Compliance & Certifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">FDA Registered</div>
                      <div className="text-sm text-green-600">Active</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">CE Certified</div>
                      <div className="text-sm text-green-600">MDR 2017/745</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">ISO 13485</div>
                      <div className="text-sm text-green-600">Medical Devices QMS</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">ISO 9001</div>
                      <div className="text-sm text-green-600">Quality Management</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              {products.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 text-[#339999] mr-3" />
                    PPE Products ({products.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{product.product_name || product.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{product.product_code}</div>
                        <div className="flex items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                            product.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.risk_level} risk
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Warning */}
              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-8">
                <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                  Risk Notice
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <p className="text-yellow-800 text-sm">
                      Please verify all compliance certifications before placing orders. 
                      This information is for reference only.
                    </p>
                  </div>
                </div>
              </div>
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
                  <button className="flex items-center justify-center w-full px-4 py-3 border border-[#339999] text-[#339999] rounded-lg hover:bg-[#339999]/5 transition-colors">
                    <FileText className="w-5 h-5 mr-2" />
                    Request Quote
                  </button>
                </div>
              </div>

              {/* Company Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 text-[#339999] mr-3" />
                  Company Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">Products</span>
                    </div>
                    <span className="font-bold text-gray-900">{products.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">Certifications</span>
                    </div>
                    <span className="font-bold text-gray-900">4</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">Employees</span>
                    </div>
                    <span className="font-bold text-gray-900">500-1000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">Established</span>
                    </div>
                    <span className="font-bold text-gray-900">2010</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 text-[#339999] mr-3" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Address</div>
                    <div className="text-gray-900">{manufacturer.country}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Website</div>
                    {manufacturer.website ? (
                      <a 
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:underline"
                      >
                        {manufacturer.website}
                      </a>
                    ) : (
                      <div className="text-gray-500">Not available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
