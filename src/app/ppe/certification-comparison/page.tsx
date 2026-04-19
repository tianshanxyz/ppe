'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Scale, FileText, Clock, DollarSign, Shield, Globe, ArrowRight, Info, ExternalLink, CheckCircle2 } from 'lucide-react'
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

    // 获取中国 NMPA 认证数据（估算）
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

  const category = categories.find(c => c.id === selectedCategory)

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
              Certification Standards Comparison
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare CE, FDA, UKCA, and NMPA certification requirements side by side
            </p>
          </motion.div>
        </div>
      </section>

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

      {/* Comparison Table */}
      {comparisonData && comparisonData.length > 0 && (
        <motion.section 
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Info */}
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-8" variants={fadeInUp}>
              <div className="flex items-center">
                <div className="mr-6">
                  {category && <PPEIcon categoryId={category.id} size={48} />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category?.name} - Certification Comparison
                  </h2>
                  <p className="text-gray-600">{category?.name_zh}</p>
                </div>
              </div>
            </motion.div>

            {/* Comparison Overview */}
            <motion.div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8" variants={fadeInUp}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#339999]/5 to-[#339999]/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Feature
                      </th>
                      {comparisonData.map((cert) => (
                        <th key={cert.market} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl mb-2">
                              {cert.market === 'EU' && '🇪🇺'}
                              {cert.market === 'US' && '🇺🇸'}
                              {cert.market === 'UK' && '🇬🇧'}
                              {cert.market === 'CN' && '🇨🇳'}
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
                    <motion.tr 
                      className="bg-white hover:bg-[#339999]/5 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
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
                    </motion.tr>

                    {/* Timeline */}
                    <motion.tr 
                      className="bg-gray-50 hover:bg-[#339999]/10 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
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
                    </motion.tr>

                    {/* Cost */}
                    <motion.tr 
                      className="bg-white hover:bg-[#339999]/5 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
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
                    </motion.tr>

                    {/* Requirements Count */}
                    <motion.tr 
                      className="bg-gray-50 hover:bg-[#339999]/10 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
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
                    </motion.tr>

                    {/* Documents Count */}
                    <motion.tr 
                      className="bg-white hover:bg-[#339999]/5 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
                      <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-[#339999]" />
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
                    </motion.tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

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
                    <Shield className="w-5 h-5 text-[#339999] mr-2" />
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
                <div>
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
