import Script from 'next/script'

function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  return input
    .replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return entities[char] || char
    })
}

function sanitizeData(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item))
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeData((obj as Record<string, unknown>)[key])
      }
    }
    return sanitized
  }
  return obj
}

interface FAQ {
  question: string
  answer: string
}

interface FAQStructuredDataProps {
  faqs: FAQ[]
}

interface OrganizationData {
  '@context': string
  '@type': string
  name: string
  url: string
  logo: string
  description: string
  sameAs: string[]
}

interface WebSiteData {
  '@context': string
  '@type': string
  url: string
  name: string
  description: string
  potentialAction: {
    '@type': string
    target: string
    'query-input': string
  }
}

interface MedicalDeviceData {
  '@context': string
  '@type': string
  name: string
  description: string
  manufacturer?: {
    '@type': string
    name: string
  }
  identifier?: string
  regulatoryStatus?: string
}

interface BreadcrumbItem {
  name: string
  item: string
  position: number
}

interface BreadcrumbData {
  '@context': string
  '@type': string
  itemListElement: BreadcrumbItem[]
}

interface StructuredDataProps {
  type: 'organization' | 'website' | 'medical-device' | 'breadcrumb'
  data?: BreadcrumbData | Record<string, unknown>
}

const organizationData: OrganizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MDLooker',
  url: 'https://mdlooker.com',
  logo: 'https://mdlooker.com/logo.png',
  description: 'Global medical device regulatory database - FDA, EUDAMED, NMPA, and more. Search 43,000+ medical device registrations.',
  sameAs: [
    'https://twitter.com/mdlooker',
    'https://linkedin.com/company/mdlooker',
  ]
}

const websiteData: WebSiteData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: 'https://mdlooker.com',
  name: 'MDLooker - Medical Device Regulatory Database',
  description: 'Search global medical device regulatory databases including FDA 510(k), EUDAMED, and NMPA.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://mdlooker.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
}

export function StructuredData({ type, data }: StructuredDataProps) {
  let jsonLd: Record<string, unknown>

  switch (type) {
    case 'organization':
      jsonLd = organizationData as unknown as Record<string, unknown>
      break
    case 'website':
      jsonLd = websiteData as unknown as Record<string, unknown>
      break
    case 'medical-device':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'MedicalDevice',
        ...(data ? sanitizeData(data) as Record<string, unknown> : {})
      }
      break
    case 'breadcrumb':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: (data as BreadcrumbData)?.itemListElement?.map((item: BreadcrumbItem, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: sanitizeString(item.name),
          item: sanitizeString(item.item)
        }))
      }
      break
    default:
      return null
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function generateSEOMetadata({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  noIndex = false
}: {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  noIndex?: boolean
}) {
  const defaultKeywords = [
    'medical device',
    'FDA 510k',
    'EUDAMED',
    'medical device registration',
    'regulatory database',
    'medical device search',
    'NMPA',
    'PMDA',
    'medical device approval',
    'device classification'
  ]

  return {
    title: `${sanitizeString(title)} | MDLooker`,
    description: sanitizeString(description),
    keywords: [...defaultKeywords, ...(keywords || [])].join(', '),
    ...(canonical && { alternates: { canonical } }),
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title: `${sanitizeString(title)} | MDLooker`,
      description: sanitizeString(description),
      url: canonical,
      siteName: 'MDLooker',
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: `${sanitizeString(title)} | MDLooker`,
      description: sanitizeString(description),
      images: ogImage ? [ogImage] : undefined
    }
  }
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const sanitizedFaqs = sanitizeData(faqs) as FAQ[]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sanitizedFaqs.map((faq: FAQ) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
