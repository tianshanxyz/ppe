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

// 主导航结构 - 按照优化方案设计
const mainNavItems = [
  {
    href: '/ppe',
    label: 'Home',
    icon: Shield,
  },
  {
    label: 'Compliance Tools',
    icon: CheckCircle,
    children: [
      { href: '/ppe/market-access', label: 'Compliance Checker', icon: CheckCircle },
      { href: '/ppe/certification-comparison', label: 'Market Comparison', icon: Globe },
      { href: '/ppe/cost-calculator', label: 'Cost Calculator', icon: Calculator },
      { href: '/ppe/timeline-estimator', label: 'Timeline Estimator', icon: Clock },
      { href: '/ppe/compliance-tracker', label: 'Compliance Tracker', icon: ClipboardList },
      { href: '/ppe/certificate-alerts', label: 'Certificate Alerts', icon: Bell },
    ]
  },
  {
    label: 'Data Center',
    icon: Database,
    children: [
      { href: '/ppe/products', label: 'Product Database', icon: Package },
      { href: '/ppe/manufacturers', label: 'Manufacturers', icon: Building2 },
      { href: '/ppe/regulations-new', label: 'Regulations', icon: Gavel },
      { href: '/ppe/market-analysis', label: 'Market Analysis', icon: Globe },
    ]
  },
  {
    label: 'Knowledge Base',
    icon: BookOpen,
    children: [
      { href: '/ppe/compliance-guides', label: 'Compliance Guides', icon: BookOpen },
      { href: '/ppe/documents', label: 'Document Templates', icon: FileText },
      { href: '/ppe/knowledge-base', label: 'Knowledge Articles', icon: Lightbulb },
      { href: '/ppe/case-studies', label: 'Case Studies', icon: FolderOpen },
      { href: '/ppe/regulatory-news', label: 'Regulatory News', icon: Newspaper },
      { href: '/ppe/regulatory-alerts', label: 'Regulatory Alerts', icon: Bell },
    ]
  },
]

// 用户中心导航
const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: User },
  { href: '/dashboard/compliance-tracker', label: 'My Compliance', icon: ClipboardList },
  { href: '/dashboard/certificates', label: 'My Certificates', icon: FileText },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function PPENavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
            <div className="w-9 h-9 rounded-lg bg-[#339999] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
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

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/ppe/auth/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#339999] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/ppe/auth/signup"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#339999] hover:bg-[#2d8b8b] rounded-lg transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
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
