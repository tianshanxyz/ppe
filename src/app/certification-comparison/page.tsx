'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Scale, FileText, Clock, DollarSign, BadgeCheck, Globe, ArrowRight, Info, ExternalLink, CheckCircle2, Download, Table2, BarChart3, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'
import { PPEIcon } from '@/components/ppe/PPEIcons'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface CertificationData {
  market: string
  name: string
  classification: string
  timeline: { min: number; max: number; unit: string }
  cost: { min: number; max: number; currency: string }
  requirements: string[]
  documents: string[]
  warnings: string[]
}

export default function CertificationComparisonPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showExport, setShowExport] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  // 获取主要市场的认证对比数据
  const comparisonData = useMemo(() => {
    if (!selectedCategory) return null

    const certifications: CertificationData[] = []

    // 获取欧盟 CE 认证数据
    const euData = getComplianceData(selectedCategory, 'EU')
    if (euData) {
      certifications.push({
        market: 'EU',
        name: 'CE Marking',
        classification: euData.classification,
        timeline: euData.estimated_timeline,
        cost: euData.estimated_cost,
        requirements: euData.certification_requirements,
        documents: euData.customs_documents,
        warnings: euData.risk_warnings,
      })
    }

    // 获取美国 FDA 认证数据
    const usData = getComplianceData(selectedCategory, 'US')
    if (usData) {
      certifications.push({
        market: 'US',
        name: 'FDA Certification',
        classification: usData.classification,
        timeline: usData.estimated_timeline,
        cost: usData.estimated_cost,
        requirements: usData.certification_requirements,
        documents: usData.customs_documents,
        warnings: usData.risk_warnings,
      })
    }

    // 获取英国 UKCA 认证数据
    const ukData = getComplianceData(selectedCategory, 'UK')
    if (ukData) {
      certifications.push({
        market: 'UK',
        name: 'UKCA Marking',
        classification: ukData.classification,
        timeline: ukData.estimated_timeline,
        cost: ukData.estimated_cost,
        requirements: ukData.certification_requirements,
        documents: ukData.customs_documents,
        warnings: ukData.risk_warnings,
      })
    }

    // 获取中国 NMPA 认证数据
    const cnData = getComplianceData(selectedCategory, 'CN')
    if (cnData) {
      certifications.push({
        market: 'CN',
        name: 'NMPA Registration',
        classification: cnData.classification,
        timeline: cnData.estimated_timeline,
        cost: cnData.estimated_cost,
        requirements: cnData.certification_requirements,
        documents: cnData.customs_documents,
        warnings: cnData.risk_warnings,
      })
    }

    return certifications
  }, [selectedCategory])

  // 获取特定市场的文档模板
  const getMarketTemplates = (marketCode: string) => {
    const templateMap: Record<string, Array<{id: string, title: string, desc: string}>> = {
      'EU': [
        { id: 'ce-technical-file', title: 'CE Technical File Template', desc: 'Complete technical documentation package' },
        { id: 'ce-doc', title: 'EU Declaration of Conformity', desc: 'Official DoC template for PPE' },
        { id: 'ce-test-report', title: 'Test Report Template', desc: 'Standardized test documentation' },
      ],
      'US': [
        { id: 'fda-510k-cover', title: 'FDA 510(k) Cover Letter', desc: 'Professional submission cover letter' },
        { id: 'fda-substantial-equiv', title: 'Substantial Equivalence Table', desc: 'Comparison with predicate device' },
        { id: 'fda-labeling', title: 'FDA Labeling Template', desc: 'Compliant labeling and IFU' },
      ],
      'UK': [
        { id: 'ukca-technical-file', title: 'UKCA Technical File', desc: 'UK-specific technical documentation' },
        { id: 'ukca-doc', title: 'UK Declaration of Conformity', desc: 'UKCA DoC template' },
        { id: 'ukca-test-report', title: 'UKCA Test Report', desc: 'UK Approved Body accepted tests' },
      ],
      'CN': [
        { id: 'nmpa-registration', title: 'NMPA Registration Application', desc: 'China registration template' },
        { id: 'nmpa-technical', title: 'NMPA Technical Requirements', desc: 'Product technical documentation' },
        { id: 'nmpa-clinical', title: 'Clinical Evaluation Report', desc: 'NMPA-compliant CER template' },
      ],
    }
    return templateMap[marketCode] || []
  }

  // 获取特定市场的专业解读
  const getMarketProfessionalGuidance = (marketCode: string) => {
    const guidanceMap: Record<string, { title: string, content: string[], keyPoints: string[] }> = {
      'EU': {
        title: 'EU CE Marking Professional Interpretation',
        content: [
          'The CE marking indicates conformity with health, safety, and environmental protection requirements',
          'For PPE, Regulation (EU) 2016/425 sets the framework for market access',
          'Category III products require mandatory third-party testing by a Notified Body',
          'Technical documentation must be maintained for 10 years after last product placement',
        ],
        keyPoints: [
          'Classification determines the conformity assessment route',
          'Notified Body involvement scales with risk level',
          'Post-market surveillance is mandatory',
          'Labeling must include manufacturer, product ID, and CE mark',
        ],
      },
      'US': {
        title: 'FDA 510(k) Professional Interpretation',
        content: [
          '510(k) is a pre-market submission demonstrating substantial equivalence to a predicate device',
          'FDA reviews device classification, intended use, and technological characteristics',
          'Class II devices typically require 510(k); Class III may require PMA',
          'FDA may issue Additional Information (AI) requests during review',
        ],
        keyPoints: [
          'Predicate device must be legally marketed in the US',
          'Indications for use must match or not exceed predicate scope',
          'Performance data requirements depend on device classification',
          'User fees apply; review timeline is typically 90 days',
        ],
      },
      'UK': {
        title: 'UKCA Marking Professional Interpretation',
        content: [
          'UKCA marking is required for products placed on the Great Britain market',
          'UKCA does not automatically replace CE marking for existing certificates',
          'UK Approved Bodies are separate from EU Notified Bodies',
          'Northern Ireland follows different rules under the Windsor Framework',
        ],
        keyPoints: [
          'BSI or other UKAS-accredited bodies can issue UKCA certificates',
          'Technical documentation requirements mirror EU requirements',
          'UKCA marking is not accepted in EU member states',
          'Transition period has ended; full UKCA requirements now apply',
        ],
      },
      'CN': {
        title: 'NMPA Registration Professional Interpretation',
        content: [
          'NMPA (National Medical Products Administration) regulates medical devices in China',
          'Registration certificates are valid for 5 years with annual self-inspection reports',
          'CNCA-approved testing laboratories must conduct product testing',
          'Factory inspections may be required for certain product categories',
        ],
        keyPoints: [
          'Product classification follows the National Medical Device Catalog',
          'Chinese language documentation is mandatory',
          'Local representative or importer is required for foreign manufacturers',
          'Quality Management System certification is typically required',
        ],
      },
    }
    return guidanceMap[marketCode] || { title: '', content: [], keyPoints: [] }
  }

  const category = categories.find(c => c.id === selectedCategory)

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Exporting comparison as ${format.toUpperCase()}...\n\nNote: This is a demo. In production, this would generate and download the actual file.`)
    setShowExport(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section 
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Scale className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Multi-Market Comparison
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Side-by-side comparison of CE, FDA, UKCA, and NMPA certification requirements
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Selection Form */}
      <motion.section 
        className="py-12"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Product Category to Compare
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  PPE Product Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <PPEIcon categoryId={cat.id} size={32} className="mr-3" />
                        <div>
                          <div className="font-semibold text-gray-900">{cat.name}</div>
                          <div className="text-sm text-gray-500">{cat.name_zh}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.section>

      {/* Comparison Results */}
      {comparisonData && comparisonData.length > 0 && (
        <motion.section 
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with controls */}
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-8" variants={fadeInUp}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-6">
                    {category && <PPEIcon categoryId={category.id} size={48} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category?.name} - Market Comparison
                    </h2>
                    <p className="text-gray-600">{category?.name_zh}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'table'
                          ? 'bg-white text-[#339999] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Table2 className="w-4 h-4 inline mr-1" />
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'cards'
                          ? 'bg-white text-[#339999] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Cards
                    </button>
                  </div>
                  {/* Export Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    {showExport && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                        <button
                          onClick={() => handleExport('pdf')}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-red-500" />
                          Export as PDF
                        </button>
                        <button
                          onClick={() => handleExport('excel')}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-green-500" />
                          Export as Excel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#339999]/5 to-[#339999]/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Comparison Item
                        </th>
                        {comparisonData.map((cert) => (
                          <th key={cert.market} className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-4xl mb-2">
                                {cert.market === 'EU' && '\u{1F1EA}\u{1F1FA}'}
                                {cert.market === 'US' && '\u{1F1FA}\u{1F1F8}'}
                                {cert.market === 'UK' && '\u{1F1EC}\u{1F1E7}'}
                                {cert.market === 'CN' && '\u{1F1E8}\u{1F1F3}'}
                              </div>
                              <div className="font-bold text-[#339999]">
                                {cert.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {cert.market}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Classification */}
                      <tr className="bg-white hover:bg-[#339999]/5 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Risk Classification
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#339999]/10 text-[#339999]">
                              {cert.classification}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Timeline */}
                      <tr className="bg-gray-50 hover:bg-[#339999]/10 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-[#339999]" />
                            Timeline
                          </div>
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <div className="text-sm font-semibold text-[#339999]">
                              {cert.timeline.min}-{cert.timeline.max} {cert.timeline.unit}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Cost */}
                      <tr className="bg-white hover:bg-[#339999]/5 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-[#339999]" />
                            Estimated Cost
                          </div>
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <div className="text-sm font-semibold text-[#339999]">
                              ${cert.cost.min.toLocaleString()} - ${cert.cost.max.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {cert.cost.currency}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Requirements Count */}
                      <tr className="bg-gray-50 hover:bg-[#339999]/10 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-[#339999]" />
                            Requirements
                          </div>
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <div className="text-sm font-semibold text-[#339999]">
                              {cert.requirements.length} items
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Documents Count */}
                      <tr className="bg-white hover:bg-[#339999]/5 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-[#339999]" />
                            Documents
                          </div>
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <div className="text-sm font-semibold text-[#339999]">
                              {cert.documents.length} items
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Difficulty Level */}
                      <tr className="bg-gray-50 hover:bg-[#339999]/10 transition-colors">
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-[#339999]" />
                            Difficulty Level
                          </div>
                        </td>
                        {comparisonData.map((cert) => (
                          <td key={cert.market} className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-3 h-3 rounded-full ${
                                    level <= (cert.market === 'US' ? 4 : cert.market === 'CN' ? 5 : 3)
                                      ? 'bg-[#339999]'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {cert.market === 'US' ? 'High' : cert.market === 'CN' ? 'Very High' : 'Medium'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {comparisonData.map((cert) => (
                  <div
                    key={cert.market}
                    className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
                  >
                    <div className="flex items-center mb-6">
                      <div className="text-4xl mr-4">
                        {cert.market === 'EU' && '\u{1F1EA}\u{1F1FA}'}
                        {cert.market === 'US' && '\u{1F1FA}\u{1F1F8}'}
                        {cert.market === 'UK' && '\u{1F1EC}\u{1F1E7}'}
                        {cert.market === 'CN' && '\u{1F1E8}\u{1F1F3}'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{cert.name}</h3>
                        <p className="text-sm text-gray-500">{cert.market}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#339999]/5 rounded-lg">
                        <span className="text-sm text-gray-600">Classification</span>
                        <span className="text-sm font-semibold text-[#339999]">{cert.classification}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Timeline</span>
                        <span className="text-sm font-semibold text-gray-900">{cert.timeline.min}-{cert.timeline.max} {cert.timeline.unit}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#339999]/5 rounded-lg">
                        <span className="text-sm text-gray-600">Cost</span>
                        <span className="text-sm font-semibold text-[#339999]">${cert.cost.min.toLocaleString()} - ${cert.cost.max.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Requirements</span>
                        <span className="text-sm font-semibold text-gray-900">{cert.requirements.length} items</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#339999]/5 rounded-lg">
                        <span className="text-sm text-gray-600">Documents</span>
                        <span className="text-sm font-semibold text-[#339999]">{cert.documents.length} items</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Requirements */}
            {comparisonData.map((cert, index) => (
              <motion.div
                key={cert.market}
                className="bg-white rounded-2xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-shadow"
                variants={fadeInUp}
                custom={index}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  {cert.market === 'EU' && '🇪🇺'}
                  {cert.market === 'US' && '🇺🇸'}
                  {cert.market === 'UK' && '🇬🇧'}
                  {cert.market === 'CN' && '🇨🇳'}
                  <span className="ml-3">{cert.name} Requirements</span>
                </h3>

                {/* Certification Requirements */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BadgeCheck className="w-5 h-5 text-[#339999] mr-2" />
                    Certification Requirements
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cert.requirements.map((req, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start p-4 bg-[#339999]/5 rounded-xl hover:bg-[#339999]/10 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#339999] mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Customs Documents */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-[#339999] mr-2" />
                    Required Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cert.documents.map((doc, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center p-4 bg-[#339999]/5 rounded-xl hover:bg-[#339999]/10 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-[#339999] mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{doc}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Risk Warnings */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                    Important Warnings
                  </h4>
                  <ul className="space-y-3">
                    {cert.warnings.map((warning, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{warning}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Professional Guidance */}
                {(() => {
                  const guidance = getMarketProfessionalGuidance(cert.market)
                  if (!guidance.title) return null
                  return (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 text-[#339999] mr-2" />
                        Professional Interpretation
                      </h4>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h5 className="font-semibold text-gray-900 mb-3">{guidance.title}</h5>
                        <ul className="space-y-2 mb-4">
                          {guidance.content.map((item, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="bg-white/60 rounded-lg p-4">
                          <h6 className="font-semibold text-gray-900 mb-2 text-sm">Key Points:</h6>
                          <div className="flex flex-wrap gap-2">
                            {guidance.keyPoints.map((point, idx) => (
                              <span key={idx} className="px-3 py-1 bg-[#339999]/10 text-[#339999] text-xs rounded-full">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Document Templates */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Download className="w-5 h-5 text-[#339999] mr-2" />
                    Standardized Document Templates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getMarketTemplates(cert.market).map((template, idx) => (
                      <motion.a
                        key={template.id}
                        href="/documents"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:border-[#339999] hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center mb-2">
                          <FileText className="w-5 h-5 text-[#339999] mr-2" />
                          <span className="text-xs px-2 py-0.5 bg-[#339999]/10 text-[#339999] rounded">
                            {cert.market}
                          </span>
                        </div>
                        <h5 className="font-semibold text-gray-900 mb-1 group-hover:text-[#339999] transition-colors">
                          {template.title}
                        </h5>
                        <p className="text-xs text-gray-500">{template.desc}</p>
                        <div className="mt-auto pt-2 flex items-center text-xs text-[#339999] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-3 h-3 mr-1" />
                          Access Template
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Summary Tips */}
            <motion.div 
              className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 rounded-2xl p-8"
              variants={fadeInUp}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Info className="w-6 h-6 text-[#339999] mr-3" />
                Certification Strategy Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    {
                      number: 1,
                      title: 'Start with Your Primary Market',
                      desc: 'Focus on the market with highest demand for your product first'
                    },
                    {
                      number: 2,
                      title: 'Leverage Mutual Recognition',
                      desc: 'Some certifications can help fast-track others (e.g., CE → UKCA)'
                    }
                  ].map((tip, idx) => (
                    <motion.div 
                      key={idx}
                      className="flex items-start p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {tip.number}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                        <p className="text-gray-600 text-sm">
                          {tip.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    {
                      number: 3,
                      title: 'Plan for Multiple Markets',
                      desc: 'Consider parallel certification for faster global expansion'
                    },
                    {
                      number: 4,
                      title: 'Budget for Maintenance',
                      desc: 'Remember annual fees and surveillance audits in your planning'
                    }
                  ].map((tip, idx) => (
                    <motion.div 
                      key={idx}
                      className="flex items-start p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {tip.number}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                        <p className="text-gray-600 text-sm">
                          {tip.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  )
}
