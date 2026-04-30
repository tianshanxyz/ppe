'use client'

import { useState } from 'react'
import { FileText, Download, CheckCircle2, ChevronRight, ChevronDown, Sparkles, Loader2, AlertCircle, Building, Package, Globe } from 'lucide-react'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

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

export default function DocumentGeneratorPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const templates = (selectedCategory && selectedMarket)
    ? DOCUMENT_TEMPLATES[selectedCategory]?.[selectedMarket] || []
    : []

  const handleFieldChange = (fieldLabel: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }))
  }

  const handleGenerate = async (template: any) => {
    setGenerating(template.id)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const content = generateOfficialDocument(template, formData, selectedCategory, selectedMarket)

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.id}_${selectedCategory}_${selectedMarket}_${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setGenerating(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <FileText className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Document Generator</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Generate standardized compliance documents that meet official government submission requirements
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step 1: Select Product and Market */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center text-sm">1</span>
              Select Product Category & Target Market
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Category *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setFormData({}) }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
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
                  value={selectedMarket}
                  onChange={(e) => { setSelectedMarket(e.target.value); setFormData({}) }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
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
                          {template.fields.map((field: any, idx: number) => (
                            <div key={idx} className={field.required ? '' : 'md:col-span-2'}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <input
                                type="text"
                                value={formData[field.label] || ''}
                                onChange={(e) => handleFieldChange(field.label, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
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
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!selectedCategory || !selectedMarket ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Please select a product category and target market to see available document templates</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function generateOfficialDocument(template: any, formData: Record<string, string>, category: string, market: string): string {
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

  // Build filled fields section
  const filledFields = template.fields.map((field: any) => {
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
${template.fields.map((f: any) => `- **${f.label}**: ${formData[f.label] || '[To be completed]'}`).join('\n')}

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
