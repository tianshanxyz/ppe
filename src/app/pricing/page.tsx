'use client'

import { useState } from 'react'
import { Check, X, Star, Zap, Building2, CreditCard, Shield, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getMembershipTiers } from '@/lib/ppe-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function PricingPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const tiers = getMembershipTiers()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const proTier = tiers.find(t => t.popular)
  const freeTier = tiers.find(t => t.id === 'free')
  const enterpriseTier = tiers.find(t => t.id === 'enterprise')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.section 
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent {t.pricingTitle}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {locale === 'zh' ? '选择适合您PPE合规需求的完美方案。免费开始，随需升级。' : 'Choose the perfect plan for your PPE compliance needs. Start free and upgrade as you grow.'}
            </p>

            {/* Billing Toggle */}
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

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#339999]" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#339999]" />
                <span>Free Cancellation</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#339999]" />
                <span>Stripe & PayPal</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Cards */}
      <motion.section 
        className="py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            {freeTier && (
              <motion.div
                className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-[#339999] transition-colors"
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{freeTier.name}</h3>
                  <p className="text-gray-600 text-sm">{freeTier.recommended_for}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${freeTier.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      USD/{freeTier.billing_period}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Forever free</p>
                </div>

                <Link href="/auth/register">
                  <motion.button
                    className="w-full py-3 px-6 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors mb-8"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started Free
                  </motion.button>
                </Link>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">What&apos;s included:</h4>
                  <ul className="space-y-3">
                    {freeTier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                    {freeTier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Pro Tier */}
            {proTier && (
              <motion.div
                className="relative bg-gradient-to-b from-[#339999]/5 to-white rounded-2xl border-2 border-[#339999] p-8 shadow-xl"
                variants={fadeInUp}
                whileHover={{ y: -12, scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white rounded-full text-sm font-semibold shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{proTier.name}</h3>
                  <p className="text-gray-600 text-sm">{proTier.recommended_for}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${proTier.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      USD/month
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="mt-2">
                      <span className="text-gray-500 line-through mr-2">
                        ${proTier.price * 12} USD/yr
                      </span>
                      <span className="text-green-600 font-semibold text-sm">
                        ${Math.round(proTier.price * 12 * 0.8)} USD billed yearly (save 20%)
                      </span>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {billingPeriod === 'yearly'
                      ? `Billed annually ($${Math.round(proTier.price * 12 * 0.8)} USD)`
                      : 'Billed monthly'}
                  </p>
                </div>

                <Link href="/auth/register">
                  <motion.button
                    className="w-full py-3 px-6 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors mb-8 shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Free Trial
                  </motion.button>
                </Link>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Everything in Free, plus:</h4>
                  <ul className="space-y-3">
                    {proTier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                    {proTier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Enterprise Tier */}
            {enterpriseTier && (
              <motion.div
                className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-[#339999] transition-colors"
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{enterpriseTier.name}</h3>
                  <p className="text-gray-600 text-sm">{enterpriseTier.recommended_for}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${enterpriseTier.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      USD/month
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="mt-2">
                      <span className="text-gray-500 line-through mr-2">
                        ${enterpriseTier.price * 12} USD/yr
                      </span>
                      <span className="text-green-600 font-semibold text-sm">
                        ${Math.round(enterpriseTier.price * 12 * 0.8)} USD billed yearly (save 20%)
                      </span>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {billingPeriod === 'yearly'
                      ? `Billed annually ($${Math.round(enterpriseTier.price * 12 * 0.8)} USD)`
                      : 'Billed monthly'}
                  </p>
                </div>

                <Link href="/auth/register">
                  <motion.button
                    className="w-full py-3 px-6 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors mb-8 shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Contact Sales
                  </motion.button>
                </Link>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Everything in Pro, plus:</h4>
                  <ul className="space-y-3">
                    {enterpriseTier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                    {enterpriseTier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Feature Comparison */}
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
              Compare Features
            </h2>
            <p className="text-xl text-gray-600">
              See what&apos;s included in each plan
            </p>
          </motion.div>

          <motion.div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" variants={fadeInUp}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white bg-[#339999]">Pro</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { name: 'Compliance Checks', free: '3/month', pro: 'Unlimited', enterprise: 'Unlimited' },
                    { name: 'PDF Report Downloads', free: false, pro: true, enterprise: true },
                    { name: 'Email Report Delivery', free: false, pro: true, enterprise: true },
                    { name: 'DoC Generator', free: false, pro: true, enterprise: true },
                    { name: 'Template Library', free: false, pro: true, enterprise: true },
                    { name: 'Regulation Updates', free: false, pro: true, enterprise: true },
                    { name: 'Priority Support', free: false, pro: true, enterprise: true },
                    { name: 'Dedicated Consultant', free: false, pro: false, enterprise: true },
                    { name: 'Team Collaboration', free: false, pro: false, enterprise: 'Up to 10 users' },
                    { name: 'Document Management', free: false, pro: false, enterprise: true },
                    { name: 'API Access', free: false, pro: false, enterprise: true },
                    { name: 'White-label Reports', free: false, pro: false, enterprise: true },
                    { name: '24/7 Support', free: false, pro: false, enterprise: true },
                  ].map((feature, idx) => (
                    <motion.tr 
                      key={idx} 
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      whileHover={{ backgroundColor: '#f0fdfa' }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          feature.free
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm bg-[#339999]/5">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          feature.pro
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          feature.enterprise
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section 
        className="py-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {locale === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: 'Can I switch plans later?',
                answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, MasterCard, American Express) via Stripe, as well as PayPal payments.'
              },
              {
                question: 'Is there a free trial for Pro plans?',
                answer: 'Yes! All Pro plans come with a 14-day free trial. No credit card required to start.'
              },
              {
                question: 'What happens if I exceed the free tier limits?',
                answer: 'You\'ll be notified when you\'re approaching your limit. You can upgrade to Pro to continue using the service without interruption.'
              },
              {
                question: 'Can I cancel my subscription?',
                answer: 'Absolutely! You can cancel your subscription at any time. Your account will remain active until the end of your billing period.'
              },
              {
                question: 'Do you offer discounts for non-profits?',
                answer: 'Yes! We offer special pricing for non-profit organizations and educational institutions. Contact us to learn more.'
              },
            ].map((faq, idx) => (
              <motion.div 
                key={idx} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                variants={fadeInUp}
              >
                <motion.button
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                  {openFaq === idx ? (
                    <ChevronUp className="w-6 h-6 text-[#339999]" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === idx ? 'auto' : 0,
                    opacity: openFaq === idx ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
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
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join hundreds of PPE exporters and manufacturers who trust MDLooker for their compliance needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                className="px-8 py-4 bg-white text-[#339999] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Trial
              </motion.button>
              <motion.button 
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
