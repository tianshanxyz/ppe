'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
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

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang') as Locale;
    if (langParam && locales.includes(langParam)) {
      return langParam;
    }
  } catch (e) {
    // Silently handle errors during navigation
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

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isReady: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  isReady: false,
});

interface LocaleProviderProps {
  initialLocale?: Locale;
  children: React.ReactNode;
}

export function LocaleProvider({ initialLocale = defaultLocale, children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isInitialized.current && isHydrated) {
      isInitialized.current = true;
      const initial = getInitialLocale();
      if (initial !== initialLocale) {
        setLocale(initial);
      }
    }
  }, [isHydrated, initialLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isReady: isHydrated }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const { locale } = useContext(LocaleContext);
  return locale;
}

export function useSetLocale(): (locale: Locale) => void {
  return useCallback((newLocale: Locale) => {
    localStorage.setItem('mdlooker-locale', newLocale);

    if (typeof window !== 'undefined' && window.location) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLocale);
        window.location.href = url.toString();
      } catch (e) {
        // Silently handle navigation errors
      }
    }
  }, []);
}

export function useTranslation<T extends Record<string, Record<string, string>>>(
  translations: T
): Record<string, string> {
  const locale = useLocale();
  return translations[locale] || translations.en;
}

export function useLocaleLabel(): string {
  const locale = useLocale();
  const labels: Record<Locale, string> = {
    en: 'English',
    zh: '中文',
  };
  return labels[locale] || 'English';
}
