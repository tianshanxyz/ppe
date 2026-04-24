'use client'

import dynamic from 'next/dynamic'

// 动态导入Header和Footer，禁用服务器端渲染以避免hydration mismatch
const Header = dynamic(() => import('./Header').then(mod => ({ default: mod.Header })), {
  ssr: false,
  loading: () => <header className="sticky top-0 z-50 w-full h-16 border-b border-gray-100 bg-white" />
})

const Footer = dynamic(() => import('./Footer').then(mod => ({ default: mod.Footer })), {
  ssr: false,
  loading: () => <footer className="bg-white border-t border-gray-100 h-20" />
})

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
