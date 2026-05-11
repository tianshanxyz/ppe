'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Tag, User, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useParams } from 'next/navigation'

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

export default function ArticleDetail() {
  const locale = useLocale()
  const { id } = useParams() as { id: string }
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchArticle = async () => {
      try {
        const res = await fetch('/api/articles')
        const data = await res.json()
        const found = (data.articles || []).find((a: Article) => a.id === id)
        setArticle(found || null)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchArticle()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{locale === 'zh' ? '加载中...' : 'Loading...'}</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{locale === 'zh' ? '文章未找到' : 'Article Not Found'}</h1>
          <Link href="/articles" className="text-[#339999] hover:underline">{locale === 'zh' ? '返回文章列表' : 'Back to articles'}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/articles" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#339999] mb-4">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'zh' ? '返回文章列表' : 'Back to articles'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {locale === 'zh' && article.title_zh ? article.title_zh : article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />{article.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
            </span>
            <Badge variant="outline" className="text-xs">{article.category}</Badge>
            {article.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-gray-400">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <article className="prose prose-gray max-w-none">
            {locale === 'zh' && article.content_zh ? (
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{article.content_zh}</div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{article.content}</div>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}