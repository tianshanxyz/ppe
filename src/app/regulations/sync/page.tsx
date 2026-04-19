'use client'

import { useState, useEffect } from 'react'
import { Database, RefreshCw, Settings, Clock, Activity, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

// 同步阶段配置
const SYNC_PHASES = {
  mvp: {
    phase: 'mvp' as const,
    maxRecords: 5000,
    yearRange: 5,
    batchSize: 100,
    delayMs: 1000,
    incremental: true,
    description: 'MVP阶段：快速同步核心法规'
  },
  growth: {
    phase: 'growth' as const,
    maxRecords: 50000,
    yearRange: 10,
    batchSize: 500,
    delayMs: 500,
    incremental: true,
    description: '增长阶段：同步更多法规数据'
  },
  full: {
    phase: 'full' as const,
    maxRecords: 200000,
    yearRange: 20,
    batchSize: 1000,
    delayMs: 200,
    incremental: true,
    description: '完整阶段：同步全部法规数据'
  }
}

// 数据源配置
const DATA_SOURCES = {
  FDA: {
    name: 'FDA',
    url: 'https://www.fda.gov',
    updateFrequency: 'weekly',
    priority: 1,
    color: 'blue'
  },
  'EU MDCG': {
    name: 'EU MDCG',
    url: 'https://ec.europa.eu',
    updateFrequency: 'monthly',
    priority: 2,
    color: 'indigo'
  },
  NMPA: {
    name: 'NMPA',
    url: 'https://www.nmpa.gov.cn',
    updateFrequency: 'monthly',
    priority: 3,
    color: 'red'
  },
  'Other Markets': {
    name: 'Other Markets',
    url: 'various',
    updateFrequency: 'monthly',
    priority: 4,
    color: 'green'
  }
}

// 类型定义
export interface SyncLog {
  id: string
  source: string
  record_count: number
  status: 'success' | 'partial' | 'failed'
  error_message?: string
  created_at: string
  details?: Record<string, any>
}

export interface SyncConfig {
  phase: 'mvp' | 'growth' | 'full'
  maxRecords: number
  yearRange: number
  batchSize: number
  delayMs: number
  incremental: boolean
}

export default function RegulationSyncPage() {
  const [currentConfig, setCurrentConfig] = useState<SyncConfig>(SYNC_PHASES.mvp)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // 加载同步日志
  useEffect(() => {
    const loadSyncLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/data-update-logs')
        const data = await response.json()
        
        if (data.success) {
          setSyncLogs(data.logs)
        }
      } catch (error) {
        console.error('加载同步日志失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSyncLogs()
  }, [])

  // 更新配置
  const updatePhase = (phase: 'mvp' | 'growth' | 'full') => {
    setCurrentConfig(SYNC_PHASES[phase])
  }

  // 手动触发同步
  const handleTriggerSync = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/sync-regulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: currentConfig
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`同步完成！成功同步 ${data.success_count} 条记录`)
        // 重新加载日志
        const response2 = await fetch('/api/data-update-logs')
        const data2 = await response2.json()
        if (data2.success) {
          setSyncLogs(data2.logs)
        }
      }
    } catch (error) {
      console.error('触发同步失败:', error)
      alert('触发同步失败，请稍后重试')
    } finally {
      setIsSyncing(false)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    
    const labels = {
      success: '成功',
      partial: '部分成功',
      failed: '失败'
    }
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.success}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">法规数据智能同步</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            配置和管理法规数据的智能增量同步
          </p>
        </div>
        <Button onClick={handleTriggerSync} disabled={isSyncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '同步中...' : '立即同步'}
        </Button>
      </div>

      {/* 配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            同步配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 阶段选择 */}
            <div className="space-y-4">
              <Label>同步阶段</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['mvp', 'growth', 'full'] as const).map(phase => (
                  <Button
                    key={phase}
                    variant={currentConfig.phase === phase ? 'primary' : 'outline'}
                    onClick={() => updatePhase(phase)}
                  >
                    {phase.toUpperCase()}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {SYNC_PHASES[currentConfig.phase].description}
              </p>
            </div>

            {/* 配置参数 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最大记录数</Label>
                  <Input
                    type="number"
                    value={currentConfig.maxRecords}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      maxRecords: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>年份范围</Label>
                  <Input
                    type="number"
                    value={currentConfig.yearRange}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      yearRange: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>批次大小</Label>
                  <Input
                    type="number"
                    value={currentConfig.batchSize}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      batchSize: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>延迟 (ms)</Label>
                  <Input
                    type="number"
                    value={currentConfig.delayMs}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      delayMs: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incremental"
                  checked={currentConfig.incremental}
                  onChange={(e) => setCurrentConfig({
                    ...currentConfig,
                    incremental: e.target.checked
                  })}
                />
                <Label htmlFor="incremental">启用增量同步</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据源状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(DATA_SOURCES).map(([key, source]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`w-3 h-3 rounded-full bg-${source.color}-500 mr-2`} />
                {source.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">更新频率</span>
                  <Badge variant="secondary">{source.updateFrequency}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">优先级</span>
                  <Badge variant="outline">{source.priority}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    官方网站 →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 同步日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            同步日志
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 mt-2">正在加载同步日志...</p>
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mt-2">暂无同步日志</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">{log.source}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(log.status)}
                    <Badge variant="secondary">{log.record_count} 条</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 页脚 */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>当前配置: {currentConfig.phase.toUpperCase()} 阶段</span>
          <span>智能增量同步: {currentConfig.incremental ? '已启用' : '未启用'}</span>
        </div>
      </div>
    </div>
  )
}
