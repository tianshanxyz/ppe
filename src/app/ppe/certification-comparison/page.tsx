'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Scale, FileText, Clock, DollarSign, Shield, Globe, ArrowRight, Info } from 'lucide-react'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'

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
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <Scale className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Certification Standards Comparison
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare CE, FDA, UKCA, and NMPA certification requirements side by side
            </p>
          </div>
        </div>
      </section>

      {/* Selection Form */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Product Category to Compare
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  PPE Product Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-[#339999] bg-[#339999]/5'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                      <div className="text-sm text-gray-500">{cat.name_zh}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      {comparisonData && comparisonData.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center">
                <div className="text-4xl mr-4">{category?.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category?.name} - Certification Comparison
                  </h2>
                  <p className="text-gray-600">{category?.name_zh}</p>
                </div>
              </div>
            </div>

            {/* Comparison Overview */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Feature
                      </th>
                      {comparisonData.map((cert) => (
                        <th key={cert.market} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="text-3xl mb-2">
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
                  <tbody className="divide-y divide-gray-200">
                    {/* Classification */}
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
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
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Timeline
                        </div>
                      </td>
                      {comparisonData.map((cert) => (
                        <td key={cert.market} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {cert.timeline.min}-{cert.timeline.max} {cert.timeline.unit}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Cost */}
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Estimated Cost
                        </div>
                      </td>
                      {comparisonData.map((cert) => (
                        <td key={cert.market} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            ${cert.cost.min.toLocaleString()} - ${cert.cost.max.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {cert.cost.currency}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Requirements Count */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Requirements
                        </div>
                      </td>
                      {comparisonData.map((cert) => (
                        <td key={cert.market} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {cert.requirements.length} items
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Documents Count */}
                    <tr className="bg-white">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Documents
                        </div>
                      </td>
                      {comparisonData.map((cert) => (
                        <td key={cert.market} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {cert.documents.length} items
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Requirements */}
            {comparisonData.map((cert) => (
              <div
                key={cert.market}
                className="bg-white rounded-2xl shadow-xl p-8 mb-8"
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
                    {cert.requirements.map((req, index) => (
                      <li
                        key={index}
                        className="flex items-start p-3 bg-gray-50 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{req}</span>
                      </li>
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
                    {cert.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-[#339999] mr-3 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{doc}</span>
                      </div>
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
                    {cert.warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Summary Tips */}
            <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Info className="w-6 h-6 text-[#339999] mr-3" />
                Certification Strategy Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Start with Your Primary Market</h4>
                      <p className="text-gray-600 text-sm">
                        Focus on the market with highest demand for your product first
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Leverage Mutual Recognition</h4>
                      <p className="text-gray-600 text-sm">
                        Some certifications can help fast-track others (e.g., CE → UKCA)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Plan for Multiple Markets</h4>
                      <p className="text-gray-600 text-sm">
                        Consider parallel certification for faster global expansion
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#339999] text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Budget for Maintenance</h4>
                      <p className="text-gray-600 text-sm">
                        Remember annual fees and surveillance audits in your planning
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
