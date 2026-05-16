'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, ArrowRight, FileText, Clock, DollarSign, BadgeCheck, Globe, ExternalLink, CheckCircle2, ChevronDown, ChevronUp, Layers, Package, Settings, BarChart3, Calculator, TrendingUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPPECategories, getTargetMarkets, getComplianceData } from '@/lib/ppe-data'
import { PPEIcon } from '@/components/ppe/PPEIcons'
import { useLocale } from '@/lib/i18n/LocaleProvider'

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
  const locale = useLocale()
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedFeatures, setSelectedFeatures] = useState<{
    material: string;
    protectionLevel: string;
    intendedUse: string;
  }>({ material: '', protectionLevel: '', intendedUse: '' })
  const [showReport, setShowReport] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{
    standards: boolean;
    customs: boolean;
    certification: boolean;
    warnings: boolean;
    features: boolean;
    costBreakdown: boolean;
  }>({
    standards: true,
    customs: true,
    certification: true,
    warnings: true,
    features: true,
    costBreakdown: true
  })

  const category = categories.find(c => c.id === selectedCategory)
  const market = markets.find(m => m.code === selectedMarket)

  const complianceData = useMemo(() => {
    if (!selectedCategory || !selectedMarket) return null
    return getComplianceData(selectedCategory, selectedMarket)
  }, [selectedCategory, selectedMarket])

  const handleNext = () => {
    if (step === 1 && selectedCategory) setStep(2)
    else if (step === 2 && selectedSubcategory) setStep(3)
    else if (step === 3 && selectedMarket) setStep(4)
    else if (step === 4 && selectedFeatures.material && selectedFeatures.protectionLevel && selectedFeatures.intendedUse) {
      setStep(5)
      setShowReport(true)
    }
  }

  const handleBack = () => {
    if (step === 5) {
      setShowReport(false)
      setStep(4)
    } else if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleReset = () => {
    setStep(1)
    setShowReport(false)
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedMarket('')
    setSelectedFeatures({ material: '', protectionLevel: '', intendedUse: '' })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const steps = [
    { number: 1, title: locale === 'zh' ? '产品类别' : 'Product Category', description: locale === 'zh' ? '选择PPE类别' : 'Select PPE category' },
    { number: 2, title: locale === 'zh' ? '子类别' : 'Subcategory', description: locale === 'zh' ? '选择具体类型' : 'Choose specific type' },
    { number: 3, title: locale === 'zh' ? '目标市场' : 'Target Market', description: locale === 'zh' ? '选择目的地' : 'Select destination' },
    { number: 4, title: locale === 'zh' ? '产品特性' : 'Product Features', description: locale === 'zh' ? '指定详情' : 'Specify details' },
    { number: 5, title: locale === 'zh' ? '报告' : 'Report', description: locale === 'zh' ? '查看分析' : 'View analysis' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-16"
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
              {locale === 'zh' ? '合规检查向导' : 'Compliance Check Wizard'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {locale === 'zh' ? '逐步分析您的PPE产品在全球市场的合规要求' : 'Step-by-step compliance analysis for your PPE products across global markets'}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Progress Steps - always visible including on report page */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s.number
                      ? 'bg-[#339999] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.number ? <CheckCircle className="w-5 h-5" /> : s.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-semibold ${step >= s.number ? 'text-gray-900' : 'text-gray-400'}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-gray-400 hidden sm:block">{s.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 sm:mx-4 ${
                    step > s.number ? 'bg-[#339999]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Product Category */}
      {step === 1 && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'zh' ? '选择产品类别' : 'Select Product Category'}
              </h2>
              <p className="text-gray-600 mb-8">{locale === 'zh' ? '选择您产品的主要PPE类别' : 'Choose the main PPE category for your product'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedCategory === cat.id
                        ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#339999]/50'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <PPEIcon categoryId={cat.id} size={40} className="mr-4" />
                      <div>
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-sm text-gray-500">{cat.name_zh}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{cat.description}</p>
                    {cat.subcategories && (
                      <div className="mt-3 flex items-center text-xs text-[#339999]">
                        <Layers className="w-3 h-3 mr-1" />
                        {cat.subcategories.length} {locale === 'zh' ? '个子类别' : 'subcategories'}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  onClick={handleNext}
                  disabled={!selectedCategory}
                  whileHover={{ scale: !selectedCategory ? 1 : 1.02 }}
                  whileTap={{ scale: !selectedCategory ? 1 : 0.98 }}
                  className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {locale === 'zh' ? '下一步：选择子类别' : 'Next: Select Subcategory'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Step 2: Subcategory */}
      {step === 2 && category && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 mr-4">
                  ← {locale === 'zh' ? '返回' : 'Back'}
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '选择子类别' : 'Select Subcategory'}
                  </h2>
                  <p className="text-gray-600">{locale === 'zh' ? `选择${category.name}的具体类型` : `Choose the specific type of ${category.name}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.subcategories?.map((sub) => (
                  <motion.button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedSubcategory === sub.id
                        ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#339999]/50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Package className="w-6 h-6 text-[#339999] mr-3" />
                      <div>
                        <div className="font-semibold text-gray-900">{sub.name}</div>
                        <div className="text-sm text-gray-500">{sub.name_zh}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{sub.description}</p>
                  </motion.button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <motion.button
                  onClick={handleBack}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {locale === 'zh' ? '上一步' : 'Back'}
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  disabled={!selectedSubcategory}
                  whileHover={{ scale: !selectedSubcategory ? 1 : 1.02 }}
                  whileTap={{ scale: !selectedSubcategory ? 1 : 0.98 }}
                  className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {locale === 'zh' ? '下一步：选择市场' : 'Next: Select Market'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Step 3: Target Market */}
      {step === 3 && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 mr-4">
                  ← {locale === 'zh' ? '返回' : 'Back'}
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '选择目标市场' : 'Select Target Market'}
                  </h2>
                  <p className="text-gray-600">{locale === 'zh' ? '选择您的目的地市场进行合规分析' : 'Choose your destination market for compliance analysis'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map((m) => (
                  <motion.button
                    key={m.code}
                    type="button"
                    onClick={() => setSelectedMarket(m.code)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedMarket === m.code
                        ? 'border-[#339999] bg-[#339999]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#339999]/50'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="text-4xl mr-4">{m.flag_emoji}</div>
                      <div>
                        <div className="font-semibold text-gray-900">{m.name}</div>
                        <div className="text-sm text-gray-500">{m.name_zh}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{m.regulation_name}</div>
                      <div className="text-gray-400">{m.authority}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <motion.button
                  onClick={handleBack}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {locale === 'zh' ? '上一步' : 'Back'}
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  disabled={!selectedMarket}
                  whileHover={{ scale: !selectedMarket ? 1 : 1.02 }}
                  whileTap={{ scale: !selectedMarket ? 1 : 0.98 }}
                  className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {locale === 'zh' ? '下一步：产品特性' : 'Next: Product Features'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Step 4: Product Features */}
      {step === 4 && category && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 mr-4">
                  ← {locale === 'zh' ? '返回' : 'Back'}
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '产品特性' : 'Product Features'}
                  </h2>
                  <p className="text-gray-600">{locale === 'zh' ? '指定您的产品特性以获取准确的合规分析' : 'Specify your product characteristics for accurate compliance analysis'}</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Material */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Settings className="w-4 h-4 inline mr-2" />
                    {locale === 'zh' ? '材质' : 'Material'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {category.product_features?.materials.map((material) => (
                      <motion.button
                        key={material}
                        type="button"
                        onClick={() => setSelectedFeatures(prev => ({ ...prev, material }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedFeatures.material === material
                            ? 'border-[#339999] bg-[#339999]/10 text-[#339999]'
                            : 'border-gray-200 text-gray-600 hover:border-[#339999]/50'
                        }`}
                      >
                        {material}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Protection Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <BadgeCheck className="w-4 h-4 inline mr-2" />
                    {locale === 'zh' ? '防护等级' : 'Protection Level'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {category.product_features?.protection_levels.map((level) => (
                      <motion.button
                        key={level}
                        type="button"
                        onClick={() => setSelectedFeatures(prev => ({ ...prev, protectionLevel: level }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedFeatures.protectionLevel === level
                            ? 'border-[#339999] bg-[#339999]/10 text-[#339999]'
                            : 'border-gray-200 text-gray-600 hover:border-[#339999]/50'
                        }`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Intended Use */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Package className="w-4 h-4 inline mr-2" />
                    {locale === 'zh' ? '预期用途' : 'Intended Use'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {category.product_features?.intended_uses.map((use) => (
                      <motion.button
                        key={use}
                        type="button"
                        onClick={() => setSelectedFeatures(prev => ({ ...prev, intendedUse: use }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedFeatures.intendedUse === use
                            ? 'border-[#339999] bg-[#339999]/10 text-[#339999]'
                            : 'border-gray-200 text-gray-600 hover:border-[#339999]/50'
                        }`}
                      >
                        {use}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <motion.button
                  onClick={handleBack}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {locale === 'zh' ? '上一步' : 'Back'}
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  disabled={!selectedFeatures.material || !selectedFeatures.protectionLevel || !selectedFeatures.intendedUse}
                  whileHover={{ scale: (!selectedFeatures.material || !selectedFeatures.protectionLevel || !selectedFeatures.intendedUse) ? 1 : 1.02 }}
                  whileTap={{ scale: (!selectedFeatures.material || !selectedFeatures.protectionLevel || !selectedFeatures.intendedUse) ? 1 : 0.98 }}
                  className="inline-flex items-center px-8 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  {locale === 'zh' ? '生成报告' : 'Generate Report'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Report - with fallback for null complianceData */}
      {showReport && !complianceData && (
        <motion.section
          className="py-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 text-center" variants={fadeInUp}>
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'zh' ? '暂无合规数据' : 'No Compliance Data Available'}
              </h2>
              <p className="text-gray-600 mb-6">
                {locale === 'zh'
                  ? '未找到所选产品类别和市场组合的合规数据，请尝试其他类别或目标市场。'
                  : 'We could not find compliance data for the selected product category and market combination. Please try a different category or target market.'}
              </p>
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={handleBack}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  whileHover={{ x: -5 }}
                >
                  {locale === 'zh' ? '返回' : 'Go Back'}
                </motion.button>
                <motion.button
                  onClick={handleReset}
                  className="inline-flex items-center px-6 py-3 bg-[#339999] text-white font-semibold rounded-xl hover:bg-[#2d8b8b] transition-colors shadow-lg"
                >
                  {locale === 'zh' ? '开始新分析' : 'Start New Analysis'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {showReport && complianceData && (
        <motion.section
          className="py-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back & Reset Buttons */}
            <div className="flex items-center gap-4 mb-6">
              <motion.button
                onClick={handleBack}
                variants={fadeInUp}
                className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ x: -5 }}
              >
                {locale === 'zh' ? '返回产品特性' : 'Back to Features'}
              </motion.button>
              <motion.button
                onClick={handleReset}
                variants={fadeInUp}
                className="text-[#339999] hover:text-[#2d8b8b] font-medium inline-flex items-center"
              >
                {locale === 'zh' ? '开始新分析' : 'Start New Analysis'}
              </motion.button>
            </div>

            {/* Report Header */}
            <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-8" variants={fadeInUp}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {locale === 'zh' ? '合规分析报告' : 'Compliance Analysis Report'}
                  </h2>
                  <p className="text-lg text-gray-600 flex items-center">
                    {category && <PPEIcon categoryId={category.id} size={28} className="mr-3" />}
                    {category?.name} → {market?.flag_emoji} {market?.name}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    {locale === 'zh' ? '子类别' : 'Subcategory'}: {category?.subcategories?.find(s => s.id === selectedSubcategory)?.name} |
                    {locale === 'zh' ? '材质' : 'Material'}: {selectedFeatures.material} |
                    {locale === 'zh' ? '等级' : 'Level'}: {selectedFeatures.protectionLevel} |
                    {locale === 'zh' ? '用途' : 'Use'}: {selectedFeatures.intendedUse}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-2">{locale === 'zh' ? '风险分类' : 'Risk Classification'}</div>
                  <div className="text-2xl font-bold text-[#339999]">
                    {complianceData.classification}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  className="bg-[#339999]/5 rounded-xl p-6 hover:bg-[#339999]/10 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-semibold text-gray-700">{locale === 'zh' ? '时间线' : 'Timeline'}</div>
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
                    <div className="text-sm font-semibold text-gray-700">{locale === 'zh' ? '预估费用' : 'Estimated Cost'}</div>
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
                    <div className="text-sm font-semibold text-gray-700">{locale === 'zh' ? '所需文件' : 'Required Documents'}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {complianceData.standards.length + complianceData.customs_documents.length}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-[#339999]/5 rounded-xl p-6 hover:bg-[#339999]/10 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-3">
                    <BarChart3 className="w-6 h-6 text-[#339999] mr-3" />
                    <div className="text-sm font-semibold text-gray-700">{locale === 'zh' ? '合规评分' : 'Compliance Score'}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    85/100
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Product Features Analysis */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden"
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('features')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '产品特性分析' : 'Product Feature Analysis'}
                  </h3>
                </div>
                {expandedSections.features ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.features && (
                <div className="px-8 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#339999]/5 rounded-xl p-6">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{locale === 'zh' ? '材质' : 'Material'}</div>
                      <div className="text-lg font-bold text-gray-900">{selectedFeatures.material}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {locale === 'zh' ? `适用于${selectedFeatures.intendedUse.toLowerCase()}应用` : `Suitable for ${selectedFeatures.intendedUse.toLowerCase()} applications`}
                      </div>
                    </div>
                    <div className="bg-[#339999]/5 rounded-xl p-6">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{locale === 'zh' ? '防护等级' : 'Protection Level'}</div>
                      <div className="text-lg font-bold text-gray-900">{selectedFeatures.protectionLevel}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {locale === 'zh' ? `符合${market?.name}法规要求` : `Meets ${market?.name} regulatory requirements`}
                      </div>
                    </div>
                    <div className="bg-[#339999]/5 rounded-xl p-6">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{locale === 'zh' ? '预期用途' : 'Intended Use'}</div>
                      <div className="text-lg font-bold text-gray-900">{selectedFeatures.intendedUse}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {locale === 'zh' ? '分类' : 'Classification'}: {complianceData.classification}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Cost Breakdown */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden"
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleSection('costBreakdown')}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Calculator className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '费用明细' : 'Cost Breakdown'}
                  </h3>
                </div>
                {expandedSections.costBreakdown ? (
                  <ChevronUp className="w-6 h-6 text-gray-500" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              {expandedSections.costBreakdown && (
                <div className="px-8 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-[#339999] mr-3" />
                        <span className="text-gray-700">{locale === 'zh' ? '测试与认证' : 'Testing & Certification'}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${Math.round(complianceData.estimated_cost.min * 0.4).toLocaleString()} - ${Math.round(complianceData.estimated_cost.max * 0.5).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-[#339999] mr-3" />
                        <span className="text-gray-700">{locale === 'zh' ? '公告机构/主管部门费用' : 'Notified Body / Authority Fees'}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${Math.round(complianceData.estimated_cost.min * 0.2).toLocaleString()} - ${Math.round(complianceData.estimated_cost.max * 0.25).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-[#339999] mr-3" />
                        <span className="text-gray-700">{locale === 'zh' ? '技术文档' : 'Technical Documentation'}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${Math.round(complianceData.estimated_cost.min * 0.15).toLocaleString()} - ${Math.round(complianceData.estimated_cost.max * 0.15).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-[#339999] mr-3" />
                        <span className="text-gray-700">{locale === 'zh' ? '咨询及其他' : 'Consulting & Other'}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${Math.round(complianceData.estimated_cost.min * 0.25).toLocaleString()} - ${Math.round(complianceData.estimated_cost.max * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#339999]/10 rounded-xl border-2 border-[#339999]">
                      <span className="font-bold text-gray-900">{locale === 'zh' ? '预估总费用' : 'Total Estimated Cost'}</span>
                      <span className="font-bold text-[#339999] text-xl">
                        ${complianceData.estimated_cost.min.toLocaleString()} - ${complianceData.estimated_cost.max.toLocaleString()} {complianceData.estimated_cost.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                  <FileText className="w-6 h-6 text-[#339999] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {locale === 'zh' ? '认证要求' : 'Certification Requirements'}
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
                    {locale === 'zh' ? '适用标准与法规' : 'Applicable Standards & Regulations'}
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
                    {locale === 'zh' ? '清关文件' : 'Customs Clearance Documents'}
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
                    {locale === 'zh' ? '重要风险提示' : 'Important Risk Warnings'}
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
                    {(complianceData.risk_warnings || []).map((warning, index) => (
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
