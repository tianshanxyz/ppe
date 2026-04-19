'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, Filter, ExternalLink, BookOpen } from 'lucide-react'
import { getPPERegulationsClient } from '@/lib/ppe-database-client'

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const limit = 20

  // 示例法规数据（因为数据库目前为 0 条）
  const sampleRegulations = [
    {
      id: '1',
      regulation_name: 'EU PPE Regulation 2016/425',
      regulation_name_en: 'Regulation (EU) 2016/425 on personal protective equipment',
      regulation_name_zh: '欧盟 PPE 法规 2016/425',
      regulation_type: 'Regulation',
      jurisdiction: 'EU',
      category: 'PPE General',
      effective_date: '2018-04-21',
      content: 'The Regulation lays down health and safety requirements for personal protective equipment (PPE) to ensure the protection of workers and consumers.',
      keywords: ['PPE', 'CE Marking', 'Conformity Assessment'],
      source_url: 'https://eur-lex.europa.eu/eli/reg/2016/425/oj',
    },
    {
      id: '2',
      regulation_name: 'FDA 21 CFR Part 800',
      regulation_name_en: 'Code of Federal Regulations Title 21 - Medical Devices',
      regulation_name_zh: 'FDA 21 CFR 第 800 部分 - 医疗器械',
      regulation_type: 'Regulation',
      jurisdiction: 'US',
      category: 'Medical Devices',
      effective_date: '2020-01-01',
      content: 'FDA regulations governing medical devices including PPE products such as surgical masks, gloves, and protective clothing.',
      keywords: ['FDA', '510(k)', 'Medical Devices'],
      source_url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=800',
    },
    {
      id: '3',
      regulation_name: 'GB 2626-2019',
      regulation_name_en: 'Respiratory protection - Self-suction filtering respirators against particles',
      regulation_name_zh: '呼吸防护 自吸过滤式防颗粒物呼吸器',
      regulation_type: 'Standard',
      jurisdiction: 'CN',
      category: 'Respiratory Protection',
      effective_date: '2020-07-01',
      content: 'Chinese national standard for respiratory protective equipment, specifying requirements for filtering facepiece respirators.',
      keywords: ['KN95', 'Respirator', 'Filtering'],
      source_url: 'https://openstd.samr.gov.cn/bzgk/gb/',
    },
    {
      id: '4',
      regulation_name: 'EN 14683:2019',
      regulation_name_en: 'Medical face masks - Requirements and test methods',
      regulation_name_zh: '医用口罩 - 要求与测试方法',
      regulation_type: 'Standard',
      jurisdiction: 'EU',
      category: 'Face Masks',
      effective_date: '2019-10-01',
      content: 'European standard specifying requirements and test methods for medical face masks to limit their transmission of infective agents.',
      keywords: ['Medical Mask', 'Surgical Mask', 'BFE'],
      source_url: 'https://www.en-standard.eu/csn-en-14683-2019/',
    },
    {
      id: '5',
      regulation_name: 'EN ISO 374-1:2016',
      regulation_name_en: 'Protective gloves against dangerous chemicals and micro-organisms',
      regulation_name_zh: '防护手套 - 防危险化学品和微生物',
      regulation_type: 'Standard',
      jurisdiction: 'EU',
      category: 'Hand Protection',
      effective_date: '2016-11-01',
      content: 'Standard defining requirements and test methods for protective gloves against chemicals and micro-organisms.',
      keywords: ['Gloves', 'Chemical Protection', 'PPE'],
      source_url: 'https://www.iso.org/standard/60116.html',
    },
  ]

  useEffect(() => {
    loadRegulations()
  }, [page, selectedJurisdiction, selectedCategory])

  async function loadRegulations() {
    setLoading(true)
    try {
      const result = await getPPERegulationsClient({
        page,
        limit,
        filters: {
          jurisdiction: selectedJurisdiction !== 'all' ? selectedJurisdiction : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        },
      })
      
      // 如果数据库没有数据，使用示例数据
      if (result.total === 0) {
        setRegulations(sampleRegulations)
        setTotal(sampleRegulations.length)
      } else {
        setRegulations(result.data)
        setTotal(result.total)
      }
    } catch (error) {
      console.error('加载法规列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <BookOpen className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              PPE Regulations Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive database of global PPE regulations and standards
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadRegulations()}
                  placeholder="Search regulations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-[#339999]"
                />
              </div>
              <select
                value={selectedJurisdiction}
                onChange={(e) => {
                  setSelectedJurisdiction(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
              >
                <option value="all">All Jurisdictions</option>
                <option value="EU">European Union</option>
                <option value="US">United States</option>
                <option value="CN">China</option>
                <option value="UK">United Kingdom</option>
                <option value="JP">Japan</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border-gray-300 focus:border-[#339999] focus:ring-[#339999]"
              >
                <option value="all">All Categories</option>
                <option value="PPE General">PPE General</option>
                <option value="Medical Devices">Medical Devices</option>
                <option value="Respiratory Protection">Respiratory Protection</option>
                <option value="Hand Protection">Hand Protection</option>
                <option value="Eye Protection">Eye Protection</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {total} regulations found
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
              <p className="mt-4 text-gray-600">Loading regulations...</p>
            </div>
          )}

          {!loading && regulations.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No regulations found
              </h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}

          {!loading && regulations.length > 0 && (
            <div className="space-y-6">
              {regulations.map((regulation) => (
                <div
                  key={regulation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#339999]/10 text-[#339999]">
                          {regulation.jurisdiction}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {regulation.regulation_type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {regulation.regulation_name}
                      </h3>
                      {regulation.regulation_name_zh && (
                        <p className="text-gray-600 mb-2">
                          {regulation.regulation_name_zh}
                        </p>
                      )}
                    </div>
                    {regulation.source_url && (
                      <a
                        href={regulation.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-[#339999] hover:bg-[#339999]/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Source
                      </a>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {regulation.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {regulation.keywords && regulation.keywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Effective: {regulation.effective_date}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        pageNum === page
                          ? 'bg-[#339999] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
