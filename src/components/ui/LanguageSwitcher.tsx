'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
];

export function LanguageSwitcher() {
  const locale = useLocale();

  const handleChange = (newLocale: string) => {
    // Set language and save to localStorage
    localStorage.setItem('preferred-locale', newLocale);

    // Navigate to the corresponding language page
    const path = window.location.pathname;
    const segments = path.split('/');
    segments[1] = newLocale;
    window.location.href = segments.join('/');
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      >
        {locales.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.flag} {loc.label}
          </option>
        ))}
      </select>
    </div>
  );
}
