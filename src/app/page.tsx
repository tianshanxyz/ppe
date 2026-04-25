'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Globe, Zap, Users, DollarSign, Package, Building } from 'lucide-react'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
import { ComplianceCheckToolLoader } from '@/components/ppe/ComplianceCheckToolLoader'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { homeTranslations, getTranslations } from '@/lib/i18n/translations'

export default function HomePage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  const { locale } = useLanguage()
  const t = getTranslations(homeTranslations, locale)

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-gradient-to-br from-primary/10 via-white to-white pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary tracking-tight mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="#compliance-check"
                className="inline-flex items-center px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-lg"
              >
                {t.startFreeCheck}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-8 py-4 bg-white text-primary text-lg font-semibold rounded-lg border-2 border-primary hover:bg-primary/5 transition-colors"
              >
                {t.learnMore}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">5+</div>
                <div className="text-sm text-gray-600">{t.ppeCategories}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">5+</div>
                <div className="text-sm text-gray-600">{t.globalMarkets}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">60s</div>
                <div className="text-sm text-gray-600">{t.getReport}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Free</div>
                <div className="text-sm text-gray-600">{t.toUse}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <ComplianceCheckToolLoader />
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.supportedPPECategories}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.comprehensiveComplianceCoverage}
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
                  {locale === 'zh' && category.name_zh ? category.name_zh : category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.targetMarketsCoverage}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.accessComplianceRequirements}
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
                  {locale === 'zh' && market.name_zh ? market.name_zh : market.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {market.regulation_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.howItWorks}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.getComplianceReport3Steps}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t.selectProductMarketStep}
              </h3>
              <p className="text-gray-600">
                {t.selectProductMarketDesc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t.getInstantReport}
              </h3>
              <p className="text-gray-600">
                {t.getInstantReportDesc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t.downloadPDF}
              </h3>
              <p className="text-gray-600">
                {t.downloadPDFDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.advancedComplianceTools}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.professionalToolsDescription}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link
              href="/ppe/market-access"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mr-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.marketAccessRequirements}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.marketAccessRequirementsDesc}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {t.selectProductMarket}
              </p>
              <div className="flex items-center text-primary font-semibold">
                {t.exploreMarketAccess}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/ppe/certification-comparison"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.certificationComparison}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.certificationComparisonDesc}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {t.compareCertifications}
              </p>
              <div className="flex items-center text-primary font-semibold">
                {t.compareCertifications}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/ppe/products"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mr-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.productDatabase}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.productDatabaseDesc}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {t.productDatabaseDesc}
              </p>
              <div className="flex items-center text-primary font-semibold">
                {t.browseProducts}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/ppe/manufacturers"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mr-4">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.manufacturersDirectory}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.manufacturersDirectoryDesc}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {t.manufacturersDirectoryDesc}
              </p>
              <div className="flex items-center text-primary font-semibold">
                {t.findManufacturers}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/ppe/statistics"
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mr-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t.marketStatistics}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t.marketStatisticsDesc}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {t.marketStatisticsDesc}
              </p>
              <div className="flex items-center text-primary font-semibold">
                {t.viewStatistics}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.whyChooseMDLooker}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.mostComprehensivePPEPlatform}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.accurateUpToDate}
              </h3>
              <p className="text-gray-600">
                {t.accurateUpToDateDesc}
              </p>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.globalCoverage}
              </h3>
              <p className="text-gray-600">
                {t.globalCoverageDesc}
              </p>
            </div>
            <div className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.instantAccess}
              </h3>
              <p className="text-gray-600">
                {t.instantAccessDesc}
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.expertSupport}
              </h3>
              <p className="text-gray-600">
                {t.expertSupportDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/10 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.simpleTransparentPricing}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.startFreeUpgradeNeedMore}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
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
                href="/ppe/auth/signup"
                className="block w-full py-3 px-6 bg-primary text-white text-center rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                {t.getStarted}
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                {t.mostPopular}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.pro}</h3>
              <p className="text-gray-600 mb-6">{t.forSMEsFrequentExporters}</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $199<span className="text-lg text-gray-600 font-normal">{t.perYear}</span>
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
                href="/ppe/pricing"
                className="block w-full py-3 px-6 bg-primary text-white text-center rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                {t.startFreeTrial}
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.enterprise}</h3>
              <p className="text-gray-600 mb-6">{t.forLargeEnterprises}</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $499<span className="text-lg text-gray-600 font-normal">{t.perYear}</span>
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
                href="/about"
                className="block w-full py-3 px-6 bg-white text-primary text-center rounded-lg font-semibold border-2 border-primary hover:bg-primary/5 transition-colors"
              >
                {t.contactSales}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t.readyToStart}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t.joinThousandsExporters}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#compliance-check"
              className="inline-flex items-center px-8 py-4 bg-white text-primary text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t.checkComplianceNow}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/ppe/pricing"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors"
            >
              {t.viewPricing}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
