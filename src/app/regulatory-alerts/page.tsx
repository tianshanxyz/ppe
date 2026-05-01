'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Bell, Search, AlertTriangle, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

export interface RegulatoryAlert {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  market: string
  date: string
  summary: string
  action: string
  reference: string
  fullText: string
}

export const REGULATORY_ALERTS: RegulatoryAlert[] = [
  {
    id: '1',
    title: 'FDA Draft Guidance on NIOSH-Approved Respirators - Comment Period Closing',
    severity: 'critical',
    market: 'US',
    date: '2026-06-19',
    summary: 'The 60-day public comment period for FDA draft guidance on NIOSH-approved air-purifying respirators closes on June 19, 2026. Manufacturers must submit comments or prepare for final guidance implementation.',
    action: 'Submit comments to FDA docket FDA-2026-D-XXXX before June 19, 2026. Review current 510(k) submissions for potential impact.',
    reference: 'Federal Register Document 2026-07613',
    fullText: `The U.S. Food and Drug Administration (FDA) has issued a draft guidance document addressing the regulatory pathway for NIOSH-approved air-purifying respirators used in healthcare settings. This guidance clarifies the 510(k) submission requirements for respirators that hold NIOSH approval under 42 CFR Part 84 and are also intended for surgical use.

The draft guidance introduces several key changes from previous policy. First, it establishes updated performance criteria for filter efficiency testing, aligning FDA requirements more closely with NIOSH testing protocols. Second, it provides new recommendations for biocompatibility testing specific to respirator materials that contact the user's skin and respiratory tract. Third, the guidance addresses labeling requirements for respirators marketed for both industrial and healthcare use.

Manufacturers should note that once finalized, this guidance will supersede the FDA's previous enforcement policies issued during the COVID-19 public health emergency. Companies that obtained Emergency Use Authorizations (EUAs) for respirators will need to transition to standard 510(k) clearance within the timeline specified in the final guidance. The comment period closing on June 19, 2026, represents the last opportunity for industry stakeholders to provide feedback before the guidance is finalized.`
  },
  {
    id: '2',
    title: 'China NMPA GMP Requirements Effective November 1, 2026',
    severity: 'high',
    market: 'China',
    date: '2026-11-01',
    summary: 'NMPA Announcement No. 107 of 2025 revises Good Manufacturing Practice for Medical Devices. All PPE manufacturers exporting to China must comply by November 1, 2026.',
    action: 'Update quality management system documentation. Prepare for enhanced production environment monitoring and traceability requirements.',
    reference: 'NMPA Announcement No. 107 of 2025',
    fullText: `The National Medical Products Administration (NMPA) has published Announcement No. 107 of 2025, which introduces comprehensive revisions to the Good Manufacturing Practice (GMP) for Medical Devices. These revised requirements will take effect on November 1, 2026, and apply to all domestic and foreign manufacturers of medical devices, including PPE classified as medical devices under China's regulatory framework.

The revised GMP introduces significant changes in three major areas. First, production environment monitoring requirements have been substantially enhanced. Manufacturers must now implement real-time environmental monitoring systems in cleanrooms and controlled environments, with automated data logging and alert mechanisms. The acceptable limits for particulate and microbial contamination have been tightened, particularly for products classified as Class II and III medical devices.

Second, the traceability requirements have been expanded. Manufacturers must implement a comprehensive product traceability system that tracks raw materials from receipt through production, testing, and distribution. Each batch of finished product must be traceable to specific raw material lots, production equipment, operators, and environmental conditions. Electronic record-keeping is now mandatory, and records must be retained for a minimum of the product's shelf life plus two years.

Third, the revised GMP introduces new requirements for supplier qualification and management. Manufacturers must conduct on-site audits of critical raw material suppliers at least once every two years, and maintain documented evidence of supplier qualification activities. Foreign manufacturers must ensure their China Authorized Representatives have access to all required documentation for regulatory inspections.`
  },
  {
    id: '3',
    title: 'EU Safety Gate: Increased Market Surveillance on PPE CE Marking',
    severity: 'high',
    market: 'EU',
    date: '2026-04-30',
    summary: 'European Commission reports 35% increase in dangerous product alerts. PPE products with fraudulent CE marking are priority target for market surveillance authorities.',
    action: 'Verify CE marking authenticity. Ensure complete technical documentation and valid Notified Body certificates are available.',
    reference: 'EU Safety Gate Annual Report 2025 / Regulation (EU) 2019/1020',
    fullText: `The European Commission's Safety Gate rapid alert system has reported a 35% increase in notifications for dangerous products in 2025, with PPE products being a particular focus area. Market surveillance authorities across EU member states have identified a growing number of PPE products bearing fraudulent or non-compliant CE marking, prompting a coordinated enforcement crackdown.

Under Regulation (EU) 2019/1020, market surveillance authorities now have enhanced powers to inspect products both at EU borders and within the internal market. For PPE products, authorities are specifically checking: (1) the validity of CE marking and its conformity with the requirements of Regulation (EU) 2016/425, (2) the existence and completeness of technical documentation, (3) the validity of EU Type Examination certificates issued by Notified Bodies, and (4) the accuracy of the EU Declaration of Conformity.

Manufacturers and importers should be aware that authorities are cross-referencing CE marking claims with Notified Body databases. Products claiming certification from non-existent or non-accredited Notified Bodies are being identified and removed from the market. Additionally, authorities are conducting physical testing of sampled products to verify that they actually meet the performance standards claimed in their technical documentation.

The increased surveillance also extends to online marketplaces. The European Commission has established cooperation frameworks with major e-commerce platforms to facilitate the rapid removal of non-compliant PPE listings. Companies found to be placing non-compliant PPE on the EU market face penalties including product recalls, fines, and potential criminal prosecution under national transposition laws.`
  },
  {
    id: '4',
    title: 'UKCA Marking Transition Deadline December 31, 2027',
    severity: 'medium',
    market: 'UK',
    date: '2027-12-31',
    summary: 'CE marking will no longer be accepted in Great Britain after December 31, 2027. All PPE products must bear UKCA marking for GB market access.',
    action: 'Engage UK Approved Body for UKCA certification. Update product labeling and technical documentation for UKCA compliance.',
    reference: 'UK Statutory Instrument 2026/456',
    fullText: `The UK government has confirmed that the transition period for CE marking recognition in Great Britain will end on December 31, 2027. After this date, all PPE products placed on the GB market (England, Scotland, and Wales) must bear the UKCA (UK Conformity Assessed) marking. CE marking alone will no longer be sufficient for market access in Great Britain.

For PPE manufacturers, this transition requires several key actions. Products classified as Category II or III under the UK Equipment (Safety) Regulations 2016 must obtain certification from a UK Approved Body. This is distinct from EU Notified Body certification — manufacturers cannot rely on their EU Notified Body certificates for UKCA marking purposes. Some conformity assessment bodies hold both EU Notified Body and UK Approved Body designations, which may simplify the transition for existing certificate holders.

The UKCA marking process requires manufacturers to prepare a UK Declaration of Conformity (UKDoC), which differs from the EU Declaration of Conformity in several respects. The UKDoC must reference UK legislation rather than EU regulations, list the UK Approved Body details (where applicable), and include the address of the UK Responsible Person for overseas manufacturers. Product labeling must also be updated to include the UKCA mark, which has specific size and placement requirements outlined in the UK government's guidance.

Manufacturers should note that Northern Ireland operates under separate rules under the Northern Ireland Protocol. CE marking remains valid in Northern Ireland, and the UKNI mark applies when using a UK Approved Body for products destined for the Northern Ireland market. Companies serving both the GB and Northern Ireland markets may need dual marking on their products.`
  },
  {
    id: '5',
    title: 'NMPA Public Consultation on 26 Registration Guidelines - Comment Deadline',
    severity: 'medium',
    market: 'China',
    date: '2026-02-28',
    summary: 'Public consultation on 26 medical device registration guidelines closes February 28, 2026. Guidelines include enhanced requirements for PPE classified as medical devices.',
    action: 'Review draft guidelines and submit comments to NMPA. Prepare for updated registration requirements expected Q4 2026.',
    reference: 'NMPA Announcement (December 11, 2025)',
    fullText: `The National Medical Products Administration (NMPA) has opened a public consultation on 26 revised medical device registration guidelines, several of which directly impact PPE products classified as medical devices. The consultation period closes on February 28, 2026, and the finalized guidelines are expected to be published in Q4 2026.

Among the 26 guidelines under revision, the most significant for PPE manufacturers include: (1) Technical Review Guidelines for Surgical Masks, which introduce updated performance requirements aligned with the latest EN 14683 and YY 0469 standards; (2) Technical Review Guidelines for Medical Protective Clothing, which add new requirements for liquid barrier performance and comfort testing; and (3) Technical Review Guidelines for Medical Respirators, which align testing requirements more closely with both NIOSH and EN 149 standards.

The revised guidelines also introduce new requirements for clinical evaluation. Manufacturers must now provide more detailed clinical evaluation reports that include systematic literature reviews, post-market surveillance data from comparable devices, and where necessary, additional clinical investigation data. For Class II and III devices, the clinical evaluation must demonstrate equivalence to a predicate device registered in China, with detailed justification for any differences in materials, design, or intended use.

Foreign manufacturers should pay particular attention to the revised guidelines on China Authorized Representative responsibilities. The updated guidelines clarify the documentation that must be maintained by the China Agent, including requirements for the Agent to maintain copies of all technical documentation, registration certificates, and adverse event reports in a format accessible to NMPA inspectors.`
  },
  {
    id: '6',
    title: 'EU PPE Regulation Guidelines 5th Edition - Implementation Required',
    severity: 'medium',
    market: 'EU',
    date: '2025-10-15',
    summary: 'European Commission published 5th edition of PPE Regulation Guidelines. Notified Bodies and manufacturers must reference this edition for new certifications and renewals.',
    action: 'Update internal procedures to align with 5th edition guidelines. Review technical documentation for compliance with updated requirements.',
    reference: 'European Commission PPE Regulation Guidelines, 5th Edition',
    fullText: `The European Commission has published the 5th edition of the PPE Regulation Guidelines, providing updated guidance on the interpretation and application of Regulation (EU) 2016/425 on personal protective equipment. This edition supersedes the 4th edition published in 2019 and introduces several important clarifications and new requirements.

Key changes in the 5th edition include updated guidance on the classification of PPE products, particularly for products that may fall between categories. The guidelines provide new decision trees and examples to help manufacturers and Notified Bodies determine the correct risk category for borderline products. This is especially relevant for PPE products that incorporate electronic components or smart features, which the 5th edition addresses for the first time.

The 5th edition also introduces revised guidance on technical documentation requirements. Notable changes include: (1) expanded requirements for risk assessment documentation, including the need to address risks arising from foreseeable misuse; (2) new guidance on the content and format of user instructions, particularly for products sold to non-professional users; and (3) updated requirements for the EU Declaration of Conformity, including clarification on how to document compliance with multiple EU regulations when a product falls under more than one regulatory framework.

Notified Bodies are required to apply the 5th edition guidelines to all new EU Type Examination applications received after October 15, 2025. For existing certificates, the guidelines will apply at the next scheduled surveillance audit or certificate renewal. Manufacturers are strongly advised to review their technical documentation against the updated guidelines and proactively address any gaps before their next Notified Body interaction.`
  }
]

export default function RegulatoryAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [activeSearch, setActiveSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const severities = ['all', 'critical', 'high', 'medium', 'low']

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setCurrentPage(1)
  }

  const filteredAlerts = useMemo(() => REGULATORY_ALERTS.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const matchesSearch = !activeSearch ||
      alert.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      alert.summary.toLowerCase().includes(activeSearch.toLowerCase())
    return matchesSeverity && matchesSearch
  }), [activeSearch, selectedSeverity])

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSeverityChange = (severity: string) => {
    setSelectedSeverity(severity)
    setCurrentPage(1)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Bell className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Regulatory Alerts</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay ahead of regulatory changes that impact your PPE products and compliance status
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
                placeholder="Search alerts..."
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
              {severities.map(sev => (
                <button
                  key={sev}
                  onClick={() => handleSeverityChange(sev)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    selectedSeverity === sev
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedAlerts.length > 0 ? (
            <div className="space-y-4">
              {paginatedAlerts.map(alert => (
                <div key={alert.id} className={`bg-white rounded-2xl shadow-lg border-l-4 p-6 hover:shadow-xl transition-shadow ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{alert.severity}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{alert.market}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {alert.date}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{alert.title}</h2>
                  <p className="text-gray-600 mb-3">{alert.summary}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Required Action</h3>
                    <p className="text-gray-600 text-sm">{alert.action}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">Reference: {alert.reference}</div>
                    <Link
                      href={`/regulatory-alerts/${alert.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2a7a7a] transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No alerts found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length}
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
