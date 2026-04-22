'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Download,
  ChevronRight,
  Shield,
  Globe,
  Factory,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui'

// 合规指南数据
const COMPLIANCE_GUIDES = [
  {
    id: 'ce-marking',
    title: 'CE Marking Guide',
    market: 'European Union',
    flag: '🇪🇺',
    description: 'Complete guide to CE marking for PPE products entering the EU market',
    steps: 7,
    timeline: '3-6 months',
    cost: '€5,000 - €50,000',
    difficulty: 'High',
    category: 'Certification'
  },
  {
    id: 'fda-510k',
    title: 'FDA 510(k) Submission',
    market: 'United States',
    flag: '🇺🇸',
    description: 'Step-by-step guide for FDA 510(k) premarket notification',
    steps: 8,
    timeline: '3-12 months',
    cost: '$10,000 - $100,000',
    difficulty: 'High',
    category: 'Certification'
  },
  {
    id: 'nmpa-registration',
    title: 'NMPA Registration',
    market: 'China',
    flag: '🇨🇳',
    description: 'Guide to NMPA medical device registration for PPE products',
    steps: 6,
    timeline: '6-18 months',
    cost: '¥50,000 - ¥500,000',
    difficulty: 'Very High',
    category: 'Certification'
  },
  {
    id: 'ukca-marking',
    title: 'UKCA Marking',
    market: 'United Kingdom',
    flag: '🇬🇧',
    description: 'UKCA marking requirements post-Brexit for PPE products',
    steps: 5,
    timeline: '2-4 months',
    cost: '£3,000 - £30,000',
    difficulty: 'Medium',
    category: 'Certification'
  }
]

// 详细步骤数据
const GUIDE_DETAILS: Record<string, {
  title: string
  overview: string
  prerequisites: string[]
  steps: {
    number: number
    title: string
    description: string
    documents: string[]
    tips: string
    estimatedTime: string
  }[]
  templates: {
    name: string
    format: string
    size: string
  }[]
}> = {
  'ce-marking': {
    title: 'CE Marking for PPE Products',
    overview: 'CE marking is mandatory for all PPE products sold in the European Economic Area (EEA). This guide covers the complete process from product classification to final certification.',
    prerequisites: [
      'Product technical documentation',
      'Risk assessment report',
      'Quality management system (ISO 9001 recommended)',
      'Test reports from accredited laboratory',
      'User instructions and labeling'
    ],
    steps: [
      {
        number: 1,
        title: 'Product Classification',
        description: 'Determine the PPE category (I, II, or III) based on risk level. Category I is low risk, Category II is intermediate risk, and Category III is high risk (life-threatening hazards).',
        documents: ['Product specification', 'Risk assessment', 'Intended use declaration'],
        tips: 'Most medical PPE falls under Category II or III. Consult Regulation (EU) 2016/425 for detailed classification criteria.',
        estimatedTime: '1-2 weeks'
      },
      {
        number: 2,
        title: 'Identify Applicable Standards',
        description: 'Identify harmonized standards that apply to your product. These standards provide presumption of conformity with the Essential Health and Safety Requirements (EHSR).',
        documents: ['Standards list', 'Gap analysis report'],
        tips: 'Check the EU Official Journal for the latest list of harmonized standards. EN 149 for filtering facepieces, EN 14683 for medical masks.',
        estimatedTime: '1 week'
      },
      {
        number: 3,
        title: 'Technical Documentation',
        description: 'Prepare comprehensive technical documentation including design, manufacturing process, and quality control procedures.',
        documents: ['Technical file', 'Design drawings', 'Manufacturing process', 'Quality control plan'],
        tips: 'Keep technical documentation for 10 years after the last product is placed on the market.',
        estimatedTime: '2-4 weeks'
      },
      {
        number: 4,
        title: 'Testing & Evaluation',
        description: 'Conduct product testing according to applicable standards. For Category II and III, testing must be performed by a Notified Body.',
        documents: ['Test reports', 'Test samples', 'Test protocols'],
        tips: 'Choose an accredited laboratory or Notified Body early in the process. Testing can take 4-8 weeks.',
        estimatedTime: '4-8 weeks'
      },
      {
        number: 5,
        title: 'Notified Body Assessment',
        description: 'For Category II and III PPE, a Notified Body must assess the product. Category III requires ongoing surveillance.',
        documents: ['Application form', 'Technical file', 'Test reports', 'Quality system documentation'],
        tips: 'Research Notified Bodies that specialize in your product category. Get quotes from multiple bodies.',
        estimatedTime: '4-12 weeks'
      },
      {
        number: 6,
        title: 'EU Declaration of Conformity',
        description: 'Prepare and sign the EU Declaration of Conformity, declaring that your product meets all applicable requirements.',
        documents: ['EU Declaration of Conformity', 'Technical documentation summary'],
        tips: 'The DoC must be kept with the technical file and made available to authorities upon request.',
        estimatedTime: '1 week'
      },
      {
        number: 7,
        title: 'CE Marking & Market Entry',
        description: 'Affix the CE marking to your product and packaging. Ensure user instructions include all required information.',
        documents: ['CE marking artwork', 'Label design', 'User instructions'],
        tips: 'The CE marking must be visible, legible, and indelible. Include the Notified Body identification number for Category II and III.',
        estimatedTime: '1-2 weeks'
      }
    ],
    templates: [
      { name: 'Technical File Template', format: 'DOCX', size: '245 KB' },
      { name: 'Risk Assessment Template', format: 'XLSX', size: '128 KB' },
      { name: 'EU Declaration of Conformity', format: 'DOCX', size: '89 KB' },
      { name: 'Test Report Template', format: 'DOCX', size: '156 KB' },
      { name: 'User Instructions Template', format: 'DOCX', size: '112 KB' }
    ]
  },
  'fda-510k': {
    title: 'FDA 510(k) Premarket Notification',
    overview: 'The 510(k) pathway is the most common route for PPE medical devices to enter the US market. This guide covers the entire submission process.',
    prerequisites: [
      'US Agent appointment',
      'FDA Establishment Registration',
      'Device Listing',
      'Predicate device identification',
      'Quality System Regulation (QSR) compliance'
    ],
    steps: [
      {
        number: 1,
        title: 'Device Classification',
        description: 'Determine the FDA classification (Class I, II, or III) and product code. Most PPE is Class I or II.',
        documents: ['FDA classification database search', 'Product code determination'],
        tips: 'Use the FDA Product Classification Database. Common PPE codes: LYU (surgical masks), NZJ (N95 respirators).',
        estimatedTime: '1 week'
      },
      {
        number: 2,
        title: 'Predicate Device Selection',
        description: 'Identify a legally marketed predicate device that is substantially equivalent to your device.',
        documents: ['Predicate device analysis', 'Comparison table', '510(k) summary of predicate'],
        tips: 'Choose a predicate with similar intended use and technology. Recent clearances are preferred.',
        estimatedTime: '1-2 weeks'
      },
      {
        number: 3,
        title: 'Performance Testing',
        description: 'Conduct performance testing to demonstrate substantial equivalence. May include bench testing, biocompatibility, and clinical data.',
        documents: ['Test protocols', 'Test reports', 'Statistical analysis'],
        tips: 'Follow FDA recognized consensus standards (e.g., ASTM F2100 for masks). Use accredited laboratories.',
        estimatedTime: '4-12 weeks'
      },
      {
        number: 4,
        title: 'Biocompatibility Assessment',
        description: 'Evaluate biocompatibility according to ISO 10993 series. Determine required testing based on device contact and duration.',
        documents: ['Biocompatibility evaluation plan', 'Test reports', 'Risk assessment'],
        tips: 'Consider using FDA-recognized standards and previously evaluated materials to reduce testing burden.',
        estimatedTime: '6-12 weeks'
      },
      {
        number: 5,
        title: '510(k) Document Preparation',
        description: 'Prepare the 510(k) submission including device description, substantial equivalence comparison, and labeling.',
        documents: ['510(k) cover letter', 'Device description', 'Substantial equivalence discussion', 'Proposed labeling'],
        tips: 'Use the FDA eSubmitter tool for electronic submissions. Follow the Refuse to Accept (RTA) checklist.',
        estimatedTime: '2-4 weeks'
      },
      {
        number: 6,
        title: 'FDA Submission & Review',
        description: 'Submit the 510(k) through the FDA Electronic Submissions Gateway (ESG). FDA conducts acceptance review and substantive review.',
        documents: ['eCopy', 'Submission confirmation', 'User fees payment'],
        tips: 'Standard review takes 90 days. Interactive review may include Additional Information (AI) requests.',
        estimatedTime: '90 days (FDA review)'
      },
      {
        number: 7,
        title: 'Quality System Implementation',
        description: 'Implement a Quality Management System compliant with 21 CFR Part 820 (QSR) before marketing.',
        documents: ['Quality manual', 'Procedures', 'Design controls documentation'],
        tips: 'FDA may conduct inspections to verify QSR compliance. Consider third-party QSR audits.',
        estimatedTime: 'Ongoing'
      },
      {
        number: 8,
        title: 'Market Entry & Post-Market',
        description: 'Upon 510(k) clearance, begin marketing. Maintain compliance with post-market requirements including adverse event reporting.',
        documents: ['510(k) clearance letter', 'Device labeling', 'Post-market surveillance plan'],
        tips: 'Register your establishment and list your device with FDA. Report adverse events through MDR.',
        estimatedTime: 'Ongoing'
      }
    ],
    templates: [
      { name: '510(k) Cover Letter Template', format: 'DOCX', size: '98 KB' },
      { name: 'Substantial Equivalence Template', format: 'DOCX', size: '145 KB' },
      { name: 'Device Description Template', format: 'DOCX', size: '178 KB' },
      { name: 'Labeling Template', format: 'DOCX', size: '134 KB' },
      { name: 'Clinical Evaluation Template', format: 'DOCX', size: '167 KB' }
    ]
  },
  'nmpa-registration': {
    title: 'NMPA Medical Device Registration',
    overview: 'China NMPA registration is required for all medical devices sold in China. PPE classified as medical devices must obtain registration certificates.',
    prerequisites: [
      'China legal entity or agent',
      'Business license',
      'ISO 13485 certificate',
      'Product technical requirements',
      'Clinical evaluation report'
    ],
    steps: [
      {
        number: 1,
        title: 'Classification Determination',
        description: 'Determine the NMPA classification (Class I, II, or III) according to the Medical Device Classification Catalogue.',
        documents: ['Classification analysis', 'Product description', 'Intended use statement'],
        tips: 'Most PPE is Class II. Check the latest NMPA Classification Catalogue. Surgical masks: 14-14-01.',
        estimatedTime: '1-2 weeks'
      },
      {
        number: 2,
        title: 'Type Testing',
        description: 'Conduct type testing at NMPA-accredited testing institutes in China.',
        documents: ['Test application', 'Product samples', 'Technical requirements'],
        tips: 'Plan for 2-3 months for testing. Some products may require testing at specific institutes.',
        estimatedTime: '8-12 weeks'
      },
      {
        number: 3,
        title: 'Clinical Evaluation',
        description: 'Prepare clinical evaluation report or conduct clinical trials based on product risk classification.',
        documents: ['Clinical evaluation report', 'Literature review', 'Clinical data'],
        tips: 'Class II devices may use clinical evaluation. Class III devices often require clinical trials in China.',
        estimatedTime: '4-24 weeks'
      },
      {
        number: 4,
        title: 'Quality System Assessment',
        description: 'NMPA conducts quality system assessment (GMP inspection) for Class II and III devices.',
        documents: ['Quality system documentation', 'Manufacturing information', 'ISO 13485 certificate'],
        tips: 'Foreign manufacturers may be subject to on-site inspections. Prepare Chinese translations.',
        estimatedTime: '4-8 weeks'
      },
      {
        number: 5,
        title: 'Registration Application',
        description: 'Submit registration application through NMPA eRPS system with all required documentation.',
        documents: ['Registration application form', 'Technical documentation', 'Test reports', 'Clinical data'],
        tips: 'All documents must be in Chinese or with Chinese translations. Use qualified local agent.',
        estimatedTime: '2-4 weeks'
      },
      {
        number: 6,
        title: 'Review & Approval',
        description: 'NMPA conducts technical review. May request additional information during review.',
        documents: ['Application receipt', 'Review correspondence', 'Supplemental data'],
        tips: 'Class II: 60 working days. Class III: 90 working days. Prepare for potential AI requests.',
        estimatedTime: '60-90 working days'
      }
    ],
    templates: [
      { name: 'Registration Application Template', format: 'DOCX', size: '234 KB' },
      { name: 'Technical Requirements Template', format: 'DOCX', size: '189 KB' },
      { name: 'Clinical Evaluation Template', format: 'DOCX', size: '267 KB' },
      { name: 'Chinese Labeling Template', format: 'DOCX', size: '156 KB' }
    ]
  },
  'ukca-marking': {
    title: 'UKCA Marking Post-Brexit',
    overview: 'UKCA marking replaced CE marking for products placed on the Great Britain market (England, Wales, Scotland) after Brexit.',
    prerequisites: [
      'UK Responsible Person (if manufacturer outside UK)',
      'Product technical documentation',
      'Risk assessment',
      'Test reports',
      'Quality management system'
    ],
    steps: [
      {
        number: 1,
        title: 'Determine UKCA Applicability',
        description: 'Confirm UKCA marking is required for your product and market (GB, not Northern Ireland).',
        documents: ['Market analysis', 'Product scope definition'],
        tips: 'Northern Ireland still uses CE marking under the Windsor Framework. England, Wales, Scotland use UKCA.',
        estimatedTime: '1 week'
      },
      {
        number: 2,
        title: 'Identify Designated Standards',
        description: 'Identify UK designated standards that apply to your PPE product.',
        documents: ['Standards list', 'Gap analysis'],
        tips: 'UK designated standards are largely aligned with EU harmonized standards but check for updates.',
        estimatedTime: '1 week'
      },
      {
        number: 3,
        title: 'Conformity Assessment',
        description: 'Complete conformity assessment according to UK regulations. Category II and III require UK Approved Body.',
        documents: ['Technical documentation', 'Test reports', 'Quality system documentation'],
        tips: 'Use a UK Approved Body for Category II and III. Some EU Notified Bodies also have UK approval.',
        estimatedTime: '4-8 weeks'
      },
      {
        number: 4,
        title: 'UK Declaration of Conformity',
        description: 'Prepare UK Declaration of Conformity referencing UK legislation and designated standards.',
        documents: ['UK DoC', 'Technical documentation'],
        tips: 'Reference the PPE Regulations 2018 (SI 2018/860) not EU Regulation 2016/425.',
        estimatedTime: '1 week'
      },
      {
        number: 5,
        title: 'UKCA Marking & Market Entry',
        description: 'Affix UKCA marking to product and packaging. Ensure UK Responsible Person is identified if applicable.',
        documents: ['UKCA marking artwork', 'Labeling', 'User instructions'],
        tips: 'UKCA marking must be at least 5mm high. Include Approved Body number for Category II and III.',
        estimatedTime: '1-2 weeks'
      }
    ],
    templates: [
      { name: 'UK DoC Template', format: 'DOCX', size: '92 KB' },
      { name: 'Technical File Template', format: 'DOCX', size: '234 KB' },
      { name: 'UK Labeling Template', format: 'DOCX', size: '108 KB' }
    ]
  }
}

export default function ComplianceGuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)

  const handleDownload = (templateName: string) => {
    // 模拟下载功能
    alert(`Downloading: ${templateName}\n\nNote: This is a demo. In production, this would download the actual template file.`)
  }

  if (selectedGuide) {
    const guide = GUIDE_DETAILS[selectedGuide]
    if (!guide) return null

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => setSelectedGuide(null)}
              className="text-[#339999] hover:underline mb-4 flex items-center gap-1"
            >
              ← Back to Guides
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{guide.title}</h1>
            <p className="mt-2 text-gray-600 max-w-3xl">{guide.overview}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Prerequisites */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#339999]" />
                  Prerequisites
                </h2>
                <ul className="space-y-3">
                  {guide.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#339999]" />
                  Step-by-Step Process
                </h2>
                {guide.steps.map((step) => (
                  <div key={step.number} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#339999]/10 to-transparent p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center font-bold">
                          {step.number}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-gray-700">{step.description}</p>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          Required Documents
                        </h4>
                        <ul className="space-y-1">
                          {step.documents.map((doc, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Pro Tips
                        </h4>
                        <p className="text-sm text-blue-800">{step.tips}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Estimated time: {step.estimatedTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Templates */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#339999]" />
                  Download Templates
                </h3>
                <div className="space-y-3">
                  {guide.templates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDownload(template.name)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.format} • {template.size}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-xl shadow-sm p-6 text-white">
                <h3 className="font-bold mb-4">Need Help?</h3>
                <p className="text-sm text-white/90 mb-4">
                  Our compliance experts can guide you through the entire certification process.
                </p>
                <Button className="w-full bg-white text-[#339999] hover:bg-gray-100">
                  Contact Expert
                </Button>
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
              Compliance Guides
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Step-by-step guides to navigate PPE certification requirements across global markets
            </p>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {COMPLIANCE_GUIDES.map((guide) => (
            <div
              key={guide.id}
              onClick={() => setSelectedGuide(guide.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{guide.flag}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#339999] transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{guide.market}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#339999]/10 text-[#339999] text-xs font-medium rounded-full">
                    {guide.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-6">{guide.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#339999]">{guide.steps}</div>
                    <div className="text-xs text-gray-600">Steps</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-[#339999]">{guide.timeline}</div>
                    <div className="text-xs text-gray-600">Timeline</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-bold text-[#339999]">{guide.cost}</div>
                    <div className="text-xs text-gray-600">Est. Cost</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Difficulty: </span>
                    <span className={`text-sm font-medium ${
                      guide.difficulty === 'High' || guide.difficulty === 'Very High' 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                    }`}>
                      {guide.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center text-[#339999] font-medium group-hover:gap-2 transition-all">
                    View Guide
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Globe className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Global Standards</h3>
            <p className="text-sm text-gray-600 mb-4">Compare standards across different markets</p>
            <a href="/ppe/regulations" className="text-[#339999] hover:underline text-sm font-medium">
              View Standards →
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Factory className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manufacturer Directory</h3>
            <p className="text-sm text-gray-600 mb-4">Find certified PPE manufacturers</p>
            <a href="/ppe/manufacturers" className="text-[#339999] hover:underline text-sm font-medium">
              Browse Manufacturers →
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Shield className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Certification Check</h3>
            <p className="text-sm text-gray-600 mb-4">Verify product certifications</p>
            <a href="/ppe/certification-comparison" className="text-[#339999] hover:underline text-sm font-medium">
              Check Certification →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
