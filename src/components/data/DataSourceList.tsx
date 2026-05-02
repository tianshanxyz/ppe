'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, Badge, Button } from '@/components/ui'

// Simple Progress component since we don't have one
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-primary-600 h-2 rounded-full transition-all" 
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
import { 
  Database, 
  Globe, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Clock
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  name_zh: string
  type: 'government' | 'official' | 'third_party'
  country: string
  country_code: string
  website_url: string
  record_count: number
  update_frequency: string
  last_sync_at: string
  is_public: boolean
  is_active: boolean
}

export function DataSourceList() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

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

  const handleSync = async (sourceId: string) => {
    setSyncing(sourceId)
    try {
      const response = await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Sync completed: ${result.message}`)
        fetchDataSources() // Refresh the list
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'government':
        return <Database className="w-5 h-5 text-primary-500" />
      case 'official':
        return <Globe className="w-5 h-5 text-green-500" />
      default:
        return <Server className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (source: DataSource) => {
    if (!source.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (source.is_public) {
      return (
        <Badge variant="primary" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    }
    return <Badge variant="outline">Restricted</Badge>
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <Card key={source.id} className={!source.is_active ? 'opacity-60' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getIcon(source.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{source.name}</h3>
                    {getStatusBadge(source)}
                  </div>
                  <p className="text-sm text-muted-foreground">{source.name_zh}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {source.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-4 h-4" />
                      {formatNumber(source.record_count)} records
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTimeAgo(source.last_sync_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(source.website_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visit
                </Button>
                {source.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(source.id)}
                    disabled={syncing === source.id}
                  >
                    {syncing === source.id ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Sync
                  </Button>
                )}
              </div>
            </div>
            
            {source.record_count > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Data coverage</span>
                  <span className="font-medium">{formatNumber(source.record_count)} records</span>
                </div>
                <Progress 
                  value={Math.min((source.record_count / 100000) * 100, 100)} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
