'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Newspaper, 
  Bell, 
  Calendar, 
  ArrowRight, 
  ExternalLink,
  Filter,
  Bookmark,
  Share2,
  Clock,
  Loader2
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  publishDate: string
  category: 'regulation' | 'guidance' | 'warning' | 'recall' | 'approval'
  region: string
  isHot?: boolean
  isNew?: boolean
  externalUrl?: string
  views?: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const categories = [
  { id: 'all', name: 'All News', color: 'gray' },
  { id: 'regulation', name: 'Regulations', color: 'blue' },
  { id: 'guidance', name: 'Guidance', color: 'green' },
  { id: 'warning', name: 'Safety Alerts', color: 'amber' },
  { id: 'recall', name: 'Recalls', color: 'red' },
  { id: 'approval', name: 'Approvals', color: 'purple' }
]

const regions = ['All Regions', 'US', 'EU', 'China', 'Japan', 'Singapore', 'Australia', 'Canada']

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    regulation: 'bg-blue-100 text-blue-700 border-blue-200',
    guidance: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    recall: 'bg-red-100 text-red-700 border-red-200',
    approval: 'bg-purple-100 text-purple-700 border-purple-200'
  }
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// 从后端获取新闻数据
async function fetchComplianceNews(
  category?: string,
  region?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: NewsItem[]; pagination: Pagination }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  if (category && category !== 'all') {
    params.append('category', category)
  }
  
  if (region && region !== 'All Regions') {
    params.append('region', region)
  }

  const response = await fetch(`/api/compliance-news?${params.toString()}`)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch compliance news')
  }
  
  return {
    data: result.data,
    pagination: result.pagination
  }
}

export function ComplianceNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    loadNews()
  }, [selectedCategory, selectedRegion, pagination.page])

  const loadNews = async () => {
    try {
      setLoading(true)
      const result = await fetchComplianceNews(
        selectedCategory,
        selectedRegion,
        pagination.page,
        pagination.limit
      )
      setNews(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  if (loading && news.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#339999] mx-auto mb-4" />
        <p className="text-gray-600">Loading compliance news...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Compliance Intelligence</h2>
              <p className="text-gray-400 text-sm">Daily updates on global regulatory changes</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowSubscribeModal(true)}
            className="bg-[#339999] hover:bg-[#2a7a7a]"
          >
            <Bell className="w-4 h-4 mr-2" />
            Subscribe Updates
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter by:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${selectedCategory === cat.id 
                    ? 'bg-[#339999] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none"
          >
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 新闻列表 */}
      <div className="p-8">
        <div className="space-y-4">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-5 rounded-xl border border-gray-200 hover:border-[#339999] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getCategoryColor(item.category)} text-xs`}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                    {item.isHot && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        🔥 Hot
                      </Badge>
                    )}
                    {item.isNew && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        New
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.publishDate}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#339999] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#339999]" />
                        {item.source}
                      </span>
                      <span className="text-xs text-gray-500">{item.region}</span>
                      {item.views !== undefined && item.views > 0 && (
                        <span className="text-xs text-gray-500">
                          {item.views.toLocaleString()} views
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      {item.externalUrl ? (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-[#339999] hover:underline"
                        >
                          Read More
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-[#339999]">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {news.length === 0 && !loading && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No news found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}

        {/* 加载更多 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              className="px-8"
              onClick={handleLoadMore}
              disabled={loading || pagination.page >= pagination.totalPages}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More News
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 订阅弹窗 */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#339999]/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#339999]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Informed</h3>
              <p className="text-gray-600 text-sm">
                Get daily compliance updates delivered to your inbox. Never miss important regulatory changes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-[#339999] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interested Regions</label>
                <div className="flex flex-wrap gap-2">
                  {['US', 'EU', 'China', 'Japan', 'Singapore'].map((region) => (
                    <label key={region} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                      <input type="checkbox" className="rounded text-[#339999]" />
                      <span className="text-sm">{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
                <div className="flex flex-wrap gap-2">
                  {['Regulations', 'Guidance', 'Recalls', 'Approvals'].map((topic) => (
                    <label key={topic} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                      <input type="checkbox" className="rounded text-[#339999]" />
                      <span className="text-sm">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSubscribeModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#339999] hover:bg-[#2a7a7a]"
                onClick={() => {
                  setShowSubscribeModal(false)
                  // 显示成功提示
                }}
              >
                Subscribe
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Free for basic plan. Premium subscribers get real-time alerts.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
