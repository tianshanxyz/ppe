'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  StarOff, 
  Heart, 
  HeartOff, 
  Calendar, 
  Globe, 
  FileText, 
  Trash2,
  Download,
  Share2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'

export interface FavoriteRegulation {
  id: string
  regulation_id: string
  title: string
  jurisdiction: string
  category: string
  status: string
  effective_date: string
  created_at: string
  notes?: string
}

interface RegulationFavoriteCardProps {
  regulation: FavoriteRegulation
  onRemove?: (id: string) => void
  onDownload?: (regulation: FavoriteRegulation) => void
  onShare?: (regulation: FavoriteRegulation) => void
  onAddNote?: (id: string, note: string) => void
}

export function RegulationFavoriteCard({
  regulation,
  onRemove,
  onDownload,
  onShare,
  onAddNote
}: RegulationFavoriteCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [note, setNote] = useState(regulation.notes || '')

  useEffect(() => {
    setNote(regulation.notes || '')
  }, [regulation.notes])

  const handleSaveNote = () => {
    if (onAddNote) {
      onAddNote(regulation.id, note)
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
    <Card
      className="transition-all hover:shadow-md"
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {getMarketFlag(regulation.jurisdiction)} {regulation.jurisdiction}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {regulation.category}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-yellow-500"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>已收藏</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onRemove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => onRemove(regulation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>移除收藏</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <CardTitle className="text-base mt-3 line-clamp-2">
          {regulation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>生效: {formatDate(regulation.effective_date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {regulation.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {regulation.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-3">
            <div className="flex items-start space-x-2">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{regulation.notes}"
                </p>
              </div>
            </div>
          </div>
        )}

        {showNotes && (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#339999]"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveNote}
                className="text-xs"
              >
                保存备注
              </Button>
            </div>
          </div>
        )}

        {!showNotes && regulation.notes && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(true)}
            className="text-xs w-full"
          >
            编辑备注
          </Button>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t bg-gray-50 dark:bg-gray-900/50 flex justify-between">
        {onDownload && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 text-xs"
            onClick={() => onDownload(regulation)}
          >
            <Download className="w-3 h-3" />
            <span>下载</span>
          </Button>
        )}
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 text-xs"
            onClick={() => onShare(regulation)}
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </Button>
        )}
      </CardFooter>
    </Card>
    </div>
  )
}

interface RegulationFavoriteListProps {
  regulations: FavoriteRegulation[]
  onRemove?: (id: string) => void
  onDownload?: (regulation: FavoriteRegulation) => void
  onShare?: (regulation: FavoriteRegulation) => void
  onAddNote?: (id: string, note: string) => void
}

export function RegulationFavoriteList({
  regulations,
  onRemove,
  onDownload,
  onShare,
  onAddNote
}: RegulationFavoriteListProps) {
  if (regulations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <StarOff className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          暂无收藏的法规
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          浏览法规时点击收藏按钮，即可在此查看您收藏的重要法规文件
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          收藏的法规 (
          {regulations.length}
          )
        </h2>
      </div>
      <div className="grid gap-4">
        {regulations.map((regulation) => (
          <RegulationFavoriteCard
            key={regulation.id}
            regulation={regulation}
            onRemove={onRemove}
            onDownload={onDownload}
            onShare={onShare}
            onAddNote={onAddNote}
          />
        ))}
      </div>
    </div>
  )
}

interface RegulationFavoriteStatsProps {
  total: number
  byMarket: Record<string, number>
  byCategory: Record<string, number>
}

export function RegulationFavoriteStats({
  total,
  byMarket,
  byCategory
}: RegulationFavoriteStatsProps) {
  const sortedByMarket = Object.entries(byMarket)
    .sort((a, b) => b[1] - a[1])
  
  const sortedByCategory = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            按市场分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedByMarket.length > 0 ? (
              sortedByMarket.map(([market, count]) => (
                <div key={market} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {market === 'US' ? '🇺🇸' : 
                       market === 'EU' ? '🇪🇺' : 
                       market === 'CN' ? '🇨🇳' : 
                       market === 'JP' ? '🇯🇵' : 
                       market === 'UK' ? '🇬🇧' : 
                       market === 'AU' ? '🇦🇺' : 
                       market === 'CA' ? '🇨🇦' : 
                       market === 'SG' ? '🇸🇬' : '🌍'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {market}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            按分类分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedByCategory.length > 0 ? (
              sortedByCategory.map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
