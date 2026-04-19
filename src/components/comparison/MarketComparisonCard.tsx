'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type Market = 'FDA' | 'CE' | 'NMPA' | 'PMDA' | 'MHRA';
export type MarketStatus = 'active' | 'pending' | 'expired' | 'revoked' | 'not_registered';

export interface Certificate {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate?: string;
  status: MarketStatus;
}

export interface MarketData {
  market: Market;
  status: MarketStatus;
  registrations: number;
  lastUpdated: string;
  certificates?: Certificate[];
  notes?: string;
}

export interface MarketComparisonCardProps {
  companyId: string;
  markets: MarketData[];
  className?: string;
  onMarketClick?: (market: MarketData) => void;
}

/**
 * 市场配置
 */
const marketConfig: Record<Market, {
  name: string;
  fullName: string;
  flag: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  FDA: {
    name: 'FDA',
    fullName: '美国 FDA',
    flag: '🇺🇸',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  CE: {
    name: 'CE',
    fullName: '欧盟 CE',
    flag: '🇪🇺',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200'
  },
  NMPA: {
    name: 'NMPA',
    fullName: '中国 NMPA',
    flag: '🇨🇳',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  PMDA: {
    name: 'PMDA',
    fullName: '日本 PMDA',
    flag: '🇯🇵',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  MHRA: {
    name: 'MHRA',
    fullName: '英国 MHRA',
    flag: '🇬🇧',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
};

/**
 * 状态配置
 */
const statusConfig: Record<MarketStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  active: {
    label: '活跃',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  pending: {
    label: '待审批',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  expired: {
    label: '已过期',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  revoked: {
    label: '已吊销',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  not_registered: {
    label: '未注册',
    icon: Globe,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
};

/**
 * 市场列组件
 */
function MarketColumn({
  data,
  isExpanded,
  onToggle,
  onClick
}: {
  data: MarketData;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}) {
  const config = marketConfig[data.market];
  const status = statusConfig[data.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      className={`
        border rounded-xl overflow-hidden transition-all duration-200
        ${config.borderColor} bg-white
        ${isExpanded ? 'ring-2 ring-primary-100 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* 头部 */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.flag}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{config.name}</h4>
              <p className="text-xs text-gray-500">{config.fullName}</p>
            </div>
          </div>
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full
            ${status.bgColor} ${status.color}
          `}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{status.label}</span>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{data.registrations}</p>
            <p className="text-xs text-gray-500">注册产品</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">
              {data.certificates?.length || 0}
            </p>
            <p className="text-xs text-gray-500">证书数量</p>
          </div>
        </div>

        {/* 展开指示器 */}
        <div className="flex items-center justify-center mt-3 text-gray-400">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* 展开的证书列表 */}
      <AnimatePresence>
        {isExpanded && data.certificates && data.certificates.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-3">
              <h5 className="text-sm font-medium text-gray-700">证书列表</h5>
              {data.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{cert.type}</span>
                    <Badge
                      variant="outline"
                      className={`
                        text-xs
                        ${cert.status === 'active' ? 'border-green-200 text-green-600' : ''}
                        ${cert.status === 'expired' ? 'border-orange-200 text-orange-600' : ''}
                        ${cert.status === 'revoked' ? 'border-red-200 text-red-600' : ''}
                      `}
                    >
                      {statusConfig[cert.status].label}
                    </Badge>
                  </div>
                  <p className="text-gray-600">{cert.number}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      签发: {new Date(cert.issueDate).toLocaleDateString('zh-CN')}
                    </span>
                    {cert.expiryDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        到期: {new Date(cert.expiryDate).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部操作 */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            查看详情
          </Button>
        </div>
      )}
    </motion.div>
  );
}

/**
 * 跨市场比对卡片组件
 */
export function MarketComparisonCard({
  markets,
  className = '',
  onMarketClick
}: MarketComparisonCardProps) {
  const [expandedMarket, setExpandedMarket] = useState<Market | null>(null);

  // 统计
  const activeMarkets = markets.filter(m => m.status === 'active').length;
  const totalCertificates = markets.reduce((sum, m) => sum + (m.certificates?.length || 0), 0);

  return (
    <div className={className}>
      {/* 头部统计 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">全球市场布局</h3>
            <p className="text-sm text-gray-600 mt-1">
              覆盖 {markets.length} 个主要市场 · {activeMarkets} 个活跃市场
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-600">{totalCertificates}</p>
            <p className="text-sm text-gray-600">总证书数</p>
          </div>
        </div>
      </div>

      {/* 市场网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {markets.map((market) => (
          <MarketColumn
            key={market.market}
            data={market}
            isExpanded={expandedMarket === market.market}
            onToggle={() => setExpandedMarket(
              expandedMarket === market.market ? null : market.market
            )}
            onClick={() => onMarketClick?.(market)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {markets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">暂无市场数据</h3>
          <p className="text-gray-500 mt-1">该企业尚未在任何市场注册</p>
        </div>
      )}
    </div>
  );
}

export default MarketComparisonCard;
