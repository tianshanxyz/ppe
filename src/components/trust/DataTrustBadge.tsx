'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BadgeCheck, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Star,
  AlertCircle,
  Database
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export interface DataTrustBadgeProps {
  lastUpdated: string;
  source: string;
  confidence: number;
  verified: boolean;
  sourceUrl?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 数据可信度标识组件
 * 显示数据来源、更新时间、可信度评分
 */
export function DataTrustBadge({
  lastUpdated,
  source,
  confidence,
  verified,
  sourceUrl,
  showDetails = false,
  size = 'md',
  className = ''
}: DataTrustBadgeProps) {
  // 可信度星级计算
  const getStarCount = (confidence: number): number => {
    if (confidence >= 0.95) return 5;
    if (confidence >= 0.85) return 4;
    if (confidence >= 0.75) return 3;
    if (confidence >= 0.65) return 2;
    return 1;
  };

  const starCount = getStarCount(confidence);
  const stars = Array.from({ length: 5 }, (_, i) => i < starCount);

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 gap-1',
      icon: 'w-3 h-3',
      text: 'text-xs',
      star: 'w-2.5 h-2.5'
    },
    md: {
      container: 'px-3 py-1.5 gap-2',
      icon: 'w-4 h-4',
      text: 'text-sm',
      star: 'w-3 h-3'
    },
    lg: {
      container: 'px-4 py-2 gap-2',
      icon: 'w-5 h-5',
      text: 'text-base',
      star: 'w-4 h-4'
    }
  };

  const config = sizeConfig[size];

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 可信度等级
  const getConfidenceLevel = (confidence: number): { label: string; color: string } => {
    if (confidence >= 0.95) return { label: '极高', color: 'text-green-600' };
    if (confidence >= 0.85) return { label: '高', color: 'text-primary-600' };
    if (confidence >= 0.75) return { label: '中等', color: 'text-yellow-600' };
    if (confidence >= 0.65) return { label: '一般', color: 'text-orange-600' };
    return { label: '低', color: 'text-red-600' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  // 详细信息 Tooltip 内容
  const tooltipContent = (
    <div className="w-64 p-3 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <BadgeCheck className="w-5 h-5 text-primary-500" />
        <span className="font-semibold text-gray-900">数据可信度详情</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">可信度评分</span>
          <span className={`font-medium ${confidenceLevel.color}`}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {stars.map((filled, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">可信度等级</span>
          <span className={`text-sm font-medium ${confidenceLevel.color}`}>
            {confidenceLevel.label}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">数据来源</span>
        </div>
        <p className="text-sm font-medium text-gray-900 pl-6">{source}</p>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">最后更新</span>
        </div>
        <p className="text-sm font-medium text-gray-900 pl-6">
          {formatDate(lastUpdated)}
          <span className="text-gray-400 ml-1">({lastUpdated})</span>
        </p>
      </div>

      {verified && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">已验证数据</span>
        </div>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 pt-2 border-t border-gray-200 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-medium">查看原始数据</span>
        </a>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`
          inline-flex items-center rounded-lg border border-gray-200 bg-white
          shadow-sm hover:shadow-md transition-shadow cursor-pointer
          ${config.container}
          ${className}
        `}
      >
        {/* 验证标识 */}
        {verified ? (
          <CheckCircle className={`${config.icon} text-green-500`} />
        ) : (
          <AlertCircle className={`${config.icon} text-yellow-500`} />
        )}

        {/* 可信度星级 */}
        <div className="flex items-center gap-0.5">
          {stars.slice(0, 3).map((filled, i) => (
            <Star
              key={i}
              className={`${config.star} ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <div className={`flex items-center gap-2 ${config.text} text-gray-600`}>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{formatDate(lastUpdated)}</span>
          </div>
        )}

        {/* 数据源图标 */}
        <Database className={`${config.icon} text-gray-400 ml-1`} />
      </motion.div>
    </Tooltip>
  );
}

/**
 * 简化版数据可信度标识
 * 仅显示星级和验证状态
 */
export function DataTrustBadgeSimple({
  confidence,
  verified,
  size = 'sm'
}: Pick<DataTrustBadgeProps, 'confidence' | 'verified' | 'size'>) {
  const starCount = Math.ceil(confidence * 5);
  const stars = Array.from({ length: 5 }, (_, i) => i < starCount);

  const sizeConfig = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="inline-flex items-center gap-1">
      {verified && (
        <CheckCircle className={`${sizeConfig[size]} text-green-500`} />
      )}
      <div className="flex items-center gap-0.5">
        {stars.map((filled, i) => (
          <Star
            key={i}
            className={`${sizeConfig[size]} ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default DataTrustBadge;
