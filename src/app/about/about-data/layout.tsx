import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Global PPE Data Coverage Report | MDLooker',
  description:
    'MDLooker aggregates 23,319 certified PPE product registrations from 39 regulatory authorities across 107 data sources, covering 71 countries and regions. 92.2% high-confidence data directly from official APIs.',
  keywords: [
    'PPE data coverage',
    'personal protective equipment database',
    'PPE compliance data',
    'global PPE market',
    'FDA 510(k)',
    'NMPA UDID',
    'EUDAMED',
    'PPE certification',
    'regulatory compliance data',
    'PPE market intelligence',
    'PPE产品注册数据',
    '个人防护装备数据库',
    'PPE合规数据',
  ],
  openGraph: {
    title: 'Global PPE Data Coverage Report | MDLooker',
    description:
      '23,319 certified PPE products from 39 regulatory authorities, 107 data sources, 71 countries. 92.2% high-confidence official data.',
    url: 'https://mdlooker.com/about/about-data',
    siteName: 'MDLooker',
    type: 'article',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MDLooker Global PPE Data Coverage Report',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global PPE Data Coverage Report | MDLooker',
    description:
      '23,319 certified PPE products from 39 regulatory authorities, 107 data sources, 71 countries. 92.2% high-confidence official data.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://mdlooker.com/about/about-data',
  },
}

export default function AboutDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: 'Global PPE Data Coverage Report',
            description:
              'Comprehensive data coverage report for the global Personal Protective Equipment (PPE) market, covering 23,319 certified products across 71 countries.',
            author: {
              '@type': 'Organization',
              name: 'MDLooker',
              url: 'https://mdlooker.com',
            },
            datePublished: '2026-05-16',
            about: {
              '@type': 'Thing',
              name: 'Personal Protective Equipment (PPE) Data',
            },
            statistics: [
              { '@type': 'PropertyValue', name: 'Certified PPE Products', value: 23319 },
              { '@type': 'PropertyValue', name: 'Countries Covered', value: 71 },
              { '@type': 'PropertyValue', name: 'Regulatory Bodies', value: 39 },
              { '@type': 'PropertyValue', name: 'Data Sources', value: 107 },
              { '@type': 'PropertyValue', name: 'High-Confidence Data Rate', value: '92.2%' },
            ],
          }).replace(/<\/script>/gi, '<\\/script>'),
        }}
      />
      {children}
    </>
  )
}
