'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw, Filter, Search, ChevronRight, AlertTriangle, AlertOctagon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import {
  RegulationAlert,
  RegulationAlertBadge,
  RegulationAlertCard,
  RegulationAlertList,
  RegulationAlertStats,
  RegulationAlertSummary
} from '@/components/regulations/RegulationAlertComponents'

// 市场图标
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

export default function RegulationAlertsPage() {
  const [alerts, setAlerts] = useState<RegulationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [highPriorityOnly, setHighPriorityOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // 加载提醒数据
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          limit: '100',
          high_priority: highPriorityOnly ? 'true' : 'false'
        })
        
        if (selectedMarket) {
          params.append('jurisdiction', selectedMarket)
        }
        
        const response = await fetch(`/api/regulations/alerts?${params.toString()}`)
        const data = await response.json()
        
        if (data.success) {
          setAlerts(data.alerts)
          setLastUpdated(new Date().toLocaleString('zh-CN'))
        }
      } catch (error) {
        console.error('加载提醒失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAlerts()
  }, [highPriorityOnly, selectedMarket])

  // 手动触发检测
  const handleTriggerDetection = async () => {
    try {
      const response = await fetch('/api/regulations/alerts', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        alert(`检测完成！发现 ${result.total} 条提醒，其中高优先级 ${result.high_priority_count} 条`)
        // 重新加载数据
        const params = new URLSearchParams({
          limit: '100',
          high_priority: highPriorityOnly ? 'true' : 'false'
        })
        if (selectedMarket) {
          params.append('jurisdiction', selectedMarket)
        }
        const fetchResponse = await fetch(`/api/regulations/alerts?${params.toString()}`)
        const fetchData = await fetchResponse.json()
        if (fetchData.success) {
          setAlerts(fetchData.alerts)
        }
      }
    } catch (error) {
      console.error('触发检测失败:', error)
      alert('触发检测失败，请稍后重试')
    }
  }

  // 过滤提醒
  const filteredAlerts = alerts.filter(alert => {
    if (searchQuery) {
      return alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // 按市场分组
  const alertsByMarket: Record<string, RegulationAlert[]> = {}
  filteredAlerts.forEach(alert => {
    if (!alertsByMarket[alert.jurisdiction]) {
      alertsByMarket[alert.jurisdiction] = []
    }
    alertsByMarket[alert.jurisdiction].push(alert)
  })

  // 统计数据
  const totalAlerts = filteredAlerts.length
  const highPriorityCount = filteredAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length
  const criticalCount = filteredAlerts.filter(a => a.severity === 'CRITICAL').length

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">法规更新提醒</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            实时监控全球法规更新，及时掌握合规动态
          </p>
        </div>
        <Button onClick={handleTriggerDetection} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '检测中...' : '手动检测'}
        </Button>
      </div>

      {/* 摘要卡片 */}
      <RegulationAlertSummary alerts={filteredAlerts} />

      {/* 统计卡片 */}
      <RegulationAlertStats alerts={filteredAlerts} />

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索法规标题或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 市场筛选 */}
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={selectedMarket === null ? 'primary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMarket(null)}
              >
                全部市场
              </Badge>
              {['US', 'EU', 'CN', 'JP', 'UK', 'AU', 'CA', 'SG'].map(market => (
                <Badge 
                  key={market}
                  variant={selectedMarket === market ? 'primary' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedMarket(market)}
                >
                  {getMarketFlag(market)} {market}
                </Badge>
              ))}
            </div>

            {/* 高优先级筛选 */}
            <Button
              variant={highPriorityOnly ? 'primary' : 'outline'}
              onClick={() => setHighPriorityOnly(!highPriorityOnly)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {highPriorityOnly ? '仅显示高优先级' : '显示全部'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 提醒列表 */}
      <div className="space-y-6">
        {loading && filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">正在加载提醒数据...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无法规更新提醒</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                当前没有需要关注的法规更新
              </p>
              <Button onClick={handleTriggerDetection}>
                <RefreshCw className="w-4 h-4 mr-2" />
                立即检测
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 按市场分组显示 */}
            {Object.entries(alertsByMarket).map(([market, marketAlerts]) => (
              <div key={market} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    {getMarketFlag(market)} {market} ({marketAlerts.length})
                  </h3>
                  <Badge variant="secondary">
                    {marketAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length} 高优先级
                  </Badge>
                </div>
                <RegulationAlertList alerts={marketAlerts} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 页脚 */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>最后更新: {lastUpdated}</span>
          <span>数据来源: FDA, EU MDCG, NMPA, PMDA, HSA, TGA, Health Canada, MHRA</span>
        </div>
      </div>
    </div>
  )
}
