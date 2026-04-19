'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Globe, Zap, Users, DollarSign, Package, Building } from 'lucide-react'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
import { ComplianceCheckTool } from '@/components/ppe/ComplianceCheckTool'

export default function PPEHomePage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#339999]/10 via-white to-white pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#339999] tracking-tight mb-6">
              Free PPE Compliance Check
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Your first stop for PPE export compliance. Get instant compliance reports for CE, FDA, UKCA certification in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="#compliance-check"
                className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors shadow-lg"
              >
                Start Free Check
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-8 py-4 bg-white text-[#339999] text-lg font-semibold rounded-lg border-2 border-[#339999] hover:bg-[#339999]/5 transition-colors"
              >
                Learn More
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999] mb-2">5+</div>
                <div className="text-sm text-gray-600">PPE Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999] mb-2">5+</div>
                <div className="text-sm text-gray-600">Global Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999] mb-2">60s</div>
                <div className="text-sm text-gray-600">Get Report</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999] mb-2">Free</div>
                <div className="text-sm text-gray-600">To Use</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Check Tool Section */}
      <section id="compliance-check" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Check Your PPE Compliance Requirements
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select your product category and target market to get instant compliance guidance
            </p>
          </div>
          <ComplianceCheckTool />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Supported PPE Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive compliance coverage for all major PPE product types
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
                <div className="text-xs text-gray-500">
                  {category.name_zh}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Target Markets Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access compliance requirements for all major global markets
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {markets.map((market) => (
              <div
                key={market.code}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center"
              >
                <div className="text-5xl mb-4">{market.flag_emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {market.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {market.name_zh}
                </p>
                <p className="text-xs text-gray-500">
                  {market.regulation_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your compliance report in 3 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#339999] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Select Product & Market
              </h3>
              <p className="text-gray-600">
                Choose your PPE product category and target export market from our comprehensive list
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#339999] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Instant Report
              </h3>
              <p className="text-gray-600">
                Receive detailed compliance requirements including standards, certifications, and timelines
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#339999] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Download PDF
              </h3>
              <p className="text-gray-600">
                Get a professional PDF report sent to your email for offline reference and team sharing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Tools */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Compliance Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional tools to streamline your global market entry
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Market Access Tool */}
            <Link
              href="/ppe/market-access"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Market Access Requirements
                  </h3>
                  <p className="text-sm text-gray-500">
                    Detailed market entry guidance
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Get comprehensive market access reports including certification requirements, 
                timeline estimates, cost breakdowns, and required documentation for your 
                specific product and target market.
              </p>
              <div className="flex items-center text-[#339999] font-semibold">
                Explore Market Access
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Certification Comparison Tool */}
            <Link
              href="/ppe/certification-comparison"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Certification Comparison
                  </h3>
                  <p className="text-sm text-gray-500">
                    CE vs FDA vs UKCA vs NMPA
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Compare certification requirements side by side. Understand the differences 
                between CE, FDA, UKCA, and NMPA certifications including timelines, costs, 
                and documentation requirements.
              </p>
              <div className="flex items-center text-[#339999] font-semibold">
                Compare Certifications
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Product Database */}
            <Link
              href="/ppe/products"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Product Database
                  </h3>
                  <p className="text-sm text-gray-500">
                    Browse 51+ PPE products
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Search and browse our comprehensive database of PPE products with 
                detailed certification information, manufacturer details, and 
                market access data from FDA, CE, and NMPA sources.
              </p>
              <div className="flex items-center text-[#339999] font-semibold">
                Browse Products
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Manufacturers Directory */}
            <Link
              href="/ppe/manufacturers"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Manufacturers Directory
                  </h3>
                  <p className="text-sm text-gray-500">
                    Verified manufacturers worldwide
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Find verified PPE manufacturers from around the world. View company 
                profiles, certifications, product catalogs, and contact information 
                all in one place.
              </p>
              <div className="flex items-center text-[#339999] font-semibold">
                Find Manufacturers
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Statistics */}
            <Link
              href="/ppe/statistics"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Market Statistics
                  </h3>
                  <p className="text-sm text-gray-500">
                    Data-driven insights
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Explore market trends, product distributions, and competitive 
                analysis with interactive charts and data visualizations.
              </p>
              <div className="flex items-center text-[#339999] font-semibold">
                View Statistics
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MDLooker?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The most comprehensive PPE compliance platform for global exporters
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accurate & Up-to-Date
              </h3>
              <p className="text-gray-600">
                Official sources only. All regulations linked to government websites for verification
              </p>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Global Coverage
              </h3>
              <p className="text-gray-600">
                EU, US, UK, GCC, Southeast Asia - all major markets in one platform
              </p>
            </div>
            <div className="text-center">
              <Zap className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Access
              </h3>
              <p className="text-gray-600">
                No waiting. Get your compliance report in 60 seconds, completely free
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Expert Support
              </h3>
              <p className="text-gray-600">
                Upgrade to Pro for unlimited checks, DoC generator, and priority support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gradient-to-br from-[#339999]/10 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">For individuals exploring compliance</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">3 compliance checks/month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Regulation knowledge base</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email newsletter</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full py-3 px-6 bg-[#339999] text-white text-center rounded-lg font-semibold hover:bg-[#2d8b8b] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#339999] relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#339999] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">For SMEs and frequent exporters</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $199
                <span className="text-lg text-gray-600 font-normal">/year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited compliance checks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">DoC generator</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Template library</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">PDF downloads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 px-6 bg-[#339999] text-white text-center rounded-lg font-semibold hover:bg-[#2d8b8b] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For large enterprises</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $499
                <span className="text-lg text-gray-600 font-normal">/year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All Pro features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated consultant</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Team collaboration (10 users)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">24/7 priority support</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full py-3 px-6 bg-white text-[#339999] text-center rounded-lg font-semibold border-2 border-[#339999] hover:bg-[#339999]/5 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#339999]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your PPE Compliance Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of exporters who trust MDLooker for their compliance needs
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#compliance-check"
              className="inline-flex items-center px-8 py-4 bg-white text-[#339999] text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Check Compliance Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
