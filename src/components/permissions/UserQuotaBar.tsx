'use client'

import { useState, useEffect } from 'react'
import { Search, Download, Activity, Shield, Crown, ArrowUpRight, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getUserRoleLabel } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'

interface QuotaInfo {
  role: UserRole
  permissions: {
    searches: { used: number; limit: number; remaining: number; period: string }
    downloads: { used: number; limit: number; remaining: number; period: string }
    trackerProducts: { used: number; limit: number; remaining: number; period: string }
    apiAccess: boolean; aiSearch: boolean; complianceTracker: boolean; favorites: boolean; reports: boolean
  }
}

const ROLE_COLORS: Record<UserRole, string> = {
  guest: 'text-gray-400 bg-gray-50 border-gray-200',
  user: 'text-blue-600 bg-blue-50 border-blue-200',
  vip: 'text-amber-600 bg-amber-50 border-amber-200',
}

export function UserQuotaBar() {
  const locale = useLocale()
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const token = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('mdlooker_user') || '{}')?.token || '' } catch { return '' } })() : ''
        const res = await fetch('/api/permissions?action=status', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        })
        if (res.ok) setQuota(await res.json())
      } catch { /* ignore */ }
    }
    fetchQuota()
  }, [])

  if (!quota) return null

  const role = quota.role
  const roleColor = ROLE_COLORS[role]
  const roleLabel = getUserRoleLabel(role, locale)
  const sq = quota.permissions.searches
  const dq = quota.permissions.downloads

  return (
    <div className={`rounded-lg border p-3 ${roleColor} mb-4`}>
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 text-left">
          <Shield className={`w-4 h-4 ${role === 'vip' ? 'text-amber-500' : role === 'guest' ? 'text-gray-400' : ''}`} />
          <span className="text-sm font-medium">{roleLabel}</span>
          {sq.limit === -1 ? <span className="text-xs ml-2">{locale === 'zh' ? '搜索: 无限' : 'Search: Unlimited'}</span> : sq.limit > 0 && <span className="text-xs ml-2">{locale === 'zh' ? `搜索: ${sq.remaining}/${sq.limit}` : `Search: ${sq.remaining}/${sq.limit}`}</span>}
          <span className="text-xs text-gray-400 ml-auto">{expanded ? '▴' : '▾'}</span>
        </button>
        {role === 'guest' && (
          <Link href="/auth/login" className="text-xs text-[#339999] hover:underline flex items-center gap-0.5 ml-2 flex-shrink-0">
            {locale === 'zh' ? '注册/登录' : 'Sign Up'}<ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
        {role === 'user' && (
          <Link href="/pricing" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5 ml-2 flex-shrink-0">
            {locale === 'zh' ? '升级VIP' : 'Upgrade'}<Crown className="w-3 h-3" />
          </Link>
        )}
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1"><Search className="w-3 h-3" />{locale === 'zh' ? '搜索' : 'Searches'}</span>
            <span>{sq.limit === -1 ? (locale === 'zh' ? '无限' : 'Unlimited') : `${sq.used}/${sq.limit}`}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{locale === 'zh' ? '下载' : 'Downloads'}</span>
            <span>{dq.limit === -1 ? (locale === 'zh' ? '无限' : 'Unlimited') : dq.limit === 0 ? (locale === 'zh' ? '需注册' : 'Register') : `${dq.used}/${dq.limit}`}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{locale === 'zh' ? '追踪' : 'Tracker'}</span>
            <span>{quota.permissions.trackerProducts.limit === -1 ? (locale === 'zh' ? '无限' : 'Unlimited') : quota.permissions.trackerProducts.limit === 0 ? (locale === 'zh' ? '需注册' : 'Register') : `${quota.permissions.trackerProducts.used}/${quota.permissions.trackerProducts.limit}`}</span>
          </div>
        </div>
      )}
    </div>
  )
}