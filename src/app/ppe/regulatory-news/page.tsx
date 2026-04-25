'use client'

import { useState } from 'react'
import { Newspaper, Calendar, Tag, ArrowRight, Search, Filter } from 'lucide-react'
import Link from 'next/link'

const REGULATORY_NEWS = [
  {
    id: '1',
    title: 'EU Updates PPE Regulation Guidance for Category III Products',
    title_zh: '欧盟更新第三类PPE产品法规指南',
    summary: 'The European Commission has published updated guidance on the conformity assessment procedures for Category III PPE under Regulation 2016/425.',
    summary_zh: '欧盟委员会发布了关于2016/425法规下第三类PPE合格评定程序的更新指南。',
    date: '2026-04-22',
    source: 'European Commission',
    category: 'EU',
    tags: ['CE Marking', 'Category III', 'PPE Regulation'],
    impact: 'high'
  },
  {
    id: '2',
    title: 'FDA Issues New Guidance on N95 Respirator Reuse',
    title_zh: 'FDA发布N95口罩重复使用新指南',
    summary: 'The FDA has released updated guidance regarding the reuse of N95 respirators, including new decontamination protocols and shelf-life extensions.',
    summary_zh: 'FDA发布了关于N95口罩重复使用的更新指南，包括新的消毒协议和保质期延长。',
    date: '2026-04-18',
    source: 'FDA',
    category: 'US',
    tags: ['FDA', 'N95', 'Respirator'],
    impact: 'high'
  },
  {
    id: '3',
    title: 'UKCA Marking Deadline Extended to 2027',
    title_zh: 'UKCA认证截止日期延长至2027年',
    summary: 'The UK government has announced an extension to the UKCA marking transition period, allowing CE marking to continue to be accepted until December 2027.',
    summary_zh: '英国政府宣布延长UKCA认证过渡期，允许CE认证继续被接受至2027年12月。',
    date: '2026-04-15',
    source: 'UK Government',
    category: 'UK',
    tags: ['UKCA', 'CE Marking', 'Transition'],
    impact: 'medium'
  },
  {
    id: '4',
    title: 'China NMPA Revises Medical Device Classification Rules',
    title_zh: '中国NMPA修订医疗器械分类规则',
    summary: 'NMPA has published revised classification rules for medical devices, affecting several PPE product categories including surgical masks and protective clothing.',
    summary_zh: 'NMPA发布了修订后的医疗器械分类规则，影响了包括外科口罩和防护服在内的多个PPE产品类别。',
    date: '2026-04-10',
    source: 'NMPA',
    category: 'China',
    tags: ['NMPA', 'Classification', 'Medical Device'],
    impact: 'high'
  },
  {
    id: '5',
    title: 'New EN ISO 13688:2026 Standard Published',
    title_zh: '新标准EN ISO 13688:2026发布',
    summary: 'The updated general requirements standard for protective clothing has been published, with transition period ending December 2027.',
    summary_zh: '更新后的防护服装通用要求标准已发布，过渡期至2027年12月结束。',
    date: '2026-04-08',
    source: 'CEN',
    category: 'Standards',
    tags: ['EN ISO 13688', 'Protective Clothing', 'Standards'],
    impact: 'medium'
  },
  {
    id: '6',
    title: 'Australia TGA Updates PPE Import Requirements',
    title_zh: '澳大利亚TGA更新PPE进口要求',
    summary: 'The Therapeutic Goods Administration has updated requirements for PPE imports, including new documentation and labeling requirements.',
    summary_zh: '治疗用品管理局更新了PPE进口要求，包括新的文件和标签要求。',
    date: '2026-04-05',
    source: 'TGA',
    category: 'Australia',
    tags: ['TGA', 'Import', 'Australia'],
    impact: 'low'
  }
]

export default function RegulatoryNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'EU', 'US', 'UK', 'China', 'Standards', 'Australia']

  const filteredNews = REGULATORY_NEWS.filter(news => {
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory
    const matchesSearch = !searchQuery ||
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Newspaper className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Regulatory News</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay informed with the latest regulatory updates affecting PPE compliance worldwide
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredNews.length > 0 ? (
            <div className="space-y-6">
              {filteredNews.map(news => (
                <article key={news.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        news.impact === 'high' ? 'bg-red-100 text-red-700' :
                        news.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {news.impact} impact
                      </span>
                      <span className="text-xs font-medium text-[#339999] bg-[#339999]/10 px-2 py-1 rounded-full">
                        {news.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {news.date}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{news.title}</h2>
                  <p className="text-gray-600 mb-4">{news.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {news.tags.map(tag => (
                        <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">Source: {news.source}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No news found matching your criteria</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
