'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { navTranslations, getTranslations } from '@/lib/i18n/translations';

export function Footer() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { locale } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const t = getTranslations(navTranslations, locale);

  const isAuthPage = pathname?.includes('/auth');

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MDLooker</span>
            </Link>
            <p className="text-gray-500 text-sm">
              {t.brandDescription}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t.product}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ppe" className="text-gray-500 hover:text-primary transition-colors">
                  {t.ppePlatform}
                </Link>
              </li>
              <li>
                <Link href="/ppe/pricing" className="text-gray-500 hover:text-primary transition-colors">
                  {t.pricing}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t.resources}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-500 hover:text-primary transition-colors">
                  {t.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-500 hover:text-primary transition-colors">
                  {t.aboutUs}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t.company}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-primary transition-colors">
                  {t.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-primary transition-colors">
                  {t.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-primary transition-colors">
                  {t.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 MDLooker. {t.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
}
