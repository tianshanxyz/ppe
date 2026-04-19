import { Metadata } from 'next'
import Link from 'next/link'
import { HomeSearch } from '@/components/home/HomeSearch'

export const metadata: Metadata = {
  title: 'MDLooker - Global Medical Device Regulatory Database',
  description: 'Access worldwide regulatory information of medical devices from FDA, EUDAMED, NMPA, and global databases.',
  alternates: {
    canonical: '/'
  }
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex flex-col">
      {/* Main Content - Centered Search */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#339999] tracking-tight text-center mb-4">
          Global Medical Device Regulatory Database
        </h1>

        {/* Tagline */}
        <p className="text-lg text-gray-500 text-center mb-12 max-w-2xl">
          Streamlined access to worldwide regulatory intelligence for medical devices
        </p>

        {/* Search Box */}
        <div className="w-full max-w-2xl mb-12">
          <HomeSearch />
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <span>Quick Search:</span>
          <Link href="/search?type=company" className="text-[#339999] hover:underline">
            Companies
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/search?type=product" className="text-[#339999] hover:underline">
            Products
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/tools/batch-query" className="text-[#339999] hover:underline">
            Batch Query
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/tools" className="text-[#339999] hover:underline">
            Toolbox
          </Link>
        </div>
      </main>
    </div>
  )
}
