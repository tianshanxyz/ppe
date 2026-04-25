'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Shield,
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
  LogIn,
  UserPlus,
  User,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { navTranslations, getTranslations } from '@/lib/i18n/translations';
import { Locale, localeLabels } from '@/lib/i18n/config';

const languages = [
  { code: 'en' as Locale, label: 'English' },
  { code: 'zh' as Locale, label: '中文' },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { locale, setLocale } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const t = getTranslations(navTranslations, locale);

  const handleLangChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowLangMenu(false);
  };

  const mainNavItems = [
    {
      href: '/',
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
        { href: '/ppe/compliance-tracker', label: t.complianceTracker, icon: FileText },
        { href: '/ppe/certificate-alerts', label: t.certificateAlerts, icon: Clock },
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
        { href: '/ppe/regulatory-alerts', label: t.regulatoryAlerts, icon: Clock },
      ]
    },
    {
      href: '/about',
      label: t.about,
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const isAuthPage = pathname?.includes('/auth') || pathname?.includes('/ppe/auth');

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
                    className="relative"
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
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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

          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
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

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {t.signIn}
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  {t.signUpFree}
                </Link>
              </>
            )}
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
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:text-primary hover:border-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
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
