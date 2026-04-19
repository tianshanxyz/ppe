import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { StructuredData } from '@/components/seo/StructuredData'
import { MarketProvider } from '@/components/market/MarketSwitcher'
import { Header } from '@/components/layouts/Header'
import { Footer } from '@/components/layouts/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MDLooker - Global Medical Device Regulatory Database',
  description: 'Search 43,000+ medical device registrations from FDA, EUDAMED, NMPA, and global regulatory databases. Find device approvals, classifications, and company information.',
  keywords: 'medical device, FDA 510k, EUDAMED, medical device registration, regulatory database, NMPA, PMDA, device search',
  authors: [{ name: 'MDLooker' }],
  creator: 'MDLooker',
  publisher: 'MDLooker',
  metadataBase: new URL('https://mdlooker.com'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'MDLooker - Global Medical Device Regulatory Database',
    description: 'Search FDA, EUDAMED, NMPA medical device databases. 43,000+ device registrations.',
    url: 'https://mdlooker.com',
    siteName: 'MDLooker',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MDLooker - Medical Device Regulatory Database',
    description: 'Search 43,000+ medical device registrations from FDA, EUDAMED, and global databases.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData type="organization" />
        <StructuredData type="website" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <MarketProvider>
          <Header />
          <main className="min-h-screen">
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              }>
                {children}
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </MarketProvider>
      </body>
    </html>
  )
}
