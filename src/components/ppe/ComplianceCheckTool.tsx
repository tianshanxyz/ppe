'use client'

import { useState, useEffect } from 'react'
import { Download, CheckCircle, AlertTriangle, DollarSign, Clock, FileText, ExternalLink } from 'lucide-react'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'

export function ComplianceCheckTool() {
  const [categories, setCategories] = useState<any[]>([])
  const [markets, setMarkets] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  // 使用 useEffect 在客户端加载数据，避免 hydration mismatch
  useEffect(() => {
    setMounted(true)
    setCategories(getPPECategories())
    setMarkets(getTargetMarkets())
  }, [])

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

  // 在服务器端和客户端初始渲染时显示加载状态
  // 只有在客户端挂载后才显示实际内容
  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto" suppressHydrationWarning>
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                PPE Product Category
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                Loading categories...
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Target Market
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                Loading markets...
              </div>
            </div>
          </div>
          <button
            disabled
            className="w-full py-4 px-6 bg-gray-300 text-white text-lg font-semibold rounded-lg cursor-not-allowed shadow-md"
          >
            Get Compliance Report
          </button>
        </div>
      </div>
    )
  }

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

      {/* Results Section */}
      {showResults && complianceData && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#339999] to-[#2d8b8b] p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Compliance Report</h3>
            </div>
            <p className="text-white/90">
              {category?.icon} {category?.name} → {market?.flag_emoji} {market?.name}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Classification */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#339999]" />
                Risk Classification
              </h4>
              <p className="text-gray-700 font-medium">{complianceData.classification}</p>
            </div>

            {/* Standards */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#339999]" />
                Applicable Standards
              </h4>
              <div className="space-y-2">
                {complianceData.standards.map((std, idx) => (
                  <a
                    key={idx}
                    href={std.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{std.name}</p>
                      <p className="text-sm text-gray-600">{std.title}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#339999]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Certification Requirements */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#339999]" />
                Certification Requirements
              </h4>
              <ul className="space-y-2">
                {complianceData.certification_requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#339999] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cost & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Estimated Cost
                </h4>
                <p className="text-2xl font-bold text-green-700">
                  {complianceData.estimated_cost.currency} {complianceData.estimated_cost.min.toLocaleString()} - {complianceData.estimated_cost.max.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">Including testing, certification, and consulting fees</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Estimated Timeline
                </h4>
                <p className="text-2xl font-bold text-blue-700">
                  {complianceData.estimated_timeline.min} - {complianceData.estimated_timeline.max} {complianceData.estimated_timeline.unit}
                </p>
                <p className="text-sm text-gray-600 mt-1">From application to certificate issuance</p>
              </div>
            </div>

            {/* Customs Documents */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#339999]" />
                Required Customs Documents
              </h4>
              <div className="flex flex-wrap gap-2">
                {complianceData.customs_documents.map((doc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Risk Warnings */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Risk Warnings
              </h4>
              <ul className="space-y-2">
                {complianceData.risk_warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-800">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Download Button */}
            <button className="w-full py-3 px-6 border-2 border-[#339999] text-[#339999] font-semibold rounded-lg hover:bg-[#339999] hover:text-white transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Full Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
