'use client'

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MDLooker</span>
            </Link>
            <p className="text-gray-500 text-sm">
              Global PPE compliance platform providing CE, FDA, UKCA certification guidance for personal protective equipment exporters.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ppe/products" className="text-gray-500 hover:text-primary transition-colors">
                  Product Database
                </Link>
              </li>
              <li>
                <Link href="/ppe/manufacturers" className="text-gray-500 hover:text-primary transition-colors">
                  Manufacturers
                </Link>
              </li>
              <li>
                <Link href="/ppe/market-access" className="text-gray-500 hover:text-primary transition-colors">
                  Market Access
                </Link>
              </li>
              <li>
                <Link href="/ppe/certification-comparison" className="text-gray-500 hover:text-primary transition-colors">
                  Certification Compare
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ppe/regulations" className="text-gray-500 hover:text-primary transition-colors">
                  Regulations
                </Link>
              </li>
              <li>
                <Link href="/ppe/pricing" className="text-gray-500 hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-500 hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 MDLooker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
