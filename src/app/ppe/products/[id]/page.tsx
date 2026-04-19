'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package, Building, Globe, FileText, Shield, CheckCircle,
  AlertCircle, Calendar, DollarSign, Clock, Download, ExternalLink
} from 'lucide-react'
import { getPPEProduct } from '@/lib/ppe-database-service'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    try {
      const data = await getPPEProduct(id)
      setProduct(data)
    } catch (error) {
      console.error('加载产品详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist</p>
          <Link
            href="/ppe/products"
            className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
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
              href="/ppe/products"
              className="text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Products
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]">
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {product.product_name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.registration_status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.registration_status}
                </span>
              </div>
              <p className="text-lg text-gray-600 mb-4">{product.description}</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center text-gray-600">
                  <Package className="w-5 h-5 mr-2" />
                  <span className="font-medium">Code: {product.product_code}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="font-medium">Class {product.ppe_category}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Globe className="w-5 h-5 mr-2" />
                  <span className="font-medium">{product.manufacturer_country}</span>
                </div>
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
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="w-6 h-6 text-[#339999] mr-3" />
                  Basic Information
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                    <dd className="mt-1 text-lg text-gray-900">{product.product_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Code</dt>
                    <dd className="mt-1 text-lg text-gray-900">{product.product_code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-lg text-gray-900">{product.product_category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sub-category</dt>
                    <dd className="mt-1 text-lg text-gray-900">{product.sub_category || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">PPE Category</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]">
                        Class {product.ppe_category}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Risk Classification</dt>
                    <dd className="mt-1 text-lg text-gray-900">{product.risk_classification || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {/* Certification Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 text-[#339999] mr-3" />
                  Certification Information
                </h2>
                <div className="space-y-6">
                  {/* CE Certification */}
                  {product.ce_certificate_number && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">CE Certification</h3>
                      </div>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-gray-500">Certificate Number</dt>
                          <dd className="mt-1 text-gray-900">{product.ce_certificate_number}</dd>
                        </div>
                        {product.ce_expiry_date && (
                          <div>
                            <dt className="text-sm text-gray-500">Expiry Date</dt>
                            <dd className="mt-1 text-gray-900">{product.ce_expiry_date}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* FDA Certification */}
                  {product.fda_k_number && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">FDA 510(k)</h3>
                      </div>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-gray-500">K Number</dt>
                          <dd className="mt-1 text-gray-900">{product.fda_k_number}</dd>
                        </div>
                        {product.fda_decision_date && (
                          <div>
                            <dt className="text-sm text-gray-500">Decision Date</dt>
                            <dd className="mt-1 text-gray-900">{product.fda_decision_date}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* NMPA Certification */}
                  {product.nmpa_registration_number && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">NMPA Registration</h3>
                      </div>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-gray-500">Registration Number</dt>
                          <dd className="mt-1 text-gray-900">{product.nmpa_registration_number}</dd>
                        </div>
                        {product.nmpa_expiry_date && (
                          <div>
                            <dt className="text-sm text-gray-500">Expiry Date</dt>
                            <dd className="mt-1 text-gray-900">{product.nmpa_expiry_date}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* ISO Certifications */}
                  {product.iso_certifications && product.iso_certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">ISO Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.iso_certifications.map((iso: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]"
                          >
                            {iso}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Market Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Globe className="w-6 h-6 text-[#339999] mr-3" />
                  Market Information
                </h2>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Markets</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.target_markets && product.target_markets.map((market: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                      >
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Manufacturer Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  Manufacturer
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Company Name</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {product.manufacturer_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Country</div>
                    <div className="text-gray-900">{product.manufacturer_country}</div>
                  </div>
                  {product.manufacturer_address && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Address</div>
                      <div className="text-gray-900">{product.manufacturer_address}</div>
                    </div>
                  )}
                  {product.brand_name && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Brand</div>
                      <div className="text-gray-900">{product.brand_name}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="w-6 h-6 text-[#339999] mr-3" />
                  Timeline
                </h2>
                <div className="space-y-4">
                  {product.approval_date && (
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Approval Date</div>
                        <div className="text-gray-900">{product.approval_date}</div>
                      </div>
                    </div>
                  )}
                  {product.expiry_date && (
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Expiry Date</div>
                        <div className="text-gray-900">{product.expiry_date}</div>
                      </div>
                    </div>
                  )}
                  {product.last_sync_at && (
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Last Updated</div>
                        <div className="text-gray-900">{product.last_sync_at}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Regulations */}
              {product.applicable_regulations && product.applicable_regulations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 text-[#339999] mr-3" />
                    Applicable Regulations
                  </h2>
                  <ul className="space-y-2">
                    {product.applicable_regulations.map((reg: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#339999] rounded-full mr-2 mt-1.5"></span>
                        {reg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
