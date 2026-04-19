'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Globe, Zap, Users, DollarSign, Package, Building, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data';
import { ComplianceCheckTool } from '@/components/ppe/ComplianceCheckTool';
import { PPEIcon } from '@/components/ppe/PPEIcons';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PPEHomePage() {
  const categories = getPPECategories();
  const markets = getTargetMarkets();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#339999]/5 via-white to-[#339999]/5 pt-24 pb-40 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#339999]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#339999]/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                <span className="text-[#339999]">Free</span> PPE Compliance Check
              </h1>
            </motion.div>
            
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Your first stop for PPE export compliance. Get instant compliance reports for CE, FDA, UKCA, and more in 60 seconds.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="#compliance-check"
                className="inline-flex items-center px-10 py-5 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Start Free Check
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-10 py-5 bg-white text-[#339999] text-lg font-semibold rounded-xl border-2 border-[#339999] hover:bg-[#339999]/5 transition-all duration-300"
              >
                Learn More
              </Link>
            </motion.div>
            
            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { number: '5+', label: 'PPE Categories' },
                { number: '5+', label: 'Global Markets' },
                { number: '60s', label: 'Get Report' },
                { number: '$0', label: 'Cost to Start' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl font-bold text-[#339999] mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-[#339999]" />
        </motion.div>
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
      <motion.section 
        className="py-20 bg-gray-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Supported PPE Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive compliance coverage for all major PPE product types
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category, i) => (
              <motion.div
                key={category.id}
                variants={fadeInUp}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#339999]/30 hover:-translate-y-2 cursor-pointer"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#339999]/10 to-[#339999]/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <PPEIcon categoryId={category.id} size={36} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#339999] transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                  {category.name_zh}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Markets Section */}
      <motion.section 
        className="py-20 bg-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Target Markets Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access compliance requirements for all major global markets
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {markets.map((market, i) => (
              <motion.div
                key={market.code}
                variants={fadeInUp}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-center hover:border-[#339999]/30 hover:-translate-y-2 cursor-pointer"
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{market.flag_emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#339999] transition-colors">
                  {market.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {market.name_zh}
                </p>
                <p className="text-xs text-gray-500 bg-[#339999]/5 px-3 py-1 rounded-full inline-block">
                  {market.regulation_name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        id="how-it-works" 
        className="py-20 bg-gray-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your compliance report in 3 simple steps
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Select Product & Market',
                description: 'Choose your PPE product category and target export market from our comprehensive list'
              },
              {
                number: '2',
                title: 'Get Instant Report',
                description: 'Receive detailed compliance requirements including standards, certifications, and timelines'
              },
              {
                number: '3',
                title: 'Download PDF',
                description: 'Get a professional PDF report sent to your email for offline reference and team sharing'
              }
            ].map((step, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#339999] to-[#2d8b8b] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-8 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Advanced Tools */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Compliance Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional tools to streamline your global market entry
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                href: '/ppe/market-access',
                icon: Globe,
                title: 'Market Access Requirements',
                subtitle: 'Detailed market entry guidance',
                description: 'Get comprehensive market access reports including certification requirements, timeline estimates, cost breakdowns, and required documentation for your specific product and target market.',
                cta: 'Explore Market Access'
              },
              {
                href: '/ppe/certification-comparison',
                icon: Shield,
                title: 'Certification Comparison',
                subtitle: 'CE vs FDA vs UKCA vs NMPA',
                description: 'Compare certification requirements side by side. Understand the differences between CE, FDA, UKCA, and NMPA certifications including timelines, costs, and documentation requirements.',
                cta: 'Compare Certifications'
              },
              {
                href: '/ppe/products',
                icon: Package,
                title: 'Product Database',
                subtitle: 'Browse 51+ PPE products',
                description: 'Search and browse our comprehensive database of PPE products with detailed certification information, manufacturer details, and market access data from FDA, CE, and NMPA sources.',
                cta: 'Browse Products'
              },
              {
                href: '/ppe/manufacturers',
                icon: Building,
                title: 'Manufacturers Directory',
                subtitle: 'Verified manufacturers worldwide',
                description: 'Find verified PPE manufacturers from around the world. View company profiles, certifications, product catalogs, and contact information all in one place.',
                cta: 'Find Manufacturers'
              },
              {
                href: '/ppe/statistics',
                icon: Zap,
                title: 'Market Statistics',
                subtitle: 'Data-driven insights',
                description: 'Explore market trends, product distributions, and competitive analysis with interactive charts and data visualizations.',
                cta: 'View Statistics'
              }
            ].map((tool, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Link
                  href={tool.href}
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#339999]/30 hover:-translate-y-2 block"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <tool.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tool.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="flex items-center text-[#339999] font-semibold">
                    {tool.cta}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section 
        className="py-20 bg-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MDLooker?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The most comprehensive PPE compliance platform for global exporters
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Accurate & Up-to-Date',
                description: 'Official sources only. All regulations linked to government websites for verification'
              },
              {
                icon: Globe,
                title: 'Global Coverage',
                description: 'EU, US, UK, GCC, Southeast Asia - all major markets in one platform'
              },
              {
                icon: Zap,
                title: 'Instant Access',
                description: 'No waiting. Get your compliance report in 60 seconds, completely free'
              },
              {
                icon: Users,
                title: 'Expert Support',
                description: 'Upgrade to Pro for unlimited checks, DoC generator, and priority support'
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300">
                <feature.icon className="w-14 h-14 text-[#339999] mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Preview */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-[#339999]/10 via-white to-white"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
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
            </motion.div>

            {/* Pro Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#339999] relative hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
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
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
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
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-[#339999] to-[#2d8b8b]"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white mb-6">
            Ready to Start Your PPE Compliance Journey?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
            Join thousands of exporters who trust MDLooker for their compliance needs
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#compliance-check"
              className="inline-flex items-center px-10 py-5 bg-white text-[#339999] text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Check Compliance Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/ppe/pricing"
              className="inline-flex items-center px-10 py-5 bg-transparent text-white text-lg font-semibold rounded-xl border-2 border-white hover:bg-white/10 transition-all duration-300"
            >
              View Pricing
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
