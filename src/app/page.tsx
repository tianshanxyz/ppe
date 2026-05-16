'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Globe, Zap, Users, Package, Building, ChevronDown, ClipboardList, Bell, AlertTriangle, Newspaper, BookOpen, Library, Sparkles, Factory, Scale, BadgeCheck, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data';
import { ComplianceCheckTool } from '@/components/ppe/ComplianceCheckTool';
import { PPEIcon } from '@/components/ppe/PPEIcons';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { ppeTranslations, commonTranslations, getTranslations } from '@/lib/i18n/translations';
import { getPPEStats } from '@/lib/ppe-api-client';
import { DualModeSearch } from '@/components/search/DualModeSearch';

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
  const ct = getTranslations(commonTranslations, locale);
  const categories = getPPECategories();
  const markets = getTargetMarkets();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load real database stats
  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const statsData = await getPPEStats();
        if (mounted) {
          setDbStats(statsData.data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    loadStats();
    return () => { mounted = false };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#339999]/5 via-white to-[#339999]/5 pt-16 sm:pt-24 pb-24 sm:pb-40 overflow-hidden">
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
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-6 leading-tight">
                <span className="text-[#339999]">Global</span> PPE Compliance Information Platform
              </h1>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto mb-6 sm:mb-10 px-2">
              {t.yourFirstStop}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4 sm:px-0">
              <Link
                href="#compliance-check"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-[#339999] text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {t.startFreeCheck}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-white text-[#339999] text-base sm:text-lg font-semibold rounded-xl border-2 border-[#339999] hover:bg-[#339999]/5 transition-all duration-300"
              >
                {t.learnMore}
              </Link>
            </motion.div>

            {/* Smart Search with Auto Classification */}
            <motion.div variants={fadeInUp} className="max-w-xl sm:max-w-2xl mx-auto mb-10 sm:mb-16 px-4 sm:px-0">
              <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#339999]" />
                <span className="text-xs sm:text-sm font-medium text-[#339999]">{ct.aiPoweredSearch}</span>
                <span className="text-[10px] sm:text-xs text-gray-400">·</span>
                <span className="text-[10px] sm:text-xs text-gray-400">{locale === 'zh' ? '智能分类搜索' : 'Smart Classified Search'}</span>
              </div>

              <DualModeSearch />
            </motion.div>

            {/* Real Database Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto px-2 sm:px-0">
              {dbStats ? [
                { number: dbStats.overview?.totalProducts?.toLocaleString() || '...', label: ct.ppeProducts, icon: Package },
                { number: dbStats.overview?.totalManufacturers?.toLocaleString() || '...', label: ct.manufacturers, icon: Factory },
                { number: dbStats.overview?.totalRegulations?.toLocaleString() || '...', label: t.regulatoryAlerts, icon: Scale },
                { number: Object.keys(dbStats.distributions?.country ?? {}).length, label: ct.countries, icon: Globe },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-1 sm:mb-2">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#339999]" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#339999] mb-1 sm:mb-2">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              )) : [
                { number: '5+', label: t.ppeCategories },
                { number: '5+', label: t.globalMarkets },
                { number: '60s', label: t.getReport },
                { number: '$0', label: t.costToStart }
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#339999] mb-1 sm:mb-2">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-[#339999]" />
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
                icon: GitCompare,
                title: t.certificationComparison,
                subtitle: t.certificationComparisonDesc,
                description: t.certificationComparisonFullDesc,
                cta: t.compareCertifications
              },
              {
                href: '/compliance-tracker',
                icon: ClipboardList,
                title: t.complianceTracker,
                subtitle: locale === 'zh' ? '追踪认证进度' : 'Track certification progress',
                description: t.complianceTrackerDesc,
                cta: t.trackProgress
              },
              {
                href: '/certificate-alerts',
                icon: Bell,
                title: t.certificateAlerts,
                subtitle: locale === 'zh' ? '不错过任何截止日期' : 'Never miss a deadline',
                description: t.certificateAlertsDesc,
                cta: t.setAlerts
              },
              {
                href: '/regulatory-alerts',
                icon: AlertTriangle,
                title: t.regulatoryAlerts,
                subtitle: locale === 'zh' ? '领先于法规变化' : 'Stay ahead of changes',
                description: t.regulatoryAlertsDesc,
                cta: t.viewAlerts
              },
              {
                href: '/regulatory-news',
                icon: Newspaper,
                title: t.regulatoryNews,
                subtitle: locale === 'zh' ? '精选行业情报' : 'Curated industry intelligence',
                description: t.regulatoryNewsDesc,
                cta: t.readNews
              },
              {
                href: '/case-studies',
                icon: BookOpen,
                title: t.caseStudies,
                subtitle: locale === 'zh' ? '从真实案例中学习' : 'Learn from real examples',
                description: t.caseStudiesDesc,
                cta: t.readCases
              },
              {
                href: '/knowledge-base',
                icon: Library,
                title: t.knowledgeBase,
                subtitle: locale === 'zh' ? '指南、标准和常见问题' : 'Guides, standards & FAQs',
                description: t.knowledgeBaseDesc,
                cta: t.exploreKnowledge
              },
              {
                href: '/products',
                icon: Package,
                title: t.products,
                subtitle: t.productsDesc,
                description: t.productsFullDesc,
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
                icon: BadgeCheck,
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
                  <span className="text-gray-700">Basic search (3/day)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Compliance check (1/day)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Product & manufacturer summary</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Regulation title & abstract</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Market access overview</span>
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
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">$99</span>
                <span className="text-lg text-gray-600 font-normal">/mo</span>
              </div>
              <p className="text-sm text-green-600 font-medium mb-6">$948/yr — Save 20%</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited search & compliance checks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Semantic search + AI search</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">AI chat assistant (50/day)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Report generation (20/mo) + Document generator</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access (1,000/day) + All format export</span>
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
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">$299</span>
                <span className="text-lg text-gray-600 font-normal">/mo</span>
              </div>
              <p className="text-sm text-green-600 font-medium mb-6">$2,868/yr — Save 20%</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All Professional features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited search/export/reports/AI chat</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">White-label reports + Webhook + SSO</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access (10,000/day) + Team (10 members)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support + Dedicated account manager</span>
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
