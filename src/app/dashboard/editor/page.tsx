'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Save, Eye, LogOut, Shield, Home, AlertCircle, Check } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
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
}

export default function EditorDashboard() {
  const locale = useLocale()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'create' | 'my-articles'>('create')
  const [myArticles, setMyArticles] = useState<Article[]>([])
  const [title, setTitle] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [content, setContent] = useState('')
  const [contentZh, setContentZh] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return ''
    try { return JSON.parse(stored)?.token || '' } catch { return '' }
  }

  const fetchUser = () => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('mdlooker_user') || '{}')?.user || null } catch { return null }
  }

  const fetchMyArticles = async () => {
    const u = fetchUser()
    if (!u) return
    const token = getToken()
    try {
      const res = await fetch(`/api/articles?authorId=${u.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setMyArticles(data.articles || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const u = fetchUser()
    if (!u || (u.role !== 'editor' && u.role !== 'admin')) {
      window.location.href = '/'
      return
    }
    setUser(u)
  }, [])

  useEffect(() => {
    if (user && tab === 'my-articles') fetchMyArticles()
  }, [tab, user])

  const handleSubmit = async () => {
    if (!title || !content || !category) {
      setError(locale === 'zh' ? '请填写标题、内容和分类' : 'Please fill in title, content and category')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          title_zh: titleZh,
          content,
          content_zh: contentZh,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(locale === 'zh' ? '文章已提交审核！管理员审核后即可发布' : 'Article submitted for review!')
        setTitle('')
        setTitleZh('')
        setContent('')
        setContentZh('')
        setCategory('')
        setTags('')
      } else {
        setError(data.error || (locale === 'zh' ? '提交失败' : 'Submission failed'))
      }
    } catch {
      setError(locale === 'zh' ? '网络错误' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('mdlooker_user')
    window.location.href = '/'
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{locale === 'zh' ? '加载中...' : 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#339999]" />
                <span className="font-bold text-lg">MDLooker Editor</span>
              </Link>
              <Badge variant="outline" className="bg-[#339999]/10 text-[#339999] border-[#339999]/30">
                {locale === 'zh' ? '编辑' : 'Editor'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm"><Home className="w-4 h-4 mr-1" />{locale === 'zh' ? '首页' : 'Home'}</Button>
              </Link>
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm"><Shield className="w-4 h-4 mr-1" />Admin</Button>
              </Link>
              <span className="text-sm text-gray-600">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />{locale === 'zh' ? '退出' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {message && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />{message}
            <button onClick={() => setMessage('')} className="ml-auto"><AlertCircle className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />{error}
            <button onClick={() => setError('')} className="ml-auto"><AlertCircle className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2
              ${tab === 'create' ? 'bg-white border border-gray-200 border-b-white text-[#339999]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Plus className="w-4 h-4" />{locale === 'zh' ? '新建文章' : 'New Article'}
          </button>
          <button
            onClick={() => { setTab('my-articles'); fetchMyArticles(); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2
              ${tab === 'my-articles' ? 'bg-white border border-gray-200 border-b-white text-[#339999]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4" />{locale === 'zh' ? '我的文章' : 'My Articles'}
          </button>
        </div>

        {tab === 'create' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{locale === 'zh' ? '撰写文章' : 'Write Article'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '文章标题 (English)' : 'Title (English)'}*</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999]"
                placeholder={locale === 'zh' ? '输入英文标题' : 'Enter title in English'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '文章标题 (中文)' : 'Title (Chinese)'}</label>
              <input type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999]"
                placeholder={locale === 'zh' ? '输入中文标题（可选）' : 'Enter Chinese title (optional)'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '内容 (English)' : 'Content (English)'}*</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999] font-mono text-sm"
                placeholder={locale === 'zh' ? '支持Markdown格式...' : 'Support Markdown format...'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '内容 (中文)' : 'Content (Chinese)'}</label>
              <textarea value={contentZh} onChange={e => setContentZh(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999] font-mono text-sm"
                placeholder={locale === 'zh' ? '中文内容（可选）' : 'Chinese content (optional)'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '分类' : 'Category'}*</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999]">
                  <option value="">{locale === 'zh' ? '选择分类' : 'Select category'}</option>
                  <option value="compliance">{locale === 'zh' ? '合规法规' : 'Compliance'}</option>
                  <option value="market">{locale === 'zh' ? '市场动态' : 'Market'}</option>
                  <option value="technical">{locale === 'zh' ? '技术指南' : 'Technical'}</option>
                  <option value="industry">{locale === 'zh' ? '行业洞察' : 'Industry'}</option>
                  <option value="product">{locale === 'zh' ? '产品资讯' : 'Product'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'zh' ? '标签' : 'Tags'}</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339999]"
                  placeholder="FDA, CE, N95, mask" />
                <p className="text-xs text-gray-400 mt-1">{locale === 'zh' ? '逗号分隔' : 'Comma separated'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setTitle(''); setTitleZh(''); setContent(''); setContentZh('');
                setCategory(''); setTags(''); setError(''); setMessage('');
              }}>
                {locale === 'zh' ? '清空' : 'Clear'}
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-[#339999] hover:bg-[#2d8b8b] text-white">
                <Save className="w-4 h-4 mr-1" />
                {loading ? (locale === 'zh' ? '提交中...' : 'Submitting...') : (locale === 'zh' ? '提交审核' : 'Submit for Review')}
              </Button>
            </div>
          </div>
        )}

        {tab === 'my-articles' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{locale === 'zh' ? '我的文章' : 'My Articles'}</h2>
            {myArticles.length === 0 && (
              <p className="text-gray-500 py-8 text-center">{locale === 'zh' ? '还没有文章' : 'No articles yet'}</p>
            )}
            {myArticles.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{a.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Badge variant="outline">{a.category}</Badge>
                      <Badge className={
                        a.status === 'published' ? 'bg-green-100 text-green-700' :
                        a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }>
                        {a.status === 'published' ? (locale === 'zh' ? '已发布' : 'Published') :
                         a.status === 'pending' ? (locale === 'zh' ? '审核中' : 'Pending') :
                         a.status === 'rejected' ? (locale === 'zh' ? '已拒绝' : 'Rejected') :
                         a.status}
                      </Badge>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                      {a.tags?.map(t => <span key={t} className="text-xs text-gray-400">#{t}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}