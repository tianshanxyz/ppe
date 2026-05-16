'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Home,
  ChevronDown,
  Wrench,
  CheckCircle,
  Globe,
  Database,
  BookOpen,
  FileText,
  Clock,
  Building2,
  Package,
  Gavel,
  FolderOpen,
  Lightbulb,
  Newspaper,
  LogIn,
  UserPlus,
  User,
  GraduationCap,
  Settings,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useLocale, useSetLocale } from '@/lib/i18n/LocaleProvider';
import { navTranslations, headerTranslations, getTranslations } from '@/lib/i18n/translations';
import { Locale, localeLabels } from '@/lib/i18n/config';
import { localGetSession, localSignOut } from '@/lib/auth/local-auth';

const languages = [
  { code: 'en' as Locale, label: 'English' },
  { code: 'zh' as Locale, label: '中文' },
];

export function Header() {
  const [pathname, setPathname] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const locale = useLocale();
  const setLocale = useSetLocale();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read pathname directly from window.location to avoid next/navigation context issues
    if (typeof window !== 'undefined' && window.location) {
      setPathname(window.location.pathname);
    }

    const handleRouteChange = () => {
      if (window.location) {
        setPathname(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    // 优先使用 local-auth 的 session 获取，兼容 localStorage 和 sessionStorage
    const sessionUser = localGetSession()
    if (sessionUser && sessionUser.id) {
      setIsLoggedIn(true)
      if (sessionUser.name) {
        setUserName(sessionUser.name)
      } else if (sessionUser.email) {
        setUserName(sessionUser.email.split('@')[0])
      }
    } else {
      // 兼容旧的 'user' key
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setIsLoggedIn(!!parsed && !!parsed.id);
          if (parsed.name) {
            setUserName(parsed.name);
          } else if (parsed.email) {
            setUserName(parsed.email.split('@')[0]);
          }
        } catch {
          setIsLoggedIn(false);
        }
      }
    }
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localSignOut()
    setShowUserMenu(false);
    setIsLoggedIn(false);
    setUserName('');
    window.location.href = '/';
  };

  const t = getTranslations(navTranslations, locale);
  const ht = getTranslations(headerTranslations, locale);

  const handleLangChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowLangMenu(false);
  };

  const mainNavItems = [
    {
      href: '/',
      label: t.home,
      icon: Home,
    },
    {
      label: t.complianceTools,
      icon: Wrench,
      children: [
        { href: '/market-access', label: t.complianceChecker, icon: CheckCircle },
        { href: '/certification-comparison', label: t.marketComparison, icon: Globe },
        { href: '/compliance-guides', label: t.complianceGuides, icon: BookOpen },
        { href: '/documents', label: t.documentTemplates, icon: FileText },
        { href: '/document-generator', label: ht.documentGenerator, icon: FileText },
      ]
    },
    {
      label: t.dataCenter,
      icon: Database,
      children: [
        { href: '/products', label: t.products, icon: Package },
        { href: '/manufacturers', label: t.manufacturers, icon: Building2 },
        { href: '/regulations-new', label: t.regulations, icon: Gavel },
        { href: '/market-analysis', label: t.marketAnalysis, icon: Globe },
      ]
    },
    {
      label: t.knowledgeBase,
      icon: GraduationCap,
      children: [
        { href: '/knowledge-base', label: t.knowledgeArticles, icon: Lightbulb },
        { href: '/case-studies', label: t.caseStudies, icon: FolderOpen },
        { href: '/regulatory-news', label: t.regulatoryNews, icon: Newspaper },
        { href: '/regulatory-alerts', label: t.regulatoryAlerts, icon: Clock },
      ]
    },
    {
      label: t.about,
      icon: User,
      children: [
        { href: '/about/about-us', label: t.aboutUs, icon: User },
        { href: '/about/about-data', label: t.aboutData, icon: Database },
      ]
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const isAuthPage = pathname?.includes('/auth') || pathname?.includes('/auth');

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MDLooker"
              className="w-9 h-9 rounded-lg object-contain"
            />
            <span className="text-lg font-bold text-gray-900">MDLooker</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const hasActiveChild = item.children.some(child => isActive(child.href));
                const isOpen = openDropdown === item.label;

                return (
                  <div
                    key={item.label}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        hasActiveChild
                          ? 'text-primary bg-primary/5'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div 
                        className="absolute top-full left-0 pt-2 z-50"
                        onMouseEnter={() => setOpenDropdown(item.label)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <div className="w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.href);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  childActive
                                    ? 'text-primary bg-primary/5'
                                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                }`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.href!);
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{localeLabels[locale]}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLangMenu && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        locale === lang.code ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1"></div>

            <div className="hidden sm:flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="max-w-[120px] truncate">{userName || (locale === 'zh' ? '用户' : 'User')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {locale === 'zh' ? '仪表盘' : 'Dashboard'}
                    </Link>
                    <Link
                      href="/dashboard#settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {locale === 'zh' ? '设置' : 'Settings'}
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {locale === 'zh' ? '退出登录' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {t.signIn}
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  {t.signUpFree}
                </Link>
              </>
            )}
            </div>
          </div>

          <button
            className="lg:hidden p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;

                if (item.children) {
                  const hasActiveChild = item.children.some(child => isActive(child.href));
                  const isExpanded = openDropdown === item.label;

                  return (
                    <div key={item.label} className="border-b border-gray-50 last:border-0">
                      <button
                        onClick={() => setOpenDropdown(isExpanded ? null : item.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          hasActiveChild
                            ? 'text-primary bg-primary/5'
                            : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.href);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                                  childActive
                                    ? 'text-primary bg-primary/5'
                                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                }`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.href!);
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="border-t border-gray-100 my-2 pt-4">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg mb-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4" />
                    {locale === 'zh' ? '语言' : 'Language'}
                  </span>
                  <div className="flex gap-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          handleLangChange(lang.code);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          locale === lang.code
                            ? 'bg-[#339999] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoggedIn ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{userName || (locale === 'zh' ? '用户' : 'User')}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {locale === 'zh' ? '仪表盘' : 'Dashboard'}
                    </Link>
                    <Link
                      href="/dashboard#settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {locale === 'zh' ? '设置' : 'Settings'}
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {locale === 'zh' ? '退出登录' : 'Sign Out'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:text-primary hover:border-primary transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      {t.signIn}
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t.signUpFree}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
