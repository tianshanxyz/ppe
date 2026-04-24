'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { Menu, X, User, Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export function Header() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const handleLangChange = (langCode: string) => {
    setCurrentLang(langCode);
    setShowLangMenu(false);
  };

  // 检查是否在 PPE 路由下
  const isPPEPage = pathname?.startsWith('/ppe');

  // 在 PPE 路由下不显示此 Header（PPE 有自己的 PPENavbar）
  if (isPPEPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="MDLooker" 
              className="w-9 h-9 rounded-lg object-contain"
            />
            <span className="text-lg font-bold text-gray-900">MDLooker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/about" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all">
              About
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
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
                        currentLang === lang.code ? 'text-primary font-medium' : 'text-gray-600'
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
                <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary hover:text-primary">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-primary hover:bg-primary-dark text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50"
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
                href="/about"
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>
            <div className="flex flex-col gap-2 px-4 pt-2 border-t border-gray-100">
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
                    <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
