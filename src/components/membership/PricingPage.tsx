'use client'

/**
 * 会员定价页面组件
 *
 * 任务B-001: 会员等级系统 - 前端展示
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  Zap,
  Building2,
  Users,
  Download,
  Bell,
  FileText,
  Globe,
  Star,
  Crown,
  HelpCircle,
} from 'lucide-react'
import { MembershipTier, MEMBERSHIP_TIERS } from '@/lib/membership/types'

interface PricingPageProps {
  currentTier?: MembershipTier
  onSelectTier?: (tier: MembershipTier, billingCycle: 'monthly' | 'yearly') => void
  className?: string
}

export function PricingPage({ currentTier = 'free', onSelectTier, className = '' }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [hoveredTier, setHoveredTier] = useState<MembershipTier | null>(null)

  const tiers = Object.values(MEMBERSHIP_TIERS)

  const getTierIcon = (tierId: MembershipTier) => {
    switch (tierId) {
      case 'free':
        return Star
      case 'professional':
        return Zap
      case 'enterprise':
        return Crown
      default:
        return Star
    }
  }

  const getTierColor = (tierId: MembershipTier) => {
    switch (tierId) {
      case 'free':
        return 'bg-gray-100 text-gray-900 border-gray-200'
      case 'professional':
        return 'bg-gradient-to-br from-[#339999] to-[#2d8b8b] text-white border-[#339999]'
      case 'enterprise':
        return 'bg-gradient-to-br from-purple-600 to-purple-800 text-white border-purple-600'
      default:
        return 'bg-gray-100 text-gray-900'
    }
  }

  const getButtonStyle = (tierId: MembershipTier, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-gray-100 text-gray-500 cursor-default'
    }

    switch (tierId) {
      case 'free':
        return 'bg-gray-900 text-white hover:bg-gray-800'
      case 'professional':
        return 'bg-white text-[#339999] hover:bg-gray-50'
      case 'enterprise':
        return 'bg-white text-purple-600 hover:bg-gray-50'
      default:
        return 'bg-gray-900 text-white'
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合您的方案</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            从免费版开始，随时升级到专业版或企业版，解锁更多功能
          </p>

          {/* 计费周期切换 */}
          <div className="mt-8 inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-[#339999] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${
                billingCycle === 'yearly'
                  ? 'bg-[#339999] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              年付
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                省2个月
              </span>
            </button>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const Icon = getTierIcon(tier.tier)
            const isCurrent = currentTier === tier.tier
            const isPopular = tier.tier === 'professional'
            const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setHoveredTier(tier.tier)}
                onHoverEnd={() => setHoveredTier(null)}
                className={`relative rounded-2xl border-2 overflow-hidden transition-shadow ${
                  isPopular ? 'border-[#339999] shadow-xl' : 'border-gray-200 shadow-sm'
                } ${hoveredTier === tier.tier ? 'shadow-2xl' : ''}`}
              >
                {/* 推荐标签 */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#339999] text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                    最受欢迎
                  </div>
                )}

                {/* 当前套餐标签 */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-gray-900 text-white px-4 py-1 text-sm font-medium rounded-br-lg">
                    当前套餐
                  </div>
                )}

                <div className={`p-8 ${getTierColor(tier.tier)}`}>
                  {/* 图标和名称 */}
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl ${tier.tier === 'free' ? 'bg-gray-200' : 'bg-white/20'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold">{tier.name}</h3>
                      <p className="text-sm opacity-80">{tier.description}</p>
                    </div>
                  </div>

                  {/* 价格 */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="ml-2 text-lg opacity-80">
                        /{billingCycle === 'monthly' ? '月' : '年'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && tier.yearlyPrice > 0 && (
                      <p className="text-sm mt-1 opacity-80">
                        相当于 ${Math.round(tier.yearlyPrice / 12)}/月
                      </p>
                    )}
                  </div>

                  {/* 按钮 */}
                  <button
                    onClick={() => !isCurrent && onSelectTier?.(tier.tier, billingCycle)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${getButtonStyle(
                      tier.tier,
                      isCurrent
                    )}`}
                  >
                    {isCurrent ? '当前套餐' : tier.tier === 'free' ? '开始使用' : '立即升级'}
                  </button>
                </div>

                {/* 功能列表 */}
                <div className="p-8 bg-white">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">包含功能</h4>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 使用限制 */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">使用限制</h4>
                    <ul className="space-y-2 text-sm">
                      {tier.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-600">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 功能对比表 */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">功能详细对比</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-8 py-4 text-left text-sm font-medium text-gray-500">功能</th>
                  {tiers.map((tier) => (
                    <th key={tier.tier} className="px-8 py-4 text-center text-sm font-medium text-gray-900">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-8 py-4 text-sm text-gray-900">产品搜索</td>
                  <td className="px-8 py-4 text-center text-sm text-gray-600">10次/天</td>
                  <td className="px-8 py-4 text-center text-sm text-gray-600">无限</td>
                  <td className="px-8 py-4 text-center text-sm text-gray-600">无限</td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-sm text-gray-900">企业查询</td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-sm text-gray-900">数据导出</td>
                  <td className="px-8 py-4 text-center">
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-sm text-gray-900">高级分析</td>
                  <td className="px-8 py-4 text-center">
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-sm text-gray-900">优先支持</td>
                  <td className="px-8 py-4 text-center">
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">常见问题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: '可以随时升级或降级吗？',
                a: '是的，您可以随时升级或降级您的套餐。升级立即生效，降级在当前计费周期结束后生效。',
              },
              {
                q: '有免费试用吗？',
                a: '免费版永久免费，包含基础功能。专业版和企业版提供14天免费试用。',
              },
              {
                q: '如何取消订阅？',
                a: '您可以随时在账户设置中取消订阅。取消后，您仍可使用服务直到当前计费周期结束。',
              },
              {
                q: '支持哪些支付方式？',
                a: '我们支持信用卡、借记卡和PayPal支付。企业版还支持银行转账。',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">还有疑问？</p>
          <button className="inline-flex items-center text-[#339999] hover:text-[#2d8b8b] font-medium">
            <HelpCircle className="w-5 h-5 mr-2" />
            联系我们的销售团队
          </button>
        </div>
      </div>
    </div>
  )
}
