'use client'

/**
 * 语言上下文
 * 提供全局语言状态管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Locale, defaultLocale, getStoredLocale, setStoredLocale } from './config'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  isReady: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 创建一个唯一的key用于强制重新渲染
let languageKey = 0

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isReady, setIsReady] = useState(false)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    // 从 localStorage 加载语言设置
    const stored = getStoredLocale()
    setLocaleState(stored)
    setIsReady(true)
  }, [])

  const triggerForceUpdate = useCallback(() => {
    forceUpdate(prev => prev + 1)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale) return
    
    setLocaleState(newLocale)
    setStoredLocale(newLocale)
    languageKey++
    
    // 触发强制更新
    triggerForceUpdate()
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale: newLocale } }))
    
    console.log(`Language changed to: ${newLocale}`)
  }, [locale, triggerForceUpdate])

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale: Locale }>
      if (customEvent.detail?.locale) {
        setLocaleState(customEvent.detail.locale)
        triggerForceUpdate()
      }
    }
    
    window.addEventListener('localechange', handleLocaleChange)
    return () => window.removeEventListener('localechange', handleLocaleChange)
  }, [triggerForceUpdate])

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

export { languageKey }
