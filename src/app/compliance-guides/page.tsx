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
  ArrowRight,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  Link2
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

// 政府费用数据
const GOVERNMENT_FEES: Record<string, {
  currency: string
  fees: {
    name: string
    amount: string
    description: string
    recurring?: string
  }[]
  totalRange: string
}> = {
  'ce-marking': {
    currency: 'EUR',
    fees: [
      {
        name: 'EU Type Examination',
        amount: '€5,000 - €12,000',
        description: 'Assessment by a Notified Body for Category II/III PPE'
      },
      {
        name: 'Production Quality Assurance',
        amount: '€4,000 - €10,000',
        description: 'Quality system audit and surveillance for Category III PPE'
      },
      {
        name: 'CE Marking Fee',
        amount: '€0',
        description: 'Self-declaration — no government fee for affixing the CE mark'
      },
      {
        name: 'Notified Body Annual Fee',
        amount: '€2,000 - €5,000',
        description: 'Ongoing annual surveillance and audit fee',
        recurring: 'yearly'
      }
    ],
    totalRange: '€11,000 - €27,000+'
  },
  'fda-510k': {
    currency: 'USD',
    fees: [
      {
        name: 'FDA 510(k) Review Fee',
        amount: '$12,754 / $57,852',
        description: 'Small business / standard fee for FY2025 510(k) submission'
      },
      {
        name: 'FDA Establishment Registration',
        amount: '$7,652/year',
        description: 'Annual registration fee for device establishments',
        recurring: 'yearly'
      },
      {
        name: 'US Agent Fee',
        amount: '$1,500 - $5,000',
        description: 'Fee for designated US Agent service (foreign manufacturers)'
      }
    ],
    totalRange: '$21,906 - $70,504+'
  },
  'nmpa-registration': {
    currency: 'CNY',
    fees: [
      {
        name: 'Registration Fee (Class II)',
        amount: '¥63,900',
        description: 'NMPA registration fee for Class II medical devices'
      },
      {
        name: 'Registration Fee (Class III)',
        amount: '¥83,600',
        description: 'NMPA registration fee for Class III medical devices'
      },
      {
        name: 'Type Testing Fee',
        amount: '¥30,000 - ¥80,000',
        description: 'Testing fee at NMPA-accredited testing institutes'
      },
      {
        name: 'Registration Agent Fee',
        amount: '¥20,000 - ¥50,000',
        description: 'Fee for local registration agent / legal representative'
      }
    ],
    totalRange: '¥113,900 - ¥213,600+'
  },
  'ukca-marking': {
    currency: 'GBP',
    fees: [
      {
        name: 'UK Approved Body Fee',
        amount: '£3,000 - £10,000',
        description: 'Assessment fee by a UK Approved Body for Category II/III PPE'
      },
      {
        name: 'UK Responsible Person',
        amount: '£1,000 - £3,000/year',
        description: 'Annual fee for UK Responsible Person (non-UK manufacturers)',
        recurring: 'yearly'
      },
      {
        name: 'UKCA Marking Fee',
        amount: '£0',
        description: 'Self-declaration — no government fee for affixing the UKCA mark'
      }
    ],
    totalRange: '£4,000 - £13,000+'
  }
}

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

type GuideTab = 'steps' | 'timeline' | 'fees' | 'templates'

export default function ComplianceGuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<GuideTab>('steps')

  const handleDownload = (templateName: string) => {
    if (!selectedGuide) return
    const guide = GUIDE_DETAILS[selectedGuide]
    if (!guide) return

    const date = new Date().toISOString().split('T')[0]
    const year = new Date().getFullYear()
    const docId = `${selectedGuide.toUpperCase()}-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${templateName}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #333; margin: 40px; }
  h1 { color: #339999; font-size: 22pt; border-bottom: 2px solid #339999; padding-bottom: 8px; margin-top: 24px; }
  h2 { color: #339999; font-size: 16pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  h3 { color: #555; font-size: 13pt; margin-top: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th { background-color: #339999; color: white; padding: 8px; text-align: left; border: 1px solid #2d8b8b; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  .header { text-align: center; border-bottom: 3px solid #339999; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { border: none; font-size: 28pt; margin-bottom: 4px; color: #339999; }
  .header p { color: #666; font-size: 10pt; }
  .step-number { display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; background-color: #339999; color: white; border-radius: 50%; font-weight: bold; margin-right: 8px; }
  .tips { background-color: #f0f7f7; border-left: 4px solid #339999; padding: 12px 16px; margin: 12px 0; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 9pt; text-align: center; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>MDLooker</h1>
  <p>PPE Compliance Platform</p>
</div>

<h1>${templateName}</h1>

<table>
<tr><th style="width: 200px;">Guide</th><td>${guide.title}</td></tr>
<tr><th>Generated Date</th><td>${date}</td></tr>
<tr><th>Document ID</th><td>${docId}</td></tr>
<tr><th>Version</th><td>1.0</td></tr>
</table>

<h2>Overview</h2>
<p>${guide.overview}</p>

<h2>Prerequisites</h2>
<ul>
${guide.prerequisites.map(p => `<li>${p}</li>`).join('\n')}
</ul>

<h2>Step-by-Step Process</h2>

${guide.steps.map(step => `
<h3><span class="step-number">${step.number}</span> ${step.title}</h3>
<p>${step.description}</p>

<table>
<tr><th style="width: 40px;">#</th><th>Required Document</th></tr>
${step.documents.map((doc, idx) => `<tr><td>${idx + 1}</td><td>${doc}</td></tr>`).join('\n')}
</table>

<div class="tips">
<strong>Pro Tips:</strong> ${step.tips}
</div>

<p><em>Estimated time: ${step.estimatedTime}</em></p>
`).join('\n')}

<h2>Summary Timeline</h2>
<table>
<tr><th>Step</th><th>Title</th><th>Estimated Time</th></tr>
${guide.steps.map(step => `<tr><td>${step.number}</td><td>${step.title}</td><td>${step.estimatedTime}</td></tr>`).join('\n')}
</table>

<h2>Available Templates</h2>
<table>
<tr><th>Template Name</th><th>Format</th><th>Size</th></tr>
${guide.templates.map(t => `<tr><td>${t.name}</td><td>${t.format}</td><td>${t.size}</td></tr>`).join('\n')}
</table>

<div class="footer">
<p>Generated by MDLooker PPE Compliance Platform | ${date}</p>
<p><em>Template: ${templateName} | Guide: ${guide.title} | Document ID: ${docId}</em></p>
<p><em>This document is confidential and proprietary. Unauthorized distribution is prohibited.</em></p>
</div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${templateName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_${date}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const tabs: { id: GuideTab; label: string; icon: React.ReactNode }[] = [
    { id: 'steps', label: 'Step-by-Step', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> }
  ]

  if (selectedGuide) {
    const guide = GUIDE_DETAILS[selectedGuide]
    const fees = GOVERNMENT_FEES[selectedGuide]
    if (!guide) return null

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => { setSelectedGuide(null); setActiveTab('steps') }}
              className="text-[#339999] hover:underline mb-4 flex items-center gap-1"
            >
              &larr; Back to Guides
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{guide.title}</h1>
            <p className="mt-2 text-gray-600 max-w-3xl">{guide.overview}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Guide sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#339999] text-[#339999]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Prerequisites - always visible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
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

          {/* Tab Content */}
          {activeTab === 'steps' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Steps */}
              <div className="lg:col-span-2 space-y-6">
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

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Templates Quick Access */}
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
                          <p className="text-xs text-gray-500">{template.format} &bull; {template.size}</p>
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
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-4xl mx-auto">
              {/* Total Estimated Time */}
              <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] rounded-xl p-6 mb-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Total Estimated Time</h2>
                </div>
                <p className="text-3xl font-bold">
                  {COMPLIANCE_GUIDES.find(g => g.id === selectedGuide)?.timeline}
                </p>
                <p className="text-sm text-white/80 mt-1">
                  Estimated duration from start to market entry. Actual timelines may vary based on product complexity and regulatory body workload.
                </p>
              </div>

              {/* Visual Timeline */}
              <div className="space-y-0">
                {guide.steps.map((step, idx) => (
                  <div key={step.number} className="relative flex gap-6">
                    {/* Timeline line and node */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                        idx === 0
                          ? 'bg-[#339999] text-white ring-4 ring-[#339999]/20'
                          : idx === guide.steps.length - 1
                          ? 'bg-green-500 text-white ring-4 ring-green-500/20'
                          : 'bg-[#339999] text-white'
                      }`}>
                        {step.number}
                      </div>
                      {idx < guide.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-[#339999] to-[#339999]/30 min-h-[40px]" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className={`flex-1 pb-8 ${idx === guide.steps.length - 1 ? 'pb-0' : ''}`}>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-[#339999]/10 text-[#339999] text-sm font-medium rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            {step.estimatedTime}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                        {idx < guide.steps.length - 1 && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                            <ArrowRight className="w-3 h-3" />
                            <span>Next: {guide.steps[idx + 1].title}</span>
                          </div>
                        )}
                        {idx === guide.steps.length - 1 && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Certification complete - ready for market entry</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Legend */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Timeline Notes</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#339999] rounded-full mt-1.5 flex-shrink-0" />
                    Timelines are estimates and may vary based on product complexity and regulatory workload.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#339999] rounded-full mt-1.5 flex-shrink-0" />
                    Some steps may overlap. For example, documentation preparation can begin while testing is underway.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#339999] rounded-full mt-1.5 flex-shrink-0" />
                    Steps marked &quot;Ongoing&quot; continue after initial market entry and require continued compliance.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="max-w-4xl mx-auto">
              {/* Total Estimated Fees */}
              <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] rounded-xl p-6 mb-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Estimated Government Fees</h2>
                </div>
                <p className="text-3xl font-bold">{fees?.totalRange}</p>
                <p className="text-sm text-white/80 mt-1">
                  Government fees only. Does not include consulting, testing, or internal resource costs. Fees are approximate and subject to change.
                </p>
              </div>

              {/* Fee Breakdown */}
              {fees && (
                <div className="space-y-4">
                  {fees.fees.map((fee, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            fee.amount === '€0' || fee.amount === '£0'
                              ? 'bg-green-100'
                              : 'bg-[#339999]/10'
                          }`}>
                            <Receipt className={`w-5 h-5 ${
                              fee.amount === '€0' || fee.amount === '£0'
                                ? 'text-green-600'
                                : 'text-[#339999]'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{fee.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                            {fee.recurring && (
                              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                                <Clock className="w-3 h-3" />
                                Recurring {fee.recurring}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${
                            fee.amount === '€0' || fee.amount === '£0'
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }`}>
                            {fee.amount === '€0' || fee.amount === '£0' ? 'Free' : fee.amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fee Notes */}
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Important Notes
                </h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    Government fees are subject to annual adjustments. Always verify current fees with the relevant authority.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    Fee ranges reflect variation based on product category, complexity, and the specific body performing the assessment.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    Additional costs may include testing fees, translation services, consulting, and travel for on-site inspections.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    Small business discounts may be available (e.g., FDA small business qualification reduces 510(k) fees significantly).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="max-w-4xl mx-auto">
              {/* Templates Header */}
              <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] rounded-xl p-6 mb-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Document Templates</h2>
                </div>
                <p className="text-sm text-white/80">
                  Download ready-to-use templates for your certification documentation. All templates are available in the Documents section.
                </p>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.templates.map((template, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        template.format === 'DOCX'
                          ? 'bg-blue-50'
                          : template.format === 'XLSX'
                          ? 'bg-green-50'
                          : 'bg-gray-50'
                      }`}>
                        {template.format === 'DOCX' ? (
                          <FileText className="w-6 h-6 text-blue-600" />
                        ) : template.format === 'XLSX' ? (
                          <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            template.format === 'DOCX'
                              ? 'bg-blue-100 text-blue-700'
                              : template.format === 'XLSX'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {template.format}
                          </span>
                          <span className="text-xs text-gray-500">{template.size}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleDownload(template.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#339999] text-white text-xs font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                          <a
                            href="/documents"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            View in Documents
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Browse All Templates CTA */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Need more templates?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Browse our complete library of compliance document templates for all markets and certification types.
                </p>
                <a
                  href="/documents"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#339999] text-white font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Browse All Templates
                </a>
              </div>
            </div>
          )}
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
            <a href="/regulations" className="text-[#339999] hover:underline text-sm font-medium">
              View Standards &rarr;
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Factory className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manufacturer Directory</h3>
            <p className="text-sm text-gray-600 mb-4">Find certified PPE manufacturers</p>
            <a href="/manufacturers" className="text-[#339999] hover:underline text-sm font-medium">
              Browse Manufacturers &rarr;
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Shield className="w-10 h-10 text-[#339999] mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Certification Check</h3>
            <p className="text-sm text-gray-600 mb-4">Verify product certifications</p>
            <a href="/certification-comparison" className="text-[#339999] hover:underline text-sm font-medium">
              Check Certification &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
