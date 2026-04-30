'use client'

import { useState } from 'react'
import { BookOpen, Search, Lightbulb, FileText, ArrowRight, Tag } from 'lucide-react'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/lib/i18n/useLocale'
import { knowledgeBaseTranslations } from '@/lib/i18n/translations'

// 知识库文章数据
const KNOWLEDGE_ARTICLES = [
  {
    id: 'ce-marking-guide',
    title: 'CE Marking Complete Guide for PPE',
    title_zh: 'PPE产品CE认证完整指南',
    summary: 'Comprehensive guide to CE marking requirements for personal protective equipment, including EU Regulation 2016/425 compliance.',
    summary_zh: '个人防护设备CE认证要求的综合指南，包括欧盟法规2016/425的合规要求。',
    category: 'compliance',
    tags: ['CE Marking', 'EU', 'PPE Regulation'],
    readTime: '15 min',
    updatedAt: '2026-04-20'
  },
  {
    id: 'fda-510k-process',
    title: 'FDA 510(k) Submission Process',
    title_zh: 'FDA 510(k)提交流程',
    summary: 'Step-by-step guide to preparing and submitting FDA 510(k) applications for PPE products.',
    summary_zh: '为PPE产品准备和提交FDA 510(k)申请的分步指南。',
    category: 'compliance',
    tags: ['FDA', '510(k)', 'US Market'],
    readTime: '20 min',
    updatedAt: '2026-04-18'
  },
  {
    id: 'ukca-transition',
    title: 'UKCA Marking Transition Guide',
    title_zh: 'UKCA认证过渡指南',
    summary: 'Understanding UKCA marking requirements and transition from CE marking for the UK market.',
    summary_zh: '了解英国市场的UKCA认证要求及从CE认证的过渡。',
    category: 'compliance',
    tags: ['UKCA', 'UK', 'Brexit'],
    readTime: '12 min',
    updatedAt: '2026-04-15'
  },
  {
    id: 'nmpa-registration',
    title: 'NMPA Registration for Foreign Manufacturers',
    title_zh: '外国制造商NMPA注册指南',
    summary: 'Complete guide to China NMPA registration process for foreign PPE manufacturers.',
    summary_zh: '外国PPE制造商中国NMPA注册流程完整指南。',
    category: 'compliance',
    tags: ['NMPA', 'China', 'Registration'],
    readTime: '25 min',
    updatedAt: '2026-04-10'
  },
  {
    id: 'risk-assessment',
    title: 'PPE Risk Assessment Best Practices',
    title_zh: 'PPE风险评估最佳实践',
    summary: 'Best practices for conducting risk assessments for PPE products according to ISO 14971.',
    summary_zh: '根据ISO 14971进行PPE产品风险评估的最佳实践。',
    category: 'technical',
    tags: ['Risk Assessment', 'ISO 14971', 'Safety'],
    readTime: '18 min',
    updatedAt: '2026-04-12'
  },
  {
    id: 'testing-requirements',
    title: 'PPE Testing Requirements by Category',
    title_zh: '按类别划分的PPE测试要求',
    summary: 'Overview of testing requirements for different PPE categories including standards and test methods.',
    summary_zh: '不同PPE类别的测试要求概述，包括标准和测试方法。',
    category: 'technical',
    tags: ['Testing', 'Standards', 'Certification'],
    readTime: '30 min',
    updatedAt: '2026-04-08'
  },
  {
    id: 'market-access-eu',
    title: 'EU Market Access Strategy',
    title_zh: '欧盟市场准入策略',
    summary: 'Strategic guidance for entering the EU PPE market, including Notified Body selection and technical documentation.',
    summary_zh: '进入欧盟PPE市场的战略指导，包括公告机构选择和技术文件准备。',
    category: 'market',
    tags: ['EU', 'Market Access', 'Strategy'],
    readTime: '22 min',
    updatedAt: '2026-04-05'
  },
  {
    id: 'post-market-surveillance',
    title: 'Post-Market Surveillance Requirements',
    title_zh: '上市后监督要求',
    summary: 'Understanding post-market surveillance obligations for PPE manufacturers in major markets.',
    summary_zh: '了解主要市场PPE制造商的上市后监督义务。',
    category: 'compliance',
    tags: ['PMS', 'Vigilance', 'Compliance'],
    readTime: '16 min',
    updatedAt: '2026-04-01'
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All Articles', name_zh: '全部文章' },
  { id: 'compliance', name: 'Compliance', name_zh: '合规' },
  { id: 'technical', name: 'Technical', name_zh: '技术' },
  { id: 'market', name: 'Market Access', name_zh: '市场准入' }
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const locale = useLocale()
  const t = useTranslation(knowledgeBaseTranslations)

  const filteredArticles = KNOWLEDGE_ARTICLES.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <BookOpen className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.knowledgeBase}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.knowledgeBaseSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form 
              className="relative w-full md:w-96"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchArticles}
                className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                Search
              </button>
            </form>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {locale === 'zh' ? cat.name_zh : cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(article => (
                <article 
                  key={article.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-[#339999]" />
                      <span className="text-xs font-medium text-[#339999] bg-[#339999]/10 px-2 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{article.readTime}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {locale === 'zh' && article.title_zh ? article.title_zh : article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {locale === 'zh' && article.summary_zh ? article.summary_zh : article.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{t.updated}: {article.updatedAt}</span>
                    <Link 
                      href={`/knowledge-base/${article.id}`}
                      className="flex items-center gap-1 text-sm text-[#339999] hover:text-[#2d8b8b] font-medium transition-colors"
                    >
                      {t.readMore}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {t.noArticlesFound}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
