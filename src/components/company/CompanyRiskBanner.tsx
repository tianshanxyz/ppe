'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  X,
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-react';
import { RiskAlert, RiskLevel } from '@/components/risk';

export interface CompanyRiskBannerProps {
  alerts: RiskAlert[];
  companyName?: string;
  onDismiss?: (id: string) => void;
  onAlertClick?: (alert: RiskAlert) => void;
  className?: string;
}

/**
 * 企业详情页风险横幅组件
 * 固定在页面顶部，显示 HIGH/CRITICAL 级别风险
 */
export function CompanyRiskBanner({
  alerts,
  companyName,
  onDismiss,
  onAlertClick,
  className = ''
}: CompanyRiskBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // 过滤出 HIGH 和 CRITICAL 级别的预警
  const highRiskAlerts = alerts.filter(
    alert => alert.level === 'HIGH' || alert.level === 'CRITICAL'
  );

  // 按风险等级排序
  const sortedAlerts = [...highRiskAlerts].sort((a, b) => {
    const priority: Record<string, number> = { CRITICAL: 2, HIGH: 1 };
    return (priority[b.level] || 0) - (priority[a.level] || 0);
  });

  const criticalCount = sortedAlerts.filter(a => a.level === 'CRITICAL').length;
  const highCount = sortedAlerts.filter(a => a.level === 'HIGH').length;

  // 如果没有高风险预警，不显示
  if (sortedAlerts.length === 0 || isDismissed) return null;

  const hasCritical = criticalCount > 0;

  // 获取风险图标
  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // 获取风险样式
  const getRiskStyle = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        rounded-lg border overflow-hidden mb-6
        ${hasCritical 
          ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100' 
          : 'bg-yellow-50 border-yellow-200 shadow-md shadow-yellow-100'
        }
        ${className}
      `}
    >
      {/* 横幅头部 */}
      <div 
        className={`
          flex items-center justify-between px-4 py-3 cursor-pointer
          ${hasCritical ? 'bg-red-100' : 'bg-yellow-100'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${hasCritical ? 'bg-red-200' : 'bg-yellow-200'}
          `}>
            {hasCritical ? (
              <ShieldAlert className="w-5 h-5 text-red-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-700" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={`
                font-semibold
                ${hasCritical ? 'text-red-800' : 'text-yellow-800'}
              `}>
                {hasCritical ? '⚠️ 发现严重风险' : '发现高风险'}
              </h3>
              <div className="flex items-center gap-1">
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-200 text-red-800 rounded-full">
                    {criticalCount} 严重
                  </span>
                )}
                {highCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
                    {highCount} 高
                  </span>
                )}
              </div>
            </div>
            <p className={`
              text-sm mt-0.5
              ${hasCritical ? 'text-red-600' : 'text-yellow-700'}
            `}>
              {companyName ? `${companyName} 存在 ${sortedAlerts.length} 条风险预警` : `存在 ${sortedAlerts.length} 条风险预警`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`
              p-2 rounded-full transition-colors
              ${hasCritical 
                ? 'hover:bg-red-200 text-red-700' 
                : 'hover:bg-yellow-200 text-yellow-700'
              }
            `}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className={`
              p-2 rounded-full transition-colors
              ${hasCritical 
                ? 'hover:bg-red-200 text-red-700' 
                : 'hover:bg-yellow-200 text-yellow-700'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 展开的预警列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {sortedAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onAlertClick?.(alert)}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${getRiskStyle(alert.level)}
                  `}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getRiskIcon(alert.level)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${alert.level === 'CRITICAL' 
                          ? 'bg-red-200 text-red-800' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {alert.level === 'CRITICAL' ? '严重' : '高'}
                      </span>
                      <span className="text-xs opacity-75">{alert.type}</span>
                    </div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-sm opacity-90 mt-0.5 line-clamp-2">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      检测时间: {new Date(alert.detectedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>

                  {onDismiss && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(alert.id);
                      }}
                      className="
                        flex-shrink-0 p-1.5 rounded-full
                        opacity-50 hover:opacity-100 hover:bg-black/5
                        transition-all
                      "
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}

              {sortedAlerts.length > 5 && (
                <p className={`
                  text-center text-sm py-2
                  ${hasCritical ? 'text-red-600' : 'text-yellow-700'}
                `}>
                  还有 {sortedAlerts.length - 5} 条风险预警...
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CompanyRiskBanner;
