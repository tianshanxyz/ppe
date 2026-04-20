'use client'

/**
 * 产品竞品对比组件
 *
 * 任务Q-002: 产品详情页重构 - 竞品对比
 * 支持多个产品并排对比
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Plus,
  Scale,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Globe,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { EnhancedPPEProduct } from '@/lib/database/enhanced-types'

interface ProductComparisonProps {
  products: EnhancedPPEProduct[]
  onRemoveProduct?: (productId: string) => void
  onAddProduct?: () => void
  className?: string
}

export function ProductComparison({
  products,
  onRemoveProduct,
  onAddProduct,
  className = '',
}: ProductComparisonProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'certifications'])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  const isExpanded = (section: string) => expandedSections.includes(section)

  // 对比维度配置
  const comparisonSections = [
    {
      id: 'basic',
      title: '基本信息',
      icon: Shield,
      fields: [
        { key: 'product_name', label: '产品名称', type: 'text' },
        { key: 'manufacturer_name', label: '制造商', type: 'text' },
        { key: 'manufacturer_country', label: '制造国家', type: 'text' },
        { key: 'product_category', label: '产品类别', type: 'text' },
        { key: 'ppe_category', label: 'PPE类别', type: 'text' },
        { key: 'registration_status', label: '注册状态', type: 'status' },
      ],
    },
    {
      id: 'certifications',
      title: '认证情况',
      icon: Award,
      fields: [
        { key: 'certifications.fda_510k', label: 'FDA 510(k)', type: 'cert' },
        { key: 'certifications.ce', label: 'CE认证', type: 'cert' },
        { key: 'certifications.nmpa', label: 'NMPA', type: 'cert' },
        { key: 'certifications.ukca', label: 'UKCA', type: 'cert' },
        { key: 'target_markets', label: '目标市场数', type: 'count' },
      ],
    },
    {
      id: 'specs',
      title: '技术规格',
      icon: TrendingUp,
      fields: [
        { key: 'specifications.material', label: '材料', type: 'text' },
        { key: 'specifications.filtration_efficiency', label: '过滤效率', type: 'percentage' },
        { key: 'specifications.protection_level', label: '防护等级', type: 'text' },
        { key: 'specifications.weight', label: '重量', type: 'weight' },
      ],
    },
    {
      id: 'market',
      title: '市场表现',
      icon: Globe,
      fields: [
        { key: 'approval_date', label: '批准日期', type: 'date' },
        { key: 'expiry_date', label: '过期日期', type: 'date' },
        { key: 'data_quality_score', label: '数据质量', type: 'score' },
      ],
    },
  ]

  // 获取字段值
  const getFieldValue = (product: EnhancedPPEProduct, fieldKey: string): any => {
    const keys = fieldKey.split('.')
    let value: any = product
    for (const key of keys) {
      value = value?.[key]
    }
    return value
  }

  // 渲染字段值
  const renderFieldValue = (value: any, type: string) => {
    switch (type) {
      case 'text':
        return value || '-'
      case 'status':
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              value === 'active'
                ? 'bg-green-100 text-green-800'
                : value === 'expired'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {value === 'active' ? '活跃' : value === 'expired' ? '过期' : value || '-'}
          </span>
        )
      case 'cert':
        return value ? (
          <div className="flex items-center text-green-600">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-sm">{value.k_number || value.certificate_number || '已认证'}</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-400">
            <XCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">未认证</span>
          </div>
        )
      case 'count':
        return Array.isArray(value) ? value.length : value || 0
      case 'percentage':
        return value ? `${value}%` : '-'
      case 'weight':
        return value ? `${value.value} ${value.unit}` : '-'
      case 'date':
        return value ? new Date(value).toLocaleDateString('zh-CN') : '-'
      case 'score':
        return value ? (
          <div className="flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
              <div
                className="bg-[#339999] h-2 rounded-full"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ) : (
          '-'
        )
      default:
        return value || '-'
    }
  }

  if (products.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center ${className}`}>
        <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">开始对比</h3>
        <p className="text-gray-500 mt-1">添加产品进行对比分析</p>
        {onAddProduct && (
          <button
            onClick={onAddProduct}
            className="mt-4 inline-flex items-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加产品
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">产品对比</h3>
            <p className="text-sm text-gray-500">{products.length} 个产品并排对比</p>
          </div>
          {onAddProduct && products.length < 4 && (
            <button
              onClick={onAddProduct}
              className="inline-flex items-center px-3 py-1.5 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加产品
            </button>
          )}
        </div>
      </div>

      {/* 对比表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-48 sticky left-0 bg-gray-50 z-10">
                对比项目
              </th>
              {products.map((product) => (
                <th key={product.id} className="px-4 py-4 text-left min-w-[200px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-2">{product.product_name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{product.manufacturer_name}</p>
                    </div>
                    {onRemoveProduct && products.length > 1 && (
                      <button
                        onClick={() => onRemoveProduct(product.id)}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonSections.map((section) => {
              const SectionIcon = section.icon
              const expanded = isExpanded(section.id)

              return (
                <>
                  {/* 分组标题 */}
                  <tr
                    key={section.id}
                    className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <td colSpan={products.length + 1} className="px-6 py-3">
                      <div className="flex items-center">
                        <SectionIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{section.title}</span>
                        {expanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* 分组内容 */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={products.length + 1} className="p-0">
                          <table className="w-full">
                            <tbody>
                              {section.fields.map((field) => (
                                <tr key={field.key} className="border-b border-gray-100 last:border-b-0">
                                  <td className="px-6 py-3 text-sm text-gray-500 w-48 sticky left-0 bg-white">
                                    {field.label}
                                  </td>
                                  {products.map((product) => {
                                    const value = getFieldValue(product, field.key)
                                    return (
                                      <td key={product.id} className="px-4 py-3 text-sm text-gray-900 min-w-[200px]">
                                        {renderFieldValue(value, field.type)}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部提示 */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        <p>💡 点击分组标题可展开/收起详情。最多可同时对比 4 个产品。</p>
      </div>
    </div>
  )
}
