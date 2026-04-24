'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Menu,
  X,
  Shield,
  LogIn,
  UserPlus,
  ChevronDown,
  CheckCircle,
  Globe,
  Database,
  BookOpen,
  FileText,
  Calculator,
  Clock,
  Building2,
  Package,
  Gavel,
  FolderOpen,
  Lightbulb,
  Newspaper,
  User,
  ClipboardList,
  Bell,
  Key,
  Settings
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { navTranslations, getTranslations } from '@/lib/i18n/translations'
import { Locale, localeLabels } from '@/lib/i18n/config'

export function PPENavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { locale, setLocale } = useLanguage()
  const [showLangMenu, setShowLangMenu] = useState(false)

  // 获取当前语言的翻译
  const t = getTranslations(navTranslations, locale)

  // 主导航结构 - 按照优化方案设计
  const mainNavItems = [
    {
      href: '/ppe',
      label: t.home,
      icon: Shield,
    },
    {
      label: t.complianceTools,
      icon: CheckCircle,
      children: [
        { href: '/ppe/market-access', label: t.complianceChecker, icon: CheckCircle },
        { href: '/ppe/certification-comparison', label: t.marketComparison, icon: Globe },
        { href: '/ppe/cost-calculator', label: t.costCalculator, icon: Calculator },
        { href: '/ppe/timeline-estimator', label: t.timelineEstimator, icon: Clock },
        { href: '/ppe/compliance-tracker', label: t.complianceTracker, icon: ClipboardList },
        { href: '/ppe/certificate-alerts', label: t.certificateAlerts, icon: Bell },
      ]
    },
    {
      label: t.dataCenter,
      icon: Database,
      children: [
        { href: '/ppe/products', label: t.productDatabase, icon: Package },
        { href: '/ppe/manufacturers', label: t.manufacturers, icon: Building2 },
        { href: '/ppe/regulations-new', label: t.regulations, icon: Gavel },
        { href: '/ppe/market-analysis', label: t.marketAnalysis, icon: Globe },
      ]
    },
    {
      label: t.knowledgeBase,
      icon: BookOpen,
      children: [
        { href: '/ppe/compliance-guides', label: t.complianceGuides, icon: BookOpen },
        { href: '/ppe/documents', label: t.documentTemplates, icon: FileText },
        { href: '/ppe/knowledge-base', label: t.knowledgeArticles, icon: Lightbulb },
        { href: '/ppe/case-studies', label: t.caseStudies, icon: FolderOpen },
        { href: '/ppe/regulatory-news', label: t.regulatoryNews, icon: Newspaper },
        { href: '/ppe/regulatory-alerts', label: t.regulatoryAlerts, icon: Bell },
      ]
    },
  ]

  // 用户中心导航 - 只包含已存在的页面
  const userNavItems = [
    { href: '/dashboard', label: t.dashboard, icon: User },
    { href: '/dashboard/api-keys', label: t.apiKeys, icon: Key },
  ]

  // 处理语言切换
  const handleLangChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setShowLangMenu(false)
  }

  const isAuthPage = pathname?.includes('/ppe/auth')

  if (isAuthPage) {
    return null
  }

  const isActive = (href: string) => {
    if (href === '/ppe') {
      return pathname === '/ppe'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/ppe" className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="MDLooker PPE" 
              className="w-9 h-9 rounded-lg object-contain"
            />
            <span className="text-lg font-bold text-gray-900">MDLooker PPE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon

              // 有子菜单的项
              if (item.children) {
                const hasActiveChild = item.children.some(child => isActive(child.href))
                const isOpen = openDropdown === item.label

                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        hasActiveChild
                          ? 'text-[#339999] bg-[#339999]/5'
                          : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const childActive = isActive(child.href)

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                childActive
                                  ? 'text-[#339999] bg-[#339999]/5'
                                  : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4" />
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // 普通链接
              const active = isActive(item.href!)
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-[#339999] bg-[#339999]/5'
                      : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Auth Buttons & Language Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{localeLabels[locale]}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {(Object.keys(localeLabels) as Locale[]).map((langCode) => (
                    <button
                      key={langCode}
                      onClick={() => handleLangChange(langCode)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        locale === langCode ? 'text-[#339999] font-medium bg-[#339999]/5' : 'text-gray-600'
                      }`}
                    >
                      {localeLabels[langCode]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <Link
              href="/ppe/auth/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#339999] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {t.signIn}
            </Link>
            <Link
              href="/ppe/auth/signup"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#339999] hover:bg-[#2d8b8b] rounded-lg transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {t.signUp}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-[#339999] transition-colors rounded-lg hover:bg-gray-50"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {/* 主导航 */}
              {mainNavItems.map((item) => {
                const Icon = item.icon

                if (item.children) {
                  const hasActiveChild = item.children.some(child => isActive(child.href))
                  const isExpanded = openDropdown === item.label

                  return (
                    <div key={item.label} className="border-b border-gray-50 last:border-0">
                      <button
                        onClick={() => setOpenDropdown(isExpanded ? null : item.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          hasActiveChild
                            ? 'text-[#339999] bg-[#339999]/5'
                            : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon
                            const childActive = isActive(child.href)

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                                  childActive
                                    ? 'text-[#339999] bg-[#339999]/5'
                                    : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                                }`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                {child.label}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                const active = isActive(item.href!)
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-[#339999] bg-[#339999]/5'
                        : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}

              {/* 分隔线 */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* 用户中心 */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                User Center
              </div>
              {userNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      active
                        ? 'text-[#339999] bg-[#339999]/5'
                        : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}

              {/* 分隔线 */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* 登录/注册 */}
              <div className="flex flex-col gap-2 px-4 pt-2">
                <Link
                  href="/ppe/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:text-[#339999] hover:border-[#339999] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/ppe/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#339999] hover:bg-[#2d8b8b] rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
