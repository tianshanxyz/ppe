'use client'

import { useState } from 'react'
import { BookOpen, Search, ChevronRight, FileText, Shield, AlertCircle, CheckCircle2, ExternalLink, Bookmark, Tag } from 'lucide-react'
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

interface KnowledgeArticle {
  id: string
  title: string
  summary: string
  content: string
  categoryId: string
  marketCodes: string[]
  tags: string[]
  type: 'guide' | 'faq' | 'standard' | 'procedure'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  readTime: number
  bookmarked: boolean
}

const DEMO_ARTICLES: KnowledgeArticle[] = [
  {
    id: '1',
    title: 'Complete Guide to CE Marking for PPE',
    summary: 'Step-by-step guide to obtaining CE marking for all categories of personal protective equipment under Regulation (EU) 2016/425.',
    content: `## Overview

CE marking is mandatory for all PPE placed on the EU market. The process varies depending on the risk category of the product.

## PPE Categories

### Category I - Minimal Risk
- Examples: Gardening gloves, sunglasses
- Procedure: Internal production control (Module A)
- No Notified Body required

### Category II - Intermediate Risk
- Examples: Safety helmets, safety footwear, high-visibility clothing
- Procedure: EU Type Examination (Module B) + Internal production control (Module C2)
- Notified Body required for type examination

### Category III - Complex Risk
- Examples: Respiratory protection, chemical protective suits, fall protection
- Procedure: EU Type Examination (Module B) + Ongoing surveillance (Module C2, D, E, or H)
- Notified Body required for type examination and ongoing surveillance

## Step-by-Step Process

1. **Determine PPE Category**
   - Review Annex I of Regulation (EU) 2016/425
   - Identify all risks the PPE is designed to protect against

2. **Identify Applicable Harmonized Standards**
   - Check EU Official Journal for harmonized standards
   - Use EN standards referenced in the regulation

3. **Prepare Technical Documentation**
   - Product description and specifications
   - Design and manufacturing drawings
   - Risk assessment (EN ISO 14121-1)
   - Test reports from accredited laboratory
   - User instructions and labeling
   - Declaration of Conformity template

4. **Testing**
   - Conduct testing at ISO 17025 accredited laboratory
   - Ensure tests cover all claimed protection levels
   - Maintain test records for post-market surveillance

5. **Notified Body Engagement (Cat II & III)**
   - Select appropriate Notified Body for your product
   - Submit Module B application with complete technical file
   - Respond to NB queries promptly
   - Address any non-conformities identified

6. **Quality Management System (Cat III)**
   - Implement production quality control
   - Prepare for NB factory audits (Module D)
   - Maintain records of production tests

7. **Declaration of Conformity**
   - Issue DoC after completing all procedures
   - Include all required information per Annex IV
   - Maintain technical file for 10 years

8. **CE Marking**
   - Affix CE mark to product and packaging
   - Include Notified Body number for Cat II & III
   - Ensure marking is visible, legible, and indelible`,
    categoryId: 'respiratory-protection',
    marketCodes: ['EU'],
    tags: ['CE Marking', 'Regulation 2016/425', 'Notified Body', 'Technical File'],
    type: 'guide',
    difficulty: 'intermediate',
    readTime: 15,
    bookmarked: true,
  },
  {
    id: '2',
    title: 'FDA 510(k) Clearance for Medical PPE: Common Questions',
    summary: 'Frequently asked questions about FDA 510(k) premarket notification process for medical gloves, surgical masks, and other medical PPE.',
    content: `## What is a 510(k)?

A 510(k) is a premarket submission to FDA demonstrating that a device is substantially equivalent to a legally marketed predicate device.

## When is 510(k) Required for PPE?

- Surgical masks (Class II, 21 CFR 878.4040)
- Surgical gowns (Class II, 21 CFR 878.4040)
- Patient examination gloves (Class I, 21 CFR 880.6250)
- Surgeons' gloves (Class I, 21 CFR 878.4460)
- N95 respirators for medical use (Class II, 21 CFR 884.1730)

## Common Questions

### Q: How long does FDA 510(k) review take?
A: Standard review is 90 FDA days. Complex submissions may take 180 days. RTA (Refuse to Accept) screening takes 15 days.

### Q: What is a predicate device?
A: A legally marketed device to which you compare your new device. Must have same intended use and similar technological characteristics.

### Q: Do I need clinical data?
A: Most PPE 510(k)s do not require clinical studies. Performance testing and bench testing are usually sufficient.

### Q: What testing is required?
A: Depends on product type. Common tests include:
- Biocompatibility (ISO 10993 series)
- Sterility validation (if sterile)
- Performance testing per recognized standards
- Shelf life / stability testing

### Q: Can I use foreign test data?
A: Yes, if conducted at accredited laboratories. FDA accepts ISO 17025 accredited labs.

### Q: What is the user fee?
A: FY2026 standard fee is $23,520. Small businesses may qualify for reduced fee ($5,880).

### Q: Do I need a U.S. agent?
A: Yes, foreign manufacturers must designate a U.S. agent for FDA communications.`,
    categoryId: 'respiratory-protection',
    marketCodes: ['US'],
    tags: ['FDA', '510(k)', 'Medical PPE', 'Premarket Notification'],
    type: 'faq',
    difficulty: 'beginner',
    readTime: 8,
    bookmarked: false,
  },
  {
    id: '3',
    title: 'Understanding EN Standards for Respiratory Protection',
    summary: 'Comprehensive overview of EN 149, EN 143, EN 405 and other key European standards for respiratory protective devices.',
    content: `## EN 149:2001+A1:2009 - Filtering Facepieces

### Scope
Covers particle filtering half masks for protection against particles.

### Classes
- **FFP1**: Filters at least 80% of airborne particles. For non-toxic dusts.
- **FFP2**: Filters at least 94% of airborne particles. For fine dusts and mists.
- **FFP3**: Filters at least 99% of airborne particles. For toxic particles and asbestos.

### Key Tests
- Total inward leakage (TIL)
- Penetration of filter material
- Breathing resistance (inhalation/exhalation)
- Clogging resistance (dolomite dust test)
- Flammability
- Carbon dioxide content of inhalation air

## EN 143:2000+A1:2006 - Particle Filters

### Classes
- P1: 80% filtration
- P2: 94% filtration
- P3: 99.95% filtration

### Application
Used with half masks (EN 140) or full-face masks (EN 136).

## EN 405:2001+A1:2009 - Valved Filtering Half Masks

Covers masks with exhalation valves for protection against gases and/or particles.

## EN 1827:1999+A1:2009 - Half Masks Without Valve

Low breathing resistance option for particle protection.

## Marking Requirements

All respiratory protection must be marked with:
- Manufacturer name/trademark
- Model/identification number
- CE mark + Notified Body number (for Cat III)
- Standard number (e.g., EN 149:2001+A1:2009)
- Protection class (FFP1/FFP2/FFP3)
- Year of manufacture
- Storage life / expiry date

## Maintenance

- Replace filters according to manufacturer instructions
- Store in original packaging away from contaminants
- Inspect before each use
- Do not clean or reuse disposable masks`,
    categoryId: 'respiratory-protection',
    marketCodes: ['EU', 'UK'],
    tags: ['EN Standards', 'Respiratory', 'FFP2', 'FFP3', 'Testing'],
    type: 'standard',
    difficulty: 'advanced',
    readTime: 12,
    bookmarked: true,
  },
  {
    id: '4',
    title: 'NMPA Registration Process for Medical PPE in China',
    summary: 'Detailed walkthrough of China NMPA registration requirements, documentation, and timeline for medical protective equipment.',
    content: `## Regulatory Framework

Medical PPE in China is regulated under:
- Regulations on Supervision and Administration of Medical Devices
- Medical Device Classification Catalogue
- Technical Review Guidelines

## Classification

### Class I Medical Devices
- Simple bandages
- Examination gloves (non-sterile)
- Registration via filing (备案)

### Class II Medical Devices
- Surgical masks
- Protective clothing
- Sterile examination gloves
- Registration via application (注册)

### Class III Medical Devices
- High-risk protective equipment
- Registration via application with clinical data

## Registration Process (Class II)

### Step 1: Product Testing
- Testing at NMPA-designated institute
- Tests per Chinese standards (GB)
- Timeline: 2-4 months

### Step 2: Clinical Evaluation
- Clinical evaluation report (CER)
- May require clinical trials for novel products
- Timeline: 3-12 months

### Step 3: Application Submission
- Submit via NMPA eRPS system
- Technical documentation in Chinese
- Timeline: 90 working days review

### Step 4: Factory Inspection
- GMP inspection for Class II/III
- Quality system assessment
- Timeline: 1-2 months

### Step 5: Certificate Issuance
- Medical Device Registration Certificate
- Valid for 5 years
- Renewal required before expiry

## Required Documentation

1. Product technical requirements (产品技术要求)
2. Test reports from designated institute
3. Risk analysis report
4. Clinical evaluation report
5. Manufacturing information
6. Product说明书 (instructions for use)
7. Labeling samples
8. Quality management system documentation

## Key Considerations

- All documents must be in Chinese
- Foreign manufacturers need China agent
- NMPA only accepts reports from designated labs
- Factory inspection is mandatory
- Annual self-reporting required`,
    categoryId: 'respiratory-protection',
    marketCodes: ['CN'],
    tags: ['NMPA', 'China', 'Registration', 'Medical Device'],
    type: 'procedure',
    difficulty: 'intermediate',
    readTime: 10,
    bookmarked: false,
  },
  {
    id: '5',
    title: 'UKCA Marking: Post-Brexit Compliance Guide',
    summary: 'Everything you need to know about UKCA marking requirements for PPE placed on the Great Britain market.',
    content: `## What is UKCA?

UKCA (UK Conformity Assessed) is the UK product marking required for goods placed on the market in Great Britain (England, Wales, Scotland).

## Applicable Regulation

UK PPE Regulation 2016/425 (as amended) - retained EU law post-Brexit.

## UKCA vs CE Marking

| Aspect | CE Marking | UKCA Marking |
|--------|-----------|--------------|
| Market | EU/EEA | Great Britain |
| Regulation | (EU) 2016/425 | UK 2016/425 |
| Assessment Body | Notified Body (EU) | Approved Body (UK) |
| Standards | EN standards | Designated standards (BS EN) |
| DoC | EU Declaration | UK Declaration |

## Transition Period

- CE marking accepted until December 31, 2026
- UKCA marking mandatory from January 1, 2027
- Northern Ireland continues to accept CE marking (Windsor Framework)

## Steps to UKCA Marking

1. **Determine Product Category**
   - Same categories as EU: I, II, III
   - Same risk assessment criteria

2. **Identify Applicable Standards**
   - Use designated standards published by UK government
   - Most are BS EN (identical to EN standards)

3. **Engage UK Approved Body**
   - Must be UK-based for Cat II & III
   - Check UKAS accreditation
   - Not all EU Notified Bodies have UK approval

4. **Technical Documentation**
   - Same content as EU technical file
   - Must be available in English
   - UK Responsible Person required for non-UK manufacturers

5. **Declaration of Conformity**
   - UK-specific DoC template
   - Reference UK legislation, not EU
   - Include UK Approved Body number

6. **UKCA Marking**
   - Minimum height: 5mm
   - Must be visible, legible, indelible
   - Include Approved Body number for Cat II & III

## UK Responsible Person

Non-UK manufacturers must appoint a UK Responsible Person who:
- Keeps technical documentation
- Cooperates with market surveillance
- Informs authorities of non-conformities

## Dual Marking Strategy

Many manufacturers maintain both CE and UKCA:
- Separate certificates from EU NB and UK AB
- Parallel technical files
- Dual labeling on product/packaging`,
    categoryId: 'safety-footwear',
    marketCodes: ['UK'],
    tags: ['UKCA', 'Brexit', 'Approved Body', 'Great Britain'],
    type: 'guide',
    difficulty: 'intermediate',
    readTime: 10,
    bookmarked: true,
  },
]

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  guide: { label: 'Guide', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <BookOpen className="w-4 h-4" /> },
  faq: { label: 'FAQ', color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  standard: { label: 'Standard', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Shield className="w-4 h-4" /> },
  procedure: { label: 'Procedure', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <FileText className="w-4 h-4" /> },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'text-green-600' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-600' },
  advanced: { label: 'Advanced', color: 'text-red-600' },
}

export default function KnowledgeBasePage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [articles, setArticles] = useState<KnowledgeArticle[]>(DEMO_ARTICLES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || article.categoryId === selectedCategory
    const matchesType = selectedType === 'all' || article.type === selectedType
    const matchesBookmarked = !showBookmarkedOnly || article.bookmarked
    return matchesSearch && matchesCategory && matchesType && matchesBookmarked
  })

  const handleToggleBookmark = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a))
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
              Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive guides, standards, FAQs, and procedures for PPE compliance professionals
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Search & Filters */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#339999] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
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
      </section>

      {/* Articles Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredArticles.map((article) => {
              const type = TYPE_CONFIG[article.type]
              const difficulty = DIFFICULTY_CONFIG[article.difficulty]
              const category = categories.find(c => c.id === article.categoryId)
              const isExpanded = expandedArticle === article.id

              return (
                <motion.article
                  key={article.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${type.bgColor} ${type.color}`}>
                          {type.icon}
                          {type.label}
                        </span>
                        <span className={`text-xs font-medium ${difficulty.color}`}>
                          {difficulty.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {article.readTime} min
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleBookmark(article.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          article.bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{article.summary}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {article.marketCodes.map(code => {
                          const market = markets.find(m => m.code === code)
                          return market ? (
                            <span key={code} className="flex items-center gap-1">
                              {market.flag_emoji} {market.name}
                            </span>
                          ) : null
                        })}
                      </div>
                      <button
                        onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                        className="text-[#339999] hover:text-[#2d8b8b] text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? 'Collapse' : 'Read Article'}
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
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
                          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                            {article.content.split('\n').map((line, idx) => {
                              if (line.startsWith('## ')) {
                                return <h2 key={idx} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h2>
                              }
                              if (line.startsWith('### ')) {
                                return <h3 key={idx} className="text-base font-semibold text-gray-900 mt-3 mb-1">{line.replace('### ', '')}</h3>
                              }
                              if (line.startsWith('- ')) {
                                return <li key={idx} className="ml-4 text-sm">{line.replace('- ', '')}</li>
                              }
                              if (line.startsWith('| ')) {
                                return <div key={idx} className="text-sm font-mono bg-white p-2 rounded my-2 overflow-x-auto">{line}</div>
                              }
                              if (line.trim() === '') {
                                return <div key={idx} className="h-2" />
                              }
                              return <p key={idx} className="text-sm leading-relaxed">{line}</p>
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              )
            })}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
