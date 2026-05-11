'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Users, PenTool, Check, X, RotateCcw, LogOut, Shield, Home, AlertCircle } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface Article {
  id: string
  title: string
  authorName: string
  status: string
  category: string
  createdAt: string
}

interface ContentChange {
  id: string
  targetType: string
  targetId: string
  targetName: string
  fieldName: string
  oldValue: any
  newValue: any
  submittedByName: string
  status: string
  createdAt: string
}

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  membership: string
  company: string
  createdAt: string
}

export default function AdminDashboard() {
  const locale = useLocale()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'articles' | 'changes' | 'users'>('articles')
  const [articles, setArticles] = useState<Article[]>([])
  const [changes, setChanges] = useState<ContentChange[]>([])
  const [allUsers, setAllUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewComment, setReviewComment] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<string>('')
  const [selectedChange, setSelectedChange] = useState<string>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return ''
    try {
      const parsed = JSON.parse(stored)
      return parsed.token || ''
    } catch { return '' }
  }

  const fetchUser = () => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return null
    try {
      return JSON.parse(stored)?.user || null
    } catch { return null }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/articles?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setArticles(data.articles || [])
    } catch (e) { setError('Failed to load articles') }
    setLoading(false)
  }

  const fetchChanges = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/content-changes?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setChanges(data.changes || [])
    } catch (e) { setError('Failed to load changes') }
    setLoading(false)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setAllUsers(data.users || [])
    } catch (e) { setError('Failed to load users') }
    setLoading(false)
  }

  useEffect(() => {
    const u = fetchUser()
    if (!u || u.role !== 'admin') {
      window.location.href = '/'
      return
    }
    setUser(u)
  }, [])

  useEffect(() => {
    if (!user) return
    if (tab === 'articles') fetchArticles()
    else if (tab === 'changes') fetchChanges()
    else fetchUsers()
  }, [tab, user])

  const handleArticleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = getToken()
      const res = await fetch('/api/articles/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, action, comment: reviewComment })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Article ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        fetchArticles()
      } else {
        setError(data.error || 'Action failed')
      }
    } catch (e) { setError('Action failed') }
  }

  const handleChangeAction = async (id: string, action: 'approve' | 'reject' | 'rollback') => {
    try {
      const token = getToken()
      const res = await fetch('/api/content-changes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, action, comment: reviewComment })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Change ${action}ed successfully`)
        fetchChanges()
      } else {
        setError(data.error || 'Action failed')
      }
    } catch (e) { setError('Action failed') }
  }

  const handleUserUpdate = async (id: string, updates: { role?: string; membership?: string }) => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...updates })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('User updated successfully')
        fetchUsers()
      } else {
        setError(data.error || 'Update failed')
      }
    } catch (e) { setError('Update failed') }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setMessage('User deleted successfully')
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Delete failed')
      }
    } catch (e) { setError('Delete failed') }
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
                <span className="font-bold text-lg">MDLooker Admin</span>
              </Link>
              <Badge variant="outline" className="bg-[#339999]/10 text-[#339999] border-[#339999]/30">
                {user.role}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  {locale === 'zh' ? '首页' : 'Home'}
                </Button>
              </Link>
              <span className="text-sm text-gray-600">{user.name} ({user.email})</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                {locale === 'zh' ? '退出' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {message}
            <button onClick={() => setMessage('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setTab('articles')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2
              ${tab === 'articles' ? 'bg-white border border-gray-200 border-b-white text-[#339999]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4" />
            {locale === 'zh' ? '文章审核' : 'Article Review'}
            {articles.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{articles.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('changes')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2
              ${tab === 'changes' ? 'bg-white border border-gray-200 border-b-white text-[#339999]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PenTool className="w-4 h-4" />
            {locale === 'zh' ? '内容修改审核' : 'Content Changes'}
            {changes.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{changes.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2
              ${tab === 'users' ? 'bg-white border border-gray-200 border-b-white text-[#339999]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4" />
            {locale === 'zh' ? '用户管理' : 'User Management'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-500">
            {locale === 'zh' ? '加载中...' : 'Loading...'}
          </div>
        )}

        {!loading && tab === 'articles' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {locale === 'zh' ? '待审核文章' : 'Pending Articles'}
            </h2>
            {articles.length === 0 && (
              <p className="text-gray-500 py-8 text-center">
                {locale === 'zh' ? '没有待审核的文章' : 'No pending articles'}
              </p>
            )}
            {articles.map(article => (
              <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{locale === 'zh' ? '作者' : 'Author'}: {article.authorName}</span>
                      <Badge variant="outline">{article.category}</Badge>
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedArticle === article.id && (
                      <div className="mt-3">
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder={locale === 'zh' ? '审核意见（可选）' : 'Review comment (optional)'}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {selectedArticle === article.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleArticleAction(article.id, 'approve')
                            setSelectedArticle('')
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {locale === 'zh' ? '通过' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleArticleAction(article.id, 'reject')
                            setSelectedArticle('')
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {locale === 'zh' ? '拒绝' : 'Reject'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedArticle(article.id)
                          setReviewComment('')
                        }}
                      >
                        {locale === 'zh' ? '审核' : 'Review'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'changes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {locale === 'zh' ? '待审核内容修改' : 'Pending Content Changes'}
            </h2>
            {changes.length === 0 && (
              <p className="text-gray-500 py-8 text-center">
                {locale === 'zh' ? '没有待审核的内容修改' : 'No pending content changes'}
              </p>
            )}
            {changes.map(change => (
              <div key={change.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={change.targetType === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                      {change.targetType === 'product' ? 'Product' : 'Company'}
                    </Badge>
                    <span className="font-semibold">{change.targetName}</span>
                    <span className="text-sm text-gray-500">{change.submittedByName}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-gray-700 min-w-[80px]">{locale === 'zh' ? '字段' : 'Field'}:</span>
                      <span className="text-gray-600">{change.fieldName}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-gray-700 min-w-[80px]">{locale === 'zh' ? '原值' : 'Old'}:</span>
                      <span className="text-gray-500 line-through">{String(change.oldValue || '(empty)')}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-gray-700 min-w-[80px]">{locale === 'zh' ? '新值' : 'New'}:</span>
                      <span className="text-green-700 font-medium">{String(change.newValue)}</span>
                    </div>
                  </div>
                  {selectedChange === change.id && (
                    <div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={locale === 'zh' ? '审核意见（可选）' : 'Review comment (optional)'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        rows={2}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedChange === change.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleChangeAction(change.id, 'approve')
                            setSelectedChange('')
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {locale === 'zh' ? '通过' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleChangeAction(change.id, 'reject')
                            setSelectedChange('')
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {locale === 'zh' ? '拒绝' : 'Reject'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedChange(change.id)
                          setReviewComment('')
                        }}
                      >
                        {locale === 'zh' ? '审核' : 'Review'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleChangeAction(change.id, 'rollback')}
                      className="text-orange-600 hover:bg-orange-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      {locale === 'zh' ? '回滚' : 'Rollback'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {locale === 'zh' ? '用户管理' : 'User Management'}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{locale === 'zh' ? '用户' : 'User'}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{locale === 'zh' ? '角色' : 'Role'}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{locale === 'zh' ? '会员' : 'Membership'}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{locale === 'zh' ? '注册时间' : 'Registered'}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{locale === 'zh' ? '操作' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.company}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleUserUpdate(u.id, { role: e.target.value })}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="vip">VIP</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.membership}
                          onChange={(e) => handleUserUpdate(u.id, { membership: e.target.value })}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="free">Free</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:bg-red-50 text-xs"
                        >
                          {locale === 'zh' ? '删除' : 'Delete'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}