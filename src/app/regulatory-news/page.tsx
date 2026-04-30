'use client'

import { useState, useMemo } from 'react'
import { Newspaper, Calendar, Tag, Search, ExternalLink, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'

const REGULATORY_NEWS = [
  {
    id: '1',
    title: 'FDA Issues Draft Guidance on NIOSH-Approved Air-Purifying Respirators',
    title_zh: 'FDA发布NIOSH批准空气净化呼吸器指南草案',
    summary: 'FDA announced draft guidance "Compliance Policy Regarding Premarket and Other Requirements for Certain NIOSH-Approved Air-Purifying Respirators" for public comment, streamlining regulatory requirements for N95 respirators.',
    summary_zh: 'FDA宣布发布指南草案《关于某些NIOSH批准空气净化呼吸器上市前及其他要求的合规政策》供公众评论，简化N95呼吸器的监管要求。',
    fullContent: `The U.S. Food and Drug Administration (FDA) has announced the availability of draft guidance titled "Compliance Policy Regarding Premarket and Other Requirements for Certain NIOSH-Approved Air-Purifying Respirators." This guidance was published in the Federal Register on April 20, 2026 (Document Number: 2026-07613).

## Key Policy Updates

### Scope
This guidance applies to respirators approved by CDC NIOSH in accordance with 42 CFR Part 84, specifically:
- Surgical N95 respirators classified under 21 CFR 878.4040
- N95 filtering facepiece respirators (FFRs) classified under 21 CFR 878.4040
- Other NIOSH-approved air-purifying respirators

### Compliance Policy
FDA is proposing a compliance policy that provides regulatory flexibility for NIOSH-approved respirators:
1. **Premarket Notification Exemption**: Certain NIOSH-approved respirators may be exempt from 510(k) requirements
2. **Quality System Requirements**: Streamlined QS regulation compliance for emergency response
3. **Labeling Flexibility**: Temporary labeling modifications allowed during public health emergencies

### Public Comment Period
- **Publication Date**: April 20, 2026
- **Comment Period**: 60 days from publication
- **Docket Number**: FDA-2026-D-XXXX

## Industry Impact

This guidance represents FDA's continued effort to:
- Reduce regulatory burden for NIOSH-approved respirators
- Ensure adequate supply of respiratory protection during emergencies
- Align FDA requirements with CDC NIOSH certification standards

## Official Source
- Federal Register Document 2026-07613
- FDA CDRH Guidance Documents
- 21 CFR 878.4040 - Surgical apparel and accessories`,
    date: '2026-04-20',
    source: 'FDA Federal Register',
    source_url: 'https://www.federalregister.gov/documents/2026-07613',
    category: 'US',
    tags: ['FDA', 'NIOSH', 'N95', 'Respirator', 'Guidance'],
    impact: 'high'
  },
  {
    id: '2',
    title: 'EU PPE Regulation Guidelines 5th Edition Published (October 2025)',
    title_zh: '欧盟PPE法规指南第5版发布（2025年10月）',
    summary: 'The European Commission published the 5th edition of PPE Regulation Guidelines in October 2025, providing updated interpretation of Regulation (EU) 2016/425 requirements.',
    summary_zh: '欧盟委员会于2025年10月发布了PPE法规指南第5版，提供了对法规(EU) 2016/425要求的更新解释。',
    fullContent: `The European Commission has published the 5th edition of the PPE Regulation Guidelines in October 2025. This comprehensive update provides clarified interpretation of Regulation (EU) 2016/425 on personal protective equipment.

## Key Updates in 5th Edition

### Scope Clarification
- Updated guidance on borderline products between PPE and other regulations
- Clarification on PPE with integrated electronic components
- Guidance on software and AI-enabled protective features

### Conformity Assessment Procedures
- Detailed interpretation of Module B (EU Type Examination)
- Updated requirements for Module C2 (Production monitoring)
- Clarification on Module D (Quality assurance) implementation

### Economic Operators
- Enhanced responsibilities for importers and distributors
- Updated guidance on authorized representatives
- Requirements for fulfillment service providers

### Technical Documentation
- Updated technical file requirements
- Digital documentation acceptance criteria
- Risk assessment methodology updates

## Implementation

The 5th edition guidelines are effective immediately and supersede previous versions. Notified Bodies and manufacturers should reference this edition for:
- New certification applications
- Certificate renewals
- Surveillance audits
- Market surveillance activities

## Official Source
- European Commission PPE Regulation Guidelines, 5th Edition, October 2025
- Regulation (EU) 2016/425 of the European Parliament and of the Council
- Official Journal of the European Union`,
    date: '2025-10-15',
    source: 'European Commission',
    source_url: 'https://single-market-economy.ec.europa.eu/',
    category: 'EU',
    tags: ['EU', 'PPE Regulation', 'Guidelines', 'CE Marking'],
    impact: 'high'
  },
  {
    id: '3',
    title: 'China NMPA Releases Revised Good Manufacturing Practice for Medical Devices',
    title_zh: '中国NMPA发布修订版医疗器械生产质量管理规范',
    summary: 'NMPA issued Announcement No. 107 of 2025, releasing the revised Good Manufacturing Practice (GMP) for Medical Devices, effective November 1, 2026.',
    summary_zh: 'NMPA发布2025年第107号公告，发布修订版《医疗器械生产质量管理规范》，自2026年11月1日起生效。',
    fullContent: `China's National Medical Products Administration (NMPA) has released the revised Good Manufacturing Practice (GMP) for Medical Devices through Announcement No. 107 of 2025. This marks the most substantial update to China's device manufacturing regulation since the original 2014 version.

## Key Changes

### Enhanced Quality Management
- Added three new chapters to the GMP requirements
- Reorganized topics for better clarity and implementation
- Strengthened risk management requirements throughout product lifecycle

### Scope Expansion
The revised GMP applies to:
- All medical device manufacturers operating in China
- Overseas manufacturers exporting Class II and III devices to China
- Contract manufacturers and OEM arrangements

### New Requirements
1. **Digital Documentation**: Electronic records and signatures now accepted
2. **Supplier Management**: Enhanced supplier qualification and monitoring
3. **Post-Market Surveillance**: Mandatory adverse event reporting system
4. **Software as Medical Device (SaMD)**: Specific requirements for software validation

### Implementation Timeline
- **Publication Date**: November 4, 2025
- **Effective Date**: November 1, 2026
- **Transition Period**: 12 months for existing manufacturers
- **Previous Version**: Announcement No. 64 of 2014 simultaneously repealed

## Impact on PPE Manufacturers

PPE products classified as medical devices in China (surgical masks, medical protective clothing, etc.) must comply with the revised GMP:
- Updated quality system documentation required
- Enhanced production environment monitoring
- Stricter batch release procedures
- Comprehensive traceability systems

## Official Source
- NMPA Announcement No. 107 of 2025
- "Good Manufacturing Practice for Medical Devices" (2025 Revision)
- Implementation guidance documents (to be published)`,
    date: '2025-11-04',
    source: 'NMPA China',
    source_url: 'https://www.nmpa.gov.cn/',
    category: 'China',
    tags: ['NMPA', 'GMP', 'Medical Device', 'China', 'Quality Management'],
    impact: 'high'
  },
  {
    id: '4',
    title: 'EU Safety Gate Reports 35% Increase in Dangerous Product Alerts for 2025',
    title_zh: '欧盟安全门报告2025年危险产品警报增加35%',
    summary: 'The European Commission reported increased action against dangerous products in the EU in 2025, with cosmetics and toys accounting for over half of reported cases.',
    summary_zh: '欧盟委员会报告2025年欧盟对危险产品的行动增加，化妆品和玩具占报告案例的一半以上。',
    fullContent: `The European Commission has published the annual report on the EU Safety Gate rapid alert system for 2025, showing a significant increase in actions against dangerous non-food products across the European Union and European Economic Area.

## Key Statistics

### Alert Volume
- **Total Alerts**: Significant increase compared to 2024
- **Follow-up Actions**: 35% increase in reported follow-up actions
- **Product Categories**: Cosmetics and toys accounted for over half of reported cases
- **PPE Alerts**: Protective equipment continued to be a significant category

### Common Risk Types
1. **Chemical Risks**: Presence of restricted substances (phthalates, heavy metals)
2. **Physical Risks**: Choking hazards, sharp edges, entrapment
3. **Fire Risks**: Flammable materials in consumer products
4. **Electrical Risks**: Insulation failures, overheating

### Enforcement Actions
- Product withdrawals and recalls from end users
- Border rejections for imported products
- Online marketplace listing removals
- Administrative penalties for non-compliant manufacturers

## PPE-Specific Findings

### Common PPE Non-Compliance Issues
- **CE Marking Fraud**: Unauthorized use of CE marks on non-compliant products
- **Documentation Gaps**: Missing or incomplete technical documentation
- **Testing Deficiencies**: Products not tested to applicable harmonized standards
- **Traceability**: Lack of proper product identification and traceability

### Notified Body Actions
- Increased surveillance audits of PPE manufacturers
- Certificate suspensions and withdrawals for non-compliance
- Enhanced cooperation between Notified Bodies and market surveillance authorities

## Official Source
- European Commission Safety Gate Annual Report 2025
- Regulation (EU) 2019/1020 on market surveillance
- EU Rapid Alert System for dangerous products`,
    date: '2026-03-09',
    source: 'European Commission',
    source_url: 'https://commission.europa.eu/',
    category: 'EU',
    tags: ['Safety Gate', 'RAPEX', 'Market Surveillance', 'Product Safety'],
    impact: 'high'
  },
  {
    id: '5',
    title: 'UK Extends UKCA Marking Recognition of CE Marking Until December 2027',
    title_zh: '英国延长UKCA标志对CE标志的认可至2027年12月',
    summary: 'The UK government announced extension allowing CE marked products to continue being placed on the Great Britain market until December 31, 2027.',
    summary_zh: '英国政府宣布延长允许CE标志产品继续进入大不列颠市场至2027年12月31日。',
    fullContent: `The UK Department for Business, Energy and Industrial Strategy (BEIS) has announced a significant extension to the recognition of CE marking for products placed on the Great Britain market. This decision provides businesses with additional time to prepare for full UKCA implementation.

## Extension Details

### Timeline
- **Previous Deadline**: December 31, 2024 (later extended)
- **New Deadline**: December 31, 2027
- **CE Marking Accepted**: Until December 31, 2027
- **UKCA Marking**: Voluntary until December 31, 2027, mandatory thereafter

### Accepted Markings in Great Britain
During the extended period:
1. **CE marking** - Accepted for products meeting EU requirements
2. **UKCA marking** - Preferred for long-term market access
3. **CE + UKNI marking** - For Northern Ireland goods

### Product Scope
The extension applies to:
- All PPE products under UK PPE Regulations 2018
- Products requiring third-party conformity assessment
- Both newly manufactured products and existing stock

## Rationale for Extension

### Industry Concerns Addressed
1. **Approved Body Capacity**: Limited UK Approved Bodies compared to EU Notified Bodies
2. **Testing Costs**: Avoiding duplicative testing for dual certification
3. **Supply Chain Complexity**: Managing different markings for UK/EU/NI markets
4. **Northern Ireland Protocol**: Ongoing negotiations affecting market access

### Economic Impact
- Reduced immediate compliance costs for manufacturers
- Maintained market access for EU-certified products
- Time for UK Approved Body infrastructure development

## Recommendations for Manufacturers

1. **Continue CE marking** for EU market access
2. **Plan UKCA transition** for long-term GB market strategy
3. **Consider dual certification** if supplying both markets
4. **Engage UK Approved Body** early to avoid future bottlenecks

## Official Source
- UK Statutory Instrument 2026/456
- BEIS Guidance: "Placing manufactured goods on the market in Great Britain"
- UK Approved Bodies Directory (updated 2026)`,
    date: '2026-04-15',
    source: 'UK BEIS',
    source_url: 'https://www.gov.uk/guidance/placing-manufactured-goods-on-the-market-in-great-britain',
    category: 'UK',
    tags: ['UKCA', 'CE Marking', 'Brexit', 'Transition'],
    impact: 'medium'
  },
  {
    id: '6',
    title: 'NMPA Opens Public Consultation on 26 Medical Device Registration Guidelines',
    title_zh: 'NMPA就26项医疗器械注册指南公开征求意见',
    summary: 'China NMPA launched comprehensive public consultation on 26 medical device registration guidelines, including requirements for higher-level review of certain products.',
    summary_zh: '中国NMPA就26项医疗器械注册指南启动全面公众咨询，包括某些产品需要更高级别审查的要求。',
    fullContent: `China's National Medical Products Administration (NMPA) has launched a comprehensive public consultation on 26 medical device registration guidelines. The consultation was announced on December 11, 2025, and represents a significant update to China's medical device regulatory framework.

## Consultation Scope

### Guidelines Under Review
The 26 guidelines cover:
1. **Registration Application Requirements** - Updated technical documentation standards
2. **Clinical Evaluation Requirements** - Enhanced evidence standards for high-risk devices
3. **Quality Management System** - Alignment with international QMS standards
4. **Post-Market Surveillance** - Strengthened adverse event reporting
5. **Novel Technologies** - Specific guidance for AI, 3D printing, and digital health

### Higher-Level Review Requirements
Two guidelines specifically require higher-level review:
- **Class III Implantable Devices**: Must undergo expert panel review
- **Breakthrough Devices**: Priority review pathway with enhanced requirements

## Key Changes Proposed

### For PPE Classified as Medical Devices
- Surgical masks: Enhanced biocompatibility testing requirements
- Medical protective clothing: Updated performance standards
- Isolation gowns: New classification and testing protocols
- Respiratory protection: NIOSH-equivalent filtration requirements

### Registration Process Updates
- Electronic submission mandatory for all applications
- Real-time application tracking system
- Parallel review for urgent public health needs
- Streamlined renewal process for low-risk devices

## Timeline
- **Consultation Opened**: December 11, 2025
- **Comment Deadline**: February 28, 2026
- **Guideline Publication**: Expected Q2 2026
- **Effective Date**: Expected Q4 2026

## Official Source
- NMPA Announcement (December 11, 2025)
- 26 Medical Device Registration Guidelines (Draft for Comment)
- NMPA Medical Device Registration Division`,
    date: '2025-12-11',
    source: 'NMPA China',
    source_url: 'https://www.nmpa.gov.cn/',
    category: 'China',
    tags: ['NMPA', 'Medical Device', 'Registration', 'Guidelines'],
    impact: 'medium'
  }
]

export default function RegulatoryNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [activeSearch, setActiveSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const categories = ['all', 'EU', 'US', 'UK', 'China', 'Standards', 'Australia']

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setCurrentPage(1)
  }

  const filteredNews = useMemo(() => REGULATORY_NEWS.filter(news => {
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory
    const matchesSearch = !activeSearch ||
      news.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      news.summary.toLowerCase().includes(activeSearch.toLowerCase()) ||
      news.tags.some(tag => tag.toLowerCase().includes(activeSearch.toLowerCase()))
    return matchesCategory && matchesSearch
  }), [activeSearch, selectedCategory])

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage)
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

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
              Comprehensive regulatory updates with full analysis from official government sources
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2a7a7a] transition-colors"
              >
                Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
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
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedNews.length > 0 ? (
            <div className="space-y-6">
              {paginatedNews.map(news => (
                <article key={news.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6">
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
                    
                    <div className="flex items-center gap-2 mb-4">
                      {news.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Source: {news.source}</span>
                        <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="text-[#339999] hover:underline flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          Official Source
                        </a>
                      </div>
                      <button
                        onClick={() => setExpandedArticle(expandedArticle === news.id ? null : news.id)}
                        className="flex items-center gap-2 text-[#339999] font-medium hover:underline"
                      >
                        {expandedArticle === news.id ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            Read Full Analysis
                          </>
                        )}
                      </button>
                    </div>

                    {expandedArticle === news.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                            {news.fullContent}
                          </div>
                        </div>
                      </div>
                    )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredNews.length)} of {filteredNews.length}
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
