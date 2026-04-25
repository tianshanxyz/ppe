'use client'

import { useState } from 'react'
import { FolderOpen, Search, ArrowRight, Tag, MapPin, Building, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const CASE_STUDIES = [
  {
    id: '1',
    title: '3M Safety Products CE Certification Journey',
    title_zh: '3M安全产品CE认证之路',
    company: '3M Safety Division',
    category: 'Safety Footwear',
    market: 'EU',
    challenge: 'Navigating complex EU PPE Regulation requirements for multiple product lines across different risk categories.',
    challenge_zh: '应对不同风险类别的多条产品线的复杂欧盟PPE法规要求。',
    solution: 'Systematic approach to conformity assessment with Notified Body BSI, implementing Module B + D for Category III products.',
    solution_zh: '与公告机构BSI合作，对第三类产品实施模块B+D的系统性合格评定方法。',
    outcome: 'Successfully obtained CE marking for 12 product lines within 8 months, reducing time-to-market by 30%.',
    outcome_zh: '8个月内成功获得12条产品线的CE认证，上市时间缩短30%。',
    tags: ['CE Marking', 'Category III', 'Notified Body'],
    duration: '8 months',
    cost: '€180,000'
  },
  {
    id: '2',
    title: 'Honeywell Respirator FDA 510(k) Approval',
    title_zh: '霍尼韦尔呼吸器FDA 510(k)批准',
    company: 'Honeywell Safety',
    category: 'Respiratory Protection',
    market: 'US',
    challenge: 'Meeting FDA 510(k) substantial equivalence requirements for N95 respirators with novel filter media.',
    challenge_zh: '满足使用新型过滤材料的N95呼吸器的FDA 510(k)实质等同性要求。',
    solution: 'Comprehensive performance testing against predicate device, with additional biocompatibility and filtration efficiency studies.',
    solution_zh: '对前代设备进行全面性能测试，并额外进行生物相容性和过滤效率研究。',
    outcome: '510(k) clearance obtained in 4 months, enabling US market entry ahead of competitors.',
    outcome_zh: '4个月内获得510(k)许可，比竞争对手更早进入美国市场。',
    tags: ['FDA', '510(k)', 'N95'],
    duration: '4 months',
    cost: '$120,000'
  },
  {
    id: '3',
    title: 'Ansell Protective Gloves NMPA Registration',
    title_zh: '安思尔防护手套NMPA注册',
    company: 'Ansell',
    category: 'Safety Gloves',
    market: 'China',
    challenge: 'Navigating China NMPA registration for Class II medical device gloves, including local type testing requirements.',
    challenge_zh: '应对二类医疗器械手套的中国NMPA注册，包括本地型式试验要求。',
    solution: 'Partnered with local registration agent, completed type testing at NMPA-accredited lab, and prepared Chinese labeling.',
    solution_zh: '与当地注册代理合作，在NMPA认可的实验室完成型式试验，并准备中文标签。',
    outcome: 'Registration certificate obtained in 14 months, establishing a strong presence in the Chinese medical glove market.',
    outcome_zh: '14个月内获得注册证书，在中国医用手套市场建立了强大的影响力。',
    tags: ['NMPA', 'China', 'Medical Device'],
    duration: '14 months',
    cost: '¥800,000'
  },
  {
    id: '4',
    title: 'MSA Safety Helmet UKCA Transition',
    title_zh: 'MSA安全头盔UKCA过渡',
    company: 'MSA Safety',
    category: 'Head Protection',
    market: 'UK',
    challenge: 'Transitioning from CE marking to UKCA marking for industrial safety helmets after Brexit.',
    challenge_zh: '英国脱欧后将工业安全头盔从CE认证过渡到UKCA认证。',
    solution: 'Early engagement with UK Approved Body, parallel assessment with EU Notified Body to maintain both CE and UKCA marks.',
    solution_zh: '早期与英国批准机构接触，与欧盟公告机构并行评估以同时维持CE和UKCA标志。',
    outcome: 'UKCA marking achieved while maintaining CE marking, ensuring uninterrupted market access in both EU and UK.',
    outcome_zh: '在维持CE认证的同时获得UKCA认证，确保在欧盟和英国的市场准入不受中断。',
    tags: ['UKCA', 'Brexit', 'Transition'],
    duration: '6 months',
    cost: '£45,000'
  }
]

export default function CaseStudiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('all')

  const markets = ['all', 'EU', 'US', 'China', 'UK']

  const filteredStudies = CASE_STUDIES.filter(study => {
    const matchesMarket = selectedMarket === 'all' || study.market === selectedMarket
    const matchesSearch = !searchQuery ||
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesMarket && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <FolderOpen className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Case Studies</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn from real-world PPE compliance experiences across different markets
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
                placeholder="Search case studies..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {markets.map(market => (
                <button
                  key={market}
                  onClick={() => setSelectedMarket(market)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMarket === market
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {market === 'all' ? 'All Markets' : market}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredStudies.length > 0 ? (
            <div className="space-y-8">
              {filteredStudies.map(study => (
                <div key={study.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Building className="w-5 h-5 text-[#339999]" />
                      <span className="text-sm font-medium text-[#339999]">{study.company}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{study.category}</span>
                      <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-1 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {study.market}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{study.title}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Challenge</h3>
                        <p className="text-gray-700">{study.challenge}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Solution</h3>
                        <p className="text-gray-700">{study.solution}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Outcome</h3>
                        <p className="text-gray-700">{study.outcome}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {study.tags.map(tag => (
                          <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Duration: {study.duration}</span>
                        <span>Cost: {study.cost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No case studies found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
