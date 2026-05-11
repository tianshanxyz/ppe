'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuditNotes } from '@/components/data/AuditNotes'
import {
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  Package,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { DataSourceBadge } from '@/components/data/DataSourceBadge'
import { DataTrustBadge } from '@/components/trust'
import { CompanyRiskBanner } from './CompanyRiskBanner'
import { RiskAlert } from '@/components/risk'

interface Product {
  id: string
  name: string
  product_code: string | null
  device_class: string | null
  data_source: string
  registration_date: string | null
  status: string | null
  market: string
  metadata: Record<string, any>
}

interface Company {
  id: string
  name: string
  name_zh: string | null
  country: string | null
  address: string | null
  website: string | null
  data_sources: string[]
  market: string
  source: string
  created_at: string
  products: Product[]
}

interface CompanyDetailProps {
  company: Company
}

export function CompanyDetail({ company }: CompanyDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'regulatory'>('overview')

  const productsBySource = company.products?.reduce((acc, product) => {
    const source = product.data_source
    if (!acc[source]) acc[source] = []
    acc[source].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const totalProducts = company.products?.length || 0
  const activeProducts = company.products?.filter(p =>
    p.status?.toLowerCase().includes('approved') ||
    p.status?.toLowerCase().includes('active')
  ).length || 0

  // 模拟风险预警数据 (实际应从API获取)
  const mockAlerts: RiskAlert[] = [
    {
      id: '1',
      type: '证书过期',
      level: 'HIGH',
      title: 'FDA注册证书即将过期',
      message: '该企业FDA注册证书将在30天内过期',
      detectedAt: new Date().toISOString(),
      entityId: company.id,
      entityType: 'company'
    }
  ]

  // 计算数据可信度
  const calculateConfidence = () => {
    const hasMultipleSources = (company.data_sources?.length || 0) > 1
    const hasProducts = totalProducts > 0
    const hasRecentData = company.created_at &&
      (new Date().getTime() - new Date(company.created_at).getTime()) < 365 * 24 * 60 * 60 * 1000

    let confidence = 0.7
    if (hasMultipleSources) confidence += 0.15
    if (hasProducts) confidence += 0.1
    if (hasRecentData) confidence += 0.05

    return Math.min(confidence, 0.98)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>

      {/* Risk Alert Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <CompanyRiskBanner
          alerts={mockAlerts}
          companyName={company.name}
          onAlertClick={(alert) => console.log('Alert clicked:', alert)}
        />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                {company.name_zh && company.name_zh !== company.name && (
                  <span className="text-lg text-gray-500">({company.name_zh})</span>
                )}
              </div>

              {/* Data Trust Badge */}
              <div className="mt-3">
                <DataTrustBadge
                  lastUpdated={company.created_at}
                  source={company.data_sources?.[0] || 'Unknown'}
                  confidence={calculateConfidence()}
                  verified={(company.data_sources?.length || 0) > 0}
                  showDetails={true}
                  size="md"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
                {company.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {company.country}
                  </span>
                )}
                {company.address && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {company.address}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {company.data_sources?.map(source => (
                  <DataSourceBadge key={source} sourceName={source} />
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-6 py-4 text-center">
                <p className="text-2xl font-bold text-primary-900">{totalProducts}</p>
                <p className="text-sm text-primary-700">Total Products</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 text-center">
                <p className="text-2xl font-bold text-green-900">{activeProducts}</p>
                <p className="text-sm text-green-700">Active</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'products', label: `Products (${totalProducts})`, icon: Package },
              { id: 'regulatory', label: 'Regulatory', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Company Name</dt>
                      <dd className="text-sm font-medium text-gray-900">{company.name}</dd>
                    </div>
                    {company.name_zh && (
                      <div>
                        <dt className="text-sm text-gray-500">Chinese Name</dt>
                        <dd className="text-sm font-medium text-gray-900">{company.name_zh}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-500">Country</dt>
                      <dd className="text-sm font-medium text-gray-900">{company.country || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Primary Market</dt>
                      <dd className="text-sm font-medium text-gray-900 uppercase">{company.market}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Data Sources</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {company.data_sources?.join(', ') || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">First Seen</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(company.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {company.address && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{company.address}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h2>
                  <div className="space-y-3">
                    {company.data_sources?.map(source => (
                      <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {source.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {productsBySource?.[source]?.length || 0} products
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {Object.entries(productsBySource || {}).map(([source, products]) => (
                <div key={source} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <DataSourceBadge sourceName={source} />
                      <span className="text-sm text-gray-500">({products.length} products)</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {products.map(product => (
                      <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                              {product.product_code && (
                                <span>Code: {product.product_code}</span>
                              )}
                              {product.device_class && (
                                <span className="capitalize">Class: {product.device_class.replace('_', ' ')}</span>
                              )}
                              {product.registration_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(product.registration_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.status?.toLowerCase().includes('approved') ||
                            product.status?.toLowerCase().includes('active')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!company.products || company.products.length === 0) && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Products Found</h3>
                  <p className="text-gray-500 mt-1">No products are associated with this company yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'regulatory' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Regulatory Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Active Registrations</span>
                    </div>
                    <span className="text-2xl font-bold text-green-900">{activeProducts}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Total Products</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{totalProducts}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Markets</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Primary Market</span>
                    <span className="font-medium text-gray-900 uppercase">{company.market}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Data Sources</span>
                    <span className="font-medium text-gray-900">{company.data_sources?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <AuditNotes targetType="company" targetId={company.id} />
    </div>
  )
}
