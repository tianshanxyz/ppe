'use client'

import { useEffect, useState } from 'react'
import { Database, Brain, Globe, Zap, Users, Lock, LucideIcon, BookOpen, Award, Package, Factory, Scale } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { homeTranslations, getTranslations } from '@/lib/i18n/translations'
import { getPPEStats } from '@/lib/ppe-api-client'

export default function AboutPage() {
  const locale = useLocale()
  const t = getTranslations(homeTranslations, locale)
  const [dbStats, setDbStats] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEStats()
        if (mounted) {
          setDbStats(statsData.data)
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">{t.aboutMDLooker}</h1>
          <p className="mt-4 text-xl text-gray-600">
            {locale === 'zh' ? 'AI驱动的PPE合规与数据平台' : 'AI-Powered PPE Compliance & Data Platform'}
          </p>
          <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
            {locale === 'zh'
              ? 'MDLooker 是专为个人防护设备（PPE）制造商、出口商和合规专业人士打造的AI驱动平台。我们提供全面的合规检查、法规跟踪和全球市场准入数据，帮助企业快速进入国际市场。'
              : 'MDLooker is an AI-powered platform built for PPE manufacturers, exporters, and compliance professionals. We provide comprehensive compliance checking, regulation tracking, and global market access data to help businesses enter international markets quickly.'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Statistics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {locale === 'zh' ? '平台数据' : 'Platform at a Glance'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dbStats ? [
              { number: dbStats.overview?.totalProducts?.toLocaleString() || '...', label: locale === 'zh' ? '认证PPE产品' : 'Certified PPE Products', icon: Package },
              { number: Object.keys(dbStats.distributions?.country ?? {}).length || '45+', label: locale === 'zh' ? '覆盖国家/地区' : 'Countries & Regions', icon: Globe },
              { number: dbStats.overview?.totalRegulations?.toLocaleString() || '...', label: locale === 'zh' ? '实时法规更新' : 'Real-time Regulations', icon: Scale },
              { number: '99.2%', label: locale === 'zh' ? 'AI合规准确率' : 'AI Compliance Accuracy', icon: Award },
            ].map((stat, i) => (
              <StatCard
                key={i}
                number={String(stat.number)}
                label={stat.label}
                icon={stat.icon}
              />
            )) : [
              { number: '50,000+', label: locale === 'zh' ? '认证PPE产品' : 'Certified PPE Products', icon: Database },
              { number: '45+', label: locale === 'zh' ? '覆盖国家/地区' : 'Countries & Regions', icon: Globe },
              { number: '342', label: locale === 'zh' ? '实时法规更新' : 'Real-time Regulations', icon: Zap },
              { number: '99.2%', label: locale === 'zh' ? 'AI合规准确率' : 'AI Compliance Accuracy', icon: Award },
            ].map((stat, i) => (
              <StatCard
                key={i}
                number={stat.number}
                label={stat.label}
                icon={stat.icon}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.ourMission}</h2>
          <p className="text-gray-600 leading-relaxed">
            {locale === 'zh'
              ? '我们的使命是通过AI技术和全面的数据资源，简化个人防护设备（PPE）的合规流程。MDLooker 整合全球45+个国家和地区的法规数据，为制造商、出口商和合规团队提供一站式的合规检查、认证指导和市场准入解决方案，降低国际贸易壁垒。'
              : 'Our mission is to simplify Personal Protective Equipment (PPE) compliance through AI technology and comprehensive data resources. MDLooker aggregates regulatory data from 45+ countries and regions, providing manufacturers, exporters, and compliance teams with one-stop compliance checking, certification guidance, and market access solutions to reduce international trade barriers.'}
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{locale === 'zh' ? '核心能力' : 'Core Capabilities'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={Brain}
              title={locale === 'zh' ? 'AI驱动的合规指导' : 'AI-Powered Compliance Guidance'}
              description={locale === 'zh'
                ? '基于AI的智能合规检查，自动识别产品适用的法规标准，生成详细的合规报告和认证路径建议。'
                : 'AI-powered intelligent compliance checking that automatically identifies applicable regulations for your products, generates detailed compliance reports, and provides certification pathway recommendations.'}
            />
            <FeatureCard
              icon={Globe}
              title={locale === 'zh' ? '全球市场准入' : 'Global Market Access'}
              description={locale === 'zh'
                ? '覆盖45+个国家和地区的PPE法规数据库，包括欧盟CE、美国FDA/NIOSH、中国NMPA、英国UKCA等主要市场准入要求。'
                : 'PPE regulatory database covering 45+ countries and regions, including major market access requirements such as EU CE, US FDA/NIOSH, China NMPA, and UK UKCA.'}
            />
            <FeatureCard
              icon={Zap}
              title={locale === 'zh' ? '实时法规更新' : 'Real-time Regulation Updates'}
              description={locale === 'zh'
                ? '持续跟踪全球PPE法规变化，及时推送法规更新和合规警告，确保您的产品始终符合最新要求。'
                : 'Continuous tracking of global PPE regulatory changes with timely notifications of regulation updates and compliance alerts to ensure your products always meet the latest requirements.'}
            />
            <FeatureCard
              icon={BookOpen}
              title={locale === 'zh' ? '知识库与文档' : 'Knowledge Base & Documentation'}
              description={locale === 'zh'
                ? '包含CE认证、FDA 510(k)、UKCA过渡等主题的详细指南，以及风险评估、测试要求等专业技术文档。'
                : 'Detailed guides on topics such as CE marking, FDA 510(k), UKCA transition, as well as professional technical documentation on risk assessment and testing requirements.'}
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{locale === 'zh' ? '数据来源' : 'Data Sources'}</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F1EA;&#x1F1FA;</span>
                <span className="font-medium text-gray-900">EU Commission / NANDO</span>
                <span className="text-gray-500">- {locale === 'zh' ? 'CE认证与公告机构' : 'CE Certification & Notified Bodies'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F1FA;&#x1F1F8;</span>
                <span className="font-medium text-gray-900">NIOSH / FDA</span>
                <span className="text-gray-500">- {locale === 'zh' ? '呼吸防护与医疗器械审批' : 'Respiratory Protection & Medical Device Approval'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F1E8;&#x1F1F3;</span>
                <span className="font-medium text-gray-900">NMPA (China)</span>
                <span className="text-gray-500">- {locale === 'zh' ? '中国医疗器械注册数据' : 'China Medical Device Registration Data'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F1EC;&#x1F1E7;</span>
                <span className="font-medium text-gray-900">OPSS / MHRA (UK)</span>
                <span className="text-gray-500">- {locale === 'zh' ? 'UKCA认证数据' : 'UKCA Certification Data'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F1EF;&#x1F1F5;</span>
                <span className="font-medium text-gray-900">PMDA (Japan)</span>
                <span className="text-gray-500">- {locale === 'zh' ? '日本医疗器械注册' : 'Japan Medical Device Registration'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">&#x1F30D;</span>
                <span className="font-medium text-gray-900">ISO / CEN / EN Standards</span>
                <span className="text-gray-500">- {locale === 'zh' ? '国际与欧洲标准数据库' : 'International & European Standards Database'}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.ourValues}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={Users}
              title={locale === 'zh' ? '客户至上' : 'Customer First'}
              description={locale === 'zh'
                ? '以用户需求为核心，持续优化产品体验，提供专业、及时的合规服务。'
                : 'Customer needs at the core, continuously optimizing product experience and providing professional, timely compliance services.'}
            />
            <ValueCard
              icon={Lock}
              title={t.transparency}
              description={locale === 'zh'
                ? '透明的定价体系和数据来源，让每一次合规决策都有据可查。'
                : 'Transparent pricing and data sources, ensuring every compliance decision is traceable and documented.'}
            />
            <ValueCard
              icon={Award}
              title={t.accuracy}
              description={locale === 'zh'
                ? '企业级数据准确性，AI辅助人工审核，确保合规建议的可靠性。'
                : 'Enterprise-grade data accuracy with AI-assisted human review to ensure reliable compliance recommendations.'}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.contactUs}</h2>
          <p className="text-gray-600 mb-4">
            {locale === 'zh'
              ? '如需了解更多关于PPE合规服务、企业定制方案或API接入，请随时联系我们。'
              : 'For more information about PPE compliance services, enterprise custom plans, or API access, please contact us anytime.'}
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

function StatCard({ number, label, icon: Icon }: { number: string; label: string; icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-[#339999]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-[#339999]" />
      </div>
      <div className="text-3xl font-bold text-[#339999] mb-1">{number}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#339999]" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
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