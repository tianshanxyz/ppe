'use client'

import { useState } from 'react'
import { Download, CheckCircle, AlertTriangle, DollarSign, Clock, FileText, ExternalLink } from 'lucide-react'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'

export function ComplianceCheckTool() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCheck = () => {
    if (selectedCategory && selectedMarket) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        setLoading(false)
        setShowResults(true)
      }, 1000)
    }
  }

  const complianceData = showResults ? getComplianceData(selectedCategory, selectedMarket) : null
  const category = categories.find(c => c.id === selectedCategory)
  const market = markets.find(m => m.code === selectedMarket)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Selection Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              PPE Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setShowResults(false)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent text-gray-900"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Market Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Target Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => {
                setSelectedMarket(e.target.value)
                setShowResults(false)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent text-gray-900"
            >
              <option value="">Select a market...</option>
              {markets.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.flag_emoji} {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleCheck}
          disabled={!selectedCategory || !selectedMarket || loading}
          className="w-full py-4 px-6 bg-[#339999] text-white text-lg font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Report...
            </span>
          ) : (
            'Get Compliance Report'
          )}
        </button>
      </div>

      {/* Results */}
      {showResults && complianceData && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-2">
              Compliance Report: {category?.name}
            </h3>
            <p className="text-lg opacity-90">
              Target Market: {market?.flag_emoji} {market?.name} ({market?.regulation_name})
            </p>
          </div>

          {/* Classification */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-[#339999] mr-3" />
              <h4 className="text-xl font-bold text-gray-900">Product Classification</h4>
            </div>
            <p className="text-gray-700 text-lg">{complianceData.classification}</p>
          </div>

          {/* Standards */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#339999] mr-3" />
              <h4 className="text-xl font-bold text-gray-900">Applicable Standards</h4>
            </div>
            <ul className="space-y-3">
              {complianceData.standards.map((standard, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <a
                      href={standard.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#339999] hover:underline font-medium"
                    >
                      {standard.name}
                    </a>
                    <ExternalLink className="inline-block w-4 h-4 ml-2 text-gray-400" />
                    <p className="text-gray-600 text-sm mt-1">{standard.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Certification Requirements */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#339999] mr-3" />
              <h4 className="text-xl font-bold text-gray-900">Certification Requirements</h4>
            </div>
            <ul className="space-y-2">
              {complianceData.certification_requirements.map((req, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cost & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <DollarSign className="w-6 h-6 text-[#339999] mr-3" />
                <h4 className="text-xl font-bold text-gray-900">Estimated Cost</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${complianceData.estimated_cost.min.toLocaleString()} - ${complianceData.estimated_cost.max.toLocaleString()}
              </div>
              <p className="text-gray-600 text-sm">USD</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Clock className="w-6 h-6 text-[#339999] mr-3" />
                <h4 className="text-xl font-bold text-gray-900">Estimated Timeline</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {complianceData.estimated_timeline.min} - {complianceData.estimated_timeline.max} {complianceData.estimated_timeline.unit}
              </div>
              <p className="text-gray-600 text-sm">From application to approval</p>
            </div>
          </div>

          {/* Customs Documents */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-[#339999] mr-3" />
              <h4 className="text-xl font-bold text-gray-900">Customs Documents Required</h4>
            </div>
            <ul className="space-y-2">
              {complianceData.customs_documents.map((doc, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-[#339999] rounded-full mr-3 mt-2" />
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Warnings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
              <h4 className="text-xl font-bold text-gray-900">Compliance Risk Warnings</h4>
            </div>
            <ul className="space-y-3">
              {complianceData.risk_warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start bg-orange-50 p-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{warning}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 rounded-2xl p-8 border border-[#339999]/20 text-center">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">
              Need the Full Report?
            </h4>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Download a professional PDF version of this compliance report with detailed checklists, templates, and official references.
            </p>
            <button className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors shadow-md">
              <Download className="w-5 h-5 mr-2" />
              Download Full PDF Report
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Free for Pro members • $4.99 for one-time download
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
