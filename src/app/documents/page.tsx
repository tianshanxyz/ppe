'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Download,
  Search,
  FileSpreadsheet,
  FileCheck,
  BookOpen,
  Shield,
  ClipboardList,
  Clock,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Loader2,
  ChevronRight,
  Globe,
  Package,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { createClient } from '@/lib/supabase/client'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

// 文档分类
const CATEGORIES = [
  { id: 'all', name: 'All Documents', icon: FileText },
  { id: 'templates', name: 'Templates', icon: FileSpreadsheet },
  { id: 'checklists', name: 'Checklists', icon: ClipboardList },
  { id: 'guides', name: 'Guides', icon: BookOpen },
  { id: 'regulations', name: 'Regulations', icon: Shield },
  { id: 'standards', name: 'Standards', icon: FileCheck },
]

// 填写指南数据
const FILLING_GUIDES: Record<string, {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    tips: string[];
    required: boolean;
  }>;
}> = {
  'ce-technical-file': {
    title: 'CE Technical File Filling Guide',
    sections: [
      {
        heading: '1. Product Description',
        content: 'Provide a complete description of the PPE product including intended use, target users, and product variants.',
        tips: [
          'Include all product variants and accessories',
          'Specify the protection level and performance characteristics',
          'Attach product photos and technical drawings'
        ],
        required: true
      },
      {
        heading: '2. Risk Assessment (ISO 14971)',
        content: 'Document all identified risks, risk analysis, and risk control measures implemented.',
        tips: [
          'Cover all foreseeable hazards for intended use',
          'Include risk-benefit analysis',
          'Document residual risks after controls'
        ],
        required: true
      },
      {
        heading: '3. Essential Requirements Checklist',
        content: 'Demonstrate compliance with all applicable essential requirements of EU 2016/425.',
        tips: [
          'Reference each ER from Annex II',
          'Provide justification for non-applicable ERs',
          'Link to supporting documentation'
        ],
        required: true
      },
      {
        heading: '4. Test Reports',
        content: 'Include all test reports from accredited laboratories demonstrating compliance with harmonized standards.',
        tips: [
          'Ensure lab is ISO 17025 accredited',
          'Tests must cover all claimed performance levels',
          'Include raw test data where required'
        ],
        required: true
      },
      {
        heading: '5. Quality Assurance',
        content: 'Describe the quality management system and production control procedures.',
        tips: [
          'Reference ISO 9001 or ISO 13485 certification if applicable',
          'Include production process flow chart',
          'Document incoming material inspection procedures'
        ],
        required: true
      }
    ]
  },
  'ce-risk-assessment': {
    title: 'Risk Assessment Template Filling Guide',
    sections: [
      {
        heading: '1. Hazard Identification',
        content: 'List all potential hazards associated with the product throughout its lifecycle.',
        tips: [
          'Consider hazards during normal use, foreseeable misuse, and disposal',
          'Include chemical, biological, mechanical, and thermal hazards',
          'Use structured methods like FMEA or HAZOP'
        ],
        required: true
      },
      {
        heading: '2. Risk Estimation',
        content: 'Estimate the probability and severity of each identified hazard.',
        tips: [
          'Use quantitative or semi-quantitative scales',
          'Consider worst-case scenarios',
          'Document the rationale for probability assignments'
        ],
        required: true
      },
      {
        heading: '3. Risk Control Measures',
        content: 'Document all risk control measures implemented following the hierarchy of controls.',
        tips: [
          'Prioritize inherent safety design over protective measures',
          'Include warnings and instructions as last resort',
          'Verify each control measure is effective'
        ],
        required: true
      }
    ]
  },
  'fda-510k-cover': {
    title: 'FDA 510(k) Cover Letter Guide',
    sections: [
      {
        heading: '1. Device Identification',
        content: 'Provide clear identification of the device including trade name, model numbers, and classification.',
        tips: [
          'Include all model numbers and variants',
          'Reference the correct FDA product code',
          'Specify the regulation number (21 CFR)'
        ],
        required: true
      },
      {
        heading: '2. Predicate Device',
        content: 'Identify the legally marketed predicate device to which substantial equivalence is claimed.',
        tips: [
          'Use FDA 510(k) number or K-number',
          'Ensure predicate is legally marketed',
          'Document similarities and differences'
        ],
        required: true
      },
      {
        heading: '3. Indications for Use',
        content: 'Clearly state the intended use and indications for use of the device.',
        tips: [
          'Match predicate device indications as closely as possible',
          'Be specific about patient population',
          'Avoid overly broad claims'
        ],
        required: true
      }
    ]
  }
}

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
    icon: FileSpreadsheet,
    hasGuide: true,
    guideSections: 5
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
    icon: FileSpreadsheet,
    hasGuide: true,
    guideSections: 3
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
    icon: FileCheck,
    hasGuide: false
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
    icon: FileText,
    hasGuide: false
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
    icon: FileText,
    hasGuide: true,
    guideSections: 3
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
    icon: FileCheck,
    hasGuide: false
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
    icon: FileText,
    hasGuide: false
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
    icon: FileText,
    hasGuide: false
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
    icon: FileSpreadsheet,
    hasGuide: false
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
    icon: FileText,
    hasGuide: false
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
    icon: FileCheck,
    hasGuide: false
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
    icon: ClipboardList,
    hasGuide: false
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
    icon: ClipboardList,
    hasGuide: false
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
    icon: ClipboardList,
    hasGuide: false
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
    icon: BookOpen,
    hasGuide: false
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
    icon: BookOpen,
    hasGuide: false
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
    icon: BookOpen,
    hasGuide: false
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
    icon: Shield,
    hasGuide: false
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
    icon: Shield,
    hasGuide: false
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
    icon: Shield,
    hasGuide: false
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
    icon: FileCheck,
    hasGuide: false
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
    icon: FileCheck,
    hasGuide: false
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
    icon: FileCheck,
    hasGuide: false
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
    icon: FileCheck,
    hasGuide: false
  }
]

// Document Generator Templates
interface DocumentTemplate {
  id: string
  name: string
  name_zh: string
  description: string
  required: boolean
  category: 'technical' | 'regulatory' | 'quality' | 'labeling'
  authority: string
  fields: { label: string; placeholder: string; required: boolean }[]
}

const DOCUMENT_TEMPLATES: Record<string, Record<string, DocumentTemplate[]>> = {
  'respiratory-protection': {
    'EU': [
      {
        id: 'eu-tech-file',
        name: 'EU Technical File (Annex III)',
        name_zh: '欧盟技术文件（附件III）',
        description: 'Complete technical documentation required by EU Regulation 2016/425 Annex III for Category III PPE',
        required: true,
        category: 'technical',
        authority: 'European Commission - Notified Body',
        fields: [
          { label: 'Product Name', placeholder: 'e.g., N95 Particulate Respirator', required: true },
          { label: 'Model/Type', placeholder: 'e.g., Model XR-500', required: true },
          { label: 'Manufacturer Name', placeholder: 'e.g., SafeGuard PPE Co., Ltd.', required: true },
          { label: 'Manufacturer Address', placeholder: 'Full registered address', required: true },
          { label: 'Notified Body', placeholder: 'e.g., BSI Group (0086)', required: true },
          { label: 'EU Representative', placeholder: 'Authorized EU representative name and address', required: true },
          { label: 'Applied Standards', placeholder: 'e.g., EN 149:2001+A1:2009', required: true },
          { label: 'Risk Category', placeholder: 'Category III', required: true },
        ]
      },
      {
        id: 'eu-doc',
        name: 'EU Declaration of Conformity (Annex VI)',
        name_zh: '欧盟符合性声明（附件VI）',
        description: 'Official DoC template per EU 2016/425 Annex VI with all required declarations',
        required: true,
        category: 'regulatory',
        authority: 'European Commission',
        fields: [
          { label: 'Product Name', placeholder: 'e.g., N95 Particulate Respirator', required: true },
          { label: 'Product Code/Model', placeholder: 'e.g., XR-500', required: true },
          { label: 'Manufacturer Name', placeholder: 'Legal entity name', required: true },
          { label: 'Manufacturer Address', placeholder: 'Complete address', required: true },
          { label: 'Notified Body Name', placeholder: 'e.g., BSI Group', required: true },
          { label: 'Notified Body Number', placeholder: 'e.g., 0086', required: true },
          { label: 'EU Type Examination Cert No.', placeholder: 'e.g., CE-12345-2026', required: true },
          { label: 'Applicable Regulation', placeholder: 'EU Regulation 2016/425', required: true },
          { label: 'Harmonized Standards', placeholder: 'List all applied EN standards', required: true },
          { label: 'Authorized Signatory', placeholder: 'Name and title', required: true },
        ]
      },
      {
        id: 'eu-risk-assessment',
        name: 'Risk Assessment Report (EN ISO 12100)',
        name_zh: '风险评估报告（EN ISO 12100）',
        description: 'Comprehensive risk assessment following EN ISO 12100 and ISO 14971',
        required: true,
        category: 'technical',
        authority: 'CEN/CENELEC',
        fields: [
          { label: 'Product Name', placeholder: 'Product commercial name', required: true },
          { label: 'Intended Use', placeholder: 'Describe intended use and foreseeable misuse', required: true },
          { label: 'User Groups', placeholder: 'e.g., Industrial workers, healthcare professionals', required: true },
          { label: 'Hazard Analysis Date', placeholder: 'YYYY-MM-DD', required: true },
          { label: 'Risk Assessment Team', placeholder: 'Names and roles of assessors', required: true },
        ]
      },
    ],
    'US': [
      {
        id: 'fda-510k',
        name: 'FDA 510(k) Premarket Notification',
        name_zh: 'FDA 510(k)上市前通知',
        description: 'Complete FDA 510(k) submission template for respiratory protective devices (21 CFR 878.4040)',
        required: true,
        category: 'regulatory',
        authority: 'U.S. Food and Drug Administration (FDA)',
        fields: [
          { label: 'Device Trade Name', placeholder: 'e.g., SafeGuard N95 Respirator', required: true },
          { label: 'Device Classification', placeholder: 'e.g., Surgical N95 Respirator (21 CFR 878.4040)', required: true },
          { label: 'Product Code', placeholder: 'e.g., MSH (N95 respirator)', required: true },
          { label: 'Submitter Company', placeholder: 'Legal company name', required: true },
          { label: 'Submitter Address', placeholder: 'Complete U.S. or foreign address', required: true },
          { label: 'Contact Person', placeholder: 'Regulatory affairs contact', required: true },
          { label: 'Predicate Device Name', placeholder: 'Legally marketed predicate device', required: true },
          { label: 'Predicate 510(k) Number', placeholder: 'e.g., K123456', required: true },
          { label: 'NIOSH Approval Number', placeholder: 'e.g., TC-84A-1234', required: true },
          { label: 'Indications for Use', placeholder: 'Detailed intended use statement', required: true },
        ]
      },
      {
        id: 'fda-design-control',
        name: 'FDA Design Control Documentation (21 CFR 820.30)',
        name_zh: 'FDA设计控制文件（21 CFR 820.30）',
        description: 'Design history file (DHF) template covering all design control requirements',
        required: true,
        category: 'technical',
        authority: 'U.S. Food and Drug Administration (FDA)',
        fields: [
          { label: 'Device Name', placeholder: 'Commercial device name', required: true },
          { label: 'Model Number', placeholder: 'e.g., XR-500', required: true },
          { label: 'Design Team', placeholder: 'Names and roles', required: true },
          { label: 'Project Start Date', placeholder: 'YYYY-MM-DD', required: true },
          { label: 'Design Plan Reference', placeholder: 'Document number', required: true },
        ]
      },
    ],
    'CN': [
      {
        id: 'nmpa-registration',
        name: 'NMPA Registration Application (医疗器械注册)',
        name_zh: 'NMPA注册申请',
        description: 'China NMPA Class II/III medical device registration application template (Order No. 47)',
        required: true,
        category: 'regulatory',
        authority: 'National Medical Products Administration (NMPA)',
        fields: [
          { label: 'Product Name (中文)', placeholder: '产品中文名称', required: true },
          { label: 'Product Name (English)', placeholder: 'Product English name', required: true },
          { label: 'Model/Specification', placeholder: '型号/规格', required: true },
          { label: 'Classification Code', placeholder: 'e.g., 14-14-01 (医用防护口罩)', required: true },
          { label: 'Management Category', placeholder: 'e.g., Class II (二类)', required: true },
          { label: 'Applicant Name', placeholder: '注册申请人名称', required: true },
          { label: 'Applicant Address', placeholder: '注册申请人住所', required: true },
          { label: 'Manufacturing Address', placeholder: '生产地址', required: true },
          { label: 'Registration Agent', placeholder: '代理人名称（境外企业）', required: false },
          { label: 'Intended Use (中文)', placeholder: '适用范围', required: true },
        ]
      },
    ],
  },
  'safety-footwear': {
    'EU': [
      {
        id: 'eu-tech-file-sf',
        name: 'EU Technical File - Safety Footwear (EN ISO 20345)',
        name_zh: '欧盟技术文件 - 安全鞋（EN ISO 20345）',
        description: 'Technical documentation for safety footwear CE marking under Regulation 2016/425',
        required: true,
        category: 'technical',
        authority: 'European Commission - Notified Body',
        fields: [
          { label: 'Product Name', placeholder: 'e.g., Steel Toe Safety Boots', required: true },
          { label: 'Model/Type', placeholder: 'e.g., ProGuard X1', required: true },
          { label: 'Safety Class', placeholder: 'e.g., S3, S5, SB', required: true },
          { label: 'Manufacturer', placeholder: 'Company legal name', required: true },
          { label: 'Notified Body', placeholder: 'e.g., SGS (0120)', required: true },
          { label: 'Applied Standards', placeholder: 'EN ISO 20345:2022', required: true },
        ]
      },
    ],
    'US': [
      {
        id: 'astm-f2413',
        name: 'ASTM F2413 Compliance Report',
        name_zh: 'ASTM F2413合规报告',
        description: 'Standard specification compliance report for foot protection (ASTM F2413-18)',
        required: true,
        category: 'technical',
        authority: 'ASTM International',
        fields: [
          { label: 'Product Name', placeholder: 'e.g., Composite Toe Work Boot', required: true },
          { label: 'Manufacturer', placeholder: 'Company name', required: true },
          { label: 'Impact Rating', placeholder: 'e.g., I/75 (75 ft-lb)', required: true },
          { label: 'Compression Rating', placeholder: 'e.g., C/75 (2500 lbs)', required: true },
          { label: 'Test Lab', placeholder: 'ISO 17025 accredited lab name', required: true },
        ]
      },
    ],
  },
}

function generateOfficialDocument(template: DocumentTemplate, formData: Record<string, string>, category: string, market: string): string {
  const date = new Date().toISOString().split('T')[0]
  const year = new Date().getFullYear()

  const categoryNames: Record<string, string> = {
    'respiratory-protection': 'Respiratory Protection',
    'safety-footwear': 'Safety Footwear',
    'safety-gloves': 'Safety Gloves',
    'head-protection': 'Head Protection',
    'protective-clothing': 'Protective Clothing',
    'eye-protection': 'Eye Protection',
  }

  const marketNames: Record<string, string> = {
    'EU': 'European Union',
    'US': 'United States',
    'UK': 'United Kingdom',
    'CN': 'China',
    'JP': 'Japan',
  }

  const filledFields = template.fields.map((field) => {
    const value = formData[field.label] || `[${field.placeholder}]`
    return `| ${field.label} | ${value} |`
  }).join('\n')

  const header = `# ${template.name}

**Document Type:** ${template.category.toUpperCase()}
**Authority:** ${template.authority}
**Product Category:** ${categoryNames[category] || category}
**Target Market:** ${marketNames[market] || market}
**Generated Date:** ${date}
**Document ID:** ${template.id.toUpperCase()}-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}

---

## Product and Manufacturer Information

| Field | Value |
|-------|-------|
${filledFields}

---

`

  let body = ''

  if (template.id === 'eu-tech-file') {
    body = `## 1. SCOPE AND APPLICATION

This Technical File is prepared in accordance with EU Regulation 2016/425 (Personal Protective Equipment Regulation) and establishes the technical basis for the conformity assessment of the above-mentioned product.

**Regulatory Basis:**
- Regulation (EU) 2016/425 of the European Parliament and of the Council
- Annex III - Technical Documentation Requirements
- Applicable harmonized standards under the EU Official Journal

## 2. PRODUCT DESCRIPTION

### 2.1 General Description
[Detailed description of the product including design, materials, dimensions, and intended use]

### 2.2 Technical Specifications
- **Model/Type:** ${formData['Model/Type'] || '[To be completed]'}
- **Materials:** [List all materials in contact with user]
- **Dimensions:** [Specify size range and tolerances]
- **Weight:** [Product weight in grams/kg]

### 2.3 Intended Use
[Clear statement of intended use, user population, and use environment]

### 2.4 Foreseeable Misuse
[Description of reasonably foreseeable misuse and associated risks]

## 3. RISK ASSESSMENT

### 3.1 Hazard Identification
| Hazard ID | Hazard Description | Origin | Potential Harm |
|-----------|-------------------|--------|----------------|
| H-001 | [Mechanical hazard] | [Design/Material] | [Injury type] |
| H-002 | [Chemical hazard] | [Material/Environment] | [Health effect] |

### 3.2 Risk Estimation and Evaluation
[Risk estimation per EN ISO 12100, including severity and probability assessment]

### 3.3 Risk Control Measures
[Description of protective measures implemented, following hierarchy of controls]

### 3.4 Residual Risk Assessment
[Assessment of remaining risks after implementation of control measures]

## 4. APPLICABLE STANDARDS AND REQUIREMENTS

### 4.1 Harmonized Standards Applied
| Standard Number | Title | Version | Scope of Application |
|----------------|-------|---------|---------------------|
| EN 149:2001+A1:2009 | Respiratory protective devices - Filtering half masks | 2009 | Filtration efficiency, breathing resistance |
| EN ISO 12100:2010 | Safety of machinery - General principles for design | 2010 | Risk assessment methodology |

### 4.2 Other Technical Specifications
[List any other standards, technical specifications, or requirements applied]

## 5. TEST REPORTS AND VERIFICATION

### 5.1 Summary of Tests Conducted
| Test Parameter | Standard Clause | Test Result | Acceptance Criteria | Pass/Fail |
|---------------|----------------|-------------|-------------------|-----------|
| Filtration Efficiency | EN 149 §7.9 | [Result] | ≥ 94% (FFP2) / ≥ 99% (FFP3) | [Status] |
| Breathing Resistance | EN 149 §7.16 | [Result] | ≤ 0.7 mbar (inhale) | [Status] |
| Total Inward Leakage | EN 149 §7.11 | [Result] | ≤ 8% (FFP2) / ≤ 2% (FFP3) | [Status] |

### 5.2 Testing Laboratory Information
- **Laboratory Name:** [ISO 17025 accredited lab name]
- **Accreditation Body:** [e.g., UKAS, DAkkS]
- **Accreditation Number:** [Lab accreditation number]
- **Test Report Number:** [Report reference]
- **Date of Testing:** [Test completion date]

## 6. MANUFACTURING PROCESS AND QUALITY CONTROL

### 6.1 Production Flow
[Description or diagram of the manufacturing process]

### 6.2 Quality Control Points
| Stage | Inspection Item | Method | Frequency | Acceptance Criteria |
|-------|----------------|--------|-----------|-------------------|
| Incoming | Raw materials | Visual/Chemical | Batch | Per material spec |
| In-process | Dimensions | Measurement | Continuous | ±0.5mm tolerance |
| Final | Performance | Functional test | 100% | Per EN 149 |

### 6.3 Traceability System
[Description of batch coding and traceability procedures]

## 7. LABELING AND USER INFORMATION

### 7.1 Product Labeling
[Description of all labels, markings, and instructions affixed to the product]

### 7.2 User Instructions
[Summary of information provided to the user, including:
- Intended use and limitations
- Fitting instructions
- Maintenance and cleaning
- Storage conditions
- Shelf life/expiration date
- Disposal instructions]

## 8. DECLARATION AND SIGNATURES

This Technical File has been prepared under the responsibility of the manufacturer and contains accurate information to the best of our knowledge.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical File Compiler | [Name] | | |
| Quality Manager | [Name] | | |
| Authorized Representative | [Name] | | |

---

**Document Control:**
- Version: 1.0
- Date: ${date}
- Next Review: ${year + 1}-${date.substring(5)}

*This document is confidential and proprietary. Unauthorized distribution is prohibited.*
`
  } else if (template.id === 'eu-doc') {
    body = `## EU DECLARATION OF CONFORMITY

### Article 1 - Manufacturer Information

The undersigned:

**Manufacturer Name:** ${formData['Manufacturer Name'] || '[To be completed]'}
**Registered Address:** ${formData['Manufacturer Address'] || '[To be completed]'}

Hereby declares under sole responsibility that the product:

### Article 2 - Product Identification

**Product Name:** ${formData['Product Name'] || '[To be completed]'}
**Product Code/Model:** ${formData['Product Code/Model'] || '[To be completed]'}
**Serial/Batch Number:** [As marked on product]

### Article 3 - Conformity Declaration

The product described above is in conformity with the applicable Union harmonization legislation:

**Regulation (EU) 2016/425** of the European Parliament and of the Council of 9 March 2016 on personal protective equipment.

### Article 4 - Applied Standards

The following harmonized standards and/or technical specifications have been applied:

| Standard Reference | Title |
|-------------------|-------|
| EN 149:2001+A1:2009 | Respiratory protective devices - Filtering half masks to protect against particles |
| EN ISO 12100:2010 | Safety of machinery - General principles for design - Risk assessment and risk reduction |
| EN 529:2005 | Respiratory protective devices - Recommendations for selection, use, care and maintenance |

### Article 5 - Conformity Assessment Procedure

The following conformity assessment procedure has been applied:

**Module B (EU Type Examination)**
Notified Body: ${formData['Notified Body Name'] || '[To be completed]'} (${formData['Notified Body Number'] || '[Number]'})
Certificate Number: ${formData['EU Type Examination Cert No.'] || '[To be completed]'}

**Module D (Quality Assurance of Production Process)**
[If applicable, details of quality system certification]

### Article 6 - Authorized Representative

[For non-EU manufacturers]
**Authorized EU Representative:**
Name: [Representative name]
Address: [Representative address in EU]

### Article 7 - Declaration

This declaration is issued under the sole responsibility of the manufacturer. The object of the declaration described above is in conformity with the relevant Union harmonization legislation.

**Signed for and on behalf of:**
${formData['Manufacturer Name'] || '[Company Name]'}

**Place and Date of Issue:**
[City, Country], ${date}

**Authorized Signatory:**
Name: ${formData['Authorized Signatory'] || '[Name and Title]'}
Signature: _________________________

---

**Document Reference:** DoC-${formData['Product Code/Model'] || 'XXX'}-${year}
**Version:** 1.0
**Date:** ${date}
`
  } else if (template.id === 'fda-510k') {
    body = `## FDA 510(k) PREMARKET NOTIFICATION

### Section 1 - Submitter Information

**Submitter:** ${formData['Submitter Company'] || '[Company Name]'}
**Address:** ${formData['Submitter Address'] || '[Complete Address]'}
**Contact Person:** ${formData['Contact Person'] || '[Name, Title]'}
**Telephone:** [Phone number]
**Email:** [Email address]
**Date Prepared:** ${date}

### Section 2 - Device Information

**Device Trade Name:** ${formData['Device Trade Name'] || '[Trade Name]'}
**Common/Usual Name:** ${formData['Device Classification'] || '[Classification Name]'}
**Classification Regulation:** 21 CFR 878.4040
**Product Code:** ${formData['Product Code'] || '[Product Code]'}
**Panel:** Surgical Devices (Panel 78)
**Device Class:** Class II

### Section 3 - Predicate Device

**Predicate Device Trade Name:** ${formData['Predicate Device Name'] || '[Predicate Name]'}
**Predicate 510(k) Number:** ${formData['Predicate 510(k) Number'] || '[K Number]'}
**Predicate Manufacturer:** [Predicate manufacturer]

### Section 4 - Device Description

[Detailed description of the device including:
- Physical characteristics and dimensions
- Materials of construction
- Principles of operation
- Accessories and components
- Packaging and labeling]

### Section 5 - Indications for Use

${formData['Indications for Use'] || '[Detailed intended use statement per 21 CFR 878.4040]'}

### Section 6 - Substantial Equivalence Comparison

| Characteristic | Subject Device | Predicate Device | Comparison |
|---------------|----------------|------------------|------------|
| Intended Use | [Description] | [Description] | [Equivalent/Different] |
| Technology | [Description] | [Description] | [Equivalent/Different] |
| Performance | [Specification] | [Specification] | [Equivalent/Different] |
| Materials | [Materials] | [Materials] | [Equivalent/Different] |

### Section 7 - Performance Data

#### 7.1 Biocompatibility Testing (ISO 10993)
| Test | Standard | Result | Acceptance |
|------|----------|--------|------------|
| Cytotoxicity | ISO 10993-5 | [Pass/Fail] | Non-cytotoxic |
| Sensitization | ISO 10993-10 | [Pass/Fail] | Non-sensitizing |
| Irritation | ISO 10993-10 | [Pass/Fail] | Non-irritating |

#### 7.2 Performance Testing
| Parameter | Test Method | Result | Specification |
|-----------|-------------|--------|---------------|
| Filtration Efficiency | NIOSH TEB-APR-STP-0059 | [%] | ≥ 95.0% |
| Breathing Resistance | NIOSH TEB-APR-STP-0003 | [mm H2O] | ≤ 35 mm H2O |
| Exhalation Valve Leak | NIOSH TEB-APR-STP-0007 | [mL/min] | ≤ 30 mL/min |

#### 7.3 NIOSH Approval
**NIOSH Approval Number:** ${formData['NIOSH Approval Number'] || '[TC-84A-XXXX]'}

### Section 8 - Conclusion

Based on the information provided in this premarket notification, the [Subject Device] is substantially equivalent to the [Predicate Device], legally marketed device.

The subject device has the same intended use and similar technological characteristics as the predicate device. Any differences in technological characteristics do not raise different questions of safety and effectiveness, and the subject device is as safe and effective as the predicate device.

**Signature:** _________________________
**Name:** [Authorized representative]
**Title:** [Title]
**Date:** ${date}

---

**510(k) Number:** [To be assigned by FDA]
**Date Received by FDA:** [FDA receipt date]
`
  } else if (template.id === 'nmpa-registration') {
    body = `## 医疗器械注册申报资料

### 一、申请表

**产品名称（中文）：** ${formData['Product Name (中文)'] || '[产品中文名称]'}
**产品名称（英文）：** ${formData['Product Name (English)'] || '[Product English Name]'}
**型号/规格：** ${formData['Model/Specification'] || '[型号/规格]'}
**分类编码：** ${formData['Classification Code'] || '[分类编码]'}
**管理类别：** ${formData['Management Category'] || '[管理类别]'}

### 二、证明性文件

#### 2.1 企业资质文件
- 企业营业执照副本复印件
- 组织机构代码证复印件（如适用）
- 生产许可证复印件（境内生产企业）

#### 2.2 境外申请人资质（如适用）
- 境外申请人注册地或生产地址所在国家（地区）医疗器械主管部门出具的允许产品上市销售的证明文件
- 境外申请人在中国境内指定代理人的委托书
- 代理人承诺书
- 代理人营业执照副本或机构登记证明复印件

### 三、医疗器械安全有效基本要求清单

[根据《医疗器械注册申报资料要求和批准证明文件格式》（国家药监局公告2021年第121号）填写]

### 四、综述资料

#### 4.1 产品描述
[产品的工作原理、作用机理、结构组成、主要功能、预期用途等]

#### 4.2 型号规格
[产品型号规格划分依据及各型号规格区别]

#### 4.3 包装说明
[产品包装信息，包括内包装、中包装、外包装材料及规格]

#### 4.4 适用范围
${formData['Intended Use (中文)'] || '[适用范围]'}

#### 4.5 禁忌症
[产品禁忌症]

### 五、研究资料

#### 5.1 产品性能研究
[产品技术要求的研究和编制说明]

#### 5.2 生物相容性评价研究
[按照GB/T 16886系列标准进行生物学评价]

| 试验项目 | 试验方法 | 结果 | 评价 |
|---------|---------|------|------|
| 细胞毒性 | GB/T 16886.5 | [结果] | [评价] |
| 皮肤致敏 | GB/T 16886.10 | [结果] | [评价] |
| 皮肤刺激 | GB/T 16886.10 | [结果] | [评价] |

#### 5.3 灭菌/消毒工艺研究
[如适用，灭菌验证报告]

#### 5.4 有效期和包装研究
[产品有效期验证及包装验证资料]

### 六、生产制造信息

#### 6.1 生产过程描述
[产品生产加工工艺及流程图]

#### 6.2 生产场地
[生产地址、生产面积、生产环境控制等]

### 七、临床评价资料

[根据《医疗器械临床评价技术指导原则》提供临床评价资料]

### 八、产品风险分析资料

[按照YY/T 0316《医疗器械 风险管理对医疗器械的应用》编制]

### 九、产品技术要求

[产品技术要求编号：]

### 十、产品注册检验报告

[具有医疗器械检验资质的检验机构出具的检验报告]

### 十一、说明书和标签样稿

[产品说明书和最小销售单元标签样稿]

### 十二、符合性声明

本申请人声明：
1. 本申请人对所提交资料的真实性负责；
2. 本申请人已建立与产品研制、生产有关的质量管理体系，并保持有效运行；
3. 本申请产品符合现行国家标准、行业标准；
4. 本申请产品符合《医疗器械注册与备案管理办法》要求。

**申请人：** ${formData['Applicant Name'] || '[申请人名称]'}
**法定代表人（签字）：** _______________
**日期：** ${date}

---

**注册申请人：** ${formData['Applicant Name'] || '[申请人名称]'}
**住所：** ${formData['Applicant Address'] || '[住所]'}
**生产地址：** ${formData['Manufacturing Address'] || '[生产地址]'}

**代理人：** ${formData['Registration Agent'] || '[代理人名称]'}
**代理人住所：** [代理人住所]
`
  } else {
    body = `## DOCUMENT CONTENT

This is a standardized template for ${template.name}.

### Applicable Authority
${template.authority}

### Product Information
| Field | Value |
|-------|-------|
${filledFields}

### Document Sections
${template.fields.map((f) => `- **${f.label}**: ${formData[f.label] || '[To be completed]'}`).join('\n')}

### Instructions
1. Complete all required fields marked with *
2. Verify all information against official records
3. Attach supporting documentation where required
4. Have document reviewed by qualified personnel
5. Submit to appropriate regulatory authority

### Certification

I hereby certify that the information provided in this document is accurate and complete to the best of my knowledge.

**Signature:** _________________________
**Name:** [Authorized Signatory]
**Title:** [Title]
**Date:** ${date}
**Company Stamp:** [Official Stamp]

---

**Document Version:** 1.0
**Generated:** ${date}
**Template ID:** ${template.id.toUpperCase()}

*This document was generated by MDLooker PPE Compliance Platform. Please review all content before official submission.*
`
  }

  return header + body
}

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [expandedGuideSections, setExpandedGuideSections] = useState<Record<number, boolean>>({})

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Document generator state
  const [genCategory, setGenCategory] = useState('')
  const [genMarket, setGenMarket] = useState('')
  const [genFormData, setGenFormData] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const templates = (genCategory && genMarket)
    ? DOCUMENT_TEMPLATES[genCategory]?.[genMarket] || []
    : []

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch {
        // Supabase not configured or user not logged in
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

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

  const handleDownload = async (docId: string, docTitle: string) => {
    try {
      // Find the document data
      const doc = DOCUMENTS.find(d => d.id === docId)
      if (!doc) {
        throw new Error('Document not found')
      }

      // Generate Word-compatible HTML content
      const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${doc.title}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #333; }
  h1 { color: #339999; font-size: 24pt; border-bottom: 2px solid #339999; padding-bottom: 8px; }
  h2 { color: #339999; font-size: 18pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { color: #555; font-size: 14pt; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th { background-color: #339999; color: white; padding: 8px; text-align: left; border: 1px solid #2d8b8b; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 9pt; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
</style>
</head>
<body>
<h1>${doc.title}</h1>
<p><strong>Description:</strong> ${doc.description}</p>
<p><strong>Market:</strong> ${doc.market} | <strong>Format:</strong> ${doc.format} | <strong>Size:</strong> ${doc.size}</p>
<p><strong>Last Updated:</strong> ${doc.updatedAt}</p>
<hr>
<h2>Document Tags</h2>
<p>${doc.tags.map(tag => `<span style="background-color: #f0f0f0; padding: 4px 8px; margin: 4px; display: inline-block; border-radius: 4px;">${tag}</span>`).join('')}</p>
<hr>
<h2>Document Content Template</h2>
<p>This is a template document from MDLooker PPE Compliance Platform. Please customize this content according to your specific product and regulatory requirements.</p>
<table>
<tr><th>Field</th><th>Value</th></tr>
<tr><td>Product Name</td><td>[Enter product name]</td></tr>
<tr><td>Model/Type</td><td>[Enter model number]</td></tr>
<tr><td>Manufacturer</td><td>[Enter manufacturer name]</td></tr>
<tr><td>Regulation</td><td>[Enter applicable regulation]</td></tr>
</table>
<h2>Instructions</h2>
<ul>
<li>Review all sections and complete the required information</li>
<li>Attach supporting documentation where indicated</li>
<li>Have document reviewed by qualified regulatory personnel</li>
<li>Submit to appropriate regulatory authority</li>
</ul>
<div class="footer">
<p>Generated by MDLooker PPE Compliance Platform | ${new Date().toISOString().split('T')[0]}</p>
<p><em>This document is confidential and proprietary. Unauthorized distribution is prohibited.</em></p>
</div>
</body>
</html>`

      // Create blob with Word-compatible MIME type
      const blob = new Blob([htmlContent], { type: 'application/msword' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '')}_${new Date().toISOString().split('T')[0]}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download: ${docTitle}\n\nPlease try again later.`)
    }
  }

  const toggleGuideSection = (index: number) => {
    setExpandedGuideSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
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

  const handleGenFieldChange = (fieldLabel: string, value: string) => {
    setGenFormData(prev => ({ ...prev, [fieldLabel]: value }))
  }

  const handleGenerate = async (template: DocumentTemplate) => {
    setGenerating(template.id)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const markdownContent = generateOfficialDocument(template, genFormData, genCategory, genMarket)

    // Convert markdown to Word-compatible HTML
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${template.name}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #333; margin: 40px; }
  h1 { color: #339999; font-size: 22pt; border-bottom: 2px solid #339999; padding-bottom: 8px; margin-top: 24px; }
  h2 { color: #339999; font-size: 16pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  h3 { color: #555; font-size: 13pt; margin-top: 16px; }
  h4 { color: #666; font-size: 12pt; margin-top: 14px; }
  h5 { color: #777; font-size: 11pt; margin-top: 12px; }
  h6 { color: #888; font-size: 10pt; margin-top: 10px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th { background-color: #339999; color: white; padding: 8px; text-align: left; border: 1px solid #2d8b8b; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  strong, b { font-weight: bold; }
  em, i { font-style: italic; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  p { margin: 8px 0; }
  code { font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
  pre { background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 9pt; text-align: center; }
  blockquote { border-left: 4px solid #339999; padding-left: 16px; margin: 12px 0; color: #555; }
</style>
</head>
<body>
${markdownContent
  // Convert markdown headers to HTML headers
  .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // Convert bold
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Convert italic
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Convert horizontal rules
  .replace(/^---$/gm, '<hr>')
  // Convert markdown tables to HTML tables
  .replace(/^(\|.+\|)$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim())
    const isHeader = match.includes('---')
    if (isHeader) return '<!--table-separator-->'
    const tag = 'td'
    return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>'
  })
  // Wrap consecutive table rows in <table>
  .replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
    const rows = match.replace(/<!--table-separator-->\n?/g, '')
    if (!rows.trim()) return match
    // Find if there's a header row before
    const tableMatch = match.match(/(?:<!--table-separator-->\n?)?((?:<tr>.*<\/tr>\n?)+)/)
    if (tableMatch) {
      return `<table>${tableMatch[1]}</table>`
    }
    return match
  })
  // Convert unordered list items
  .replace(/^- (.+)$/gm, '<li>$1</li>')
  // Convert numbered list items
  .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
  // Wrap consecutive list items in <ul>
  .replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
    return `<ul>${match}</ul>`
  })
  // Handle remaining paragraphs
  .replace(/\n\n/g, '</p><p>')
  // Clean up any remaining markdown artifacts
  .replace(/\|/g, '')
  .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  // Wrap content in paragraph if not already wrapped
}
<div class="footer">
<p>Generated by MDLooker PPE Compliance Platform | ${new Date().toISOString().split('T')[0]}</p>
<p><em>Template: ${template.name} | Document ID: ${template.id}</em></p>
</div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.id}_${genCategory}_${genMarket}_${new Date().toISOString().split('T')[0]}.doc`
    a.click()
    URL.revokeObjectURL(url)
    setGenerating(null)
  }

  // 显示填写指南
  if (selectedDoc) {
    const guide = FILLING_GUIDES[selectedDoc]
    if (!guide) return null

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => {
              setSelectedDoc(null)
              setExpandedGuideSections({})
            }}
            className="mb-6 text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
          >
            &larr; Back to Documents
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center mr-4">
                <Lightbulb className="w-6 h-6 text-[#339999]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{guide.title}</h1>
                <p className="text-gray-600 mt-1">Step-by-step instructions for completing this template</p>
              </div>
            </div>

            <div className="space-y-6">
              {guide.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleGuideSection(index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      {section.required ? (
                        <CheckCircle className="w-5 h-5 text-red-500 mr-3" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-gray-300 mr-3" />
                      )}
                      <span className="font-semibold text-gray-900">{section.heading}</span>
                      {section.required && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    {expandedGuideSections[index] ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {expandedGuideSections[index] && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-700 mb-4">{section.content}</p>
                      <div className="bg-[#339999]/5 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Lightbulb className="w-4 h-4 text-[#339999] mr-2" />
                          <span className="font-semibold text-gray-900 text-sm">Tips &amp; Best Practices</span>
                        </div>
                        <ul className="space-y-2">
                          {section.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 bg-[#339999] rounded-full mr-2 mt-1.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Important Notice</h4>
                  <p className="text-sm text-gray-600">
                    This guide provides general instructions. Always consult with a qualified regulatory
                    expert and refer to the latest official regulations for your specific product and target market.
                  </p>
                </div>
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
        {/* Tab System */}
        <Tabs defaultValue="browse">
          <TabsList className="mb-8">
            <TabsTrigger value="browse">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Browse Documents
              </span>
            </TabsTrigger>
            <TabsTrigger value="generate">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Documents
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Documents Tab */}
          <TabsContent value="browse">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              {/* Search */}
              <form
                className="relative mb-6"
                onSubmit={(e) => e.preventDefault()}
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents, templates, or standards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#339999] text-white text-sm font-medium rounded-md hover:bg-[#2d8b8b] transition-colors"
                >
                  Search
                </button>
              </form>

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

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {user ? (
                          <button
                            onClick={() => handleDownload(doc.id, doc.title)}
                            className="w-full py-2.5 bg-[#339999] text-white font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : (
                          <Link
                            href="/auth/login"
                            className="w-full py-2.5 bg-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                          >
                            <LogIn className="w-4 h-4" />
                            Sign in to Download
                          </Link>
                        )}
                        {doc.hasGuide && (
                          <button
                            onClick={() => setSelectedDoc(doc.id)}
                            className="w-full py-2.5 border-2 border-[#339999] text-[#339999] font-medium rounded-lg hover:bg-[#339999]/5 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Filling Guide ({doc.guideSections} sections)
                          </button>
                        )}
                      </div>
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
          </TabsContent>

          {/* Generate Documents Tab */}
          <TabsContent value="generate">
            <div className="max-w-6xl mx-auto">
              {/* Auth gate for document generator */}
              {!user && !authLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Sign in Required</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        You need to be signed in to generate custom compliance documents. Sign in to access the full document generator with all templates.
                      </p>
                      <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in to Continue
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Select Product and Market */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Select Product Category &amp; Target Market
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Category *</label>
                    <select
                      value={genCategory}
                      onChange={(e) => { setGenCategory(e.target.value); setGenFormData({}) }}
                      disabled={!user}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Market *</label>
                    <select
                      value={genMarket}
                      onChange={(e) => { setGenMarket(e.target.value); setGenFormData({}) }}
                      disabled={!user}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select market...</option>
                      {markets.map(m => (
                        <option key={m.code} value={m.code}>{m.flag_emoji} {m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Document Templates */}
              {templates.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Fill Document Information
                  </h2>

                  {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedDoc(expandedDoc === template.id ? null : template.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              template.category === 'technical' ? 'bg-blue-100 text-blue-600' :
                              template.category === 'regulatory' ? 'bg-purple-100 text-purple-600' :
                              template.category === 'quality' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">{template.name}</h3>
                                {template.required && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Required</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{template.authority}</span>
                                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{template.category}</span>
                              </div>
                            </div>
                          </div>
                          {expandedDoc === template.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>

                      {expandedDoc === template.id && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                          <div className="mt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Required Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {template.fields.map((field, idx) => (
                                <div key={idx} className={field.required ? '' : 'md:col-span-2'}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  <input
                                    type="text"
                                    value={genFormData[field.label] || ''}
                                    onChange={(e) => handleGenFieldChange(field.label, e.target.value)}
                                    placeholder={field.placeholder}
                                    disabled={!user}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end">
                            {user ? (
                              <button
                                onClick={() => handleGenerate(template)}
                                disabled={generating === template.id}
                                className="px-6 py-3 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                              >
                                {generating === template.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                {generating === template.id ? 'Generating...' : 'Generate Document'}
                              </button>
                            ) : (
                              <Link
                                href="/auth/login"
                                className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2"
                              >
                                <LogIn className="w-4 h-4" />
                                Sign in to Generate
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(!genCategory || !genMarket) && (
                <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Please select a product category and target market to see available document templates</p>
                </div>
              )}

              {genCategory && genMarket && templates.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates available</h3>
                  <p className="text-gray-500 mb-4">
                    No document templates are currently available for this product category and market combination.
                  </p>
                  <p className="text-sm text-gray-400">
                    Try selecting a different category or market, or{' '}
                    <Link href="/document-generator" className="text-[#339999] hover:underline">
                      visit the full document generator
                    </Link>{' '}
                    for more options.
                  </p>
                </div>
              )}

              {/* Link to standalone generator */}
              <div className="mt-8 bg-gradient-to-r from-[#339999]/5 to-[#339999]/10 rounded-xl p-6 border border-[#339999]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#339999]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Need more document templates?</h3>
                      <p className="text-sm text-gray-600">Access the full document generator with additional templates and advanced options.</p>
                    </div>
                  </div>
                  <Link
                    href="/document-generator"
                    className="px-5 py-2.5 bg-[#339999] text-white font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    Open Full Generator
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
