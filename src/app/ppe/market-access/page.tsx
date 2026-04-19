'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, ArrowRight, FileText, Clock, DollarSign, Shield, Globe, ExternalLink } from 'lucide-react'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'

export default function MarketAccessPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [showReport, setShowReport] = useState(false)

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

  const category = categories.find(c => c.id === selectedCategory)
  const market = markets.find(m => m.code === selectedMarket)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#339999]/10 rounded-full">
                <Globe className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Market Access Requirements
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get detailed market entry requirements for your PPE products
            </p>
          </div>
        </div>
      </section>

      {/* Selection Form */}
      {!showReport && (
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Select Product and Market
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

                {/* Target Market */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Target Market *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {markets.map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => setSelectedMarket(m.code)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedMarket === m.code
                            ? 'border-[#339999] bg-[#339999]/5'
                            : 'border-gray-200 hover:border-[#339999]/50'
                        }`}
                      >
                        <div className="text-3xl mb-2">{m.flag_emoji}</div>
                        <div className="font-semibold text-gray-900">{m.name}</div>
                        <div className="text-sm text-gray-500">{m.name_zh}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!selectedCategory || !selectedMarket}
                    className="w-full inline-flex items-center justify-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Market Access Report
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Report */}
      {showReport && complianceData && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
              onClick={handleReset}
              className="mb-6 text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
            >
              ← Back to Selection
            </button>

            {/* Report Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Market Access Report
                  </h2>
                  <p className="text-lg text-gray-600">
                    {category?.icon} {category?.name} → {market?.flag_emoji} {market?.name}
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
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-medium text-gray-700">Timeline</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.estimated_timeline.min}-{complianceData.estimated_timeline.max} {complianceData.estimated_timeline.unit}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-medium text-gray-700">Estimated Cost</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${complianceData.estimated_cost.min.toLocaleString()} - ${complianceData.estimated_cost.max.toLocaleString()} {complianceData.estimated_cost.currency}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <FileText className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-medium text-gray-700">Required Documents</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.standards.length + complianceData.customs_documents.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Certification Requirements */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="w-6 h-6 text-[#339999] mr-3" />
                Certification Requirements
              </h3>
              <ul className="space-y-4">
                {complianceData.certification_requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Applicable Standards */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-[#339999] mr-3" />
                Applicable Standards & Regulations
              </h3>
              <div className="space-y-4">
                {complianceData.standards.map((standard, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#339999] transition-colors"
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
                        className="text-[#339999] hover:text-[#2d8b8b] inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customs Documents */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-[#339999] mr-3" />
                Customs Clearance Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceData.customs_documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-[#339999] mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Warnings */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
                Important Risk Warnings
              </h3>
              <ul className="space-y-4">
                {complianceData.risk_warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
