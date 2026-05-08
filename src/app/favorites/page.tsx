'use client'

import { useState, useEffect } from 'react'
import { Star, Search, Filter, Download, Share2, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  RegulationFavoriteList,
  RegulationFavoriteStats,
  FavoriteRegulation
} from '@/components/regulations/RegulationFavoriteComponents'
import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function FavoritesPage() {
  const locale = useLocale()
  const [favorites, setFavorites] = useState<FavoriteRegulation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    byMarket: {} as Record<string, number>,
    byCategory: {} as Record<string, number>
  })

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()

      if (data.favorites) {
        setFavorites(data.favorites)
        calculateStats(data.favorites)
      }
    } catch (error) {
      console.error(locale === 'zh' ? '加载收藏失败:' : 'Failed to load favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (favorites: FavoriteRegulation[]) => {
    const byMarket: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    favorites.forEach(f => {
      byMarket[f.jurisdiction] = (byMarket[f.jurisdiction] || 0) + 1
      byCategory[f.category] = (byCategory[f.category] || 0) + 1
    })

    setStats({
      total: favorites.length,
      byMarket,
      byCategory
    })
  }

  const filteredFavorites = favorites.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMarket = selectedMarket === 'all' || f.jurisdiction === selectedMarket

    return matchesSearch && matchesMarket
  })

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/favorites/${id}`, { method: 'DELETE' })
      setFavorites(prev => prev.filter(f => f.id !== id))
      calculateStats(favorites.filter(f => f.id !== id))
    } catch (error) {
      console.error(locale === 'zh' ? '移除收藏失败:' : 'Failed to remove favorite:', error)
    }
  }

  const handleDownload = (regulation: FavoriteRegulation) => {
    console.log(locale === 'zh' ? '下载法规:' : 'Download regulation:', regulation.title)
  }

  const handleShare = (regulation: FavoriteRegulation) => {
    console.log(locale === 'zh' ? '分享法规:' : 'Share regulation:', regulation.title)
  }

  const handleAddNote = async (id: string, note: string) => {
    try {
      await fetch(`/api/favorites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note })
      })
    } catch (error) {
      console.error(locale === 'zh' ? '保存备注失败:' : 'Failed to save note:', error)
    }
  }

  const markets = Array.from(new Set(favorites.map(f => f.jurisdiction)))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-4 border-[#339999] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">{locale === 'zh' ? '加载收藏...' : 'Loading favorites...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          <Star className="inline w-8 h-8 mr-2 text-[#339999]" />
          {locale === 'zh' ? '我的收藏' : 'My Favorites'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'zh' ? '管理您收藏的重要法规文件' : 'Manage your saved regulation documents'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={locale === 'zh' ? '搜索收藏...' : 'Search favorites...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#339999]"
                  >
                    <option value="all">{locale === 'zh' ? '全部市场' : 'All Markets'}</option>
                    {markets.map(market => (
                      <option key={market} value={market}>
                        {market === 'US' ? `🇺🇸 ${locale === 'zh' ? '美国' : 'United States'}` :
                         market === 'EU' ? `🇪🇺 ${locale === 'zh' ? '欧盟' : 'European Union'}` :
                         market === 'CN' ? `🇨🇳 ${locale === 'zh' ? '中国' : 'China'}` :
                         market === 'JP' ? `🇯🇵 ${locale === 'zh' ? '日本' : 'Japan'}` :
                         market === 'UK' ? `🇬🇧 ${locale === 'zh' ? '英国' : 'United Kingdom'}` :
                         market === 'AU' ? `🇦🇺 ${locale === 'zh' ? '澳大利亚' : 'Australia'}` :
                         market === 'CA' ? `🇨🇦 ${locale === 'zh' ? '加拿大' : 'Canada'}` :
                         market === 'SG' ? `🇸🇬 ${locale === 'zh' ? '新加坡' : 'Singapore'}` : market}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <RegulationFavoriteList
            regulations={filteredFavorites}
            onRemove={handleRemove}
            onDownload={handleDownload}
            onShare={handleShare}
            onAddNote={handleAddNote}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === 'zh' ? '收藏统计' : 'Favorites Statistics'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-[#339999] mb-2">
                  {stats.total}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh' ? '收藏的法规总数' : 'Total saved regulations'}
                </p>
              </div>
              <RegulationFavoriteStats
                total={stats.total}
                byMarket={stats.byMarket}
                byCategory={stats.byCategory}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{locale === 'zh' ? '操作' : 'Actions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => console.log(locale === 'zh' ? '导出所有收藏' : 'Export all favorites')}
              >
                <Download className="w-4 h-4 mr-2" />
                {locale === 'zh' ? '导出所有收藏' : 'Export All'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm(locale === 'zh' ? '确定要清空所有收藏吗？' : 'Are you sure you want to clear all favorites?')) {
                    setFavorites([])
                    setStats({ total: 0, byMarket: {}, byCategory: {} })
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {locale === 'zh' ? '清空所有收藏' : 'Clear All'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
