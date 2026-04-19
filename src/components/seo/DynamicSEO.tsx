'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 动态 SEO 组件
 * 
 * 根据页面路径动态更新 SEO 元标签
 */
interface DynamicSEOProps {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
}

/**
 * 页面 SEO 配置映射
 */
const pageSEO: Record<string, Omit<DynamicSEOProps, 'canonical'>> = {
  '/': {
    title: 'MDLooker - Global Medical Device Regulatory Database',
    description: 'Search 43,000+ medical device registrations from FDA, EUDAMED, NMPA, and global regulatory databases.',
    keywords: ['medical device', 'FDA', 'EUDAMED', 'NMPA', 'regulatory database'],
  },
  '/search': {
    title: 'Search Medical Devices',
    description: 'Search our comprehensive database of medical device registrations from FDA, EUDAMED, and NMPA.',
    keywords: ['search medical devices', 'FDA search', '510k search', 'device database'],
  },
  '/companies': {
    title: 'Medical Device Companies',
    description: 'Browse medical device manufacturers and their regulatory submissions worldwide.',
    keywords: ['medical device companies', 'manufacturers', 'sponsors', 'applicants'],
  },
  '/products': {
    title: 'Medical Device Products',
    description: 'Explore medical device products with detailed regulatory information.',
    keywords: ['medical devices', 'product catalog', 'device listings'],
  },
  '/regulations': {
    title: 'Medical Device Regulations',
    description: 'Access medical device regulations and guidelines from FDA, EUDAMED, NMPA, and other authorities.',
    keywords: ['medical device regulations', 'FDA regulations', 'MDR', 'IVDR'],
  },
  '/alerts': {
    title: 'Regulatory Alerts',
    description: 'Stay updated with the latest medical device regulatory alerts and notifications.',
    keywords: ['regulatory alerts', 'safety alerts', 'recalls', 'notifications'],
  },
  '/about': {
    title: 'About MDLooker',
    description: 'Learn about MDLooker - the comprehensive medical device regulatory database.',
    keywords: ['about mdlooker', 'medical device database', 'regulatory information'],
  },
}

/**
 * 动态 SEO 组件
 */
export function DynamicSEO({ 
  title, 
  description, 
  keywords,
  ogImage 
}: DynamicSEOProps) {
  const pathname = usePathname()

  useEffect(() => {
    // 获取当前页面的 SEO 配置
    const pageConfig = pageSEO[pathname] || {}
    
    // 合并自定义配置和页面配置
    const finalTitle = title || pageConfig.title || 'MDLooker'
    const finalDescription = description || pageConfig.description
    const finalKeywords = keywords || pageConfig.keywords || []

    // 更新标题
    document.title = finalTitle

    // 更新描述
    updateMetaTag('name', 'description', finalDescription)
    
    // 更新关键词
    if (finalKeywords.length > 0) {
      updateMetaTag('name', 'keywords', finalKeywords.join(', '))
    }

    // 更新 Open Graph
    updateMetaTag('property', 'og:title', finalTitle)
    if (finalDescription) {
      updateMetaTag('property', 'og:description', finalDescription)
    }
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage)
    }

    // 更新 Twitter
    updateMetaTag('name', 'twitter:title', finalTitle)
    if (finalDescription) {
      updateMetaTag('name', 'twitter:description', finalDescription)
    }

    // 更新规范链接
    if (pathname) {
      const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mdlooker.com'}${pathname}`
      updateCanonicalLink(canonicalUrl)
    }
  }, [pathname, title, description, keywords, ogImage])

  return null
}

/**
 * 更新 meta 标签
 */
function updateMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string | undefined
) {
  if (!content) return

  let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attrName, attrValue)
    document.head.appendChild(meta)
  }
  
  meta.setAttribute('content', content)
}

/**
 * 更新规范链接
 */
function updateCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  
  link.setAttribute('href', url)
}
