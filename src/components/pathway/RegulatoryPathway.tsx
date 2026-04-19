'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type Market = 'FDA' | 'CE' | 'NMPA';
export type PathwayType = '510(k)' | 'PMA' | 'CE Certification' | '注册证';
export type DeviceClass = 'I' | 'IIa' | 'IIb' | 'III';

export interface PathwayStep {
  step: number;
  title: string;
  description: string;
  estimatedDays: number;
  requirements: string[];
  optional?: boolean;
}

export interface RegulatoryPathwayProps {
  market: Market;
  pathwayType: PathwayType;
  deviceClass: DeviceClass;
  steps: PathwayStep[];
  averageDays: number;
  successRate?: number;
  className?: string;
}

/**
 * 市场配置
 */
const marketConfig: Record<Market, {
  name: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  FDA: {
    name: '美国 FDA',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Building2
  },
  CE: {
    name: '欧盟 CE',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    icon: Building2
  },
  NMPA: {
    name: '中国 NMPA',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: Building2
  }
};

/**
 * 设备分类配置
 */
const deviceClassConfig: Record<DeviceClass, {
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}> = {
  I: {
    label: 'I 类',
    description: '低风险设备',
    riskLevel: 'low'
  },
  IIa: {
    label: 'IIa 类',
    description: '中低风险设备',
    riskLevel: 'medium'
  },
  IIb: {
    label: 'IIb 类',
    description: '中高风险设备',
    riskLevel: 'medium'
  },
  III: {
    label: 'III 类',
    description: '高风险设备',
    riskLevel: 'high'
  }
};

/**
 * 合规路径步骤组件
 */
function PathwayStepItem({
  step,
  isLast,
  isExpanded,
  onToggle
}: {
  step: PathwayStep;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex gap-4">
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* 步骤编号 */}
      <div className={`
        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
        ${step.optional ? 'bg-gray-100 border-2 border-dashed border-gray-300' : 'bg-primary-500'}
        z-10
      `}>
        {step.optional ? (
          <span className="text-gray-500 font-medium text-sm">{step.step}</span>
        ) : (
          <span className="text-white font-bold">{step.step}</span>
        )}
      </div>

      {/* 步骤内容 */}
      <div className="flex-1 pb-8">
        <motion.div
          layout
          onClick={onToggle}
          className={`
            bg-white border rounded-xl p-4 cursor-pointer transition-all
            ${step.optional ? 'border-gray-200 border-dashed' : 'border-gray-200'}
            ${isExpanded ? 'ring-2 ring-primary-100 shadow-md' : 'hover:shadow-sm'}
          `}
        >
          {/* 头部 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">{step.title}</h4>
                {step.optional && (
                  <Badge variant="outline" className="text-xs">
                    可选
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{step.estimatedDays} 天</span>
              </div>
              <button className="p-1 rounded-full hover:bg-gray-100">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* 展开详情 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">要求清单</h5>
                  <ul className="space-y-2">
                    {step.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * 合规路径可视化组件
 */
export function RegulatoryPathway({
  market,
  pathwayType,
  deviceClass,
  steps,
  averageDays,
  successRate = 85,
  className = ''
}: RegulatoryPathwayProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const marketConfig_data = marketConfig[market];
  const classConfig = deviceClassConfig[deviceClass];
  const MarketIcon = marketConfig_data.icon;

  // 计算总天数
  const totalDays = steps.reduce((sum, step) => sum + step.estimatedDays, 0);

  return (
    <div className={className}>
      {/* 头部信息 */}
      <div className={`
        p-6 rounded-xl border mb-6
        ${marketConfig_data.bgColor} ${marketConfig_data.color.replace('text-', 'border-').replace('600', '200')}
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <MarketIcon className={`w-7 h-7 ${marketConfig_data.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {marketConfig_data.name} · {pathwayType}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {classConfig.label}
                </Badge>
                <span className="text-sm text-gray-600">{classConfig.description}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{averageDays}</p>
                <p className="text-xs text-gray-500">平均天数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                <p className="text-xs text-gray-500">成功率</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 步骤时间轴 */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <PathwayStepItem
            key={step.step}
            step={step}
            isLast={index === steps.length - 1}
            isExpanded={expandedStep === step.step}
            onToggle={() => setExpandedStep(
              expandedStep === step.step ? null : step.step
            )}
          />
        ))}
      </div>

      {/* 底部统计 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              预计总时长: <strong>{totalDays} 天</strong> ({Math.round(totalDays / 30)} 个月)
            </span>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            下载详细指南
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RegulatoryPathway;
