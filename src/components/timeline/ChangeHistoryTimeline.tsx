'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Package,
  Users,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock
} from 'lucide-react';

export type TimelineEventType =
  | 'name_change'
  | 'address_change'
  | 'scope_change'
  | 'agent_change'
  | 'certificate_renewal'
  | 'certificate_revoked'
  | 'certificate_expired'
  | 'product_added'
  | 'product_removed'
  | 'status_change'
  | 'merger'
  | 'acquisition'
  | 'legal_issue'
  | 'compliance_update';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  source?: string;
  confidence?: number;
}

export interface ChangeHistoryTimelineProps {
  events: TimelineEvent[];
  entityType: 'company' | 'product';
  entityId: string;
  entityName?: string;
  className?: string;
  onEventClick?: (event: TimelineEvent) => void;
}

/**
 * 事件类型配置
 */
const eventConfig: Record<TimelineEventType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  name_change: {
    label: '名称变更',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  address_change: {
    label: '地址变更',
    icon: MapPin,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  scope_change: {
    label: '经营范围变更',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  agent_change: {
    label: '代理人变更',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  certificate_renewal: {
    label: '证书续期',
    icon: FileCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  certificate_revoked: {
    label: '证书吊销',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  certificate_expired: {
    label: '证书过期',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  product_added: {
    label: '新增产品',
    icon: Package,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200'
  },
  product_removed: {
    label: '产品移除',
    icon: Package,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  status_change: {
    label: '状态变更',
    icon: FileCheck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  merger: {
    label: '企业合并',
    icon: Building2,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  acquisition: {
    label: '企业收购',
    icon: Building2,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  legal_issue: {
    label: '法律问题',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  compliance_update: {
    label: '合规更新',
    icon: FileCheck,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200'
  }
};

/**
 * 时间轴事件项组件
 */
function TimelineEventItem({
  event,
  isLast,
  onClick
}: {
  event: TimelineEvent;
  isLast: boolean;
  onClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = eventConfig[event.type];
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      year: date.getFullYear(),
      month: date.toLocaleString('zh-CN', { month: 'short' }),
      day: date.getDate(),
      full: date.toLocaleString('zh-CN')
    };
  };

  const date = formatDate(event.date);

  return (
    <div className="relative flex gap-4">
      {/* 时间线 */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* 日期标记 */}
      <div className="flex-shrink-0 w-12 text-center pt-3">
        <div className="text-xs text-gray-400">{date.year}</div>
        <div className="text-lg font-bold text-gray-700">{date.day}</div>
        <div className="text-xs text-gray-500">{date.month}</div>
      </div>

      {/* 事件图标 */}
      <div className={`
        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
        ${config.bgColor} ${config.borderColor} border-2 z-10
      `}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* 事件内容 */}
      <div className="flex-1 pb-8">
        <motion.div
          layout
          onClick={() => {
            setIsExpanded(!isExpanded);
            onClick?.();
          }}
          className={`
            bg-white border border-gray-200 rounded-xl p-4 cursor-pointer
            hover:shadow-md transition-shadow
            ${isExpanded ? 'ring-2 ring-primary-100' : ''}
          `}
        >
          {/* 头部 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`
                  text-xs font-medium px-2 py-0.5 rounded-full
                  ${config.bgColor} ${config.color}
                `}>
                  {config.label}
                </span>
                {event.source && (
                  <span className="text-xs text-gray-400">
                    来源: {event.source}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-gray-900">{event.title}</h4>
            </div>

            <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* 描述 */}
          {event.description && (
            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
          )}

          {/* 展开详情 */}
          <AnimatePresence>
            {isExpanded && event.metadata && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">详细信息</h5>
                  <dl className="space-y-2">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-gray-500">{key}</dt>
                        <dd className="text-gray-900 font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
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
 * 变更历史时间轴组件
 */
export function ChangeHistoryTimeline({
  events,
  entityType,
  entityId,
  entityName,
  className = '',
  onEventClick
}: ChangeHistoryTimelineProps) {
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');

  // 按时间排序
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 过滤事件
  const filteredEvents = filter === 'all'
    ? sortedEvents
    : sortedEvents.filter(e => e.type === filter);

  // 统计各类型数量
  const typeCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<TimelineEventType, number>);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">暂无变更记录</h3>
        <p className="text-gray-500 mt-1">
          {entityName || '该企业'} 暂无历史变更记录
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 头部统计 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">变更历史</h3>
            <p className="text-sm text-gray-500">
              共 {events.length} 条变更记录
              {entityName && ` · ${entityName}`}
            </p>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            全部 ({events.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = eventConfig[type as TimelineEventType];
            return (
              <button
                key={type}
                onClick={() => setFilter(type as TimelineEventType)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  flex items-center gap-1.5
                  ${filter === type
                    ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${config.borderColor}`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <config.icon className="w-3.5 h-3.5" />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 时间轴 */}
      <div className="space-y-0">
        {filteredEvents.map((event, index) => (
          <TimelineEventItem
            key={event.id}
            event={event}
            isLast={index === filteredEvents.length - 1}
            onClick={() => onEventClick?.(event)}
          />
        ))}
      </div>

      {/* 加载更多 */}
      {filteredEvents.length > 10 && (
        <div className="text-center mt-8">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            加载更多历史记录
          </button>
        </div>
      )}
    </div>
  );
}

export default ChangeHistoryTimeline;
