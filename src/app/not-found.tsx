import Link from 'next/link';
import { Button } from '@/components/ui';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-20 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-[#339999]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl font-bold text-[#339999]">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Sorry, the page you are looking for does not exist or has been removed. Please check the URL or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-[#339999] hover:bg-[#2a8080]">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <Link href="/search">
            <Button variant="outline" size="lg">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 mb-4">You might want to visit:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/search" className="text-[#339999] hover:underline text-sm">
              Search
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/regulations" className="text-[#339999] hover:underline text-sm">
              Regulations
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/tools" className="text-[#339999] hover:underline text-sm">
              Tools
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/help" className="text-[#339999] hover:underline text-sm">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
