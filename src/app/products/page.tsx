'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Package, BarChart3, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Globe, Factory } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPPEProductsClient, getPPEProductStatsClient, PPEProduct } from '@/lib/ppe-database-client'
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

function getRiskLevelStyle(riskLevel: string) {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const CATEGORY_ICON: Record<string, string> = {
  '呼吸防护装备': '😷',
  '手部防护装备': '🧤',
  '身体防护装备': '🥼',
  '眼面部防护装备': '🥽',
  '头部防护装备': '⛑️',
  '足部防护装备': '👢',
  'Respiratory Protection': '😷',
  'Hand Protection': '🧤',
  'Body Protection': '🥼',
  'Eye and Face Protection': '🥽',
  'Head Protection': '⛑️',
  'Foot Protection': '👢',
}

const CATEGORY_ZH: Record<string, string> = {
  '呼吸防护装备': '呼吸防护装备',
  '手部防护装备': '手部防护装备',
  '身体防护装备': '身体防护装备',
  '眼面部防护装备': '眼面部防护装备',
  '头部防护装备': '头部防护装备',
  '足部防护装备': '足部防护装备',
  'Respiratory Protection': '呼吸防护装备',
  'Hand Protection': '手部防护装备',
  'Body Protection': '身体防护装备',
  'Eye and Face Protection': '眼面部防护装备',
  'Head Protection': '头部防护装备',
  'Foot Protection': '足部防护装备',
}

const CATEGORY_EN: Record<string, string> = {
  '呼吸防护装备': 'Respiratory Protection',
  '手部防护装备': 'Hand Protection',
  '身体防护装备': 'Body Protection',
  '眼面部防护装备': 'Eye and Face Protection',
  '头部防护装备': 'Head Protection',
  '足部防护装备': 'Foot Protection',
  'Respiratory Protection': 'Respiratory Protection',
  'Hand Protection': 'Hand Protection',
  'Body Protection': 'Body Protection',
  'Eye and Face Protection': 'Eye and Face Protection',
  'Head Protection': 'Head Protection',
  'Foot Protection': 'Foot Protection',
}

function getCategoryIcon(category: string): string {
  return CATEGORY_ICON[category] || '🔧'
}

function getCategoryDisplay(category: string, locale: Locale): string {
  const map = locale === 'zh' ? CATEGORY_ZH : CATEGORY_EN
  return map[category] || category
}

const COUNTRY_DISPLAY_EN: Record<string, string> = {
  US: 'United States', CA: 'Canada', CN: 'China', GB: 'United Kingdom',
  DE: 'Germany', JP: 'Japan', KR: 'South Korea', BR: 'Brazil',
  AU: 'Australia', IN: 'India', MY: 'Malaysia', TH: 'Thailand',
  FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  SE: 'Sweden', MX: 'Mexico', ZA: 'South Africa', RU: 'Russia',
  SG: 'Singapore', ID: 'Indonesia', VN: 'Vietnam', PH: 'Philippines',
  NZ: 'New Zealand', IL: 'Israel', CH: 'Switzerland', AT: 'Austria',
  BE: 'Belgium', PL: 'Poland', CZ: 'Czech Republic', DK: 'Denmark',
  FI: 'Finland', NO: 'Norway', PT: 'Portugal', IE: 'Ireland',
  GR: 'Greece', TR: 'Turkey', SA: 'Saudi Arabia', AE: 'UAE',
  'United States': 'United States', 'United Kingdom': 'United Kingdom',
  China: 'China', Germany: 'Germany', France: 'France', Japan: 'Japan',
  'South Korea': 'South Korea', India: 'India', Brazil: 'Brazil',
  Australia: 'Australia', Canada: 'Canada', Italy: 'Italy', Spain: 'Spain',
  Netherlands: 'Netherlands', Sweden: 'Sweden', Mexico: 'Mexico',
  Switzerland: 'Switzerland', Malaysia: 'Malaysia', Thailand: 'Thailand',
  Singapore: 'Singapore', Indonesia: 'Indonesia', Vietnam: 'Vietnam',
  Russia: 'Russia', 'South Africa': 'South Africa', 'New Zealand': 'New Zealand',
}

const COUNTRY_DISPLAY_ZH: Record<string, string> = {
  US: '美国', CA: '加拿大', CN: '中国', GB: '英国',
  DE: '德国', JP: '日本', KR: '韩国', BR: '巴西',
  AU: '澳大利亚', IN: '印度', MY: '马来西亚', TH: '泰国',
  FR: '法国', IT: '意大利', ES: '西班牙', NL: '荷兰',
  SE: '瑞典', MX: '墨西哥', ZA: '南非', RU: '俄罗斯',
  SG: '新加坡', ID: '印度尼西亚', VN: '越南', PH: '菲律宾',
  NZ: '新西兰', IL: '以色列', CH: '瑞士', AT: '奥地利',
  BE: '比利时', PL: '波兰', CZ: '捷克', DK: '丹麦',
  FI: '芬兰', NO: '挪威', PT: '葡萄牙', IE: '爱尔兰',
  GR: '希腊', TR: '土耳其', SA: '沙特阿拉伯', AE: '阿联酋',
  'United States': '美国', 'United Kingdom': '英国', China: '中国',
  Germany: '德国', France: '法国', Japan: '日本', 'South Korea': '韩国',
  India: '印度', Brazil: '巴西', Australia: '澳大利亚', Canada: '加拿大',
  Italy: '意大利', Spain: '西班牙', Netherlands: '荷兰', Sweden: '瑞典',
  Mexico: '墨西哥', Switzerland: '瑞士', Malaysia: '马来西亚', Thailand: '泰国',
  Singapore: '新加坡', Indonesia: '印度尼西亚', Vietnam: '越南',
  Russia: '俄罗斯', 'South Africa': '南非', 'New Zealand': '新西兰',
  中国: '中国', 美国: '美国', 德国: '德国', 法国: '法国',
  英国: '英国', 日本: '日本', 韩国: '韩国', 印度: '印度',
  巴西: '巴西', 澳大利亚: '澳大利亚', 加拿大: '加拿大',
  意大利: '意大利', 西班牙: '西班牙', 荷兰: '荷兰', 瑞典: '瑞典',
}

function getCountryDisplay(country: string, locale: Locale): string {
  const map = locale === 'zh' ? COUNTRY_DISPLAY_ZH : COUNTRY_DISPLAY_EN
  return map[country] || country
}

const RISK_LEVEL_EN: Record<string, string> = {
  high: 'High', medium: 'Medium', low: 'Low',
  High: 'High', Medium: 'Medium', Low: 'Low',
}

const RISK_LEVEL_ZH: Record<string, string> = {
  high: '高', medium: '中', low: '低',
  High: '高', Medium: '中', Low: '低',
}

function getRiskLevelDisplay(level: string, locale: Locale): string {
  const map = locale === 'zh' ? RISK_LEVEL_ZH : RISK_LEVEL_EN
  return map[level] || level
}

export default function ProductsPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)

  const [products, setProducts] = useState<PPEProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('')
  const [countries, setCountries] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [riskLevels, setRiskLevels] = useState<string[]>([])

  const limit = 20

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const statsData = await getPPEProductStatsClient()
        if (mounted) {
          setStats(statsData)
          if (statsData.countryCount) {
            const sortedCountries = Object.keys(statsData.countryCount).sort((a, b) => {
              const nameA = getCountryDisplay(a, locale)
              const nameB = getCountryDisplay(b, locale)
              return nameA.localeCompare(nameB)
            })
            setCountries(sortedCountries)
          }
          if (statsData.categoryCount) {
            setCategories(Object.keys(statsData.categoryCount))
          }
          if (statsData.riskLevelCount) {
            setRiskLevels(Object.keys(statsData.riskLevelCount))
          }
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [locale])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPPEProductsClient({
        page,
        limit,
        filters: {
          search: appliedSearch,
          country: selectedCountry,
          category: selectedCategory,
        },
      })

      setProducts(result.data)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError(t.errorLoadingProducts)
    } finally {
      setLoading(false)
    }
  }, [page, selectedCountry, selectedCategory, appliedSearch, t.errorLoadingProducts])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

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
                <Package className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.globalPPEProducts}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.discoverProducts.replace('{count}', stats?.totalProducts?.toLocaleString() || '...')}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: stats.totalProducts ?? 0, label: t.totalProducts, icon: Package },
                { value: Object.keys(stats.countryCount ?? {}).length, label: t.countries, icon: Globe },
                { value: Object.keys(stats.categoryCount ?? {}).length, label: t.categories, icon: BarChart3 },
                { value: Object.keys(stats.riskLevelCount ?? {}).length, label: t.riskLevels, icon: AlertCircle },
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
                          placeholder={locale === 'zh' ? '产品名称、代码...' : 'Product name, code...'}
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.categoryLabel}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">{t.allCategories}</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {getCategoryDisplay(category, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.riskLevel}
                    </label>
                    <select
                      value={selectedRiskLevel}
                      onChange={(e) => {
                        setSelectedRiskLevel(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                    >
                      <option value="">{t.allRiskLevels}</option>
                      {riskLevels.map(level => (
                        <option key={level} value={level}>
                          {getRiskLevelDisplay(level, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCountry('')
                      setSelectedCategory('')
                      setSelectedRiskLevel('')
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
                      <h3 className="font-semibold text-red-800">{t.errorLoadingProducts}</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={loadProducts}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    {t.tryAgain}
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#339999]/20 border-b-[#339999]"></div>
                  <p className="mt-6 text-lg text-gray-600 font-medium">{t.loadingProducts}</p>
                </div>
              )}

              {!loading && products.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                      {t.showing} {startIndex}-{endIndex} {t.of} {total.toLocaleString()} {t.productsCount}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-[#339999]/30 hover:-translate-y-2 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#339999] transition-colors truncate">
                                {product.name}
                              </h3>
                              {product.product_code && (
                                <p className="text-sm text-gray-500 mt-1 font-mono truncate">
                                  {product.product_code}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#339999] group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </div>

                          <div className="space-y-3 mb-6">
                            {product.category && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Package className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{getCategoryIcon(product.category)} {getCategoryDisplay(product.category, locale)}</span>
                              </div>
                            )}
                            {product.country_of_origin && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="truncate">{getCountryDisplay(product.country_of_origin, locale)}</span>
                              </div>
                            )}
                            {product.subcategory && (
                              <div className="flex items-center text-sm text-gray-600">
                                <BarChart3 className="w-4 h-4 mr-2 text-[#339999] flex-shrink-0" />
                                <span className="capitalize">{product.subcategory}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 font-medium truncate mr-2">
                                {product.manufacturer_name || t.unknownManufacturer}
                              </span>
                              {product.risk_level && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 border ${getRiskLevelStyle(product.risk_level)}`}>
                                  {getRiskLevelDisplay(product.risk_level, locale)}
                                </span>
                              )}
                            </div>
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

              {!loading && products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {appliedSearch.trim() ? t.noSearchResults : t.noProductsFound}
                  </h3>
                  <p className="text-gray-600">
                    {appliedSearch.trim()
                      ? t.noProductsSearchResult.replace('{search}', appliedSearch)
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
