'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getPPECategories, getTargetMarkets, getPPEStats, getComplianceData } from '@/lib/ppe-data'
import { Package, FileText, Building, TrendingUp, Globe, BarChart3 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'

const COLORS = ['#339999', '#2d8b8b', '#267d7d', '#1f6f6f', '#186161', '#115353', '#0a4545', '#033737', '#002929', '#001b1b']

export default function StatisticsPage() {
  const locale = useLocale()
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getPPEStats>>>({
    totalProducts: 0,
    totalRegulations: 0,
    totalManufacturers: 0,
    categoryCount: {},
    marketCount: {},
  })

  // 筛选选项
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('2026')

  useEffect(() => {
    getPPEStats().then(setStats)
  }, [])

  // 筛选后的数据
  const filteredCategoryData = useMemo(() => {
    let data = Object.entries(stats.categoryCount || {}).map(([category, count]) => {
      const catInfo = categories.find(c => c.id === category)
      return {
        name: catInfo?.name || category,
        name_zh: catInfo?.name_zh || '',
        value: count,
        icon: catInfo?.icon || '',
      }
    })
    
    if (selectedCategory !== 'all') {
      data = data.filter(item => item.name === selectedCategory)
    }
    
    return data.sort((a, b) => b.value - a.value)
  }, [stats.categoryCount, categories, selectedCategory])

  // 市场分布数据
  const filteredMarketData = useMemo(() => {
    let data = Object.entries(stats.marketCount || {}).map(([market, count]) => {
      const marketInfo = markets.find(m => m.code === market)
      return {
        name: marketInfo?.name || market,
        name_zh: marketInfo?.name_zh || '',
        value: count,
        flag: marketInfo?.flag_emoji || '',
      }
    })
    
    if (selectedMarket !== 'all') {
      data = data.filter(item => item.name === selectedMarket)
    }
    
    return data.sort((a, b) => b.value - a.value)
  }, [stats.marketCount, markets, selectedMarket])

  // 合规要求复杂度数据
  const complianceComplexityData = useMemo(() => {
    const data = categories.map(cat => {
      const euCompliance = getComplianceData(cat.id, 'EU')
      const usCompliance = getComplianceData(cat.id, 'US')
      
      return {
        name: cat.name,
        name_zh: cat.name_zh,
        EU: euCompliance ? euCompliance.standards.length + euCompliance.certification_requirements.length : 0,
        US: usCompliance ? usCompliance.standards.length + usCompliance.certification_requirements.length : 0,
      }
    })
    
    return data
  }, [categories])

  // 认证时间对比数据
  const timelineData = useMemo(() => {
    const data = categories.map(cat => {
      const euCompliance = getComplianceData(cat.id, 'EU')
      const usCompliance = getComplianceData(cat.id, 'US')
      const ukCompliance = getComplianceData(cat.id, 'UK')
      
      return {
        name: cat.name.replace(' Protection', ''),
        EU: euCompliance ? euCompliance.estimated_timeline.max : 0,
        US: usCompliance ? usCompliance.estimated_timeline.max : 0,
        UK: ukCompliance ? ukCompliance.estimated_timeline.max : 0,
      }
    })
    
    return data
  }, [categories])

  // 认证费用对比数据
  const costData = useMemo(() => {
    const data = categories.map(cat => {
      const euCompliance = getComplianceData(cat.id, 'EU')
      const usCompliance = getComplianceData(cat.id, 'US')
      const ukCompliance = getComplianceData(cat.id, 'UK')
      
      return {
        name: cat.name.replace(' Protection', ''),
        EU: euCompliance ? euCompliance.estimated_cost.max / 1000 : 0,
        US: usCompliance ? usCompliance.estimated_cost.max / 1000 : 0,
        UK: ukCompliance ? ukCompliance.estimated_cost.max / 1000 : 0,
      }
    })
    
    return data
  }, [categories])

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
              {locale === 'zh' ? 'PPE市场统计' : 'PPE Market Statistics'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {locale === 'zh' ? '全球PPE合规格局的综合洞察' : 'Comprehensive insights into global PPE compliance landscape'}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{locale === 'zh' ? '产品类别：' : 'Product Category:'}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-[#339999]"
              >
                <option value="all">{locale === 'zh' ? '所有类别' : 'All Categories'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{locale === 'zh' ? '市场：' : 'Market:'}</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-[#339999]"
              >
                <option value="all">{locale === 'zh' ? '所有市场' : 'All Markets'}</option>
                {markets.map(market => (
                  <option key={market.code} value={market.name}>{market.flag_emoji} {market.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{locale === 'zh' ? '时间范围：' : 'Timeframe:'}</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-[#339999]"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Stats */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalProducts}
              </h3>
              <p className="text-gray-600">{locale === 'zh' ? 'PPE产品总数' : 'Total PPE Products'}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalRegulations}
              </h3>
              <p className="text-gray-600">{locale === 'zh' ? '法规与标准' : 'Regulations & Standards'}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalManufacturers}
              </h3>
              <p className="text-gray-600">{locale === 'zh' ? '制造商' : 'Manufacturers'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Distribution */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Package className="w-6 h-6 text-[#339999] mr-3" />
                {locale === 'zh' ? '产品类别分布' : 'Product Category Distribution'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={filteredCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {filteredCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Market Distribution */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Globe className="w-6 h-6 text-[#339999] mr-3" />
                {locale === 'zh' ? '目标市场分布' : 'Target Market Distribution'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredMarketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#339999" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance Complexity */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 text-[#339999] mr-3" />
                {locale === 'zh' ? '各类别合规复杂度' : 'Compliance Complexity by Category'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={complianceComplexityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="EU" fill="#339999" name={locale === 'zh' ? '欧盟要求' : 'EU Requirements'} />
                  <Bar dataKey="US" fill="#2d8b8b" name={locale === 'zh' ? '美国要求' : 'US Requirements'} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline Comparison */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-[#339999] mr-3" />
                {locale === 'zh' ? '认证时间对比（月）' : 'Certification Timeline Comparison (months)'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="EU" fill="#339999" name="EU" />
                  <Bar dataKey="US" fill="#2d8b8b" name="US" />
                  <Bar dataKey="UK" fill="#267d7d" name="UK" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Comparison */}
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-[#339999] mr-3" />
                {locale === 'zh' ? '认证费用对比（千美元）' : 'Certification Cost Comparison (USD thousands)'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="EU" fill="#339999" name="EU" />
                  <Bar dataKey="US" fill="#2d8b8b" name="US" />
                  <Bar dataKey="UK" fill="#267d7d" name="UK" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Tables */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {locale === 'zh' ? '类别详情' : 'Category Details'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '类别' : 'Category'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '产品' : 'Products'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '欧盟时间' : 'EU Timeline'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '欧盟费用' : 'EU Cost'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '美国时间' : 'US Timeline'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '美国费用' : 'US Cost'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategoryData.map((cat, index) => {
                    const euCompliance = getComplianceData(cat.name.toLowerCase().replace(' ', '-'), 'EU')
                    const usCompliance = getComplianceData(cat.name.toLowerCase().replace(' ', '-'), 'US')
                    
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{cat.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {cat.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cat.name_zh}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]">
                            {cat.value}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {euCompliance ? `${euCompliance.estimated_timeline.min}-${euCompliance.estimated_timeline.max} ${euCompliance.estimated_timeline.unit}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {euCompliance ? `$${(euCompliance.estimated_cost.min / 1000).toFixed(1)}K-$${(euCompliance.estimated_cost.max / 1000).toFixed(1)}K` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {usCompliance ? `${usCompliance.estimated_timeline.min}-${usCompliance.estimated_timeline.max} ${usCompliance.estimated_timeline.unit}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {usCompliance ? `$${(usCompliance.estimated_cost.min / 1000).toFixed(1)}K-$${(usCompliance.estimated_cost.max / 1000).toFixed(1)}K` : 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {locale === 'zh' ? '市场详情' : 'Market Details'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '市场' : 'Market'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '产品' : 'Products'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '主要法规' : 'Main Regulation'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {locale === 'zh' ? '认证' : 'Certification'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarketData.map((market, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-3xl mr-3">{market.flag}</span>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {market.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {market.name_zh}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]">
                          {market.value}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {markets.find(m => m.code === market.name)?.regulation_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {(markets.find(m => m.code === market.name) as any)?.certification_name || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
