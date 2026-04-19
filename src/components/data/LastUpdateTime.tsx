'use client'

import { useEffect, useState } from 'react'
import { Clock, RefreshCw, Calendar } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

interface LastUpdateTimeProps {
  timestamp: string
  frequency?: 'daily' | 'weekly' | 'monthly'
  showNextUpdate?: boolean
}

export function LastUpdateTime({ 
  timestamp, 
  frequency = 'daily',
  showNextUpdate = true 
}: LastUpdateTimeProps) {
  const [timeAgo, setTimeAgo] = useState('')
  const [nextUpdate, setNextUpdate] = useState('')

  useEffect(() => {
    calculateTimeAgo()
    calculateNextUpdate()
    
    // 每分钟更新一次
    const interval = setInterval(() => {
      calculateTimeAgo()
      calculateNextUpdate()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [timestamp, frequency])

  const calculateTimeAgo = () => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      setTimeAgo('刚刚')
    } else if (diffMins < 60) {
      setTimeAgo(`${diffMins} 分钟前`)
    } else if (diffHours < 24) {
      setTimeAgo(`${diffHours} 小时前`)
    } else {
      setTimeAgo(`${diffDays} 天前`)
    }
  }

  const calculateNextUpdate = () => {
    const date = new Date(timestamp)
    let nextDate = new Date(date)
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(date.getDate() + 1)
        nextDate.setHours(2, 0, 0, 0) // 凌晨 2 点
        break
      case 'weekly':
        nextDate.setDate(date.getDate() + 7)
        nextDate.setHours(2, 0, 0, 0)
        break
      case 'monthly':
        nextDate.setMonth(date.getMonth() + 1)
        nextDate.setHours(2, 0, 0, 0)
        break
    }
    
    const now = new Date()
    if (nextDate < now) {
      nextDate = now
      nextDate.setHours(2, 0, 0, 0)
      if (nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1)
      }
    }
    
    setNextUpdate(nextDate.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  }

  const getFrequencyText = () => {
    switch (frequency) {
      case 'daily':
        return '每日更新'
      case 'weekly':
        return '每周更新'
      case 'monthly':
        return '每月更新'
      default:
        return '定期更新'
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-help">
            <Clock className="w-4 h-4" />
            <span>{timeAgo}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">{getFrequencyText()}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              最后更新: {new Date(timestamp).toLocaleString('zh-CN')}
            </p>
            {showNextUpdate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>下次更新: {nextUpdate}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// 更新频率组件
interface UpdateFrequencyProps {
  frequency: 'daily' | 'weekly' | 'monthly'
  className?: string
}

export function UpdateFrequency({ frequency, className = '' }: UpdateFrequencyProps) {
  const config = {
    daily: {
      label: '每日更新',
      color: 'text-green-600 bg-green-50',
      icon: '●'
    },
    weekly: {
      label: '每周更新',
      color: 'text-primary-600 bg-primary-50',
      icon: '●'
    },
    monthly: {
      label: '每月更新',
      color: 'text-orange-600 bg-orange-50',
      icon: '●'
    }
  }

  const { label, color, icon } = config[frequency]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
