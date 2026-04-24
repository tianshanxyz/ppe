/**
 * 国际化配置
 * 支持英文（主语言）和中文
 */

export type Locale = 'en' | 'zh'

export const defaultLocale: Locale = 'en'

export const locales: Locale[] = ['en', 'zh']

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文'
}

// 从 localStorage 获取语言设置
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const stored = localStorage.getItem('mdlooker-locale') as Locale
  return locales.includes(stored) ? stored : defaultLocale
}

// 存储语言设置
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('mdlooker-locale', locale)
}
