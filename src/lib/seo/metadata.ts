import type { Metadata } from 'next'

/**
 * 基础 SEO 配置
 */
export const baseMetadata: Metadata = {
  title: {
    default: 'MDLooker - Global Medical Device Regulatory Database',
    template: '%s | MDLooker'
  },
  description: 'Search 43,000+ medical device registrations from FDA, EUDAMED, NMPA, and global regulatory databases. Find device approvals, classifications, and company information.',
  keywords: [
    'medical device',
    'FDA 510k',
    'EUDAMED',
    'medical device registration',
    'regulatory database',
    'NMPA',
    'PMDA',
    'device search',
    '510(k)',
    'CE marking',
    'ISO 13485',
    'medical device regulation',
    'FDA approval',
    'device clearance'
  ],
  authors: [{ name: 'MDLooker' }],
  creator: 'MDLooker',
  publisher: 'MDLooker',
  metadataBase: new URL('https://mdlooker.com'),
}

/**
 * Open Graph 配置
 */
export const openGraph = {
  title: 'MDLooker - Global Medical Device Regulatory Database',
  description: 'Search FDA, EUDAMED, NMPA medical device databases. 43,000+ device registrations.',
  url: 'https://mdlooker.com',
  siteName: 'MDLooker',
  locale: 'en_US',
  type: 'website',
  images: [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'MDLooker - Medical Device Regulatory Database',
    },
  ],
}

/**
 * Twitter Card 配置
 */
export const twitter = {
  card: 'summary_large_image',
  title: 'MDLooker - Medical Device Regulatory Database',
  description: 'Search 43,000+ medical device registrations from FDA, EUDAMED, and global databases.',
  creator: '@mdlooker',
  images: ['/twitter-image.png'],
}

/**
 * Robots 配置
 */
export const robots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
}

/**
 * 验证配置
 */
export const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
}

/**
 * 其他 SEO 配置
 */
export const other = {
  'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION,
}
