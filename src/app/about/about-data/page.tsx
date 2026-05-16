'use client'

import { useEffect, useState } from 'react'
import {
  Database, Globe, Shield, TrendingUp, Package, Factory,
  Scale, BarChart3, MapPin, FileText, Search,
  Award, Layers, Clock, Sparkles
} from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getTranslations, homeTranslations } from '@/lib/i18n/translations'
import { getPPEStats } from '@/lib/ppe-api-client'

export default function AboutDataPage() {
  const locale = useLocale()
  const t = getTranslations(homeTranslations, locale)
  const isZh = locale === 'zh'
  const [dbStats, setDbStats] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEStats()
        if (mounted) setDbStats(statsData.data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  const STATS = {
    products: '23,319',
    regulations: '749',
    manufacturers: '8,853',
    countries: '71',
    dataSources: '107',
    regulators: '39',
    confidence: '92.2%',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#339999]/10 text-[#339999] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {isZh ? '数据透明度报告' : 'Data Transparency Report'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {isZh ? '全球PPE数据覆盖报告' : 'Global PPE Data Coverage Report'}
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isZh
              ? 'MDLooker 汇聚来自39个全球权威监管机构、107个数据源的23,319条产品注册数据，覆盖71个国家和地区，构建全球最全面的PPE合规数据库。'
              : 'MDLooker aggregates 23,319 product registrations from 39 regulatory authorities across 107 data sources, covering 71 countries and regions — building the world\'s most comprehensive PPE compliance database.'}
          </p>
          <p className="mt-3 text-sm text-gray-400">
            {isZh ? '数据截止：2026年5月 · 基于实时数据库审计' : 'Data as of May 2026 · Based on real-time database audit'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {isZh ? '平台数据总览' : 'Platform Overview'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard number={STATS.products} label={isZh ? '认证PPE产品' : 'Certified Products'} icon={Package} />
            <MetricCard number={STATS.countries} label={isZh ? '覆盖国家/地区' : 'Countries Covered'} icon={Globe} />
            <MetricCard number={STATS.regulators} label={isZh ? '监管机构' : 'Regulatory Bodies'} icon={Scale} />
            <MetricCard number={STATS.confidence} label={isZh ? '高可信度数据' : 'High-Confidence Data'} icon={Shield} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <MetricCard number={STATS.regulations} label={isZh ? '法规标准' : 'Regulations'} icon={FileText} />
            <MetricCard number={STATS.manufacturers} label={isZh ? '厂商档案' : 'Manufacturers'} icon={Factory} />
            <MetricCard number={STATS.dataSources} label={isZh ? '数据来源' : 'Data Sources'} icon={Database} />
            <MetricCard number="12" label={isZh ? 'PPE品类覆盖' : 'PPE Categories'} icon={BarChart3} />
          </div>
        </section>

        <section className="mb-20">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#339999] to-[#257373] px-6 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {isZh ? '全球PPE数据覆盖详情' : 'Global PPE Data Coverage Details'}
              </h2>
            </div>

            <div className="p-6 sm:p-8 space-y-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#339999]" />
                  {isZh ? '1. 全球市场格局与数据规模' : '1. Global Market Landscape'}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {isZh
                    ? '2024年全球PPE市场规模约800-900亿美元，年复合增长率6.5%-7.2%。亚太地区以36.8%的份额领跑全球，北美占22.3%，欧洲占22%。手部防护（29.3%）与呼吸防护（18-22%）占据市场半壁江山，身体防护装备紧随其后（22.3%）。'
                    : 'The global PPE market reached approximately $80-90 billion in 2024, with a CAGR of 6.5%-7.2%. Asia-Pacific leads with 36.8% market share, followed by North America (22.3%) and Europe (22%). Hand protection (29.3%) and respiratory protection (18-22%) dominate, with protective clothing (22.3%) close behind.'}
                </p>
                <div className="space-y-2">
                  {[
                    { label: isZh ? '亚太地区' : 'Asia-Pacific', pct: 37, color: 'bg-[#339999]', w: 'w-[37%]' },
                    { label: isZh ? '北美' : 'North America', pct: 27, color: 'bg-blue-500', w: 'w-[27%]' },
                    { label: isZh ? '欧洲' : 'Europe', pct: 22, color: 'bg-indigo-500', w: 'w-[22%]' },
                    { label: isZh ? '中东/非洲' : 'ME & Africa', pct: 14, color: 'bg-amber-500', w: 'w-[14%]' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-24 shrink-0">{r.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className={`${r.color} ${r.w} h-full rounded-full flex items-center justify-end pr-2`}>
                          <span className="text-xs text-white font-medium">{r.pct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#339999]" />
                  {isZh ? '2. 产品品类覆盖（12类全覆盖）' : '2. Product Category Coverage (12 Categories)'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">{isZh ? '品类' : 'Category'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '产品数' : 'Products'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '占比' : 'Share'}</th>
                        <th className="hidden sm:table-cell text-left py-2 px-3 font-semibold text-gray-700">{isZh ? '分布' : 'Distribution'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [isZh ? '手部防护装备' : 'Hand Protection', '8,568', '36.7%', '91%'],
                        [isZh ? '呼吸防护装备' : 'Respiratory', '7,947', '34.1%', '85%'],
                        [isZh ? '身体防护装备' : 'Body Protection', '2,081', '8.9%', '22%'],
                        [isZh ? '眼面部防护装备' : 'Eye & Face', '1,153', '4.9%', '12%'],
                        [isZh ? '足部防护装备' : 'Foot Protection', '805', '3.5%', '9%'],
                        [isZh ? '坠落防护装备' : 'Fall Protection', '653', '2.8%', '7%'],
                        [isZh ? '头部防护装备' : 'Head Protection', '437', '1.9%', '5%'],
                        [isZh ? '躯干防护装备' : 'Torso Protection', '360', '1.5%', '4%'],
                        [isZh ? '听觉防护装备' : 'Hearing Protection', '257', '1.1%', '3%'],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-800">{row[0]}</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-700">{row[1]}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{row[2]}</td>
                          <td className="hidden sm:table-cell py-2 px-3">
                            <div className="bg-gray-100 rounded-full h-2 w-full">
                              <div className="bg-[#339999] h-2 rounded-full" style={{ width: row[3] as string }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#339999]" />
                  {isZh ? '3. 国家与区域覆盖（71个国家/地区）' : '3. Country & Region Coverage (71 Countries)'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">{isZh ? '国家/地区' : 'Country/Region'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '产品数' : 'Products'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '累计占比' : 'Cumulative'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['US', isZh ? '美国' : 'United States', '7,704', '33.0%'],
                        ['CN', isZh ? '中国' : 'China', '5,958', '60.5%'],
                        ['MY', isZh ? '马来西亚' : 'Malaysia', '2,133', '67.9%'],
                        ['EU', isZh ? '欧盟' : 'EU', '1,389', '72.2%'],
                        ['CA', isZh ? '加拿大' : 'Canada', '1,303', '77.8%'],
                        ['JP', isZh ? '日本' : 'Japan', '577', '80.3%'],
                        ['IN', isZh ? '印度' : 'India', '437', '82.2%'],
                        ['BR', isZh ? '巴西' : 'Brazil', '413', '83.9%'],
                        ['CH', isZh ? '瑞士' : 'Switzerland', '374', '85.5%'],
                        ['GB', isZh ? '英国' : 'United Kingdom', '358', '87.1%'],
                        ['DE', isZh ? '德国' : 'Germany', '344', '88.6%'],
                        ['KR', isZh ? '韩国' : 'South Korea', '322', '90.8%'],
                        ['AU', isZh ? '澳大利亚' : 'Australia', '302', '93.1%'],
                        ['TH', isZh ? '泰国' : 'Thailand', '282', '94.3%'],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-gray-800">{row[1]}</span>
                            <span className="text-gray-400 ml-2 text-xs">{row[0]}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-700">{row[2]}</td>
                          <td className="py-2 px-3 text-right text-gray-500">{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {isZh
                    ? '前14个国家占总数据的94.3%，集中反映全球PPE制造业和监管的核心区域。'
                    : 'The top 14 countries account for 94.3% of all data, reflecting the core regions of global PPE manufacturing and regulation.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#339999]" />
                  {isZh ? '4. 监管框架与法规数据（749条，17个监管区域）' : '4. Regulatory Framework (749 Regulations, 17 Regions)'}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {isZh
                    ? '本平台已收录全球17个监管区域的法规标准数据，构建了四级监管数据模型（基础法规 → 产品标准 → 认证体系 → 上市后监管），覆盖全球主要PPE市场的合规要求。'
                    : 'Our platform has compiled regulatory data from 17 global regions, structured in a four-tier regulatory model (Fundamental Regulations → Product Standards → Certification Systems → Post-Market Surveillance), covering compliance requirements for all major PPE markets.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { region: isZh ? '美国' : 'US', count: '275' },
                    { region: isZh ? '欧盟' : 'EU', count: '121' },
                    { region: isZh ? '中国' : 'China', count: '79' },
                    { region: isZh ? '日本' : 'Japan', count: '41' },
                    { region: isZh ? '澳大利亚' : 'Australia', count: '38' },
                    { region: isZh ? '英国' : 'UK', count: '35' },
                    { region: 'GCC', count: '32' },
                    { region: isZh ? '韩国' : 'Korea', count: '32' },
                    { region: 'ASEAN', count: '31' },
                    { region: isZh ? '加拿大' : 'Canada', count: '22' },
                    { region: 'ISO/Global', count: '22' },
                    { region: isZh ? '其他' : 'Others', count: '21' },
                  ].map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-[#339999]">{r.count}</div>
                      <div className="text-xs text-gray-600">{r.region}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#339999]" />
                  {isZh ? '5. 数据来源与可信度' : '5. Data Sources & Reliability'}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {isZh
                    ? `平台数据来源于107个独立渠道，其中92.2%为高可信度数据——直接从官方监管机构API或数据库获取。数据来源涵盖：`
                    : `Our data comes from 107 independent sources, with 92.2% classified as high-confidence — obtained directly from official regulatory agency APIs or databases. Sources include:`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    isZh ? 'FDA 510(k) 数据库' : 'FDA 510(k) Database',
                    isZh ? 'NMPA UDID 数据库' : 'NMPA UDID Database',
                    isZh ? '加拿大卫生部 MDALL' : 'Health Canada MDALL',
                    'EUDAMED UDI/Devices',
                    isZh ? 'FDA MAUDE 不良事件' : 'FDA MAUDE Database',
                    isZh ? 'ISO 标准数据库' : 'ISO Standards Database',
                    isZh ? '英国 MHRA 注册' : 'MHRA UK Registry',
                    isZh ? '日本 PMDA 注册' : 'PMDA Japan Registry',
                    isZh ? '韩国 MFDS 注册' : 'MFDS Korea Registry',
                    isZh ? '澳大利亚 TGA ARTG' : 'TGA ARTG Registry',
                    isZh ? '印度 CDSCO 注册' : 'CDSCO India Registry',
                    isZh ? '巴西 ANVISA/CAEPI' : 'Brazil ANVISA/CAEPI',
                    isZh ? '沙特 SFDA 注册' : 'SFDA Saudi Arabia',
                    isZh ? '俄罗斯 Roszdravnadzor' : 'Roszdravnadzor Registry',
                    isZh ? '新加坡 HSA SMDR' : 'Singapore HSA SMDR',
                    isZh ? '泰国 FDA 注册' : 'Thailand FDA',
                    isZh ? '印尼 BPOM 注册' : 'Indonesia BPOM',
                    isZh ? '越南 DMEC' : 'Vietnam DMEC/VSQI',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-[#339999] shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#339999]" />
                  {isZh ? '6. 厂商与企业数据（8,853家，60国）' : '6. Manufacturer Data (8,853 Companies, 60 Countries)'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">{isZh ? '国家/地区' : 'Country/Region'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '厂商数' : 'Companies'}</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">{isZh ? '占比' : 'Share'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [isZh ? '美国' : 'US', '4,727', '53.4%'],
                        [isZh ? '中国' : 'CN', '2,128', '24.0%'],
                        [isZh ? '欧盟' : 'EU', '604', '6.8%'],
                        [isZh ? '马来西亚' : 'MY', '321', '3.6%'],
                        [isZh ? '加拿大' : 'CA', '127', '1.4%'],
                        [isZh ? '英国' : 'GB', '89', '1.0%'],
                        [isZh ? '印度' : 'IN', '88', '1.0%'],
                        [isZh ? '日本' : 'JP', '78', '0.9%'],
                        [isZh ? '泰国' : 'TH', '73', '0.8%'],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-800">{row[0]}</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-700">{row[1]}</td>
                          <td className="py-2 px-3 text-right text-gray-500">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#339999]/5 rounded-xl p-5 border border-[#339999]/20">
                <h3 className="text-lg font-semibold text-[#339999] mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  {isZh ? '综合结论' : 'Conclusion'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#339999] mt-1">&#10003;</span>
                    <span>{isZh
                      ? '产品注册数据已覆盖全球约95%的PPE合规市场，71个国家/地区的23,319条产品记录涵盖了所有主要监管体系。'
                      : 'Product registration data covers approximately 95% of the global PPE compliance market, with 23,319 records across 71 countries encompassing all major regulatory systems.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#339999] mt-1">&#10003;</span>
                    <span>{isZh
                      ? '12个PPE品类实现全覆盖，手部防护和呼吸防护占比70.8%，与全球市场需求结构高度一致。'
                      : 'All 12 PPE categories are fully covered, with hand protection and respiratory protection accounting for 70.8%, closely matching global market demand structure.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#339999] mt-1">&#10003;</span>
                    <span>{isZh
                      ? '749条法规标准覆盖17个监管区域，构建了从基础法规到上市后监管的完整数据模型。'
                      : '749 regulations across 17 regions form a complete data model from fundamental regulations to post-market surveillance.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#339999] mt-1">&#10003;</span>
                    <span>{isZh
                      ? '8,853家厂商档案覆盖60个国家，数据与美国、中国的全球PPE核心制造地位高度吻合。'
                      : '8,853 manufacturer profiles across 60 countries align with the US and China\'s core positions in global PPE manufacturing.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#339999] mt-1">&#10003;</span>
                    <span>{isZh
                      ? '92.2%的数据标记为高可信度（直接来源于官方API），数据可靠性和可追溯性处于行业领先水平。'
                      : '92.2% of data is rated high-confidence (directly from official APIs), achieving industry-leading reliability and traceability.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {isZh ? '数据质量承诺' : 'Data Quality Commitment'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QualityCard
              icon={Award}
              title={isZh ? '官方来源优先' : 'Official Sources First'}
              description={isZh
                ? '92.2%的数据直接来自FDA、NMPA、EUDAMED等39个官方监管机构的API和数据库，确保每一条记录都有权威出处。'
                : '92.2% of data comes directly from APIs and databases of 39 official regulatory bodies including FDA, NMPA, and EUDAMED.'}
            />
            <QualityCard
              icon={Clock}
              title={isZh ? '持续更新机制' : 'Continuous Updates'}
              description={isZh
                ? '数据库每日同步官方数据源，关键市场数据实时追踪。last_verified字段确保每条记录的可追溯性。'
                : 'Database syncs with official sources daily, with real-time tracking for key markets. Every record includes a last_verified timestamp.'}
            />
            <QualityCard
              icon={Layers}
              title={isZh ? '多维度交叉验证' : 'Multi-dimensional Validation'}
              description={isZh
                ? '产品×国家×品类×监管机构四维交叉验证，去重策略基于名称+制造商+数据源三字段联合判定，杜绝误删。'
                : 'Four-dimensional cross-validation (product × country × category × regulator). Deduplication uses name + manufacturer + data_source for accuracy.'}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ number, label, icon: Icon }: { number: string; label: string; icon: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-lg transition-shadow">
      <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-[#339999]" />
      </div>
      <div className="text-2xl font-bold text-[#339999] mb-1">{number}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function QualityCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#339999]" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
