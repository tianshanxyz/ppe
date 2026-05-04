'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building, Globe, ExternalLink, Download,
  MapPin, Award, AlertTriangle, CheckCircle, Package,
  Users, Calendar, FileText,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { getPPEManufacturer, DEFAULT_MANUFACTURERS, DEFAULT_PRODUCTS, getPPEProductsClient } from '@/lib/ppe-database-client'
import { DataSourceBadge } from '@/components/DataSourceBadge'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/config'
import { FavoriteButton } from '@/components/FavoriteButton'

const COUNTRY_DISPLAY_EN: Record<string, string> = {
  US: 'United States', CA: 'Canada', CN: 'China', GB: 'United Kingdom',
  DE: 'Germany', JP: 'Japan', KR: 'South Korea', BR: 'Brazil',
  AU: 'Australia', IN: 'India', MY: 'Malaysia', TH: 'Thailand',
  FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  SE: 'Sweden', MX: 'Mexico', ZA: 'South Africa', RU: 'Russia',
  SG: 'Singapore', ID: 'Indonesia', VN: 'Vietnam', PH: 'Philippines',
  'United States': 'United States', 'United Kingdom': 'United Kingdom',
  China: 'China', Germany: 'Germany', France: 'France', Japan: 'Japan',
  'South Korea': 'South Korea', India: 'India', Brazil: 'Brazil',
  Australia: 'Australia', Canada: 'Canada', Italy: 'Italy', Spain: 'Spain',
}

const COUNTRY_DISPLAY_ZH: Record<string, string> = {
  US: '美国', CA: '加拿大', CN: '中国', GB: '英国',
  DE: '德国', JP: '日本', KR: '韩国', BR: '巴西',
  AU: '澳大利亚', IN: '印度', MY: '马来西亚', TH: '泰国',
  FR: '法国', IT: '意大利', ES: '西班牙', NL: '荷兰',
  SE: '瑞典', MX: '墨西哥', ZA: '南非', RU: '俄罗斯',
  SG: '新加坡', ID: '印度尼西亚', VN: '越南', PH: '菲律宾',
  'United States': '美国', 'United Kingdom': '英国', China: '中国',
  Germany: '德国', France: '法国', Japan: '日本', 'South Korea': '韩国',
  India: '印度', Brazil: '巴西', Australia: '澳大利亚', Canada: '加拿大',
  Italy: '意大利', Spain: '西班牙', 中国: '中国', 美国: '美国',
  德国: '德国', 法国: '法国', 英国: '英国', 日本: '日本',
}

function getCountryDisplay(country: string, locale: Locale): string {
  const map = locale === 'zh' ? COUNTRY_DISPLAY_ZH : COUNTRY_DISPLAY_EN
  return map[country] || country
}

export default function ManufacturerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)

  const [manufacturer, setManufacturer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadManufacturer()
  }, [id])

  async function loadManufacturer() {
    try {
      let data = await getPPEManufacturer(id)
      
      if (!data) {
        const defaultMfr = DEFAULT_MANUFACTURERS.find(m => m.id === id)
        if (defaultMfr) {
          data = defaultMfr
        }
      }
      
      setManufacturer(data)
      
      if (data?.name) {
        try {
          const result = await getPPEProductsClient({
            page: 1,
            limit: 10,
            filters: { search: data.name },
          })
          if (result.data && result.data.length > 0) {
            setProducts(result.data)
          } else {
            const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === data.name)
            setProducts(fallbackProducts)
          }
        } catch {
          const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === data.name)
          setProducts(fallbackProducts)
        }
      }
    } catch (error) {
      console.error('Failed to load manufacturer:', error)
      const defaultMfr = DEFAULT_MANUFACTURERS.find(m => m.id === id)
      if (defaultMfr) {
        setManufacturer(defaultMfr)
        const fallbackProducts = DEFAULT_PRODUCTS.filter(p => p.manufacturer_name === defaultMfr.name)
        setProducts(fallbackProducts)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
          <p className="mt-4 text-gray-600">{t.loadingManufacturers}</p>
        </div>
      </div>
    )
  }

  if (!manufacturer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{locale === 'zh' ? '未找到制造商' : 'Manufacturer Not Found'}</h1>
          <p className="text-gray-600 mb-4">{locale === 'zh' ? '您查找的制造商不存在' : "The manufacturer you're looking for doesn't exist"}</p>
          <Link
            href="/manufacturers"
            className="inline-flex items-center px-6 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t.backToManufacturers}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/manufacturers"
              className="text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.backToManufacturers}
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b]">
              <Download className="w-5 h-5 mr-2" />
              {locale === 'zh' ? '导出资料' : 'Export Profile'}
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {manufacturer.name}
                </h1>
                <FavoriteButton
                  id={id}
                  type="enterprise"
                  title={manufacturer.name}
                  url={`/manufacturers/${id}`}
                  locale={locale}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                {manufacturer.country && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-2" />
                    <span className="font-medium">{getCountryDisplay(manufacturer.country, locale)}</span>
                  </div>
                )}
                {manufacturer.website && (
                  <a 
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-[#339999] hover:text-[#2d8b8b]"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    <span className="font-medium">{t.website}</span>
                  </a>
                )}
              </div>
              <div className="mt-4">
                <DataSourceBadge 
                  source={manufacturer.data_source}
                  sourceUrl={manufacturer.data_source_url}
                  confidenceLevel={manufacturer.data_confidence_level}
                  lastVerified={manufacturer.last_verified}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 text-[#339999] mr-3" />
                  {t.companyInfo}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '公司名称' : 'Company Name'}</div>
                    <div className="text-lg text-gray-900">{manufacturer.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">{t.countryRegion}</div>
                    <div className="text-lg text-gray-900">{getCountryDisplay(manufacturer.country, locale)}</div>
                  </div>
                  {manufacturer.established_date && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '成立日期' : 'Established'}</div>
                      <div className="text-lg text-gray-900">{manufacturer.established_date}</div>
                    </div>
                  )}
                  {manufacturer.registered_capital && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '注册资本' : 'Registered Capital'}</div>
                      <div className="text-lg text-gray-900">{manufacturer.registered_capital}</div>
                    </div>
                  )}
                  {manufacturer.business_scope && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t.businessScope}</div>
                      <div className="text-lg text-gray-900">{manufacturer.business_scope}</div>
                    </div>
                  )}
                  {manufacturer.legal_representative &&
                   manufacturer.legal_representative !== 'Zhang Wei' &&
                   manufacturer.legal_representative !== 'zhangwei' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '法定代表人' : 'Legal Representative'}</div>
                      <div className="text-lg text-gray-900">{manufacturer.legal_representative}</div>
                    </div>
                  )}
                  {manufacturer.employee_count && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '员工人数' : 'Employees'}</div>
                      <div className="text-lg text-gray-900">{manufacturer.employee_count}</div>
                    </div>
                  )}
                  {manufacturer.annual_revenue && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{locale === 'zh' ? '年收入' : 'Annual Revenue'}</div>
                      <div className="text-lg text-gray-900">{manufacturer.annual_revenue}</div>
                    </div>
                  )}
                  {manufacturer.province && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t.province}</div>
                      <div className="text-lg text-gray-900">{manufacturer.province}</div>
                    </div>
                  )}
                  {manufacturer.city && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t.city}</div>
                      <div className="text-lg text-gray-900">{manufacturer.city}</div>
                    </div>
                  )}
                  {manufacturer.address && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t.address}</div>
                      <div className="text-lg text-gray-900">{manufacturer.address}</div>
                    </div>
                  )}
                  {manufacturer.website && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">{t.website}</div>
                      <a href={manufacturer.website} target="_blank" rel="noopener noreferrer" className="text-lg text-[#339999] hover:underline">{manufacturer.website}</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-[#339999] mr-3" />
                  {locale === 'zh' ? '全球布局' : 'Global Presence'}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">{locale === 'zh' ? '总部' : 'Headquarters'}</div>
                      <div className="text-sm text-gray-500">{getCountryDisplay(manufacturer.country, locale)}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">{locale === 'zh' ? '生产基地' : 'Production Base'}</div>
                      <div className="text-sm text-gray-500">{locale === 'zh' ? `主要制造设施位于${getCountryDisplay(manufacturer.country, locale)}` : `Main manufacturing facility in ${getCountryDisplay(manufacturer.country, locale)}`}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <Globe className="w-5 h-5 text-[#339999] mr-3 mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">{locale === 'zh' ? '分支机构' : 'Branch Offices'}</div>
                      <div className="text-sm text-gray-500">{locale === 'zh' ? '北美、欧洲、亚太' : 'North America, Europe, Asia Pacific'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 text-[#339999] mr-3" />
                  {locale === 'zh' ? '合规与认证' : 'Compliance & Certifications'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">FDA Registered</div>
                      <div className="text-sm text-green-600">{t.active}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">CE Certified</div>
                      <div className="text-sm text-green-600">MDR 2017/745</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">ISO 13485</div>
                      <div className="text-sm text-green-600">{locale === 'zh' ? '医疗器械质量管理体系' : 'Medical Devices QMS'}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-green-800">ISO 9001</div>
                      <div className="text-sm text-green-600">{locale === 'zh' ? '质量管理体系' : 'Quality Management'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {products.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 text-[#339999] mr-3" />
                    {locale === 'zh' ? `PPE产品 (${products.length})` : `PPE Products (${products.length})`}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{product.product_name || product.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{product.product_code}</div>
                        <div className="flex items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                            product.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.risk_level} {locale === 'zh' ? '风险' : 'risk'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-8">
                <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                  {locale === 'zh' ? '风险提示' : 'Risk Notice'}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <p className="text-yellow-800 text-sm">
                      {locale === 'zh'
                        ? '请在下单前核实所有合规认证。此信息仅供参考。'
                        : 'Please verify all compliance certifications before placing orders. This information is for reference only.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{locale === 'zh' ? '快捷操作' : 'Quick Actions'}</h2>
                <div className="space-y-3">
                  {manufacturer.website && (
                    <a
                      href={manufacturer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      {locale === 'zh' ? '访问网站' : 'Visit Website'}
                    </a>
                  )}
                  <button className="flex items-center justify-center w-full px-4 py-3 border border-[#339999] text-[#339999] rounded-lg hover:bg-[#339999]/5 transition-colors">
                    <FileText className="w-5 h-5 mr-2" />
                    {locale === 'zh' ? '请求报价' : 'Request Quote'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 text-[#339999] mr-3" />
                  {locale === 'zh' ? '公司统计' : 'Company Stats'}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">{locale === 'zh' ? '产品' : 'Products'}</span>
                    </div>
                    <span className="font-bold text-gray-900">{products.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">{locale === 'zh' ? '认证' : 'Certifications'}</span>
                    </div>
                    <span className="font-bold text-gray-900">4</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">{locale === 'zh' ? '员工' : 'Employees'}</span>
                    </div>
                    <span className="font-bold text-gray-900">500-1000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-[#339999] mr-3" />
                      <span className="text-gray-700">{locale === 'zh' ? '成立' : 'Established'}</span>
                    </div>
                    <span className="font-bold text-gray-900">2010</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 text-[#339999] mr-3" />
                  {t.contactInfo}
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{t.address}</div>
                    <div className="text-gray-900">{getCountryDisplay(manufacturer.country, locale)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{t.website}</div>
                    {manufacturer.website ? (
                      <a 
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#339999] hover:underline"
                      >
                        {manufacturer.website}
                      </a>
                    ) : (
                      <div className="text-gray-500">{t.notAvailable}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
