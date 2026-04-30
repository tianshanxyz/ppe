'use client'

import { useState, useMemo } from 'react'
import { FileText, Calendar, Clock, Tag, Filter, Search, ArrowRight, Globe, User } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getTranslations } from '@/lib/i18n/translations'
import { marketReports, reportCategories, reportRegions, MarketReport } from '@/lib/data/market-reports'

const reportTranslations = {
  en: {
    marketReports: 'Market Research Reports',
    comprehensiveAnalysis: 'Comprehensive analysis and insights into global PPE markets, regulations, and compliance trends',
    searchReports: 'Search reports...',
    allCategories: 'All Categories',
    allRegions: 'All Regions',
    filterByCategory: 'Filter by Category',
    filterByRegion: 'Filter by Region',
    showing: 'Showing',
    of: 'of',
    reports: 'reports',
    readMore: 'Read More',
    noReportsFound: 'No reports found',
    tryAdjustingFilters: 'Try adjusting your search or filters',
    published: 'Published',
    author: 'Author',
    readTime: 'Read Time',
    tags: 'Tags',
    region: 'Region',
    category: 'Category',
  },
  zh: {
    marketReports: '市场研究报告',
    comprehensiveAnalysis: '全球PPE市场、法规和合规趋势的综合分析和洞察',
    searchReports: '搜索报告...',
    allCategories: '所有类别',
    allRegions: '所有地区',
    filterByCategory: '按类别筛选',
    filterByRegion: '按地区筛选',
    showing: '显示',
    of: '共',
    reports: '报告',
    readMore: '阅读更多',
    noReportsFound: '未找到报告',
    tryAdjustingFilters: '尝试调整搜索或筛选条件',
    published: '发布日期',
    author: '作者',
    readTime: '阅读时间',
    tags: '标签',
    region: '地区',
    category: '类别',
  }
}

export default function MarketReportsPage() {
  const locale = useLocale()
  const t = getTranslations(reportTranslations, locale)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState('All')

  const filteredReports = useMemo(() => {
    return marketReports.filter((report: MarketReport) => {
      const matchesSearch = !searchQuery ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.title_zh.includes(searchQuery) ||
        report.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.summary_zh.includes(searchQuery) ||
        report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory
      const matchesRegion = selectedRegion === 'All' || report.region === selectedRegion

      return matchesSearch && matchesCategory && matchesRegion
    })
  }, [searchQuery, selectedCategory, selectedRegion])

  const displayTitle = (report: MarketReport) => locale === 'zh' ? report.title_zh : report.title
  const displaySummary = (report: MarketReport) => locale === 'zh' ? report.summary_zh : report.summary
  const displayCategory = (report: MarketReport) => locale === 'zh' ? report.category_zh : report.category
  const displayRegion = (report: MarketReport) => locale === 'zh' ? report.region_zh : report.region

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <FileText className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t.marketReports}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.comprehensiveAnalysis}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchReports}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent appearance-none bg-white"
              >
                {reportCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? t.allCategories : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent appearance-none bg-white"
              >
                {reportRegions.map(region => (
                  <option key={region} value={region}>
                    {region === 'All' ? t.allRegions : region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            {t.showing} {filteredReports.length} {t.of} {marketReports.length} {t.reports}
          </div>
        </div>
      </section>

      {/* Reports Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredReports.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noReportsFound}</h3>
              <p className="text-gray-600">{t.tryAdjustingFilters}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/market-analysis/reports/${report.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex items-center px-3 py-1 bg-[#339999]/10 text-[#339999] text-sm font-medium rounded-full">
                      {displayCategory(report)}
                    </div>
                    <span className="text-sm text-gray-500">{displayRegion(report)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#339999] transition-colors line-clamp-2">
                    {displayTitle(report)}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {displaySummary(report)}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {report.publishDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {report.readTime}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{report.author}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-[#339999] font-medium text-sm group-hover:underline">
                    {t.readMore}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}