'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  ExternalLink, 
  Globe, 
  Shield, 
  FileText, 
  CheckCircle,
  Download,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
  ArrowRight,
  FileCheck,
  Building2,
  Users,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui'

// 法规数据
const REGULATIONS = [
  {
    id: 'eu-2016-425',
    title: 'EU Regulation 2016/425 (PPE Regulation)',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Regulation',
    description: 'Regulation on personal protective equipment, replacing Directive 89/686/EEC. Covers design, manufacture, and marketing of PPE in the EU.',
    effectiveDate: '2018-04-21',
    scope: 'All PPE products placed on the EU market',
    keyPoints: [
      'PPE divided into three categories based on risk (I, II, III)',
      'Category II and III require Notified Body involvement',
      'Module B (EU Type Examination) for Category II',
      'Module B + C2 or D for Category III',
      'CE marking mandatory for all categories'
    ],
    documents: [
      { name: 'Full Regulation Text', type: 'PDF', size: '1.2 MB', url: '#' },
      { name: 'Guidance Document', type: 'PDF', size: '2.4 MB', url: '#' },
      { name: 'FAQ', type: 'PDF', size: '856 KB', url: '#' }
    ],
    relatedStandards: ['EN ISO 13688', 'EN 149', 'EN 14683', 'EN 14126'],
    certificationBodies: ['BSI', 'SGS', 'TÜV SÜD', 'DEKRA'],
    estimatedCost: '€5,000 - €50,000',
    estimatedTime: '3-6 months',
    difficulty: 'High'
  },
  {
    id: 'fda-510k',
    title: 'FDA 510(k) Premarket Notification',
    market: 'US',
    flag: '🇺🇸',
    category: 'Regulation',
    description: 'Premarket notification requirement for medical devices including surgical masks, N95 respirators, and other PPE.',
    effectiveDate: 'Ongoing',
    scope: 'Medical device PPE products for US market',
    keyPoints: [
      'Substantial equivalence to legally marketed predicate device required',
      '510(k) summary must be submitted',
      'Performance testing data required',
      'Biocompatibility evaluation for patient-contacting devices',
      'Quality System Regulation (21 CFR Part 820) compliance'
    ],
    documents: [
      { name: '21 CFR Part 820 (QSR)', type: 'PDF', size: '3.1 MB', url: '#' },
      { name: '510(k) Submission Guidance', type: 'PDF', size: '1.8 MB', url: '#' },
      { name: 'Refuse to Accept Checklist', type: 'PDF', size: '289 KB', url: '#' }
    ],
    relatedStandards: ['ASTM F2100', 'ASTM F1862', 'NIOSH 42 CFR 84'],
    certificationBodies: ['FDA CDRH'],
    estimatedCost: '$10,000 - $100,000',
    estimatedTime: '3-12 months',
    difficulty: 'High'
  },
  {
    id: 'nmpa-regulation',
    title: 'NMPA Medical Device Registration',
    market: 'CN',
    flag: '🇨🇳',
    category: 'Regulation',
    description: 'Registration requirements for medical devices in China under the supervision of National Medical Products Administration.',
    effectiveDate: 'Ongoing',
    scope: 'Medical device PPE products for China market',
    keyPoints: [
      'Class I: Filing management',
      'Class II: Registration certificate required',
      'Class III: Registration certificate + clinical trials often required',
      'Type testing at NMPA-accredited laboratories in China',
      'Quality system assessment (GMP inspection)',
      'Chinese labeling and instructions required'
    ],
    documents: [
      { name: 'Medical Device Regulation', type: 'PDF', size: '2.1 MB', url: '#' },
      { name: 'Registration Guidance', type: 'PDF', size: '1.5 MB', url: '#' },
      { name: 'Classification Catalogue', type: 'PDF', size: '3.2 MB', url: '#' }
    ],
    relatedStandards: ['GB 19083', 'YY 0469', 'GB/T 32610'],
    certificationBodies: ['NMPA', 'CMDCAS'],
    estimatedCost: '¥50,000 - ¥500,000',
    estimatedTime: '6-18 months',
    difficulty: 'Very High'
  },
  {
    id: 'ukca-marking',
    title: 'UKCA Marking (UK PPE Regulations 2018)',
    market: 'UK',
    flag: '🇬🇧',
    category: 'Regulation',
    description: 'UK Conformity Assessed marking for products placed on the Great Britain market post-Brexit.',
    effectiveDate: '2021-01-01',
    scope: 'PPE products for Great Britain (England, Wales, Scotland)',
    keyPoints: [
      'Replaces CE marking for GB market',
      'Northern Ireland continues to use CE marking',
      'UK Approved Body required for Category II and III',
      'UK Declaration of Conformity required',
      'UK Responsible Person required for non-UK manufacturers'
    ],
    documents: [
      { name: 'PPE Regulations 2018', type: 'PDF', size: '1.8 MB', url: '#' },
      { name: 'UKCA Guidance', type: 'PDF', size: '945 KB', url: '#' },
      { name: 'Approved Bodies List', type: 'PDF', size: '234 KB', url: '#' }
    ],
    relatedStandards: ['BS EN 149', 'BS EN 14683', 'BS EN 14126'],
    certificationBodies: ['BSI UK', 'SGS UK', 'TÜV UK'],
    estimatedCost: '£3,000 - £30,000',
    estimatedTime: '2-4 months',
    difficulty: 'Medium'
  },
  {
    id: 'iso-13485',
    title: 'ISO 13485:2016 Medical Devices QMS',
    market: 'Global',
    flag: '🌍',
    category: 'Standard',
    description: 'International standard for quality management systems specific to medical devices.',
    effectiveDate: '2016-03-01',
    scope: 'Medical device manufacturers worldwide',
    keyPoints: [
      'Risk management throughout product lifecycle',
      'Design and development controls',
      'Process validation requirements',
      'Traceability and record keeping',
      'Regulatory requirements integration',
      'Certification by accredited body recommended'
    ],
    documents: [
      { name: 'ISO 13485:2016 Standard', type: 'PDF', size: '3.2 MB', url: '#' },
      { name: 'Implementation Guide', type: 'PDF', size: '2.1 MB', url: '#' },
      { name: 'Audit Checklist', type: 'XLSX', size: '456 KB', url: '#' }
    ],
    relatedStandards: ['ISO 14971', 'ISO 10993', 'IEC 62304'],
    certificationBodies: ['BSI', 'TÜV SÜD', 'SGS', 'DNV'],
    estimatedCost: '$5,000 - $50,000',
    estimatedTime: '6-12 months',
    difficulty: 'High'
  },
  {
    id: 'en-149',
    title: 'EN 149:2001+A1:2009 Respiratory Protection',
    market: 'EU',
    flag: '🇪🇺',
    category: 'Standard',
    description: 'European standard for filtering half masks for protection against particles.',
    effectiveDate: '2009-09-01',
    scope: 'Filtering facepiece respirators (FFP1, FFP2, FFP3)',
    keyPoints: [
      'Three classes: FFP1 (80% filtration), FFP2 (94%), FFP3 (99%)',
      'Total inward leakage requirements',
      'Breathing resistance limits',
      'Dolomite dust clogging test for optional marking',
      'Marking requirements (NR/R for re-usability)'
    ],
    documents: [
      { name: 'EN 149 Standard', type: 'PDF', size: '4.2 MB', url: '#' },
      { name: 'Test Methods Guide', type: 'PDF', size: '1.5 MB', url: '#' },
      { name: 'Marking Requirements', type: 'PDF', size: '678 KB', url: '#' }
    ],
    relatedStandards: ['EN 132', 'EN 143', 'EN 529'],
    certificationBodies: ['Various Notified Bodies'],
    estimatedCost: '€2,000 - €10,000',
    estimatedTime: '4-8 weeks',
    difficulty: 'Medium'
  }
]

export default function RegulationsNewPage() {
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRegulations = REGULATIONS.filter(reg =>
    reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.market.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDownload = (docName: string) => {
    alert(`Downloading: ${docName}\n\nNote: This is a demo. In production, this would download the actual document.`)
  }

  if (selectedRegulation) {
    const reg = REGULATIONS.find(r => r.id === selectedRegulation)
    if (!reg) return null

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => setSelectedRegulation(null)}
              className="text-[#339999] hover:underline mb-4 flex items-center gap-1"
            >
              ← Back to Regulations
            </button>
            <div className="flex items-start gap-4">
              <span className="text-5xl">{reg.flag}</span>
              <div>
                <span className="inline-block px-3 py-1 bg-[#339999]/10 text-[#339999] text-sm font-medium rounded-full mb-2">
                  {reg.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900">{reg.title}</h1>
                <p className="mt-2 text-gray-600 max-w-3xl">{reg.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#339999]" />
                  Key Information
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Effective Date
                    </div>
                    <div className="font-semibold text-gray-900">{reg.effectiveDate}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Globe className="w-4 h-4" />
                      Scope
                    </div>
                    <div className="font-semibold text-gray-900">{reg.scope}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Estimated Time
                    </div>
                    <div className="font-semibold text-gray-900">{reg.estimatedTime}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      Estimated Cost
                    </div>
                    <div className="font-semibold text-gray-900">{reg.estimatedCost}</div>
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#339999]" />
                  Key Requirements
                </h2>
                <ul className="space-y-3">
                  {reg.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#339999]/10 text-[#339999] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#339999]" />
                  Official Documents
                </h2>
                <div className="space-y-3">
                  {reg.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc.name)}
                        className="p-2 text-[#339999] hover:bg-[#339999]/10 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Standards */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#339999]" />
                  Related Standards
                </h2>
                <div className="flex flex-wrap gap-2">
                  {reg.relatedStandards.map((standard, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      {standard}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Certification Bodies */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#339999]" />
                  Certification Bodies
                </h3>
                <ul className="space-y-2">
                  {reg.certificationBodies.map((body, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {body}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Difficulty */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#339999]" />
                  Complexity Level
                </h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium
                  ${reg.difficulty === 'Very High' ? 'bg-red-100 text-red-700' :
                    reg.difficulty === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'}`}>
                  {reg.difficulty}
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {reg.difficulty === 'Very High' ? 'Requires extensive documentation and local expertise.' :
                   reg.difficulty === 'High' ? 'Requires significant preparation and testing.' :
                   'Moderate complexity with clear requirements.'}
                </p>
              </div>

              {/* Help CTA */}
              <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl shadow-sm p-6 text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Need Help?
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Our compliance experts can guide you through this regulation.
                </p>
                <Button className="w-full bg-white text-[#339999] hover:bg-gray-100">
                  Get Expert Help
                </Button>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/ppe/compliance-guides" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <BookOpen className="w-4 h-4" />
                      Step-by-Step Guide
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                  <li>
                    <a href="/ppe/documents" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <Download className="w-4 h-4" />
                      Download Templates
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                  <li>
                    <a href="/ppe/manufacturers" className="flex items-center gap-2 text-[#339999] hover:underline">
                      <Users className="w-4 h-4" />
                      Find Certified Manufacturers
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-2xl mb-6">
              <BookOpen className="w-8 h-8 text-[#339999]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PPE Regulations & Standards
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Comprehensive database of global PPE regulations, standards, and compliance requirements with official documents and guides
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search regulations, standards, or markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#339999] focus:border-transparent text-lg"
                />
                <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regulations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRegulations.map((reg) => (
            <div
              key={reg.id}
              onClick={() => setSelectedRegulation(reg.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{reg.flag}</span>
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs font-medium rounded-full mb-1">
                        {reg.category}
                      </span>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                        {reg.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {reg.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Timeline</div>
                    <div className="font-semibold text-gray-900 text-sm">{reg.estimatedTime}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Cost</div>
                    <div className="font-semibold text-gray-900 text-sm">{reg.estimatedCost}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{reg.documents.length} documents</span>
                  </div>
                  <div className="flex items-center text-[#339999] font-medium group-hover:gap-2 transition-all">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRegulations.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No regulations found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/ppe/compliance-guides" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <BookOpen className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Compliance Guides</h3>
            <p className="text-sm text-gray-600">Step-by-step certification guides</p>
          </a>
          
          <a href="/ppe/documents" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <Download className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Document Center</h3>
            <p className="text-sm text-gray-600">Templates and checklists</p>
          </a>
          
          <a href="/ppe/certification-comparison" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all">
            <Shield className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Compare Certifications</h3>
            <p className="text-sm text-gray-600">Side-by-side comparison tool</p>
          </a>
        </div>
      </div>
    </div>
  )
}
