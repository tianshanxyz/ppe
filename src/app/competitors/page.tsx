'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Building, TrendingUp, Award, Target, Users, Globe, Trophy, Zap } from 'lucide-react'
import { getCompetitors } from '@/lib/ppe-database-client'

const COLORS = ['#339999', '#2d8b8b', '#267a7a', '#1f6969', '#185858']

export default function CompetitorAnalysisPage() {
  const [competitors, setCompetitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 示例竞争对手数据（因为数据库目前可能为空）
  const sampleCompetitors = [
    {
      id: '1',
      company_name: '3M Company',
      company_name_en: '3M Company',
      company_name_zh: '3M 公司',
      country: 'United States',
      business_type: 'manufacturer',
      market_share: {
        global: 15.2,
        us: 25.5,
        eu: 12.3,
        asia: 10.8,
      },
      product_categories: ['Respiratory Protection', 'Eye Protection', 'Hearing Protection', 'Hand Protection'],
      key_markets: ['US', 'EU', 'CN', 'JP'],
      strengths: ['Strong brand recognition', 'Extensive R&D capabilities', 'Global distribution network', 'Diverse product portfolio'],
      weaknesses: ['Higher price point', 'Complex organizational structure'],
      revenue: '$35.4B',
      employees: '95,000+',
      founded: '1902',
    },
    {
      id: '2',
      company_name: 'Honeywell International',
      company_name_en: 'Honeywell International Inc.',
      company_name_zh: '霍尼韦尔国际公司',
      country: 'United States',
      business_type: 'manufacturer',
      market_share: {
        global: 12.8,
        us: 20.3,
        eu: 10.5,
        asia: 9.2,
      },
      product_categories: ['Respiratory Protection', 'Hand Protection', 'Fall Protection', 'Gas Detection'],
      key_markets: ['US', 'EU', 'IN', 'CN'],
      strengths: ['Technology leadership', 'Strong safety focus', 'Integrated solutions', 'Global presence'],
      weaknesses: ['Limited consumer presence', 'Dependency on industrial sector'],
      revenue: '$35.5B',
      employees: '97,000+',
      founded: '1906',
    },
    {
      id: '3',
      company_name: 'DuPont',
      company_name_en: 'E. I. du Pont de Nemours and Company',
      company_name_zh: '杜邦公司',
      country: 'United States',
      business_type: 'manufacturer',
      market_share: {
        global: 10.5,
        us: 18.2,
        eu: 8.9,
        asia: 7.5,
      },
      product_categories: ['Protective Clothing', 'Chemical Protection', 'Thermal Protection', 'Cleanroom'],
      key_markets: ['US', 'EU', 'CN', 'BR'],
      strengths: ['Material science expertise', 'Tyvek brand strength', 'Innovation leadership', 'Quality reputation'],
      weaknesses: ['Premium pricing', 'Limited product range'],
      revenue: '$20.4B',
      employees: '23,000+',
      founded: '1802',
    },
    {
      id: '4',
      company_name: 'Ansell Limited',
      company_name_en: 'Ansell Limited',
      company_name_zh: '安思尔有限公司',
      country: 'Australia',
      business_type: 'manufacturer',
      market_share: {
        global: 8.3,
        us: 12.5,
        eu: 7.8,
        asia: 15.2,
      },
      product_categories: ['Hand Protection', 'Protective Clothing', 'Respiratory Protection'],
      key_markets: ['AU', 'US', 'EU', 'CN'],
      strengths: ['Glove specialization', 'Healthcare focus', 'Asian market presence', 'Innovation in materials'],
      weaknesses: ['Limited diversification', 'Currency exposure'],
      revenue: '$1.4B',
      employees: '16,000+',
      founded: '1905',
    },
    {
      id: '5',
      company_name: 'Kimberly-Clark',
      company_name_en: 'Kimberly-Clark Corporation',
      company_name_zh: '金佰利公司',
      country: 'United States',
      business_type: 'manufacturer',
      market_share: {
        global: 7.2,
        us: 15.8,
        eu: 5.5,
        asia: 6.8,
      },
      product_categories: ['Personal Protective Equipment', 'Medical Supplies', 'Cleanroom'],
      key_markets: ['US', 'EU', 'LA', 'APAC'],
      strengths: ['Consumer brand strength', 'Distribution network', 'Product quality', 'Sustainability focus'],
      weaknesses: ['Competitive market', 'Raw material costs'],
      revenue: '$20.2B',
      employees: '45,000+',
      founded: '1872',
    },
  ]

  useEffect(() => {
    loadCompetitors()
  }, [])

  async function loadCompetitors() {
    try {
      const data = await getCompetitors()
      // 如果数据库没有数据，使用示例数据
      setCompetitors(data.length > 0 ? data : sampleCompetitors)
    } catch (error) {
      console.error('加载竞争对手数据失败:', error)
      setCompetitors(sampleCompetitors)
    } finally {
      setLoading(false)
    }
  }

  // 准备市场份额数据
  const marketShareData = competitors.map(comp => ({
    name: comp.company_name.split(' ')[0],
    global: comp.market_share?.global || 0,
    us: comp.market_share?.us || 0,
    eu: comp.market_share?.eu || 0,
    asia: comp.market_share?.asia || 0,
  }))

  // 准备产品类别雷达图数据
  const categoryData = competitors.slice(0, 3).map((comp, index) => ({
    subject: comp.company_name.split(' ')[0],
    'Respiratory': comp.product_categories?.includes('Respiratory Protection') ? 100 : 0,
    'Hand': comp.product_categories?.includes('Hand Protection') ? 100 : 0,
    'Eye': comp.product_categories?.includes('Eye Protection') ? 100 : 0,
    'Clothing': comp.product_categories?.includes('Protective Clothing') ? 100 : 0,
    'Medical': comp.product_categories?.includes('Medical Supplies') ? 100 : 0,
    fullMark: 100,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
          <p className="mt-4 text-gray-600">Loading competitor analysis...</p>
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
                <Target className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Competitive Landscape Analysis
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analysis of key players in the global PPE market
            </p>
          </div>
        </div>
      </section>

      {/* Market Share Chart */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-[#339999] mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Global Market Share by Region</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={marketShareData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="global" name="Global" fill="#339999" />
                <Bar dataKey="us" name="US Market" fill="#2d8b8b" />
                <Bar dataKey="eu" name="EU Market" fill="#267a7a" />
                <Bar dataKey="asia" name="Asia Market" fill="#1f6969" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Category Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-[#339999] mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Product Category Coverage</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {competitors.slice(0, 3).map((comp, index) => (
                  <Radar
                    key={comp.id}
                    name={comp.company_name.split(' ')[0]}
                    dataKey={comp.company_name.split(' ')[0]}
                    stroke={COLORS[index]}
                    fill={COLORS[index]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Competitor Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {competitors.map((competitor, index) => (
              <div
                key={competitor.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {competitor.company_name}
                    </h3>
                    {competitor.company_name_zh && (
                      <p className="text-gray-600">{competitor.company_name_zh}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#339999]">
                      #{index + 1}
                    </div>
                    <div className="text-sm text-gray-500">Ranking</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Headquarters</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {competitor.country}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Business Type</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 capitalize">
                      {competitor.business_type}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Employees</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {competitor.employees || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Award className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Revenue</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {competitor.revenue || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Product Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {competitor.product_categories?.map((category: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Trophy className="w-5 h-5 text-green-500 mr-2" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {competitor.strengths?.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Zap className="w-5 h-5 text-orange-500 mr-2" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {competitor.weaknesses?.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Markets
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {competitor.key_markets?.map((market: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                      >
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
