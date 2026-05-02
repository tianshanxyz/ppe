'use client'

import { Database, ExternalLink, BadgeCheck, AlertTriangle } from 'lucide-react'

interface DataSourceBadgeProps {
  source?: string
  sourceUrl?: string
  confidenceLevel?: string
  lastVerified?: string
}

export function DataSourceBadge({ source, sourceUrl, confidenceLevel, lastVerified }: DataSourceBadgeProps) {
  if (!source) return null

  const getConfidenceColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceIcon = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return <BadgeCheck className="w-3 h-3 mr-1" />
      case 'medium':
        return <AlertTriangle className="w-3 h-3 mr-1" />
      default:
        return <Database className="w-3 h-3 mr-1" />
    }
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <Database className="w-4 h-4 text-blue-600" />
      <span className="text-blue-800">
        数据来源: {source}
      </span>
      {confidenceLevel && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getConfidenceColor(confidenceLevel)}`}>
          {getConfidenceIcon(confidenceLevel)}
          {confidenceLevel === 'high' ? '高可信度' : confidenceLevel === 'medium' ? '中可信度' : '低可信度'}
        </span>
      )}
      {lastVerified && (
        <span className="text-blue-600 text-xs">
          验证于: {new Date(lastVerified).toLocaleDateString('zh-CN')}
        </span>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
        >
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      )}
    </div>
  )
}
