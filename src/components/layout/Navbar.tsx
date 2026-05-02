'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home } from 'lucide-react'
import { useState } from 'react'
import { MarketSwitcher } from '@/components/market/MarketSwitcher'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/search', label: '搜索' },
  { href: '/tools', label: '工具箱' },
  { href: '/data-sources', label: '数据来源' },
]

export function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#339999] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MDLooker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? 'text-[#339999] bg-[#339999]/5'
                    : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <MarketSwitcher />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#339999] transition-colors rounded-lg hover:bg-gray-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-100">
            <div className="flex flex-col gap-1 pb-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? 'text-[#339999] bg-[#339999]/5'
                      : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
