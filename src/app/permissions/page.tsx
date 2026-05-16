'use client'

import { Shield, Check, X, Minus, Star, Users, Bot, Search, FileText, BarChart3, Key, Globe, Zap } from 'lucide-react'
import { ROLE_CONFIG, VIP_PRICING } from '@/lib/permissions/config'
import type { RoleConfigKey, RoleFeatures } from '@/lib/permissions/config'

const ROLE_INFO: Record<string, { name: string; nameZh: string; desc: string; descZh: string; icon: React.ReactNode; color: string }> = {
  guest: { name: 'Guest', nameZh: '游客', desc: 'Exploring PPE compliance', descZh: '探索PPE合规信息', icon: <Users className="w-5 h-5" />, color: 'gray' },
  user: { name: 'Registered User', nameZh: '注册用户', desc: 'Daily compliance queries', descZh: '日常合规查询', icon: <Shield className="w-5 h-5" />, color: 'blue' },
  vip_professional: { name: 'VIP Professional', nameZh: 'VIP专业版', desc: 'Professional compliance work', descZh: '专业合规工作', icon: <Star className="w-5 h-5" />, color: 'emerald' },
  vip_enterprise: { name: 'VIP Enterprise', nameZh: 'VIP企业版', desc: 'Enterprise-grade compliance', descZh: '企业级合规服务', icon: <Zap className="w-5 h-5" />, color: 'amber' },
}

const FEATURE_GROUPS: { title: string; titleZh: string; icon: React.ReactNode; features: { key: keyof RoleFeatures; name: string; nameZh: string }[] }[] = [
  {
    title: 'Search & AI', titleZh: '搜索与AI', icon: <Search className="w-5 h-5" />,
    features: [
      { key: 'basicSearch', name: 'Basic Search', nameZh: '基础搜索' },
      { key: 'semanticSearch', name: 'Semantic Search', nameZh: '语义搜索' },
      { key: 'aiSearch', name: 'AI Smart Search', nameZh: 'AI智能搜索' },
      { key: 'aiChat', name: 'AI Chat Assistant', nameZh: 'AI聊天助手' },
    ],
  },
  {
    title: 'Data Access', titleZh: '数据访问', icon: <Globe className="w-5 h-5" />,
    features: [
      { key: 'productDatabase', name: 'Product Database', nameZh: '产品数据库' },
      { key: 'manufacturerDirectory', name: 'Manufacturer Directory', nameZh: '制造商目录' },
      { key: 'regulationLibrary', name: 'Regulation Library', nameZh: '法规库' },
      { key: 'marketAccess', name: 'Market Access Guide', nameZh: '市场准入指南' },
      { key: 'statistics', name: 'Statistics Dashboard', nameZh: '统计数据中心' },
    ],
  },
  {
    title: 'Compliance Tools', titleZh: '合规工具', icon: <Shield className="w-5 h-5" />,
    features: [
      { key: 'certificationComparison', name: 'Certification Comparison', nameZh: '认证对比工具' },
      { key: 'complianceTracker', name: 'Compliance Tracker', nameZh: '合规追踪器' },
      { key: 'certificateAlerts', name: 'Certificate Alerts', nameZh: '证书到期提醒' },
      { key: 'regulatoryAlerts', name: 'Regulatory Alerts', nameZh: '法规变更提醒' },
      { key: 'documentGenerator', name: 'Document Generator', nameZh: '文档生成器' },
      { key: 'supplyChainTracker', name: 'Supply Chain Tracker', nameZh: '供应链追踪' },
    ],
  },
  {
    title: 'Analysis & Reports', titleZh: '分析与报告', icon: <BarChart3 className="w-5 h-5" />,
    features: [
      { key: 'competitorAnalysis', name: 'Competitor Analysis', nameZh: '竞品分析' },
      { key: 'marketAnalysis', name: 'Market Analysis', nameZh: '市场分析' },
      { key: 'creditScore', name: 'Credit Score', nameZh: '企业信用评分' },
      { key: 'pricePrediction', name: 'Price Prediction', nameZh: '价格预测' },
      { key: 'reportGeneration', name: 'Report Generation', nameZh: '报告生成' },
      { key: 'whiteLabelReports', name: 'White-Label Reports', nameZh: '白标报告' },
    ],
  },
  {
    title: 'Integration & API', titleZh: '集成与API', icon: <Key className="w-5 h-5" />,
    features: [
      { key: 'batchQuery', name: 'Batch Query', nameZh: '批量查询' },
      { key: 'apiAccess', name: 'API Access', nameZh: 'API访问' },
      { key: 'webhooks', name: 'Webhook Integration', nameZh: 'Webhook集成' },
      { key: 'sso', name: 'SSO Single Sign-On', nameZh: 'SSO单点登录' },
      { key: 'teamCollaboration', name: 'Team Collaboration', nameZh: '团队协作' },
    ],
  },
  {
    title: 'Personal', titleZh: '个人功能', icon: <FileText className="w-5 h-5" />,
    features: [
      { key: 'favorites', name: 'Favorites & Bookmarks', nameZh: '收藏/书签' },
      { key: 'searchHistory', name: 'Search History', nameZh: '搜索历史' },
    ],
  },
]

const QUOTA_ITEMS: { key: string; name: string; nameZh: string; getVal: (c: typeof ROLE_CONFIG.guest.quotas) => { limit: number; period: string } }[] = [
  { key: 'searches', name: 'Basic Search', nameZh: '基础搜索', getVal: c => ({ limit: c.searches.limit, period: c.searches.period }) },
  { key: 'complianceChecks', name: 'Compliance Checks', nameZh: '合规检查', getVal: c => ({ limit: c.complianceChecks.limit, period: c.complianceChecks.period }) },
  { key: 'aiChat', name: 'AI Chat', nameZh: 'AI聊天', getVal: c => ({ limit: c.aiChat.limit, period: c.aiChat.period }) },
  { key: 'downloads', name: 'Data Export', nameZh: '数据导出', getVal: c => ({ limit: c.downloads.limit, period: c.downloads.period }) },
  { key: 'reports', name: 'Reports', nameZh: '报告生成', getVal: c => ({ limit: c.reports.limit, period: c.reports.period }) },
  { key: 'trackerProducts', name: 'Tracked Products', nameZh: '追踪产品', getVal: c => ({ limit: c.trackerProducts.limit, period: c.trackerProducts.period }) },
  { key: 'alertRules', name: 'Alert Rules', nameZh: '提醒规则', getVal: c => ({ limit: c.alertRules.limit, period: c.alertRules.period }) },
  { key: 'apiCalls', name: 'API Calls', nameZh: 'API调用', getVal: c => ({ limit: c.apiCalls.limit, period: c.apiCalls.period }) },
]

function formatLimit(limit: number, period: string): string {
  if (limit === -1) return 'Unlimited'
  if (limit === 0) return '—'
  const periodLabel = period === 'daily' ? '/day' : period === 'monthly' ? '/mo' : ''
  return `${limit}${periodLabel}`
}

function FeatureValue({ value }: { value: boolean | string | number }) {
  if (value === false || value === 0) return <X className="w-5 h-5 text-gray-300 mx-auto" />
  if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />
  return <span className="text-sm text-gray-700 font-medium">{String(value)}</span>
}

export default function PermissionsPage() {
  const roles: RoleConfigKey[] = ['guest', 'user', 'vip_professional', 'vip_enterprise']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold text-white">Permissions & Pricing</h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Detailed breakdown of features, quotas, and access levels for each user role
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Role Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {roles.map(role => {
            const info = ROLE_INFO[role]
            const config = ROLE_CONFIG[role]
            const borderColor = info.color === 'gray' ? 'border-gray-300' : info.color === 'blue' ? 'border-blue-300' : info.color === 'emerald' ? 'border-emerald-300' : 'border-amber-300'
            const bgColor = info.color === 'gray' ? 'bg-gray-50' : info.color === 'blue' ? 'bg-blue-50' : info.color === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50'
            const iconColor = info.color === 'gray' ? 'text-gray-600' : info.color === 'blue' ? 'text-blue-600' : info.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'

            return (
              <div key={role} className={`bg-white rounded-2xl border-2 ${borderColor} p-6 hover:shadow-lg transition-shadow`}>
                <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-4 ${iconColor}`}>
                  {info.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{info.nameZh}</h3>
                <p className="text-sm text-gray-500 mb-3">{info.name}</p>
                <p className="text-sm text-gray-600 mb-4">{info.descZh}</p>
                {role === 'guest' && <p className="text-2xl font-bold text-gray-900">免费</p>}
                {role === 'user' && <p className="text-2xl font-bold text-gray-900">免费</p>}
                {role === 'vip_professional' && (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">¥{VIP_PRICING.professional.monthly}/月</p>
                    <p className="text-sm text-green-600">¥{VIP_PRICING.professional.yearly}/年 省20%</p>
                  </div>
                )}
                {role === 'vip_enterprise' && (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">¥{VIP_PRICING.enterprise.monthly}/月</p>
                    <p className="text-sm text-green-600">¥{VIP_PRICING.enterprise.yearly}/年 省20%</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Feature Permission Matrix */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Feature Permissions</h2>
          <p className="text-gray-600 mb-8">功能权限矩阵 — 各角色可访问的功能模块与操作权限</p>

          {FEATURE_GROUPS.map(group => (
            <div key={group.title} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#339999]/10 rounded-lg flex items-center justify-center text-[#339999]">
                  {group.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{group.titleZh}</h3>
                <span className="text-sm text-gray-500">{group.title}</span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">功能</th>
                      {roles.map(role => (
                        <th key={role} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {ROLE_INFO[role].nameZh}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.features.map(feature => (
                      <tr key={feature.key} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{feature.nameZh}</div>
                          <div className="text-xs text-gray-500">{feature.name}</div>
                        </td>
                        {roles.map(role => {
                          const value = ROLE_CONFIG[role].features[feature.key]
                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              <FeatureValue value={value} />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Quota Limits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Usage Quotas</h2>
          <p className="text-gray-600 mb-8">使用配额限制 — 各角色的每日/每月使用额度</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">配额项</th>
                  {roles.map(role => (
                    <th key={role} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {ROLE_INFO[role].nameZh}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {QUOTA_ITEMS.map(item => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.nameZh}</div>
                      <div className="text-xs text-gray-500">{item.name}</div>
                    </td>
                    {roles.map(role => {
                      const val = item.getVal(ROLE_CONFIG[role].quotas)
                      return (
                        <td key={role} className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${val.limit === -1 ? 'text-green-600' : val.limit === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                            {formatLimit(val.limit, val.period)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Formats */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Export Formats</h2>
          <p className="text-gray-600 mb-8">导出格式支持</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map(role => {
              const config = ROLE_CONFIG[role]
              const info = ROLE_INFO[role]
              return (
                <div key={role} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{info.nameZh}</h3>
                  {config.exportFormats.length === 0 ? (
                    <p className="text-sm text-gray-400">No export available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {config.exportFormats.map(fmt => (
                        <span key={fmt} className="px-3 py-1 bg-[#339999]/10 text-[#339999] rounded-full text-sm font-medium uppercase">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
