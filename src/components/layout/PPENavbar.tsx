'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Shield, BookOpen, DollarSign, LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/ppe', label: 'Home', icon: Shield },
  { href: '/ppe/regulations', label: 'Regulations', icon: BookOpen },
  { href: '/ppe/pricing', label: 'Pricing', icon: DollarSign },
]

export function PPENavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAuthPage = pathname?.includes('/ppe/auth')

  if (isAuthPage) {
    return null
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
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/ppe' && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
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
          <div className="hidden md:flex items-center gap-3">
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
            className="md:hidden p-2 text-gray-600 hover:text-[#339999] transition-colors rounded-lg hover:bg-gray-50"
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
          <div className="md:hidden py-2 border-t border-gray-100">
            <div className="flex flex-col gap-1 pb-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/ppe' && pathname?.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-[#339999] bg-[#339999]/5'
                        : 'text-gray-600 hover:text-[#339999] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              
              <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-2">
                <Link
                  href="/ppe/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#339999] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/ppe/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white bg-[#339999] hover:bg-[#2d8b8b] rounded-lg transition-colors"
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
