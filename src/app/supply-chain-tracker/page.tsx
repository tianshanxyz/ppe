'use client'

import { useState } from 'react'
import { Link2, Search, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, ChevronDown, ChevronRight, Factory, Package, Truck, ShieldCheck, FileCheck } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

interface SupplyChainStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'in_progress' | 'pending' | 'not_started'
  complianceItems: {
    name: string
    status: 'pass' | 'fail' | 'pending' | 'not_checked' | 'in_progress'
    details?: string
  }[]
  documents: string[]
}

interface SupplyChainProduct {
  id: string
  productName: string
  manufacturer: string
  category: string
  market: string
  steps: SupplyChainStep[]
  overallCompliance: number
}

const SUPPLY_CHAIN_PRODUCTS: SupplyChainProduct[] = [
  {
    id: '1',
    productName: 'N95 Respirator XR-500',
    manufacturer: 'SafeGuard PPE Co., Ltd.',
    category: 'Respiratory Protection',
    market: 'US',
    overallCompliance: 72,
    steps: [
      {
        id: 'raw-materials',
        name: 'Raw Materials Sourcing',
        description: 'Compliance verification of raw material suppliers',
        status: 'completed',
        complianceItems: [
          { name: 'Material Safety Data Sheets (MSDS)', status: 'pass', details: 'All MSDS documents verified' },
          { name: 'REACH Compliance', status: 'pass', details: 'No SVHC substances detected' },
          { name: 'Supplier Qualification', status: 'pass', details: '3/3 suppliers qualified' },
          { name: 'Material Test Reports', status: 'pass', details: 'All reports within spec' },
        ],
        documents: ['MSDS_Meltblown.pdf', 'REACH_Declaration.pdf', 'Supplier_Audit_Report.pdf']
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing Process',
        description: 'Production quality and process compliance',
        status: 'in_progress',
        complianceItems: [
          { name: 'ISO 13485 QMS', status: 'pass', details: 'Certified since 2023' },
          { name: 'Clean Room Compliance', status: 'pass', details: 'ISO Class 7 verified' },
          { name: 'Process Validation', status: 'in_progress', details: '2/3 processes validated' },
          { name: 'In-Process Testing', status: 'pending', details: 'Scheduled for next week' },
        ],
        documents: ['ISO13485_Certificate.pdf', 'Clean_Room_Qualification.pdf']
      },
      {
        id: 'product-testing',
        name: 'Product Testing & Certification',
        description: 'Performance testing and regulatory certification',
        status: 'pending',
        complianceItems: [
          { name: 'NIOSH N95 Testing', status: 'pending', details: 'Lab booking confirmed' },
          { name: 'FDA 510(k) Submission', status: 'not_checked', details: 'Awaiting test results' },
          { name: 'Biocompatibility Testing', status: 'pending', details: 'Samples submitted' },
          { name: 'Performance Testing', status: 'not_checked', details: 'Not started' },
        ],
        documents: []
      },
      {
        id: 'packaging-labeling',
        name: 'Packaging & Labeling',
        description: 'Packaging compliance and labeling requirements',
        status: 'not_started',
        complianceItems: [
          { name: 'UDI Labeling', status: 'not_checked' },
          { name: 'FDA Labeling Requirements', status: 'not_checked' },
          { name: 'Packaging Integrity Testing', status: 'not_checked' },
          { name: 'Sterilization Validation', status: 'not_checked' },
        ],
        documents: []
      },
      {
        id: 'distribution',
        name: 'Distribution & Market Entry',
        description: 'Customs, registration, and market entry compliance',
        status: 'not_started',
        complianceItems: [
          { name: 'FDA Establishment Registration', status: 'not_checked' },
          { name: 'Medical Device Listing', status: 'not_checked' },
          { name: 'US Customs Documentation', status: 'not_checked' },
          { name: 'Post-Market Surveillance Plan', status: 'not_checked' },
        ],
        documents: []
      }
    ]
  },
  {
    id: '2',
    productName: 'Safety Helmet ProShield X1',
    manufacturer: 'HeadGuard Industries',
    category: 'Head Protection',
    market: 'EU',
    overallCompliance: 85,
    steps: [
      {
        id: 'raw-materials',
        name: 'Raw Materials Sourcing',
        description: 'Material compliance verification',
        status: 'completed',
        complianceItems: [
          { name: 'REACH Compliance', status: 'pass', details: 'Full compliance verified' },
          { name: 'RoHS Compliance', status: 'pass', details: 'No restricted substances' },
          { name: 'Supplier Certificates', status: 'pass', details: 'All suppliers ISO certified' },
        ],
        documents: ['REACH_Declaration.pdf', 'RoHS_Certificate.pdf']
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing Process',
        description: 'Production compliance',
        status: 'completed',
        complianceItems: [
          { name: 'ISO 9001 QMS', status: 'pass', details: 'Certified' },
          { name: 'Production Control', status: 'pass', details: 'All processes controlled' },
          { name: 'Traceability System', status: 'pass', details: 'Full batch traceability' },
        ],
        documents: ['ISO9001_Certificate.pdf']
      },
      {
        id: 'product-testing',
        name: 'Product Testing & Certification',
        description: 'EN 397 testing and CE marking',
        status: 'in_progress',
        complianceItems: [
          { name: 'EN 397 Testing', status: 'pass', details: 'All tests passed' },
          { name: 'EU Type Examination', status: 'in_progress', details: 'Under review by BSI' },
          { name: 'Module D Assessment', status: 'pending', details: 'Scheduled next month' },
        ],
        documents: ['EN397_Test_Report.pdf']
      },
      {
        id: 'packaging-labeling',
        name: 'Packaging & Labeling',
        description: 'CE marking and labeling',
        status: 'pending',
        complianceItems: [
          { name: 'CE Marking', status: 'pending', details: 'Awaiting Module B approval' },
          { name: 'Multi-language Instructions', status: 'pending', details: 'Translation in progress' },
          { name: 'Declaration of Conformity', status: 'not_checked' },
        ],
        documents: []
      },
      {
        id: 'distribution',
        name: 'Distribution & Market Entry',
        description: 'EU market entry requirements',
        status: 'not_started',
        complianceItems: [
          { name: 'Customs Documentation', status: 'not_checked' },
          { name: 'Post-Market Surveillance', status: 'not_checked' },
        ],
        documents: []
      }
    ]
  }
]

export default function SupplyChainTrackerPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const filteredProducts = SUPPLY_CHAIN_PRODUCTS.filter(p =>
    !searchQuery ||
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress': return <Clock className="w-5 h-5 text-[#339999] animate-pulse" />
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'raw-materials': return <Factory className="w-6 h-6" />
      case 'manufacturing': return <Package className="w-6 h-6" />
      case 'product-testing': return <ShieldCheck className="w-6 h-6" />
      case 'packaging-labeling': return <FileCheck className="w-6 h-6" />
      case 'distribution': return <Truck className="w-6 h-6" />
      default: return <Link2 className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Link2 className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.supplyChainTracker}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.supplyChainTrackerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Data Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Sample Data:</span>
            <span>Supply chain data shown below represents typical PPE industry supply chain patterns. Connect to supplier databases for real-time tracking.</span>
          </div>
        </div>
      </div>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form 
            className="relative w-full md:w-96"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{product.productName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">{product.manufacturer}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{product.category}</span>
                      <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-1 rounded">{product.market}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${product.overallCompliance >= 80 ? 'text-green-500' : product.overallCompliance >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {product.overallCompliance}%
                      </div>
                      <div className="text-xs text-gray-400">Compliance</div>
                    </div>
                    {expandedProduct === product.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    {product.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                          step.status === 'completed' ? 'bg-green-100 text-green-700' :
                          step.status === 'in_progress' ? 'bg-[#339999]/10 text-[#339999]' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < product.steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 ${
                            step.status === 'completed' && product.steps[idx + 1].status !== 'not_started' ? 'bg-green-300' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {product.steps.map(step => (
                      <div key={step.id} className="flex-1 text-center">
                        <span className="text-[10px] text-gray-400 truncate block">{step.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {expandedProduct === product.id && (
                <div className="border-t border-gray-100">
                  {product.steps.map(step => (
                    <div key={step.id} className="border-b border-gray-50 last:border-0">
                      <div 
                        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            step.status === 'completed' ? 'bg-green-100 text-green-600' :
                            step.status === 'in_progress' ? 'bg-[#339999]/10 text-[#339999]' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {getStepIcon(step.id)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{step.name}</h3>
                            <p className="text-sm text-gray-500">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(step.status)}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                            step.status === 'completed' ? 'bg-green-100 text-green-700' :
                            step.status === 'in_progress' ? 'bg-[#339999]/10 text-[#339999]' :
                            step.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {step.status.replace('_', ' ')}
                          </span>
                          {expandedStep === step.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {expandedStep === step.id && (
                        <div className="px-6 pb-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {step.complianceItems.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                  {getStatusIcon(item.status)}
                                </div>
                                {item.details && (
                                  <p className="text-xs text-gray-500">{item.details}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          {step.documents.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents</h4>
                              <div className="flex flex-wrap gap-2">
                                {step.documents.map(doc => (
                                  <span key={doc} className="text-xs bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1">
                                    <FileCheck className="w-3 h-3 text-[#339999]" />
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
