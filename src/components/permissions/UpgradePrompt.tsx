'use client'

import { Shield, ArrowUpRight, Crown, LogIn } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { UserRole } from '@/lib/permissions'

interface UpgradePromptProps {
  type: 'search' | 'download' | 'tracker'
  currentRole: UserRole
  reason?: string
  quota?: { used: number; limit: number; remaining: number; period: string }
}

export function UpgradePrompt({ type, currentRole, reason, quota }: UpgradePromptProps) {
  const locale = useLocale()

  const titles: Record<string, { en: string; zh: string }> = {
    search: { en: 'Search Limit Reached', zh: '搜索次数已用完' },
    download: { en: 'Download Limit Reached', zh: '下载次数已用完' },
    tracker: { en: 'Tracker Limit Reached', zh: '追踪数量已达上限' },
  }

  const suggestions: Record<'guest' | 'user' | 'vip', { en: string; zh: string; action: string; link: string }> = {
    guest: {
      en: 'Register for a free account to get 999 searches per month + tracker access!',
      zh: '注册免费账号，获取每月999次搜索额度 + 产品追踪功能！',
      action: locale === 'zh' ? '免费注册' : 'Register Free',
      link: '/login?action=register',
    },
    user: {
      en: 'Upgrade to VIP for unlimited searches, downloads, and tracker products!',
      zh: '升级VIP获取无限搜索、无限下载和无限产品追踪！',
      action: locale === 'zh' ? '升级VIP' : 'Upgrade to VIP',
      link: '/pricing',
    },
    vip: {
      en: 'Contact us for custom enterprise solutions.',
      zh: '联系我们获取定制化企业解决方案。',
      action: locale === 'zh' ? '联系我们' : 'Contact Us',
      link: '/contact',
    },
  }

  const roleKey = (currentRole === 'editor' || currentRole === 'admin') ? 'vip' : currentRole
  const suggestion = suggestions[roleKey as 'guest' | 'user' | 'vip'] || suggestions.guest

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {titles[type]?.[locale === 'zh' ? 'zh' : 'en'] || titles.search.en}
          </h3>
          {reason && <p className="text-sm text-gray-600 mb-2">{reason}</p>}
          {quota && (
            <p className="text-xs text-gray-500 mb-2">
              {locale === 'zh' ? `已使用: ${quota.used}/${quota.limit}` : `Used: ${quota.used}/${quota.limit}`}
            </p>
          )}
          <p className="text-sm text-gray-700 mb-3">{suggestion[locale === 'zh' ? 'zh' : 'en']}</p>
          <div className="flex items-center gap-2">
            <Link href={suggestion.link}>
              <Button size="sm" className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                {currentRole === 'guest' ? <LogIn className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                {suggestion.action}
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
            {currentRole === 'guest' && (
              <Link href="/login">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <LogIn className="w-4 h-4" />
                  {locale === 'zh' ? '登录' : 'Login'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}