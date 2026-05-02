'use client'

/**
 * 增强版企业详情页
 * 
 * 任务Q-001: 企业详情页重构
 * 包含：关联图谱、风险雷达、合规统计、产品列表
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  BadgeCheck,
  AlertTriangle,
  CheckCircle,
  Package,
  FileText,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react'
import { CompanyRiskRadar } from '@/components/company/CompanyRiskRadar'
import { CompanyRelationGraph } from '@/components/company/CompanyRelationGraph'
import { EnhancedPPEManufacturer, EnhancedPPEProduct } from '@/lib/database/enhanced-types'

// 标签页组件
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-[#339999] text-[#339999]'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
      {count !== undefined && (
        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}

export default function EnhancedCompanyDetailPage() {
  const params = useParams()
  const companyId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [company, setCompany] = useState<EnhancedPPEManufacturer | null>(null)
  const [products, setProducts] = useState<EnhancedPPEProduct[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟数据加载
  useEffect(() => {
    // TODO: 替换为真实API调用
    const mockCompany: EnhancedPPEManufacturer = {
      id: companyId,
      company_name: '3M Company',
      company_name_en: '3M Company',
      company_name_zh: '3M公司',
      headquarters_address: {
        city: 'Saint Paul',
        state_province: 'Minnesota',
        country: 'United States',
        full_address: '3M Center, Saint Paul, MN 55144',
      },
      contact: {
        website: 'https://www.3m.com',
        email: 'info@3m.com',
        phone: '+1-888-364-3577',
      },
      business_type: 'manufacturer',
      description: '3M is a global science company that never stops inventing. Using 46 technology platforms, our integrated team of scientists and researchers works with customers to create breakthroughs.',
      credit_score: {
        overall_score: 92,
        last_calculated: new Date().toISOString(),
        dimensions: {
          compliance_history: {
            score: 95,
            total_certifications: 156,
            active_certifications: 142,
            avg_certification_duration_days: 1095,
          },
          risk_events: {
            score: 88,
            recalls_count: 2,
            warning_letters_count: 1,
            import_alerts_count: 0,
          },
          activity: {
            score: 90,
            certifications_last_year: 15,
            new_markets_last_year: 3,
          },
          diversity: {
            score: 95,
            market_count: 12,
            product_category_count: 8,
            certification_type_count: 6,
          },
        },
        risk_level: 'low',
        risk_factors: [],
        score_history: [],
      },
      compliance_stats: {
        total_products: 156,
        active_products: 142,
        total_certifications: 312,
        active_certifications: 284,
        markets_served: ['US', 'EU', 'UK', 'CN', 'JP', 'CA', 'AU'],
        recalls_history: {
          total_recalls: 2,
          last_recall_date: '2023-06-15',
        },
        warning_letters: {
          total: 1,
          open_count: 0,
        },
      },
      registration_info: {
        registration_number: '3M-REG-001',
        registration_country: 'United States',
        registration_date: '1902-01-01',
        legal_form: 'Corporation',
      },
      capabilities: {
        product_categories: ['Respiratory Protection', 'Hand Protection', 'Eye Protection', 'Hearing Protection', 'Head Protection', 'Fall Protection'],
        certifications_held: ['ISO 9001', 'ISO 13485', 'FDA 510(k)', 'CE Marking', 'NIOSH'],
        production_facilities: [
          {
            location: 'Saint Paul, MN, USA',
            certifications: ['ISO 9001', 'ISO 13485'],
          },
          {
            location: 'Wroclaw, Poland',
            certifications: ['CE Marking', 'ISO 9001'],
          },
        ],
        quality_systems: ['ISO 9001', 'ISO 13485', 'FDA QSR'],
      },
      last_sync_at: new Date().toISOString(),
      related_companies: [
        {
          company_id: '3m-healthcare',
          company_name: '3M Healthcare',
          relationship: 'subsidiary',
          ownership_percentage: 100,
        },
        {
          company_id: '3m-europe',
          company_name: '3M Europe',
          relationship: 'subsidiary',
          ownership_percentage: 100,
        },
        {
          company_id: '3m-china',
          company_name: '3M China',
          relationship: 'subsidiary',
          ownership_percentage: 100,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data_verified: true,
      data_quality_score: 95,
    }

    const mockProducts: EnhancedPPEProduct[] = [
      {
        id: 'product-1',
        product_name: '3M N95 Respirator 8210',
        product_category: 'respiratory_protection',
        manufacturer_name: '3M Company',
        manufacturer_country: 'United States',
        certifications: {
          fda_510k: {
            k_number: 'K123456',
            device_name: 'N95 Respirator',
            status: 'active',
          },
        },
        target_markets: ['US', 'CA'],
        registration_status: 'active',
        approval_date: '2020-01-15',
        data_quality_score: 90,
      },
      // ... 更多产品
    ] as any

    setTimeout(() => {
      setCompany(mockCompany)
      setProducts(mockProducts)
      setLoading(false)
    }, 500)
  }, [companyId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">企业未找到</h2>
          <p className="text-gray-500 mt-2">该企业信息不存在或已被删除</p>
        </div>
      </div>
    )
  }

  const stats = company.compliance_stats as any

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部信息 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{company.company_name}</h1>
                {company.data_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    已验证
                  </span>
                )}
              </div>
              {company.company_name_zh && (
                <p className="text-lg text-gray-600 mt-1">{company.company_name_zh}</p>
              )}
              <p className="text-gray-500 mt-2 max-w-3xl">{company.description}</p>

              {/* 基本信息 */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                {company.headquarters_address && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {company.headquarters_address.city}, {company.headquarters_address.country}
                  </div>
                )}
                {company.contact?.website && (
                  <a
                    href={company.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#339999] hover:underline"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    官网
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  数据更新: {new Date(company.updated_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {/* 信用评分卡片 */}
            {company.credit_score && (
              <div className="mt-6 md:mt-0 md:ml-8">
                <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl p-6 text-white">
                  <div className="text-sm opacity-90">信用评分</div>
                  <div className="text-4xl font-bold mt-1">{company.credit_score.overall_score}</div>
                  <div className="text-sm opacity-90 mt-1">/ 100</div>
                  <div className="mt-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {company.credit_score.risk_level === 'low' ? '低风险企业' : '中风险企业'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats?.total_products || 0}</div>
              <div className="text-sm text-gray-500">总产品数</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats?.active_certifications || 0}</div>
              <div className="text-sm text-gray-500">活跃认证</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats?.markets_served?.length || 0}</div>
              <div className="text-sm text-gray-500">覆盖市场</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{company.data_quality_score || 0}</div>
              <div className="text-sm text-gray-500">数据质量</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={Building2}
              label="概览"
            />
            <TabButton
              active={activeTab === 'risk'}
              onClick={() => setActiveTab('risk')}
              icon={AlertTriangle}
              label="风险评估"
            />
            <TabButton
              active={activeTab === 'relations'}
              onClick={() => setActiveTab('relations')}
              icon={Globe}
              label="关联企业"
              count={company.related_companies?.length}
            />
            <TabButton
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={Package}
              label="产品列表"
              count={stats?.total_products}
            />
            <TabButton
              active={activeTab === 'compliance'}
              onClick={() => setActiveTab('compliance')}
              icon={FileText}
              label="合规记录"
            />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 概览页 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {company.credit_score && (
                <CompanyRiskRadar creditScore={company.credit_score} />
              )}
              <CompanyRelationGraph
                companyName={company.company_name}
                relatedCompanies={company.related_companies || []}
              />
            </div>
          )}

          {/* 风险评估页 */}
          {activeTab === 'risk' && company.credit_score && (
            <div className="max-w-3xl mx-auto">
              <CompanyRiskRadar creditScore={company.credit_score} className="mb-6" />
              
              {/* 风险详情 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">风险详情</h3>
                
                {stats?.recalls_history?.total_recalls > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <h4 className="font-medium text-red-800">召回记录</h4>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        该企业有 {stats.recalls_history.total_recalls} 次召回记录
                        {stats.recalls_history.last_recall_date &&
                          `，最近一次在 ${stats.recalls_history.last_recall_date}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="font-medium text-green-800">无召回记录</h4>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      该企业在我们的数据库中没有召回记录
                    </p>
                  </div>
                )}

                {stats?.warning_letters?.total > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-yellow-500 mr-2" />
                      <h4 className="font-medium text-yellow-800">警告信</h4>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      该企业有 {stats.warning_letters.total} 封警告信
                      {stats.warning_letters.open_count > 0 &&
                        `，其中 ${stats.warning_letters.open_count} 封未关闭`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 关联企业页 */}
          {activeTab === 'relations' && (
            <CompanyRelationGraph
              companyName={company.company_name}
              relatedCompanies={company.related_companies || []}
            />
          )}

          {/* 产品列表页 */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">产品列表</h3>
                <p className="text-sm text-gray-500 mt-1">
                  共 {stats?.total_products || 0} 个产品，其中 {stats?.active_products || 0} 个活跃
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">
                            {product.product_name}
                          </h4>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span>{product.product_category}</span>
                            <span>•</span>
                            <span>{product.manufacturer_country}</span>
                            {product.certifications?.fda_510k && (
                              <>
                                <span>•</span>
                                <span className="text-[#339999]">
                                  FDA {product.certifications.fda_510k.k_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.registration_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.registration_status === 'active' ? '活跃' : '过期'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无产品数据</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 合规记录页 */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {/* 认证统计 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">认证统计</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.total_certifications || 0}
                    </div>
                    <div className="text-sm text-gray-500">总认证数</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.active_certifications || 0}
                    </div>
                    <div className="text-sm text-gray-500">活跃认证</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Globe className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.markets_served?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">覆盖市场</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(((stats?.active_certifications || 0) / (stats?.total_certifications || 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">活跃率</div>
                  </div>
                </div>
              </div>

              {/* 覆盖市场 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">覆盖市场</h3>
                <div className="flex flex-wrap gap-2">
                  {stats?.markets_served?.map((market: string) => (
                    <span
                      key={market}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {market}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
