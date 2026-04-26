'use client'

import { useState } from 'react'
import { FileText, Download, CheckCircle2, ChevronRight, ChevronDown, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'

interface DocumentTemplate {
  id: string
  name: string
  description: string
  required: boolean
  category: 'technical' | 'regulatory' | 'quality' | 'labeling'
  sections: string[]
}

const DOCUMENT_TEMPLATES: Record<string, Record<string, DocumentTemplate[]>> = {
  'respiratory-protection': {
    'EU': [
      { id: 'tech-file', name: 'Technical File (EU 2016/425)', description: 'Complete technical documentation per Annex III', required: true, category: 'technical', sections: ['Product Description', 'Risk Assessment', 'Standards Compliance', 'Test Reports', 'Manufacturing Process', 'Quality Control', 'Labeling & Instructions'] },
      { id: 'doc', name: 'EU Declaration of Conformity', description: 'Formal DoC per Annex VI', required: true, category: 'regulatory', sections: ['Manufacturer Details', 'Product Identification', 'Conformity Assessment', 'Applicable Standards', 'Notified Body', 'Signature & Date'] },
      { id: 'risk-assessment', name: 'Risk Assessment Report', description: 'Per ISO 14971 and EN ISO 12100', required: true, category: 'technical', sections: ['Hazard Identification', 'Risk Estimation', 'Risk Evaluation', 'Risk Control Measures', 'Residual Risk Assessment'] },
      { id: 'user-instructions', name: 'User Instructions', description: 'Multi-language instructions per Annex II', required: true, category: 'labeling', sections: ['Intended Use', 'Fitting Instructions', 'Limitations', 'Maintenance', 'Storage', 'Disposal'] },
      { id: 'qms', name: 'Quality Management System', description: 'Module D/C2 quality system documentation', required: true, category: 'quality', sections: ['Quality Policy', 'Process Control', 'Inspection Procedures', 'Non-conformance Handling', 'Corrective Actions', 'Management Review'] },
    ],
    'US': [
      { id: '510k-summary', name: '510(k) Summary', description: 'Premarket notification summary', required: true, category: 'regulatory', sections: ['Submitter Information', 'Device Description', 'Predicate Device', 'Substantial Equivalence', 'Performance Data', 'Conclusion'] },
      { id: 'design-control', name: 'Design Control Documentation', description: 'Per 21 CFR 820.30', required: true, category: 'technical', sections: ['Design Input', 'Design Output', 'Design Review', 'Design Verification', 'Design Validation', 'Design Transfer', 'Design Changes'] },
      { id: 'labeling-us', name: 'US Labeling Compliance', description: 'FDA labeling requirements', required: true, category: 'labeling', sections: ['Device Label', 'Package Insert', 'UDI Requirements', 'eMDR Information', 'Contact Information'] },
      { id: 'qsr', name: 'Quality System Regulation (QSR)', description: '21 CFR Part 820 compliance', required: true, category: 'quality', sections: ['Management Responsibility', 'Quality Planning', 'Process Controls', 'Acceptance Activities', 'CAPA', 'Document Controls'] },
    ],
  },
  'safety-footwear': {
    'EU': [
      { id: 'tech-file', name: 'Technical File', description: 'Complete technical documentation', required: true, category: 'technical', sections: ['Product Description', 'Risk Assessment', 'EN ISO 20345 Compliance', 'Test Reports', 'Sole Construction', 'Upper Materials', 'Labeling'] },
      { id: 'doc', name: 'EU Declaration of Conformity', description: 'Formal DoC', required: true, category: 'regulatory', sections: ['Manufacturer Details', 'Product Identification', 'Conformity Assessment', 'Applicable Standards', 'Notified Body'] },
      { id: 'risk-assessment', name: 'Risk Assessment Report', description: 'Per EN ISO 12100', required: true, category: 'technical', sections: ['Hazard Identification', 'Risk Estimation', 'Risk Evaluation', 'Control Measures'] },
      { id: 'user-instructions', name: 'User Instructions', description: 'Multi-language instructions', required: true, category: 'labeling', sections: ['Intended Use', 'Fitting Guide', 'Limitations', 'Care Instructions'] },
    ],
    'US': [
      { id: 'astm-compliance', name: 'ASTM F2413 Compliance Report', description: 'Standard specification for foot protection', required: true, category: 'technical', sections: ['Impact Resistance', 'Compression Resistance', 'Metatarsal Protection', 'Puncture Resistance', 'Electrical Hazard', 'Static Dissipative'] },
      { id: 'osha-doc', name: 'OSHA Compliance Documentation', description: '29 CFR 1910.136 compliance', required: true, category: 'regulatory', sections: ['Selection Criteria', 'Training Requirements', 'Hazard Assessment', 'Documentation'] },
    ],
  },
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  { id: 'tech-file', name: 'Technical File', description: 'General technical documentation', required: true, category: 'technical', sections: ['Product Description', 'Risk Assessment', 'Standards Compliance', 'Test Reports'] },
  { id: 'doc', name: 'Declaration of Conformity', description: 'Formal declaration', required: true, category: 'regulatory', sections: ['Manufacturer Details', 'Product Identification', 'Conformity Assessment'] },
  { id: 'risk-assessment', name: 'Risk Assessment', description: 'Hazard analysis', required: true, category: 'technical', sections: ['Hazard Identification', 'Risk Evaluation', 'Control Measures'] },
]

export default function DocumentGeneratorPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [productName, setProductName] = useState('')
  const [manufacturerName, setManufacturerName] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedDocs, setGeneratedDocs] = useState<Set<string>>(new Set())
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const templates = (selectedCategory && selectedMarket)
    ? DOCUMENT_TEMPLATES[selectedCategory]?.[selectedMarket] || DEFAULT_TEMPLATES
    : DEFAULT_TEMPLATES

  const handleGenerate = async (template: DocumentTemplate) => {
    setGenerating(template.id)
    
    await new Promise(resolve => setTimeout(resolve, 1500))

    const content = generateDocumentContent(template, productName, manufacturerName, selectedCategory, selectedMarket)
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.id}-${selectedCategory}-${selectedMarket}.md`
    a.click()
    URL.revokeObjectURL(url)

    setGeneratedDocs(prev => new Set(prev).add(template.id))
    setGenerating(null)
  }

  const handleGenerateAll = async () => {
    for (const template of templates) {
      await handleGenerate(template)
    }
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
              Auto-generate compliance documentation templates based on your product and target market
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., N95 Respirator Model XR-500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer Name *</label>
                <input
                  type="text"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  placeholder="e.g., SafeGuard PPE Co., Ltd."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Category *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
                  onChange={(e) => setSelectedMarket(e.target.value)}
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

          {/* Template List */}
          {selectedCategory && selectedMarket && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Required Documents</h2>
                <button
                  onClick={handleGenerateAll}
                  disabled={generating !== null}
                  className="px-6 py-3 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate All
                </button>
              </div>

              <div className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div 
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedDoc(expandedDoc === template.id ? null : template.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          template.category === 'technical' ? 'bg-blue-100 text-blue-600' :
                          template.category === 'regulatory' ? 'bg-purple-100 text-purple-600' :
                          template.category === 'quality' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            {template.required && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
                            )}
                            {generatedDocs.has(template.id) && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerate(template) }}
                          disabled={generating === template.id}
                          className="px-4 py-2 bg-[#339999]/10 text-[#339999] rounded-lg hover:bg-[#339999]/20 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                        >
                          {generating === template.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {generating === template.id ? 'Generating...' : 'Generate'}
                        </button>
                        {expandedDoc === template.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {expandedDoc === template.id && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Document Sections:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {template.sections.map(section => (
                            <div key={section} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-[#339999]" />
                              {section}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

function generateDocumentContent(
  template: DocumentTemplate,
  productName: string,
  manufacturerName: string,
  category: string,
  market: string
): string {
  const categoryInfo: Record<string, string> = {
    'respiratory-protection': 'Respiratory Protection',
    'safety-footwear': 'Safety Footwear',
    'safety-gloves': 'Safety Gloves',
    'head-protection': 'Head Protection',
    'protective-clothing': 'Protective Clothing',
    'eye-protection': 'Eye Protection',
  }

  const marketInfo: Record<string, string> = {
    'EU': 'European Union',
    'US': 'United States',
    'UK': 'United Kingdom',
    'CN': 'China',
    'JP': 'Japan',
  }

  const date = new Date().toISOString().split('T')[0]

  return `# ${template.name}

**Generated by MDLooker PPE Compliance Platform**
**Date:** ${date}
**Product:** ${productName || '[Product Name]'}
**Manufacturer:** ${manufacturerName || '[Manufacturer Name]'}
**Category:** ${categoryInfo[category] || category}
**Target Market:** ${marketInfo[market] || market}

---

${template.sections.map((section, index) => `
## ${index + 1}. ${section}

[Enter ${section.toLowerCase()} information here]

### Requirements
- [Item 1]
- [Item 2]
- [Item 3]

### Notes
- Add relevant documentation references
- Include test reports and evidence
- Reference applicable standards

`).join('---\n')}
---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${date} | ${manufacturerName || '[Author]'} | Initial draft |

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | | | |
| Reviewed by | | | |
| Approved by | | | |

---
*This document was auto-generated by MDLooker PPE Compliance Platform. Please review and customize all sections before submission.*
`
}
