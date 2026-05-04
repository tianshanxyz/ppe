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
  Scale,
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
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
import { getUserMembership, canAccessFeature, getMembershipName, type MembershipTier } from '@/lib/membership'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

// 文档分类
const CATEGORIES = [
  { id: 'all', name: 'All Documents', icon: FileText },
  { id: 'templates', name: 'Templates', icon: FileSpreadsheet },
  { id: 'checklists', name: 'Checklists', icon: ClipboardList },
  { id: 'guides', name: 'Guides', icon: BookOpen },
  { id: 'regulations', name: 'Regulations', icon: Scale },
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
  },
  'eu-doc-annex-vi': {
    title: 'EU Declaration of Conformity (Annex VI) Filling Guide',
    sections: [
      {
        heading: '1. Manufacturer Information',
        content: 'Enter the full legal name and registered address of the manufacturer. For non-EU manufacturers, also provide authorized representative details.',
        tips: [
          'Use the exact legal entity name as registered',
          'Include full address with postal code and country',
          'For non-EU manufacturers, the authorized representative must be established within the EU'
        ],
        required: true
      },
      {
        heading: '2. Product Description',
        content: 'Describe the PPE product clearly including all model numbers, variants, and intended protection type.',
        tips: [
          'List all product variants covered by this DoC',
          'Include product codes and model numbers',
          'Specify the PPE category (I, II, or III)'
        ],
        required: true
      },
      {
        heading: '3. Harmonized Standards',
        content: 'List all harmonized standards that have been applied to demonstrate conformity.',
        tips: [
          'Only list standards published in the EU Official Journal',
          'Include the full standard reference with date',
          'Partial compliance must be clearly indicated'
        ],
        required: true
      },
      {
        heading: '4. Notified Body Information',
        content: 'For Category II and III PPE, provide the Notified Body details including name, 4-digit identification number, and certificate references.',
        tips: [
          'Verify the Notified Body is appointed for PPE Regulation',
          'Include the EU Type Examination certificate number',
          'For Module D/C2, also include quality system certificate details'
        ],
        required: true
      },
      {
        heading: '5. Conformity Statement',
        content: 'The DoC must include the formal statement that the product is in conformity with Regulation (EU) 2016/425.',
        tips: [
          'Use the exact wording required by Annex VI',
          'The statement must be under the sole responsibility of the manufacturer',
          'The DoC relates only to the product as placed on the market'
        ],
        required: true
      },
      {
        heading: '6. Signature and Date',
        content: 'The DoC must be signed by an authorized person with the name, title, place, and date of issue.',
        tips: [
          'The signatory must be authorized by the manufacturer',
          'Include place and date of issue',
          'Retain the DoC for at least 10 years after last product placed on market'
        ],
        required: true
      }
    ]
  },
  'fda-3881-coversheet': {
    title: 'FDA 510(k) Cover Sheet (Form FDA 3881) Filling Guide',
    sections: [
      {
        heading: '1. Submitter Information',
        content: 'Enter the complete contact information for the 510(k) submitter including company name, address, and designated contact person.',
        tips: [
          'Use the legal company name as registered with FDA',
          'Include the Establishment Registration Number if available',
          'Designate a single contact person for FDA correspondence'
        ],
        required: true
      },
      {
        heading: '2. Device Name and Classification',
        content: 'Provide the device trade name, common name, classification regulation, product code, and device class.',
        tips: [
          'Use the exact classification name from 21 CFR',
          'Verify the product code in the FDA Product Classification Database',
          'Ensure the regulation number matches the intended use'
        ],
        required: true
      },
      {
        heading: '3. Predicate Device',
        content: 'Identify the predicate device with its 510(k) number, trade name, and manufacturer.',
        tips: [
          'The predicate must be legally marketed in the US',
          'Use the K-number format (e.g., K123456)',
          'Multiple predicates may be referenced if needed'
        ],
        required: true
      },
      {
        heading: '4. Technological Characteristics Summary',
        content: 'Provide a brief summary comparing the technological characteristics of the subject device with the predicate.',
        tips: [
          'Focus on design, materials, and operating principles',
          'Clearly state whether characteristics are the same or different',
          'If different, explain why they do not raise new questions of safety and effectiveness'
        ],
        required: true
      }
    ]
  },
  'nmpa-reg-form': {
    title: 'NMPA Registration Application Form Filling Guide',
    sections: [
      {
        heading: '1. Applicant Information',
        content: 'Enter the complete applicant details including Chinese and English names, registration address, and manufacturing address.',
        tips: [
          'For overseas applicants, a China-based agent is mandatory',
          'The agent must have a valid business license',
          'Include the agent authorization letter reference'
        ],
        required: true
      },
      {
        heading: '2. Product Specifications',
        content: 'Provide detailed product specifications including model/type, classification code, and management category.',
        tips: [
          'Use the NMPA Classification Catalogue for the correct code',
          'List all model variants and their differences',
          'Include product technical requirements document number'
        ],
        required: true
      },
      {
        heading: '3. Clinical Evaluation Summary',
        content: 'Summarize the clinical evaluation approach and conclusions.',
        tips: [
          'Choose the appropriate pathway: clinical trial, clinical evaluation, or exemption',
          'Reference the NMPA clinical evaluation technical guidelines',
          'For Class II devices, literature-based evaluation may suffice'
        ],
        required: true
      },
      {
        heading: '4. Quality System Documentation',
        content: 'Describe the quality management system and provide GMP compliance evidence.',
        tips: [
          'Reference ISO 13485 or equivalent GMP certification',
          'Include the quality system certificate number and scope',
          'For domestic manufacturers, include the production license'
        ],
        required: true
      },
      {
        heading: '5. Conformity Declaration',
        content: 'Sign the formal declaration of conformity with all applicable Chinese regulations and standards.',
        tips: [
          'The declaration must be signed by the legal representative',
          'Affix the company seal (chop)',
          'Ensure all referenced documents are complete and accurate'
        ],
        required: true
      }
    ]
  },
  'iso-13485-quality-manual': {
    title: 'ISO 13485 Quality Manual Template Filling Guide',
    sections: [
      {
        heading: '1. Organization Profile and Scope',
        content: 'Define the organization, scope of the QMS, and any exclusions with justification.',
        tips: [
          'Clearly define the scope to match your certification objectives',
          'Any exclusions from Clause 7 must be justified',
          'Include the organization\'s legal name and physical locations'
        ],
        required: true
      },
      {
        heading: '2. Quality Policy and Objectives',
        content: 'Establish the quality policy and measurable quality objectives aligned with ISO 13485 requirements.',
        tips: [
          'The policy must include a commitment to compliance and effectiveness',
          'Objectives should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
          'Communicate the policy throughout the organization'
        ],
        required: true
      },
      {
        heading: '3. Process Descriptions',
        content: 'Document all QMS processes including management, resource, realization, and measurement processes.',
        tips: [
          'Use process maps and flowcharts for clarity',
          'Define inputs, outputs, and interdependencies',
          'Include risk-based thinking in process design'
        ],
        required: true
      },
      {
        heading: '4. Document Control and Records',
        content: 'Establish procedures for document control, record control, and change management.',
        tips: [
          'Define document approval, distribution, and obsolescence procedures',
          'Maintain a master document list',
          'Records must be legible, identifiable, and retrievable'
        ],
        required: true
      },
      {
        heading: '5. Management Review and Improvement',
        content: 'Define the management review process and continuous improvement mechanisms.',
        tips: [
          'Schedule management reviews at planned intervals',
          'Include CAPA procedures with effectiveness verification',
          'Document all review inputs and outputs'
        ],
        required: true
      }
    ]
  },
  'iso-14971-risk-form': {
    title: 'Risk Assessment Form (ISO 14971:2019) Filling Guide',
    sections: [
      {
        heading: '1. Hazard Identification',
        content: 'Systematically identify all known and foreseeable hazards throughout the product lifecycle.',
        tips: [
          'Consider all lifecycle phases: production, use, maintenance, and disposal',
          'Include hazards from normal use, foreseeable misuse, and reasonably foreseeable emergency situations',
          'Use structured methods such as FMEA, FTA, or HAZOP'
        ],
        required: true
      },
      {
        heading: '2. Risk Estimation',
        content: 'Estimate the severity of harm and probability of occurrence for each hazardous situation.',
        tips: [
          'Use defined scales for severity and probability',
          'Consider worst-case scenarios',
          'Document the rationale for each estimation'
        ],
        required: true
      },
      {
        heading: '3. Risk Control Measures',
        content: 'Implement risk control measures following the hierarchy: inherent safety by design, protective measures, information for safety.',
        tips: [
          'Prioritize design-based controls over warnings and labels',
          'Verify the effectiveness of each control measure',
          'Document any residual risks after controls are implemented'
        ],
        required: true
      },
      {
        heading: '4. Residual Risk Evaluation',
        content: 'Evaluate residual risks after all control measures have been implemented and determine acceptability.',
        tips: [
          'Use the risk matrix to determine residual risk level',
          'Conduct benefit-risk analysis for risks that are not broadly acceptable',
          'Document the overall residual risk acceptability decision'
        ],
        required: true
      },
      {
        heading: '5. Risk Management Review',
        content: 'Review the overall risk management results and obtain approval from authorized personnel.',
        tips: [
          'The review should cover all identified hazards and residual risks',
          'Ensure the risk management file is complete and up-to-date',
          'Obtain signatures from the risk manager and quality manager'
        ],
        required: true
      }
    ]
  },
  'eu-ppe-annex-iii-checklist': {
    title: 'Technical Documentation Checklist (EU PPE Annex III) Filling Guide',
    sections: [
      {
        heading: '1. General Product Description',
        content: 'Verify that a complete product description is included covering design, intended use, and user population.',
        tips: [
          'Include all product variants and accessories',
          'Reference applicable PPE category and risk classification',
          'Attach product photos and technical drawings'
        ],
        required: true
      },
      {
        heading: '2. Design and Manufacturing Data',
        content: 'Confirm that design specifications, manufacturing processes, and quality control procedures are documented.',
        tips: [
          'Include technical drawings with dimensions and tolerances',
          'Document the complete manufacturing process flow',
          'List all materials in contact with the user'
        ],
        required: true
      },
      {
        heading: '3. Risk Assessment and EHSR Compliance',
        content: 'Verify that risk assessment per EN ISO 12100 and EHSR compliance per Annex II are documented.',
        tips: [
          'Cross-reference each EHSR from Annex II',
          'Provide justification for non-applicable EHSRs',
          'Link risk assessment findings to design controls'
        ],
        required: true
      },
      {
        heading: '4. Test Reports and Verification',
        content: 'Confirm that test reports from accredited laboratories are included for all applicable standards.',
        tips: [
          'Verify the testing lab holds ISO 17025 accreditation',
          'Ensure all test reports are current and cover all product variants',
          'Include both pass/fail results and raw data where required'
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
  {
    id: 'eu-doc-form',
    title: 'EU Declaration of Conformity Form',
    description: 'Complete EU Declaration of Conformity form per Regulation 2016/425 Annex VI with fillable fields',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '112 KB',
    downloads: 1876,
    updatedAt: '2026-04-22',
    tags: ['CE Marking', 'DoC', 'EU', 'Annex VI'],
    icon: FileCheck,
    hasGuide: false
  },
  {
    id: 'certification-application',
    title: 'Certification Application Form',
    description: 'Standard certification application form for PPE products with applicant info, product details, and market selection',
    category: 'templates',
    market: 'Global',
    format: 'DOCX',
    size: '98 KB',
    downloads: 1543,
    updatedAt: '2026-04-20',
    tags: ['Certification', 'Application', 'Global'],
    icon: FileSpreadsheet,
    hasGuide: false
  },
  {
    id: 'manufacturer-info-form',
    title: 'Manufacturer Information Form',
    description: 'Complete manufacturer registration form with company details, facilities, and quality systems documentation',
    category: 'templates',
    market: 'Global',
    format: 'DOCX',
    size: '134 KB',
    downloads: 1287,
    updatedAt: '2026-04-18',
    tags: ['Manufacturer', 'Registration', 'Global'],
    icon: FileSpreadsheet,
    hasGuide: false
  },
  {
    id: 'qms-form',
    title: 'Quality Management System Documentation Form',
    description: 'ISO 13485 QMS documentation checklist with all required sections for medical device quality systems',
    category: 'templates',
    market: 'Global',
    format: 'XLSX',
    size: '178 KB',
    downloads: 1654,
    updatedAt: '2026-04-16',
    tags: ['QMS', 'ISO 13485', 'Documentation', 'Checklist'],
    icon: FileSpreadsheet,
    hasGuide: false
  },
  {
    id: 'testing-application',
    title: 'Product Testing Application Form',
    description: 'Lab testing application form with product specifications, test requirements, and standards references',
    category: 'templates',
    market: 'Global',
    format: 'DOCX',
    size: '89 KB',
    downloads: 1098,
    updatedAt: '2026-04-14',
    tags: ['Testing', 'Application', 'Laboratory', 'Global'],
    icon: FileText,
    hasGuide: false
  },
  {
    id: 'pms-plan',
    title: 'Post-Market Surveillance Plan Template',
    description: 'Post-market surveillance plan per EU requirements with vigilance procedures and reporting templates',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '156 KB',
    downloads: 876,
    updatedAt: '2026-04-12',
    tags: ['PMS', 'Post-Market', 'Vigilance', 'EU'],
    icon: FileText,
    hasGuide: false
  },
  // Official Form Templates - Real fillable forms
  {
    id: 'eu-doc-annex-vi',
    title: 'EU Declaration of Conformity (Annex VI Form)',
    description: 'Official fillable EU Declaration of Conformity form per Regulation 2016/425 Annex VI with manufacturer info, product description, harmonized standards, notified body details, and signature block',
    category: 'templates',
    market: 'EU',
    format: 'DOCX',
    size: '134 KB',
    downloads: 3210,
    updatedAt: '2026-04-28',
    tags: ['CE Marking', 'DoC', 'Annex VI', 'Official Form', 'EU'],
    icon: FileCheck,
    hasGuide: true,
    guideSections: 6
  },
  {
    id: 'fda-3881-coversheet',
    title: 'FDA 510(k) Cover Sheet (Form FDA 3881)',
    description: 'Official FDA Form 3881 premarket notification cover sheet with submitter information, device classification, predicate device, and technological characteristics summary',
    category: 'templates',
    market: 'US',
    format: 'DOCX',
    size: '156 KB',
    downloads: 2876,
    updatedAt: '2026-04-26',
    tags: ['FDA', '510(k)', 'Form 3881', 'Official Form', 'Cover Sheet'],
    icon: FileCheck,
    hasGuide: true,
    guideSections: 4
  },
  {
    id: 'nmpa-reg-form',
    title: 'NMPA Registration Application Form (Official)',
    description: 'Official NMPA medical device registration application form with applicant information, product specifications, clinical evaluation summary, and quality system documentation sections',
    category: 'templates',
    market: 'CN',
    format: 'DOCX',
    size: '198 KB',
    downloads: 1432,
    updatedAt: '2026-04-25',
    tags: ['NMPA', 'Registration', 'Official Form', 'China', 'Application'],
    icon: FileCheck,
    hasGuide: true,
    guideSections: 5
  },
  {
    id: 'iso-13485-quality-manual',
    title: 'ISO 13485:2016 Quality Manual Template',
    description: 'Comprehensive quality manual template based on ISO 13485:2016 with all clause sections, fillable policy statements, organizational charts, and document control procedures',
    category: 'templates',
    market: 'Global',
    format: 'DOCX',
    size: '312 KB',
    downloads: 2345,
    updatedAt: '2026-04-24',
    tags: ['ISO 13485', 'Quality Manual', 'QMS', 'Official Form', 'Global'],
    icon: FileCheck,
    hasGuide: true,
    guideSections: 5
  },
  {
    id: 'iso-14971-risk-form',
    title: 'Risk Assessment Form (ISO 14971:2019)',
    description: 'Official risk assessment form per ISO 14971:2019 with hazard identification table, risk estimation matrix, risk control measures, residual risk evaluation, and benefit-risk analysis',
    category: 'templates',
    market: 'Global',
    format: 'DOCX',
    size: '267 KB',
    downloads: 2567,
    updatedAt: '2026-04-23',
    tags: ['ISO 14971', 'Risk Assessment', 'Official Form', 'Risk Management', 'Global'],
    icon: FileCheck,
    hasGuide: true,
    guideSections: 5
  },
  {
    id: 'eu-ppe-annex-iii-checklist',
    title: 'Technical Documentation Checklist (EU PPE Annex III)',
    description: 'Official technical documentation checklist per Annex III of Regulation 2016/425 with all required sections, compliance verification fields, and document reference tracking',
    category: 'checklists',
    market: 'EU',
    format: 'DOCX',
    size: '178 KB',
    downloads: 1987,
    updatedAt: '2026-04-22',
    tags: ['CE Marking', 'Annex III', 'Technical File', 'Checklist', 'Official Form', 'EU'],
    icon: ClipboardList,
    hasGuide: true,
    guideSections: 4
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
    icon: FileText,
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
    icon: FileCheck,
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
    icon: BookOpen,
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

function generateDocumentContent(docId: string, docTitle: string, docDescription: string, date: string): string {
  switch (docId) {
    case 'ce-technical-file': {
      return `
<h1>CE Technical File Template</h1>
<p><strong>Regulatory Basis:</strong> Regulation (EU) 2016/425 on Personal Protective Equipment</p>
<p><strong>Applicable Annexes:</strong> Annex III (Technical Documentation), Annex IV (EU Type Examination)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. General Product Description</h2>
<p>Provide a complete description of the PPE product including intended use, target user groups, and product variants.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Enter product commercial name]</td></tr>
<tr><td>Model / Type</td><td>[Enter model number(s)]</td></tr>
<tr><td>PPE Category</td><td>[Category I / II / III per Regulation (EU) 2016/425]</td></tr>
<tr><td>Intended Use</td><td>[Describe intended use and protection provided]</td></tr>
<tr><td>Target User Group</td><td>[Describe intended user population]</td></tr>
<tr><td>Use Environment</td><td>[Describe conditions of use]</td></tr>
</table>

<h2>2. Design and Manufacturing Data (Annex III, Section 1)</h2>
<h3>2.1 Design Specifications</h3>
<p>Provide comprehensive design documentation including:</p>
<ul>
<li>General description of product design and operating principle</li>
<li>Technical drawings, schematics, and diagrams</li>
<li>Materials specification (all materials in contact with user)</li>
<li>Dimensions, tolerances, and weight specifications</li>
<li>Colour coding and sizing information</li>
</ul>

<h3>2.2 Manufacturing Process</h3>
<table>
<tr><th>Stage</th><th>Process</th><th>Key Control Parameters</th></tr>
<tr><td>Raw Material Receipt</td><td>[Process description]</td><td>[Parameters]</td></tr>
<tr><td>Component Fabrication</td><td>[Process description]</td><td>[Parameters]</td></tr>
<tr><td>Assembly</td><td>[Process description]</td><td>[Parameters]</td></tr>
<tr><td>Finishing</td><td>[Process description]</td><td>[Parameters]</td></tr>
<tr><td>Final Inspection</td><td>[Process description]</td><td>[Parameters]</td></tr>
<tr><td>Packaging</td><td>[Process description]</td><td>[Parameters]</td></tr>
</table>

<h2>3. Risk Assessment (Annex III, Section 2)</h2>
<p>Conduct risk assessment in accordance with EN ISO 12100:2010 and ISO 14971:2019.</p>

<h3>3.1 Hazard Identification</h3>
<table>
<tr><th>Hazard ID</th><th>Hazard Description</th><th>Hazard Origin</th><th>Potential Harm</th></tr>
<tr><td>H-001</td><td>[Mechanical hazard - e.g., sharp edges]</td><td>[Design / Material]</td><td>[Laceration, puncture]</td></tr>
<tr><td>H-002</td><td>[Chemical hazard - e.g., material off-gassing]</td><td>[Material / Environment]</td><td>[Respiratory irritation]</td></tr>
<tr><td>H-003</td><td>[Biological hazard - e.g., insufficient filtration]</td><td>[Design / Performance]</td><td>[Infection, contamination]</td></tr>
<tr><td>H-004</td><td>[Thermal hazard - e.g., heat buildup]</td><td>[Material / Design]</td><td>[Burn, heat stress]</td></tr>
<tr><td>H-005</td><td>[Ergonomic hazard - e.g., poor fit]</td><td>[Design]</td><td>[Discomfort, reduced protection]</td></tr>
</table>

<h3>3.2 Risk Estimation and Evaluation</h3>
<table>
<tr><th>Hazard ID</th><th>Severity (1-5)</th><th>Probability (1-5)</th><th>Risk Level</th><th>Acceptable?</th></tr>
<tr><td>H-001</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-002</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-003</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-004</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-005</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
</table>

<h3>3.3 Risk Control Measures</h3>
<table>
<tr><th>Hazard ID</th><th>Control Measure</th><th>Control Type</th><th>Residual Risk</th></tr>
<tr><td>H-001</td><td>[Describe control measure]</td><td>[Design / Guard / Warning / PPE]</td><td>[Low/Med/High]</td></tr>
<tr><td>H-002</td><td>[Describe control measure]</td><td>[Design / Guard / Warning / PPE]</td><td>[Low/Med/High]</td></tr>
<tr><td>H-003</td><td>[Describe control measure]</td><td>[Design / Guard / Warning / PPE]</td><td>[Low/Med/High]</td></tr>
</table>

<h2>4. Essential Health and Safety Requirements (Annex II)</h2>
<p>Demonstrate compliance with each applicable EHSR from Annex II of Regulation (EU) 2016/425.</p>
<table>
<tr><th>EHSR Ref.</th><th>Requirement</th><th>Compliance Method</th><th>Evidence</th></tr>
<tr><td>1.1</td><td>Design principles - ergonomics</td><td>[Method]</td><td>[Reference]</td></tr>
<tr><td>1.2</td><td>Innocuousness of PPE</td><td>[Method]</td><td>[Reference]</td></tr>
<tr><td>1.3</td><td>Comfort and efficiency</td><td>[Method]</td><td>[Reference]</td></tr>
<tr><td>2.1</td><td>Adjustment and fitting</td><td>[Method]</td><td>[Reference]</td></tr>
<tr><td>2.2</td><td>Field of vision</td><td>[Method]</td><td>[Reference]</td></tr>
<tr><td>2.12</td><td>Protection against harmful biological agents</td><td>[Method]</td><td>[Reference]</td></tr>
</table>

<h2>5. Test Reports and Verification</h2>
<h3>5.1 Summary of Tests Conducted</h3>
<table>
<tr><th>Test Parameter</th><th>Standard Clause</th><th>Test Result</th><th>Acceptance Criteria</th><th>Pass/Fail</th></tr>
<tr><td>[Parameter]</td><td>[Clause]</td><td>[Result]</td><td>[Criteria]</td><td>[P/F]</td></tr>
</table>

<h3>5.2 Testing Laboratory Information</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Laboratory Name</td><td>[ISO 17025 accredited lab]</td></tr>
<tr><td>Accreditation Body</td><td>[e.g., UKAS, DAkkS]</td></tr>
<tr><td>Accreditation Number</td><td>[Number]</td></tr>
<tr><td>Test Report Number</td><td>[Reference]</td></tr>
<tr><td>Date of Testing</td><td>[Date]</td></tr>
</table>

<h2>6. Quality Assurance and Production Control</h2>
<h3>6.1 Quality Management System</h3>
<p>[Describe QMS - reference ISO 9001 or ISO 13485 certification if applicable]</p>

<h3>6.2 Production Quality Control Points</h3>
<table>
<tr><th>Stage</th><th>Inspection Item</th><th>Method</th><th>Frequency</th><th>Acceptance Criteria</th></tr>
<tr><td>Incoming</td><td>Raw materials</td><td>Visual/Chemical</td><td>Per batch</td><td>Per material spec</td></tr>
<tr><td>In-process</td><td>Dimensions</td><td>Measurement</td><td>Continuous</td><td>Per drawing tolerance</td></tr>
<tr><td>Final</td><td>Performance</td><td>Functional test</td><td>Per sampling plan</td><td>Per applicable standard</td></tr>
</table>

<h2>7. Labeling and User Information</h2>
<h3>7.1 CE Marking Requirements</h3>
<ul>
<li>CE marking must be visible, legible, and indelible</li>
<li>Minimum height: 5 mm</li>
<li>Must include Notified Body identification number (Category II/III)</li>
<li>Must be affixed to product and/or packaging and accompanying documents</li>
</ul>

<h3>7.2 User Instructions Content</h3>
<ul>
<li>Intended use and limitations</li>
<li>Fitting and donning/doffing instructions</li>
<li>Maintenance and cleaning procedures</li>
<li>Storage conditions and shelf life</li>
<li>Disposal instructions</li>
<li>Warnings and precautions</li>
</ul>

<h2>8. Declarations and Signatures</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Technical File Compiler</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Quality Manager</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Authorized Representative</td><td>[Name]</td><td></td><td></td></tr>
</table>
`
    }

    case 'ce-risk-assessment': {
      return `
<h1>Risk Assessment Template</h1>
<p><strong>Standard:</strong> ISO 14971:2019 - Application of risk management to medical devices</p>
<p><strong>Methodology:</strong> EN ISO 12100:2010 - Safety of machinery, general principles for design</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Risk Management Plan</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Enter product name]</td></tr>
<tr><td>Model / Type</td><td>[Enter model/type]</td></tr>
<tr><td>Risk Management File No.</td><td>[RM-YYYY-XXX]</td></tr>
<tr><td>Prepared By</td><td>[Name, Title]</td></tr>
<tr><td>Approved By</td><td>[Name, Title]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
<tr><td>Review Date</td><td>[Next review date]</td></tr>
</table>

<h2>2. Hazard Identification (ISO 14971, Clause 5)</h2>
<p>Identify all known and foreseeable hazards in both normal and fault conditions throughout the product lifecycle.</p>

<h3>2.1 Hazard Categories</h3>
<table>
<tr><th>Category</th><th>Examples for PPE</th></tr>
<tr><td>Energy Hazards</td><td>Electrical, thermal, mechanical, vibration, radiation</td></tr>
<tr><td>Biological and Chemical Hazards</td><td>Biological contamination, chemical exposure, toxicity, infection</td></tr>
<tr><td>Performance Hazards</td><td>Inadequate filtration, loss of integrity, degradation over time</td></tr>
<tr><td>Usability Hazards</td><td>Poor fit, incorrect donning, limited field of vision, breathing resistance</td></tr>
<tr><td>Information Hazards</td><td>Inadequate labeling, missing warnings, unclear instructions</td></tr>
</table>

<h3>2.2 Hazard Identification Table</h3>
<table>
<tr><th>Hazard ID</th><th>Hazard Description</th><th>Hazardous Situation</th><th>Potential Harm</th><th>Lifecycle Phase</th></tr>
<tr><td>H-001</td><td>[Description]</td><td>[Situation]</td><td>[Harm]</td><td>[Phase]</td></tr>
<tr><td>H-002</td><td>[Description]</td><td>[Situation]</td><td>[Harm]</td><td>[Phase]</td></tr>
<tr><td>H-003</td><td>[Description]</td><td>[Situation]</td><td>[Harm]</td><td>[Phase]</td></tr>
</table>

<h2>3. Risk Estimation and Evaluation (ISO 14971, Clause 6-7)</h2>

<h3>3.1 Severity Scale</h3>
<table>
<tr><th>Level</th><th>Severity</th><th>Description</th></tr>
<tr><td>1</td><td>Negligible</td><td>No injury or minor discomfort, no medical intervention required</td></tr>
<tr><td>2</td><td>Minor</td><td>Temporary discomfort, first aid treatment may be required</td></tr>
<tr><td>3</td><td>Serious</td><td>Injury requiring medical intervention, temporary impairment</td></tr>
<tr><td>4</td><td>Critical</td><td>Major injury, hospitalization, permanent impairment possible</td></tr>
<tr><td>5</td><td>Catastrophic</td><td>Death or permanent life-threatening injury</td></tr>
</table>

<h3>3.2 Probability Scale</h3>
<table>
<tr><th>Level</th><th>Probability</th><th>Description</th></tr>
<tr><td>1</td><td>Remote</td><td>Unlikely to occur; &lt;1 in 100,000 uses</td></tr>
<tr><td>2</td><td>Rare</td><td>Could occur but not expected; 1 in 10,000 to 1 in 100,000</td></tr>
<tr><td>3</td><td>Occasional</td><td>Might occur sometimes; 1 in 1,000 to 1 in 10,000</td></tr>
<tr><td>4</td><td>Probable</td><td>Will probably occur; 1 in 100 to 1 in 1,000</td></tr>
<tr><td>5</td><td>Frequent</td><td>Likely to occur often; &gt;1 in 100</td></tr>
</table>

<h3>3.3 Risk Matrix (ISO 14971)</h3>
<table>
<tr><th></th><th colspan="5" style="text-align:center;">Probability</th></tr>
<tr><th>Severity</th><th>1 - Remote</th><th>2 - Rare</th><th>3 - Occasional</th><th>4 - Probable</th><th>5 - Frequent</th></tr>
<tr><td>5 - Catastrophic</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ff9900;">High</td><td style="background-color:#ff0000;color:white;">High</td><td style="background-color:#ff0000;color:white;">High</td><td style="background-color:#ff0000;color:white;">High</td></tr>
<tr><td>4 - Critical</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ff9900;">High</td><td style="background-color:#ff0000;color:white;">High</td><td style="background-color:#ff0000;color:white;">High</td></tr>
<tr><td>3 - Serious</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ff9900;">High</td><td style="background-color:#ff9900;">High</td></tr>
<tr><td>2 - Minor</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ff9900;">High</td></tr>
<tr><td>1 - Negligible</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#00cc00;">Low</td><td style="background-color:#ffcc00;">Medium</td><td style="background-color:#ffcc00;">Medium</td></tr>
</table>

<h3>3.4 Risk Evaluation Table</h3>
<table>
<tr><th>Hazard ID</th><th>Severity</th><th>Probability</th><th>Risk Level</th><th>Acceptable?</th></tr>
<tr><td>H-001</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-002</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-003</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
</table>

<h2>4. Risk Control (ISO 14971, Clause 8)</h2>
<h3>4.1 Hierarchy of Controls</h3>
<ol>
<li><strong>Inherent safety by design</strong> - Eliminate or reduce risks through design</li>
<li><strong>Protective measures</strong> - Physical guards, barriers, or safety features</li>
<li><strong>Information for safety</strong> - Warnings, instructions, training requirements</li>
</ol>

<h3>4.2 Risk Control Measures</h3>
<table>
<tr><th>Hazard ID</th><th>Control Measure</th><th>Control Type</th><th>Implementation</th><th>Verification</th></tr>
<tr><td>H-001</td><td>[Measure]</td><td>[Design/Protective/Info]</td><td>[How implemented]</td><td>[Verification method]</td></tr>
<tr><td>H-002</td><td>[Measure]</td><td>[Design/Protective/Info]</td><td>[How implemented]</td><td>[Verification method]</td></tr>
<tr><td>H-003</td><td>[Measure]</td><td>[Design/Protective/Info]</td><td>[How implemented]</td><td>[Verification method]</td></tr>
</table>

<h2>5. Residual Risk Evaluation (ISO 14971, Clause 9)</h2>
<table>
<tr><th>Hazard ID</th><th>Residual Risk</th><th>Severity After Control</th><th>Probability After Control</th><th>Residual Risk Level</th><th>Acceptable?</th></tr>
<tr><td>H-001</td><td>[Description]</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
<tr><td>H-002</td><td>[Description]</td><td>[1-5]</td><td>[1-5]</td><td>[Low/Med/High]</td><td>[Yes/No]</td></tr>
</table>

<h2>6. Benefit-Risk Analysis (ISO 14971, Clause 10)</h2>
<p>For residual risks that are not broadly acceptable, conduct a benefit-risk analysis considering:</p>
<ul>
<li>The intended use and clinical benefits of the device</li>
<li>The severity and probability of residual risks</li>
<li>Whether alternative designs or technologies exist</li>
<li>The opinions of relevant stakeholders and experts</li>
</ul>

<h2>7. Overall Residual Risk Evaluability (ISO 14971, Clause 11)</h2>
<p>Evaluate the overall residual risk after all individual risk control measures have been implemented.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Overall Residual Risk Level</td><td>[Low / Medium / High]</td></tr>
<tr><td>Overall Acceptability</td><td>[Acceptable / Not Acceptable]</td></tr>
<tr><td>Justification</td><td>[Provide justification]</td></tr>
</table>

<h2>8. Risk Management Review and Approval</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Risk Manager</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Quality Manager</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Regulatory Affairs</td><td>[Name]</td><td></td><td></td></tr>
</table>
`
    }

    case 'ce-doc': {
      return `
<h1>EU Declaration of Conformity</h1>
<p><strong>Regulatory Basis:</strong> Regulation (EU) 2016/425 of the European Parliament and of the Council</p>
<p><strong>Annex Reference:</strong> Annex VI - EU Declaration of Conformity</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>EU DECLARATION OF CONFORMITY</h2>

<h3>1. Manufacturer</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Manufacturer Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Registered Address</td><td>[Full registered address]</td></tr>
<tr><td>Country</td><td>[EU Member State]</td></tr>
<tr><td>Telephone</td><td>[Phone number]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
</table>

<h3>2. Authorized Representative (if manufacturer is outside EU)</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Representative Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Address</td><td>[Full address within EU]</td></tr>
<tr><td>Mandate Reference</td><td>[Mandate document reference]</td></tr>
</table>

<h3>3. Product Identification</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Product commercial name]</td></tr>
<tr><td>Product Code / Model</td><td>[Model/type reference]</td></tr>
<tr><td>Serial / Batch Number</td><td>[As marked on product]</td></tr>
<tr><td>PPE Category</td><td>[Category I / II / III]</td></tr>
<tr><td>Product Description</td><td>[Brief description of product and intended protection]</td></tr>
</table>

<h3>4. Conformity Declaration</h3>
<p>The undersigned manufacturer hereby declares under sole responsibility that the above-described product is in conformity with the applicable Union harmonisation legislation:</p>
<p><strong>Regulation (EU) 2016/425</strong> of the European Parliament and of the Council of 9 March 2016 on personal protective equipment and repealing Council Directive 89/686/EEC.</p>

<h3>5. Applied Conformity Assessment Procedure</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Assessment Module(s)</td><td>[e.g., Module B + Module D, or Module B + Module C2]</td></tr>
<tr><td>Notified Body Name</td><td>[Full name of Notified Body]</td></tr>
<tr><td>Notified Body Number</td><td>[4-digit identification number]</td></tr>
<tr><td>EU Type Examination Certificate No.</td><td>[Certificate reference]</td></tr>
<tr><td>Certificate Date</td><td>[Date of issue]</td></tr>
<tr><td>Quality System Certificate No.</td><td>[If applicable - Module D/C2]</td></tr>
</table>

<h3>6. Harmonized Standards Applied</h3>
<table>
<tr><th>Standard Reference</th><th>Title</th><th>Date of Standard</th></tr>
<tr><td>EN 149:2001+A1:2009</td><td>Respiratory protective devices - Filtering half masks to protect against particles</td><td>2009</td></tr>
<tr><td>EN ISO 12100:2010</td><td>Safety of machinery - General principles for design - Risk assessment and risk reduction</td><td>2010</td></tr>
<tr><td>[Other standards]</td><td>[Title]</td><td>[Date]</td></tr>
</table>

<h3>7. Other Technical Specifications Applied</h3>
<p>[List any other technical specifications, common specifications, or national standards applied for which no harmonized standards exist]</p>

<h3>8. Declaration</h3>
<p>This declaration is issued under the sole responsibility of the manufacturer. The object of the declaration described above is in conformity with the relevant Union harmonisation legislation.</p>
<p>This declaration relates only to the product in the state in which it was placed on the market, and excludes components which are added to, modified or replaced after the product has been placed on the market.</p>

<h3>9. Signatory</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Place of Issue</td><td>[City, Country]</td></tr>
<tr><td>Date of Issue</td><td>${date}</td></tr>
<tr><td>Authorized Signatory</td><td>[Name and Title]</td></tr>
<tr><td>Signature</td><td>_________________________</td></tr>
</table>
`
    }

    case 'ce-test-report': {
      return `
<h1>Test Report Template</h1>
<p><strong>Purpose:</strong> Standardized test report for PPE product testing documentation</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Test Report Information</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Report Number</td><td>[TR-YYYY-XXX]</td></tr>
<tr><td>Product Name</td><td>[Product commercial name]</td></tr>
<tr><td>Model / Type</td><td>[Model/type reference]</td></tr>
<tr><td>Manufacturer</td><td>[Manufacturer name]</td></tr>
<tr><td>Test Standard(s)</td><td>[List applicable standards]</td></tr>
<tr><td>Test Start Date</td><td>[Date]</td></tr>
<tr><td>Test End Date</td><td>[Date]</td></tr>
<tr><td>Report Date</td><td>${date}</td></tr>
</table>

<h2>2. Testing Laboratory</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Laboratory Name</td><td>[ISO 17025 accredited lab]</td></tr>
<tr><td>Accreditation Body</td><td>[e.g., UKAS, DAkkS, CNAS]</td></tr>
<tr><td>Accreditation Number</td><td>[Lab accreditation number]</td></tr>
<tr><td>Laboratory Address</td><td>[Full address]</td></tr>
<tr><td>Technical Contact</td><td>[Name, phone, email]</td></tr>
</table>

<h2>3. Sample Information</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Sample Description</td><td>[Description]</td></tr>
<tr><td>Sample Quantity</td><td>[Number of samples]</td></tr>
<tr><td>Batch / Lot Number</td><td>[Reference]</td></tr>
<tr><td>Date of Receipt</td><td>[Date]</td></tr>
<tr><td>Sample Condition on Receipt</td><td>[Condition description]</td></tr>
<tr><td>Storage Conditions</td><td>[Temperature, humidity, etc.]</td></tr>
</table>

<h2>4. Test Results Summary</h2>
<table>
<tr><th>Test Parameter</th><th>Standard Clause</th><th>Test Method</th><th>Result</th><th>Specification</th><th>Pass/Fail</th></tr>
<tr><td>[Parameter]</td><td>[Clause]</td><td>[Method]</td><td>[Value]</td><td>[Limit]</td><td>[P/F]</td></tr>
</table>

<h2>5. Detailed Test Results</h2>
<p>[Provide detailed test data, graphs, photographs, and calculations for each test parameter]</p>

<h2>6. Test Equipment</h2>
<table>
<tr><th>Equipment</th><th>Model</th><th>Serial Number</th><th>Calibration Date</th><th>Calibration Due</th></tr>
<tr><td>[Equipment name]</td><td>[Model]</td><td>[S/N]</td><td>[Date]</td><td>[Date]</td></tr>
</table>

<h2>7. Conclusions</h2>
<p>[State whether the product meets the requirements of the applicable standard(s)]</p>

<h2>8. Signatures</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Test Engineer</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Reviewed By</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Approved By</td><td>[Name]</td><td></td><td></td></tr>
</table>
`
    }

    case 'fda-510k-cover': {
      return `
<h1>FDA 510(k) Premarket Notification - Cover Letter</h1>
<p><strong>Regulatory Basis:</strong> Section 510(k) of the Federal Food, Drug, and Cosmetic Act (21 USC 360(k))</p>
<p><strong>Regulation:</strong> 21 CFR Part 807, Subpart E - Premarket Notification</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>COVER LETTER</h2>

<h3>1. Submitter Information</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Submitter Company</td><td>[Legal company name]</td></tr>
<tr><td>Address</td><td>[Complete address]</td></tr>
<tr><td>Contact Person</td><td>[Name, Title]</td></tr>
<tr><td>Telephone</td><td>[Phone number]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
<tr><td>Fax (if applicable)</td><td>[Fax number]</td></tr>
<tr><td>Date Prepared</td><td>${date}</td></tr>
</table>

<h3>2. Device Information</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Device Trade Name</td><td>[Commercial name]</td></tr>
<tr><td>Common/Usual Name</td><td>[Classification name per 21 CFR]</td></tr>
<tr><td>Classification Regulation</td><td>[e.g., 21 CFR 878.4040]</td></tr>
<tr><td>Product Code</td><td>[e.g., MSH, LYU, NZJ]</td></tr>
<tr><td>Panel</td><td>[e.g., Surgical Devices - Panel 78]</td></tr>
<tr><td>Device Class</td><td>[Class I / II / III]</td></tr>
</table>

<h3>3. Predicate Device</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Predicate Device Trade Name</td><td>[Predicate commercial name]</td></tr>
<tr><td>Predicate 510(k) Number</td><td>[K-number]</td></tr>
<tr><td>Predicate Manufacturer</td><td>[Manufacturer name]</td></tr>
<tr><td>Date Cleared</td><td>[Clearance date]</td></tr>
</table>

<h3>4. 510(k) Summary or Statement</h3>
<p>[Indicate whether a 510(k) Summary or 510(k) Statement is provided, per 21 CFR 807.92 or 807.93]</p>

<h3>5. Substantial Equivalence</h3>
<p>This submission demonstrates that the subject device is substantially equivalent to the predicate device identified above. The subject device has the same intended use and similar technological characteristics as the predicate device. Any differences in technological characteristics do not raise different questions of safety and effectiveness.</p>

<h3>6. Required 510(k) Content Checklist (per 21 CFR 807.87)</h3>
<table>
<tr><th>Item</th><th>Requirement</th><th>Included?</th></tr>
<tr><td>807.87(a)</td><td>Device name - trade and common</td><td>[Yes]</td></tr>
<tr><td>807.87(b)</td><td>Establishment registration number</td><td>[Yes]</td></tr>
<tr><td>807.87(c)</td><td>Classification - class, panel, product code</td><td>[Yes]</td></tr>
<tr><td>807.87(d)</td><td>Action taken - new device or modification</td><td>[Yes]</td></tr>
<tr><td>807.87(e)</td><td>Proposed labeling, advertisements</td><td>[Yes]</td></tr>
<tr><td>807.87(f)</td><td>510(k) summary or statement</td><td>[Yes]</td></tr>
<tr><td>807.87(g)</td><td>Statement of compliance with design controls</td><td>[Yes]</td></tr>
<tr><td>807.87(h)</td><td>Indications for use statement</td><td>[Yes]</td></tr>
<tr><td>807.87(i)</td><td>Photographs of device (if applicable)</td><td>[Yes/N/A]</td></tr>
<tr><td>807.87(j)</td><td>Additional information - engineering drawings, performance data</td><td>[Yes]</td></tr>
</table>

<h3>7. Confidentiality Statement</h3>
<p>[Indicate whether any information in this submission should be treated as confidential, per 21 CFR 807.95]</p>

<h3>8. Signature</h3>
<p><strong>Signature:</strong> _________________________</p>
<p><strong>Name:</strong> [Authorized representative]</p>
<p><strong>Title:</strong> [Title]</p>
<p><strong>Date:</strong> ${date}</p>
`
    }

    case 'fda-substantial-equiv': {
      return `
<h1>Substantial Equivalence Template</h1>
<p><strong>Regulatory Basis:</strong> 21 CFR 807.87 - Information required in a 510(k)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Device Identification</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Subject Device Name</td><td>[Trade name]</td></tr>
<tr><td>Common Name</td><td>[Classification name]</td></tr>
<tr><td>Product Code</td><td>[FDA product code]</td></tr>
<tr><td>Regulation Number</td><td>[21 CFR section]</td></tr>
<tr><td>Device Class</td><td>[Class II]</td></tr>
</table>

<h2>2. Predicate Device Identification</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Predicate Device Name</td><td>[Trade name]</td></tr>
<tr><td>Predicate 510(k) Number</td><td>[K-number]</td></tr>
<tr><td>Predicate Manufacturer</td><td>[Company name]</td></tr>
<tr><td>Product Code</td><td>[FDA product code]</td></tr>
</table>

<h2>3. Intended Use Comparison</h2>
<table>
<tr><th style="width:200px;">Aspect</th><th>Subject Device</th><th>Predicate Device</th><th>Same/Different</th></tr>
<tr><td>General Intended Use</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Target Population</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Use Environment</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Indications for Use</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
</table>

<h2>4. Technological Characteristics Comparison</h2>
<table>
<tr><th style="width:200px;">Characteristic</th><th>Subject Device</th><th>Predicate Device</th><th>Same/Different</th></tr>
<tr><td>Design</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Materials</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Operating Principle</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Energy Source</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
<tr><td>Performance Specifications</td><td>[Description]</td><td>[Description]</td><td>[Same/Different]</td></tr>
</table>

<h2>5. Performance Data Summary</h2>
<h3>5.1 Bench Testing</h3>
<table>
<tr><th>Test</th><th>Standard/Method</th><th>Subject Device Result</th><th>Predicate Device Result</th><th>Equivalent?</th></tr>
<tr><td>[Test name]</td><td>[Method]</td><td>[Result]</td><td>[Result]</td><td>[Yes/No]</td></tr>
</table>

<h3>5.2 Biocompatibility (ISO 10993)</h3>
<table>
<tr><th>Test</th><th>Standard</th><th>Result</th><th>Acceptance</th></tr>
<tr><td>Cytotoxicity</td><td>ISO 10993-5</td><td>[Pass/Fail]</td><td>Non-cytotoxic</td></tr>
<tr><td>Sensitization</td><td>ISO 10993-10</td><td>[Pass/Fail]</td><td>Non-sensitizing</td></tr>
<tr><td>Irritation</td><td>ISO 10993-10</td><td>[Pass/Fail]</td><td>Non-irritating</td></tr>
</table>

<h2>6. Conclusion of Substantial Equivalence</h2>
<p>Based on the comparison above, the subject device has:</p>
<ol>
<li>The same intended use as the predicate device</li>
<li>[Same / Different] technological characteristics</li>
<li>[If different] The differences do not raise different questions of safety and effectiveness</li>
<li>[If different] The data demonstrates the subject device is as safe and effective as the predicate</li>
</ol>
`
    }

    case 'fda-device-desc': {
      return `
<h1>Device Description Template</h1>
<p><strong>Regulatory Basis:</strong> 21 CFR 807.87(j) - Additional information for 510(k)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Device Overview</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Device Trade Name</td><td>[Commercial name]</td></tr>
<tr><td>Common Name</td><td>[Classification name]</td></tr>
<tr><td>Product Code</td><td>[FDA product code]</td></tr>
<tr><td>Regulation Number</td><td>[21 CFR section]</td></tr>
</table>

<h2>2. Physical Description</h2>
<h3>2.1 General Description</h3>
<p>[Provide a comprehensive description of the device including its physical characteristics, dimensions, weight, and configuration]</p>

<h3>2.2 Components and Accessories</h3>
<table>
<tr><th>Component</th><th>Description</th><th>Material</th><th>Function</th></tr>
<tr><td>[Component name]</td><td>[Description]</td><td>[Material]</td><td>[Function]</td></tr>
</table>

<h3>2.3 Materials of Construction</h3>
<table>
<tr><th>Material</th><th>Supplier</th><th>Grade/Specification</th><th>Biocompatibility Status</th></tr>
<tr><td>[Material name]</td><td>[Supplier]</td><td>[Grade]</td><td>[Evaluated / Pending]</td></tr>
</table>

<h2>3. Principles of Operation</h2>
<p>[Describe how the device works, including the mechanism by which it achieves its intended protective function]</p>

<h2>4. Model / Variant Information</h2>
<table>
<tr><th>Model</th><th>Description</th><th>Differences from Base Model</th></tr>
<tr><td>[Model number]</td><td>[Description]</td><td>[Differences]</td></tr>
</table>

<h2>5. Packaging Information</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Packaging Type</td><td>[Description]</td></tr>
<tr><td>Unit Packaging</td><td>[Description]</td></tr>
<tr><td>Shipping Packaging</td><td>[Description]</td></tr>
<tr><td>Sterile Packaging (if applicable)</td><td>[Description]</td></tr>
<tr><td>Shelf Life</td><td>[Duration]</td></tr>
</table>

<h2>6. Labeling Summary</h2>
<p>[Describe the labeling, including labels, instructions for use, and any patient labeling]</p>
`
    }

    case 'fda-labeling': {
      return `
<h1>FDA Labeling Template</h1>
<p><strong>Regulatory Basis:</strong> 21 CFR 801 - Labeling, 21 CFR 807.87(e)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Device Labeling</h2>
<h3>1.1 Device Label (per 21 CFR 801)</h3>
<table>
<tr><th style="width:200px;">Required Element</th><th>Content</th></tr>
<tr><td>Device Name</td><td>[Trade name and common name]</td></tr>
<tr><td>Manufacturer Name and Address</td><td>[Full name and address]</td></tr>
<tr><td>Intended Use</td><td>[Brief statement]</td></tr>
<tr><td>Directions for Use</td><td>[Key instructions]</td></tr>
<tr><td>Warnings and Precautions</td><td>[List of warnings]</td></tr>
<tr><td>Contraindications</td><td>[List of contraindications]</td></tr>
<tr><td>Lot/Batch Number</td><td>[Location on label]</td></tr>
<tr><td>Expiration Date</td><td>[Format and location]</td></tr>
<tr><td>Storage Instructions</td><td>[Conditions]</td></tr>
<tr><td>UDI</td><td>[Unique Device Identifier]</td></tr>
</table>

<h2>2. Instructions for Use (IFU)</h2>
<h3>2.1 Device Description</h3>
<p>[Provide a clear description of the device for the end user]</p>

<h3>2.2 Intended Use / Indications for Use</h3>
<p>[Clear statement of what the device is intended to do and when it should be used]</p>

<h3>2.3 Contraindications</h3>
<p>[List conditions under which the device should not be used]</p>

<h3>2.4 Warnings and Precautions</h3>
<table>
<tr><th>Type</th><th>Warning</th><th>Consequence</th></tr>
<tr><td>[Warning/Caution]</td><td>[Description]</td><td>[Potential harm]</td></tr>
</table>

<h3>2.5 Donning and Doffing Instructions</h3>
<ol>
<li>[Step 1 - Preparation]</li>
<li>[Step 2 - Inspection before use]</li>
<li>[Step 3 - Donning procedure]</li>
<li>[Step 4 - Fit check]</li>
<li>[Step 5 - During use]</li>
<li>[Step 6 - Doffing procedure]</li>
<li>[Step 7 - Disposal]</li>
</ol>

<h3>2.6 Maintenance and Storage</h3>
<p>[Instructions for care, cleaning (if reusable), and storage]</p>

<h3>2.7 Disposal Instructions</h3>
<p>[Proper disposal methods per applicable regulations]</p>

<h2>3. Patient Labeling (if applicable)</h2>
<p>[Provide any labeling intended for the patient/end user in lay terms]</p>
`
    }

    case 'nmpa-registration': {
      return `
<h1>NMPA Registration Application Template</h1>
<p><strong>Regulatory Basis:</strong> Regulations for Supervision and Administration of Medical Devices (State Council Decree No. 739)</p>
<p><strong>Procedural Order:</strong> Measures for the Administration of Medical Device Registration and Filing (Order No. 47, 2021)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>一、注册申请表 (Registration Application Form)</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>产品名称（中文）</td><td>[Product Chinese name]</td></tr>
<tr><td>产品名称（英文）</td><td>[Product English name]</td></tr>
<tr><td>型号/规格</td><td>[Model/Specification]</td></tr>
<tr><td>分类编码</td><td>[Classification code per NMPA catalogue]</td></tr>
<tr><td>管理类别</td><td>[Class II / Class III]</td></tr>
<tr><td>注册申请人名称</td><td>[Applicant name]</td></tr>
<tr><td>注册申请人住所</td><td>[Applicant address]</td></tr>
<tr><td>生产地址</td><td>[Manufacturing address]</td></tr>
</table>

<h2>二、证明性文件 (Supporting Documents)</h2>
<h3>2.1 企业资质文件</h3>
<ul>
<li>企业营业执照副本复印件</li>
<li>组织机构代码证复印件（如适用）</li>
<li>生产许可证复印件（境内生产企业）</li>
</ul>

<h3>2.2 境外申请人资质（如适用）</h3>
<ul>
<li>境外申请人注册地所在国家（地区）医疗器械主管部门出具的允许产品上市销售的证明文件</li>
<li>境外申请人在中国境内指定代理人的委托书</li>
<li>代理人承诺书</li>
<li>代理人营业执照副本或机构登记证明复印件</li>
</ul>

<h2>三、医疗器械安全有效基本要求清单</h2>
<p>[Per NMPA Announcement No. 121, 2021]</p>

<h2>四、综述资料 (Summary Documentation)</h2>
<h3>4.1 产品描述</h3>
<p>[Product description: working principle, structure, main functions, intended use]</p>

<h3>4.2 型号规格</h3>
<p>[Model specifications and differences between models]</p>

<h3>4.3 包装说明</h3>
<p>[Packaging information including inner, middle, and outer packaging]</p>

<h3>4.4 适用范围</h3>
<p>[Intended use / scope of application]</p>

<h3>4.5 禁忌症</h3>
<p>[Contraindications]</p>

<h2>五、研究资料 (Research Documentation)</h2>
<h3>5.1 产品性能研究</h3>
<p>[Product performance research and technical requirements justification]</p>

<h3>5.2 生物相容性评价研究</h3>
<table>
<tr><th>试验项目</th><th>试验方法</th><th>结果</th><th>评价</th></tr>
<tr><td>细胞毒性</td><td>GB/T 16886.5</td><td>[Result]</td><td>[Evaluation]</td></tr>
<tr><td>皮肤致敏</td><td>GB/T 16886.10</td><td>[Result]</td><td>[Evaluation]</td></tr>
<tr><td>皮肤刺激</td><td>GB/T 16886.10</td><td>[Result]</td><td>[Evaluation]</td></tr>
</table>

<h3>5.3 灭菌/消毒工艺研究</h3>
<p>[Sterilization/disinfection process validation, if applicable]</p>

<h3>5.4 有效期和包装研究</h3>
<p>[Shelf life validation and packaging validation]</p>

<h2>六、生产制造信息 (Manufacturing Information)</h2>
<h3>6.1 生产过程描述</h3>
<p>[Manufacturing process description and flow chart]</p>

<h3>6.2 生产场地</h3>
<p>[Production site details, area, environmental controls]</p>

<h2>七、临床评价资料 (Clinical Evaluation)</h2>
<p>[Per NMPA Technical Guidelines for Clinical Evaluation of Medical Devices]</p>

<h2>八、产品风险分析资料 (Risk Analysis)</h2>
<p>[Per YY/T 0316 - Application of risk management to medical devices]</p>

<h2>九、产品技术要求 (Product Technical Requirements)</h2>
<p>[Product technical requirements document number and content]</p>

<h2>十、产品注册检验报告 (Type Testing Report)</h2>
<p>[Test report from NMPA-accredited testing institute]</p>

<h2>十一、说明书和标签样稿 (IFU and Label Drafts)</h2>
<p>[Product instructions for use and minimum sales unit label drafts]</p>

<h2>十二、符合性声明 (Declaration of Conformity)</h2>
<p>本申请人声明：</p>
<ol>
<li>本申请人对所提交资料的真实性负责；</li>
<li>本申请人已建立与产品研制、生产有关的质量管理体系，并保持有效运行；</li>
<li>本申请产品符合现行国家标准、行业标准；</li>
<li>本申请产品符合《医疗器械注册与备案管理办法》要求。</li>
</ol>
<p><strong>申请人：</strong>[Name] &nbsp;&nbsp; <strong>法定代表人（签字）：</strong>_______________ &nbsp;&nbsp; <strong>日期：</strong>${date}</p>
`
    }

    case 'nmpa-technical': {
      return `
<h1>NMPA Technical Requirements Template</h1>
<p><strong>Regulatory Basis:</strong> Measures for the Administration of Medical Device Registration and Filing (Order No. 47)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. 产品技术要求编号 (Product Technical Requirements Number)</h2>
<p>[Enter technical requirements document number]</p>

<h2>2. 产品名称 (Product Name)</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>中文名称</td><td>[Chinese product name]</td></tr>
<tr><td>英文名称</td><td>[English product name]</td></tr>
<tr><td>型号/规格</td><td>[Model/Specification]</td></tr>
</table>

<h2>3. 性能指标 (Performance Requirements)</h2>
<table>
<tr><th>序号</th><th>性能指标名称</th><th>要求</th><th>检验方法</th></tr>
<tr><td>1</td><td>[Performance parameter]</td><td>[Specification]</td><td>[Test method]</td></tr>
<tr><td>2</td><td>[Performance parameter]</td><td>[Specification]</td><td>[Test method]</td></tr>
</table>

<h2>4. 检验方法 (Test Methods)</h2>
<p>[Detailed test methods for each performance requirement]</p>

<h2>5. 附录 (Appendices)</h2>
<p>[Product appearance drawings, structural diagrams, material specifications, etc.]</p>
`
    }

    case 'nmpa-clinical': {
      return `
<h1>Clinical Evaluation Report Template</h1>
<p><strong>Regulatory Basis:</strong> NMPA Technical Guidelines for Clinical Evaluation of Medical Devices</p>
<p><strong>Standard:</strong> YY/T 0297 / ISO 14155 - Clinical investigation of medical devices</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Clinical Evaluation Plan</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Product name]</td></tr>
<tr><td>Model/Specification</td><td>[Model]</td></tr>
<tr><td>Classification</td><td>[Class II / III]</td></tr>
<tr><td>Evaluator</td><td>[Name, qualifications]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
</table>

<h2>2. Literature Review</h2>
<h3>2.1 Search Strategy</h3>
<p>[Describe literature search methodology, databases used, search terms, inclusion/exclusion criteria]</p>

<h3>2.2 Literature Summary</h3>
<table>
<tr><th>Reference</th><th>Study Type</th><th>Population</th><th>Key Findings</th><th>Relevance</th></tr>
<tr><td>[Reference]</td><td>[Type]</td><td>[N, demographics]</td><td>[Findings]</td><td>[High/Med/Low]</td></tr>
</table>

<h2>3. Clinical Data Analysis</h2>
<p>[Analysis of clinical data from literature, clinical experience, and/or clinical investigations]</p>

<h2>4. Safety and Performance Conclusions</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Safety Conclusion</td><td>[Summary of safety evidence]</td></tr>
<tr><td>Performance Conclusion</td><td>[Summary of performance evidence]</td></tr>
<tr><td>Overall Conclusion</td><td>[Acceptable / Not acceptable]</td></tr>
</table>

<h2>5. Approval</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Clinical Evaluator</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Medical Director</td><td>[Name]</td><td></td><td></td></tr>
</table>
`
    }

    case 'ce-checklist': {
      return `
<h1>CE Marking Complete Checklist</h1>
<p><strong>Regulation:</strong> Regulation (EU) 2016/425 on Personal Protective Equipment</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Product Classification</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>1.1</td><td>PPE category determined (I, II, or III)</td><td>[ ]</td><td></td></tr>
<tr><td>1.2</td><td>Intended use documented</td><td>[ ]</td><td></td></tr>
<tr><td>1.3</td><td>Risk level assessed per Annex I</td><td>[ ]</td><td></td></tr>
<tr><td>1.4</td><td>Classification justified and documented</td><td>[ ]</td><td></td></tr>
</table>

<h2>2. Technical Documentation (Annex III)</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>2.1</td><td>General product description prepared</td><td>[ ]</td><td></td></tr>
<tr><td>2.2</td><td>Design and manufacturing data compiled</td><td>[ ]</td><td></td></tr>
<tr><td>2.3</td><td>Risk assessment completed (EN ISO 12100)</td><td>[ ]</td><td></td></tr>
<tr><td>2.4</td><td>EHSR checklist completed (Annex II)</td><td>[ ]</td><td></td></tr>
<tr><td>2.5</td><td>Test reports obtained from accredited lab</td><td>[ ]</td><td></td></tr>
<tr><td>2.6</td><td>Quality assurance documentation prepared</td><td>[ ]</td><td></td></tr>
<tr><td>2.7</td><td>Labeling and user instructions prepared</td><td>[ ]</td><td></td></tr>
</table>

<h2>3. Conformity Assessment</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>3.1</td><td>Notified Body selected (Cat II/III)</td><td>[ ]</td><td></td></tr>
<tr><td>3.2</td><td>EU Type Examination application submitted</td><td>[ ]</td><td></td></tr>
<tr><td>3.3</td><td>EU Type Examination certificate obtained</td><td>[ ]</td><td></td></tr>
<tr><td>3.4</td><td>Quality system assessment completed (Cat III)</td><td>[ ]</td><td></td></tr>
<tr><td>3.5</td><td>Conformity assessment module selected</td><td>[ ]</td><td></td></tr>
</table>

<h2>4. EU Declaration of Conformity</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>4.1</td><td>DoC prepared per Annex VI</td><td>[ ]</td><td></td></tr>
<tr><td>4.2</td><td>All applicable standards listed</td><td>[ ]</td><td></td></tr>
<tr><td>4.3</td><td>Notified Body details included</td><td>[ ]</td><td></td></tr>
<tr><td>4.4</td><td>DoC signed by authorized person</td><td>[ ]</td><td></td></tr>
</table>

<h2>5. CE Marking and Market Entry</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>5.1</td><td>CE marking affixed (min 5mm height)</td><td>[ ]</td><td></td></tr>
<tr><td>5.2</td><td>Notified Body number included (Cat II/III)</td><td>[ ]</td><td></td></tr>
<tr><td>5.3</td><td>Product labeling complete</td><td>[ ]</td><td></td></tr>
<tr><td>5.4</td><td>User instructions provided with product</td><td>[ ]</td><td></td></tr>
<tr><td>5.5</td><td>EU Representative appointed (non-EU)</td><td>[ ]</td><td></td></tr>
<tr><td>5.6</td><td>Technical file retained for 10 years</td><td>[ ]</td><td></td></tr>
</table>
`
    }

    case 'fda-510k-checklist': {
      return `
<h1>FDA 510(k) Submission Checklist</h1>
<p><strong>Regulatory Basis:</strong> 21 CFR Part 807, Subpart E</p>
<p><strong>Reference:</strong> FDA Refuse to Accept (RTA) Checklist for 510(k)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Administrative Requirements (21 CFR 807.87)</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>1.1</td><td>Submitter name and address</td><td>[ ]</td><td></td></tr>
<tr><td>1.2</td><td>Contact person and phone number</td><td>[ ]</td><td></td></tr>
<tr><td>1.3</td><td>Device trade name and common name</td><td>[ ]</td><td></td></tr>
<tr><td>1.4</td><td>Classification (class, panel, product code)</td><td>[ ]</td><td></td></tr>
<tr><td>1.5</td><td>Establishment registration number</td><td>[ ]</td><td></td></tr>
<tr><td>1.6</td><td>Action taken (new device or modification)</td><td>[ ]</td><td></td></tr>
<tr><td>1.7</td><td>User fee payment confirmation</td><td>[ ]</td><td></td></tr>
</table>

<h2>2. Device Description</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>2.1</td><td>Device description with physical characteristics</td><td>[ ]</td><td></td></tr>
<tr><td>2.2</td><td>Intended use statement</td><td>[ ]</td><td></td></tr>
<tr><td>2.3</td><td>Indications for use statement</td><td>[ ]</td><td></td></tr>
<tr><td>2.4</td><td>Technological characteristics comparison</td><td>[ ]</td><td></td></tr>
</table>

<h2>3. Predicate Device</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>3.1</td><td>Predicate device identified</td><td>[ ]</td><td></td></tr>
<tr><td>3.2</td><td>Predicate 510(k) number provided</td><td>[ ]</td><td></td></tr>
<tr><td>3.3</td><td>Substantial equivalence discussion</td><td>[ ]</td><td></td></tr>
</table>

<h2>4. Performance Data</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>4.1</td><td>Bench performance testing completed</td><td>[ ]</td><td></td></tr>
<tr><td>4.2</td><td>Biocompatibility testing (ISO 10993)</td><td>[ ]</td><td></td></tr>
<tr><td>4.3</td><td>Software documentation (if applicable)</td><td>[ ]</td><td></td></tr>
<tr><td>4.4</td><td>Performance testing summary</td><td>[ ]</td><td></td></tr>
<tr><td>4.5</td><td>NIOSH approval (for respirators)</td><td>[ ]</td><td></td></tr>
</table>

<h2>5. Labeling</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>5.1</td><td>Proposed labeling provided</td><td>[ ]</td><td></td></tr>
<tr><td>5.2</td><td>Instructions for use</td><td>[ ]</td><td></td></tr>
<tr><td>5.3</td><td>Indications for use form (separate)</td><td>[ ]</td><td></td></tr>
<tr><td>5.4</td><td>Labeling comparison with predicate</td><td>[ ]</td><td></td></tr>
</table>

<h2>6. 510(k) Summary or Statement</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>6.1</td><td>510(k) Summary OR Statement included</td><td>[ ]</td><td></td></tr>
<tr><td>6.2</td><td>Design controls compliance statement</td><td>[ ]</td><td></td></tr>
</table>

<h2>7. Submission Format</h2>
<table>
<tr><th style="width:40px;">#</th><th>Item</th><th>Completed</th><th>Notes</th></tr>
<tr><td>7.1</td><td>eCopy prepared per FDA guidance</td><td>[ ]</td><td></td></tr>
<tr><td>7.2</td><td>Table of contents included</td><td>[ ]</td><td></td></tr>
<tr><td>7.3</td><td>All sections clearly tabbed/labeled</td><td>[ ]</td><td></td></tr>
<tr><td>7.4</td><td>Submission via FDA ESG or mail</td><td>[ ]</td><td></td></tr>
</table>
`
    }

    case 'iso-13485-checklist': {
      return `
<h1>ISO 13485:2016 Audit Checklist</h1>
<p><strong>Standard:</strong> ISO 13485:2016 - Medical devices - Quality management systems</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Clause 4 - Quality Management System</h2>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Compliant</th><th>Evidence</th><th>Notes</th></tr>
<tr><td>4.1</td><td>General requirements - QMS established, documented, implemented</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.1.1</td><td>Outsourced processes identified and controlled</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.1.2</td><td>QMS documented per 4.2</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.2.1</td><td>Documentation requirements - quality manual</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.2.2</td><td>Quality manual established and maintained</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.2.3</td><td>Medical device file maintained for each type</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.2.4</td><td>Document control procedures established</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>4.2.5</td><td>Record control procedures established</td><td>[ ]</td><td></td><td></td></tr>
</table>

<h2>Clause 5 - Management Responsibility</h2>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Compliant</th><th>Evidence</th><th>Notes</th></tr>
<tr><td>5.1</td><td>Management commitment</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>5.2</td><td>Customer focus</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>5.3</td><td>Quality policy established</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>5.4</td><td>Planning - quality objectives</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>5.5</td><td>Responsibility, authority, communication</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>5.6</td><td>Management review conducted</td><td>[ ]</td><td></td><td></td></tr>
</table>

<h2>Clause 6 - Resource Management</h2>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Compliant</th><th>Evidence</th><th>Notes</th></tr>
<tr><td>6.1</td><td>Provision of resources</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>6.2</td><td>Human resources - competence</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>6.3</td><td>Infrastructure</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>6.4</td><td>Work environment and contamination control</td><td>[ ]</td><td></td><td></td></tr>
</table>

<h2>Clause 7 - Product Realization</h2>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Compliant</th><th>Evidence</th><th>Notes</th></tr>
<tr><td>7.1</td><td>Planning of product realization</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.2</td><td>Customer requirements determined</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3</td><td>Design and development</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.2</td><td>Design inputs</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.3</td><td>Design outputs</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.5</td><td>Design verification</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.6</td><td>Design validation</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.7</td><td>Design transfer</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.8</td><td>Design changes controlled</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.3.9</td><td>Design history file maintained</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.4</td><td>Purchasing - supplier evaluation</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5</td><td>Production and service provision</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.1</td><td>Production control</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.2</td><td>Cleanliness of product</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.3</td><td>Installation activities</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.5</td><td>Sterilization process validation</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.6</td><td>Validation of processes</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.7</td><td>Traceability requirements</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.5.9</td><td>Labeling and packaging</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>7.6</td><td>Control of monitoring and measuring equipment</td><td>[ ]</td><td></td><td></td></tr>
</table>

<h2>Clause 8 - Measurement, Analysis, Improvement</h2>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Compliant</th><th>Evidence</th><th>Notes</th></tr>
<tr><td>8.1</td><td>General - monitoring, measurement, analysis</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.2.1</td><td>Feedback - post-market surveillance</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.2.3</td><td>Reporting to regulatory authorities</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.2.4</td><td>Internal audit conducted</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.2.5</td><td>Monitoring and measurement of processes</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.2.6</td><td>Monitoring and measurement of product</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.3</td><td>Control of nonconforming product</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.4</td><td>Analysis of data</td><td>[ ]</td><td></td><td></td></tr>
<tr><td>8.5</td><td>Improvement - corrective and preventive action</td><td>[ ]</td><td></td><td></td></tr>
</table>
`
    }

    case 'ce-guide-pdf': {
      return `
<h1>CE Marking Step-by-Step Guide</h1>
<p><strong>Regulation:</strong> Regulation (EU) 2016/425 on Personal Protective Equipment</p>
<p><strong>Scope:</strong> Complete guide for PPE products entering the EU market</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Introduction</h2>
<p>CE marking is mandatory for all PPE products sold in the European Economic Area (EEA). This guide provides a comprehensive overview of the CE marking process for PPE products.</p>

<h2>Step 1: Product Classification</h2>
<p>Determine the PPE category based on risk level:</p>
<table>
<tr><th>Category</th><th>Risk Level</th><th>Examples</th><th>Conformity Assessment</th></tr>
<tr><td>Category I</td><td>Minimal risks</td><td>Gardening gloves, sunglasses</td><td>Self-declaration (Module A)</td></tr>
<tr><td>Category II</td><td>Intermediate risks</td><td>Safety glasses, hard hats</td><td>EU Type Examination (Module B)</td></tr>
<tr><td>Category III</td><td>Very serious risks</td><td>Respirators, fall protection</td><td>Module B + Module C2 or D</td></tr>
</table>

<h2>Step 2: Identify Applicable Standards</h2>
<p>Check the EU Official Journal for the latest list of harmonized standards applicable to your product.</p>
<table>
<tr><th>Product Type</th><th>Harmonized Standard</th></tr>
<tr><td>Filtering half masks</td><td>EN 149:2001+A1:2009</td></tr>
<tr><td>Medical face masks</td><td>EN 14683:2019+AC:2019</td></tr>
<tr><td>Protective gloves</td><td>EN ISO 21420:2020</td></tr>
<tr><td>Safety footwear</td><td>EN ISO 20345:2022</td></tr>
<tr><td>Eye protection</td><td>EN ISO 16321 series</td></tr>
</table>

<h2>Step 3: Technical Documentation</h2>
<p>Prepare comprehensive technical documentation per Annex III including product description, risk assessment, test reports, and quality control procedures.</p>

<h2>Step 4: Testing and Evaluation</h2>
<p>Conduct product testing according to applicable harmonized standards at an accredited laboratory.</p>

<h2>Step 5: Notified Body Assessment</h2>
<p>For Category II and III PPE, engage a Notified Body for EU Type Examination.</p>

<h2>Step 6: EU Declaration of Conformity</h2>
<p>Prepare and sign the EU Declaration of Conformity per Annex VI.</p>

<h2>Step 7: CE Marking and Market Entry</h2>
<p>Affix the CE marking and place the product on the EU market.</p>
`
    }

    case 'fda-guide-pdf': {
      return `
<h1>FDA 510(k) Submission Guide</h1>
<p><strong>Regulatory Basis:</strong> Section 510(k), Federal Food, Drug, and Cosmetic Act</p>
<p><strong>Regulation:</strong> 21 CFR Part 807, Subpart E</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Introduction</h2>
<p>The 510(k) premarket notification is the most common pathway for medical devices to enter the US market. This guide covers the complete submission process.</p>

<h2>Step 1: Determine Device Classification</h2>
<table>
<tr><th>Classification</th><th>Requirements</th><th>Typical PPE Examples</th></tr>
<tr><td>Class I</td><td>General controls, most exempt from 510(k)</td><td>Examination gloves (some)</td></tr>
<tr><td>Class II</td><td>General + special controls, 510(k) required</td><td>Surgical masks, N95 respirators</td></tr>
<tr><td>Class III</td><td>Premarket approval (PMA)</td><td>Rare for PPE</td></tr>
</table>

<h2>Step 2: Identify Predicate Device</h2>
<p>Find a legally marketed device that is substantially equivalent to your product. Search the FDA 510(k) database and Product Classification Database.</p>

<h2>Step 3: Prepare Performance Testing</h2>
<p>Conduct testing per FDA-recognized consensus standards:</p>
<table>
<tr><th>Product Type</th><th>FDA-Recognized Standard</th></tr>
<tr><td>Surgical masks</td><td>ASTM F2100</td></tr>
<tr><td>N95 respirators</td><td>42 CFR Part 84, NIOSH TEB-APR methods</td></tr>
<tr><td>Surgical gowns</td><td>AAMI PB70, ASTM F2407</td></tr>
</table>

<h2>Step 4: Prepare 510(k) Submission</h2>
<p>Compile all required sections per 21 CFR 807.87.</p>

<h2>Step 5: Submit to FDA</h2>
<p>Submit via the FDA Electronic Submissions Gateway (ESG) or by mail with user fee payment.</p>

<h2>Step 6: FDA Review Process</h2>
<p>Standard review timeline: 90 days. FDA may issue Additional Information (AI) requests.</p>

<h2>Step 7: Post-Market Requirements</h2>
<p>Establishment registration, device listing, adverse event reporting (MDR), and compliance with QSR (21 CFR Part 820).</p>
`
    }

    case 'biocompatibility-guide': {
      return `
<h1>Biocompatibility Testing Guide</h1>
<p><strong>Standard:</strong> ISO 10993 series - Biological evaluation of medical devices</p>
<p><strong>FDA Guidance:</strong> Use of International Standard ISO 10993-1</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. Biological Evaluation Framework</h2>
<p>The ISO 10993 series provides a framework for the biological evaluation of medical devices within a risk management process.</p>

<h2>2. Categorization by Nature of Body Contact</h2>
<table>
<tr><th>Category</th><th>Contact Type</th><th>Examples for PPE</th></tr>
<tr><td>Surface device</td><td>Skin</td><td>Gloves, masks, gowns</td></tr>
<tr><td>Surface device</td><td>Mucosal membrane</td><td>Medical masks (inner surface)</td></tr>
<tr><td>External communicating</td><td>Breathing gas pathway</td><td>Respirators, ventilator circuits</td></tr>
</table>

<h2>3. Required Testing by Contact Duration</h2>
<table>
<tr><th>Test</th><th>Standard</th><th>Limited (&lt;24h)</th><th>Prolonged (24h-30d)</th><th>Permanent (&gt;30d)</th></tr>
<tr><td>Cytotoxicity</td><td>ISO 10993-5</td><td>Required</td><td>Required</td><td>Required</td></tr>
<tr><td>Sensitization</td><td>ISO 10993-10</td><td>Required</td><td>Required</td><td>Required</td></tr>
<tr><td>Irritation</td><td>ISO 10993-10</td><td>Required</td><td>Required</td><td>Required</td></tr>
<tr><td>Acute systemic toxicity</td><td>ISO 10993-11</td><td>Consider</td><td>Required</td><td>Required</td></tr>
<tr><td>Subacute toxicity</td><td>ISO 10993-11</td><td>-</td><td>Consider</td><td>Required</td></tr>
<tr><td>Genotoxicity</td><td>ISO 10993-3</td><td>-</td><td>Consider</td><td>Required</td></tr>
<tr><td>Implantation</td><td>ISO 10993-6</td><td>-</td><td>-</td><td>Required</td></tr>
</table>

<h2>4. Chemical Characterization (ISO 10993-18/19)</h2>
<p>Conduct chemical characterization of device materials as part of the biological evaluation:</p>
<ul>
<li>Identify all materials of construction</li>
<li>Perform extractables and leachables analysis</li>
<li>Compare with clinically established materials</li>
<li>Conduct toxicological risk assessment</li>
</ul>

<h2>5. Testing Laboratory Requirements</h2>
<ul>
<li>ISO 17025 accredited laboratory</li>
<li>GLP-compliant study conduct</li>
<li>Validated test methods</li>
</ul>
`
    }

    case 'eu-2016-425': {
      return `
<h1>EU Regulation 2016/425 - Personal Protective Equipment</h1>
<p><strong>Full Title:</strong> Regulation (EU) 2016/425 of the European Parliament and of the Council of 9 March 2016 on personal protective equipment and repealing Council Directive 89/686/EEC</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Key Provisions Summary</h2>

<h2>Article 1 - Scope and Definitions</h2>
<p>This Regulation applies to PPE designed and manufactured to be worn or held by a person for protection against one or more risks to health and safety.</p>

<h2>Article 2 - Definitions</h2>
<p>Key definitions including "personal protective equipment", "placing on the market", "making available on the market", "manufacturer", "authorised representative", "importer", "distributor".</p>

<h2>Article 3 - Obligations of Manufacturers</h2>
<p>Manufacturers shall ensure that PPE has been designed and manufactured in accordance with the essential health and safety requirements set out in Annex II.</p>

<h2>Annex I - Risk Categories</h2>
<table>
<tr><th>Category</th><th>Risk Type</th><th>Examples</th></tr>
<tr><td>Category I</td><td>Minimal risks only</td><td>Superficial mechanical injury, contact with cleaning materials, etc.</td></tr>
<tr><td>Category II</td><td>Risks other than those in Cat I and III</td><td>Mechanical injury, harmful noise, heat/fire, etc.</td></tr>
<tr><td>Category III</td><td>Very serious / life-threatening risks</td><td>Harmful biological agents, ionising radiation, high-temperature environments, etc.</td></tr>
</table>

<h2>Annex II - Essential Health and Safety Requirements</h2>
<p>Section 1: General requirements applicable to all PPE (ergonomics, innocuousness, comfort)</p>
<p>Section 2: Additional requirements common to several classes (adjustment, field of vision, etc.)</p>
<p>Section 3: Additional requirements specific to particular risks</p>

<h2>Annex III - Technical Documentation</h2>
<p>Requirements for technical documentation including general description, design and manufacturing data, risk assessment, and test reports.</p>

<h2>Annex IV - EU Type Examination</h2>
<p>Procedure for Notified Body assessment of PPE design and manufacture.</p>

<h2>Annex V - Conformity Assessment Modules</h2>
<p>Module A: Internal production control (Category I)</p>
<p>Module B: EU type examination (Category II/III)</p>
<p>Module C2: Conformity to type based on internal production control plus supervised checks (Category III)</p>
<p>Module D: Quality assurance of the production process (Category III)</p>

<h2>Annex VI - EU Declaration of Conformity</h2>
<p>Required content and format for the EU Declaration of Conformity.</p>
`
    }

    case 'fda-act': {
      return `
<h1>Federal Food, Drug, and Cosmetic Act - Medical Device Provisions</h1>
<p><strong>Reference:</strong> Chapter V - Drugs and Devices, Section 510-520</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Section 510 - Registration of Producers of Drugs or Devices</h2>
<p>Requires device establishments to register with FDA and list their devices.</p>

<h2>Section 510(k) - Premarket Notification</h2>
<p>Requires 90-day premarket notification before introducing a device into commercial distribution. Must demonstrate substantial equivalence to a legally marketed predicate device.</p>

<h2>Section 513 - Device Classification</h2>
<table>
<tr><th>Class</th><th>Controls</th><th>Regulatory Pathway</th></tr>
<tr><td>Class I</td><td>General controls</td><td>Most exempt from 510(k)</td></tr>
<tr><td>Class II</td><td>General + special controls</td><td>510(k) premarket notification</td></tr>
<tr><td>Class III</td><td>General + premarket approval</td><td>PMA application</td></tr>
</table>

<h2>Section 514 - Device Standards</h2>
<p>FDA authority to establish performance standards for devices.</p>

<h2>Section 515 - Premarket Approval</h2>
<p>Requirements for Class III devices requiring PMA.</p>

<h2>Section 518 - Notification and Other Remedies</h2>
<p>FDA authority to require notification, repair, replacement, or refund for devices that present unreasonable risk.</p>

<h2>Section 519 - Records and Reports on Devices</h2>
<p>Requirements for device tracking, post-market surveillance, and Medical Device Reporting (MDR).</p>

<h2>Section 520 - General Provisions Respecting Devices</h2>
<p>Includes provisions for investigational device exemptions (IDE), custom devices, and other special categories.</p>
`
    }

    case 'china-regulation': {
      return `
<h1>China Medical Device Regulation</h1>
<p><strong>Full Title:</strong> Regulations for the Supervision and Administration of Medical Devices (State Council Decree No. 739, revised 2021)</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Chapter 1 - General Provisions</h2>
<p>Medical devices are classified into three categories based on risk level. All devices require registration or filing before marketing in China.</p>

<h2>Classification</h2>
<table>
<tr><th>Class</th><th>Risk Level</th><th>Registration Authority</th></tr>
<tr><td>Class I (一类)</td><td>Low risk</td><td>Filing with municipal FDA</td></tr>
<tr><td>Class II (二类)</td><td>Moderate risk</td><td>Registration with provincial FDA</td></tr>
<tr><td>Class III (三类)</td><td>High risk</td><td>Registration with NMPA</td></tr>
</table>

<h2>Chapter 2 - Registration and Filing</h2>
<p>Key requirements for registration applications including safety, effectiveness, and quality documentation.</p>

<h2>Chapter 3 - Production</h2>
<p>Production licensing and GMP compliance requirements.</p>

<h2>Chapter 4 - Distribution and Use</h2>
<p>Distribution licensing and record-keeping requirements.</p>

<h2>Chapter 5 - Adverse Event Reporting and Recall</h2>
<p>Mandatory adverse event reporting and device recall procedures.</p>

<h2>Chapter 6 - Supervision and Inspection</h2>
<p>NMPA and provincial FDA inspection authority and procedures.</p>
`
    }

    case 'en-149': {
      return `
<h1>EN 149:2001+A1:2009 - Respiratory Protective Devices</h1>
<p><strong>Full Title:</strong> Respiratory protective devices - Filtering half masks to protect against particles - Requirements, testing, marking</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Scope</h2>
<p>This standard specifies minimum requirements for filtering half masks used as respiratory protective devices against particles.</p>

<h2>Classification</h2>
<table>
<tr><th>Type</th><th>Filtration Efficiency</th><th>Maximum Total Inward Leakage</th></tr>
<tr><td>FFP1</td><td>&ge; 78%</td><td>&le; 22%</td></tr>
<tr><td>FFP2</td><td>&ge; 92%</td><td>&le; 8%</td></tr>
<tr><td>FFP3</td><td>&ge; 98%</td><td>&le; 2%</td></tr>
</table>

<h2>Key Test Requirements</h2>
<table>
<tr><th>Test</th><th>Clause</th><th>Requirement</th></tr>
<tr><td>Filtration efficiency</td><td>7.9</td><td>Per FFP class above</td></tr>
<tr><td>Breathing resistance - inhalation</td><td>7.16</td><td>FFP1: &le;0.6 mbar; FFP2: &le;0.7 mbar; FFP3: &le;1.0 mbar</td></tr>
<tr><td>Breathing resistance - exhalation</td><td>7.16</td><td>&le;3.0 mbar (all classes)</td></tr>
<tr><td>Total inward leakage</td><td>7.11</td><td>Per FFP class above</td></tr>
<tr><td>Valve leakage</td><td>7.14</td><td>&le;30 mL/min</td></tr>
<tr><td>CO2 content of inhalation air</td><td>7.13</td><td>&le;1.0% (dead space)</td></tr>
<tr><td>Flammability</td><td>7.18</td><td>Material shall not burn for &gt;5s after flame removal</td></tr>
</table>

<h2>Marking Requirements</h2>
<ul>
<li>CE marking + Notified Body number</li>
<li>FFP class (FFP1, FFP2, or FFP3)</li>
<li>Manufacturer identification</li>
<li>Product identification</li>
<li>NR (non-reusable) or R (reusable)</li>
<li>Year and month of manufacture</li>
<li>Size (if applicable)</li>
<li>"Use by" date or shelf life</li>
</ul>
`
    }

    case 'en-14683': {
      return `
<h1>EN 14683:2019+AC:2019 - Medical Face Masks</h1>
<p><strong>Full Title:</strong> Medical face masks - Requirements and test methods</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Scope</h2>
<p>This standard specifies construction, design, performance requirements, and test methods for medical face masks intended to limit the transmission of infective agents from staff to patients during surgical procedures and other medical settings.</p>

<h2>Classification</h2>
<table>
<tr><th>Type</th><th>Bacterial Filtration Efficiency (BFE)</th><th>Breathing Resistance (Delta P)</th><td>Splash Resistance</td></tr>
<tr><td>Type I</td><td>&ge; 95%</td><td>&lt; 40 Pa/cm2</td><td>Not required</td></tr>
<tr><td>Type II</td><td>&ge; 98%</td><td>&lt; 40 Pa/cm2</td><td>Not required</td></tr>
<tr><td>Type IIR</td><td>&ge; 98%</td><td>&lt; 60 Pa/cm2</td><td>&ge; 16.0 kPa</td></tr>
</table>

<h2>Key Test Requirements</h2>
<table>
<tr><th>Test</th><th>Method</th><th>Requirement</th></tr>
<tr><td>Bacterial Filtration Efficiency</td><td>Annex B (Staphylococcus aureus)</td><td>Per type above</td></tr>
<tr><td>Breathing Resistance (Delta P)</td><td>Annex C</td><td>Per type above</td></tr>
<tr><td>Splash Resistance</td><td>ISO 22609</td><td>&ge; 16.0 kPa (Type IIR only)</td></tr>
<tr><td>Microbial Cleanliness</td><td>Annex D</td><td>&le; 30 CFU/g</td></tr>
<tr><td>Biocompatibility</td><td>ISO 10993 series</td><td>Non-cytotoxic, non-irritating, non-sensitizing</td></tr>
</table>

<h2>Marking Requirements</h2>
<ul>
<li>CE marking + Notified Body number</li>
<li>Type designation (Type I, Type II, Type IIR)</li>
<li>Manufacturer name and address</li>
<li>Lot number</li>
<li>Date of manufacture</li>
<li>Expiry date</li>
<li>Storage conditions</li>
<li>Size (if applicable)</li>
<li>"Single use" or equivalent</li>
</ul>
`
    }

    case 'astm-f2100': {
      return `
<h1>ASTM F2100 - Medical Face Masks</h1>
<p><strong>Full Title:</strong> Standard Specification for Performance of Materials Used in Medical Face Masks</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Scope</h2>
<p>This specification covers the classification, performance requirements, and test methods for materials used in the construction of medical face masks.</p>

<h2>Classification</h2>
<table>
<tr><th>Level</th><th>Bacterial Filtration Efficiency</th><th>Particulate Filtration Efficiency</th><th>Delta P</th><th>Fluid Resistance</th></tr>
<tr><td>Level 1</td><td>&ge; 95%</td><td>&ge; 95% @ 0.1 micron</td><td>&lt; 5.0 mm H2O/cm2</td><td>80 mm Hg</td></tr>
<tr><td>Level 2</td><td>&ge; 98%</td><td>&ge; 98% @ 0.1 micron</td><td>&lt; 6.0 mm H2O/cm2</td><td>120 mm Hg</td></tr>
<tr><td>Level 3</td><td>&ge; 98%</td><td>&ge; 98% @ 0.1 micron</td><td>&lt; 6.0 mm H2O/cm2</td><td>160 mm Hg</td></tr>
</table>

<h2>Required Tests</h2>
<table>
<tr><th>Test</th><th>Method Reference</th></tr>
<tr><td>Bacterial Filtration Efficiency (BFE)</td><td>ASTM F2101</td></tr>
<tr><td>Particulate Filtration Efficiency (PFE)</td><td>ASTM F2299</td></tr>
<tr><td>Differential Pressure (Delta P)</td><td>MIL-M-36954C or EN 14683 Annex C</td></tr>
<tr><td>Fluid Resistance</td><td>ASTM F1862</td></tr>
<tr><td>Flammability</td><td>16 CFR Part 1610</td></tr>
<tr><td>Biocompatibility</td><td>ISO 10993 series</td></tr>
</table>
`
    }

    case 'iso-13485': {
      return `
<h1>ISO 13485:2016 - Medical Devices Quality Management Systems</h1>
<p><strong>Full Title:</strong> Medical devices - Quality management systems - Requirements for regulatory purposes</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>Scope</h2>
<p>ISO 13485 specifies requirements for a quality management system where an organization needs to demonstrate its ability to provide medical devices and related services that consistently meet customer and applicable regulatory requirements.</p>

<h2>Clause Structure</h2>
<table>
<tr><th>Clause</th><th>Title</th><th>Key Requirements</th></tr>
<tr><td>4</td><td>Quality Management System</td><td>QMS documentation, quality manual, medical device file, document and record control</td></tr>
<tr><td>5</td><td>Management Responsibility</td><td>Management commitment, quality policy, planning, responsibility and authority, management review</td></tr>
<tr><td>6</td><td>Resource Management</td><td>Provision of resources, human resources, infrastructure, work environment, contamination control</td></tr>
<tr><td>7</td><td>Product Realization</td><td>Planning, customer requirements, design and development, purchasing, production, traceability, labeling</td></tr>
<tr><td>8</td><td>Measurement, Analysis, Improvement</td><td>Feedback, internal audit, monitoring, nonconforming product, CAPA, data analysis</td></tr>
</table>

<h2>Key Differences from ISO 9001</h2>
<ul>
<li>Focus on regulatory compliance rather than customer satisfaction</li>
<li>Excludes continuous improvement emphasis in favor of maintaining effectiveness</li>
<li>Requires documented procedures for most processes</li>
<li>Specific requirements for medical device files, design controls, and traceability</li>
<li>Requires risk management throughout QMS</li>
<li>Specific requirements for cleanliness, sterilization validation, and installation</li>
</ul>

<h2>Design Control Requirements (Clause 7.3)</h2>
<table>
<tr><th>Sub-clause</th><th>Requirement</th></tr>
<tr><td>7.3.2</td><td>Design inputs - functional, performance, and regulatory requirements</td></tr>
<tr><td>7.3.3</td><td>Design outputs - meet input requirements, include acceptance criteria</td></tr>
<tr><td>7.3.4</td><td>Design review - at suitable stages, include qualified reviewers</td></tr>
<tr><td>7.3.5</td><td>Design verification - outputs meet input requirements</td></tr>
<tr><td>7.3.6</td><td>Design validation - device meets user needs and intended uses</td></tr>
<tr><td>7.3.7</td><td>Design transfer - verified and validated designs transferred to production</td></tr>
<tr><td>7.3.8</td><td>Design changes - controlled and documented</td></tr>
<tr><td>7.3.9</td><td>Design history file (DHF) - compilation of records</td></tr>
</table>
`
    }

    case 'eu-doc-form': {
      return `
<h1>EU Declaration of Conformity Form</h1>
<p><strong>Regulatory Basis:</strong> Regulation (EU) 2016/425 of the European Parliament and of the Council</p>
<p><strong>Annex Reference:</strong> Annex VI - EU Declaration of Conformity</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>EU DECLARATION OF CONFORMITY</h2>
<p><em>Per Article 17 and Annex VI of Regulation (EU) 2016/425</em></p>

<h3>1. Manufacturer (Article 17(1)(a))</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Manufacturer Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Registered Address</td><td>[Full registered address]</td></tr>
<tr><td>City, Postal Code</td><td>[City, Postal code]</td></tr>
<tr><td>Country</td><td>[EU Member State]</td></tr>
<tr><td>Telephone</td><td>[Phone number]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
<tr><td>VAT / Registration Number</td><td>[Company registration number]</td></tr>
</table>

<h3>2. Authorized Representative (if manufacturer outside EU)</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Representative Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Address</td><td>[Full address within EU]</td></tr>
<tr><td>Mandate Reference</td><td>[Mandate document reference]</td></tr>
<tr><td>Mandate Date</td><td>[Date of mandate]</td></tr>
</table>

<h3>3. Product Identification (Article 17(1)(b))</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Product commercial name]</td></tr>
<tr><td>Product Code / Model</td><td>[Model/type reference]</td></tr>
<tr><td>Serial / Batch Number</td><td>[As marked on product]</td></tr>
<tr><td>PPE Category</td><td>[Category I / II / III]</td></tr>
<tr><td>Product Description</td><td>[Brief description of product and intended protection]</td></tr>
<tr><td>Intended Use</td><td>[Description of intended use]</td></tr>
</table>

<h3>4. Conformity Declaration (Article 17(1)(c))</h3>
<p>The undersigned manufacturer hereby declares under sole responsibility that the above-described product is in conformity with the applicable Union harmonisation legislation:</p>
<p><strong>Regulation (EU) 2016/425</strong> of the European Parliament and of the Council of 9 March 2016 on personal protective equipment and repealing Council Directive 89/686/EEC.</p>

<h3>5. Applied Conformity Assessment Procedure (Article 17(1)(d))</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Assessment Module(s)</td><td>[e.g., Module B + Module D, or Module B + Module C2]</td></tr>
<tr><td>Notified Body Name</td><td>[Full name of Notified Body]</td></tr>
<tr><td>Notified Body Number</td><td>[4-digit identification number]</td></tr>
<tr><td>Notified Body Address</td><td>[Full address]</td></tr>
<tr><td>EU Type Examination Certificate No.</td><td>[Certificate reference]</td></tr>
<tr><td>Certificate Date</td><td>[Date of issue]</td></tr>
<tr><td>Quality System Certificate No.</td><td>[If applicable - Module D/C2]</td></tr>
<tr><td>Quality System Certificate Date</td><td>[Date of issue]</td></tr>
</table>

<h3>6. Harmonized Standards Applied (Article 17(1)(e))</h3>
<table>
<tr><th>Standard Reference</th><th>Title</th><th>Date of Standard</th></tr>
<tr><td>[EN standard number]</td><td>[Title of standard]</td><td>[Date]</td></tr>
<tr><td>[EN standard number]</td><td>[Title of standard]</td><td>[Date]</td></tr>
<tr><td>[EN standard number]</td><td>[Title of standard]</td><td>[Date]</td></tr>
</table>

<h3>7. Other Technical Specifications Applied (Article 17(1)(f))</h3>
<p>[List any other technical specifications, common specifications, or national standards applied for which no harmonized standards exist]</p>

<h3>8. Statement (Article 17(1)(g))</h3>
<p>This declaration is issued under the sole responsibility of the manufacturer. The object of the declaration described above is in conformity with the relevant Union harmonisation legislation.</p>
<p>This declaration relates only to the product in the state in which it was placed on the market, and excludes components which are added to, modified or replaced after the product has been placed on the market.</p>

<h3>9. Technical Documentation (Article 17(1)(h))</h3>
<p>The technical documentation referred to in Annex III is available and will be provided to the market surveillance authorities upon request.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Technical File Location</td><td>[Address where technical file is kept]</td></tr>
<tr><td>Retention Period</td><td>10 years after last product placed on market</td></tr>
</table>

<h3>10. Signatory</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Place of Issue</td><td>[City, Country]</td></tr>
<tr><td>Date of Issue</td><td>${date}</td></tr>
<tr><td>Authorized Signatory</td><td>[Name and Title]</td></tr>
<tr><td>Signature</td><td>_________________________</td></tr>
</table>
`
    }

    case 'certification-application': {
      return `
<h1>Certification Application Form</h1>
<p><strong>Purpose:</strong> Standard application form for PPE product certification</p>
<p><strong>Applicable Markets:</strong> EU, US, UK, China, Global</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>SECTION A: APPLICANT INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Company / Organization Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Registered Address</td><td>[Full registered address]</td></tr>
<tr><td>City / State / Postal Code</td><td>[City, State, ZIP]</td></tr>
<tr><td>Country</td><td>[Country]</td></tr>
<tr><td>Company Registration Number</td><td>[Registration number]</td></tr>
<tr><td>VAT / Tax ID Number</td><td>[Tax identification number]</td></tr>
<tr><td>Contact Person Name</td><td>[Full name]</td></tr>
<tr><td>Contact Person Title</td><td>[Job title]</td></tr>
<tr><td>Telephone</td><td>[Phone number with country code]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
<tr><td>Website</td><td>[Company website URL]</td></tr>
</table>

<h2>SECTION B: PRODUCT INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Commercial product name]</td></tr>
<tr><td>Product Code / Model</td><td>[Model/type reference]</td></tr>
<tr><td>Product Category</td><td>[e.g., Respiratory Protection, Protective Gloves, Eye Protection]</td></tr>
<tr><td>PPE Classification</td><td>[Category I / II / III (EU) or Class I / II / III (US/FDA)]</td></tr>
<tr><td>Brief Product Description</td><td>[Description of product and intended protection]</td></tr>
<tr><td>Intended Use</td><td>[Description of intended use and user population]</td></tr>
<tr><td>Product Variants / Models</td><td>[List all variants included in this application]</td></tr>
<tr><td>Year of First Manufacture</td><td>[Year]</td></tr>
<tr><td>Current Market Status</td><td>[New product / Already marketed in other regions]</td></tr>
</table>

<h2>SECTION C: TARGET MARKET AND CERTIFICATION TYPE</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Target Market(s)</td><td>[ ] EU  [ ] US  [ ] UK  [ ] China  [ ] Other: ___</td></tr>
<tr><td>Type of Certification</td><td>[CE Marking / FDA 510(k) / UKCA / NMPA / Other]</td></tr>
<tr><td>Conformity Assessment Module</td><td>[Module A / B / B+C2 / B+D / Other]</td></tr>
<tr><td>Applicable Regulation(s)</td><td>[List applicable regulations]</td></tr>
<tr><td>Harmonized / Recognized Standards</td><td>[List applicable standards]</td></tr>
</table>

<h2>SECTION D: MANUFACTURING INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Manufacturing Site Name</td><td>[Site name]</td></tr>
<tr><td>Manufacturing Site Address</td><td>[Full address]</td></tr>
<tr><td>Quality Management System</td><td>[ISO 9001 / ISO 13485 / Other / None]</td></tr>
<tr><td>QMS Certificate Number</td><td>[Certificate reference]</td></tr>
<tr><td>QMS Certificate Issuing Body</td><td>[Certification body name]</td></tr>
<tr><td>QMS Certificate Expiry Date</td><td>[Expiry date]</td></tr>
</table>

<h2>SECTION E: PREVIOUS CERTIFICATIONS</h2>
<table>
<tr><th>Certification Type</th><th>Certificate Number</th><th>Issuing Body</th><th>Date Issued</th><th>Status</th></tr>
<tr><td>[Type]</td><td>[Number]</td><td>[Body]</td><td>[Date]</td><td>[Active/Expired]</td></tr>
</table>

<h2>SECTION F: TESTING STATUS</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Testing Completed?</td><td>[ ] Yes  [ ] No  [ ] In Progress</td></tr>
<tr><td>Testing Laboratory</td><td>[Laboratory name and accreditation]</td></tr>
<tr><td>Test Report Number(s)</td><td>[Report references]</td></tr>
<tr><td>Test Report Date(s)</td><td>[Date(s)]</td></tr>
</table>

<h2>SECTION G: AUTHORIZED REPRESENTATIVE / IMPORTER</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>EU Authorized Representative</td><td>[Name and address, if applicable]</td></tr>
<tr><td>US Initial Importer</td><td>[Name and address, if applicable]</td></tr>
<tr><td>UK Responsible Person</td><td>[Name and address, if applicable]</td></tr>
<tr><td>China Agent</td><td>[Name and address, if applicable]</td></tr>
</table>

<h2>SECTION H: DECLARATION AND SIGNATURE</h2>
<p>I hereby certify that the information provided in this application is true and complete to the best of my knowledge. I understand that any false or misleading information may result in rejection of this application or revocation of any certification granted.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Applicant Name</td><td>[Name]</td></tr>
<tr><td>Title</td><td>[Title]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
<tr><td>Signature</td><td>_________________________</td></tr>
</table>
`
    }

    case 'manufacturer-info-form': {
      return `
<h1>Manufacturer Information Form</h1>
<p><strong>Purpose:</strong> Complete manufacturer registration and information form for PPE compliance</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>SECTION 1: COMPANY DETAILS</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Legal Entity Name</td><td>[Full registered company name]</td></tr>
<tr><td>Trading Name (if different)</td><td>[Trading / DBA name]</td></tr>
<tr><td>Registered Address</td><td>[Full registered address]</td></tr>
<tr><td>City / State / Postal Code</td><td>[City, State, ZIP]</td></tr>
<tr><td>Country of Registration</td><td>[Country]</td></tr>
<tr><td>Company Registration Number</td><td>[Registration number]</td></tr>
<tr><td>VAT / Tax ID Number</td><td>[Tax identification number]</td></tr>
<tr><td>Date of Establishment</td><td>[YYYY-MM-DD]</td></tr>
<tr><td>Legal Form</td><td>[e.g., Ltd, GmbH, Inc, LLC]</td></tr>
<tr><td>Company Website</td><td>[URL]</td></tr>
</table>

<h2>SECTION 2: CONTACT INFORMATION</h2>
<h3>2.1 Primary Contact</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Contact Person Name</td><td>[Full name]</td></tr>
<tr><td>Title / Position</td><td>[Job title]</td></tr>
<tr><td>Department</td><td>[Department]</td></tr>
<tr><td>Telephone</td><td>[Phone with country code]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
</table>

<h3>2.2 Regulatory Affairs Contact</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Contact Person Name</td><td>[Full name]</td></tr>
<tr><td>Title / Position</td><td>[Job title]</td></tr>
<tr><td>Telephone</td><td>[Phone with country code]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
</table>

<h3>2.3 Quality Manager Contact</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Contact Person Name</td><td>[Full name]</td></tr>
<tr><td>Title / Position</td><td>[Job title]</td></tr>
<tr><td>Telephone</td><td>[Phone with country code]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
</table>

<h2>SECTION 3: MANUFACTURING FACILITIES</h2>
<h3>3.1 Primary Manufacturing Site</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Site Name</td><td>[Manufacturing site name]</td></tr>
<tr><td>Address</td><td>[Full address]</td></tr>
<tr><td>City / State / Postal Code</td><td>[City, State, ZIP]</td></tr>
<tr><td>Country</td><td>[Country]</td></tr>
<tr><td>Total Floor Area (sqm)</td><td>[Area]</td></tr>
<tr><td>Production Area (sqm)</td><td>[Area]</td></tr>
<tr><td>Number of Employees</td><td>[Count]</td></tr>
<tr><td>Clean Room Facilities?</td><td>[ ] Yes  [ ] No</td></tr>
<tr><td>Clean Room Class</td><td>[ISO Class, if applicable]</td></tr>
</table>

<h3>3.2 Additional Manufacturing Sites</h3>
<table>
<tr><th>Site Name</th><th>Address</th><th>Country</th><th>Products Manufactured</th></tr>
<tr><td>[Site name]</td><td>[Address]</td><td>[Country]</td><td>[Product types]</td></tr>
</table>

<h2>SECTION 4: QUALITY MANAGEMENT SYSTEMS</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>QMS Standard Implemented</td><td>[ISO 9001 / ISO 13485 / Other / None]</td></tr>
<tr><td>Certification Body</td><td>[Name of certifying body]</td></tr>
<tr><td>Certificate Number</td><td>[Certificate reference]</td></tr>
<tr><td>Date of Initial Certification</td><td>[Date]</td></tr>
<tr><td>Date of Last Audit</td><td>[Date]</td></tr>
<tr><td>Certificate Expiry Date</td><td>[Date]</td></tr>
<tr><td>Scope of Certification</td><td>[Scope description]</td></tr>
</table>

<h2>SECTION 5: PRODUCT PORTFOLIO</h2>
<table>
<tr><th>Product Category</th><th>Product Types</th><th>Markets Served</th><th>Certifications Held</th></tr>
<tr><td>[e.g., Respiratory Protection]</td><td>[FFP2 masks, etc.]</td><td>[EU, US, etc.]</td><td>[CE, FDA, etc.]</td></tr>
</table>

<h2>SECTION 6: AUTHORIZED REPRESENTATIVES</h2>
<table>
<tr><th>Market</th><th>Representative Name</th><th>Address</th><th>Mandate Reference</th></tr>
<tr><td>[EU / US / UK / CN]</td><td>[Name]</td><td>[Address]</td><td>[Reference]</td></tr>
</table>

<h2>SECTION 7: DECLARATION</h2>
<p>I hereby certify that the information provided in this form is true, accurate, and complete. I authorize the verification of the information provided and understand that any material misstatement may result in disqualification.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Authorized Signatory Name</td><td>[Name]</td></tr>
<tr><td>Title</td><td>[Title]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
<tr><td>Signature</td><td>_________________________</td></tr>
</table>
`
    }

    case 'qms-form': {
      return `
<h1>Quality Management System Documentation Form</h1>
<p><strong>Standard:</strong> ISO 13485:2016 - Medical devices - Quality management systems - Requirements for regulatory purposes</p>
<p><strong>Purpose:</strong> Comprehensive QMS documentation checklist and compliance tracking form</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>ORGANIZATION INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Organization Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Address</td><td>[Full address]</td></tr>
<tr><td>QMS Scope</td><td>[Scope of QMS certification]</td></tr>
<tr><td>Current Certification Status</td><td>[Certified / In Progress / Not Yet Certified]</td></tr>
<tr><td>Certification Body</td><td>[Name, if applicable]</td></tr>
</table>

<h2>CLAUSE 4: QUALITY MANAGEMENT SYSTEM</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>4.1</td><td>General requirements - QMS established, documented, implemented, and maintained</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.1.1</td><td>Outsourced processes identified and controlled</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.1.2</td><td>QMS documented per 4.2 requirements</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.2.1</td><td>Documentation requirements - quality policy, objectives, manual, procedures, records</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.2.2</td><td>Quality manual established and maintained</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.2.3</td><td>Medical device file maintained for each device type</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.2.4</td><td>Document control procedures established</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>4.2.5</td><td>Record control procedures established</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>CLAUSE 5: MANAGEMENT RESPONSIBILITY</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>5.1</td><td>Management commitment - quality policy, objectives, reviews</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>5.2</td><td>Customer focus - customer requirements determined and met</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>5.3</td><td>Quality policy established, communicated, and reviewed</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>5.4</td><td>Planning - quality objectives and QMS planning</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>5.5</td><td>Responsibility, authority, and communication defined</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>5.6</td><td>Management review conducted at planned intervals</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>CLAUSE 6: RESOURCE MANAGEMENT</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>6.1</td><td>Provision of resources for QMS implementation</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>6.2</td><td>Human resources - competence, training, awareness</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>6.3</td><td>Infrastructure - buildings, equipment, support services</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>6.4</td><td>Work environment and contamination control</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>CLAUSE 7: PRODUCT REALIZATION</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>7.1</td><td>Planning of product realization</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.2</td><td>Customer requirements determined and reviewed</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.2</td><td>Design inputs - functional, performance, regulatory requirements</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.3</td><td>Design outputs documented and meet input requirements</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.4</td><td>Design review at suitable stages</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.5</td><td>Design verification - outputs meet input requirements</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.6</td><td>Design validation - device meets user needs</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.7</td><td>Design transfer to production</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.8</td><td>Design changes controlled and documented</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.3.9</td><td>Design history file (DHF) maintained</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.4</td><td>Purchasing - supplier evaluation, selection, monitoring</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.1</td><td>Production and service provision - controlled conditions</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.2</td><td>Cleanliness of product</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.5</td><td>Sterilization process validation (if applicable)</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.6</td><td>Validation of processes for production and service provision</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.7</td><td>Traceability requirements implemented</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.5.9</td><td>Labeling and packaging controls</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>7.6</td><td>Control of monitoring and measuring equipment</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>CLAUSE 8: MEASUREMENT, ANALYSIS, IMPROVEMENT</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>8.1</td><td>General - monitoring, measurement, analysis, improvement</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.2.1</td><td>Feedback - post-market surveillance and customer feedback</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.2.3</td><td>Reporting to regulatory authorities</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.2.4</td><td>Internal audit conducted at planned intervals</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.2.5</td><td>Monitoring and measurement of processes</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.2.6</td><td>Monitoring and measurement of product</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.3</td><td>Control of nonconforming product</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.4</td><td>Analysis of data for QMS improvement</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>8.5</td><td>Improvement - corrective and preventive action (CAPA)</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>RISK MANAGEMENT (ISO 14971)</h2>
<table>
<tr><th style="width:40px;">#</th><th>Requirement</th><th>Documented?</th><th>Document Reference</th><th>Last Review</th><th>Status</th></tr>
<tr><td>R1</td><td>Risk management plan established</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>R2</td><td>Risk analysis completed for all products</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>R3</td><td>Risk control measures implemented and verified</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>R4</td><td>Overall residual risk evaluated and acceptable</td><td>[ ]</td><td></td><td></td><td></td></tr>
<tr><td>R5</td><td>Risk management file maintained for each product</td><td>[ ]</td><td></td><td></td><td></td></tr>
</table>

<h2>COMPLETION SUMMARY</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Total Requirements</td><td>[Count]</td></tr>
<tr><td>Documented</td><td>[Count]</td></tr>
<tr><td>Not Yet Documented</td><td>[Count]</td></tr>
<tr><td>Compliance Percentage</td><td>[Percentage]</td></tr>
<tr><td>Target Certification Date</td><td>[Date]</td></tr>
<tr><td>Prepared By</td><td>[Name, Title]</td></tr>
<tr><td>Reviewed By</td><td>[Name, Title]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
</table>
`
    }

    case 'testing-application': {
      return `
<h1>Product Testing Application Form</h1>
<p><strong>Purpose:</strong> Application form for submitting PPE products to a testing laboratory</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>SECTION 1: APPLICANT INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Company Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Address</td><td>[Full address]</td></tr>
<tr><td>City / State / Postal Code</td><td>[City, State, ZIP]</td></tr>
<tr><td>Country</td><td>[Country]</td></tr>
<tr><td>Contact Person</td><td>[Full name]</td></tr>
<tr><td>Title / Position</td><td>[Job title]</td></tr>
<tr><td>Telephone</td><td>[Phone with country code]</td></tr>
<tr><td>Email</td><td>[Email address]</td></tr>
<tr><td>Billing Contact (if different)</td><td>[Name and email]</td></tr>
<tr><td>Purchase Order Number</td><td>[PO reference]</td></tr>
</table>

<h2>SECTION 2: PRODUCT SPECIFICATIONS</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Commercial product name]</td></tr>
<tr><td>Product Code / Model</td><td>[Model/type reference]</td></tr>
<tr><td>Product Category</td><td>[e.g., Filtering half mask, Surgical mask, Protective gloves]</td></tr>
<tr><td>Product Description</td><td>[Detailed description including materials and construction]</td></tr>
<tr><td>Intended Use</td><td>[Description of intended use and target user group]</td></tr>
<tr><td>Product Classification</td><td>[PPE Category I/II/III or Medical Device Class]</td></tr>
<tr><td>Number of Product Variants</td><td>[Count]</td></tr>
<tr><td>Variant Details</td><td>[List all variants with model numbers]</td></tr>
<tr><td>Manufacturing Date</td><td>[Date]</td></tr>
<tr><td>Batch / Lot Number</td><td>[Reference]</td></tr>
<tr><td>Shelf Life / Expiry Date</td><td>[Duration / Date]</td></tr>
</table>

<h2>SECTION 3: SAMPLE INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Number of Samples Provided</td><td>[Count]</td></tr>
<tr><td>Sample Condition</td><td>[New / Aged / Other]</td></tr>
<tr><td>Sample Packaging</td><td>[Description of packaging]</td></tr>
<tr><td>Sample Storage Requirements</td><td>[Temperature, humidity, etc.]</td></tr>
<tr><td>Special Handling Instructions</td><td>[Any special requirements]</td></tr>
<tr><td>Date Samples Shipped</td><td>[Date]</td></tr>
<tr><td>Shipping Method / Carrier</td><td>[Method and tracking number]</td></tr>
</table>

<h2>SECTION 4: TEST REQUIREMENTS</h2>
<h3>4.1 Standards to Test Against</h3>
<table>
<tr><th>Standard Reference</th><th>Title</th><th>Specific Clauses / Tests</th></tr>
<tr><td>[e.g., EN 149:2001+A1:2009]</td><td>[Title]</td><td>[e.g., All / Clauses 7.9, 7.11, 7.16]</td></tr>
<tr><td>[e.g., EN 14683:2019]</td><td>[Title]</td><td>[Specific clauses]</td></tr>
</table>

<h3>4.2 Specific Tests Requested</h3>
<table>
<tr><th>Test Parameter</th><th>Standard / Method</th><th>Specification / Limit</th><th>Number of Samples</th></tr>
<tr><td>[e.g., Filtration Efficiency]</td><td>[e.g., EN 149 Clause 7.9]</td><td>[e.g., FFP2: &ge;94%]</td><td>[Count]</td></tr>
<tr><td>[e.g., Breathing Resistance]</td><td>[e.g., EN 149 Clause 7.16]</td><td>[e.g., &le;0.7 mbar]</td><td>[Count]</td></tr>
<tr><td>[e.g., Bacterial Filtration Efficiency]</td><td>[e.g., EN 14683 Annex B]</td><td>[e.g., Type II: &ge;98%]</td><td>[Count]</td></tr>
<tr><td>[e.g., Biocompatibility - Cytotoxicity]</td><td>[e.g., ISO 10993-5]</td><td>[Non-cytotoxic]</td><td>[Count]</td></tr>
</table>

<h3>4.3 Additional Testing Requirements</h3>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Accelerated Aging Testing Required?</td><td>[ ] Yes  [ ] No</td></tr>
<tr><td>Shelf Life Validation Required?</td><td>[ ] Yes  [ ] No</td></tr>
<tr><td>Custom Test Methods?</td><td>[ ] Yes  [ ] No - If yes, provide protocol</td></tr>
<tr><td>Comparison Testing (vs. predicate)?</td><td>[ ] Yes  [ ] No</td></tr>
<tr><td>Target Market for Results</td><td>[EU / US / UK / CN / Other]</td></tr>
</table>

<h2>SECTION 5: PRODUCT DOCUMENTATION PROVIDED</h2>
<table>
<tr><th style="width:40px;">#</th><th>Document</th><th>Included?</th></tr>
<tr><td>1</td><td>Product technical drawings / specifications</td><td>[ ]</td></tr>
<tr><td>2</td><td>Bill of materials</td><td>[ ]</td></tr>
<tr><td>3</td><td>Material safety data sheets (MSDS)</td><td>[ ]</td></tr>
<tr><td>4</td><td>Previous test reports</td><td>[ ]</td></tr>
<tr><td>5</td><td>User instructions / IFU</td><td>[ ]</td></tr>
<tr><td>6</td><td>Product labeling samples</td><td>[ ]</td></tr>
<tr><td>7</td><td>Risk assessment report</td><td>[ ]</td></tr>
<tr><td>8</td><td>Biocompatibility assessment</td><td>[ ]</td></tr>
</table>

<h2>SECTION 6: REPORTING REQUIREMENTS</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Report Language</td><td>[English / Chinese / Other]</td></tr>
<tr><td>Report Format</td><td>[Standard / Detailed / Custom]</td></tr>
<tr><td>Confidentiality Requirements</td><td>[Standard NDA / Custom NDA / None]</td></tr>
<tr><td>Target Report Completion Date</td><td>[Date]</td></tr>
<tr><td>Rush Service Required?</td><td>[ ] Yes  [ ] No</td></tr>
</table>

<h2>SECTION 7: AUTHORIZATION AND SIGNATURE</h2>
<p>I authorize the testing laboratory to conduct the tests specified above on the samples provided. I confirm that the samples are representative of the product as placed on the market and that all information provided is accurate.</p>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Authorized Signatory Name</td><td>[Name]</td></tr>
<tr><td>Title</td><td>[Title]</td></tr>
<tr><td>Date</td><td>${date}</td></tr>
<tr><td>Signature</td><td>_________________________</td></tr>
</table>
`
    }

    case 'pms-plan': {
      return `
<h1>Post-Market Surveillance Plan Template</h1>
<p><strong>Regulatory Basis:</strong> Regulation (EU) 2016/425, Article 17 and Annex VII</p>
<p><strong>Related Requirements:</strong> EU MDR 2017/745 Article 84-86 (where applicable), ISO 13485 Clause 8.2.1</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>

<h2>1. GENERAL INFORMATION</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Product Name</td><td>[Product commercial name]</td></tr>
<tr><td>Product Code / Model</td><td>[Model/type reference]</td></tr>
<tr><td>PPE Category</td><td>[Category I / II / III]</td></tr>
<tr><td>Manufacturer Name</td><td>[Full legal entity name]</td></tr>
<tr><td>Notified Body (if applicable)</td><td>[Name and 4-digit number]</td></tr>
<tr><td>EU Type Examination Certificate No.</td><td>[Certificate reference]</td></tr>
<tr><td>Date of First Placement on Market</td><td>[Date]</td></tr>
<tr><td>PMS Plan Reference Number</td><td>[PMS-YYYY-XXX]</td></tr>
<tr><td>Plan Effective Date</td><td>${date}</td></tr>
<tr><td>Next Review Date</td><td>[Date - at least annually]</td></tr>
</table>

<h2>2. SCOPE AND OBJECTIVES</h2>
<h3>2.1 Scope</h3>
<p>This Post-Market Surveillance (PMS) plan applies to [product name] as placed on the EU market under Regulation (EU) 2016/425. It covers all activities related to monitoring the safety and performance of the product throughout its market lifecycle.</p>

<h3>2.2 Objectives</h3>
<ul>
<li>Systematically collect and evaluate performance and safety data from marketed products</li>
<li>Detect and assess any changes in risk-benefit balance</li>
<li>Identify the need for corrective or preventive actions</li>
<li>Ensure ongoing compliance with applicable regulatory requirements</li>
<li>Support the periodic safety update and vigilance reporting obligations</li>
</ul>

<h2>3. DATA COLLECTION METHODS</h2>
<h3>3.1 Proactive Data Collection</h3>
<table>
<tr><th>Data Source</th><th>Collection Method</th><th>Frequency</th><th>Responsible Person</th></tr>
<tr><td>Customer complaints and feedback</td><td>[Complaint handling system]</td><td>[Continuous]</td><td>[Name/Role]</td></tr>
<tr><td>Post-market clinical follow-up</td><td>[PMCF plan, if applicable]</td><td>[Per PMCF schedule]</td><td>[Name/Role]</td></tr>
<tr><td>User surveys and questionnaires</td><td>[Survey methodology]</td><td>[Annual / Biannual]</td><td>[Name/Role]</td></tr>
<tr><td>Literature review</td><td>[Search strategy and databases]</td><td>[Annual]</td><td>[Name/Role]</td></tr>
<tr><td>Product performance testing</td><td>[Retained sample testing]</td><td>[Per schedule]</td><td>[Name/Role]</td></tr>
<tr><td>Registry data (if applicable)</td><td>[Registry participation]</td><td>[Per registry schedule]</td><td>[Name/Role]</td></tr>
</table>

<h3>3.2 Reactive Data Collection</h3>
<table>
<tr><th>Data Source</th><th>Collection Method</th><th>Frequency</th><th>Responsible Person</th></tr>
<tr><td>Adverse incident reports</td><td>[Vigilance reporting system]</td><td>[Continuous]</td><td>[Name/Role]</td></tr>
<tr><td>Field safety corrective actions</td><td>[FSCA procedure]</td><td>[As needed]</td><td>[Name/Role]</td></tr>
<tr><td>Competent authority notifications</td><td>[Regulatory intelligence]</td><td>[Continuous]</td><td>[Name/Role]</td></tr>
<tr><td>Notified Body findings</td><td>[Surveillance audit reports]</td><td>[Per audit schedule]</td><td>[Name/Role]</td></tr>
<tr><td>Distributor and importer feedback</td><td>[Feedback channel]</td><td>[Continuous]</td><td>[Name/Role]</td></tr>
</table>

<h2>4. DATA EVALUATION AND ANALYSIS</h2>
<h3>4.1 Trend Analysis</h3>
<p>Collected data shall be analyzed for trends including:</p>
<ul>
<li>Complaint rate trends by product variant, batch, and market</li>
<li>Type and severity of reported incidents</li>
<li>Performance degradation patterns over product lifecycle</li>
<li>Comparison with pre-market risk assessment assumptions</li>
</ul>

<h3>4.2 Risk-Benefit Re-evaluation</h3>
<p>Based on collected data, the risk-benefit balance shall be re-evaluated considering:</p>
<ul>
<li>Any new or changed risks identified through PMS data</li>
<li>Effectiveness of existing risk control measures</li>
<li>Whether residual risks remain acceptable</li>
<li>Whether previously unknown hazards have been identified</li>
</ul>

<h2>5. VIGILANCE PROCEDURES</h2>
<h3>5.1 Incident Reporting Criteria</h3>
<p>Per Regulation (EU) 2016/425, incidents that meet the following criteria must be reported to the competent authority:</p>
<ul>
<li>Any incident that has led to, or could have led to, the death of a user or a third person</li>
<li>Any incident that has led to, or could have led to, a serious deterioration in the health of a user or a third person</li>
<li>Any incident which, if it were to recur, could lead to death or serious deterioration in health</li>
</ul>

<h3>5.2 Reporting Timelines</h3>
<table>
<tr><th>Incident Severity</th><th>Initial Reporting Deadline</th><th>Follow-up Report</th><th>Final Report</th></tr>
<tr><td>Death or serious deterioration in health</td><td>Within 10 calendar days</td><td>[As requested]</td><td>[Within timeframe set by CA]</td></tr>
<tr><td>Potential for serious deterioration</td><td>Within 15 calendar days</td><td>[As requested]</td><td>[Within timeframe set by CA]</td></tr>
<tr><td>Other reportable incidents</td><td>Within 20 calendar days</td><td>[As requested]</td><td>[Within timeframe set by CA]</td></tr>
</table>

<h3>5.3 Field Safety Corrective Actions (FSCA)</h3>
<p>When a FSCA is initiated, the following shall be documented:</p>
<ul>
<li>Description of the non-conformity and affected products</li>
<li>Risk assessment justifying the corrective action</li>
<li>Type of FSCA (recall, modification, advisory notice, etc.)</li>
<li>Communication plan for users, distributors, and authorities</li>
<li>Timeline for implementation and effectiveness verification</li>
</ul>

<h2>6. PERIODIC SAFETY UPDATE REPORT (PSUR)</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>PSUR Preparation Frequency</td><td>[Annually / Biannually / Per Notified Body requirement]</td></tr>
<tr><td>PSUR Responsible Person</td><td>[Name and role]</td></tr>
<tr><td>PSUR Review and Approval</td><td>[Management representative]</td></tr>
<tr><td>PSUR Distribution</td><td>[Notified Body / Competent Authority upon request]</td></tr>
</table>

<h3>6.1 PSUR Content</h3>
<p>The PSUR shall include, at minimum:</p>
<ol>
<li>Summary of sales and usage data</li>
<li>Summary of complaint and incident data with trend analysis</li>
<li>Summary of any FSCAs taken during the reporting period</li>
<li>Updated risk-benefit assessment</li>
<li>Conclusion on the continued safety and performance of the product</li>
<li>Any recommendations for product improvement</li>
</ol>

<h2>7. CORRECTIVE AND PREVENTIVE ACTIONS (CAPA)</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>CAPA Procedure Reference</td><td>[Document reference]</td></tr>
<tr><td>CAPA Trigger Criteria</td><td>[Thresholds for initiating CAPA]</td></tr>
<tr><td>CAPA Responsible Person</td><td>[Name and role]</td></tr>
<tr><td>Effectiveness Verification Method</td><td>[Method description]</td></tr>
</table>

<h2>8. COMMUNICATION AND DISTRIBUTION</h2>
<table>
<tr><th>Stakeholder</th><th>Communication Type</th><th>Frequency</th><th>Responsible Person</th></tr>
<tr><td>Competent Authorities</td><td>[Vigilance reports, PSUR]</td><td>[Per regulatory requirements]</td><td>[Name/Role]</td></tr>
<tr><td>Notified Body</td><td>[PSUR, surveillance audit data]</td><td>[Per NB requirements]</td><td>[Name/Role]</td></tr>
<tr><td>Distributors / Importers</td><td>[Safety notices, FSCA communications]</td><td>[As needed]</td><td>[Name/Role]</td></tr>
<tr><td>End Users</td><td>[Safety notices, advisory notices]</td><td>[As needed]</td><td>[Name/Role]</td></tr>
<tr><td>EU Authorized Representative</td><td>[All PMS-related communications]</td><td>[Continuous]</td><td>[Name/Role]</td></tr>
</table>

<h2>9. PLAN REVIEW AND UPDATE</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
<tr><td>Review Frequency</td><td>[At least annually, or upon significant change]</td></tr>
<tr><td>Review Triggers</td><td>[New risks, regulatory changes, FSCAs, significant complaints]</td></tr>
<tr><td>Review Responsible Person</td><td>[Name and role]</td></tr>
<tr><td>Approval Authority</td><td>[Management representative]</td></tr>
</table>

<h2>10. APPROVAL</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>PMS Plan Author</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Quality Manager</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>Regulatory Affairs Manager</td><td>[Name]</td><td></td><td></td></tr>
<tr><td>General Manager / CEO</td><td>[Name]</td><td></td><td></td></tr>
</table>
`
    }

    case 'eu-doc-annex-vi': {
      return `
<h1>EU DECLARATION OF CONFORMITY</h1>
<p><em>Per Article 17 and Annex VI of Regulation (EU) 2016/425 of the European Parliament and of the Council of 9 March 2016 on personal protective equipment</em></p>
<p><strong>Document Reference:</strong> DoC-[________]-${new Date().getFullYear()}</p>
<p><strong>Version:</strong> 1.0</p>
<p><strong>Date:</strong> ${date}</p>
<hr>

<h2>SECTION 1: MANUFACTURER (Article 17(1)(a))</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Manufacturer Name *</td><td>[________________________________________]</td></tr>
<tr><td>Registered Address *</td><td>[________________________________________]</td></tr>
<tr><td>City *</td><td>[________________________________________]</td></tr>
<tr><td>Postal Code *</td><td>[________________________________________]</td></tr>
<tr><td>Country *</td><td>[________________________________________]</td></tr>
<tr><td>Telephone</td><td>[________________________________________]</td></tr>
<tr><td>Email</td><td>[________________________________________]</td></tr>
<tr><td>VAT / Registration Number</td><td>[________________________________________]</td></tr>
</table>

<h2>SECTION 2: AUTHORIZED REPRESENTATIVE (if manufacturer outside EU)</h2>
<p><em>Complete this section only if the manufacturer is not established within the EU.</em></p>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Representative Name</td><td>[________________________________________]</td></tr>
<tr><td>Address within EU</td><td>[________________________________________]</td></tr>
<tr><td>Mandate Reference</td><td>[________________________________________]</td></tr>
<tr><td>Mandate Date</td><td>[________________________________________]</td></tr>
</table>
<p>☐ Not applicable (manufacturer established within the EU)</p>

<h2>SECTION 3: PRODUCT IDENTIFICATION (Article 17(1)(b))</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Product Name *</td><td>[________________________________________]</td></tr>
<tr><td>Product Code / Model *</td><td>[________________________________________]</td></tr>
<tr><td>Serial / Batch Number</td><td>[________________________________________]</td></tr>
<tr><td>PPE Category *</td><td>☐ Category I &nbsp;&nbsp; ☐ Category II &nbsp;&nbsp; ☐ Category III</td></tr>
<tr><td>Product Description *</td><td>[________________________________________]</td></tr>
<tr><td>Intended Use *</td><td>[________________________________________]</td></tr>
<tr><td>Target User Group</td><td>[________________________________________]</td></tr>
<tr><td>Protection Type</td><td>[________________________________________]</td></tr>
</table>

<h2>SECTION 4: APPLICABLE UNION HARMONISATION LEGISLATION (Article 17(1)(c))</h2>
<p>The product described above is in conformity with the following applicable Union harmonisation legislation:</p>
<table>
<tr><th style="width:280px;">Legislation</th><th>Reference</th></tr>
<tr><td>Regulation (EU) 2016/425 *</td><td>Personal protective equipment - OJ L 81, 31.3.2016</td></tr>
<tr><td>Other applicable legislation</td><td>[________________________________________]</td></tr>
</table>

<h2>SECTION 5: CONFORMITY ASSESSMENT PROCEDURE (Article 17(1)(d))</h2>
<p>The following conformity assessment procedure(s) have been applied:</p>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Assessment Module(s) *</td><td>☐ Module A (Cat I) &nbsp;&nbsp; ☐ Module B + C2 (Cat III) &nbsp;&nbsp; ☐ Module B + D (Cat III)</td></tr>
<tr><td>Notified Body Name</td><td>[________________________________________]</td></tr>
<tr><td>Notified Body Number (4-digit)</td><td>[________________________________________]</td></tr>
<tr><td>Notified Body Address</td><td>[________________________________________]</td></tr>
<tr><td>EU Type Examination Cert No.</td><td>[________________________________________]</td></tr>
<tr><td>Certificate Date</td><td>[________________________________________]</td></tr>
<tr><td>Quality System Cert No. (Module D/C2)</td><td>[________________________________________]</td></tr>
<tr><td>Quality System Cert Date</td><td>[________________________________________]</td></tr>
</table>

<h2>SECTION 6: HARMONIZED STANDARDS APPLIED (Article 17(1)(e))</h2>
<p>The following harmonized standards have been applied:</p>
<table>
<tr><th>#</th><th>Standard Reference</th><th>Title</th><th>Date</th></tr>
<tr><td>1</td><td>[________________________]</td><td>[________________________________________]</td><td>[________]</td></tr>
<tr><td>2</td><td>[________________________]</td><td>[________________________________________]</td><td>[________]</td></tr>
<tr><td>3</td><td>[________________________]</td><td>[________________________________________]</td><td>[________]</td></tr>
<tr><td>4</td><td>[________________________]</td><td>[________________________________________]</td><td>[________]</td></tr>
<tr><td>5</td><td>[________________________]</td><td>[________________________________________]</td><td>[________]</td></tr>
</table>

<h2>SECTION 7: OTHER TECHNICAL SPECIFICATIONS (Article 17(1)(f))</h2>
<p>Other technical specifications or national standards applied for which no harmonized standards exist:</p>
<table>
<tr><th>#</th><th>Specification Reference</th><th>Title / Description</th></tr>
<tr><td>1</td><td>[________________________]</td><td>[________________________________________]</td></tr>
<tr><td>2</td><td>[________________________]</td><td>[________________________________________]</td></tr>
</table>
<p>☐ Not applicable</p>

<h2>SECTION 8: STATEMENT OF CONFORMITY (Article 17(1)(g))</h2>
<p>This declaration is issued under the sole responsibility of the manufacturer. The object of the declaration described above is in conformity with the relevant Union harmonisation legislation.</p>
<p>This declaration relates only to the product in the state in which it was placed on the market, and excludes components which are added to, modified or replaced after the product has been placed on the market.</p>

<h2>SECTION 9: TECHNICAL DOCUMENTATION (Article 17(1)(h))</h2>
<p>The technical documentation referred to in Annex III is available and will be provided to the market surveillance authorities upon request.</p>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Technical File Location</td><td>[________________________________________]</td></tr>
<tr><td>Retention Period</td><td>10 years after last product placed on market</td></tr>
</table>

<h2>SECTION 10: SIGNATURE</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Place of Issue *</td><td>[________________________________________]</td></tr>
<tr><td>Date of Issue *</td><td>${date}</td></tr>
<tr><td>Authorized Signatory Name *</td><td>[________________________________________]</td></tr>
<tr><td>Title / Position *</td><td>[________________________________________]</td></tr>
<tr><td>Signature *</td><td>________________________________________</td></tr>
</table>

<hr>
<p><em>* indicates mandatory fields per Annex VI of Regulation (EU) 2016/425</em></p>
<p><em>This declaration was generated by MDLooker PPE Compliance Platform. The manufacturer is responsible for verifying the accuracy and completeness of all information before signing.</em></p>
`
    }

    case 'fda-3881-coversheet': {
      return `
<h1>PREMARKET NOTIFICATION - 510(k) COVER SHEET</h1>
<p><strong>Form:</strong> FDA 3881</p>
<p><strong>Regulatory Basis:</strong> Section 510(k) of the Federal Food, Drug, and Cosmetic Act (21 USC 360(k))</p>
<p><strong>Regulation:</strong> 21 CFR Part 807, Subpart E - Premarket Notification</p>
<p><strong>Date Prepared:</strong> ${date}</p>
<hr>

<h2>PART I: SUBMITTER INFORMATION</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Submitter Company Name *</td><td>[________________________________________]</td></tr>
<tr><td>Establishment Registration No.</td><td>[________________________________________]</td></tr>
<tr><td>Street Address *</td><td>[________________________________________]</td></tr>
<tr><td>City *</td><td>[________________________________________]</td></tr>
<tr><td>State / Province *</td><td>[________________________________________]</td></tr>
<tr><td>ZIP / Postal Code *</td><td>[________________________________________]</td></tr>
<tr><td>Country *</td><td>[________________________________________]</td></tr>
<tr><td>Contact Person *</td><td>[________________________________________]</td></tr>
<tr><td>Contact Title</td><td>[________________________________________]</td></tr>
<tr><td>Telephone *</td><td>[________________________________________]</td></tr>
<tr><td>Fax</td><td>[________________________________________]</td></tr>
<tr><td>Email *</td><td>[________________________________________]</td></tr>
</table>

<h2>PART II: DEVICE IDENTIFICATION</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Device Trade Name *</td><td>[________________________________________]</td></tr>
<tr><td>Common / Usual Name *</td><td>[________________________________________]</td></tr>
<tr><td>Classification Regulation *</td><td>[________________________________________]</td></tr>
<tr><td>Classification Panel *</td><td>[________________________________________]</td></tr>
<tr><td>FDA Product Code *</td><td>[________________________________________]</td></tr>
<tr><td>Device Class *</td><td>☐ Class I &nbsp;&nbsp; ☐ Class II &nbsp;&nbsp; ☐ Class III</td></tr>
<tr><td>Action Type *</td><td>☐ New Device &nbsp;&nbsp; ☐ Modification to Existing Device</td></tr>
</table>

<h2>PART III: PREDICATE DEVICE(S)</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Predicate 1</th><th>Predicate 2</th></tr>
<tr><td>Predicate Device Trade Name *</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>510(k) Number *</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>Predicate Manufacturer</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>Date Cleared</td><td>[________________________]</td><td>[________________________]</td></tr>
</table>

<h2>PART IV: SUMMARY OF TECHNOLOGICAL CHARACTERISTICS</h2>
<h3>4.1 Intended Use Comparison</h3>
<table>
<tr><th style="width:200px;">Aspect</th><th>Subject Device</th><th>Predicate Device</th><th>Same / Different</th></tr>
<tr><td>General Intended Use</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Target Population</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Use Environment</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Indications for Use</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
</table>

<h3>4.2 Technological Characteristics Comparison</h3>
<table>
<tr><th style="width:200px;">Characteristic</th><th>Subject Device</th><th>Predicate Device</th><th>Same / Different</th></tr>
<tr><td>Design / Construction</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Materials</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Operating Principle</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Energy Source</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
<tr><td>Performance Specs</td><td>[________________________]</td><td>[________________________]</td><td>☐ Same ☐ Different</td></tr>
</table>

<h3>4.3 Summary of Differences</h3>
<p>[Describe any differences in technological characteristics and explain why they do not raise different questions of safety and effectiveness]</p>
<p>[________________________________________________________________________________]</p>
<p>[________________________________________________________________________________]</p>
<p>[________________________________________________________________________________]</p>

<h2>PART V: 510(k) SUMMARY OR STATEMENT (21 CFR 807.92 / 807.93)</h2>
<p>☐ 510(k) Summary is provided per 21 CFR 807.92</p>
<p>☐ 510(k) Statement is provided per 21 CFR 807.93</p>

<h2>PART VI: REQUIRED CONTENT CHECKLIST (21 CFR 807.87)</h2>
<table>
<tr><th>Section</th><th>Requirement</th><th>Included</th></tr>
<tr><td>807.87(a)</td><td>Device name - trade and common</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(b)</td><td>Establishment registration number</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(c)</td><td>Classification - class, panel, product code</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(d)</td><td>Action taken - new device or modification</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(e)</td><td>Proposed labeling, advertisements</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(f)</td><td>510(k) summary or statement</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(g)</td><td>Design controls compliance statement</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(h)</td><td>Indications for use statement</td><td>☐ Yes ☐ No</td></tr>
<tr><td>807.87(i)</td><td>Photographs of device (if applicable)</td><td>☐ Yes ☐ N/A</td></tr>
<tr><td>807.87(j)</td><td>Additional information - performance data</td><td>☐ Yes ☐ No</td></tr>
</table>

<h2>PART VII: CERTIFICATION AND SIGNATURE</h2>
<p>I certify that, to the best of my knowledge, the information submitted in this premarket notification is true, accurate, and complete. I understand that any false statement may subject me to civil or criminal penalties under 18 USC 1001.</p>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Authorized Representative Name *</td><td>[________________________________________]</td></tr>
<tr><td>Title *</td><td>[________________________________________]</td></tr>
<tr><td>Signature *</td><td>________________________________________</td></tr>
<tr><td>Date *</td><td>${date}</td></tr>
</table>

<hr>
<p><em>* indicates mandatory fields per 21 CFR 807.87</em></p>
<p><em>510(k) Number: [To be assigned by FDA upon receipt]</em></p>
<p><em>This form was generated by MDLooker PPE Compliance Platform. The submitter is responsible for verifying the accuracy and completeness of all information before submission to FDA.</em></p>
`
    }

    case 'nmpa-reg-form': {
      return `
<h1>医疗器械注册申请表</h1>
<h2>MEDICAL DEVICE REGISTRATION APPLICATION FORM</h2>
<p><strong>Regulatory Basis:</strong> Regulations for Supervision and Administration of Medical Devices (State Council Decree No. 739)</p>
<p><strong>Procedural Order:</strong> Measures for the Administration of Medical Device Registration and Filing (Order No. 47, 2021)</p>
<p><strong>Date:</strong> ${date}</p>
<hr>

<h2>一、申请人信息 (APPLICANT INFORMATION)</h2>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>申请人名称（中文）*</td><td>[________________________________________]</td></tr>
<tr><td>申请人名称（英文）</td><td>[________________________________________]</td></tr>
<tr><td>注册住所 *</td><td>[________________________________________]</td></tr>
<tr><td>生产地址 *</td><td>[________________________________________]</td></tr>
<tr><td>统一社会信用代码</td><td>[________________________________________]</td></tr>
<tr><td>法定代表人</td><td>[________________________________________]</td></tr>
<tr><td>联系人 *</td><td>[________________________________________]</td></tr>
<tr><td>联系电话 *</td><td>[________________________________________]</td></tr>
<tr><td>电子邮箱</td><td>[________________________________________]</td></tr>
<tr><td>境外申请人类型</td><td>☐ 境内生产企业 &nbsp;&nbsp; ☐ 境外生产企业</td></tr>
</table>

<h3>代理人信息（境外申请人填写）(AGENT INFORMATION - For Overseas Applicants)</h3>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>代理人名称 *</td><td>[________________________________________]</td></tr>
<tr><td>代理人住所 *</td><td>[________________________________________]</td></tr>
<tr><td>代理人联系电话</td><td>[________________________________________]</td></tr>
<tr><td>授权委托书编号</td><td>[________________________________________]</td></tr>
</table>

<h2>二、产品规格 (PRODUCT SPECIFICATIONS)</h2>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>产品名称（中文）*</td><td>[________________________________________]</td></tr>
<tr><td>产品名称（英文）</td><td>[________________________________________]</td></tr>
<tr><td>型号 / 规格 *</td><td>[________________________________________]</td></tr>
<tr><td>分类编码 *</td><td>[________________________________________]</td></tr>
<tr><td>管理类别 *</td><td>☐ 二类 (Class II) &nbsp;&nbsp; ☐ 三类 (Class III)</td></tr>
<tr><td>产品描述</td><td>[________________________________________]</td></tr>
<tr><td>适用范围 *</td><td>[________________________________________]</td></tr>
<tr><td>禁忌症</td><td>[________________________________________]</td></tr>
<tr><td>产品技术要求编号</td><td>[________________________________________]</td></tr>
</table>

<h3>型号规格对比表 (Model/Specification Comparison)</h3>
<table>
<tr><th>型号</th><th>规格描述</th><th>与基础型号差异</th></tr>
<tr><td>[________________]</td><td>[________________________________________]</td><td>[________________________________________]</td></tr>
<tr><td>[________________]</td><td>[________________________________________]</td><td>[________________________________________]</td></tr>
<tr><td>[________________]</td><td>[________________________________________]</td><td>[________________________________________]</td></tr>
</table>

<h2>三、临床评价摘要 (CLINICAL EVALUATION SUMMARY)</h2>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>临床评价路径 *</td><td>☐ 临床试验 &nbsp;&nbsp; ☐ 同品种临床评价 &nbsp;&nbsp; ☐ 免于临床评价</td></tr>
<tr><td>评价报告编号</td><td>[________________________________________]</td></tr>
<tr><td>评价机构</td><td>[________________________________________]</td></tr>
<tr><td>评价结论</td><td>[________________________________________]</td></tr>
</table>

<h3>临床试验信息（如适用）(Clinical Trial Information - if applicable)</h3>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>临床试验备案号</td><td>[________________________________________]</td></tr>
<tr><td>临床试验机构</td><td>[________________________________________]</td></tr>
<tr><td>样本量</td><td>[________________________________________]</td></tr>
<tr><td>主要评价指标</td><td>[________________________________________]</td></tr>
<tr><td>试验结果</td><td>[________________________________________]</td></tr>
</table>

<h2>四、质量体系文件 (QUALITY SYSTEM DOCUMENTATION)</h2>
<table>
<tr><th style="width:280px;">项目 / Field</th><th>内容 / Content</th></tr>
<tr><td>质量管理体系标准</td><td>☐ ISO 13485 &nbsp;&nbsp; ☐ YY/T 0287 &nbsp;&nbsp; ☐ 其他: [________]</td></tr>
<tr><td>认证机构</td><td>[________________________________________]</td></tr>
<tr><td>证书编号</td><td>[________________________________________]</td></tr>
<tr><td>认证范围</td><td>[________________________________________]</td></tr>
<tr><td>证书有效期</td><td>[________________________________________]</td></tr>
<tr><td>生产许可证编号（境内）</td><td>[________________________________________]</td></tr>
<tr><td>GMP检查情况</td><td>☐ 已通过 &nbsp;&nbsp; ☐ 待检查 &nbsp;&nbsp; ☐ 不适用</td></tr>
</table>

<h2>五、申报资料清单 (SUBMISSION DOCUMENT CHECKLIST)</h2>
<table>
<tr><th>#</th><th>资料名称 / Document</th><th>是否提交 / Submitted</th></tr>
<tr><td>1</td><td>注册申请表 / Registration Application Form</td><td>☐ Yes ☐ No</td></tr>
<tr><td>2</td><td>证明性文件 / Supporting Documents</td><td>☐ Yes ☐ No</td></tr>
<tr><td>3</td><td>医疗器械安全有效基本要求清单 / Essential Requirements Checklist</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4</td><td>综述资料 / Summary Documentation</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5</td><td>研究资料 / Research Documentation</td><td>☐ Yes ☐ No</td></tr>
<tr><td>6</td><td>生产制造信息 / Manufacturing Information</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7</td><td>临床评价资料 / Clinical Evaluation</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8</td><td>产品风险分析资料 / Risk Analysis</td><td>☐ Yes ☐ No</td></tr>
<tr><td>9</td><td>产品技术要求 / Product Technical Requirements</td><td>☐ Yes ☐ No</td></tr>
<tr><td>10</td><td>产品注册检验报告 / Type Testing Report</td><td>☐ Yes ☐ No</td></tr>
<tr><td>11</td><td>说明书和标签样稿 / IFU and Label Drafts</td><td>☐ Yes ☐ No</td></tr>
<tr><td>12</td><td>符合性声明 / Declaration of Conformity</td><td>☐ Yes ☐ No</td></tr>
</table>

<h2>六、符合性声明 (DECLARATION OF CONFORMITY)</h2>
<p>本申请人声明：</p>
<ol>
<li>本申请人对所提交资料的真实性负责；</li>
<li>本申请人已建立与产品研制、生产有关的质量管理体系，并保持有效运行；</li>
<li>本申请产品符合现行国家标准、行业标准；</li>
<li>本申请产品符合《医疗器械注册与备案管理办法》要求。</li>
</ol>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>申请人名称 / Applicant Name *</td><td>[________________________________________]</td></tr>
<tr><td>法定代表人签字 / Legal Rep. Signature *</td><td>________________________________________</td></tr>
<tr><td>日期 / Date *</td><td>${date}</td></tr>
<tr><td>公章 / Company Seal</td><td>[Affix company seal here]</td></tr>
</table>

<hr>
<p><em>* indicates mandatory fields per NMPA Order No. 47</em></p>
<p><em>This form was generated by MDLooker PPE Compliance Platform. The applicant is responsible for verifying the accuracy and completeness of all information before submission to NMPA.</em></p>
`
    }

    case 'iso-13485-quality-manual': {
      return `
<h1>QUALITY MANUAL</h1>
<p><strong>Standard:</strong> ISO 13485:2016 - Medical devices - Quality management systems - Requirements for regulatory purposes</p>
<p><strong>Document Number:</strong> QM-[________]-${new Date().getFullYear()}</p>
<p><strong>Version:</strong> 1.0</p>
<p><strong>Effective Date:</strong> ${date}</p>
<hr>

<h2>1. ORGANIZATION PROFILE AND SCOPE</h2>

<h3>1.1 Organization Information</h3>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Organization Name *</td><td>[________________________________________]</td></tr>
<tr><td>Registered Address *</td><td>[________________________________________]</td></tr>
<tr><td>Manufacturing Site(s)</td><td>[________________________________________]</td></tr>
<tr><td>Number of Employees</td><td>[________________________________________]</td></tr>
<tr><td>Year Established</td><td>[________________________________________]</td></tr>
<tr><td>CEO / General Manager</td><td>[________________________________________]</td></tr>
</table>

<h3>1.2 Scope of the Quality Management System</h3>
<p>The QMS of [Organization Name] covers the following activities:</p>
<p>[________________________________________________________________________________]</p>
<p>[________________________________________________________________________________]</p>

<h3>1.3 Permissible Exclusions</h3>
<p>The following clauses of ISO 13485:2016 are excluded from the QMS scope:</p>
<table>
<tr><th>Clause</th><th>Requirement</th><th>Justification for Exclusion</th></tr>
<tr><td>[________]</td><td>[________________________________________]</td><td>[________________________________________]</td></tr>
</table>
<p>☐ No exclusions</p>

<h2>2. QUALITY POLICY AND OBJECTIVES</h2>

<h3>2.1 Quality Policy</h3>
<p>[Organization Name] is committed to:</p>
<ul>
<li>Designing, manufacturing, and distributing medical devices / PPE that consistently meet customer and regulatory requirements</li>
<li>Maintaining the effectiveness of the quality management system</li>
<li>Continually improving our processes and products</li>
</ul>
<p><em>[Insert organization-specific quality policy statement here]</em></p>
<p>[________________________________________________________________________________]</p>
<p>[________________________________________________________________________________]</p>

<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Approved By</td><td>[________________________________________]</td></tr>
<tr><td>Date Approved</td><td>[________________________________________]</td></tr>
</table>

<h3>2.2 Quality Objectives</h3>
<table>
<tr><th>#</th><th>Objective</th><th>Measurement</th><th>Target</th><th>Timeline</th></tr>
<tr><td>1</td><td>[________________]</td><td>[________________]</td><td>[________________]</td><td>[________]</td></tr>
<tr><td>2</td><td>[________________]</td><td>[________________]</td><td>[________________]</td><td>[________]</td></tr>
<tr><td>3</td><td>[________________]</td><td>[________________]</td><td>[________________]</td><td>[________]</td></tr>
</table>

<h2>3. ORGANIZATIONAL STRUCTURE AND RESPONSIBILITIES</h2>

<h3>3.1 Management Representative</h3>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Management Representative Name</td><td>[________________________________________]</td></tr>
<tr><td>Title</td><td>[________________________________________]</td></tr>
<tr><td>Responsibilities</td><td>Ensure QMS processes are established, implemented, and maintained; Report QMS performance to top management; Promote awareness of regulatory requirements</td></tr>
</table>

<h3>3.2 Key Personnel and Responsibilities</h3>
<table>
<tr><th>Role</th><th>Name</th><th>Key Responsibilities</th></tr>
<tr><td>CEO / General Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
<tr><td>Quality Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
<tr><td>Regulatory Affairs Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
<tr><td>Production Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
<tr><td>R&D / Design Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
<tr><td>Purchasing Manager</td><td>[________________]</td><td>[________________________________________]</td></tr>
</table>

<h2>4. QMS PROCESS DESCRIPTIONS (Clauses 4-8)</h2>

<h3>4.1 Quality Management System (Clause 4)</h3>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Procedure Reference</th><th>Responsible</th><th>Documented?</th></tr>
<tr><td>4.1</td><td>General requirements</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4.2.1</td><td>Documentation requirements</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4.2.2</td><td>Quality manual</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4.2.3</td><td>Medical device file</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4.2.4</td><td>Document control</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4.2.5</td><td>Record control</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>4.2 Management Responsibility (Clause 5)</h3>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Procedure Reference</th><th>Responsible</th><th>Documented?</th></tr>
<tr><td>5.1</td><td>Management commitment</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5.2</td><td>Customer focus</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5.3</td><td>Quality policy</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5.4</td><td>Planning</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5.5</td><td>Responsibility and authority</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5.6</td><td>Management review</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>4.3 Resource Management (Clause 6)</h3>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Procedure Reference</th><th>Responsible</th><th>Documented?</th></tr>
<tr><td>6.1</td><td>Provision of resources</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>6.2</td><td>Human resources</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>6.3</td><td>Infrastructure</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>6.4</td><td>Work environment</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>4.4 Product Realization (Clause 7)</h3>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Procedure Reference</th><th>Responsible</th><th>Documented?</th></tr>
<tr><td>7.1</td><td>Planning of product realization</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.2</td><td>Customer requirements</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.3</td><td>Design and development</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.4</td><td>Purchasing</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.5</td><td>Production and service provision</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.5.6</td><td>Validation of processes</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.5.7</td><td>Traceability</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.5.9</td><td>Labeling and packaging</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7.6</td><td>Control of monitoring/measuring equipment</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>4.5 Measurement, Analysis, Improvement (Clause 8)</h3>
<table>
<tr><th style="width:60px;">Clause</th><th>Requirement</th><th>Procedure Reference</th><th>Responsible</th><th>Documented?</th></tr>
<tr><td>8.1</td><td>General</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.2.1</td><td>Feedback</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.2.3</td><td>Reporting to regulatory authorities</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.2.4</td><td>Internal audit</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.2.5</td><td>Monitoring of processes</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.2.6</td><td>Monitoring of product</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.3</td><td>Control of nonconforming product</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.4</td><td>Analysis of data</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>8.5</td><td>Improvement (CAPA)</td><td>[________________]</td><td>[________________]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h2>5. DOCUMENT CONTROL AND RECORDS</h2>
<h3>5.1 Document Control Procedure</h3>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Procedure Reference</td><td>[________________________________________]</td></tr>
<tr><td>Document Approval Authority</td><td>[________________________________________]</td></tr>
<tr><td>Review Frequency</td><td>[________________________________________]</td></tr>
<tr><td>Distribution Method</td><td>☐ Electronic ☐ Paper ☐ Both</td></tr>
<tr><td>Obsolete Document Handling</td><td>[________________________________________]</td></tr>
</table>

<h3>5.2 Record Retention</h3>
<table>
<tr><th>Record Type</th><th>Retention Period</th><th>Storage Location</th><th>Responsible</th></tr>
<tr><td>Quality records</td><td>[________]</td><td>[________________]</td><td>[________________]</td></tr>
<tr><td>Design records (DHF)</td><td>[________]</td><td>[________________]</td><td>[________________]</td></tr>
<tr><td>Production records</td><td>[________]</td><td>[________________]</td><td>[________________]</td></tr>
<tr><td>Customer complaint records</td><td>[________]</td><td>[________________]</td><td>[________________]</td></tr>
<tr><td>Supplier records</td><td>[________]</td><td>[________________]</td><td>[________________]</td></tr>
</table>

<h2>6. MANAGEMENT REVIEW</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Review Frequency</td><td>☐ Annually ☐ Semi-annually ☐ Other: [________]</td></tr>
<tr><td>Chairperson</td><td>[________________________________________]</td></tr>
<tr><td>Participants</td><td>[________________________________________]</td></tr>
</table>

<h3>6.1 Management Review Inputs</h3>
<table>
<tr><th>#</th><th>Input (per ISO 13485 Clause 5.6.2)</th><th>Included</th></tr>
<tr><td>1</td><td>Results of audits</td><td>☐ Yes ☐ No</td></tr>
<tr><td>2</td><td>Customer feedback</td><td>☐ Yes ☐ No</td></tr>
<tr><td>3</td><td>Process performance and product conformity</td><td>☐ Yes ☐ No</td></tr>
<tr><td>4</td><td>Status of preventive and corrective actions</td><td>☐ Yes ☐ No</td></tr>
<tr><td>5</td><td>Follow-up actions from previous management reviews</td><td>☐ Yes ☐ No</td></tr>
<tr><td>6</td><td>Changes that could affect the QMS</td><td>☐ Yes ☐ No</td></tr>
<tr><td>7</td><td>New or revised regulatory requirements</td><td>☐ Yes ☐ No</td></tr>
</table>

<h2>7. APPROVAL</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Prepared By</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Reviewed By</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Approved By (Management Rep.)</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Approved By (CEO / GM)</td><td>[________________]</td><td></td><td></td></tr>
</table>

<hr>
<p><em>This quality manual template was generated by MDLooker PPE Compliance Platform. The organization is responsible for customizing all content to reflect its actual QMS implementation before seeking certification.</em></p>
`
    }

    case 'iso-14971-risk-form': {
      return `
<h1>RISK ASSESSMENT FORM</h1>
<p><strong>Standard:</strong> ISO 14971:2019 - Medical devices - Application of risk management to medical devices</p>
<p><strong>Methodology:</strong> EN ISO 12100:2010 - Safety of machinery, general principles for design</p>
<p><strong>Document Number:</strong> RA-[________]-${new Date().getFullYear()}</p>
<p><strong>Version:</strong> 1.0</p>
<p><strong>Date:</strong> ${date}</p>
<hr>

<h2>1. RISK MANAGEMENT PLAN</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Product Name *</td><td>[________________________________________]</td></tr>
<tr><td>Model / Type *</td><td>[________________________________________]</td></tr>
<tr><td>Risk Management File No. *</td><td>[________________________________________]</td></tr>
<tr><td>Prepared By *</td><td>[________________________________________]</td></tr>
<tr><td>Approved By *</td><td>[________________________________________]</td></tr>
<tr><td>Date *</td><td>${date}</td></tr>
<tr><td>Review Date</td><td>[________________________________________]</td></tr>
<tr><td>Intended Use</td><td>[________________________________________]</td></tr>
<tr><td>Target User Group</td><td>[________________________________________]</td></tr>
</table>

<h2>2. HAZARD IDENTIFICATION TABLE (ISO 14971, Clause 5)</h2>
<p>Identify all known and foreseeable hazards in both normal and fault conditions throughout the product lifecycle.</p>

<h3>2.1 Hazard Categories</h3>
<table>
<tr><th>Category</th><th>Examples for PPE</th><th>Considered?</th></tr>
<tr><td>Energy Hazards</td><td>Electrical, thermal, mechanical, vibration, radiation</td><td>☐ Yes ☐ No</td></tr>
<tr><td>Biological and Chemical Hazards</td><td>Biological contamination, chemical exposure, toxicity</td><td>☐ Yes ☐ No</td></tr>
<tr><td>Performance Hazards</td><td>Inadequate filtration, loss of integrity, degradation</td><td>☐ Yes ☐ No</td></tr>
<tr><td>Usability Hazards</td><td>Poor fit, incorrect donning, limited field of vision</td><td>☐ Yes ☐ No</td></tr>
<tr><td>Information Hazards</td><td>Inadequate labeling, missing warnings, unclear instructions</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>2.2 Hazard Identification Table</h3>
<table>
<tr><th>Hazard ID</th><th>Hazard Description</th><th>Hazardous Situation</th><th>Potential Harm</th><th>Lifecycle Phase</th></tr>
<tr><td>H-001</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-002</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-003</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-004</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-005</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-006</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-007</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
<tr><td>H-008</td><td>[________________________]</td><td>[________________________]</td><td>[________________________]</td><td>[________________]</td></tr>
</table>

<h2>3. RISK ESTIMATION MATRIX (ISO 14971, Clause 6-7)</h2>

<h3>3.1 Severity Scale</h3>
<table>
<tr><th>Level</th><th>Severity</th><th>Description</th></tr>
<tr><td>1</td><td>Negligible</td><td>No injury or minor discomfort, no medical intervention required</td></tr>
<tr><td>2</td><td>Minor</td><td>Temporary discomfort, first aid treatment may be required</td></tr>
<tr><td>3</td><td>Serious</td><td>Injury requiring medical intervention, temporary impairment</td></tr>
<tr><td>4</td><td>Critical</td><td>Major injury, hospitalization, permanent impairment possible</td></tr>
<tr><td>5</td><td>Catastrophic</td><td>Death or permanent life-threatening injury</td></tr>
</table>

<h3>3.2 Probability Scale</h3>
<table>
<tr><th>Level</th><th>Probability</th><th>Description</th></tr>
<tr><td>1</td><td>Remote</td><td>&lt;1 in 100,000 uses</td></tr>
<tr><td>2</td><td>Rare</td><td>1 in 10,000 to 1 in 100,000</td></tr>
<tr><td>3</td><td>Occasional</td><td>1 in 1,000 to 1 in 10,000</td></tr>
<tr><td>4</td><td>Probable</td><td>1 in 100 to 1 in 1,000</td></tr>
<tr><td>5</td><td>Frequent</td><td>&gt;1 in 100</td></tr>
</table>

<h3>3.3 Risk Estimation Matrix</h3>
<table>
<tr><th></th><th colspan="5" style="text-align:center;">PROBABILITY</th></tr>
<tr><th>SEVERITY</th><th>1-Remote</th><th>2-Rare</th><th>3-Occasional</th><th>4-Probable</th><th>5-Frequent</th></tr>
<tr><td>5-Catastrophic</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ff9900;">HIGH</td><td style="background-color:#ff0000;color:white;">HIGH</td><td style="background-color:#ff0000;color:white;">HIGH</td><td style="background-color:#ff0000;color:white;">HIGH</td></tr>
<tr><td>4-Critical</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ff9900;">HIGH</td><td style="background-color:#ff0000;color:white;">HIGH</td><td style="background-color:#ff0000;color:white;">HIGH</td></tr>
<tr><td>3-Serious</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ff9900;">HIGH</td><td style="background-color:#ff9900;">HIGH</td></tr>
<tr><td>2-Minor</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ff9900;">HIGH</td></tr>
<tr><td>1-Negligible</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#00cc00;">LOW</td><td style="background-color:#ffcc00;">MEDIUM</td><td style="background-color:#ffcc00;">MEDIUM</td></tr>
</table>

<h3>3.4 Risk Evaluation Table</h3>
<table>
<tr><th>Hazard ID</th><th>Severity (1-5)</th><th>Probability (1-5)</th><th>Risk Level</th><th>Acceptable?</th></tr>
<tr><td>H-001</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-002</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-003</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-004</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-005</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-006</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-007</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-008</td><td>[____]</td><td>[____]</td><td>[LOW/MEDIUM/HIGH]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h2>4. RISK CONTROL MEASURES (ISO 14971, Clause 8)</h2>

<h3>4.1 Hierarchy of Controls</h3>
<ol>
<li><strong>Inherent safety by design</strong> - Eliminate or reduce risks through design</li>
<li><strong>Protective measures</strong> - Physical guards, barriers, or safety features</li>
<li><strong>Information for safety</strong> - Warnings, instructions, training requirements</li>
</ol>

<h3>4.2 Risk Control Measures Table</h3>
<table>
<tr><th>Hazard ID</th><th>Control Measure</th><th>Control Type</th><th>Implementation</th><th>Verification</th></tr>
<tr><td>H-001</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-002</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-003</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-004</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-005</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-006</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-007</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
<tr><td>H-008</td><td>[________________________]</td><td>☐ Design ☐ Protective ☐ Information</td><td>[________________________]</td><td>[________________________]</td></tr>
</table>

<h2>5. RESIDUAL RISK EVALUATION (ISO 14971, Clause 9)</h2>
<table>
<tr><th>Hazard ID</th><th>Residual Risk Description</th><th>Severity After Control</th><th>Probability After Control</th><th>Residual Risk Level</th><th>Acceptable?</th></tr>
<tr><td>H-001</td><td>[________________]</td><td>[____]</td><td>[____]</td><td>[LOW/MED/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-002</td><td>[________________]</td><td>[____]</td><td>[____]</td><td>[LOW/MED/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-003</td><td>[________________]</td><td>[____]</td><td>[____]</td><td>[LOW/MED/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-004</td><td>[________________]</td><td>[____]</td><td>[____]</td><td>[LOW/MED/HIGH]</td><td>☐ Yes ☐ No</td></tr>
<tr><td>H-005</td><td>[________________]</td><td>[____]</td><td>[____]</td><td>[LOW/MED/HIGH]</td><td>☐ Yes ☐ No</td></tr>
</table>

<h3>5.1 Benefit-Risk Analysis (ISO 14971, Clause 10)</h3>
<p>For residual risks that are not broadly acceptable:</p>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Hazard IDs Requiring Benefit-Risk Analysis</td><td>[________________________________________]</td></tr>
<tr><td>Benefits of the Device</td><td>[________________________________________]</td></tr>
<tr><td>Residual Risks</td><td>[________________________________________]</td></tr>
<tr><td>Are Benefits Outweigh Risks?</td><td>☐ Yes ☐ No</td></tr>
<tr><td>Justification</td><td>[________________________________________]</td></tr>
</table>

<h3>5.2 Overall Residual Risk Evaluation (ISO 14971, Clause 11)</h3>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Overall Residual Risk Level</td><td>☐ Low ☐ Medium ☐ High</td></tr>
<tr><td>Overall Acceptability</td><td>☐ Acceptable ☐ Not Acceptable</td></tr>
<tr><td>Justification</td><td>[________________________________________]</td></tr>
</table>

<h2>6. RISK MANAGEMENT REVIEW AND APPROVAL</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Risk Manager</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Quality Manager</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Regulatory Affairs</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>General Manager</td><td>[________________]</td><td></td><td></td></tr>
</table>

<hr>
<p><em>This risk assessment form was generated by MDLooker PPE Compliance Platform per ISO 14971:2019. The organization is responsible for completing all hazard identification, risk estimation, and risk control documentation before using this form for regulatory submissions.</em></p>
`
    }

    case 'eu-ppe-annex-iii-checklist': {
      return `
<h1>TECHNICAL DOCUMENTATION CHECKLIST</h1>
<p><strong>Regulation:</strong> Regulation (EU) 2016/425 on Personal Protective Equipment</p>
<p><strong>Annex Reference:</strong> Annex III - Technical documentation</p>
<p><strong>Document Number:</strong> TD-CL-[________]-${new Date().getFullYear()}</p>
<p><strong>Date:</strong> ${date}</p>
<hr>

<h2>PRODUCT IDENTIFICATION</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Product Name *</td><td>[________________________________________]</td></tr>
<tr><td>Product Code / Model *</td><td>[________________________________________]</td></tr>
<tr><td>PPE Category *</td><td>☐ Category I &nbsp;&nbsp; ☐ Category II &nbsp;&nbsp; ☐ Category III</td></tr>
<tr><td>Manufacturer Name *</td><td>[________________________________________]</td></tr>
<tr><td>Notified Body (if applicable)</td><td>[________________________________________]</td></tr>
<tr><td>Checklist Completed By</td><td>[________________________________________]</td></tr>
<tr><td>Date Completed</td><td>${date}</td></tr>
</table>

<h2>SECTION 1: GENERAL PRODUCT DESCRIPTION (Annex III, Section 1(a))</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>1.1</td><td>General description of the product including intended use, user groups, and use environment</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>1.2</td><td>All product variants and accessories listed</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>1.3</td><td>PPE category and risk classification documented</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>1.4</td><td>Product photos and/or illustrations included</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>1.5</td><td>Intended use and foreseeable misuse described</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>1.6</td><td>Target user population identified</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 2: DESIGN AND MANUFACTURING DATA (Annex III, Section 1(b))</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>2.1</td><td>Technical drawings and design specifications</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.2</td><td>Dimensions, tolerances, and weight specifications</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.3</td><td>Materials specification (all materials in contact with user)</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.4</td><td>Colour coding and sizing information</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.5</td><td>Manufacturing process description and flow chart</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.6</td><td>Quality control points in manufacturing process</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.7</td><td>Traceability system documentation</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>2.8</td><td>Sub-assembly and component specifications</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 3: RISK ASSESSMENT (Annex III, Section 1(c))</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>3.1</td><td>Risk assessment per EN ISO 12100 completed</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>3.2</td><td>Hazard identification table complete</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>3.3</td><td>Risk estimation and evaluation documented</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>3.4</td><td>Risk control measures implemented and verified</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>3.5</td><td>Residual risk evaluation completed</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>3.6</td><td>Benefit-risk analysis for non-acceptable residual risks</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
<tr><td>3.7</td><td>Overall residual risk acceptability determined</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 4: ESSENTIAL HEALTH AND SAFETY REQUIREMENTS (Annex II)</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>4.1</td><td>EHSR checklist covering all applicable requirements from Annex II</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>4.2</td><td>Section 1 - General requirements (ergonomics, innocuousness, comfort)</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>4.3</td><td>Section 2 - Additional requirements common to several classes</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>4.4</td><td>Section 3 - Additional requirements specific to particular risks</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>4.5</td><td>Justification for non-applicable EHSRs provided</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
<tr><td>4.6</td><td>Cross-references to supporting evidence (test reports, design data)</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 5: TEST REPORTS AND VERIFICATION (Annex III, Section 1(d))</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>5.1</td><td>Test reports from ISO 17025 accredited laboratory</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.2</td><td>Laboratory accreditation details documented</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.3</td><td>All applicable harmonized standards tested</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.4</td><td>Test results meet acceptance criteria</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.5</td><td>Raw test data included where required</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.6</td><td>All product variants covered by testing</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>5.7</td><td>Biocompatibility assessment (ISO 10993) included</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 6: QUALITY ASSURANCE AND PRODUCTION CONTROL</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>6.1</td><td>Quality management system documentation</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>6.2</td><td>Production process flow chart</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>6.3</td><td>Incoming, in-process, and final inspection procedures</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>6.4</td><td>Batch release procedures</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>6.5</td><td>Non-conforming product handling procedures</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>6.6</td><td>ISO 9001 / ISO 13485 certification (if applicable)</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 7: LABELING AND USER INFORMATION</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>7.1</td><td>CE marking affixed (min 5mm height)</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>7.2</td><td>Notified Body number included (Cat II/III)</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
<tr><td>7.3</td><td>Product labeling complete per applicable standard</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>7.4</td><td>User instructions provided in language of member state</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>7.5</td><td>Instructions include: intended use, fitting, maintenance, storage, disposal</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>7.6</td><td>Warnings and precautions documented</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>SECTION 8: EU DECLARATION OF CONFORMITY (Annex VI)</h2>
<table>
<tr><th style="width:40px;">#</th><th>Required Item</th><th>Present</th><th>Document Reference</th><th>Notes</th></tr>
<tr><td>8.1</td><td>EU DoC prepared per Annex VI</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>8.2</td><td>Manufacturer details included</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>8.3</td><td>Product identification complete</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>8.4</td><td>All applicable harmonized standards listed</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
<tr><td>8.5</td><td>Notified Body details included (Cat II/III)</td><td>☐ Yes ☐ No ☐ N/A</td><td>[________________]</td><td></td></tr>
<tr><td>8.6</td><td>DoC signed by authorized person</td><td>☐ Yes ☐ No</td><td>[________________]</td><td></td></tr>
</table>

<h2>COMPLETION SUMMARY</h2>
<table>
<tr><th style="width:280px;">Field</th><th>Content</th></tr>
<tr><td>Total Checklist Items</td><td>[________]</td></tr>
<tr><td>Items Present / Compliant</td><td>[________]</td></tr>
<tr><td>Items Missing / Non-Compliant</td><td>[________]</td></tr>
<tr><td>Items Not Applicable</td><td>[________]</td></tr>
<tr><td>Compliance Percentage</td><td>[________]%</td></tr>
<tr><td>Overall Assessment</td><td>☐ Complete - Ready for submission ☐ Incomplete - Action required</td></tr>
</table>

<h2>ACTION ITEMS</h2>
<table>
<tr><th>#</th><th>Missing / Non-Compliant Item</th><th>Responsible Person</th><th>Target Date</th><th>Status</th></tr>
<tr><td>1</td><td>[________________________]</td><td>[________________]</td><td>[________]</td><td>☐ Open ☐ Closed</td></tr>
<tr><td>2</td><td>[________________________]</td><td>[________________]</td><td>[________]</td><td>☐ Open ☐ Closed</td></tr>
<tr><td>3</td><td>[________________________]</td><td>[________________]</td><td>[________]</td><td>☐ Open ☐ Closed</td></tr>
</table>

<h2>APPROVAL</h2>
<table>
<tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
<tr><td>Prepared By</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Reviewed By (Quality Manager)</td><td>[________________]</td><td></td><td></td></tr>
<tr><td>Approved By (Regulatory Affairs)</td><td>[________________]</td><td></td><td></td></tr>
</table>

<hr>
<p><em>This checklist was generated by MDLooker PPE Compliance Platform per Annex III of Regulation (EU) 2016/425. The manufacturer is responsible for ensuring all technical documentation is complete before placing the product on the EU market.</em></p>
`
    }

    default: {
      return `
<h1>${docTitle}</h1>
<p>${docDescription}</p>
<p><strong>Generated Date:</strong> ${date}</p>
<hr>
<h2>Document Content</h2>
<p>This document template provides a structured framework for your compliance documentation. Please customize the content according to your specific product and regulatory requirements.</p>
<h2>General Information</h2>
<table>
<tr><th style="width:200px;">Field</th><th>Content</th></tr>
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
`
    }
  }
}

export default function DocumentsPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [expandedGuideSections, setExpandedGuideSections] = useState<Record<number, boolean>>({})

  // Auth state - read from localStorage membership
  const [membership, setMembership] = useState<MembershipTier>('free')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
    const tier = getUserMembership()
    setMembership(tier)
    setIsLoggedIn(tier !== 'free' || !!localStorage.getItem('user'))
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

      const date = new Date().toISOString().split('T')[0]
      const year = new Date().getFullYear()
      const docIdRef = `${docId.toUpperCase()}-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Generate document-specific content
      const bodyContent = generateDocumentContent(docId, docTitle, doc.description, date)

      // Generate Word-compatible HTML content
      const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${doc.title}</title>
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
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 9pt; text-align: center; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
</style>
</head>
<body>
<div class="header">
  <h1>MDLooker</h1>
  <p>PPE Compliance Platform</p>
</div>
${bodyContent}
<div class="footer">
<p>Generated by MDLooker PPE Compliance Platform | ${date}</p>
<p><em>Document: ${doc.title} | ID: ${docIdRef} | Market: ${doc.market} | Format: ${doc.format}</em></p>
<p><em>This document is confidential and proprietary. Unauthorized distribution is prohibited.</em></p>
</div>
</body>
</html>`

      // Create blob with Word-compatible MIME type
      const blob = new Blob([htmlContent], { type: 'application/msword' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '')}_${date}.doc`
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
              {t.documentTemplates}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.documentTemplatesSubtitle}
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
                        {canAccessFeature('download') ? (
                          <button
                            onClick={() => handleDownload(doc.id, doc.title)}
                            className="w-full py-2.5 bg-[#339999] text-white font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        ) : isLoggedIn ? (
                          <div className="space-y-2">
                            <button
                              disabled
                              className="w-full py-2.5 bg-gray-200 text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <p className="text-xs text-center text-amber-600">
                              Requires {getMembershipName('professional')} or higher
                            </p>
                          </div>
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
              {!canAccessFeature('generate') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {!isLoggedIn ? 'Sign in Required' : 'Upgrade Required'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {!isLoggedIn
                          ? 'You need to be signed in to generate custom compliance documents. Sign in to access the full document generator with all templates.'
                          : `Your current plan (${getMembershipName(membership)}) does not include document generation. Upgrade to Professional or Enterprise to generate custom compliance documents.`
                        }
                      </p>
                      {!isLoggedIn ? (
                        <Link
                          href="/auth/login"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign in to Continue
                        </Link>
                      ) : (
                        <Link
                          href="/pricing"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#339999] text-white text-sm font-medium rounded-lg hover:bg-[#2d8b8b] transition-colors"
                        >
                          View Pricing Plans
                        </Link>
                      )}
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
                      disabled={!canAccessFeature('generate')}
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
                      disabled={!canAccessFeature('generate')}
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
                                    disabled={!canAccessFeature('generate')}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end">
                            {canAccessFeature('generate') ? (
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
                            ) : isLoggedIn ? (
                              <Link
                                href="/pricing"
                                className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-all flex items-center gap-2"
                              >
                                Upgrade to Generate
                              </Link>
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
