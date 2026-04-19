'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Info, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert,
  X
} from 'lucide-react';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAlertBadgeProps {
  level: RiskLevel;
  message: string;
  showIcon?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * 风险预警徽章组件
 * 显示不同级别的风险预警
 */
export function RiskAlertBadge({
  level,
  message,
  showIcon = true,
  onClick,
  className = ''
}: RiskAlertBadgeProps) {
  const config = {
    LOW: {
      icon: Info,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      label: '低风险'
    },
    MEDIUM: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500',
      label: '中风险'
    },
    HIGH: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      label: '高风险'
    },
    CRITICAL: {
      icon: ShieldAlert,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      iconColor: 'text-red-600',
      label: '严重风险'
    }
  };

  const { icon: Icon, bgColor, textColor, borderColor, iconColor, label } = config[level];

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border ${bgColor} ${textColor} ${borderColor}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 ${iconColor}`} />}
      <span>{label}</span>
      <span className="opacity-75">·</span>
      <span className="opacity-90">{message}</span>
    </motion.span>
  );
}

export interface RiskAlert {
  id: string;
  type: string;
  level: RiskLevel;
  title: string;
  message: string;
  detectedAt: string;
  entityId?: string;
  entityType?: 'company' | 'product';
}

export interface RiskAlertBannerProps {
  alerts: RiskAlert[];
  onDismiss?: (id: string) => void;
  onAlertClick?: (alert: RiskAlert) => void;
  className?: string;
}

/**
 * 风险预警横幅组件
 * 显示多条风险预警，可关闭
 */
export function RiskAlertBanner({
  alerts,
  onDismiss,
  onAlertClick,
  className = ''
}: RiskAlertBannerProps) {
  // 按风险等级排序
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priority[b.level] - priority[a.level];
  });

  // 只显示最高级别的预警
  const criticalAlerts = sortedAlerts.filter(a => a.level === 'CRITICAL');
  const highAlerts = sortedAlerts.filter(a => a.level === 'HIGH');
  const displayAlerts = criticalAlerts.length > 0 ? criticalAlerts : highAlerts;

  if (displayAlerts.length === 0) return null;

  const hasCritical = displayAlerts.some(a => a.level === 'CRITICAL');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        rounded-lg border p-4 mb-4
        ${hasCritical 
          ? 'bg-red-50 border-red-200' 
          : 'bg-yellow-50 border-yellow-200'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${hasCritical ? 'bg-red-100' : 'bg-yellow-100'}
        `}>
          {hasCritical ? (
            <ShieldAlert className="w-5 h-5 text-red-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`
              font-semibold text-sm
              ${hasCritical ? 'text-red-800' : 'text-yellow-800'}
            `}>
              {hasCritical ? '发现严重风险' : '发现高风险'}
            </h4>
            <span className={`
              text-xs px-2 py-0.5 rounded-full
              ${hasCritical 
                ? 'bg-red-200 text-red-700' 
                : 'bg-yellow-200 text-yellow-700'
              }
            `}>
              {displayAlerts.length} 条预警
            </span>
          </div>

          <div className="space-y-2">
            {displayAlerts.slice(0, 3).map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onAlertClick?.(alert)}
                className={`
                  flex items-center justify-between p-2 rounded cursor-pointer
                  ${hasCritical 
                    ? 'hover:bg-red-100' 
                    : 'hover:bg-yellow-100'
                  }
                  transition-colors
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RiskAlertBadge 
                    level={alert.level} 
                    message="" 
                    showIcon={true}
                    className="flex-shrink-0"
                  />
                  <span className={`
                    text-sm truncate
                    ${hasCritical ? 'text-red-700' : 'text-yellow-700'}
                  `}>
                    {alert.title}
                  </span>
                </div>

                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(alert.id);
                    }}
                    className={`
                      p-1 rounded-full flex-shrink-0
                      ${hasCritical 
                        ? 'hover:bg-red-200 text-red-500' 
                        : 'hover:bg-yellow-200 text-yellow-500'
                      }
                      transition-colors
                    `}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}

            {displayAlerts.length > 3 && (
              <p className={`
                text-xs pl-2
                ${hasCritical ? 'text-red-600' : 'text-yellow-600'}
              `}>
                还有 {displayAlerts.length - 3} 条预警...
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export interface RiskAlertListProps {
  alerts: RiskAlert[];
  onDismiss?: (id: string) => void;
  onAlertClick?: (alert: RiskAlert) => void;
  className?: string;
}

/**
 * 风险预警列表组件
 * 显示所有风险预警的完整列表
 */
export function RiskAlertList({
  alerts,
  onDismiss,
  onAlertClick,
  className = ''
}: RiskAlertListProps) {
  // 按风险等级和时间排序
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (priority[b.level] !== priority[a.level]) {
      return priority[b.level] - priority[a.level];
    }
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });

  if (sortedAlerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无风险预警</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedAlerts.map((alert) => (
        <motion.div
          key={alert.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onClick={() => onAlertClick?.(alert)}
          className="
            flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white
            hover:shadow-md hover:border-gray-300 cursor-pointer
            transition-all duration-200
          "
        >
          <div className="flex-shrink-0 mt-0.5">
            <RiskAlertBadge 
              level={alert.level} 
              message="" 
              showIcon={true}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-gray-900 mb-1">
              {alert.title}
            </h5>
            <p className="text-sm text-gray-600 mb-2">
              {alert.message}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>类型: {alert.type}</span>
              <span>检测时间: {new Date(alert.detectedAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
              className="
                flex-shrink-0 p-1.5 rounded-full
                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default RiskAlertBadge;
