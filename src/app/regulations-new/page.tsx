'use client'

import { useState, useEffect, useCallback } from 'react'
import { Scale, Search, Filter, Globe, ChevronLeft, ChevronRight, ExternalLink, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/config'

interface Regulation {
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

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const regionNamesEN: Record<string, string> = {
  EU: 'European Union', US: 'United States', CN: 'China', GB: 'United Kingdom',
  JP: 'Japan', KR: 'South Korea', BR: 'Brazil', AU: 'Australia',
  IN: 'India', FR: 'France', DE: 'Germany', IT: 'Italy',
  ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', CA: 'Canada',
  Global: 'Global', International: 'International', GCC: 'Gulf Cooperation Council',
  ASEAN: 'ASEAN', MY: 'Malaysia', SA: 'Saudi Arabia', PH: 'Philippines',
}

const regionNamesZH: Record<string, string> = {
  EU: '欧盟', US: '美国', CN: '中国', GB: '英国',
  JP: '日本', KR: '韩国', BR: '巴西', AU: '澳大利亚',
  IN: '印度', FR: '法国', DE: '德国', IT: '意大利',
  ES: '西班牙', NL: '荷兰', SE: '瑞典', CA: '加拿大',
  Global: '全球', International: '国际', GCC: '海湾六国',
  ASEAN: '东盟', MY: '马来西亚', SA: '沙特阿拉伯', PH: '菲律宾',
}

function getRegionName(code: string, locale: Locale): string {
  const map = locale === 'zh' ? regionNamesZH : regionNamesEN
  return map[code] || code
}

const docTypeLabelsEN: Record<string, string> = {
  regulation: 'Regulation', standard: 'Standard', guidance: 'Guidance', directive: 'Directive', law: 'Law',
}

const docTypeLabelsZH: Record<string, string> = {
  regulation: '法规', standard: '标准', guidance: '指南', directive: '指令', law: '法律',
}

function getDocTypeLabel(type: string, locale: Locale): string {
  const map = locale === 'zh' ? docTypeLabelsZH : docTypeLabelsEN
  return map[type] || type
}

export default function RegulationsPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [page, setPage] = useState(1)
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [allRegions, setAllRegions] = useState<string[]>([])
  const [allDocTypes, setAllDocTypes] = useState<string[]>([])

  const limit = 20

  const fetchRegulations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: appliedSearch,
        page: page.toString(),
        limit: limit.toString(),
        fulltext: 'true',
        ...(selectedRegion ? { market: selectedRegion } : {}),
        ...(selectedType ? { type: selectedType } : {}),
      })

      const response = await fetch(`/api/regulations/search?${params}`)
      const result = await response.json()

      if (result.success) {
        setRegulations(result.data)
        setTotalCount(result.pagination.total)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (error) {
      console.error('Fetch regulations error:', error)
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, page, selectedRegion, selectedType])

  useEffect(() => {
    fetchRegulations()
  }, [fetchRegulations])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch('/api/regulations/search?limit=1')
        const data = await res.json()
        if (data.success) {
          setTotalCount(data.pagination.total)
        }
      } catch {}
    }
    fetchFilters()
  }, [])

  const handleSearch = () => {
    setAppliedSearch(searchQuery)
    setPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  const startIndex = totalCount > 0 ? (page - 1) * limit + 1 : 0
  const endIndex = Math.min(page * limit, totalCount)

  const regionOptions = Object.keys(regionNamesEN).sort()
  const docTypeOptions = Object.keys(docTypeLabelsEN)

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Scale className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.globalPPERegulations}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.regulationsSubtitle} - {totalCount} {locale === 'zh' ? '条' : ''} {t.regulations}
            </p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-8 bg-white border-b"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: totalCount, label: t.totalRegulations, icon: Scale },
              { value: regionOptions.length, label: t.markets, icon: Globe },
              { value: docTypeOptions.length, label: t.documentTypes, icon: BookOpen },
              { value: regionOptions.length, label: t.categories, icon: Scale },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-[#339999]" />
                </div>
                <div className="text-3xl font-bold text-[#339999] mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-12"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div className="lg:w-64 flex-shrink-0" variants={fadeInUp}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <Filter className="w-6 h-6 text-[#339999] mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">{t.filters}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.search}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder={t.regulationNameCode}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2.5 bg-[#339999] text-white rounded-xl hover:bg-[#2d8b8b] transition-all duration-300 text-sm font-semibold flex-shrink-0"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.region}
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">{t.allRegions}</option>
                      {regionOptions.map(region => (
                        <option key={region} value={region}>
                          {getRegionName(region, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.documentTypeLabel}
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">{t.allDocumentTypes}</option>
                      {docTypeOptions.map(type => (
                        <option key={type} value={type}>
                          {getDocTypeLabel(type, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRegion('')
                      setSelectedType('')
                      setSearchQuery('')
                      setAppliedSearch('')
                      setPage(1)
                    }}
                    className="w-full py-3 px-4 text-sm font-semibold text-[#339999] hover:text-[#2d8b8b] bg-[#339999]/5 hover:bg-[#339999]/10 rounded-xl transition-all duration-300"
                  >
                    {t.resetAllFilters}
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div className="flex-1" variants={fadeInUp}>
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
                </div>
              )}

              {!loading && regulations.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      {t.showing} {startIndex}-{endIndex} {t.of} {totalCount} {t.regulations}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {regulations.map((reg) => (
                      <div key={reg.id}>
                        <Link
                          href={`/regulations/${reg.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                                {locale === 'zh' && reg.title_zh ? reg.title_zh : reg.title}
                              </h3>
                              {locale === 'zh' && reg.title_zh && (
                                <p className="text-sm text-gray-400 mt-1">{reg.title}</p>
                              )}
                              {locale === 'en' && reg.title_zh && (
                                <p className="text-sm text-gray-500 mt-1">{reg.title_zh}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1 font-mono">
                                {reg.regulation_number}
                              </p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                              <span>{getRegionName(reg.market_code, locale)}</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-[#339999]/10 text-[#339999] rounded-full font-medium">
                              {getDocTypeLabel(reg.document_type, locale)}
                            </span>
                            {reg.status === 'active' && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                {t.active}
                              </span>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {locale === 'zh' && reg.summary_zh ? reg.summary_zh : reg.summary}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t.previous}
                      </button>

                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white shadow-lg'
                              : 'border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#339999]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        {t.next}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {!loading && regulations.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Scale className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {appliedSearch.trim() ? t.noSearchResults : t.noRegulationsFound}
                  </h3>
                  <p className="text-gray-600">
                    {appliedSearch.trim()
                      ? locale === 'zh'
                        ? `未找到与"${appliedSearch}"相关的法规。请尝试不同的关键词或调整筛选条件。`
                        : `No regulations found for "${appliedSearch}". Try different keywords or adjust filters.`
                      : t.tryAdjustingFilters
                    }
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
