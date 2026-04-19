import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { PPENavbar } from '@/components/layout/PPENavbar'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>
        <PPENavbar />
        <main>{children}</main>
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#339999] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MD</span>
                  </div>
                  <span className="font-bold text-lg">MDLooker PPE</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Your trusted partner for PPE compliance and export certification.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/ppe" className="hover:text-white transition-colors">Home</a></li>
                  <li><a href="/ppe/regulations" className="hover:text-white transition-colors">Regulations</a></li>
                  <li><a href="/ppe/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/ppe/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/ppe/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} MDLooker. All rights reserved.</p>
              <p className="mt-2">Powered by H-Guardian Technology</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
