import type { Metadata } from 'next'
import '../globals.css'

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
    <>
      {children}
    </>
  )
}
