'use client'

/**
 * 语言上下文
 * 提供全局语言状态管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, getStoredLocale, setStoredLocale } from './config'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  isReady: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 从 localStorage 加载语言设置
    const stored = getStoredLocale()
    setLocaleState(stored)
    setIsReady(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setStoredLocale(newLocale)
    // 触发页面重新渲染以应用新语言
    window.dispatchEvent(new Event('languagechange'))
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isReady }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
