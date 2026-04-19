'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Database, 
  Globe, 
  FileText, 
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  AlertOctagon,
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
  Info
} from 'lucide-react'

// 类型定义
export interface QualityReport {
  timestamp: string
  total: number
  completeness: {
    total: number
    title_complete: number
    jurisdiction_complete: number
    effective_date_complete: number
    content_complete: number
    score: string
  }
  distribution: {
    market: Record<string, number>
    type: Record<string, number>
    category: Record<string, number>
  }
  duplicateRate: {
    count: number
    rate: string
    threshold: number
  }
  lastUpdate?: string
  status: 'healthy' | 'warning' | 'critical'
}

/**
 * 完整度指标组件
 */
export function CompletenessIndicator({ 
  label, 
  current, 
  total, 
  passed 
}: { 
  label: string 
  current: number 
  total: number 
  passed: boolean 
}) {
  const percentage = ((current / total) * 100).toFixed(1)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
          {passed ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>
      <Progress value={parseFloat(percentage)} className="h-2" />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {current} / {total} 条记录
      </p>
    </div>
  )
}

/**
 * 质量评分卡片组件
 */
export function QualityScoreCard({ report }: { report: QualityReport }) {
  const score = parseFloat(report.completeness.score)
  
  // 确定评分颜色
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-600 dark:text-green-400'
    if (s >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  const getScoreLabel = (s: number) => {
    if (s >= 90) return '优秀'
    if (s >= 70) return '良好'
    return '需改进'
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          数据质量评分
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${score}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score.toFixed(0)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Badge variant={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'danger'} className="text-lg px-4 py-2">
            {getScoreLabel(score)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 市场分布卡片组件
 */
export function MarketDistributionCard({ distribution }: { distribution: QualityReport['distribution'] }) {
  const markets = Object.entries(distribution.market).sort((a, b) => b[1] - a[1])
  
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
  
  const maxCount = Math.max(...Object.values(distribution.market))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          市场分布
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {markets.map(([market, count]) => (
            <div key={market} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  {getMarketFlag(market)} {market}
                </span>
                <span className="font-medium">{count} 条</span>
              </div>
              <Progress 
                value={(count / maxCount) * 100} 
                className="h-2" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 类型分布卡片组件
 */
export function TypeDistributionCard({ distribution }: { distribution: QualityReport['distribution'] }) {
  const types = Object.entries(distribution.type).sort((a, b) => b[1] - a[1])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          类型分布
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {types.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="capitalize text-sm">{type}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 分类分布卡片组件
 */
export function CategoryDistributionCard({ distribution }: { distribution: QualityReport['distribution'] }) {
  const categories = Object.entries(distribution.category)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          分类分布 (Top 8)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map(([category, count]) => (
            <div key={category} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">{category}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 重复率卡片组件
 */
export function DuplicateRateCard({ duplicateRate }: { duplicateRate: QualityReport['duplicateRate'] }) {
  const rate = parseFloat(duplicateRate.rate)
  const threshold = duplicateRate.threshold
  const passed = rate < threshold
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className={`w-5 h-5 mr-2 ${passed ? 'text-green-500' : 'text-red-500'}`} />
          重复率检查
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">重复记录数</span>
            <Badge variant={passed ? 'success' : 'danger'}>{duplicateRate.count}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">重复率</span>
            <Badge variant={passed ? 'success' : 'danger'}>
              {rate.toFixed(2)}% (阈值：{threshold * 100}%)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">状态</span>
            {passed ? (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                通过
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangleIcon className="w-4 h-4 mr-1" />
                警告
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 质量监控摘要卡片
 */
export function QualitySummaryCard({ report }: { report: QualityReport }) {
  const { status, completeness, duplicateRate } = report
  const score = parseFloat(completeness.score)
  const rate = parseFloat(duplicateRate.rate)
  
  let summaryMessage = ''
  let icon = AlertCircle as any
  let IconComponent = AlertCircle
  
  if (status === 'healthy') {
    summaryMessage = '✅ 数据质量良好，所有指标均在正常范围内'
    icon = CheckCircle
  } else if (status === 'warning') {
    if (rate > duplicateRate.threshold) {
      summaryMessage = `⚠️ 重复率过高 (${rate.toFixed(2)}%)，建议检查数据源`
    } else {
      summaryMessage = `⚠️ 数据质量需改进 (评分: ${score.toFixed(0)})`
    }
    icon = AlertTriangleIcon
  } else {
    summaryMessage = '❌ 数据质量较差，需要立即处理'
    icon = AlertOctagon
  }
  
  return (
    <Card className={`border-l-4 ${status === 'healthy' ? 'border-green-500' : status === 'warning' ? 'border-yellow-500' : 'border-red-500'}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' : status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <IconComponent className={`w-8 h-8 ${status === 'healthy' ? 'text-green-600 dark:text-green-400' : status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {status === 'healthy' ? '数据质量健康' : status === 'warning' ? '数据质量警告' : '数据质量严重问题'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{summaryMessage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
