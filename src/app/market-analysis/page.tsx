'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, BarChart3, Globe, Package, Building, ArrowUpRight, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getPPEProductStats, getMarketStats } from '@/lib/ppe-database-client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { marketAnalysisTranslations, getTranslations } from '@/lib/i18n/translations'

const COLORS = ['#339999', '#2d8b8b', '#267a7a', '#1f6969', '#185858', '#114747', '#0a3636', '#032525']

export default function MarketAnalysisPage() {
  const [stats, setStats] = useState<any>(null)
  const [marketStats, setMarketStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const locale = useLocale()
  const t = getTranslations(marketAnalysisTranslations, locale)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [productStats, marketData] = await Promise.all([
        getPPEProductStats(),
        getMarketStats(),
      ])
      setStats(productStats)
      setMarketStats(marketData)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 准备图表数据
  const countryChartData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.countryCount || {}).map(([country, count]) => ({
      name: country,
      value: count,
    })).sort((a, b) => (b.value as number) - (a.value as number))
  }, [stats])

  const categoryChartData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.categoryCount || {}).map(([category, count]) => ({
      name: category,
      value: count,
    })).sort((a, b) => (b.value as number) - (a.value as number))
  }, [stats])

  const ppeCategoryChartData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.ppeCategoryCount || {}).map(([category, count]) => ({
      name: `Class ${category}`,
      value: count,
    }))
  }, [stats])

  const statusChartData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.statusCount || {}).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }))
  }, [stats])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
          <p className="mt-4 text-gray-600">{t.loadingMarketAnalysis}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <TrendingUp className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.marketAnalysisDashboard}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.comprehensiveInsights}
            </p>
            <div className="mt-8">
              <Link
                href="/market-analysis/reports"
                className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                {locale === 'zh' ? '查看市场研究报告' : 'View Market Research Reports'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      {stats && (
        <section className="py-6 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.totalProducts}</div>
                <div className="text-sm text-gray-600">{t.totalProducts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.countryCount).length}</div>
                <div className="text-sm text-gray-600">{t.countries}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.categoryCount).length}</div>
                <div className="text-sm text-gray-600">{t.categories}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['II'] || 0}</div>
                <div className="text-sm text-gray-600">{t.classIIProducts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['III'] || 0}</div>
                <div className="text-sm text-gray-600">{t.classIIIProducts}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Charts */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Country Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Globe className="w-6 h-6 text-[#339999] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">{t.geographicDistribution}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#339999" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Package className="w-6 h-6 text-[#339999] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">{t.productCategories}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#339999" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PPE Class Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="w-6 h-6 text-[#339999] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">{t.ppeClassification}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ppeCategoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ppeCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Registration Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <ArrowUpRight className="w-6 h-6 text-[#339999] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">{t.registrationStatus}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Statistics */}
          {marketStats.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Globe className="w-6 h-6 text-[#339999] mr-3" />
                <h2 className="text-xl font-bold text-gray-900">{t.marketAccessStatistics}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {marketStats.map((market, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200"
                  >
                    <div className="text-5xl mb-4">{market.market === 'EU' ? '🇪🇺' : market.market === 'US' ? '🇺🇸' : market.market === 'CN' ? '🇨🇳' : '🌍'}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {market.market_name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.total}:</span>
                        <span className="text-lg font-bold text-[#339999]">{market.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.approved}:</span>
                        <span className="text-sm font-semibold text-green-600">{market.approved}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.expired}:</span>
                        <span className="text-sm font-semibold text-orange-600">{market.expired}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.suspended}:</span>
                        <span className="text-sm font-semibold text-red-600">{market.suspended}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t.keyMarketInsights}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.marketConcentration}</h3>
                <p className="text-gray-700">
                  The majority of PPE products in our database come from {(() => {
                    const entries = Object.entries(stats?.countryCount || {}) as [string, number][]
                    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'multiple regions'
                  })()}, 
                  representing a significant share of the global PPE market.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.productClassification}</h3>
                <p className="text-gray-700">
                  Class II PPE products dominate the market with {(stats?.ppeCategoryCount?.['II'] || 0) / (stats?.totalProducts || 1) * 100}% of total products, 
                  followed by Class III products.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.categoryTrends}</h3>
                <p className="text-gray-700">
                  {(() => {
                    const entries = Object.entries(stats?.categoryCount || {}) as [string, number][]
                    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hand protection'
                  })()} is the largest product category, 
                  reflecting strong demand in this segment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
