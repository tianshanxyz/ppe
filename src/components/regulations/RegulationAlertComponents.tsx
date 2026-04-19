'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, AlertOctagon, Info, CheckCircle, Globe } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

// 市场旗帜图标
const getMarketFlag = (jurisdiction: string) => {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    EU: '🇪🇺',
    CN: '🇨🇳',
    JP: '🇯🇵',
    UK: '🇬🇧',
    AU: '🇦🇺',
    CA: '🇨🇦',
    SG: '🇸🇬',
  }
  return flags[jurisdiction] || '🌍'
}

// 类型定义
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type RegulationAlertType = 'NEW' | 'UPDATED' | 'EXPIRED' | 'REPLACED' | 'REVIEWING'

export interface RegulationAlert {
  id: string
  regulation_id: string
  title: string
  jurisdiction: string
  alert_type: RegulationAlertType
  message: string
  detected_at: string
  severity: AlertSeverity
  metadata?: Record<string, any>
}

// 风险等级图标和样式
const severityConfig: Record<AlertSeverity, { icon: any; color: string; label: string }> = {
  CRITICAL: {
    icon: AlertOctagon,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    label: '严重'
  },
  HIGH: {
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    label: '高'
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    label: '中'
  },
  LOW: {
    icon: Info,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    label: '低'
  }
}

/**
 * 法规更新提醒徽章组件
 */
export function RegulationAlertBadge({ alert }: { alert: RegulationAlert }) {
  const config = severityConfig[alert.severity]
  const Icon = config.icon
  
  return (
    <Badge variant="outline" className={`${config.color} border-0`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}

/**
 * 法规更新提醒卡片组件
 */
export function RegulationAlertCard({ alert, onClick }: { alert: RegulationAlert; onClick?: () => void }) {
  const config = severityConfig[alert.severity]
  const Icon = config.icon
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const getMarketFlag = (jurisdiction: string) => {
    const flags: Record<string, string> = {
      US: '🇺🇸',
      EU: '🇪🇺',
      CN: '🇨🇳',
      JP: '🇯🇵',
      UK: '🇬🇧',
      AU: '🇦🇺',
      CA: '🇨🇦',
      SG: '🇸🇬'
    }
    return flags[jurisdiction] || '🌍'
  }
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {getMarketFlag(alert.jurisdiction)} {alert.jurisdiction}
            </Badge>
            <RegulationAlertBadge alert={alert} />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(alert.detected_at)}
          </span>
        </div>
        <CardTitle className="text-sm mt-2 line-clamp-2">
          {alert.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="flex-1">{alert.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 法规更新提醒列表组件
 */
export function RegulationAlertList({ 
  alerts, 
  onAlertClick,
  title = '法规更新提醒'
}: { 
  alerts: RegulationAlert[] 
  onAlertClick?: (alert: RegulationAlert) => void
  title?: string
}) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无法规更新提醒</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title} ({alerts.length})</h3>
      {alerts.map((alert) => (
        <RegulationAlertCard 
          key={alert.id} 
          alert={alert} 
          onClick={() => onAlertClick?.(alert)} 
        />
      ))}
    </div>
  )
}

/**
 * 法规更新统计卡片组件
 */
export function RegulationAlertStats({ alerts }: { alerts: RegulationAlert[] }) {
  const bySeverity = {
    CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
    HIGH: alerts.filter(a => a.severity === 'HIGH').length,
    MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
    LOW: alerts.filter(a => a.severity === 'LOW').length
  }
  
  const byMarket: Record<string, number> = {}
  alerts.forEach(a => {
    byMarket[a.jurisdiction] = (byMarket[a.jurisdiction] || 0) + 1
  })
  
  const byType: Record<string, number> = {}
  alerts.forEach(a => {
    byType[a.alert_type] = (byType[a.alert_type] || 0) + 1
  })
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">严重级别</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 text-red-500" />
                严重
              </span>
              <Badge variant="danger">{bySeverity.CRITICAL}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                高
              </span>
              <Badge variant="outline" className="text-orange-600 border-orange-200">{bySeverity.HIGH}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                中
              </span>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">{bySeverity.MEDIUM}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-500" />
                低
              </span>
              <Badge variant="outline" className="text-blue-600 border-blue-200">{bySeverity.LOW}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">市场分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(byMarket).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([market, count]) => (
              <div key={market} className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  {getMarketFlag(market)} {market}
                </span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">提醒类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize">{type}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 法规更新提醒摘要组件
 */
export function RegulationAlertSummary({ alerts }: { alerts: RegulationAlert[] }) {
  const total = alerts.length
  const highPriority = alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length
  
  const getSummaryMessage = () => {
    if (criticalCount > 0) {
      return {
        title: '⚠️ 需要立即关注',
        description: `发现 ${criticalCount} 条严重级别提醒，请及时处理`
      }
    } else if (highPriority > 0) {
      return {
        title: '⚠️ 有高优先级提醒',
        description: `发现 ${highPriority} 条高优先级提醒`
      }
    } else {
      return {
        title: '✅ 法规更新正常',
        description: `共有 ${total} 条法规更新提醒`
      }
    }
  }
  
  const summary = getSummaryMessage()
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {criticalCount > 0 ? (
              <AlertOctagon className="w-8 h-8 text-red-600" />
            ) : highPriority > 0 ? (
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">{summary.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{summary.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
