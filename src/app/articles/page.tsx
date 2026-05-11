'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Calendar, Tag, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface Article {
  id: string
  title: string
  title_zh?: string
  content: string
  content_zh?: string
  authorName: string
  status: string
  category: string
  tags: string[]
  createdAt: string
  publishedAt?: string
}

export default function ArticlesPage() {
  const locale = useLocale()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/articles')
        const data = await res.json()
        setArticles(data.articles || [])
      } catch (e) {
        console.error('Failed to load articles:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {locale === 'zh' ? '行业文章' : 'Industry Articles'}
          </h1>
          <p className="text-gray-600">
            {locale === 'zh' ? 'PPE合规、法规动态与行业洞察' : 'PPE compliance, regulatory updates, and industry insights'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12 text-gray-500">
            {locale === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {locale === 'zh' ? '暂无文章' : 'No articles yet'}
          </div>
        )}

        {!loading && articles.map(article => (
          <Link key={article.id} href={`/articles/${article.id}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#339999]" />
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-[#339999] transition-colors">
                    {locale === 'zh' && article.title_zh ? article.title_zh : article.title}
                  </h2>
                </div>
                <p className="text-gray-600 line-clamp-2 text-sm">
                  {locale === 'zh' && article.content_zh
                    ? article.content_zh.substring(0, 200)
                    : article.content.substring(0, 200)}...
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  {article.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs text-gray-400">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                  <span className="text-gray-400">{article.authorName}</span>
                </div>
                <div className="flex items-center gap-1 text-[#339999] text-sm font-medium">
                  {locale === 'zh' ? '阅读更多' : 'Read more'}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}