'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  FileCheck,
  FileCode,
  BookOpen,
  Shield,
  Globe,
  Building2,
  ClipboardList,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { Button } from '@/components/ui'

// 文档分类
const CATEGORIES = [
  { id: 'all', name: 'All Documents', icon: FileText },
  { id: 'templates', name: 'Templates', icon: FileSpreadsheet },
  { id: 'checklists', name: 'Checklists', icon: ClipboardList },
  { id: 'guides', name: 'Guides', icon: BookOpen },
  { id: 'regulations', name: 'Regulations', icon: Shield },
  { id: 'standards', name: 'Standards', icon: FileCheck },
]

// 文档数据
const DOCUMENTS = [
  // CE Marking Templates
  {
    id: 'ce-technical-file',
    title: 'CE Technical File Template',
    description: 'Complete technical file template for CE marking compliance with all required sections',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '245 KB',
    downloads: 1234,
    updatedAt: '2026-04-15',
    tags: ['CE Marking', 'Technical File', 'EU'],
    icon: FileSpreadsheet
  },
  {
    id: 'ce-risk-assessment',
    title: 'Risk Assessment Template',
    description: 'ISO 14971 compliant risk assessment template for medical devices and PPE',
    category: 'templates',
    market: 'EU',
    format: 'XLSX',
    size: '128 KB',
    downloads: 987,
    updatedAt: '2026-04-10',
    tags: ['Risk Management', 'ISO 14971', 'CE Marking'],
    icon: FileSpreadsheet
  },
  {
    id: 'ce-doc',
    title: 'EU Declaration of Conformity Template',
    description: 'Official EU Declaration of Conformity template for PPE products',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '89 KB',
    downloads: 2156,
    updatedAt: '2026-04-01',
    tags: ['CE Marking', 'DoC', 'Compliance'],
    icon: FileCheck
  },
  {
    id: 'ce-test-report',
    title: 'Test Report Template',
    description: 'Standardized test report template for PPE testing documentation',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '156 KB',
    downloads: 876,
    updatedAt: '2026-03-20',
    tags: ['Testing', 'CE Marking', 'Documentation'],
    icon: FileText
  },
  // FDA Templates
  {
    id: 'fda-510k-cover',
    title: 'FDA 510(k) Cover Letter Template',
    description: 'Professional cover letter template for FDA 510(k) submissions',
    category: 'templates',
    market: 'US',
    format: 'DOCX',
    size: '98 KB',
    downloads: 1543,
    updatedAt: '2026-04-12',
    tags: ['FDA', '510(k)', 'Submission'],
    icon: FileText
  },
  {
    id: 'fda-substantial-equiv',
    title: 'Substantial Equivalence Template',
    description: 'Template for demonstrating substantial equivalence to predicate device',
    category: 'templates',
    market: 'US',
    format: 'DOCX',
    size: '145 KB',
    downloads: 1123,
    updatedAt: '2026-04-08',
    tags: ['FDA', '510(k)', 'Predicate'],
    icon: FileCheck
  },
  {
    id: 'fda-device-desc',
    title: 'Device Description Template',
    description: 'Comprehensive device description template for FDA submissions',
    category: 'templates',
    market: 'US',
    format: 'DOCX',
    size: '178 KB',
    downloads: 987,
    updatedAt: '2026-03-25',
    tags: ['FDA', 'Documentation', 'Device'],
    icon: FileText
  },
  {
    id: 'fda-labeling',
    title: 'FDA Labeling Template',
    description: 'FDA-compliant labeling template including instructions for use',
    category: 'templates',
    market: 'US',
    format: 'DOCX',
    size: '134 KB',
    downloads: 1432,
    updatedAt: '2026-04-05',
    tags: ['FDA', 'Labeling', 'IFU'],
    icon: FileText
  },
  // NMPA Templates
  {
    id: 'nmpa-registration',
    title: 'NMPA Registration Application Template',
    description: 'Complete registration application template for China NMPA',
    category: 'templates',
    market: 'CN',
    format: 'DOCX',
    size: '234 KB',
    downloads: 654,
    updatedAt: '2026-04-10',
    tags: ['NMPA', 'China', 'Registration'],
    icon: FileSpreadsheet
  },
  {
    id: 'nmpa-technical',
    title: 'NMPA Technical Requirements Template',
    description: 'Technical requirements documentation template for NMPA submissions',
    category: 'templates',
    market: 'CN',
    format: 'DOCX',
    size: '189 KB',
    downloads: 543,
    updatedAt: '2026-03-28',
    tags: ['NMPA', 'Technical', 'China'],
    icon: FileText
  },
  {
    id: 'nmpa-clinical',
    title: 'Clinical Evaluation Report Template',
    description: 'NMPA-compliant clinical evaluation report template',
    category: 'templates',
    market: 'CN',
    format: 'DOCX',
    size: '267 KB',
    downloads: 432,
    updatedAt: '2026-04-02',
    tags: ['NMPA', 'Clinical', 'CER'],
    icon: FileCheck
  },
  // Checklists
  {
    id: 'ce-checklist',
    title: 'CE Marking Complete Checklist',
    description: 'Comprehensive checklist for CE marking preparation and submission',
    category: 'checklists',
    market: 'EU',
    format: 'PDF',
    size: '312 KB',
    downloads: 2345,
    updatedAt: '2026-04-18',
    tags: ['CE Marking', 'Checklist', 'Compliance'],
    icon: ClipboardList
  },
  {
    id: 'fda-510k-checklist',
    title: 'FDA 510(k) Submission Checklist',
    description: 'RTA (Refuse to Accept) checklist for FDA 510(k) submissions',
    category: 'checklists',
    market: 'US',
    format: 'PDF',
    size: '289 KB',
    downloads: 1876,
    updatedAt: '2026-04-15',
    tags: ['FDA', '510(k)', 'Checklist'],
    icon: ClipboardList
  },
  {
    id: 'iso-13485-checklist',
    title: 'ISO 13485 Audit Checklist',
    description: 'Internal audit checklist for ISO 13485 quality management system',
    category: 'checklists',
    market: 'Global',
    format: 'XLSX',
    size: '456 KB',
    downloads: 1654,
    updatedAt: '2026-04-12',
    tags: ['ISO 13485', 'QMS', 'Audit'],
    icon: ClipboardList
  },
  // Guides
  {
    id: 'ce-guide-pdf',
    title: 'CE Marking Step-by-Step Guide',
    description: 'Comprehensive guide to CE marking for PPE products with examples',
    category: 'guides',
    market: 'EU',
    format: 'PDF',
    size: '2.4 MB',
    downloads: 3456,
    updatedAt: '2026-04-20',
    tags: ['CE Marking', 'Guide', 'EU'],
    icon: BookOpen
  },
  {
    id: 'fda-guide-pdf',
    title: 'FDA 510(k) Submission Guide',
    description: 'Complete guide to preparing and submitting FDA 510(k) applications',
    category: 'guides',
    market: 'US',
    format: 'PDF',
    size: '3.1 MB',
    downloads: 2890,
    updatedAt: '2026-04-18',
    tags: ['FDA', '510(k)', 'Guide'],
    icon: BookOpen
  },
  {
    id: 'biocompatibility-guide',
    title: 'Biocompatibility Testing Guide',
    description: 'Guide to ISO 10993 biocompatibility testing for medical devices',
    category: 'guides',
    market: 'Global',
    format: 'PDF',
    size: '1.8 MB',
    downloads: 1234,
    updatedAt: '2026-04-10',
    tags: ['Biocompatibility', 'ISO 10993', 'Testing'],
    icon: BookOpen
  },
  // Regulations
  {
    id: 'eu-2016-425',
    title: 'EU Regulation 2016/425 (PPE Regulation)',
    description: 'Official text of EU PPE Regulation 2016/425',
    category: 'regulations',
    market: 'EU',
    format: 'PDF',
    size: '1.2 MB',
    downloads: 4567,
    updatedAt: '2026-01-01',
    tags: ['Regulation', 'EU', 'PPE'],
    icon: Shield
  },
  {
    id: 'fda-act',
    title: 'Federal Food, Drug, and Cosmetic Act',
    description: 'US Federal Food, Drug, and Cosmetic Act (FD&C Act)',
    category: 'regulations',
    market: 'US',
    format: 'PDF',
    size: '3.5 MB',
    downloads: 2345,
    updatedAt: '2026-01-01',
    tags: ['FDA', 'Regulation', 'US'],
    icon: Shield
  },
  {
    id: 'china-regulation',
    title: 'China Medical Device Regulation',
    description: 'Regulations for Supervision and Administration of Medical Devices',
    category: 'regulations',
    market: 'CN',
    format: 'PDF',
    size: '2.1 MB',
    downloads: 876,
    updatedAt: '2026-01-01',
    tags: ['NMPA', 'Regulation', 'China'],
    icon: Shield
  },
  // Standards
  {
    id: 'en-149',
    title: 'EN 149:2001+A1:2009 (Respiratory Protection)',
    description: 'European standard for filtering half masks for particle protection',
    category: 'standards',
    market: 'EU',
    format: 'PDF',
    size: '4.2 MB',
    downloads: 5678,
    updatedAt: '2026-01-01',
    tags: ['Standard', 'EN', 'Respiratory'],
    icon: FileCheck
  },
  {
    id: 'en-14683',
    title: 'EN 14683:2019+AC:2019 (Medical Masks)',
    description: 'European standard for medical face masks',
    category: 'standards',
    market: 'EU',
    format: 'PDF',
    size: '2.8 MB',
    downloads: 4321,
    updatedAt: '2026-01-01',
    tags: ['Standard', 'EN', 'Masks'],
    icon: FileCheck
  },
  {
    id: 'astm-f2100',
    title: 'ASTM F2100 (Medical Face Masks)',
    description: 'US standard specification for performance of materials used in medical face masks',
    category: 'standards',
    market: 'US',
    format: 'PDF',
    size: '1.5 MB',
    downloads: 3456,
    updatedAt: '2026-01-01',
    tags: ['Standard', 'ASTM', 'Masks'],
    icon: FileCheck
  },
  {
    id: 'iso-13485',
    title: 'ISO 13485:2016 (Medical Devices QMS)',
    description: 'International standard for quality management systems for medical devices',
    category: 'standards',
    market: 'Global',
    format: 'PDF',
    size: '3.2 MB',
    downloads: 6789,
    updatedAt: '2026-01-01',
    tags: ['Standard', 'ISO', 'QMS'],
    icon: FileCheck
  }
]

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)

  // 过滤文档
  const filteredDocuments = DOCUMENTS.filter(doc => {
    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchMarket = !selectedMarket || doc.market === selectedMarket
    
    return matchCategory && matchSearch && matchMarket
  })

  const handleDownload = (docId: string, docTitle: string) => {
    // 模拟下载功能
    alert(`Downloading: ${docTitle}\n\nNote: This is a demo. In production, this would download the actual document.`)
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />
      case 'DOCX':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getMarketFlag = (market: string) => {
    switch (market) {
      case 'EU': return '🇪🇺'
      case 'US': return '🇺🇸'
      case 'CN': return '🇨🇳'
      default: return '🌍'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-2xl mb-6">
              <Download className="w-8 h-8 text-[#339999]" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Document Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Download templates, checklists, guides, and regulatory documents for PPE compliance
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents, templates, or standards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                    ${selectedCategory === cat.id
                      ? 'bg-[#339999] text-white border-[#339999]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#339999]'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Market Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter by market:</span>
            {['EU', 'US', 'CN', 'Global'].map((market) => (
              <button
                key={market}
                onClick={() => setSelectedMarket(selectedMarket === market ? null : market)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all
                  ${selectedMarket === market
                    ? 'bg-[#339999] text-white border-[#339999]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#339999]'
                  }`}
              >
                {getMarketFlag(market)} {market}
              </button>
            ))}
            {selectedMarket && (
              <button
                onClick={() => setSelectedMarket(null)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredDocuments.length}</span> documents
          </p>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const Icon = doc.icon
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <span className="text-2xl">{getMarketFlag(doc.market)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {getFormatIcon(doc.format)}
                      <span>{doc.format}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#339999] transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {doc.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {doc.downloads.toLocaleString()}
                      </span>
                      <span>{doc.size}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {doc.updatedAt}
                    </span>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(doc.id, doc.title)}
                    className="w-full py-2.5 bg-[#339999] text-white font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No documents found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedMarket(null)
              }}
              className="bg-[#339999] hover:bg-[#2d8b8b] text-white"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
