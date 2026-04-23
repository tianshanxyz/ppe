'use client'

import { useState, useMemo } from 'react'
import { Calculator, DollarSign, Clock, FileText, TrendingUp, Info, Download, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
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

interface CostItem {
  name: string
  description: string
  min: number
  max: number
  currency: string
  required: boolean
  category: 'testing' | 'certification' | 'consulting' | 'other'
}

interface CostBreakdown {
  items: CostItem[]
  subtotal: { min: number; max: number }
  vat: { min: number; max: number }
  total: { min: number; max: number }
}

const COST_TEMPLATES: Record<string, Record<string, CostItem[]>> = {
  'respiratory-protection': {
    'EU': [
      { name: 'EN 149 Testing', description: 'Filtration efficiency, breathing resistance, leakage', min: 3500, max: 8000, currency: 'EUR', required: true, category: 'testing' },
      { name: 'EN 14683 Testing', description: 'Bacterial filtration, differential pressure, splash resistance', min: 2500, max: 6000, currency: 'EUR', required: false, category: 'testing' },
      { name: 'EU Type Examination (Module B)', description: 'Notified Body technical review', min: 5000, max: 12000, currency: 'EUR', required: true, category: 'certification' },
      { name: 'Production QA (Module D)', description: 'Factory audit and quality system assessment', min: 4000, max: 10000, currency: 'EUR', required: true, category: 'certification' },
      { name: 'Technical File Preparation', description: 'Documentation compilation and review', min: 2000, max: 5000, currency: 'EUR', required: true, category: 'consulting' },
      { name: 'Labeling Review', description: 'Multi-language label compliance check', min: 500, max: 1500, currency: 'EUR', required: true, category: 'consulting' },
    ],
    'US': [
      { name: 'NIOSH N95 Testing', description: 'Filtration, breathing resistance, fit testing', min: 5000, max: 15000, currency: 'USD', required: true, category: 'testing' },
      { name: 'FDA 510(k) Preparation', description: 'Premarket notification compilation', min: 8000, max: 25000, currency: 'USD', required: true, category: 'certification' },
      { name: 'FDA 510(k) Submission Fee', description: 'FDA official fee (2024)', min: 2176, max: 2176, currency: 'USD', required: true, category: 'certification' },
      { name: 'ASTM F2100 Testing', description: 'Medical face mask performance testing', min: 3000, max: 8000, currency: 'USD', required: false, category: 'testing' },
      { name: 'FDA Establishment Registration', description: 'Annual facility registration', min: 7652, max: 7652, currency: 'USD', required: true, category: 'certification' },
      { name: 'US Agent Service', description: 'FDA-required US representative', min: 1500, max: 5000, currency: 'USD', required: true, category: 'consulting' },
    ],
  },
  'protective-clothing': {
    'EU': [
      { name: 'EN 14126 Testing', description: 'Protection against biological hazards', min: 4000, max: 10000, currency: 'EUR', required: true, category: 'testing' },
      { name: 'EN 14605 Testing', description: 'Chemical protective suit testing', min: 5000, max: 12000, currency: 'EUR', required: false, category: 'testing' },
      { name: 'EU Type Examination', description: 'Notified Body assessment', min: 5000, max: 12000, currency: 'EUR', required: true, category: 'certification' },
      { name: 'Technical File', description: 'Documentation preparation', min: 2000, max: 5000, currency: 'EUR', required: true, category: 'consulting' },
    ],
    'US': [
      { name: 'NFPA 1999 Testing', description: 'Emergency medical operations protective clothing', min: 6000, max: 15000, currency: 'USD', required: true, category: 'testing' },
      { name: 'FDA Registration', description: 'Medical device establishment registration', min: 7652, max: 7652, currency: 'USD', required: true, category: 'certification' },
      { name: '510(k) Preparation', description: 'Premarket notification', min: 8000, max: 25000, currency: 'USD', required: true, category: 'certification' },
    ],
  },
  'safety-footwear': {
    'EU': [
      { name: 'EN ISO 20345 Testing', description: 'Impact resistance, compression, slip resistance', min: 3000, max: 7000, currency: 'EUR', required: true, category: 'testing' },
      { name: 'EU Type Examination', description: 'Notified Body certification', min: 4000, max: 10000, currency: 'EUR', required: true, category: 'certification' },
      { name: 'Production QA', description: 'Factory quality system audit', min: 3000, max: 8000, currency: 'EUR', required: true, category: 'certification' },
      { name: 'Technical Documentation', description: 'Technical file preparation', min: 1500, max: 4000, currency: 'EUR', required: true, category: 'consulting' },
    ],
    'US': [
      { name: 'ASTM F2413 Testing', description: 'Standard test methods for foot protection', min: 2500, max: 6000, currency: 'USD', required: true, category: 'testing' },
      { name: 'OSHA Compliance Review', description: '29 CFR 1910.136 compliance assessment', min: 2000, max: 5000, currency: 'USD', required: true, category: 'consulting' },
    ],
  },
}

const DEFAULT_COSTS: CostItem[] = [
  { name: 'Product Testing', description: 'Standard safety and performance testing', min: 3000, max: 10000, currency: 'USD', required: true, category: 'testing' },
  { name: 'Certification Fee', description: 'Official certification body fees', min: 5000, max: 15000, currency: 'USD', required: true, category: 'certification' },
  { name: 'Technical Documentation', description: 'Technical file and DoC preparation', min: 2000, max: 6000, currency: 'USD', required: true, category: 'consulting' },
  { name: 'Factory Audit', description: 'Initial factory inspection', min: 3000, max: 8000, currency: 'USD', required: false, category: 'certification' },
]

export default function CostCalculatorPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1000)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const costData = useMemo(() => {
    if (!selectedCategory || !selectedMarket) return null

    const items = COST_TEMPLATES[selectedCategory]?.[selectedMarket] || DEFAULT_COSTS.map(item => ({
      ...item,
      currency: selectedMarket === 'EU' ? 'EUR' : selectedMarket === 'UK' ? 'GBP' : 'USD'
    }))

    // Auto-select required items
    const requiredItems = new Set(items.filter(i => i.required).map(i => i.name))
    const activeItems = selectedItems.size > 0 ? selectedItems : requiredItems

    const selectedCosts = items.filter(item => activeItems.has(item.name))

    const subtotalMin = selectedCosts.reduce((sum, item) => sum + item.min, 0)
    const subtotalMax = selectedCosts.reduce((sum, item) => sum + item.max, 0)

    const vatRate = selectedMarket === 'EU' ? 0.20 : selectedMarket === 'UK' ? 0.20 : 0
    const vatMin = Math.round(subtotalMin * vatRate)
    const vatMax = Math.round(subtotalMax * vatRate)

    return {
      items,
      subtotal: { min: subtotalMin, max: subtotalMax },
      vat: { min: vatMin, max: vatMax },
      total: { min: subtotalMin + vatMin, max: subtotalMax + vatMax },
      activeItems,
    }
  }, [selectedCategory, selectedMarket, selectedItems])

  const toggleItem = (itemName: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemName)) {
        next.delete(itemName)
      } else {
        next.add(itemName)
      }
      return next
    })
  }

  const handleExport = () => {
    if (!costData) return
    const category = categories.find(c => c.id === selectedCategory)
    const market = markets.find(m => m.code === selectedMarket)

    const report = `
PPE Compliance Cost Estimate
============================
Product: ${category?.name || 'Unknown'}
Market: ${market?.name || 'Unknown'}
Quantity: ${quantity} units

Cost Breakdown:
${costData.items.filter(i => costData.activeItems.has(i.name)).map(item =>
  `- ${item.name}: ${item.currency} ${item.min.toLocaleString()} - ${item.max.toLocaleString()}${item.required ? ' (Required)' : ''}`
).join('\n')}

Subtotal: ${costData.items[0]?.currency || 'USD'} ${costData.subtotal.min.toLocaleString()} - ${costData.subtotal.max.toLocaleString()}
VAT/Tax: ${costData.items[0]?.currency || 'USD'} ${costData.vat.min.toLocaleString()} - ${costData.vat.max.toLocaleString()}
Total: ${costData.items[0]?.currency || 'USD'} ${costData.total.min.toLocaleString()} - ${costData.total.max.toLocaleString()}

Note: This is an estimate. Actual costs may vary based on specific product characteristics and chosen service providers.
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cost-estimate-${selectedCategory}-${selectedMarket}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
                <Calculator className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Certification Cost Calculator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get detailed cost estimates for PPE certification across global markets
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Calculator Form */}
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
              Product & Market Selection
            </h2>

            <div className="space-y-6">
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
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setSelectedItems(new Set())
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="flex items-center">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {markets.map((m) => (
                    <motion.button
                      key={m.code}
                      type="button"
                      onClick={() => {
                        setSelectedMarket(m.code)
                        setSelectedItems(new Set())
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedMarket === m.code
                          ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{m.flag_emoji}</div>
                      <div className="font-semibold text-gray-900 text-sm">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.code}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Expected Annual Quantity (units)
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#339999]"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>100</span>
                  <span className="font-semibold text-[#339999]">{quantity.toLocaleString()} units</span>
                  <span>100,000</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Cost Breakdown */}
      {costData && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Summary Card */}
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-8" variants={fadeInUp}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="mr-4">
                    {category && <PPEIcon categoryId={category.id} size={48} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category?.name} → {market?.name}
                    </h2>
                    <p className="text-gray-600">Estimated certification costs</p>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Total Cost Display */}
              <div className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {costData.items[0]?.currency || 'USD'} {costData.subtotal.min.toLocaleString()} - {costData.subtotal.max.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">VAT/Tax</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {costData.items[0]?.currency || 'USD'} {costData.vat.min.toLocaleString()} - {costData.vat.max.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Estimate</p>
                    <p className="text-3xl font-bold text-[#339999]">
                      {costData.items[0]?.currency || 'USD'} {costData.total.min.toLocaleString()} - {costData.total.max.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per Unit Cost */}
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-6">
                <TrendingUp className="w-5 h-5 text-[#339999] mr-2" />
                <span className="text-sm text-gray-600">
                  Estimated per-unit certification cost: {' '}
                  <span className="font-semibold text-[#339999]">
                    {costData.items[0]?.currency || 'USD'} {Math.round(costData.total.min / quantity).toLocaleString()} - {Math.round(costData.total.max / quantity).toLocaleString()}
                  </span>
                  {' '}per unit (based on {quantity.toLocaleString()} units/year)
                </span>
              </div>

              {/* Cost Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-[#339999] hover:text-[#2d8b8b] flex items-center gap-1"
                  >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {costData.items.map((item, idx) => {
                  const isSelected = costData.activeItems.has(item.name)
                  return (
                    <motion.div
                      key={idx}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#339999] bg-[#339999]/5'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleItem(item.name)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#339999] text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{item.name}</span>
                              {item.required && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                  Required
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                item.category === 'testing' ? 'bg-blue-100 text-blue-600' :
                                item.category === 'certification' ? 'bg-green-100 text-green-600' :
                                item.category === 'consulting' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {item.currency} {item.min.toLocaleString()} - {item.max.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Min: </span>
                              <span className="font-medium">{item.currency} {item.min.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max: </span>
                              <span className="font-medium">{item.currency} {item.max.toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              className="bg-gradient-to-r from-[#339999]/10 to-[#339999]/5 rounded-2xl p-8"
              variants={fadeInUp}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-6 h-6 text-[#339999] mr-3" />
                Cost Optimization Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Bundle multiple products for volume discounts on testing',
                  'Prepare technical documentation in-house to reduce consulting fees',
                  'Consider mutual recognition agreements to avoid duplicate testing',
                  'Plan certification timeline to avoid rush fees',
                  'Maintain quality systems to reduce surveillance audit costs',
                  'Use accredited labs in lower-cost regions when acceptable',
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#339999] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3"
              variants={fadeInUp}
            >
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                <p className="text-sm text-yellow-700 mt-1">
                  These estimates are for reference only. Actual costs vary based on product complexity,
                  chosen service providers, and specific regulatory requirements. Always obtain formal
                  quotations from certification bodies and testing laboratories.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  )
}
