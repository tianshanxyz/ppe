'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'
import { homeTranslations, getTranslations } from '@/lib/i18n/translations'
import { Database, Globe, Shield, TrendingUp, Users, Lock, Zap, Brain } from 'lucide-react'

export default function AboutPage() {
  const locale = useLocale()
  const t = getTranslations(homeTranslations, locale)
  const isZh = locale === 'zh'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {t.aboutMDLooker}
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.empoweringMedicalDeviceProfessionals}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.ourMission}</h2>
          <p className="text-gray-600 leading-relaxed">{t.missionDescription}</p>
        </section>

        {/* What We Offer */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.whatWeOffer}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Database}
              title={t.comprehensiveDatabase}
              description={t.comprehensiveDatabaseDesc}
            />
            <FeatureCard
              icon={Shield}
              title={t.regulatoryCompliance}
              description={t.regulatoryComplianceDesc}
            />
            <FeatureCard
              icon={TrendingUp}
              title={t.realTimeUpdates}
              description={t.realTimeUpdatesDesc}
            />
          </div>
        </section>

        {/* Data Sources */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.dataSources}</h2>
          <p className="text-gray-600 mb-6">{t.dataSourcesDescription}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataSourceCard
              flag="🇺🇸"
              name={t.fdaUS}
              description={t.fda510k}
            />
            <DataSourceCard
              flag="🇪🇺"
              name={t.eudamedEU}
              description={t.eudamedRegistrations}
            />
            <DataSourceCard
              flag="🇬🇧"
              name="MHRA (UK)"
              description={isZh ? 'UKCA认证注册数据' : 'UKCA certification registry'}
            />
            <DataSourceCard
              flag="🇨🇦"
              name="Health Canada"
              description={isZh ? '医疗器械注册数据库' : 'Medical device registry'}
            />
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.ourValues}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={Users}
              title={t.accessibility}
              description={t.accessibilityDesc}
            />
            <ValueCard
              icon={Lock}
              title={t.transparency}
              description={t.transparencyDesc}
            />
            <ValueCard
              icon={Shield}
              title={t.accuracy}
              description={t.accuracyDesc}
            />
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.contactUs}</h2>
          <p className="text-gray-600 mb-4">{t.contactDescription}</p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700">
              <span className="font-medium">{t.emailLabel}</span>{' '}
              <a href="mailto:support@mdlooker.com" className="text-[#339999] hover:text-[#257373] font-medium">
                {t.supportEmail}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#339999]" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function DataSourceCard({ flag, name, description }: { flag: string, name: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <span className="text-2xl">{flag}</span>
      <div>
        <div className="font-medium text-gray-900">{name}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  )
}

function ValueCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
