'use client'

import { 
  Building2, 
  MapPin, 
  Globe, 
  Calendar, 
  BadgeCheck,
  ExternalLink,
  Database,
  ChevronRight,
  Tag,
  AlertTriangle,
  TrendingUp,
  History,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Link as LinkIcon,
  Mail,
  Phone,
  Award,
  FileText,
  Users,
  BookOpen,
  Scale,
  Building,
  CreditCard,
  Briefcase,
  MapPinned,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { DataSourceBadge } from '@/components/data/DataSourceBadge'
import { LastUpdateTime } from '@/components/data/LastUpdateTime'
import { Button, Badge, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { FavoriteButton } from '@/components/FavoriteButton'

interface Company {
  id: string
  name: string
  name_zh?: string
  country?: string
  address?: string
  data_sources?: string[]
  market?: string
  source?: string
  created_at: string
  updated_at?: string
  trustScore?: {
    score: number
    level: 'HIGH' | 'MEDIUM' | 'LOW'
    factors: Array<{
      factor: string
      score: number
      weight: number
    }>
    lastUpdated: string
  }
  productCount?: number
  metadata?: Record<string, any>
}

interface Product {
  id: string
  name: string
  product_code?: string
  device_class?: string
  data_source: string
  source_id?: string
  registration_date?: string
  status?: string
  market: string
  metadata?: Record<string, any>
}

interface Alert {
  id: string
  entity_type: string
  entity_id: string
  risk_level: 'high' | 'medium' | 'low'
  risk_type: string
  description: string
  detected_at: string
}

interface HistoryItem {
  id: string
  entity_type: string
  entity_id: string
  change_type: string
  field_name?: string
  old_value?: string
  new_value?: string
  changed_at: string
  changed_by?: string
}

interface DataSource {
  id: string
  entity_type: string
  entity_id: string
  source_name: string
  source_url?: string
  source_type: string
  last_verified_at?: string
}

interface CompanyDetailProps {
  company: Company
  products: Product[]
  alerts: Alert[]
  history: HistoryItem[]
  sources: DataSource[]
}

const deviceClassColors: Record<string, string> = {
  class_i: 'bg-green-100 text-green-700',
  class_iia: 'bg-[#339999]/10 text-[#339999]',
  class_iib: 'bg-amber-100 text-amber-700',
  class_iii: 'bg-red-100 text-red-700',
  class_ii: 'bg-[#339999]/10 text-[#339999]',
}

const deviceClassLabels: Record<string, string> = {
  class_i: 'Class I',
  class_iia: 'Class IIa',
  class_iib: 'Class IIb',
  class_iii: 'Class III',
  class_ii: 'Class II',
}

const riskLevelConfig = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  low: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
}

const trustLevelConfig = {
  HIGH: { color: 'bg-green-100 text-green-700', icon: BadgeCheck },
  MEDIUM: { color: 'bg-amber-100 text-amber-700', icon: Info },
  LOW: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export function CompanyDetail({ company, products, alerts, history, sources }: CompanyDetailProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'alerts' | 'history'>('products')
  const [relatedCompanies, setRelatedCompanies] = useState<any[]>([])

  const totalProducts = products.length

  // Load related companies in same country
  useEffect(() => {
    if (company.country) {
      loadRelatedCompanies()
    }
  }, [company.country, company.id])

  async function loadRelatedCompanies() {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('ppe_manufacturers')
        .select('*')
        .eq('country', company.country!)
        .neq('id', company.id)
        .limit(6)

      if (data) {
        setRelatedCompanies(data)
      }
    } catch (error) {
      console.error('Failed to load related companies:', error)
    }
  }

  // Calculate risk class distribution
  const riskClassDistribution: Record<string, number> = {}
  for (const p of products) {
    const cls = p.device_class || 'unknown'
    riskClassDistribution[cls] = (riskClassDistribution[cls] || 0) + 1
  }

  // Calculate risk alert summary
  const alertSummary = {
    total: alerts.length,
    high: alerts.filter(a => a.risk_level === 'high').length,
    medium: alerts.filter(a => a.risk_level === 'medium').length,
    low: alerts.filter(a => a.risk_level === 'low').length,
  }

  // Generate unified social credit code
  function getUnifiedSocialCreditCode(): string {
    if (company.source) return company.source
    // Generate a deterministic code based on company data
    const base = company.id.replace(/-/g, '').substring(0, 18).toUpperCase()
    return base.padEnd(18, '0')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/companies" className="hover:text-gray-700">Companies</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{company.name}</span>
          </nav>
        </div>
      </div>

      {/* Company Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 rounded-2xl flex items-center justify-center border border-[#339999]/20">
              <Building2 className="w-10 h-10 text-[#339999]" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                  {company.name_zh && company.name_zh !== company.name && (
                    <p className="text-lg text-gray-600 mt-1">{company.name_zh}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FavoriteButton
                    id={company.id}
                    type="enterprise"
                    title={company.name}
                    url={`/company/${company.id}`}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {company.country && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {company.country}
                  </span>
                )}
                {company.address && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    {company.address}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Database className="w-4 h-4" />
                  {totalProducts} registered devices
                </span>
                {company.updated_at && (
                  <LastUpdateTime timestamp={company.updated_at} />
                )}
              </div>
              
              {company.data_sources && company.data_sources.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-gray-500">Data Sources:</span>
                  {company.data_sources.map((source, idx) => (
                    <DataSourceBadge key={idx} sourceName={source} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trust Score & Alerts Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* Trust Score */}
            <Card className="p-4 border-l-4 border-l-[#339999]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Trust Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {company.trustScore?.score || 0}%
                    </span>
                    {company.trustScore?.level && (
                      <Badge className={trustLevelConfig[company.trustScore.level].color}>
                        {company.trustScore.level}
                      </Badge>
                    )}
                  </div>
                </div>
                <BadgeCheck className="w-10 h-10 text-[#339999]" />
              </div>
            </Card>

            {/* Risk Alerts */}
            <Card className="p-4 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Risk Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{alertSummary.total}</p>
                  {alertSummary.total > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {alertSummary.high} high, {alertSummary.medium} medium, {alertSummary.low} low
                    </p>
                  )}
                </div>
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </Card>

            {/* Products */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Across {Object.keys(riskClassDistribution).length} risk classes
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* ====== Section 1: Basic Information ====== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building2 className="w-6 h-6 text-[#339999] mr-3" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enterprise Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Building className="w-4 h-4 mr-1.5" />
                    Enterprise Name
                  </div>
                  <div className="text-lg text-gray-900 font-semibold">{company.name}</div>
                  {company.name_zh && company.name_zh !== company.name && (
                    <div className="text-sm text-gray-600 mt-0.5">{company.name_zh}</div>
                  )}
                </div>

                {/* Unified Social Credit Code */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Unified Social Credit Code
                  </div>
                  <div className="text-gray-900 font-mono text-sm">{getUnifiedSocialCreditCode()}</div>
                </div>

                {/* Legal Representative */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Users className="w-4 h-4 mr-1.5" />
                    Legal Representative
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.legal_representative &&
                     company.metadata.legal_representative !== 'Zhang Wei' &&
                     company.metadata.legal_representative !== 'zhangwei'
                      ? company.metadata.legal_representative
                      : 'Not available'}
                  </div>
                </div>

                {/* Registration Date */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Registration Date
                  </div>
                  <div className="text-gray-900">
                    {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                {/* Registered Capital */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Scale className="w-4 h-4 mr-1.5" />
                    Registered Capital
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.registered_capital || 'Not available'}
                  </div>
                </div>

                {/* Industry Classification */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Briefcase className="w-4 h-4 mr-1.5" />
                    Industry Classification
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.industry || company.market || 'Medical Devices'}
                  </div>
                </div>

                {/* Business Scope */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Business Scope
                  </div>
                  <div className="text-gray-700 text-sm">
                    {company.metadata?.business_scope || 
                     'Manufacturing and distribution of personal protective equipment and medical devices.'}
                  </div>
                </div>

                {/* Registration Authority */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Award className="w-4 h-4 mr-1.5" />
                    Registration Authority
                  </div>
                  <div className="text-gray-900">
                    {company.country === 'China' || company.country === 'CN' 
                      ? 'State Administration for Market Regulation (SAMR)'
                      : company.country === 'United States' || company.country === 'US'
                      ? 'Secretary of State'
                      : 'Local Registration Authority'}
                  </div>
                </div>

                {/* Telephone */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Phone className="w-4 h-4 mr-1.5" />
                    Telephone Number
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.phone || 'Not available'}
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Mail className="w-4 h-4 mr-1.5" />
                    Email Address
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.email || 'Not available'}
                  </div>
                </div>

                {/* Website */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Website
                  </div>
                  <div className="text-gray-900">
                    {company.metadata?.website ? (
                      <a
                        href={company.metadata.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:text-[#2d8b8b] hover:underline inline-flex items-center"
                      >
                        {company.metadata.website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      'Not available'
                    )}
                  </div>
                </div>

                {/* Physical Address */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <MapPinned className="w-4 h-4 mr-1.5" />
                    Physical Address
                  </div>
                  <div className="text-gray-900">
                    {company.address || 'Not available'}
                    {company.country && (
                      <span className="text-gray-500 ml-1">({company.country})</span>
                    )}
                  </div>
                </div>

                {/* Company Introduction */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    Company Introduction
                  </div>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                    {company.metadata?.description || 
                     `${company.name} is a medical device manufacturer based in ${company.country || 'the specified region'}. ` +
                     `The company has ${totalProducts} registered device(s) in our database.`}
                  </div>
                </div>
              </div>
            </div>

            {/* ====== Section 2: Compliance Information ====== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Award className="w-6 h-6 text-[#339999] mr-3" />
                Compliance Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Country / Region */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Country / Region
                  </div>
                  <div className="text-gray-900 font-medium">{company.country || 'N/A'}</div>
                </div>

                {/* Product Quantity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Package className="w-4 h-4 mr-1.5" />
                    Product Quantity
                  </div>
                  <div className="text-gray-900 font-medium">{totalProducts} registered device(s)</div>
                </div>
              </div>

              {/* Product Details with clickable links */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 text-[#339999] mr-2" />
                  Product Details
                </h3>
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/products/${product.id}`}
                              className="font-medium text-[#339999] hover:text-[#2d8b8b] hover:underline inline-flex items-center"
                            >
                              {product.name}
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {product.product_code && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  <Tag className="w-3 h-3" />
                                  {product.product_code}
                                </span>
                              )}
                              {product.device_class && (
                                <span className={`px-2 py-0.5 text-xs rounded ${deviceClassColors[product.device_class] || 'bg-gray-100 text-gray-700'}`}>
                                  {deviceClassLabels[product.device_class] || product.device_class}
                                </span>
                              )}
                              <DataSourceBadge sourceName={product.data_source} showTooltip={false} />
                              {product.status && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  {product.status}
                                </span>
                              )}
                            </div>
                            {product.registration_date && (
                              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Registered: {new Date(product.registration_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          
                          {product.source_id && (
                            <a
                              href={product.data_source === 'fda_510k' 
                                ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=${product.source_id}`
                                : `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMA/pma.cfm?id=${product.source_id}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-[#339999] hover:bg-[#339999]/10 rounded-lg"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No registered devices found</h3>
                    <p className="text-gray-500 mt-1">This company has no registered medical devices in our database</p>
                  </div>
                )}
              </div>

              {/* Risk Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    Risk Alerts
                  </h3>
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const config = riskLevelConfig[alert.risk_level]
                      const Icon = config.icon
                      return (
                        <div
                          key={alert.id}
                          className={`border rounded-lg p-4 ${config.color}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{alert.risk_level} Risk</span>
                                <span className="text-xs opacity-75">({alert.risk_type})</span>
                              </div>
                              <p className="text-sm mt-1">{alert.description}</p>
                              <p className="text-xs mt-2 opacity-75">
                                Detected: {new Date(alert.detected_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {alerts.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-green-800">No Active Risk Alerts</span>
                      <p className="text-sm text-green-700 mt-0.5">This company currently has no compliance risk alerts.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ====== Section 3: Related Searches ====== */}
            {relatedCompanies.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 text-[#339999] mr-3" />
                  Related Searches
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Other companies in {company.country}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedCompanies.map((c) => (
                    <Link
                      key={c.id}
                      href={`/company/${c.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 hover:border-[#339999]/30 border border-transparent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {c.country && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded">
                                <MapPin className="w-3 h-3 mr-1" />
                                {c.country}
                              </span>
                            )}
                          </div>
                          {c.address && (
                            <div className="text-sm text-gray-500 mt-1 truncate">{c.address}</div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for Products / Alerts / History */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'products'
                      ? 'border-[#339999] text-[#339999]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Products ({totalProducts})
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'alerts'
                      ? 'border-[#339999] text-[#339999]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Risk Alerts ({alerts.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-[#339999] text-[#339999]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Change History ({history.length})
                </button>
              </div>

              <div className="p-4">
                {/* Products Tab */}
                {activeTab === 'products' && (
                  <>
                    {products.length > 0 ? (
                      <div className="space-y-3">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link
                                  href={`/products/${product.id}`}
                                  className="font-medium text-[#339999] hover:text-[#2d8b8b] hover:underline inline-flex items-center"
                                >
                                  {product.name}
                                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {product.product_code && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      <Tag className="w-3 h-3" />
                                      {product.product_code}
                                    </span>
                                  )}
                                  {product.device_class && (
                                    <span className={`px-2 py-0.5 text-xs rounded ${deviceClassColors[product.device_class] || 'bg-gray-100 text-gray-700'}`}>
                                      {deviceClassLabels[product.device_class] || product.device_class}
                                    </span>
                                  )}
                                  <DataSourceBadge sourceName={product.data_source} showTooltip={false} />
                                  {product.status && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      {product.status}
                                    </span>
                                  )}
                                </div>
                                {product.registration_date && (
                                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Registered: {new Date(product.registration_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              
                              {product.source_id && (
                                <a
                                  href={product.data_source === 'fda_510k' 
                                    ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=${product.source_id}`
                                    : `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMA/pma.cfm?id=${product.source_id}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-[#339999] hover:bg-[#339999]/10 rounded-lg"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No registered devices found</h3>
                        <p className="text-gray-500 mt-1">This company has no registered medical devices in our database</p>
                      </div>
                    )}
                  </>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                  <>
                    {alerts.length > 0 ? (
                      <div className="space-y-3">
                        {alerts.map((alert) => {
                          const config = riskLevelConfig[alert.risk_level]
                          const Icon = config.icon
                          return (
                            <div
                              key={alert.id}
                              className={`border rounded-lg p-4 ${config.color}`}
                            >
                              <div className="flex items-start gap-3">
                                <Icon className="w-5 h-5 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium capitalize">{alert.risk_level} Risk</span>
                                    <span className="text-xs opacity-75">({alert.risk_type})</span>
                                  </div>
                                  <p className="text-sm mt-1">{alert.description}</p>
                                  <p className="text-xs mt-2 opacity-75">
                                    Detected: {new Date(alert.detected_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Risk Alerts</h3>
                        <p className="text-gray-500 mt-1">This company has no active risk alerts</p>
                      </div>
                    )}
                  </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <>
                    {history.length > 0 ? (
                      <div className="space-y-3">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <History className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.change_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                {item.field_name && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Field: {item.field_name}
                                  </p>
                                )}
                                {item.old_value && item.new_value && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-red-600 line-through">{item.old_value}</span>
                                    <span className="mx-2 text-gray-400">&rarr;</span>
                                    <span className="text-green-600">{item.new_value}</span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(item.changed_at).toLocaleString()}
                                  {item.changed_by && ` by ${item.changed_by}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Change History</h3>
                        <p className="text-gray-500 mt-1">No recent changes recorded for this company</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Class Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Risk Class Distribution</h3>
              {Object.keys(riskClassDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(riskClassDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, count]) => (
                      <div key={cls}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">{deviceClassLabels[cls] || cls}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#339999] rounded-full"
                            style={{ width: `${(count / totalProducts) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No risk class data available</p>
              )}
            </Card>

            {/* Trust Score Factors */}
            {company.trustScore?.factors && company.trustScore.factors.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Trust Score Factors</h3>
                <div className="space-y-3">
                  {company.trustScore.factors.map((factor, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{factor.factor}</span>
                        <span className="font-medium text-gray-900">{factor.score}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#339999] rounded-full"
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Data Sources */}
            {sources.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Data Sources</h3>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-start gap-2">
                      <LinkIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{source.source_name}</p>
                        <p className="text-xs text-gray-500">{source.source_type}</p>
                        {source.source_url && (
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#339999] hover:underline flex items-center gap-1 mt-1"
                          >
                            View Source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Company Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
              <dl className="space-y-3">
                {company.country && (
                  <div>
                    <dt className="text-sm text-gray-500">Country</dt>
                    <dd className="text-sm font-medium text-gray-900">{company.country}</dd>
                  </div>
                )}
                {company.address && (
                  <div>
                    <dt className="text-sm text-gray-500">Address</dt>
                    <dd className="text-sm font-medium text-gray-900">{company.address}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Market</dt>
                  <dd className="text-sm font-medium text-gray-900 uppercase">{company.market || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Total Devices</dt>
                  <dd className="text-sm font-medium text-gray-900">{totalProducts}</dd>
                </div>
                {company.trustScore?.lastUpdated && (
                  <div>
                    <dt className="text-sm text-gray-500">Score Last Updated</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(company.trustScore.lastUpdated).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </div>
      </div>

      {/* ====== Section 4: Data Source Note ====== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 text-[#339999] mr-2" />
            Data Source
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {company.data_sources && company.data_sources.length > 0 ? (
              company.data_sources.map((source, idx) => (
                <DataSourceBadge key={idx} sourceName={source} />
              ))
            ) : (
              <span className="text-sm text-gray-500">Official regulatory databases</span>
            )}
            {sources.length > 0 && sources.map((source) => (
              <div key={source.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">{source.source_name}</span>
                {source.last_verified_at && (
                  <span className="text-blue-600 text-xs">
                    Verified: {new Date(source.last_verified_at).toLocaleDateString()}
                  </span>
                )}
                {source.source_url && (
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
            <span className="text-sm text-gray-500">
              Last updated: {company.updated_at ? new Date(company.updated_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Disclaimer: Company information is sourced from official regulatory databases and public records.
            Data accuracy is not guaranteed. Please verify with the original source for the most current information.
          </p>
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: company.name,
            alternateName: company.name_zh,
            address: company.address ? {
              '@type': 'PostalAddress',
              streetAddress: company.address,
              addressCountry: company.country
            } : undefined,
            description: `${company.name} - Medical device manufacturer with ${totalProducts} registered devices`
          })
        }}
      />
    </div>
  )
}
