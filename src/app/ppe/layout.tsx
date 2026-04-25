import type { Metadata } from 'next'
import '../globals.css'
import { PPENavbar } from '@/components/layout/PPENavbar'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export const metadata: Metadata = {
  title: 'MDLooker PPE - Free PPE Compliance Check',
  description: 'Your first stop for PPE export compliance. Get instant compliance reports for CE, FDA, UKCA certification in 60 seconds.',
}

export default function PPELayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LanguageProvider>
      <div className="ppe-layout">
        <PPENavbar />
        {children}
      </div>
    </LanguageProvider>
  )
}
