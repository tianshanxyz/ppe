'use client'

/**
 * 增强版产品详情页
 *
 * 任务Q-002: 产品详情页重构
 * 包含：全球认证地图、竞品对比、技术规格、认证详情
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package,
  Shield,
  Globe,
  FileText,
  Scale,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Award,
  TrendingUp,
  Info,
} from 'lucide-react'
import { ProductCertificationMap } from '@/components/product/ProductCertificationMap'
import { ProductComparison } from '@/components/product/ProductComparison'
import { EnhancedPPEProduct } from '@/lib/database/enhanced-types'

// 标签页组件
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
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
    </button>
  )
}

export default function EnhancedProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [product, setProduct] = useState<EnhancedPPEProduct | null>(null)
  const [comparisonProducts, setComparisonProducts] = useState<EnhancedPPEProduct[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟数据加载
  useEffect(() => {
    const mockProduct: EnhancedPPEProduct = {
      id: productId,
      product_name: '3M N95 Respirator 8210',
      product_name_zh: '3M N95 呼吸防护口罩 8210',
      product_code: '8210',
      product_category: 'respiratory_protection',
      sub_category: 'disposable_respirator',
      ppe_category: 'II',
      description: 'The 3M 8210 N95 respirator is designed to help provide comfortable, reliable worker respiratory protection against certain non-oil based particles.',
      description_zh: '3M 8210 N95呼吸防护口罩旨在为劳动者提供舒适、可靠的呼吸防护，防护某些非油性颗粒物。',
      intended_use: ['industrial_protection', 'healthcare', 'construction'],
      target_users: ['healthcare_workers', 'industrial_workers', 'general_public'],
      specifications: {
        material: 'Polypropylene',
        filtration_efficiency: 95,
        protection_level: 'N95',
        weight: { value: 10, unit: 'g' },
        packaging: {
          quantity_per_box: 20,
          boxes_per_carton: 8,
        },
      },
      features: {
        key_features: ['N95 filtration', 'Comfortable fit', 'Adjustable noseclip'],
        advantages: ['High filtration efficiency', 'Lightweight', 'Cost-effective'],
        certifications_highlight: ['NIOSH Approved', 'FDA Cleared'],
      },
      manufacturer_id: '3m-company',
      manufacturer_name: '3M Company',
      manufacturer_name_zh: '3M公司',
      manufacturer_country: 'United States',
      brand_name: '3M',
      certifications: {
        fda_510k: {
          k_number: 'K123456',
          device_name: 'N95 Respirator',
          applicant: '3M Company',
          decision: 'Substantially Equivalent',
          decision_date: '2020-01-15',
          product_code: 'NZJ',
          device_class: 'II',
          status: 'active',
        },
        ce: {
          certificate_number: 'CE0123',
          notified_body: {
            name: 'BSI Group',
            code: '0086',
            country: 'United Kingdom',
          },
          directive: 'PPE 2016/425',
          classification: 'Category III',
          issue_date: '2019-06-01',
          expiry_date: '2024-05-31',
          status: 'active',
        },
      },
      target_markets: ['US', 'EU', 'CA', 'AU', 'JP'],
      market_approvals: [
        {
          market_code: 'US',
          market_name: 'United States',
          approval_status: 'approved',
          approval_date: '2020-01-15',
          certification_number: 'K123456',
          certification_body: 'FDA',
          regulation: '21 CFR 878.4040',
          verification_url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm',
        },
        {
          market_code: 'EU',
          market_name: 'European Union',
          approval_status: 'approved',
          approval_date: '2019-06-01',
          expiry_date: '2024-05-31',
          certification_number: 'CE0123',
          certification_body: 'BSI Group',
          regulation: 'PPE Regulation (EU) 2016/425',
        },
        {
          market_code: 'CN',
          market_name: 'China',
          approval_status: 'pending',
        },
        {
          market_code: 'JP',
          market_name: 'Japan',
          approval_status: 'approved',
          approval_date: '2020-03-20',
          certification_number: 'PMDA-2020-1234',
          certification_body: 'PMDA',
        },
        {
          market_code: 'BR',
          market_name: 'Brazil',
          approval_status: 'not_required',
        },
      ],
      registration_status: 'active',
      applicable_regulations: ['FDA 21 CFR 878.4040', 'PPE Regulation (EU) 2016/425'],
      harmonized_standards: [
        { standard_number: 'EN 149:2001+A1:2009', standard_name: 'Respiratory protective devices', version: '2009' },
        { standard_number: '42 CFR 84', standard_name: 'NIOSH Respirator Approval', version: '1995' },
      ],
      risk_classification: 'Class II',
      approval_date: '2020-01-15',
      expiry_date: '2025-01-14',
      created_at: '2020-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      last_sync_at: '2024-01-15T00:00:00Z',
      data_quality_score: 92,
      data_completeness: {
        basic_info: 100,
        specifications: 85,
        certifications: 95,
        test_reports: 80,
      },
    } as any

    setTimeout(() => {
      setProduct(mockProduct)
      setComparisonProducts([mockProduct])
      setLoading(false)
    }, 500)
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">产品未找到</h2>
          <p className="text-gray-500 mt-2">该产品信息不存在或已被删除</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部信息 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.registration_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.registration_status === 'active' ? '活跃' : '过期'}
                </span>
              </div>
              {product.product_name_zh && (
                <p className="text-lg text-gray-600 mt-1">{product.product_name_zh}</p>
              )}
              <p className="text-gray-500 mt-2 max-w-3xl">{product.description}</p>

              {/* 基本信息 */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {product.manufacturer_name}
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  {product.manufacturer_country}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  批准日期: {new Date(product.approval_date).toLocaleDateString('zh-CN')}
                </div>
              </div>

              {/* 认证标签 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {product.certifications?.fda_510k && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Award className="w-3 h-3 mr-1" />
                    FDA {product.certifications.fda_510k.k_number}
                  </span>
                )}
                {product.certifications?.ce && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    CE {product.certifications.ce.certificate_number}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  数据质量 {product.data_quality_score}分
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 md:mt-0 md:ml-8 flex flex-col space-y-2">
              <button className="inline-flex items-center justify-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors">
                <Scale className="w-4 h-4 mr-2" />
                加入对比
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                下载报告
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {product.market_approvals?.filter((m) => m.approval_status === 'approved').length || 0}
              </div>
              <div className="text-sm text-gray-500">已认证市场</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{product.ppe_category}</div>
              <div className="text-sm text-gray-500">PPE类别</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {product.specifications?.filtration_efficiency || '-'}%
              </div>
              <div className="text-sm text-gray-500">过滤效率</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{product.data_quality_score}</div>
              <div className="text-sm text-gray-500">数据质量</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Package} label="概览" />
            <TabButton active={activeTab === 'certifications'} onClick={() => setActiveTab('certifications')} icon={Shield} label="认证详情" />
            <TabButton active={activeTab === 'markets'} onClick={() => setActiveTab('markets')} icon={Globe} label="全球市场" />
            <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} icon={FileText} label="技术规格" />
            <TabButton active={activeTab === 'compare'} onClick={() => setActiveTab('compare')} icon={Scale} label="竞品对比" />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* 概览页 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductCertificationMap productName={product.product_name} marketApprovals={product.market_approvals || []} />

              {/* 认证概览 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">认证概览</h3>
                <div className="space-y-4">
                  {product.certifications?.fda_510k && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-blue-500 mr-2" />
                        <h4 className="font-medium text-blue-900">FDA 510(k)</h4>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">K号: {product.certifications.fda_510k.k_number}</p>
                      <p className="text-sm text-blue-700">决定: {product.certifications.fda_510k.decision}</p>
                    </div>
                  )}
                  {product.certifications?.ce && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-green-500 mr-2" />
                        <h4 className="font-medium text-green-900">CE认证</h4>
                      </div>
                      <p className="text-sm text-green-700 mt-1">证书号: {product.certifications.ce.certificate_number}</p>
                      <p className="text-sm text-green-700">公告机构: {product.certifications.ce.notified_body?.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 认证详情页 */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              {product.certifications?.fda_510k && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">FDA 510(k) 详情</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">K号</span>
                      <p className="font-medium">{product.certifications.fda_510k.k_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">设备名称</span>
                      <p className="font-medium">{product.certifications.fda_510k.device_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">申请人</span>
                      <p className="font-medium">{product.certifications.fda_510k.applicant}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">决定</span>
                      <p className="font-medium">{product.certifications.fda_510k.decision}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">决定日期</span>
                      <p className="font-medium">
                        {new Date(product.certifications.fda_510k.decision_date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">产品代码</span>
                      <p className="font-medium">{product.certifications.fda_510k.product_code}</p>
                    </div>
                  </div>
                </div>
              )}

              {product.certifications?.ce && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CE认证详情</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">证书号</span>
                      <p className="font-medium">{product.certifications.ce.certificate_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">公告机构</span>
                      <p className="font-medium">
                        {product.certifications.ce.notified_body?.name} ({product.certifications.ce.notified_body?.code})
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">指令</span>
                      <p className="font-medium">{product.certifications.ce.directive}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">分类</span>
                      <p className="font-medium">{product.certifications.ce.classification}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">签发日期</span>
                      <p className="font-medium">
                        {new Date(product.certifications.ce.issue_date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">过期日期</span>
                      <p className="font-medium">
                        {new Date(product.certifications.ce.expiry_date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 适用标准 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">适用标准</h3>
                <div className="space-y-3">
                  {product.harmonized_standards?.map((standard, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{standard.standard_number}</p>
                        <p className="text-sm text-gray-500">{standard.standard_name}</p>
                      </div>
                      <span className="text-xs text-gray-400">版本: {standard.version}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 全球市场页 */}
          {activeTab === 'markets' && <ProductCertificationMap productName={product.product_name} marketApprovals={product.market_approvals || []} />}

          {/* 技术规格页 */}
          {activeTab === 'specs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">技术规格</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">物理规格</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">材料</span>
                      <span className="font-medium">{product.specifications?.material || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">重量</span>
                      <span className="font-medium">
                        {product.specifications?.weight ? `${product.specifications.weight.value} ${product.specifications.weight.unit}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">性能规格</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">过滤效率</span>
                      <span className="font-medium">{product.specifications?.filtration_efficiency ? `${product.specifications.filtration_efficiency}%` : '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">防护等级</span>
                      <span className="font-medium">{product.specifications?.protection_level || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 包装规格 */}
              {product.specifications?.packaging && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">包装规格</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">每盒数量</span>
                      <p className="text-lg font-semibold text-gray-900">{product.specifications.packaging.quantity_per_box}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">每箱盒数</span>
                      <p className="text-lg font-semibold text-gray-900">{product.specifications.packaging.boxes_per_carton}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 竞品对比页 */}
          {activeTab === 'compare' && (
            <ProductComparison
              products={comparisonProducts}
              onRemoveProduct={(id) => setComparisonProducts((prev) => prev.filter((p) => p.id !== id))}
              onAddProduct={() => {
                // TODO: 实现添加产品逻辑
                alert('添加产品功能待实现')
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
