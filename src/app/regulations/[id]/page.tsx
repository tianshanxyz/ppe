'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Building2,
  Loader2,
  Scale,
  Sparkles,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Badge, StatusBadge, Skeleton } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/config'
import { FavoriteButton } from '@/components/FavoriteButton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegulationData {
  id: string
  category_id: string
  market_code: string
  title: string
  title_zh?: string
  regulation_number: string
  document_type: string
  issuing_authority: string
  effective_date: string
  status: string
  summary: string
  summary_zh?: string
  full_text: string
}

interface RelatedRegulation {
  id: string
  title: string
  title_zh?: string
  regulation_number: string
  document_type: string
  market_code: string
  status: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MARKET_LABELS_EN: Record<string, { label: string; flag: string }> = {
  EU: { label: 'European Union', flag: 'EU' },
  US: { label: 'United States', flag: 'US' },
  CN: { label: 'China', flag: 'CN' },
  UK: { label: 'United Kingdom', flag: 'UK' },
  JP: { label: 'Japan', flag: 'JP' },
  AU: { label: 'Australia', flag: 'AU' },
  KR: { label: 'South Korea', flag: 'KR' },
}

const MARKET_LABELS_ZH: Record<string, { label: string; flag: string }> = {
  EU: { label: '欧盟', flag: 'EU' },
  US: { label: '美国', flag: 'US' },
  CN: { label: '中国', flag: 'CN' },
  UK: { label: '英国', flag: 'UK' },
  JP: { label: '日本', flag: 'JP' },
  AU: { label: '澳大利亚', flag: 'AU' },
  KR: { label: '韩国', flag: 'KR' },
}

const DOCUMENT_TYPE_LABELS_EN: Record<string, string> = {
  regulation: 'Regulation', standard: 'Standard', guidance: 'Guidance', directive: 'Directive', law: 'Law',
}

const DOCUMENT_TYPE_LABELS_ZH: Record<string, string> = {
  regulation: '法规', standard: '标准', guidance: '指南', directive: '指令', law: '法律',
}

function getMarketInfo(code: string, locale: Locale) {
  const map = locale === 'zh' ? MARKET_LABELS_ZH : MARKET_LABELS_EN
  return map[code] ?? { label: code, flag: code }
}

function getDocTypeLabel(type: string, locale: Locale) {
  const map = locale === 'zh' ? DOCUMENT_TYPE_LABELS_ZH : DOCUMENT_TYPE_LABELS_EN
  return map[type] ?? type
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegulationDetailPage() {
  const params = useParams()
  const id = (params as Record<string, string>).id as string
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)

  // ---- state ----
  const [regulation, setRegulation] = useState<RegulationData | null>(null)
  const [related, setRelated] = useState<RelatedRegulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI-generated content
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)

  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null)
  const [aiInterpretationLoading, setAiInterpretationLoading] = useState(false)
  const [aiInterpretationError, setAiInterpretationError] = useState<string | null>(null)

  // ---- fetch regulation data ----
  useEffect(() => {
    if (!id) return

    const fetchRegulation = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/regulations/${encodeURIComponent(id)}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Regulation not found')
          throw new Error('Failed to fetch regulation data')
        }

        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'Unknown error')

        setRegulation(json.data)
        setRelated(json.related ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRegulation()
  }, [id])

  // ---- fetch AI summary ----
  useEffect(() => {
    if (!regulation) return

    const fetchAiSummary = async () => {
      setAiSummaryLoading(true)
      setAiSummaryError(null)
      try {
        const res = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Summarize the key points of ${regulation.title} in under 100 characters. Be concise and factual.`,
          }),
        })
        if (!res.ok) throw new Error('AI summary request failed')
        const json = await res.json()
        setAiSummary(json.answer ?? '')
      } catch (err) {
        setAiSummaryError(err instanceof Error ? err.message : 'Failed to generate summary')
        // Fallback to the stored summary
        setAiSummary(regulation.summary_zh || regulation.summary)
      } finally {
        setAiSummaryLoading(false)
      }
    }

    fetchAiSummary()
  }, [regulation])

  // ---- fetch AI interpretation ----
  useEffect(() => {
    if (!regulation) return

    const fetchAiInterpretation = async () => {
      setAiInterpretationLoading(true)
      setAiInterpretationError(null)
      try {
        const res = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Provide a detailed interpretation of the main requirements of ${regulation.title}. Extract and explain the key compliance obligations, testing requirements, and certification steps. Structure the response with clear headings.`,
          }),
        })
        if (!res.ok) throw new Error('AI interpretation request failed')
        const json = await res.json()
        setAiInterpretation(json.answer ?? '')
      } catch (err) {
        setAiInterpretationError(
          err instanceof Error ? err.message : 'Failed to generate interpretation'
        )
      } finally {
        setAiInterpretationLoading(false)
      }
    }

    fetchAiInterpretation()
  }, [regulation])

  // =========================================================================
  // Loading state
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#339999] mx-auto mb-4" />
          <p className="text-gray-500">{t.loadingRegulations}</p>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Error state
  // =========================================================================
  if (error || !regulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error === 'Regulation not found' ? (locale === 'zh' ? '未找到法规' : 'Regulation Not Found') : t.error}
          </h2>
          <p className="text-gray-500 mb-6">{error ?? (locale === 'zh' ? '无法找到请求的法规。' : 'The requested regulation could not be found.')}</p>
          <Link
            href="/regulations-new"
            className="inline-flex items-center gap-2 text-[#339999] hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToRegulations}
          </Link>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Derived data
  // =========================================================================
  const marketInfo = getMarketInfo(regulation.market_code, locale)
  const docTypeLabel = getDocTypeLabel(regulation.document_type, locale)

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back link */}
          <Link
            href="/regulations-new"
            className="text-[#339999] hover:underline mb-4 flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToRegulations}
          </Link>

          {/* Title row */}
          <div className="flex items-start gap-4 mt-2">
            <div className="flex-shrink-0 w-14 h-14 bg-[#339999]/10 rounded-xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-[#339999]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="primary" size="sm" className="bg-[#339999]/10 text-[#339999]">
                  {docTypeLabel}
                </Badge>
                <Badge variant="outline" size="sm">
                  <Globe className="w-3 h-3 mr-1" />
                  {marketInfo.flag} {marketInfo.label}
                </Badge>
                <StatusBadge
                  status={regulation.status === 'active' ? 'active' : 'inactive'}
                  text={regulation.status === 'active' ? t.active : regulation.status}
                />
              </div>
              <div className="flex items-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {locale === 'zh' && regulation.title_zh ? regulation.title_zh : regulation.title}
                </h1>
                <FavoriteButton
                  id={regulation.id}
                  type="regulation"
                  title={locale === 'zh' && regulation.title_zh ? regulation.title_zh : regulation.title}
                  url={`/regulations/${regulation.id}`}
                  locale={locale}
                />
              </div>
              {locale === 'zh' && regulation.title_zh && (
                <p className="mt-1 text-gray-400 text-sm">{regulation.title}</p>
              )}
              {locale === 'en' && regulation.title_zh && (
                <p className="mt-1 text-gray-500 text-sm">{regulation.title_zh}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{t.regulationNumber}:</span>
              <span className="font-medium text-gray-900">{regulation.regulation_number}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{t.issuingAuthority}:</span>
              <span className="font-medium text-gray-900">{regulation.issuing_authority}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{t.effectiveDate}:</span>
              <span className="font-medium text-gray-900">{regulation.effective_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Main content                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* ----------------------------------------------------------- */}
            {/* AI Summary Section                                          */}
            {/* ----------------------------------------------------------- */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#339999]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{locale === 'zh' ? 'AI摘要' : 'AI Summary'}</h2>
                {aiSummaryLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#339999] ml-1" />
                )}
              </div>

              {aiSummaryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : aiSummaryError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  {locale === 'zh' ? 'AI摘要暂不可用，显示存储的摘要。' : 'AI summary unavailable. Showing stored summary instead.'}
                </div>
              ) : null}

              {aiSummary && !aiSummaryLoading && (
                <p className="text-gray-700 leading-relaxed">
                  {aiSummary.length > 100
                    ? aiSummary.substring(0, 100) + '...'
                    : aiSummary}
                </p>
              )}

              {!aiSummaryLoading && !aiSummary && !aiSummaryError && (
                <p className="text-gray-500 italic">{locale === 'zh' ? '暂无摘要。' : 'No summary available.'}</p>
              )}
            </section>

            {/* ----------------------------------------------------------- */}
            {/* AI Interpretation Section                                   */}
            {/* ----------------------------------------------------------- */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#339999]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{locale === 'zh' ? 'AI解读' : 'AI Interpretation'}</h2>
                {aiInterpretationLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#339999] ml-1" />
                )}
              </div>

              {aiInterpretationLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : aiInterpretationError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  {locale === 'zh' ? 'AI解读暂不可用，请稍后重试。' : 'AI interpretation is currently unavailable. Please try again later.'}
                </div>
              ) : aiInterpretation ? (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {aiInterpretation.split('\n').map((line, idx) => {
                    // Simple markdown-like rendering
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={idx} className="text-base font-bold text-gray-900 mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h3>
                      )
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h4 key={idx} className="text-sm font-bold text-gray-900 mt-3 mb-1">
                          {line.replace('### ', '')}
                        </h4>
                      )
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <li key={idx} className="ml-4 text-gray-700">
                          {line.replace(/^[-*]\s/, '')}
                        </li>
                      )
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <p key={idx} className="font-semibold text-gray-900 mt-2">
                          {line.replace(/\*\*/g, '')}
                        </p>
                      )
                    }
                    if (line.trim() === '') {
                      return <br key={idx} />
                    }
                    return (
                      <p key={idx} className="text-gray-700">
                        {line}
                      </p>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">{locale === 'zh' ? '暂无解读。' : 'No interpretation available.'}</p>
              )}
            </section>

            {/* ----------------------------------------------------------- */}
            {/* Full Text Link                                              */}
            {/* ----------------------------------------------------------- */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#339999]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{t.fullText}</h2>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {locale === 'zh'
                  ? `查看由${regulation.issuing_authority}发布的${regulation.regulation_number}完整文本。`
                  : `View the complete text of ${regulation.regulation_number} as published by ${regulation.issuing_authority}.`
                }
              </p>

              <a
                href={`#${regulation.id}-fulltext`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors font-medium text-sm"
              >
                <BookOpen className="w-4 h-4" />
                {locale === 'zh' ? '查看全文' : 'View Full Text'}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Full text content (collapsible anchor target) */}
              <div id={`${regulation.id}-fulltext`} className="mt-6 pt-6 border-t border-gray-200">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {regulation.full_text.split('\n').map((line, idx) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={idx} className="text-base font-bold text-gray-900 mt-5 mb-2">
                          {line.replace('## ', '')}
                        </h3>
                      )
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h4 key={idx} className="text-sm font-bold text-gray-900 mt-3 mb-1">
                          {line.replace('### ', '')}
                        </h4>
                      )
                    }
                    if (line.startsWith('#### ')) {
                      return (
                        <h5 key={idx} className="text-sm font-semibold text-gray-800 mt-2 mb-1">
                          {line.replace('#### ', '')}
                        </h5>
                      )
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <li key={idx} className="ml-4 text-gray-700">
                          {line.replace(/^[-*]\s/, '')}
                        </li>
                      )
                    }
                    if (line.trim() === '') {
                      return <div key={idx} className="h-2" />
                    }
                    return (
                      <p key={idx} className="text-gray-700 mb-1">
                        {line}
                      </p>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right column - sidebar */}
          <div className="space-y-6">
            {/* ----------------------------------------------------------- */}
            {/* Regulation Quick Facts                                      */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#339999]" />
                {locale === 'zh' ? '快速概览' : 'Quick Facts'}
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.regulationNumber}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {regulation.regulation_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.documentType}
                  </dt>
                  <dd className="font-semibold text-gray-900">{docTypeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.marketCode}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {marketInfo.flag} {marketInfo.label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.issuingAuthority}
                  </dt>
                  <dd className="font-semibold text-gray-900 text-sm">
                    {regulation.issuing_authority}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.effectiveDate}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {regulation.effective_date}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t.status}</dt>
                  <dd>
                    <StatusBadge
                      status={regulation.status === 'active' ? 'active' : 'inactive'}
                      text={regulation.status === 'active' ? t.active : regulation.status}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t.category}
                  </dt>
                  <dd className="font-semibold text-gray-900 capitalize">
                    {regulation.category_id.replace(/-/g, ' ')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Related Regulations                                         */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#339999]" />
                {locale === 'zh' ? '相关法规' : 'Related Regulations'}
                <Badge variant="gray" size="sm">
                  {marketInfo.flag}
                </Badge>
              </h3>

              {related.length > 0 ? (
                <ul className="space-y-3">
                  {related.map((rel) => (
                    <li key={rel.id}>
                      <Link
                        href={`/regulations/${rel.id}`}
                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#339999] transition-colors line-clamp-2">
                              {locale === 'zh' && rel.title_zh ? rel.title_zh : rel.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {rel.regulation_number}
                              </span>
                              <Badge variant="gray" size="sm">
                                {getDocTypeLabel(rel.document_type, locale)}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1 group-hover:text-[#339999] transition-colors" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No related regulations found for this market.
                </p>
              )}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Help CTA                                                    */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Need Compliance Help?
              </h3>
              <p className="text-sm text-white/90 mb-4">
                Our experts can guide you through the requirements of{' '}
                {regulation.regulation_number}.
              </p>
              <Link
                href="/search"
                className="block w-full text-center px-4 py-2.5 bg-white text-[#339999] rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Search Regulations
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Footer note                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="border-t border-gray-200 bg-gray-50 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Data sourced from official regulatory databases. AI-generated content (Summary and
              Interpretation) is for reference only and should not be considered legal advice.
              Always consult the original regulation text and qualified compliance professionals
              for authoritative guidance. Last data update: {regulation.effective_date}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
