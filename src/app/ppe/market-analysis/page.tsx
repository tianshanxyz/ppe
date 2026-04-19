'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, BarChart3, Globe, Package, Building, ArrowUpRight } from 'lucide-react'
import { getPPEProductStats, getMarketStats } from '@/lib/ppe-database-service'

const COLORS = ['#339999', '#2d8b8b', '#267a7a', '#1f6969', '#185858', '#114747', '#0a3636', '#032525']

export default function MarketAnalysisPage() {
  const [stats, setStats] = useState<any>(null)
  const [marketStats, setMarketStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
          <p className="mt-4 text-gray-600">Loading market analysis...</p>
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
              Market Analysis Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive insights into the global PPE market landscape
            </p>
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
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.countryCount).length}</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{Object.keys(stats.categoryCount).length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['II'] || 0}</div>
                <div className="text-sm text-gray-600">Class II Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#339999]">{stats.ppeCategoryCount['III'] || 0}</div>
                <div className="text-sm text-gray-600">Class III Products</div>
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
                <h2 className="text-xl font-bold text-gray-900">Geographic Distribution</h2>
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
                <h2 className="text-xl font-bold text-gray-900">Product Categories</h2>
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
                <h2 className="text-xl font-bold text-gray-900">PPE Classification</h2>
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
                <h2 className="text-xl font-bold text-gray-900">Registration Status</h2>
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
                <h2 className="text-xl font-bold text-gray-900">Market Access Statistics</h2>
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
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-[#339999]">{market.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Approved:</span>
                        <span className="text-sm font-semibold text-green-600">{market.approved}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Expired:</span>
                        <span className="text-sm font-semibold text-orange-600">{market.expired}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Suspended:</span>
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Key Market Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Concentration</h3>
                <p className="text-gray-700">
                  The majority of PPE products in our database come from {Object.entries(stats?.countryCount || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'multiple regions'}, 
                  representing a significant share of the global PPE market.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Classification</h3>
                <p className="text-gray-700">
                  Class II PPE products dominate the market with {(stats?.ppeCategoryCount?.['II'] || 0) / (stats?.totalProducts || 1) * 100}% of total products, 
                  followed by Class III products.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-6 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Category Trends</h3>
                <p className="text-gray-700">
                  {Object.entries(stats?.categoryCount || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hand protection'} is the largest product category, 
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
