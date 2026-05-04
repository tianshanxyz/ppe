'use client'

import { useState, useEffect, useCallback } from 'react'
import { Factory, Search, Filter, Globe, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEManufacturersClient, getPPEManufacturerStatsClient } from '@/lib/ppe-database-client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/config'

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

const COUNTRY_DISPLAY_EN: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  CN: 'China',
  GB: 'United Kingdom',
  DE: 'Germany',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  AU: 'Australia',
  IN: 'India',
  MY: 'Malaysia',
  TH: 'Thailand',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  SE: 'Sweden',
  MX: 'Mexico',
  ZA: 'South Africa',
  RU: 'Russia',
  SG: 'Singapore',
  ID: 'Indonesia',
  VN: 'Vietnam',
  PH: 'Philippines',
  NZ: 'New Zealand',
  IL: 'Israel',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PL: 'Poland',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  FI: 'Finland',
  NO: 'Norway',
  PT: 'Portugal',
  IE: 'Ireland',
  GR: 'Greece',
  HU: 'Hungary',
  RO: 'Romania',
  UA: 'Ukraine',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  AE: 'UAE',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  CL: 'Chile',
  CO: 'Colombia',
  AR: 'Argentina',
  PE: 'Peru',
}

const COUNTRY_DISPLAY_ZH: Record<string, string> = {
  US: '美国',
  CA: '加拿大',
  CN: '中国',
  GB: '英国',
  DE: '德国',
  JP: '日本',
  KR: '韩国',
  BR: '巴西',
  AU: '澳大利亚',
  IN: '印度',
  MY: '马来西亚',
  TH: '泰国',
  FR: '法国',
  IT: '意大利',
  ES: '西班牙',
  NL: '荷兰',
  SE: '瑞典',
  MX: '墨西哥',
  ZA: '南非',
  RU: '俄罗斯',
  SG: '新加坡',
  ID: '印度尼西亚',
  VN: '越南',
  PH: '菲律宾',
  NZ: '新西兰',
  IL: '以色列',
  CH: '瑞士',
  AT: '奥地利',
  BE: '比利时',
  PL: '波兰',
  CZ: '捷克',
  DK: '丹麦',
  FI: '芬兰',
  NO: '挪威',
  PT: '葡萄牙',
  IE: '爱尔兰',
  GR: '希腊',
  HU: '匈牙利',
  RO: '罗马尼亚',
  UA: '乌克兰',
  TR: '土耳其',
  SA: '沙特阿拉伯',
  AE: '阿联酋',
  EG: '埃及',
  NG: '尼日利亚',
  KE: '肯尼亚',
  CL: '智利',
  CO: '哥伦比亚',
  AR: '阿根廷',
  PE: '秘鲁',
  'United States': '美国',
  'United Kingdom': '英国',
  China: '中国',
  Germany: '德国',
  France: '法国',
  Japan: '日本',
  'South Korea': '韩国',
  India: '印度',
  Brazil: '巴西',
  Australia: '澳大利亚',
  Canada: '加拿大',
  Italy: '意大利',
  Spain: '西班牙',
  Netherlands: '荷兰',
  Sweden: '瑞典',
  Mexico: '墨西哥',
  Switzerland: '瑞士',
  Malaysia: '马来西亚',
  Thailand: '泰国',
  Singapore: '新加坡',
  Indonesia: '印度尼西亚',
  Vietnam: '越南',
  Philippines: '菲律宾',
  Russia: '俄罗斯',
  'South Africa': '南非',
  'New Zealand': '新西兰',
  Israel: '以色列',
  Austria: '奥地利',
  Belgium: '比利时',
  Poland: '波兰',
  Denmark: '丹麦',
  Finland: '芬兰',
  Norway: '挪威',
  Portugal: '葡萄牙',
  Ireland: '爱尔兰',
  Turkey: '土耳其',
  'Saudi Arabia': '沙特阿拉伯',
  UAE: '阿联酋',
  中国: '中国',
  美国: '美国',
  德国: '德国',
  法国: '法国',
  英国: '英国',
  日本: '日本',
  韩国: '韩国',
  印度: '印度',
  巴西: '巴西',
  澳大利亚: '澳大利亚',
  加拿大: '加拿大',
  意大利: '意大利',
  西班牙: '西班牙',
  荷兰: '荷兰',
  瑞典: '瑞典',
  马来西亚: '马来西亚',
  泰国: '泰国',
}

function getCountryDisplay(country: string, locale: Locale): string {
  const map = locale === 'zh' ? COUNTRY_DISPLAY_ZH : COUNTRY_DISPLAY_EN
  return map[country] || country
}

export default function ManufacturersPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)

  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [countries, setCountries] = useState<string[]>([])

  const limit = 20

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEManufacturerStatsClient()
        if (mounted) {
          setStats(statsData)
          if (statsData.countryCount) {
            const uniqueCountries = Object.keys(statsData.countryCount)
            const sortedCountries = uniqueCountries.sort((a, b) => {
              const nameA = getCountryDisplay(a, locale)
              const nameB = getCountryDisplay(b, locale)
              return nameA.localeCompare(nameB)
            })
            setCountries(sortedCountries)
          }
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [locale])

  const loadManufacturers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPPEManufacturersClient({
        page,
        limit,
        search: appliedSearch,
        country: selectedCountry,
      })

      setManufacturers(result.data || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error('Failed to load manufacturers:', err)
      setError(t.errorLoadingManufacturers)
    } finally {
      setLoading(false)
    }
  }, [page, selectedCountry, appliedSearch, t.errorLoadingManufacturers])

  useEffect(() => {
    loadManufacturers()
  }, [loadManufacturers])

  const handleSearch = () => {
    setAppliedSearch(searchQuery)
    setPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const totalPages = Math.ceil(total / limit)
  const startIndex = total > 0 ? (page - 1) * limit + 1 : 0
  const endIndex = Math.min(page * limit, total)

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
                <Factory className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.globalManufacturers}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.discoverManufacturers.replace('{count}', stats?.totalManufacturers?.toLocaleString() || '...')}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {stats && (
        <motion.section
          className="py-8 bg-white border-b"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { value: stats.totalManufacturers ?? 0, label: t.totalManufacturers, icon: Factory },
                { value: Object.keys(stats.countryCount ?? {}).length, label: t.countries, icon: Globe },
                { value: Object.values(stats.countryCount ?? {}).reduce((a: any, b: any) => Math.max(Number(a), Number(b)), 0), label: t.largestMarketCount, icon: Building2 },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-[#339999]" />
                  </div>
                  <div className="text-3xl font-bold text-[#339999] mb-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

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
                          placeholder={t.manufacturerName}
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
                      {t.countries}
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">{t.allCountries}</option>
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {getCountryDisplay(country, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCountry('')
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
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">{t.errorLoadingManufacturers}</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={loadManufacturers}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    {t.tryAgain}
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
                  <p className="mt-6 text-lg text-gray-600 font-medium">{t.loadingManufacturers}</p>
                </div>
              )}

              {!loading && manufacturers.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      {t.showing} {startIndex}-{endIndex} {t.of} {total.toLocaleString()} {t.manufacturers}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {manufacturers.map((mfr) => (
                      <div key={mfr.id}>
                        <Link
                          href={`/manufacturers/${mfr.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                                {mfr.name}
                              </h3>
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>

                          <div className="space-y-3 mb-6">
                            {mfr.country && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{getCountryDisplay(mfr.country, locale)}</span>
                              </div>
                            )}
                            {mfr.city && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building2 className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{mfr.city}{mfr.province ? `, ${mfr.province}` : ''}</span>
                              </div>
                            )}
                          </div>

                          {mfr.business_scope && (
                            <div className="pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {mfr.business_scope}
                              </p>
                            </div>
                          )}
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

              {!loading && manufacturers.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Factory className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {appliedSearch.trim() ? t.noSearchResults : t.noManufacturersFound}
                  </h3>
                  <p className="text-gray-600">
                    {appliedSearch.trim()
                      ? t.noManufacturersSearchResult.replace('{search}', appliedSearch)
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
