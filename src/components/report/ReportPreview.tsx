'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Building2,
  TrendingUp,
  Lock,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export type ReportType = 'compliance' | 'due-diligence' | 'summary' | 'full';

export interface ReportFeature {
  name: string;
  included: boolean;
  proOnly?: boolean;
}

export interface ReportPreviewProps {
  companyId: string;
  companyName: string;
  reportType: ReportType;
  onDownload: () => void;
  onPreview?: () => void;
  isPro?: boolean;
  usageCount?: number;
  usageLimit?: number;
  className?: string;
}

/**
 * 报告类型配置
 */
const reportConfig: Record<ReportType, {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  features: ReportFeature[];
  estimatedTime: string;
  pageCount: string;
}> = {
  compliance: {
    title: '合规性报告',
    description: '全面的合规状态分析，包括注册证书、监管历史和市场准入状态',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    estimatedTime: '2-3 分钟',
    pageCount: '8-12 页',
    features: [
      { name: '企业基本信息', included: true },
      { name: '注册证书清单', included: true },
      { name: '合规状态分析', included: true },
      { name: '风险识别', included: true },
      { name: '历史变更记录', included: true },
      { name: '跨市场对比', included: false, proOnly: true },
      { name: 'AI 智能分析', included: false, proOnly: true },
      { name: '定制化建议', included: false, proOnly: true }
    ]
  },
  'due-diligence': {
    title: '尽职调查报告',
    description: '深度尽职调查分析，适合投资、合作前的全面评估',
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    estimatedTime: '5-8 分钟',
    pageCount: '20-30 页',
    features: [
      { name: '企业背景调查', included: true },
      { name: '财务状况分析', included: true },
      { name: '法律风险评估', included: true },
      { name: '市场地位分析', included: true },
      { name: '竞争对手对比', included: true },
      { name: '供应链分析', included: false, proOnly: true },
      { name: '专利组合分析', included: false, proOnly: true },
      { name: '专家访谈摘要', included: false, proOnly: true }
    ]
  },
  summary: {
    title: '企业摘要报告',
    description: '快速了解企业核心信息，适合初步筛选和快速评估',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    estimatedTime: '30 秒',
    pageCount: '2-3 页',
    features: [
      { name: '企业概况', included: true },
      { name: '主要产品', included: true },
      { name: '市场分布', included: true },
      { name: '关键指标', included: true },
      { name: '风险提示', included: true },
      { name: '详细财务数据', included: false, proOnly: true },
      { name: '深度分析', included: false, proOnly: true },
      { name: '行业对比', included: false, proOnly: true }
    ]
  },
  full: {
    title: '完整分析报告',
    description: '包含所有模块的完整分析，最全面的企业画像',
    icon: TrendingUp,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    estimatedTime: '10-15 分钟',
    pageCount: '50+ 页',
    features: [
      { name: '所有基础功能', included: true },
      { name: '所有高级功能', included: true },
      { name: 'AI 深度分析', included: true },
      { name: '定制化章节', included: true },
      { name: '专家审核', included: true },
      { name: '数据可视化', included: true },
      { name: '趋势预测', included: true },
      { name: '战略建议', included: true }
    ]
  }
};

/**
 * PDF 报告预览卡片组件
 */
export function ReportPreview({
  companyName,
  reportType,
  onDownload,
  onPreview,
  isPro = false,
  usageCount = 0,
  usageLimit = 10,
  className = ''
}: ReportPreviewProps) {
  const config = reportConfig[reportType];
  const Icon = config.icon;

  const isProReport = reportType === 'full' || reportType === 'due-diligence';
  const canDownload = !isProReport || isPro;
  const remainingUsage = Math.max(0, usageLimit - usageCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-xl border border-gray-200 overflow-hidden
        hover:shadow-lg transition-shadow duration-300
        ${className}
      `}
    >
      {/* 头部 */}
      <div className={`${config.bgColor} p-6`}>
        <div className="flex items-start gap-4">
          <div className={`
            flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
            bg-white shadow-sm
          `}>
            <Icon className={`w-7 h-7 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
              {isProReport && (
                <Badge variant="primary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>

        {/* 报告元信息 */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{companyName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>预计 {config.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{config.pageCount}</span>
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">报告包含内容</h4>
        <div className="space-y-2">
          {config.features.map((feature, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between py-2 px-3 rounded-lg
                ${feature.included ? 'bg-gray-50' : 'bg-gray-50/50'}
              `}
            >
              <div className="flex items-center gap-2">
                {feature.included ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                  {feature.name}
                </span>
              </div>
              {feature.proOnly && !feature.included && (
                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                  PRO
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="px-6 pb-6">
        {isPro && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">本月剩余下载次数</span>
            <span className="text-sm font-medium text-gray-900">
              {remainingUsage} / {usageLimit}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {onPreview && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onPreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
          )}

          <Button
            variant="primary"
            className="flex-1"
            onClick={onDownload}
            disabled={!canDownload || remainingUsage === 0}
          >
            {canDownload ? (
              <>
                <Download className="w-4 h-4 mr-2" />
                {isPro ? '下载报告' : '免费下载'}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                升级 PRO
              </>
            )}
          </Button>
        </div>

        {!canDownload && (
          <p className="text-center text-xs text-gray-500 mt-3">
            此报告需要 PRO 会员才能下载
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default ReportPreview;
