'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Tag, TrendingUp, TrendingDown, Minus, FileText, CheckCircle, BookOpen, ExternalLink } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getTranslations } from '@/lib/i18n/translations'
import { getMarketReportById, MarketReport } from '@/lib/data/market-reports'

const detailTranslations = {
  en: {
    backToReports: 'Back to Reports',
    published: 'Published',
    readTime: 'Read Time',
    author: 'Author',
    tags: 'Tags',
    overview: 'Overview',
    keyFindings: 'Key Findings',
    marketData: 'Market Data',
    recommendations: 'Recommendations',
    sources: 'Sources',
    reportNotFound: 'Report Not Found',
    reportNotFoundDesc: 'The report you are looking for does not exist or has been removed.',
    browseOtherReports: 'Browse Other Reports',
  },
  zh: {
    backToReports: '返回报告列表',
    published: '发布日期',
    readTime: '阅读时间',
    author: '作者',
    tags: '标签',
    overview: '概述',
    keyFindings: '关键发现',
    marketData: '市场数据',
    recommendations: '建议',
    sources: '来源',
    reportNotFound: '报告未找到',
    reportNotFoundDesc: '您查找的报告不存在或已被移除。',
    browseOtherReports: '浏览其他报告',
  }
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />
  if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />
  return <Minus className="w-5 h-5 text-gray-400" />
}

export default function ReportDetailPage() {
  const params = useParams()
  const locale = useLocale()
  const t = getTranslations(detailTranslations, locale)

  const reportId = params.id as string
  const report: MarketReport | undefined = getMarketReportById(reportId)

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.reportNotFound}</h1>
          <p className="text-gray-600 mb-6">{t.reportNotFoundDesc}</p>
          <Link
            href="/market-analysis/reports"
            className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t.browseOtherReports}
          </Link>
        </div>
      </div>
    )
  }

  const title = locale === 'zh' ? report.title_zh : report.title
  const summary = locale === 'zh' ? report.summary_zh : report.summary
  const overview = locale === 'zh' ? report.content.overview_zh : report.content.overview
  const keyFindings = locale === 'zh' ? report.content.keyFindings_zh : report.content.keyFindings
  const recommendations = locale === 'zh' ? report.content.recommendations_zh : report.content.recommendations
  const category = locale === 'zh' ? report.category_zh : report.category
  const region = locale === 'zh' ? report.region_zh : report.region

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/market-analysis/reports"
            className="inline-flex items-center text-[#339999] hover:underline mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            {t.backToReports}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-[#339999]/10 text-[#339999] text-sm font-medium rounded-full">
              {category}
            </span>
            <span className="text-sm text-gray-500">{region}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            {summary}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t.published}: {report.publishDate}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t.readTime}: {report.readTime}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t.author}: {report.author}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {report.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-[#339999]" />
                <h2 className="text-2xl font-bold text-gray-900">{t.overview}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {overview}
              </p>
            </div>

            {/* Key Findings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-[#339999]" />
                <h2 className="text-2xl font-bold text-gray-900">{t.keyFindings}</h2>
              </div>
              <ul className="space-y-4">
                {keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#339999]/10 text-[#339999] rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed pt-1">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Market Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[#339999]" />
                <h2 className="text-2xl font-bold text-gray-900">{t.marketData}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {report.content.marketData.map((data, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">{data.label}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">{data.value}</div>
                      {data.trend && <TrendIcon trend={data.trend} />}
                    </div>
                    {data.change && (
                      <div className="text-sm text-gray-500 mt-1">{data.change}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-[#339999]" />
                <h2 className="text-2xl font-bold text-gray-900">{t.recommendations}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 bg-gradient-to-br from-[#339999]/5 to-white rounded-lg p-4 border border-[#339999]/20">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#339999] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <ExternalLink className="w-6 h-6 text-[#339999]" />
                <h2 className="text-2xl font-bold text-gray-900">{t.sources}</h2>
              </div>
              <ul className="space-y-3">
                {report.content.sources.map((source, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-[#339999] mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{source}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
