'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building2,
  Stethoscope,
  FileText,
  Info,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type ExtractionStatus = 'success' | 'partial' | 'error';
export type EntityType = 'company' | 'product' | 'regulation' | 'certificate';

export interface ExtractedField {
  name: string;
  label: string;
  value: string | number | boolean | null;
  confidence: number;
  source?: string;
  verified?: boolean;
}

export interface ExtractedEntity {
  id: string;
  type: EntityType;
  name: string;
  fields: ExtractedField[];
  confidence: number;
}

export interface AIExtractionCardProps {
  query: string;
  entities: ExtractedEntity[];
  status: ExtractionStatus;
  processingTime?: number;
  modelVersion?: string;
  className?: string;
  onFeedback?: (entityId: string, isPositive: boolean) => void;
  onRetry?: () => void;
  onCopy?: (text: string) => void;
}

/**
 * 实体类型配置
 */
const entityTypeConfig: Record<EntityType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  company: {
    label: '企业',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  product: {
    label: '产品',
    icon: Stethoscope,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  regulation: {
    label: '法规',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  certificate: {
    label: '证书',
    icon: CheckCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  }
};

/**
 * 状态配置
 */
const statusConfig: Record<ExtractionStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}> = {
  success: {
    label: '提取成功',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'AI 成功提取了所有关键信息'
  },
  partial: {
    label: '部分提取',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'AI 提取了部分信息，部分字段可能不完整'
  },
  error: {
    label: '提取失败',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'AI 无法从查询中提取有效信息'
  }
};

/**
 * 字段值组件
 */
function FieldValue({ field, onCopy }: { field: ExtractedField; onCopy?: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (field.value && onCopy) {
      onCopy(String(field.value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="group flex items-start justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{field.label}</span>
          <div
            className={`w-2 h-2 rounded-full ${getConfidenceColor(field.confidence)}`}
            title={`置信度: ${Math.round(field.confidence * 100)}%`}
          />
        </div>
        <p className="text-sm font-medium text-gray-900 mt-0.5">
          {field.value !== null && field.value !== undefined
            ? String(field.value)
            : <span className="text-gray-400 italic">未提取到</span>
          }
        </p>
      </div>
      {field.value && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-gray-200 transition-all"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * 实体卡片组件
 */
function EntityCard({
  entity,
  onFeedback,
  onCopy
}: {
  entity: ExtractedEntity;
  onFeedback?: (isPositive: boolean) => void;
  onCopy?: (text: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = entityTypeConfig[entity.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* 头部 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{entity.name}</h4>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              置信度: {Math.round(entity.confidence * 100)}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onFeedback && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={(e) => { e.stopPropagation(); onFeedback(true); }}
                className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-green-500 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onFeedback(false); }}
                className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 字段列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2">
              {entity.fields.map((field) => (
                <FieldValue key={field.name} field={field} onCopy={onCopy} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * AI提取结果展示卡片组件
 */
export function AIExtractionCard({
  query,
  entities,
  status,
  processingTime,
  modelVersion = 'GPT-4',
  className = '',
  onFeedback,
  onRetry,
  onCopy
}: AIExtractionCardProps) {
  const statusCfg = statusConfig[status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">AI 提取结果</h3>
                <Badge variant="outline" className="text-xs">
                  {modelVersion}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                查询: "{query}"
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusCfg.bgColor}`}>
            <StatusIcon className={`w-4 h-4 ${statusCfg.color}`} />
            <span className={`text-sm font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* 状态描述 */}
        <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          {statusCfg.description}
          {processingTime && (
            <span className="text-xs text-gray-400">
              (处理耗时: {processingTime.toFixed(2)}s)
            </span>
          )}
        </p>
      </div>

      {/* 实体列表 */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {entities.length > 0 ? (
          entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              onFeedback={onFeedback ? (isPositive) => onFeedback(entity.id, isPositive) : undefined}
              onCopy={onCopy}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">未提取到任何实体信息</p>
            {status === 'error' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重试提取
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 底部 */}
      {entities.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>提取了 {entities.length} 个实体</span>
            <span>平均置信度: {Math.round(entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIExtractionCard;
