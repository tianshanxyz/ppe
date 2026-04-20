'use client'

/**
 * 企业关联图谱组件
 * 
 * 任务Q-001: 企业详情页重构 - 关联图谱
 * 展示制造商的关联企业网络
 */

import { useState, useMemo } from 'react'
import { Building2, Link2, Users, Factory, Store, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RelatedCompany {
  company_id: string
  company_name: string
  relationship: 'parent' | 'subsidiary' | 'sibling' | 'affiliate'
  ownership_percentage?: number
  country?: string
  business_type?: string
}

interface CompanyRelationGraphProps {
  companyName: string
  relatedCompanies: RelatedCompany[]
  className?: string
}

const relationshipConfig = {
  parent: {
    label: '母公司',
    icon: Building2,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
  },
  subsidiary: {
    label: '子公司',
    icon: Factory,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
  },
  sibling: {
    label: '兄弟公司',
    icon: Users,
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
  },
  affiliate: {
    label: '关联公司',
    icon: Link2,
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50',
  },
}

export function CompanyRelationGraph({
  companyName,
  relatedCompanies,
  className = '',
}: CompanyRelationGraphProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // 按关系类型分组
  const groupedCompanies = useMemo(() => {
    const groups: Record<string, RelatedCompany[]> = {
      parent: [],
      subsidiary: [],
      sibling: [],
      affiliate: [],
    }

    relatedCompanies.forEach((company) => {
      if (groups[company.relationship]) {
        groups[company.relationship].push(company)
      }
    })

    return groups
  }, [relatedCompanies])

  // 过滤后的公司
  const filteredCompanies = useMemo(() => {
    if (filter === 'all') return relatedCompanies
    return relatedCompanies.filter((c) => c.relationship === filter)
  }, [relatedCompanies, filter])

  // 统计
  const stats = useMemo(() => {
    return {
      total: relatedCompanies.length,
      parent: groupedCompanies.parent.length,
      subsidiary: groupedCompanies.subsidiary.length,
      sibling: groupedCompanies.sibling.length,
      affiliate: groupedCompanies.affiliate.length,
    }
  }, [groupedCompanies, relatedCompanies])

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">关联企业图谱</h3>
          <p className="text-sm text-gray-500">{companyName} 的企业关系网络</p>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">共 {stats.total} 家关联企业</span>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部 ({stats.total})
        </button>
        {Object.entries(relationshipConfig).map(([key, config]) => {
          const count = stats[key as keyof typeof stats]
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-1 ${config.borderColor}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* 中心企业 */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#339999] to-[#2d8b8b] flex items-center justify-center shadow-lg">
            <div className="text-center text-white">
              <Store className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs font-medium">当前企业</span>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {companyName.length > 15 ? companyName.slice(0, 15) + '...' : companyName}
            </span>
          </div>
        </div>
      </div>

      {/* 关联企业列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredCompanies.map((company, index) => {
            const config = relationshipConfig[company.relationship]
            const Icon = config.icon
            const isSelected = selectedCompany === company.company_id

            return (
              <motion.div
                key={company.company_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCompany(isSelected ? null : company.company_id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor} shadow-md`
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {company.company_name}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </span>
                      {company.ownership_percentage && (
                        <span className="text-xs text-gray-500">
                          持股 {company.ownership_percentage}%
                        </span>
                      )}
                    </div>
                    {company.country && (
                      <p className="text-xs text-gray-400 mt-1">
                        {company.country}
                      </p>
                    )}
                  </div>
                </div>

                {/* 展开详情 */}
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">企业ID:</span>
                        <span className="text-gray-900 font-mono">{company.company_id}</span>
                      </div>
                      {company.business_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">业务类型:</span>
                          <span className="text-gray-900">{company.business_type}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">关系类型:</span>
                        <span className={config.textColor}>{config.label}</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium">
                      查看详情 →
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* 空状态 */}
      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无关联企业数据</p>
        </div>
      )}

      {/* 图例 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">关系说明</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(relationshipConfig).map(([key, config]) => (
            <div key={key} className="flex items-center text-xs text-gray-600">
              <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
