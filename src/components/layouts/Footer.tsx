'use client'

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#339999] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MDLooker</span>
            </Link>
            <p className="text-gray-500 text-sm">
              Global medical device regulatory database providing access to FDA, EUDAMED, NMPA, and worldwide regulatory information.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Tools
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/regulations" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Regulations
                </Link>
              </li>
              <li>
                <Link href="/data-sources" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Data Sources
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-[#339999] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-[#339999] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-[#339999] transition-colors">
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
