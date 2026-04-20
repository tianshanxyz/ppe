'use client'

/**
 * 产品全球认证地图组件
 * 
 * 任务Q-002: 产品详情页重构 - 全球认证地图
 * 展示产品在全球各市场的认证状态
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  ExternalLink,
  FileText,
  Calendar,
  Shield,
  Info,
} from 'lucide-react'

interface MarketApproval {
  market_code: string
  market_name: string
  approval_status: 'approved' | 'pending' | 'not_required' | 'expired'
  approval_date?: string
  expiry_date?: string
  certification_number?: string
  certification_body?: string
  regulation?: string
  document_url?: string
  verification_url?: string
}

interface ProductCertificationMapProps {
  productName: string
  marketApprovals: MarketApproval[]
  className?: string
}

const marketConfig: Record<string, { name: string; region: string; flag: string }> = {
  US: { name: '美国', region: '北美', flag: '🇺🇸' },
  EU: { name: '欧盟', region: '欧洲', flag: '🇪🇺' },
  UK: { name: '英国', region: '欧洲', flag: '🇬🇧' },
  CN: { name: '中国', region: '亚洲', flag: '🇨🇳' },
  JP: { name: '日本', region: '亚洲', flag: '🇯🇵' },
  CA: { name: '加拿大', region: '北美', flag: '🇨🇦' },
  AU: { name: '澳大利亚', region: '大洋洲', flag: '🇦🇺' },
  KR: { name: '韩国', region: '亚洲', flag: '🇰🇷' },
  BR: { name: '巴西', region: '南美', flag: '🇧🇷' },
  IN: { name: '印度', region: '亚洲', flag: '🇮🇳' },
  RU: { name: '俄罗斯', region: '欧洲/亚洲', flag: '🇷🇺' },
  MX: { name: '墨西哥', region: '北美', flag: '🇲🇽' },
  SG: { name: '新加坡', region: '亚洲', flag: '🇸🇬' },
  MY: { name: '马来西亚', region: '亚洲', flag: '🇲🇾' },
  TH: { name: '泰国', region: '亚洲', flag: '🇹🇭' },
}

const statusConfig = {
  approved: {
    label: '已认证',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    description: '产品已获得该市场认证，可以合法销售',
  },
  pending: {
    label: '审核中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Clock,
    description: '认证申请已提交，正在审核中',
  },
  not_required: {
    label: '无需认证',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Info,
    description: '该产品在该市场无需强制认证',
  },
  expired: {
    label: '已过期',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: '认证已过期，需要续期',
  },
}

export function ProductCertificationMap({
  productName,
  marketApprovals,
  className = '',
}: ProductCertificationMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null)

  // 按地区分组
  const groupedByRegion = useMemo(() => {
    const groups: Record<string, MarketApproval[]> = {
      '北美': [],
      '欧洲': [],
      '亚洲': [],
      '南美': [],
      '大洋洲': [],
      '其他': [],
    }

    marketApprovals.forEach((approval) => {
      const config = marketConfig[approval.market_code]
      const region = config?.region || '其他'
      if (!groups[region]) {
        groups[region] = []
      }
      groups[region].push(approval)
    })

    return groups
  }, [marketApprovals])

  // 统计
  const stats = useMemo(() => {
    const total = marketApprovals.length
    const approved = marketApprovals.filter((a) => a.approval_status === 'approved').length
    const pending = marketApprovals.filter((a) => a.approval_status === 'pending').length
    const expired = marketApprovals.filter((a) => a.approval_status === 'expired').length

    return { total, approved, pending, expired }
  }, [marketApprovals])

  // 过滤后的市场
  const filteredMarkets = useMemo(() => {
    let markets = marketApprovals

    if (selectedRegion !== 'all') {
      markets = markets.filter((m) => {
        const config = marketConfig[m.market_code]
        return config?.region === selectedRegion
      })
    }

    if (selectedStatus !== 'all') {
      markets = markets.filter((m) => m.approval_status === selectedStatus)
    }

    return markets
  }, [marketApprovals, selectedRegion, selectedStatus])

  const regions = ['all', '北美', '欧洲', '亚洲', '南美', '大洋洲']

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">全球认证地图</h3>
          <p className="text-sm text-gray-500">{productName} 在各市场的认证状态</p>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-[#339999]" />
          <span className="text-sm font-medium text-gray-700">
            {stats.approved}/{stats.total} 市场已认证
          </span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-xs text-green-700">已认证</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-yellow-700">审核中</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-xs text-red-700">已过期</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round((stats.approved / stats.total) * 100) || 0}%
          </div>
          <div className="text-xs text-blue-700">覆盖率</div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-gray-500 py-1">地区:</span>
        {regions.map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedRegion === region
                ? 'bg-[#339999] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {region === 'all' ? '全部' : region}
          </button>
        ))}
      </div>

      {/* 市场列表 */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredMarkets.map((market) => {
            const config = marketConfig[market.market_code]
            const status = statusConfig[market.approval_status]
            const StatusIcon = status.icon
            const isExpanded = expandedMarket === market.market_code

            return (
              <motion.div
                key={market.market_code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isExpanded ? status.borderColor : 'border-gray-200'
                }`}
              >
                {/* 市场头部 */}
                <div
                  onClick={() => setExpandedMarket(isExpanded ? null : market.market_code)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isExpanded ? status.bgColor : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{config?.flag || '🌍'}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {config?.name || market.market_name}
                          <span className="ml-2 text-xs text-gray-400">({market.market_code})</span>
                        </h4>
                        <p className="text-xs text-gray-500">{config?.region || '其他'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="text-gray-400"
                      >
                        ▼
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* 展开详情 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {/* 状态说明 */}
                        <div className={`p-3 rounded-lg ${status.bgColor}`}>
                          <p className={`text-sm ${status.color}`}>{status.description}</p>
                        </div>

                        {/* 认证详情 */}
                        {market.approval_status === 'approved' && (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {market.certification_number && (
                              <div>
                                <span className="text-gray-500">认证编号:</span>
                                <p className="font-medium text-gray-900">{market.certification_number}</p>
                              </div>
                            )}
                            {market.certification_body && (
                              <div>
                                <span className="text-gray-500">认证机构:</span>
                                <p className="font-medium text-gray-900">{market.certification_body}</p>
                              </div>
                            )}
                            {market.approval_date && (
                              <div>
                                <span className="text-gray-500">批准日期:</span>
                                <p className="font-medium text-gray-900">
                                  {new Date(market.approval_date).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            )}
                            {market.expiry_date && (
                              <div>
                                <span className="text-gray-500">过期日期:</span>
                                <p className="font-medium text-gray-900">
                                  {new Date(market.expiry_date).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            )}
                            {market.regulation && (
                              <div className="col-span-2">
                                <span className="text-gray-500">适用法规:</span>
                                <p className="font-medium text-gray-900">{market.regulation}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-2 pt-2">
                          {market.verification_url && (
                            <a
                              href={market.verification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium"
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              验证认证
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                          {market.document_url && (
                            <a
                              href={market.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              查看证书
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* 空状态 */}
      {filteredMarkets.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无该地区的认证数据</p>
        </div>
      )}

      {/* 图例 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">状态说明</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="flex items-center text-sm">
                <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                <span className="text-gray-600">{config.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
