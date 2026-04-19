'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, ArrowRight, FileText, Clock, DollarSign, Shield, Globe, ExternalLink, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function MarketAccessPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [showReport, setShowReport] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{
    standards: boolean;
    customs: boolean;
    certification: boolean;
    warnings: boolean;
  }>({
    standards: true,
    customs: true,
    certification: true,
    warnings: true
  })

  const complianceData = useMemo(() => {
    if (!selectedCategory || !selectedMarket) return null
    return getComplianceData(selectedCategory, selectedMarket)
  }, [selectedCategory, selectedMarket])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCategory && selectedMarket) {
      setShowReport(true)
    }
  }

  const handleReset = () => {
    setShowReport(false)
    setSelectedCategory('')
    setSelectedMarket('')
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const category = categories.find(c => c.id === selectedCategory)
  const market = markets.find(m => m.code === selectedMarket)

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
                <Globe className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Market Access Requirements
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get detailed market entry requirements for your PPE products
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Selection Form */}
      {!showReport && (
        <motion.section 
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Select Product and Market
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

                {/* Target Market */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Target Market *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {markets.map((m) => (
                      <motion.button
                        key={m.code}
                        type="button"
                        onClick={() => setSelectedMarket(m.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 rounded-xl border-2 text-left transition-all ${
                          selectedMarket === m.code
                            ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                            : 'border-gray-200 hover:border-[#339999]/50'
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className="text-3xl mr-3">{m.flag_emoji}</div>
                          <div>
                            <div className="font-semibold text-gray-900">{m.name}</div>
                            <div className="text-sm text-gray-500">{m.name_zh}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={!selectedCategory || !selectedMarket}
                    whileHover={{ scale: !selectedCategory || !selectedMarket ? 1 : 1.02 }}
                    whileTap={{ scale: !selectedCategory || !selectedMarket ? 1 : 0.98 }}
                    className="w-full inline-flex items-center justify-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Generate Market Access Report
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Report */}
      {showReport && complianceData && (
        <motion.section 
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <motion.button
              onClick={handleReset}
              variants={fadeInUp}
              className="mb-6 text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
              whileHover={{ x: -5 }}
            >
              ← Back to Selection
            </motion.button>

            {/* Report Header */}
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-8" variants={fadeInUp}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Market Access Report
                  </h2>
                  <p className="text-lg text-gray-600 flex items-center">
                    {category && <PPEIcon categoryId={category.id} size={28} className="mr-3" />}
                    {category?.name} → {market?.flag_emoji} {market?.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-2">Risk Classification</div>
                  <div className="text-2xl font-bold text-[#339999]">
                    {complianceData.classification}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  className="bg-[#339999]/5 rounded-xl p-6 hover:bg-[#339999]/10 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-semibold text-gray-700">Timeline</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.estimated_timeline.min}-{complianceData.estimated_timeline.max} {complianceData.estimated_timeline.unit}
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-[#339999]/5 rounded-xl p-6 hover:bg-[#339999]/10 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-semibold text-gray-700">Estimated Cost</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${complianceData.estimated_cost.min.toLocaleString()} - ${complianceData.estimated_cost.max.toLocaleString()} {complianceData.estimated_cost.currency}
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-[#339999]/5 rounded-xl p-6 hover:bg-[#339999]/10 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-3">
                    <FileText className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-semibold text-gray-700">Required Documents</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.standards.length + complianceData.customs_documents.length}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Certification Requirements */}
            <motion.div 
              className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden" 
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('certification')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Certification Requirements
                  </h3>
                </div>
                {expandedSections.certification ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.certification && (
                <div className="px-8 pb-6">
                  <ul className="space-y-4">
                    {complianceData.certification_requirements.map((req, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start p-4 bg-[#339999]/5 rounded-xl hover:bg-[#339999]/10 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#339999] mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Applicable Standards */}
            <motion.div 
              className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden" 
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('standards')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Applicable Standards & Regulations
                  </h3>
                </div>
                {expandedSections.standards ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.standards && (
                <div className="px-8 pb-6">
                  <div className="space-y-4">
                    {complianceData.standards.map((standard, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-gray-200 rounded-xl p-5 hover:border-[#339999] hover:bg-[#339999]/5 transition-all"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {standard.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {standard.title}
                            </p>
                          </div>
                          <a
                            href={standard.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#339999] hover:text-[#2d8b8b] inline-flex items-center ml-4"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Customs Documents */}
            <motion.div 
              className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden" 
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('customs')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Customs Clearance Documents
                  </h3>
                </div>
                {expandedSections.customs ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.customs && (
                <div className="px-8 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {complianceData.customs_documents.map((doc, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center p-5 bg-[#339999]/5 rounded-xl hover:bg-[#339999]/10 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-[#339999] mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{doc}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Risk Warnings */}
            <motion.div 
              className="bg-white rounded-2xl shadow-xl overflow-hidden" 
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('warnings')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Important Risk Warnings
                  </h3>
                </div>
                {expandedSections.warnings ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.warnings && (
                <div className="px-8 pb-6">
                  <ul className="space-y-4">
                    {complianceData.risk_warnings.map((warning, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start p-5 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{warning}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  )
}
