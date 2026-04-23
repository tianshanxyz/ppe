'use client'

import { useState } from 'react'
import { Newspaper, Calendar, Clock, ExternalLink, ChevronDown, ChevronUp, Search, Filter, Bookmark, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTargetMarkets } from '@/lib/ppe-data'

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

type NewsCategory = 'regulation' | 'market' | 'industry' | 'recall' | 'technology'

interface RegulatoryNews {
  id: string
  title: string
  summary: string
  content: string
  category: NewsCategory
  marketCode: string
  publishDate: string
  source: string
  sourceUrl?: string
  readTime: number
  bookmarked: boolean
  tags: string[]
}

const DEMO_NEWS: RegulatoryNews[] = [
  {
    id: '1',
    title: 'EU PPE Regulation: 2024 Update Guide for Manufacturers',
    summary: 'Comprehensive guide to the latest amendments in EU PPE Regulation (EU) 2016/425, including new conformity assessment requirements.',
    content: 'The European Commission has published updated guidance on the application of Regulation (EU) 2016/425 on personal protective equipment. Key changes include: 1) Updated Module B (EU Type Examination) procedures requiring more detailed technical documentation; 2) New requirements for post-market surveillance and vigilance reporting; 3) Clarified obligations for economic operators (manufacturers, importers, distributors); 4) Updated list of harmonized standards with new EN references. Manufacturers should review their technical files and quality management systems to ensure compliance with the updated requirements. The transition period ends December 31, 2024.',
    category: 'regulation',
    marketCode: 'EU',
    publishDate: '2024-03-15',
    source: 'European Commission DG GROW',
    sourceUrl: 'https://single-market-economy.ec.europa.eu',
    readTime: 8,
    bookmarked: true,
    tags: ['PPE Regulation', 'CE Marking', 'Conformity Assessment', 'Harmonized Standards'],
  },
  {
    id: '2',
    title: 'U.S. PPE Market Reaches $8.2B in 2024, Driven by Industrial Safety Demand',
    summary: 'Market analysis shows continued growth in U.S. PPE market with industrial safety segment leading at 35% market share.',
    content: 'The U.S. personal protective equipment market has reached $8.2 billion in 2024, representing a 6.8% year-over-year growth. Key findings: Industrial safety applications account for 35% of total market value; Healthcare PPE segment shows stabilization post-pandemic; Respiratory protection remains the fastest-growing category at 12% CAGR; Online distribution channels now represent 28% of sales. Regional analysis shows strongest growth in Texas, California, and Ohio manufacturing corridors. Import data indicates China remains the dominant supplier (45% share), followed by Mexico (18%) and domestic manufacturing (22%).',
    category: 'market',
    marketCode: 'US',
    publishDate: '2024-03-12',
    source: 'Grand View Research',
    sourceUrl: 'https://www.grandviewresearch.com',
    readTime: 5,
    bookmarked: false,
    tags: ['Market Analysis', 'Industrial Safety', 'Respiratory Protection', 'Import Data'],
  },
  {
    id: '3',
    title: 'China NMPA Streamlines PPE Registration Process with New Digital Platform',
    summary: 'NMPA launches online registration system reducing processing time by 40% for Class I and II medical PPE products.',
    content: 'The National Medical Products Administration (NMPA) has officially launched its new digital registration platform for medical devices including PPE. The platform introduces: 1) Online submission of technical documentation; 2) Real-time tracking of application status; 3) Electronic certificate issuance; 4) Automated preliminary review using AI-assisted document checking. Early adopters report average processing time reduction from 120 days to 72 days for Class I products, and from 180 days to 110 days for Class II products. The platform is mandatory for all new applications starting June 1, 2024.',
    category: 'regulation',
    marketCode: 'CN',
    publishDate: '2024-03-10',
    source: 'NMPA China',
    sourceUrl: 'https://www.nmpa.gov.cn',
    readTime: 6,
    bookmarked: false,
    tags: ['NMPA', 'Digital Platform', 'Registration', 'Medical PPE'],
  },
  {
    id: '4',
    title: 'UK Extends CE Marking Recognition for PPE Until End of 2024',
    summary: 'UK government confirms extension allowing CE marked PPE to continue being placed on Great Britain market.',
    content: 'The UK Department for Business and Trade has confirmed that CE marked PPE products will continue to be accepted on the Great Britain market until December 31, 2024. This extension provides additional time for manufacturers to transition to UKCA marking. Key points: Existing CE certificates from EU Notified Bodies remain valid; Products must still meet essential requirements of UK PPE Regulation; UKCA marking becomes mandatory January 1, 2025; Northern Ireland continues to accept CE marking under Windsor Framework. Manufacturers are advised to begin UKCA transition planning immediately to avoid market access disruptions.',
    category: 'regulation',
    marketCode: 'UK',
    publishDate: '2024-03-08',
    source: 'UK Department for Business',
    sourceUrl: 'https://www.gov.uk',
    readTime: 4,
    bookmarked: true,
    tags: ['UKCA', 'CE Marking', 'Brexit', 'Market Access'],
  },
  {
    id: '5',
    title: 'New ISO Standard for Smart PPE Published: ISO 45006:2024',
    summary: 'International standard for smart personal protective equipment establishes framework for connected safety devices.',
    content: 'ISO has published ISO 45006:2024, the first international standard specifically addressing smart PPE. The standard covers: 1) Safety requirements for PPE with embedded sensors and connectivity; 2) Data privacy and security requirements; 3) Electromagnetic compatibility; 4) Battery safety and charging systems; 5) Software validation and update procedures. The standard applies to PPE with integrated IoT capabilities including smart helmets, connected safety vests, and biometric monitoring devices. Compliance is voluntary but expected to become a market requirement within 2-3 years.',
    category: 'technology',
    marketCode: 'EU',
    publishDate: '2024-03-05',
    source: 'ISO',
    sourceUrl: 'https://www.iso.org',
    readTime: 7,
    bookmarked: false,
    tags: ['Smart PPE', 'IoT', 'ISO Standard', 'Connected Safety'],
  },
  {
    id: '6',
    title: 'Saudi Arabia Implements New SASO Technical Regulation for PPE',
    summary: 'SASO PPE Technical Regulation becomes mandatory with full enforcement starting April 2024.',
    content: 'The Saudi Standards, Metrology and Quality Organization (SASO) has announced full enforcement of the PPE Technical Regulation starting April 1, 2024. All PPE products must now have: 1) Valid SASO Quality Mark or IECEE Certificate with Saudi national difference; 2) Arabic labeling and user instructions; 3) Registration in the SABER electronic platform; 4) Product Certificate of Conformity (PCoC) and Shipment Certificate of Conformity (SCoC). Products without proper certification will be rejected at Saudi customs. The regulation covers all PPE categories including head, eye, respiratory, hand, foot, and body protection.',
    category: 'regulation',
    marketCode: 'GCC',
    publishDate: '2024-03-01',
    source: 'SASO',
    sourceUrl: 'https://www.saso.gov.sa',
    readTime: 5,
    bookmarked: false,
    tags: ['SASO', 'SABER', 'GCC', 'Market Access'],
  },
  {
    id: '7',
    title: 'Global PPE Supply Chain: 2024 Outlook and Risk Assessment',
    summary: 'Analysis of supply chain resilience, regional manufacturing shifts, and raw material price trends affecting PPE industry.',
    content: 'The global PPE supply chain continues to evolve in 2024 with several key trends: Raw material costs for non-woven fabrics have stabilized at 15% above pre-pandemic levels; Nitrile glove prices have declined 25% due to new manufacturing capacity in Southeast Asia; Shipping costs from Asia to Europe/North America normalized; Nearshoring trend accelerates with new manufacturing facilities in Mexico, Eastern Europe, and Vietnam; Quality control issues persist with 12% of imported PPE failing market surveillance checks in EU. Companies are advised to diversify supplier base and implement robust incoming quality inspection.',
    category: 'industry',
    marketCode: 'EU',
    publishDate: '2024-02-28',
    source: 'BIS Research',
    sourceUrl: 'https://www.bisresearch.com',
    readTime: 10,
    bookmarked: true,
    tags: ['Supply Chain', 'Manufacturing', 'Quality Control', 'Market Surveillance'],
  },
  {
    id: '8',
    title: 'FDA Issues Warning Letters to Three PPE Manufacturers for Quality Violations',
    summary: 'FDA takes enforcement action against manufacturers for GMP violations and inadequate quality management systems.',
    content: 'The U.S. Food and Drug Administration has issued warning letters to three PPE manufacturers following inspections that revealed significant violations of Current Good Manufacturing Practice (CGMP) requirements. Common violations include: Inadequate design controls and risk management files; Failure to establish and maintain corrective and preventive action (CAPA) procedures; Insufficient process validation for sterilization; Incomplete complaint handling and adverse event reporting. Companies have 15 working days to respond with corrective action plans. Products may be subject to detention without physical examination (DWPE) if violations are not addressed.',
    category: 'recall',
    marketCode: 'US',
    publishDate: '2024-02-25',
    source: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov',
    readTime: 6,
    bookmarked: false,
    tags: ['FDA', 'Warning Letter', 'GMP', 'Enforcement'],
  },
]

const CATEGORY_CONFIG: Record<NewsCategory, { label: string; color: string; bgColor: string }> = {
  regulation: { label: 'Regulation', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  market: { label: 'Market', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  industry: { label: 'Industry', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  recall: { label: 'Enforcement', color: 'text-red-700', bgColor: 'bg-red-100' },
  technology: { label: 'Technology', color: 'text-green-700', bgColor: 'bg-green-100' },
}

export default function RegulatoryNewsPage() {
  const markets = getTargetMarkets()

  const [news, setNews] = useState<RegulatoryNews[]>(DEMO_NEWS)
  const [filterCategory, setFilterCategory] = useState<NewsCategory | 'all'>('all')
  const [filterMarket, setFilterMarket] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  const filteredNews = news.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesMarket = filterMarket === 'all' || item.marketCode === filterMarket
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesBookmarked = !showBookmarkedOnly || item.bookmarked
    return matchesCategory && matchesMarket && matchesSearch && matchesBookmarked
  })

  const handleToggleBookmark = (id: string) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, bookmarked: !n.bookmarked } : n))
  }

  const handleShare = (item: RegulatoryNews) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(`${item.title}\n${item.summary}\n${window.location.href}`)
    }
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
                <Newspaper className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Regulatory News & Updates
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Curated regulatory intelligence, market insights, and industry updates for PPE professionals
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
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === 'all' ? 'bg-[#339999] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Topics
                </button>
                {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterCategory === cat ? 'bg-[#339999] text-white' : `${CATEGORY_CONFIG[cat].bgColor} ${CATEGORY_CONFIG[cat].color} hover:opacity-80`
                    }`}
                  >
                    {CATEGORY_CONFIG[cat].label}
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
                    placeholder="Search news..."
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

      {/* News Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredNews.map((item) => {
              const category = CATEGORY_CONFIG[item.category]
              const market = markets.find(m => m.code === item.marketCode)
              const isExpanded = expandedArticle === item.id

              return (
                <motion.article
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${category.bgColor} ${category.color}`}>
                        {category.label}
                      </span>
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                        {market?.flag_emoji} {market?.name}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.readTime} min read
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{item.summary}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {item.publishDate}
                        </span>
                        <span>Source: {item.source}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleBookmark(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(item)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedArticle(isExpanded ? null : item.id)}
                          className="px-3 py-1.5 text-[#339999] hover:bg-[#339999]/5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? 'Less' : 'Read More'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-6 bg-gray-50">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.content}</p>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Read Full Article
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              )
            })}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
