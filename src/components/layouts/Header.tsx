'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Menu, X, User, Shield, Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const handleLangChange = (langCode: string) => {
    setCurrentLang(langCode);
    setShowLangMenu(false);
    // TODO: Implement actual language switching logic
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#339999] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MDLooker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/search" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Search
            </Link>
            <Link href="/products" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Products
            </Link>
            <Link href="/companies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Companies
            </Link>
            <Link href="/tools" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Tools
            </Link>
            <Link href="/regulations" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Regulations
            </Link>
            <Link href="/compliance" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Compliance
            </Link>
            <Link href="/reports" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all">
              Reports
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === currentLang)?.label}</span>
              </button>
              
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-1 w-24 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        currentLang === lang.code ? 'text-[#339999] font-medium' : 'text-gray-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-gray-200 hover:border-[#339999] hover:text-[#339999]">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#339999]">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-[#339999] hover:bg-[#2a8080] text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-[#339999] rounded-lg hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-100">
            <nav className="flex flex-col gap-1 pb-2">
              <Link
                href="/search"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/companies"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Companies
              </Link>
              <Link
                href="/tools"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tools
              </Link>
              <Link
                href="/regulations"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Regulations
              </Link>
              <Link
                href="/compliance"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compliance
              </Link>
              <Link
                href="/reports"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-[#339999] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reports
              </Link>
              
              {/* Mobile Language Switcher */}
              <div className="px-4 py-2.5 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>Language:</span>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`px-2 py-1 rounded ${
                        currentLang === lang.code 
                          ? 'text-[#339999] font-medium bg-[#339999]/5' 
                          : 'text-gray-500 hover:text-[#339999]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-gray-200">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-200">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-[#339999] hover:bg-[#2a8080] text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
