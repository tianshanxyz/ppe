'use client'

import { useState } from 'react'
import { Check, X, Star, Shield, CreditCard, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import { VIP_PRICING } from '@/lib/permissions/config'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    nameZh: '免费版',
    price: 0,
    yearlyPrice: 0,
    description: '适合个人用户基础查询',
    descriptionEn: 'For individual users exploring PPE compliance',
    features: [
      'Basic search (3/day)',
      'Compliance check (1/day)',
      'Product summary view',
      'Manufacturer summary view',
      'Regulation title & abstract',
      'Market access overview',
      'Regulatory news',
      'Knowledge base (basic)',
    ],
    limitations: [
      'No data export',
      'No compliance tracking',
      'No AI assistant',
      'No API access',
    ],
    cta: 'Get Started Free',
    ctaZh: '免费开始',
    href: '/auth/register',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    nameZh: '专业版',
    price: VIP_PRICING.professional.monthly,
    yearlyPrice: VIP_PRICING.professional.yearly,
    description: '适合专业合规人员和中小团队',
    descriptionEn: 'For compliance managers and medium businesses',
    features: [
      'Unlimited basic search',
      'Unlimited compliance checks',
      'Semantic search + AI search',
      'AI chat assistant (50/day)',
      'Full product/manufacturer/regulation info',
      'Compliance tracking (50 products)',
      'Certificate alerts (20 rules)',
      'Competitor analysis + Market analysis',
      'Report generation (20/month)',
      'Document generator (DoC etc.)',
      'API access (1,000/day)',
      'All format export (2,000/month)',
    ],
    limitations: [
      'No white-label reports',
      'No Webhook integration',
      'No team collaboration',
    ],
    cta: 'Start 7-Day Free Trial',
    ctaZh: '开始7天免费试用',
    href: '/auth/register',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameZh: '企业版',
    price: VIP_PRICING.enterprise.monthly,
    yearlyPrice: VIP_PRICING.enterprise.yearly,
    description: '适合大型企业和合规服务商',
    descriptionEn: 'For large enterprises and compliance service providers',
    features: [
      'All Professional features',
      'Unlimited search/export/reports',
      'Unlimited AI chat assistant',
      'White-label reports',
      'API access (10,000/day)',
      'Webhook integration',
      'SSO single sign-on',
      'Team collaboration (10 members)',
      'Batch query (1,000/query)',
      'Priority support',
      'Dedicated account manager',
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaZh: '联系销售',
    href: '/contact',
    popular: false,
  },
]

const COMPARISON_FEATURES = [
  { name: 'Basic search', nameZh: '基础搜索', free: '3/day', pro: 'Unlimited', ent: 'Unlimited' },
  { name: 'Compliance checks', nameZh: '合规检查', free: '1/day', pro: 'Unlimited', ent: 'Unlimited' },
  { name: 'AI chat assistant', nameZh: 'AI聊天助手', free: false, pro: '50/day', ent: 'Unlimited' },
  { name: 'Semantic search', nameZh: '语义搜索', free: false, pro: true, ent: true },
  { name: 'Compliance tracking', nameZh: '合规追踪', free: false, pro: '50 products', ent: 'Unlimited' },
  { name: 'Certificate alerts', nameZh: '证书提醒', free: false, pro: '20 rules', ent: 'Unlimited' },
  { name: 'Report generation', nameZh: '报告生成', free: false, pro: '20/month', ent: 'Unlimited' },
  { name: 'Data export', nameZh: '数据导出', free: false, pro: '2,000/month', ent: 'Unlimited' },
  { name: 'API access', nameZh: 'API访问', free: false, pro: '1,000/day', ent: '10,000/day' },
  { name: 'Document generator', nameZh: '文档生成器', free: false, pro: true, ent: true },
  { name: 'Competitor analysis', nameZh: '竞品分析', free: false, pro: true, ent: true },
  { name: 'White-label reports', nameZh: '白标报告', free: false, pro: false, ent: true },
  { name: 'Webhook integration', nameZh: 'Webhook集成', free: false, pro: false, ent: true },
  { name: 'SSO', nameZh: 'SSO单点登录', free: false, pro: false, ent: true },
  { name: 'Team collaboration', nameZh: '团队协作', free: false, pro: false, ent: '10 members' },
  { name: 'Priority support', nameZh: '优先客服', free: false, pro: false, ent: true },
]

export default function PricingPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {locale === 'zh' ? '简单透明的定价' : 'Simple, Transparent Pricing'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {locale === 'zh'
                ? '选择适合您PPE合规需求的完美方案。免费开始，随需升级。'
                : 'Choose the perfect plan for your PPE compliance needs. Start free and upgrade as you grow.'}
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                {locale === 'zh' ? '月付' : 'Monthly'}
              </span>
              <motion.button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-14 h-7 bg-[#339999] rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              </motion.button>
              <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                {locale === 'zh' ? '年付' : 'Yearly'}
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {locale === 'zh' ? '省20%' : 'Save 20%'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#339999]" />
                <span>{locale === 'zh' ? '安全支付' : 'Secure Payment'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#339999]" />
                <span>{locale === 'zh' ? '随时取消' : 'Cancel Anytime'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#339999]" />
                <span>{locale === 'zh' ? 'Stripe / PayPal' : 'Stripe / PayPal'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="py-20" initial="initial" whileInView="animate" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TIERS.map((tier) => (
              <motion.div
                key={tier.id}
                className={`relative rounded-2xl p-8 ${
                  tier.popular
                    ? 'bg-gradient-to-b from-[#339999]/5 to-white border-2 border-[#339999] shadow-xl'
                    : 'bg-white border-2 border-gray-200 hover:border-[#339999] transition-colors'
                }`}
                variants={fadeInUp}
                whileHover={{ y: tier.popular ? -12 : -8, scale: tier.popular ? 1.03 : 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white rounded-full text-sm font-semibold shadow-lg">
                      <Star className="w-4 h-4" />
                      {locale === 'zh' ? '最受欢迎' : 'Most Popular'}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {locale === 'zh' ? tier.nameZh : tier.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'zh' ? tier.description : tier.descriptionEn}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                    {tier.price > 0 && (
                      <span className="text-gray-600 ml-2">USD/month</span>
                    )}
                  </div>
                  {tier.price > 0 && billingPeriod === 'yearly' && (
                    <div className="mt-2">
                      <span className="text-gray-500 line-through mr-2">
                        ${tier.price * 12} USD/yr
                      </span>
                      <span className="text-green-600 font-semibold text-sm">
                        ${tier.yearlyPrice} USD/yr (save 20%)
                      </span>
                    </div>
                  )}
                  {tier.price === 0 && (
                    <p className="text-gray-500 text-sm mt-2">
                      {locale === 'zh' ? '永久免费' : 'Forever free'}
                    </p>
                  )}
                </div>

                <Link href={tier.href}>
                  <motion.button
                    className={`w-full py-3 px-6 font-semibold rounded-lg mb-8 ${
                      tier.popular
                        ? 'bg-[#339999] text-white hover:bg-[#2d8b8b] shadow-md'
                        : tier.price === 0
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-[#339999] text-white hover:bg-[#2d8b8b] shadow-md'
                    } transition-colors`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {locale === 'zh' ? tier.ctaZh : tier.cta}
                  </motion.button>
                </Link>

                <div className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                    {tier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-20 bg-gray-50" initial="initial" whileInView="animate" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {locale === 'zh' ? '功能对比' : 'Compare Features'}
            </h2>
          </motion.div>

          <motion.div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" variants={fadeInUp}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '功能' : 'Feature'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white bg-[#339999]">Professional</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <motion.tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      whileHover={{ backgroundColor: '#f0fdfa' }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {locale === 'zh' ? feature.nameZh : feature.name}
                      </td>
                      {['free', 'pro', 'ent'].map((tier) => {
                        const value = tier === 'free' ? feature.free : tier === 'pro' ? feature.pro : feature.ent
                        return (
                          <td key={tier} className={`px-6 py-4 text-center text-sm ${tier === 'pro' ? 'bg-[#339999]/5' : ''}`}>
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-700">{value}</span>
                            )}
                          </td>
                        )
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="py-20" initial="initial" whileInView="animate" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {locale === 'zh' ? '常见问题' : 'FAQ'}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: locale === 'zh' ? '可以随时切换方案吗？' : 'Can I switch plans anytime?',
                a: locale === 'zh'
                  ? '是的，您可以随时升级或降级。升级立即生效并按比例计费，降级在当前计费周期结束后生效。'
                  : 'Yes, you can upgrade or downgrade anytime. Upgrades take effect immediately with prorated billing, downgrades take effect at the end of your current billing period.'
              },
              {
                q: locale === 'zh' ? '支持哪些支付方式？' : 'What payment methods do you accept?',
                a: locale === 'zh'
                  ? '我们支持 Visa、Mastercard、AMEX、银联信用卡（通过 Stripe），以及 PayPal、支付宝和微信支付。企业版还支持银行转账和发票支付。'
                  : 'We accept Visa, Mastercard, AMEX, UnionPay credit cards (via Stripe), PayPal, Alipay, and WeChat Pay. Enterprise plans also support bank transfers and invoice payments.'
              },
              {
                q: locale === 'zh' ? '免费试用期间会收费吗？' : 'Will I be charged during the free trial?',
                a: locale === 'zh'
                  ? '不会。7天免费试用期间不会收取任何费用。试用结束前我们会提醒您，您可以随时取消。'
                  : 'No. You won\'t be charged during the 7-day free trial. We\'ll remind you before it ends, and you can cancel anytime.'
              },
              {
                q: locale === 'zh' ? '如何取消订阅？' : 'How do I cancel my subscription?',
                a: locale === 'zh'
                  ? '您可以在订阅管理页面随时取消。取消后，您仍可使用付费功能至当前计费周期结束。'
                  : 'You can cancel anytime from your subscription management page. After cancellation, you\'ll retain access to paid features until the end of your current billing period.'
              },
              {
                q: locale === 'zh' ? '年付方案如何退款？' : 'What is the refund policy for yearly plans?',
                a: locale === 'zh'
                  ? '7天内未使用可全额退款。超过7天按剩余月份比例退款，扣除10%手续费。'
                  : 'Full refund within 7 days if unused. After 7 days, prorated refund for remaining months minus a 10% processing fee.'
              },
              {
                q: locale === 'zh' ? '学术机构或非营利组织有优惠吗？' : 'Do you offer discounts for academic or non-profit organizations?',
                a: locale === 'zh'
                  ? '是的，凭有效证明可享受5折优惠。请联系我们的销售团队申请。'
                  : 'Yes, we offer a 50% discount with valid proof. Please contact our sales team to apply.'
              },
            ].map((faq, idx) => (
              <motion.div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden" variants={fadeInUp}>
                <motion.button
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.q}</h3>
                  {openFaq === idx ? (
                    <ChevronUp className="w-6 h-6 text-[#339999]" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-20 bg-gradient-to-r from-[#339999] to-[#2d8b8b]"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-white mb-6">
              {locale === 'zh' ? '准备好开始了吗？' : 'Ready to Get Started?'}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {locale === 'zh'
                ? '免费开始使用，随时升级解锁更多功能'
                : 'Start free and upgrade anytime to unlock more features'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="px-8 py-4 bg-white text-[#339999] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/auth/register'}
              >
                {locale === 'zh' ? '免费开始' : 'Start Free'}
              </motion.button>
              <motion.button
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/contact'}
              >
                {locale === 'zh' ? '联系销售' : 'Contact Sales'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
