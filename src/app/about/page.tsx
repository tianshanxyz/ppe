'use client'

import { Metadata } from 'next'
import { Database, Shield, Globe, Zap, Users, Lock, LucideIcon } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { homeTranslations, getTranslations } from '@/lib/i18n/translations'

export default function AboutPage() {
  const locale = useLocale()
  const t = getTranslations(homeTranslations, locale)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">{t.aboutMDLooker}</h1>
          <p className="mt-4 text-xl text-gray-600">
            {t.empoweringMedicalDeviceProfessionals}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.ourMission}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t.missionDescription}
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.whatWeOffer}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              icon={Globe}
              title={t.globalCoverage}
              description={t.globalCoverageDesc}
            />
            <FeatureCard
              icon={Zap}
              title={t.realTimeUpdates}
              description={t.realTimeUpdatesDesc}
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.dataSources}</h2>
          <p className="text-gray-600 mb-6">
            {t.dataSourcesDescription}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium text-gray-900">{t.fdaUS}</span>
                <span className="text-gray-500">- {t.fda510k}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇪🇺</span>
                <span className="font-medium text-gray-900">{t.eudamedEU}</span>
                <span className="text-gray-500">- {t.eudamedRegistrations}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇨🇳</span>
                <span className="font-medium text-gray-900">NMPA (China)</span>
                <span className="text-gray-500">- Active registrations</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-medium text-gray-900">PMDA (Japan)</span>
                <span className="text-gray-500">- Active registrations</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <span className="font-medium text-gray-900">MHRA (UK)</span>
                <span className="text-gray-500">- UKCA registrations</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-16">
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

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.contactUs}</h2>
          <p className="text-gray-600 mb-4">
            {t.contactDescription}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700">
              <span className="font-medium">{t.emailLabel}</span>{' '}
              <a href="mailto:support@mdlooker.com" className="text-primary-600 hover:text-primary-700">
                {t.supportEmail}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function ValueCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
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