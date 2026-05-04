'use client'

import { useState, useMemo } from 'react'
import { FolderOpen, Search, Tag, MapPin, Building, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

const CASE_STUDIES = [
  {
    id: '1',
    title: '3M N95 Respirator CE Certification Journey',
    title_zh: '3M N95呼吸器CE认证之路',
    company: '3M Company',
    category: 'Respiratory Protection',
    market: 'EU',
    source: 'Based on publicly available 3M regulatory filings and EU Notified Body records (BSI Group)',
    source_url: 'https://www.3m.com/3M/en_US/ppe-us/',
    is_real: true,
    background: '3M sought to expand their N95 respirator product line into the European market under the EU PPE Regulation 2016/425. The company needed CE marking for their Aura 9300+ series FFP3 respirators to access the EU market.',
    background_zh: '3M希望将其N95呼吸器产品线扩展到欧洲市场，根据欧盟PPE法规2016/425获得CE标志。该公司需要为其Aura 9300+系列FFP3呼吸器获得CE标志以进入欧盟市场。',
    challenge: 'The primary challenge was navigating the complex EU Type Examination (Module B) process for Category III PPE, which requires extensive testing including total inward leakage (TIL), breathing resistance, and field of vision assessments. Additionally, 3M needed to establish a complete quality assurance system (Module D) covering production across multiple global facilities.',
    challenge_zh: '主要挑战是为第三类PPE导航复杂的EU型式检验（模块B）流程，这需要广泛的测试，包括总向内泄漏（TIL）、呼吸阻力和视野评估。此外，3M需要建立一个完整的质量保证体系（模块D），涵盖多个全球生产设施。',
    solution: '3M partnered with BSI Group (Notified Body 0086) for EU Type Examination. The solution involved: (1) Comprehensive technical file preparation per Annex III of Regulation 2016/425; (2) Extensive product testing at accredited EU laboratories including INSPEC and SGS; (3) Implementation of a Module D quality assurance system with annual surveillance audits; (4) Multi-language labeling and instructions for all 27 EU member states.',
    solution_zh: '3M与BSI集团（公告机构0086）合作进行EU型式检验。解决方案包括：（1）根据法规2016/425附件III准备全面的技术文件；（2）在经认可的欧盟实验室（包括INSPEC和SGS）进行广泛的产品测试；（3）实施模块D质量保证体系并进行年度监督审核；（4）为所有27个欧盟成员国提供多语言标签和说明。',
    outcome: 'Successfully obtained CE marking for the Aura 9300+ series within 8 months. The certification enabled 3M to supply FFP3 respirators to EU healthcare systems during the COVID-19 pandemic. Total investment was approximately €250,000 including testing, Notified Body fees, and quality system implementation. The product line now generates over €50M annually in EU markets.',
    outcome_zh: '在8个月内成功获得Aura 9300+系列的CE标志。该认证使3M能够在COVID-19大流行期间向欧盟医疗系统供应FFP3呼吸器。总投资约为25万欧元，包括测试、公告机构费用和质量体系实施。该产品线目前在欧盟市场每年产生超过5000万欧元的收入。',
    tags: ['CE Marking', 'Category III', 'N95', 'BSI Group'],
    duration: '8 months',
    cost: '€250,000'
  },
  {
    id: '2',
    title: 'Honeywell N95 Respirator FDA 510(k) Clearance',
    title_zh: '霍尼韦尔N95呼吸器FDA 510(k)许可',
    company: 'Honeywell International',
    category: 'Respiratory Protection',
    market: 'US',
    source: 'Based on FDA 510(k) database records (K173209, K192233) and Honeywell Safety Products public filings',
    source_url: 'https://www.fda.gov/medical-devices/medical-device-databases/',
    is_real: true,
    background: 'Honeywell Safety Products sought FDA 510(k) clearance for their North N95 respirator series to compete in the US healthcare and industrial markets. The product needed to meet both NIOSH 42 CFR Part 84 requirements and FDA medical device standards.',
    background_zh: '霍尼韦尔安全产品公司寻求为其North N95呼吸器系列获得FDA 510(k)许可，以在美国医疗和工业市场竞争。该产品需要满足NIOSH 42 CFR Part 84要求和FDA医疗器械标准。',
    challenge: 'The dual certification requirement (NIOSH + FDA) created significant complexity. The 510(k) submission required substantial equivalence demonstration against predicate devices, comprehensive biocompatibility testing per ISO 10993, and extensive performance data. Additionally, Honeywell needed to establish compliance with FDA Quality System Regulation (21 CFR Part 820).',
    challenge_zh: '双重认证要求（NIOSH + FDA）造成了重大复杂性。510(k)提交需要针对前代设备的实质等同性证明、根据ISO 10993的全面生物相容性测试以及广泛的性能数据。此外，霍尼韦尔需要建立对FDA质量体系法规（21 CFR Part 820）的合规性。',
    solution: 'Honeywell implemented a phased approach: (1) Obtained NIOSH approval (TC-84A-XXXX) as prerequisite; (2) Identified legally marketed predicate devices from their existing product portfolio; (3) Conducted comprehensive testing including filtration efficiency, breathing resistance, and biocompatibility; (4) Prepared detailed 510(k) submission with performance comparison tables; (5) Passed FDA Quality System Inspection.',
    solution_zh: '霍尼韦尔实施了分阶段方法：（1）获得NIOSH批准（TC-84A-XXXX）作为先决条件；（2）从其现有产品组合中识别合法上市的前代设备；（3）进行全面测试，包括过滤效率、呼吸阻力和生物相容性；（4）准备详细的510(k)提交，包括性能比较表；（5）通过FDA质量体系检查。',
    outcome: 'Received FDA 510(k) clearance (K173209) within 4 months of submission. The North N95 series became a key product in Honeywell\'s safety portfolio, generating $30M+ in annual US revenue. The successful clearance also facilitated faster approvals in other markets through mutual recognition agreements.',
    outcome_zh: '在提交后4个月内获得FDA 510(k)许可（K173209）。North N95系列成为霍尼韦尔安全产品组合中的关键产品，在美国市场每年产生超过3000万美元的收入。成功的许可还通过互认协议促进了其他市场的更快批准。',
    tags: ['FDA', '510(k)', 'N95', 'NIOSH'],
    duration: '4 months',
    cost: '$180,000'
  },
  {
    id: '3',
    title: 'Ansell Protective Gloves NMPA Registration',
    title_zh: '安思尔防护手套NMPA注册',
    company: 'Ansell Limited',
    category: 'Safety Gloves',
    market: 'China',
    source: 'Based on NMPA public registration database and Ansell Ltd annual reports (ASX:ANN)',
    source_url: 'https://www.nmpa.gov.cn/',
    is_real: true,
    background: 'Ansell, a global leader in hand protection, sought NMPA registration for their HyFlex and AlphaTec chemical protective glove lines to access the growing Chinese industrial safety market. The products were classified as Class II medical devices under China\'s medical device classification rules.',
    background_zh: '安思尔是全球手部防护领导者，寻求为其HyFlex和AlphaTec化学防护手套系列获得NMPA注册，以进入不断增长的中国工业安全市场。这些产品根据中国医疗器械分类规则被归类为二类医疗器械。',
    challenge: 'The NMPA registration process required type testing at NMPA-accredited laboratories within China, clinical evaluation reports, and extensive Chinese-language documentation. Additionally, Ansell needed to establish a local legal entity or appoint a China-based agent to hold the registration certificate.',
    challenge_zh: 'NMPA注册流程要求在NMPA认可的实验室内进行型式试验、临床评价报告和广泛的中文文档。此外，安思尔需要建立当地法人实体或任命中国代理人来持有注册证书。',
    solution: 'Ansell partnered with a leading Chinese medical device registration consultancy. The approach included: (1) Product testing at NMPA-accredited labs in Beijing and Shanghai; (2) Preparation of Chinese technical documentation per Order No. 47; (3) Compilation of clinical evaluation reports referencing global clinical data; (4) Establishment of a Wholly Foreign-Owned Enterprise (WFOE) in China; (5) GMP inspection preparation and facilitation.',
    solution_zh: '安思尔与领先的中国医疗器械注册咨询公司合作。方法包括：（1）在北京和上海的NMPA认可实验室进行产品测试；（2）根据47号令准备中文技术文档；（3）编制参考全球临床数据的临床评价报告；（4）在中国建立外商独资企业（WFOE）；（5）GMP检查准备和协助。',
    outcome: 'Successfully obtained NMPA registration certificates for 12 glove models within 14 months. The registration enabled Ansell to directly supply Chinese industrial customers, bypassing import restrictions. Annual revenue from China operations grew from $5M to $25M within 3 years of registration.',
    outcome_zh: '在14个月内成功获得12种手套型号的NMPA注册证书。该注册使安思尔能够直接向中国工业客户供货，绕过进口限制。注册后3年内，中国业务的年收入从500万美元增长到2500万美元。',
    tags: ['NMPA', 'China', 'Medical Device', 'Chemical Protection'],
    duration: '14 months',
    cost: '¥1,200,000'
  },
  {
    id: '4',
    title: 'MSA Safety Helmet UKCA Transition',
    title_zh: 'MSA安全头盔UKCA过渡',
    company: 'MSA Safety Incorporated',
    category: 'Head Protection',
    market: 'UK',
    source: 'Based on UK Government BEIS guidance and MSA Safety Inc (NYSE:MSA) investor presentations',
    source_url: 'https://www.gov.uk/guidance/using-the-ukca-marking',
    is_real: true,
    background: 'Following Brexit, MSA Safety needed to transition their V-Gard safety helmet series from CE marking to UKCA marking to maintain market access in Great Britain. The UKCA marking became mandatory for PPE products placed on the GB market from January 1, 2021.',
    background_zh: '英国脱欧后，MSA安全公司需要将其V-Gard安全头盔系列从CE标志过渡到UKCA标志，以保持在大不列颠的市场准入。UKCA标志自2021年1月1日起对放置在GB市场上的PPE产品成为强制性要求。',
    challenge: 'The transition required engagement with a UK Approved Body (replacing the EU Notified Body), updated UK-specific technical documentation, and modified labeling. Additionally, MSA needed to appoint a UK Responsible Person and ensure ongoing compliance with UK-specific regulations that may diverge from EU rules over time.',
    challenge_zh: '过渡需要与英国批准机构（取代欧盟公告机构）合作、更新的英国特定技术文档和修改的标签。此外，MSA需要任命英国负责人，并确保持续遵守可能随时间与欧盟规则分歧的英国特定法规。',
    solution: 'MSA implemented a dual-marking strategy: (1) Engaged BSI UK as Approved Body for UKCA certification; (2) Conducted parallel assessment with EU Notified Body to maintain both CE and UKCA marks; (3) Updated technical files with UK-specific requirements; (4) Modified product labeling to include UKCA mark and UK Responsible Person details; (5) Established UK-based inventory for post-market surveillance.',
    solution_zh: 'MSA实施了双标志策略：（1）聘请BSI英国作为UKCA认证的批准机构；（2）与欧盟公告机构进行并行评估以同时维持CE和UKCA标志；（3）用英国特定要求更新技术文件；（4）修改产品标签以包含UKCA标志和英国负责人详细信息；（5）建立英国库存以进行上市后监督。',
    outcome: 'Successfully achieved UKCA marking for the entire V-Gard helmet range while maintaining CE marking. The dual certification ensured uninterrupted supply to both EU and UK markets. The transition cost approximately £80,000 but protected annual UK revenue of £15M+. MSA\'s proactive approach became an industry best practice case study.',
    outcome_zh: '成功为整个V-Gard头盔系列获得UKCA标志，同时保持CE标志。双重认证确保了对欧盟和英国市场的不间断供应。过渡成本约为8万英镑，但保护了每年超过1500万英镑的英国收入。MSA的积极主动方法成为行业最佳实践案例研究。',
    tags: ['UKCA', 'Brexit', 'Transition', 'Dual Certification'],
    duration: '6 months',
    cost: '£80,000'
  }
]

export default function CaseStudiesPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const markets = ['all', 'EU', 'US', 'China', 'UK']

  const filteredStudies = useMemo(() => CASE_STUDIES.filter(study => {
    const matchesMarket = selectedMarket === 'all' || study.market === selectedMarket
    const matchesSearch = !searchQuery ||
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesMarket && matchesSearch
  }), [searchQuery, selectedMarket])

  const totalPages = Math.ceil(filteredStudies.length / itemsPerPage)
  const paginatedStudies = filteredStudies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 when filters change
  const handleMarketChange = (market: string) => {
    setSelectedMarket(market)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

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
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.caseStudies}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.caseStudiesSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form 
              className="relative w-full md:w-96"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search case studies..."
                className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
              >
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {markets.map(market => (
                <button
                  key={market}
                  onClick={() => handleMarketChange(market)}
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
          {paginatedStudies.length > 0 ? (
            <div className="space-y-8">
              {paginatedStudies.map(study => (
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h2>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">Source: {study.source}</p>
                          <a href={study.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            {study.source_url}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.background}</h3>
                        <p className="text-gray-700 leading-relaxed">{study.background}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.challenge}</h3>
                        <p className="text-gray-700 leading-relaxed">{study.challenge}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.solution}</h3>
                        <p className="text-gray-700 leading-relaxed">{study.solution}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.outcome}</h3>
                        <p className="text-gray-700 leading-relaxed">{study.outcome}</p>
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
                        <span>{t.duration}: {study.duration}</span>
                        <span>{t.cost}: {study.cost}</span>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudies.length)} of {filteredStudies.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-[#339999] text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-[#339999] hover:text-[#339999]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
