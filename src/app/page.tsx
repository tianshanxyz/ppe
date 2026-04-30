'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Globe, Zap, Users, Package, Building, ChevronDown, ClipboardList, Bell, AlertTriangle, Newspaper, BookOpen, Library, Search, Sparkles, Bot, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data';
import { ComplianceCheckTool } from '@/components/ppe/ComplianceCheckTool';
import { PPEIcon } from '@/components/ppe/PPEIcons';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { ppeTranslations, getTranslations } from '@/lib/i18n/translations';

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
  const locale = useLocale();
  const t = getTranslations(ppeTranslations, locale);
  const categories = getPPECategories();
  const markets = getTargetMarkets();
  const [isScrolled, setIsScrolled] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = aiInput.trim();
    if (!query || aiLoading) return;

    setAiMessages(prev => [...prev, { role: 'user', content: query }]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.error || 'No response received.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

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
                <span className="text-[#339999]">Global</span> PPE Compliance Information Platform
              </h1>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              {t.yourFirstStop}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="#compliance-check"
                className="inline-flex items-center px-10 py-5 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {t.startFreeCheck}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-10 py-5 bg-white text-[#339999] text-lg font-semibold rounded-xl border-2 border-[#339999] hover:bg-[#339999]/5 transition-all duration-300"
              >
                {t.learnMore}
              </Link>
            </motion.div>

            {/* Global Search with AI Chat */}
            <motion.div variants={fadeInUp} className="max-w-2xl mx-auto mb-16">
              {/* AI-Powered Search Indicator */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#339999]" />
                <span className="text-sm font-medium text-[#339999]">AI-Powered Search</span>
              </div>

              {/* Mode Toggle & Search Box */}
              <div className="relative">
                {!aiMode ? (
                  /* Standard Search Mode */
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                      const query = input.value.trim();
                      if (query) {
                        window.location.href = `/search?q=${encodeURIComponent(query)}&type=all`;
                      }
                    }}
                  >
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products, regulations, manufacturers..."
                      className="w-full pl-14 pr-40 py-5 text-lg bg-white rounded-2xl border-2 border-gray-200 focus:border-[#339999] focus:ring-4 focus:ring-[#339999]/10 shadow-lg transition-all outline-none"
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-[#339999] text-white font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors shadow-md"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiMode(true)}
                      className="absolute right-[110px] top-1/2 transform -translate-y-1/2 p-2.5 text-gray-400 hover:text-[#339999] hover:bg-[#339999]/5 rounded-lg transition-all"
                      title="Switch to AI Chat mode"
                    >
                      <Bot className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  /* AI Chat Mode */
                  <form
                    className="relative"
                    onSubmit={handleAiSubmit}
                  >
                    <Bot className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#339999]" />
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask about PPE compliance, regulations, certifications..."
                      className="w-full pl-14 pr-40 py-5 text-lg bg-white rounded-2xl border-2 border-[#339999] focus:ring-4 focus:ring-[#339999]/10 shadow-lg transition-all outline-none"
                      disabled={aiLoading}
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiInput.trim()}
                      className="absolute right-14 top-1/2 transform -translate-y-1/2 p-2.5 bg-[#339999] text-white rounded-xl hover:bg-[#2d8b8b] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAiMode(false); setAiMessages([]); setAiInput(''); }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Switch back to standard search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>

              {/* AI Chat Messages */}
              {aiMode && aiMessages.length > 0 && (
                <div className="mt-4 space-y-3 max-h-80 overflow-y-auto px-1">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-[#339999] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-200">
                            <Sparkles className="w-3.5 h-3.5 text-[#339999]" />
                            <span className="text-xs font-semibold text-[#339999]">AI Assistant</span>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { number: '5+', label: t.ppeCategories },
                { number: '5+', label: t.globalMarkets },
                { number: '60s', label: t.getReport },
                { number: '$0', label: t.costToStart }
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
              {t.checkYourPPECompliance}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.selectProductMarket}
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
              {t.supportedPPECategories}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.comprehensiveComplianceCoverage}
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
              {t.targetMarketsCoverage}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.accessComplianceRequirements}
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
              {t.howItWorks}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.getComplianceReport3Steps}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: t.selectProductMarketStep,
                description: t.selectProductMarketDesc
              },
              {
                number: '2',
                title: t.getInstantReport,
                description: t.getInstantReportDesc
              },
              {
                number: '3',
                title: t.downloadPDF,
                description: t.downloadPDFDesc
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
              {t.advancedComplianceTools}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.professionalToolsDescription}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                href: '/market-access',
                icon: Globe,
                title: t.marketAccessRequirements,
                subtitle: t.marketAccessRequirementsDesc,
                description: t.marketAccessDesc,
                cta: t.exploreMarketAccess
              },
              {
                href: '/certification-comparison',
                icon: Shield,
                title: t.certificationComparison,
                subtitle: t.certificationComparisonDesc,
                description: t.certificationComparisonFullDesc,
                cta: t.compareCertifications
              },
              {
                href: '/compliance-tracker',
                icon: ClipboardList,
                title: t.complianceTracker,
                subtitle: 'Track certification progress',
                description: t.complianceTrackerDesc,
                cta: t.trackProgress
              },
              {
                href: '/certificate-alerts',
                icon: Bell,
                title: t.certificateAlerts,
                subtitle: 'Never miss a deadline',
                description: t.certificateAlertsDesc,
                cta: t.setAlerts
              },
              {
                href: '/regulatory-alerts',
                icon: AlertTriangle,
                title: t.regulatoryAlerts,
                subtitle: 'Stay ahead of changes',
                description: t.regulatoryAlertsDesc,
                cta: t.viewAlerts
              },
              {
                href: '/regulatory-news',
                icon: Newspaper,
                title: t.regulatoryNews,
                subtitle: 'Curated industry intelligence',
                description: t.regulatoryNewsDesc,
                cta: t.readNews
              },
              {
                href: '/case-studies',
                icon: BookOpen,
                title: t.caseStudies,
                subtitle: 'Learn from real examples',
                description: t.caseStudiesDesc,
                cta: t.readCases
              },
              {
                href: '/knowledge-base',
                icon: Library,
                title: t.knowledgeBase,
                subtitle: 'Guides, standards & FAQs',
                description: t.knowledgeBaseDesc,
                cta: t.exploreKnowledge
              },
              {
                href: '/products',
                icon: Package,
                title: t.productDatabase,
                subtitle: t.productDatabaseDesc,
                description: t.productDatabaseFullDesc,
                cta: t.browseProducts
              },
              {
                href: '/manufacturers',
                icon: Building,
                title: t.manufacturersDirectory,
                subtitle: t.manufacturersDirectoryDesc,
                description: t.manufacturersDirectoryFullDesc,
                cta: t.findManufacturers
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
              {t.whyChooseMDLooker}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.mostComprehensivePPEPlatform}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: t.accurateUpToDate,
                description: t.accurateUpToDateDesc
              },
              {
                icon: Globe,
                title: t.globalCoverage,
                description: t.globalCoverageDesc
              },
              {
                icon: Zap,
                title: t.instantAccess,
                description: t.instantAccessDesc
              },
              {
                icon: Users,
                title: t.expertSupport,
                description: t.expertSupportDesc
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
              {t.simpleTransparentPricing}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.startFreeUpgradeNeedMore}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.free}</h3>
              <p className="text-gray-600 mb-6">{t.forIndividualsExploring}</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.threeChecksMonth}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.regulationKnowledgeBase}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.emailNewsletter}</span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="block w-full py-3 px-6 bg-[#339999] text-white text-center rounded-lg font-semibold hover:bg-[#2d8b8b] transition-colors"
              >
                {t.getStarted}
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#339999] relative hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#339999] text-white px-4 py-1 rounded-full text-sm font-semibold">
                {t.mostPopular}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.pro}</h3>
              <p className="text-gray-600 mb-6">{t.forSMEsFrequentExporters}</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $99
                <span className="text-lg text-gray-600 font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.unlimitedComplianceChecks}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.docGenerator}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.templateLibrary}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.pdfDownloads}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.prioritySupport}</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full py-3 px-6 bg-[#339999] text-white text-center rounded-lg font-semibold hover:bg-[#2d8b8b] transition-colors"
              >
                {t.startFreeTrial}
              </Link>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.enterprise}</h3>
              <p className="text-gray-600 mb-6">{t.forLargeEnterprises}</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $299
                <span className="text-lg text-gray-600 font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.allProFeatures}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.dedicatedConsultant}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.teamCollaboration}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.apiAccess}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{t.priority24_7}</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full py-3 px-6 bg-white text-[#339999] text-center rounded-lg font-semibold border-2 border-[#339999] hover:bg-[#339999]/5 transition-colors"
              >
                {t.contactSales}
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
            {t.readyToStart}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-white/90 mb-8">
            {t.joinThousandsExporters}
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#compliance-check"
              className="inline-flex items-center px-10 py-5 bg-white text-[#339999] text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {t.checkComplianceNow}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-10 py-5 bg-transparent text-white text-lg font-semibold rounded-xl border-2 border-white hover:bg-white/10 transition-all duration-300"
            >
              {t.viewPricing}
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
