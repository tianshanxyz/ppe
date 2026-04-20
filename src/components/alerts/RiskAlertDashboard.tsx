'use client'

/**
 * 风险预警仪表板组件
 * 
 * 任务A-002: 合规风险预警功能 - 前端展示
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Bell,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  Building2,
  FileText,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { RiskAlert, RiskType, UserAlertConfig } from '@/lib/alerts/risk-monitor'

interface RiskAlertDashboardProps {
  alerts: RiskAlert[]
  userConfigs?: UserAlertConfig[]
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  onCreateConfig?: () => void
  className?: string
}

const riskTypeConfig: Record<RiskType, { label: string; icon: any; color: string }> = {
  certification_expiry: { label: '认证即将过期', icon: Clock, color: 'text-yellow-600' },
  certification_expired: { label: '认证已过期', icon: XCircle, color: 'text-red-600' },
  product_recall: { label: '产品召回', icon: AlertTriangle, color: 'text-red-600' },
  warning_letter: { label: '警告信', icon: FileText, color: 'text-orange-600' },
  regulation_change: { label: '法规变更', icon: Shield, color: 'text-blue-600' },
  new_competitor: { label: '新竞争对手', icon: Building2, color: 'text-purple-600' },
  market_withdrawal: { label: '市场撤回', icon: Package, color: 'text-gray-600' },
  import_alert: { label: '进口警报', icon: AlertTriangle, color: 'text-red-600' },
}

const severityConfig = {
  critical: { label: '严重', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
  high: { label: '高', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  medium: { label: '中', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' },
  low: { label: '低', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
}

export function RiskAlertDashboard({
  alerts,
  userConfigs,
  onAcknowledge,
  onDismiss,
  onCreateConfig,
  className = '',
}: RiskAlertDashboardProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([])
  const [showConfigs, setShowConfigs] = useState(false)

  // 统计
  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
  }

  // 过滤后的预警
  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    if (filterType !== 'all' && alert.type !== filterType) return false
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false
    return true
  })

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts((prev) =>
      prev.includes(alertId) ? prev.filter((id) => id !== alertId) : [...prev, alertId]
    )
  }

  const isExpanded = (alertId: string) => expandedAlerts.includes(alertId)

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-[#339999] mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">风险预警中心</h2>
              <p className="text-sm text-gray-500">实时监控合规风险</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfigs(!showConfigs)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              预警配置
              {userConfigs && userConfigs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[#339999] text-white rounded-full">
                  {userConfigs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">全部预警</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-xs text-red-600">严重</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <div className="text-xs text-orange-600">高</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-xs text-yellow-600">中</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-xs text-blue-600">待处理</div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-[#339999] focus:border-[#339999]"
            >
              <option value="all">全部严重级别</option>
              <option value="critical">严重</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border-gray-300 rounded-lg focus:ring-[#339999] focus:border-[#339999]"
          >
            <option value="all">全部类型</option>
            {Object.entries(riskTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border-gray-300 rounded-lg focus:ring-[#339999] focus:border-[#339999]"
          >
            <option value="all">全部状态</option>
            <option value="active">待处理</option>
            <option value="acknowledged">已确认</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
      </div>

      {/* 预警配置面板 */}
      <AnimatePresence>
        {showConfigs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">我的预警配置</h3>
                {onCreateConfig && (
                  <button
                    onClick={onCreateConfig}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium"
                  >
                    + 新建配置
                  </button>
                )}
              </div>
              {userConfigs && userConfigs.length > 0 ? (
                <div className="space-y-3">
                  {userConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{config.alertName}</p>
                        <p className="text-sm text-gray-500">
                          {riskTypeConfig[config.alertType]?.label} •
                          {config.notificationChannels.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.isActive ? '启用' : '禁用'}
                        </span>
                        <span className="text-sm text-gray-500">
                          已触发 {config.triggerCount} 次
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无预警配置</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 预警列表 */}
      <div className="divide-y divide-gray-200">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const typeConfig = riskTypeConfig[alert.type]
            const severityConfigItem = severityConfig[alert.severity]
            const TypeIcon = typeConfig.icon
            const expanded = isExpanded(alert.id)

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  alert.status === 'active' ? severityConfigItem.bgColor : ''
                }`}
              >
                <div className="flex items-start">
                  {/* 图标 */}
                  <div className={`p-2 rounded-lg ${severityConfigItem.bgColor} mr-4`}>
                    <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                        <div className="flex items-center mt-2 space-x-3 text-xs text-gray-400">
                          <span className={severityConfigItem.textColor}>
                            {severityConfigItem.label}级别
                          </span>
                          <span>•</span>
                          <span>{typeConfig.label}</span>
                          <span>•</span>
                          <span>{new Date(alert.detectedAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2 ml-4">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => onAcknowledge?.(alert.id)}
                              className="p-1.5 text-gray-400 hover:text-[#339999] transition-colors"
                              title="确认"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDismiss?.(alert.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="忽略"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleExpand(alert.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 展开详情 */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(alert.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span>
                                <span className="ml-2 text-gray-900">
                                  {typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)
                                    ? new Date(value).toLocaleDateString('zh-CN')
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex space-x-3">
                            <a
                              href={`/${alert.entityType}/${alert.entityId}`}
                              className="inline-flex items-center text-sm text-[#339999] hover:text-[#2d8b8b]"
                            >
                              查看详情
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">暂无风险预警</h3>
            <p className="text-gray-500 mt-1">当前没有符合条件的风险预警</p>
          </div>
        )}
      </div>
    </div>
  )
}
