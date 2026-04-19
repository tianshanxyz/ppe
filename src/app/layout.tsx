import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { StructuredData } from '@/components/seo/StructuredData'
import { MarketProvider } from '@/components/market/MarketSwitcher'
import { Header } from '@/components/layouts/Header'
import { Footer } from '@/components/layouts/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Loader2 } from 'lucide-react'
import { validateAndLog } from '@/lib/config/env-validator'

export const metadata: Metadata = {
  title: 'MDLooker - Global PPE Compliance Platform',
  description: 'Free PPE compliance check tool. Get instant CE, FDA, UKCA certification requirements for masks, protective clothing, gloves & more. Export to EU, US, UK, GCC markets.',
  keywords: 'PPE compliance, CE certification, FDA registration, UKCA marking, personal protective equipment, mask export, protective clothing, gloves compliance, EU PPE regulation',
  authors: [{ name: 'MDLooker' }],
  creator: 'MDLooker',
  publisher: 'MDLooker',
  metadataBase: new URL('https://mdlooker.com'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'MDLooker - Global PPE Compliance Platform',
    description: 'Free PPE compliance check. Get CE, FDA, UKCA certification requirements in 60 seconds.',
    url: 'https://mdlooker.com',
    siteName: 'MDLooker',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MDLooker - PPE Compliance Made Simple',
    description: 'Free compliance check for masks, protective clothing, gloves. CE/FDA/UKCA certification guidance.',
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

// 在服务器端验证环境变量
if (typeof window === 'undefined') {
  validateAndLog()
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
