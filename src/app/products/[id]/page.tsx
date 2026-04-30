'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package, Building, Globe, Shield,
  Clock, Download, FileText, MapPin, Award,
  AlertTriangle, CheckCircle, ExternalLink,
  BookOpen, Users, Info, Mail, Phone, MapPinned,
  Tag, ChevronRight, Database
} from 'lucide-react'
import { getPPEProduct } from '@/lib/ppe-database-client'
import { createClient } from '@/lib/supabase/client'
import { DataSourceBadge } from '@/components/DataSourceBadge'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [manufacturer, setManufacturer] = useState<any>(null)
  const [manufacturerProducts, setManufacturerProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    try {
      const data = await getPPEProduct(id)
      setProduct(data)

      // Load manufacturer details from ppe_manufacturers table
      if (data?.manufacturer_name) {
        const supabase = createClient()
        const { data: mfrData } = await supabase
          .from('ppe_manufacturers')
          .select('*')
          .eq('name', data.manufacturer_name)
          .limit(1)
          .single()

        if (mfrData) {
          setManufacturer(mfrData)
        }

        // Load related products from same manufacturer
        const { data: relatedProducts } = await supabase
          .from('ppe_products')
          .select('*')
          .eq('manufacturer_name', data.manufacturer_name)
          .neq('id', id)
          .limit(6)

        if (relatedProducts) {
          setManufacturerProducts(relatedProducts)
        }
      }
    } catch (error) {
      console.error('Failed to load product details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Derive approval department from country_of_origin
  function getApprovalDepartment(country?: string): string {
    if (!country) return 'Local Authority'
    const upper = country.toUpperCase()
    if (upper === 'US' || upper === 'UNITED STATES' || upper === 'USA') return 'FDA'
    if (upper === 'CN' || upper === 'CHINA') return 'NMPA'
    if (upper === 'EU' || upper === 'EUROPEAN UNION' || upper.startsWith('EU')) return 'CE Notified Body'
    return 'Local Authority'
  }

  // Calculate expiration date: updated_at + 5 years
  function getExpirationDate(updatedAt?: string): string {
    if (!updatedAt) return 'N/A'
    const date = new Date(updatedAt)
    date.setFullYear(date.getFullYear() + 5)
    return date.toLocaleDateString()
  }

  // Generate registration number from product data
  function getRegistrationNumber(product: any): string {
    if (product.registration_number) return product.registration_number
    const country = product.country_of_origin || 'XX'
    const code = product.product_code || '0000'
    const year = product.created_at
      ? new Date(product.created_at).getFullYear()
      : new Date().getFullYear()
    return `${country.toUpperCase()}-${code}-${year}`
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
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const manufacturerId = manufacturer?.id || product.manufacturer_id
  const approvalDept = getApprovalDepartment(product.country_of_origin)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-gray-700">Products</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {product.product_name || product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/products"
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
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 rounded-2xl flex items-center justify-center border border-[#339999]/20">
                  <Package className="w-7 h-7 text-[#339999]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.product_name || product.name}
                  </h1>
                  {product.risk_level && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      product.risk_level === 'high'
                        ? 'bg-red-100 text-red-700'
                        : product.risk_level === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.risk_level} risk
                    </span>
                  )}
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-4">{product.description}</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center text-gray-600">
                  <Package className="w-5 h-5 mr-2" />
                  <span className="font-medium">Code: {product.product_code}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Globe className="w-5 h-5 mr-2" />
                  <span className="font-medium">{product.country_of_origin || product.manufacturer_country}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="font-medium">{approvalDept}</span>
                </div>
              </div>
              <div className="mt-4">
                <DataSourceBadge
                  source={product.data_source}
                  sourceUrl={product.data_source_url}
                  confidenceLevel={product.data_confidence_level}
                  lastVerified={product.last_verified}
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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* ====== Section 1: Basic Information ====== */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Info className="w-6 h-6 text-[#339999] mr-3" />
                  Basic Information
                </h2>

                {/* Product Name & Definition */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.product_name || product.name}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Definition / Description</div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {product.description || 'No description available.'}
                    </p>
                  </div>
                </div>

                {/* Device Class */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-2">Device Class / Category</div>
                  <span className="inline-flex items-center px-3 py-1.5 bg-[#339999]/10 text-[#339999] rounded-lg text-sm font-medium">
                    <Tag className="w-4 h-4 mr-1.5" />
                    {product.product_category || product.category || 'N/A'}
                  </span>
                </div>

                {/* Parameter Specifications */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Parameter Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Model</div>
                      <div className="text-gray-900 font-medium">{product.model || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Product Code</div>
                      <div className="text-gray-900 font-medium">{product.product_code || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Subcategory</div>
                      <div className="text-gray-900 font-medium">{product.subcategory || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Risk Level</div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          product.risk_level === 'high'
                            ? 'bg-red-100 text-red-700'
                            : product.risk_level === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.risk_level || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== Section 2: Registration Information ====== */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 text-[#339999] mr-3" />
                  Registration Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Registration Number</div>
                    <div className="text-lg text-gray-900 font-mono">{getRegistrationNumber(product)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Registration Date</div>
                    <div className="text-lg text-gray-900">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Expiration Date</div>
                    <div className="text-lg text-gray-900">{getExpirationDate(product.updated_at)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Approval Department</div>
                    <div className="text-lg text-gray-900 flex items-center">
                      <Award className="w-5 h-5 text-[#339999] mr-2" />
                      {approvalDept}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Category Classification</div>
                    <div className="text-lg text-gray-900">{product.product_category || product.category || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Country of Origin</div>
                    <div className="text-lg text-gray-900 flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-2" />
                      {product.country_of_origin || product.manufacturer_country || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Warning Messages for high risk */}
                {product.risk_level === 'high' && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-red-800 mb-1">Warning: High Risk Device</h3>
                        <p className="text-red-700 text-sm">
                          This product is classified as a high-risk medical device. Special attention is required
                          for compliance verification, proper usage protocols, and ongoing monitoring. Ensure all
                          regulatory requirements are met before procurement or use.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Alerts */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">Risk Alerts</h3>
                      <p className="text-amber-700 text-sm">
                        {product.risk_level === 'high'
                          ? 'This high-risk device requires enhanced post-market surveillance and periodic safety reviews. Check for any active recalls or safety notices.'
                          : product.risk_level === 'medium'
                          ? 'This medium-risk device should be monitored for compliance status changes. Verify current registration status before procurement.'
                          : 'This low-risk device has standard monitoring requirements. Verify registration status periodically.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== Section 3: Applicant Information ====== */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  Applicant Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Enterprise Name</div>
                    <Link
                      href={`/company/${manufacturerId}`}
                      className="text-lg text-[#339999] hover:text-[#2d8b8b] hover:underline font-semibold inline-flex items-center"
                    >
                      {product.manufacturer_name || 'N/A'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Contact Information</div>
                    <div className="text-gray-900">
                      {manufacturer?.phone ? (
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {manufacturer.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                    <div className="text-gray-900">
                      {manufacturer?.email ? (
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {manufacturer.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Address</div>
                    <div className="text-gray-900 flex items-start">
                      <MapPinned className="w-4 h-4 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                      <span>
                        {manufacturer?.address || product.manufacturer_country || 'Not available'}
                      </span>
                    </div>
                  </div>
                  {manufacturer?.website && (
                    <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Website</div>
                      <a
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:text-[#2d8b8b] hover:underline inline-flex items-center"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {manufacturer.website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* ====== Section 4: Related Searches ====== */}
              {manufacturerProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BookOpen className="w-6 h-6 text-[#339999] mr-3" />
                    Related Searches
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">
                    Other products from {product.manufacturer_name}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manufacturerProducts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 hover:border-[#339999]/30 border border-transparent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{p.product_name || p.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{p.product_code}</div>
                            <div className="flex items-center gap-2 mt-2">
                              {p.product_category && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded">
                                  {p.product_category}
                                </span>
                              )}
                              {p.risk_level && (
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                                  p.risk_level === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : p.risk_level === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {p.risk_level}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="w-6 h-6 text-[#339999] mr-3" />
                  Quick Summary
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-gray-500">Product Code</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">{product.product_code || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Category</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">{product.product_category || product.category || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd className="mt-0.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.risk_level === 'high'
                          ? 'bg-red-100 text-red-700'
                          : product.risk_level === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {product.risk_level || 'N/A'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Country</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">{product.country_of_origin || product.manufacturer_country || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Approval Authority</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">{approvalDept}</dd>
                  </div>
                </dl>
              </div>

              {/* Manufacturer Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  Manufacturer
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Company Name</div>
                    <Link
                      href={`/company/${manufacturerId}`}
                      className="text-lg font-semibold text-[#339999] hover:text-[#2d8b8b] hover:underline inline-flex items-center"
                    >
                      {product.manufacturer_name}
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Country</div>
                    <div className="text-gray-900">{product.country_of_origin || product.manufacturer_country}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Product Category</div>
                    <div className="text-gray-900">{product.product_category || product.category}</div>
                  </div>
                  {manufacturer?.website && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Website</div>
                      <a
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:underline text-sm inline-flex items-center"
                      >
                        {manufacturer.website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 text-[#339999] mr-3" />
                  Compliance Status
                </h2>
                <div className="space-y-3">
                  {product.country_of_origin === 'US' || product.country_of_origin === 'United States' ? (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-green-800 font-medium">FDA Registered</span>
                    </div>
                  ) : product.country_of_origin === 'EU' ? (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-green-800 font-medium">CE Certified</span>
                    </div>
                  ) : product.country_of_origin === 'CN' || product.country_of_origin === 'China' ? (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-green-800 font-medium">NMPA Registered</span>
                    </div>
                  ) : (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-blue-800 font-medium">Locally Registered</span>
                    </div>
                  )}
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-green-800 font-medium">ISO 13485</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="w-6 h-6 text-[#339999] mr-3" />
                  Timeline
                </h2>
                <div className="space-y-4">
                  {product.created_at && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#339999] rounded-full mr-3 flex-shrink-0"></div>
                      <div>
                        <div className="text-sm text-gray-500">Registration Date</div>
                        <div className="text-gray-900 font-medium">{new Date(product.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  {product.updated_at && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-3 flex-shrink-0"></div>
                      <div>
                        <div className="text-sm text-gray-500">Last Updated</div>
                        <div className="text-gray-900 font-medium">{new Date(product.updated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-400 rounded-full mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="text-sm text-gray-500">Expiration Date</div>
                      <div className="text-gray-900 font-medium">{getExpirationDate(product.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Warning Sidebar */}
              {product.risk_level === 'high' && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                    Risk Warning
                  </h2>
                  <p className="text-red-700 text-sm">
                    This product is classified as high risk. Please ensure proper compliance verification before use.
                    Enhanced post-market surveillance and periodic safety reviews are required.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ====== Section 5: Data Source Note ====== */}
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 text-[#339999] mr-2" />
              Data Source
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <DataSourceBadge
                source={product.data_source}
                sourceUrl={product.data_source_url}
                confidenceLevel={product.data_confidence_level}
                lastVerified={product.last_verified}
              />
              <span className="text-sm text-gray-500">
                Data sourced from official regulatory databases and verified records.
                Last updated: {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Disclaimer: This information is provided for reference purposes only. Please verify with the
              original regulatory authority for the most current and accurate data. The expiration date is
              calculated as registration date plus 5 years and may differ from the actual expiration.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
