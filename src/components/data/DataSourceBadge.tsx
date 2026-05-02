'use client'

import { useState, useEffect } from 'react'
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { Globe, Database, Server, CheckCircle, AlertCircle } from 'lucide-react'

interface DataSource {
  id: string
  name: string
  name_zh: string
  type: 'government' | 'official' | 'third_party'
  country: string
  is_public: boolean
  is_active: boolean
  last_sync_at: string
}

interface DataSourceBadgeProps {
  sourceId?: string
  sourceName?: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function DataSourceBadge({ 
  sourceId, 
  sourceName, 
  showTooltip = true,
  size = 'md' 
}: DataSourceBadgeProps) {
  const [source, setSource] = useState<DataSource | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sourceId || sourceName) {
      fetchDataSource()
    }
  }, [sourceId, sourceName])

  const fetchDataSource = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-sources')
      const data = await response.json()
      
      if (data.sources) {
        const found = data.sources.find((s: DataSource) => 
          s.id === sourceId || s.name === sourceName
        )
        setSource(found || null)
      }
    } catch (error) {
      console.error('Error fetching data source:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Badge variant="outline" className="animate-pulse">Loading...</Badge>
  }

  if (!source) {
    return <Badge variant="outline">Unknown Source</Badge>
  }

  const getIcon = () => {
    switch (source.type) {
      case 'government':
        return <Database className="w-3 h-3" />
      case 'official':
        return <Globe className="w-3 h-3" />
      default:
        return <Database className="w-3 h-3" />
    }
  }

  const getVariant = () => {
    if (!source.is_active) return 'secondary'
    if (source.type === 'government') return 'primary'
    return 'outline'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }

  const badge = (
    <Badge 
      variant={getVariant()} 
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
    >
      {getIcon()}
      <span>{source.name}</span>
      {source.is_public && <CheckCircle className="w-3 h-3 text-green-500" />}
      {!source.is_active && <AlertCircle className="w-3 h-3 text-yellow-500" />}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{source.name_zh || source.name}</p>
            <p className="text-sm text-muted-foreground">{source.country}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className={source.is_public ? 'text-green-600' : 'text-yellow-600'}>
                {source.is_public ? '✓ 公开可访问' : '⚠ 需验证'}
              </span>
            </div>
            {source.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                最后同步: {new Date(source.last_sync_at).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// 数据源列表组件
export function DataSourceList() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDataSources()
  }, [])

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources')
      const data = await response.json()
      setSources(data.sources || [])
    } catch (error) {
      console.error('Error fetching data sources:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading data sources...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">数据来源</h3>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <DataSourceBadge 
            key={source.id} 
            sourceId={source.id}
            showTooltip={true}
          />
        ))}
      </div>
    </div>
  )
}
