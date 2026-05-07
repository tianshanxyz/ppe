'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Locale, defaultLocale, locales } from './config';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function getCookieLocale(): Locale {
  if (!isClient()) {
    return defaultLocale;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'mdlooker-locale' && locales.includes(value as Locale)) {
      return value as Locale;
    }
  }
  return defaultLocale;
}

function getUrlLocale(): Locale {
  if (!isClient()) {
    return defaultLocale;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang') as Locale;
  if (langParam && locales.includes(langParam)) {
    return langParam;
  }

  return defaultLocale;
}

function getStoredLocale(): Locale {
  if (!isClient()) {
    return defaultLocale;
  }

  const stored = localStorage.getItem('mdlooker-locale') as Locale;
  if (stored && locales.includes(stored)) {
    return stored;
  }
  return defaultLocale;
}

function getInitialLocale(): Locale {
  if (!isClient()) {
    return defaultLocale;
  }
  
  const urlLocale = getUrlLocale();
  if (urlLocale !== defaultLocale) {
    localStorage.setItem('mdlooker-locale', urlLocale);
    return urlLocale;
  }
  
  const cookieLocale = getCookieLocale();
  if (cookieLocale !== defaultLocale) {
    return cookieLocale;
  }
  
  return getStoredLocale();
}

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isInitialized.current && isHydrated) {
      isInitialized.current = true;
      const initialLocale = getInitialLocale();
      setLocale(initialLocale);
    }
  }, [isHydrated]);

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale: Locale }>;
      if (customEvent.detail?.locale) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    const checkUrlLocale = () => {
      const urlLocale = getUrlLocale();
      if (urlLocale !== defaultLocale && urlLocale !== locale) {
        localStorage.setItem('mdlooker-locale', urlLocale);
        setLocale(urlLocale);
      }
    };

    checkUrlLocale();

    window.addEventListener('popstate', checkUrlLocale);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkUrlLocale();
      }
    });

    return () => {
      window.removeEventListener('popstate', checkUrlLocale);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [locale, isHydrated]);

  if (!isHydrated) {
    return defaultLocale;
  }

  return locale;
}

/**
 * 获取翻译后的文本
 */
export function useTranslation<T extends Record<string, Record<string, string>>>(
  translations: T
): Record<string, string> {
  const locale = useLocale();
  return translations[locale] || translations.en;
}

/**
 * 获取当前语言标签
 */
export function useLocaleLabel(): string {
  const locale = useLocale();
  const labels: Record<Locale, string> = {
    en: 'English',
    zh: '中文',
  };
  return labels[locale] || 'English';
}

/**
 * 设置语言的便捷函数
 */
export function useSetLocale() {
  const setLocale = useCallback((newLocale: Locale) => {
    // 更新localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mdlooker-locale', newLocale);
      
      // 更新URL参数
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLocale);
        window.location.href = url.toString();
      } catch (e) {
        console.warn('Failed to update URL locale:', e);
      }
    }
  }, []);

  return setLocale;
}