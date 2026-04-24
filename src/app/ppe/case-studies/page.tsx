'use client'

import { useState } from 'react'
import { BookOpen, Search, Filter, ChevronDown, ChevronUp, ExternalLink, Bookmark, Share2, CheckCircle2, XCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

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

type CaseStudyType = 'success' | 'failure' | 'lessons'
type CaseStudyOutcome = 'approved' | 'rejected' | 'delayed' | 'recalled'

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  type: CaseStudyType
  categoryId: string
  marketCode: string
  outcome: CaseStudyOutcome
  companyType: string
  timeline: string
  challenge: string
  approach: string
  result: string
  lessons: string[]
  keyTakeaways: string[]
  publishDate: string
  bookmarked: boolean
  tags: string[]
}

const DEMO_CASES: CaseStudy[] = [
  {
    id: '1',
    title: 'N95 Respirator CE Marking: From Application to Approval in 14 Weeks',
    subtitle: 'How a Chinese manufacturer successfully navigated the EU Type Examination process for FFP2 respirators',
    type: 'success',
    categoryId: 'respiratory-protection',
    marketCode: 'EU',
    outcome: 'approved',
    companyType: 'Manufacturer (SME)',
    timeline: '14 weeks',
    challenge: 'The manufacturer had previously failed CE marking due to incomplete technical documentation and inadequate quality management system documentation. The Notified Body rejected their initial application citing missing risk assessment and insufficient clinical evaluation.',
    approach: '1. Engaged a regulatory consultant to review and complete technical documentation; 2. Conducted gap analysis of existing QMS against EN ISO 13485 requirements; 3. Retested products at an EU-accredited lab with full EN 149:2001+A1:2009 testing; 4. Prepared comprehensive risk assessment following EN ISO 14971; 5. Submitted complete Module B application with all supporting evidence.',
    result: 'CE certificate issued by Notified Body 0459. Product successfully launched in EU market. Annual sales increased by €2.3M. No non-conformities found in first surveillance audit.',
    lessons: [
      'Technical documentation completeness is the #1 reason for NB rejection',
      'Pre-submission consultation with Notified Body can save 4-6 weeks',
      'Using an EU-accredited lab prevents retesting delays',
      'Risk assessment must cover all identified hazards, not just obvious ones',
    ],
    keyTakeaways: [
      'Budget 3-4 months for complete CE marking process',
      'Invest in regulatory expertise early',
      'Maintain complete technical file from day one',
    ],
    publishDate: '2026-03-01',
    bookmarked: true,
    tags: ['CE Marking', 'FFP2', 'Notified Body', 'Technical File'],
  },
  {
    id: '2',
    title: 'FDA 510(k) Rejection: Lessons from a Failed Surgical Mask Submission',
    subtitle: 'Analysis of common pitfalls that led to FDA refusal to accept a 510(k) application',
    type: 'failure',
    categoryId: 'respiratory-protection',
    marketCode: 'US',
    outcome: 'rejected',
    companyType: 'Manufacturer (Large)',
    timeline: '8 months to rejection',
    challenge: 'A major manufacturer submitted a 510(k) for a new surgical mask design with antimicrobial coating. FDA issued a Refuse to Accept (RTA) determination due to multiple deficiencies in the submission.',
    approach: '1. Submitted without predicate device comparison; 2. Biocompatibility testing did not include cytotoxicity evaluation of the coating; 3. Sterility validation was incomplete; 4. Labeling claims were not supported by clinical data; 5. Software documentation was missing for the lot tracking system.',
    result: '510(k) refused. Company had to restart the application process, costing an additional $180,000 and 6 months delay. Competitor launched similar product in the interim, capturing market share.',
    lessons: [
      'Always identify a suitable predicate device before starting 510(k)',
      'Biocompatibility testing must cover all patient-contacting materials',
      'FDA expects complete documentation - partial submissions waste time',
      'Labeling claims must be substantiated with evidence',
    ],
    keyTakeaways: [
      'Use FDA pre-submission (Q-Sub) meeting to validate strategy',
      'Engage FDA consultant for first-time submissions',
      'Budget for resubmission in timeline planning',
    ],
    publishDate: '2026-02-15',
    bookmarked: false,
    tags: ['FDA', '510(k)', 'Surgical Mask', 'RTA'],
  },
  {
    id: '3',
    title: 'UKCA Transition: How One Company Avoided Market Disruption',
    subtitle: 'Strategic planning enabled seamless transition from CE to UKCA marking before deadline',
    type: 'success',
    categoryId: 'safety-footwear',
    marketCode: 'UK',
    outcome: 'approved',
    companyType: 'Manufacturer (SME)',
    timeline: '6 months',
    challenge: 'With the UKCA marking deadline approaching, the manufacturer needed to transition their entire safety footwear range from CE to UKCA marking without disrupting supply to UK customers.',
    approach: '1. Identified UK Approved Body 12 months in advance; 2. Prepared UKCA-specific technical documentation parallel to CE files; 3. Scheduled UKCA audit during routine CE surveillance visit; 4. Updated labeling and packaging with dual marking; 5. Coordinated with UK importer on new compliance requirements.',
    result: 'All 12 product lines received UKCA certification with zero supply disruption. UK sales maintained at £1.8M annually. Company now positioned as reliable UK supplier while competitors faced stock shortages.',
    lessons: [
      'Start UKCA transition at least 12 months before deadline',
      'Dual marking strategy reduces risk during transition',
      'UK Approved Body capacity can be limited - book early',
      'Importer must be involved in compliance planning',
    ],
    keyTakeaways: [
      'Parallel preparation of CE and UKCA files saves time',
      'Consider Approved Body availability in planning',
      'Maintain buffer stock during certification transition',
    ],
    publishDate: '2026-02-28',
    bookmarked: true,
    tags: ['UKCA', 'CE Marking', 'Transition', 'Safety Footwear'],
  },
  {
    id: '4',
    title: 'NMPA Registration Delayed 8 Months Due to Testing Lab Issues',
    subtitle: 'Choosing the wrong testing laboratory caused cascading delays in China market entry',
    type: 'failure',
    categoryId: 'protective-gloves',
    marketCode: 'CN',
    outcome: 'delayed',
    companyType: 'Manufacturer (SME)',
    timeline: '18 months (vs 10 expected)',
    challenge: 'A European glove manufacturer selected a testing lab based on cost rather than NMPA recognition. Test reports were rejected by NMPA, requiring complete retesting.',
    approach: '1. Selected non-NMPA-recognized lab to save €3,000; 2. Submitted test reports with NMPA application; 3. NMPA rejected reports after 3-month review; 4. Had to retest at NMPA-recognized lab; 5. Additional delays due to lab queue and Chinese New Year.',
    result: 'Market entry delayed by 8 months. Lost first-mover advantage in premium segment. Additional costs of €45,000 for retesting and extended regulatory consulting.',
    lessons: [
      'Always verify lab accreditation with target market regulator',
      'Cost savings on testing can result in major delays',
      'NMPA only accepts reports from designated testing institutes',
      'Factor Chinese holidays into timeline planning',
    ],
    keyTakeaways: [
      'Verify testing lab recognition before contracting',
      'Budget for timeline contingencies',
      'Local regulatory expertise is essential for China',
    ],
    publishDate: '2026-01-20',
    bookmarked: false,
    tags: ['NMPA', 'Testing Lab', 'China', 'Protective Gloves'],
  },
  {
    id: '5',
    title: 'Product Recall Crisis: Managing a RAPEX Alert for Eye Protection',
    subtitle: 'How rapid response and corrective action turned a potential disaster into a quality improvement opportunity',
    type: 'lessons',
    categoryId: 'eye-protection',
    marketCode: 'EU',
    outcome: 'recalled',
    companyType: 'Manufacturer (SME)',
    timeline: '3 months resolution',
    challenge: 'A RAPEX alert was issued for safety glasses that failed impact resistance testing. The product had been on the market for 6 months with 50,000 units sold across 8 EU countries.',
    approach: '1. Immediate stop-sale and recall notification within 48 hours; 2. Root cause analysis identified material specification deviation; 3. Implemented 100% incoming inspection for lens material; 4. Redesigned product with enhanced frame retention; 5. Retested modified design at accredited lab; 6. Submitted corrective action report to authorities.',
    result: 'Recall completed with 85% product recovery. No injuries reported. Updated design received new CE certificate. Company implemented enhanced QMS procedures. Customer trust maintained through transparent communication.',
    lessons: [
      'Speed of response is critical in recall situations',
      'Transparent communication preserves customer trust',
      'Root cause analysis prevents recurrence',
      'Recalls can drive quality system improvements',
    ],
    keyTakeaways: [
      'Have recall procedure documented and tested',
      'Maintain traceability records for all batches',
      'Crisis communication plan is essential',
    ],
    publishDate: '2026-03-10',
    bookmarked: true,
    tags: ['RAPEX', 'Recall', 'Eye Protection', 'Crisis Management'],
  },
]

const TYPE_CONFIG: Record<CaseStudyType, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  success: { label: 'Success Story', color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  failure: { label: 'Failure Analysis', color: 'text-red-700', bgColor: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  lessons: { label: 'Lessons Learned', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Lightbulb className="w-4 h-4" /> },
}

const OUTCOME_CONFIG: Record<CaseStudyOutcome, { label: string; color: string }> = {
  approved: { label: 'Approved', color: 'text-green-600' },
  rejected: { label: 'Rejected', color: 'text-red-600' },
  delayed: { label: 'Delayed', color: 'text-orange-600' },
  recalled: { label: 'Recalled', color: 'text-red-600' },
}

export default function CaseStudiesPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [cases, setCases] = useState<CaseStudy[]>(DEMO_CASES)
  const [filterType, setFilterType] = useState<CaseStudyType | 'all'>('all')
  const [filterMarket, setFilterMarket] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCase, setExpandedCase] = useState<string | null>(null)
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  const filteredCases = cases.filter(c => {
    const matchesType = filterType === 'all' || c.type === filterType
    const matchesMarket = filterMarket === 'all' || c.marketCode === filterMarket
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesBookmarked = !showBookmarkedOnly || c.bookmarked
    return matchesType && matchesMarket && matchesSearch && matchesBookmarked
  })

  const handleToggleBookmark = (id: string) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, bookmarked: !c.bookmarked } : c))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <BookOpen className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Case Studies
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-world compliance stories, lessons learned, and best practices from the PPE industry
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'all' ? 'bg-[#339999] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Types
                </button>
                {(Object.keys(TYPE_CONFIG) as CaseStudyType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      filterType === type ? 'bg-[#339999] text-white' : `${TYPE_CONFIG[type].bgColor} ${TYPE_CONFIG[type].color} hover:opacity-80`
                    }`}
                  >
                    {TYPE_CONFIG[type].icon}
                    {TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterMarket}
                  onChange={(e) => setFilterMarket(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                >
                  <option value="all">All Markets</option>
                  {markets.map(m => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    showBookmarkedOnly ? 'bg-[#339999] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cases List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredCases.map((item) => {
              const type = TYPE_CONFIG[item.type]
              const outcome = OUTCOME_CONFIG[item.outcome]
              const market = markets.find(m => m.code === item.marketCode)
              const category = categories.find(c => c.id === item.categoryId)
              const isExpanded = expandedCase === item.id

              return (
                <motion.article
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${type.bgColor} ${type.color}`}>
                            {type.icon}
                            {type.label}
                          </span>
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {market?.flag_emoji} {market?.name}
                          </span>
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {category?.name}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${outcome.color} bg-gray-50`}>
                            Outcome: {outcome.label}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{item.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleToggleBookmark(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>Company: {item.companyType}</span>
                      <span>Timeline: {item.timeline}</span>
                      <span>Published: {item.publishDate}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setExpandedCase(isExpanded ? null : item.id)}
                      className="mt-4 text-[#339999] hover:text-[#2d8b8b] text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? 'Show Less' : 'Read Full Case Study'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-6 bg-gray-50 space-y-6">
                          {/* Challenge */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              The Challenge
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{item.challenge}</p>
                          </div>

                          {/* Approach */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#339999]" />
                              Approach Taken
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{item.approach}</p>
                          </div>

                          {/* Result */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Result
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{item.result}</p>
                          </div>

                          {/* Lessons */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              Key Lessons
                            </h4>
                            <ul className="space-y-2">
                              {item.lessons.map((lesson, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-5 h-5 bg-[#339999]/10 text-[#339999] rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  {lesson}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Takeaways */}
                          <div className="bg-[#339999]/5 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Actionable Takeaways</h4>
                            <ul className="space-y-1.5">
                              {item.keyTakeaways.map((takeaway, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <CheckCircle2 className="w-4 h-4 text-[#339999] mt-0.5 flex-shrink-0" />
                                  {takeaway}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              )
            })}

            {filteredCases.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No case studies found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
