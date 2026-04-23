'use client'

import { useState } from 'react'
import { Clock, Calendar, ArrowRight, AlertTriangle, CheckCircle2, Info, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
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

interface TimelinePhase {
  name: string
  description: string
  durationMin: number
  durationMax: number
  unit: 'days' | 'weeks' | 'months'
  dependsOn?: string[]
  optional: boolean
  tips: string[]
}

interface TimelineTemplate {
  categoryId: string
  marketCode: string
  totalMin: number
  totalMax: number
  phases: TimelinePhase[]
}

const TIMELINE_TEMPLATES: Record<string, Record<string, TimelineTemplate>> = {
  'respiratory-protection': {
    'EU': {
      categoryId: 'respiratory-protection',
      marketCode: 'EU',
      totalMin: 4,
      totalMax: 9,
      phases: [
        { name: 'Technical File Preparation', description: 'Compile product specs, design docs, risk assessment', durationMin: 2, durationMax: 4, unit: 'weeks', optional: false, tips: ['Start with a complete product specification', 'Include all variants and accessories'] },
        { name: 'Testing (EN 149/EN 14683)', description: 'Lab testing for filtration, breathing resistance, leakage', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Technical File Preparation'], optional: false, tips: ['Use an accredited lab (ISO 17025)', 'Plan for re-testing if initial results fail'] },
        { name: 'Notified Body Review (Module B)', description: 'EU Type Examination by Notified Body', durationMin: 4, durationMax: 8, unit: 'weeks', dependsOn: ['Testing (EN 149/EN 14683)'], optional: false, tips: ['Choose a Notified Body early', 'Submit complete documentation to avoid delays'] },
        { name: 'Production Quality Control (Module D)', description: 'Set up factory production control system', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Notified Body Review (Module B)'], optional: false, tips: ['Prepare quality manual and procedures', 'Schedule factory audit'] },
        { name: 'CE Marking & DoC', description: 'Issue Declaration of Conformity, affix CE mark', durationMin: 1, durationMax: 1, unit: 'weeks', dependsOn: ['Production Quality Control (Module D)'], optional: false, tips: ['Ensure DoC includes all required elements', 'Maintain technical file for 10 years'] },
      ]
    },
    'US': {
      categoryId: 'respiratory-protection',
      marketCode: 'US',
      totalMin: 6,
      totalMax: 18,
      phases: [
        { name: 'NIOSH Pre-submission', description: 'Prepare and submit pre-application to NIOSH', durationMin: 2, durationMax: 4, unit: 'weeks', optional: false, tips: ['Review NIOSH guidance documents', 'Ensure quality system meets ISO 17025'] },
        { name: 'NIOSH Testing', description: 'Filtration efficiency, breathing resistance, fit testing', durationMin: 4, durationMax: 8, unit: 'weeks', dependsOn: ['NIOSH Pre-submission'], optional: false, tips: ['Plan for potential re-testing', 'Maintain detailed test records'] },
        { name: 'NIOSH Quality Assurance', description: 'Quality system review and site visit', durationMin: 4, durationMax: 12, unit: 'weeks', dependsOn: ['NIOSH Testing'], optional: false, tips: ['Prepare quality manual', 'Train staff on audit procedures'] },
        { name: 'FDA 510(k) (if medical)', description: 'FDA clearance for medical use claims', durationMin: 3, durationMax: 6, unit: 'months', dependsOn: ['NIOSH Quality Assurance'], optional: true, tips: ['Only required for medical claims', 'Consider predicate device strategy'] },
      ]
    },
    'CN': {
      categoryId: 'respiratory-protection',
      marketCode: 'CN',
      totalMin: 3,
      totalMax: 6,
      phases: [
        { name: 'Type Testing (GB 2626)', description: 'Testing at NIOSH-recognized or CNAS lab', durationMin: 2, durationMax: 4, unit: 'weeks', optional: false, tips: ['Use NMPA-recognized testing lab', 'Prepare Chinese product standard'] },
        { name: 'Factory Audit', description: 'On-site quality system audit', durationMin: 1, durationMax: 2, unit: 'weeks', dependsOn: ['Type Testing (GB 2626)'], optional: false, tips: ['Ensure ISO 9001 compliance', 'Prepare production records'] },
        { name: 'NMPA Registration', description: 'Submit registration dossier to NMPA', durationMin: 2, durationMax: 4, unit: 'months', dependsOn: ['Factory Audit'], optional: false, tips: ['Use local regulatory agent if needed', 'Prepare Chinese labeling'] },
      ]
    },
  },
  'safety-footwear': {
    'EU': {
      categoryId: 'safety-footwear',
      marketCode: 'EU',
      totalMin: 3,
      totalMax: 6,
      phases: [
        { name: 'Technical Documentation', description: 'Product specs, design drawings, material specs', durationMin: 1, durationMax: 2, unit: 'weeks', optional: false, tips: ['Include all sizes and variants', 'Document sole/upper material specs'] },
        { name: 'Testing (EN ISO 20345)', description: 'Impact resistance, compression, slip resistance', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Technical Documentation'], optional: false, tips: ['Use accredited test lab', 'Test all claimed protection levels'] },
        { name: 'Module B Type Examination', description: 'Notified Body reviews technical file + test reports', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Testing (EN ISO 20345)'], optional: false, tips: ['Submit complete package at once', 'Respond promptly to NB queries'] },
        { name: 'Module C2/D Production Control', description: 'Internal production control or NB surveillance', durationMin: 1, durationMax: 2, unit: 'weeks', dependsOn: ['Module B Type Examination'], optional: false, tips: ['Choose Module C2 for simpler route', 'Module D requires annual NB audits'] },
      ]
    },
    'US': {
      categoryId: 'safety-footwear',
      marketCode: 'US',
      totalMin: 4,
      totalMax: 8,
      phases: [
        { name: 'ASTM F2413 Testing', description: 'Impact, compression, metatarsal, conductive testing', durationMin: 2, durationMax: 4, unit: 'weeks', optional: false, tips: ['Test to latest ASTM F2413-18 standard', 'Include all claimed protective features'] },
        { name: 'SEF Certification', description: 'Safety Equipment Institute certification', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['ASTM F2413 Testing'], optional: false, tips: ['Apply to SEI with test reports', 'Include quality system documentation'] },
        { name: 'OSHA Compliance Review', description: 'Ensure compliance with 29 CFR 1910.136', durationMin: 1, durationMax: 2, unit: 'weeks', dependsOn: ['SEF Certification'], optional: false, tips: ['Review OSHA requirements', 'Prepare compliance documentation'] },
      ]
    },
  },
  'protective-gloves': {
    'EU': {
      categoryId: 'protective-gloves',
      marketCode: 'EU',
      totalMin: 3,
      totalMax: 6,
      phases: [
        { name: 'Technical File', description: 'Product description, design, risk assessment', durationMin: 1, durationMax: 2, unit: 'weeks', optional: false, tips: ['Include chemical resistance data if applicable', 'Document all sizes'] },
        { name: 'Testing (EN 388/EN 420/EN 374)', description: 'Abrasion, cut, tear, puncture, chemical resistance', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Technical File'], optional: false, tips: ['Choose correct EN standard for glove type', 'Plan for multiple test rounds'] },
        { name: 'Notified Body Review', description: 'Category II or III certification', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Testing (EN 388/EN 420/EN 374)'], optional: false, tips: ['Category III requires EC type-examination', 'Include user instructions in all EU languages'] },
      ]
    },
  },
  'protective-clothing': {
    'EU': {
      categoryId: 'protective-clothing',
      marketCode: 'EU',
      totalMin: 4,
      totalMax: 8,
      phases: [
        { name: 'Technical Documentation', description: 'Design, materials, risk assessment, user manual', durationMin: 2, durationMax: 3, unit: 'weeks', optional: false, tips: ['Include washing/care instructions', 'Document material specifications'] },
        { name: 'Testing (EN ISO 13688/Type 1-6)', description: 'Depending on protection type (chemical, heat, etc.)', durationMin: 3, durationMax: 6, unit: 'weeks', dependsOn: ['Technical Documentation'], optional: false, tips: ['Type testing can be complex', 'Plan for extended test periods'] },
        { name: 'Notified Body Type Examination', description: 'EU Type Examination for Category III', durationMin: 4, durationMax: 8, unit: 'weeks', dependsOn: ['Testing (EN ISO 13688/Type 1-6)'], optional: false, tips: ['Most protective clothing is Category III', 'Factory audit required for Module D'] },
        { name: 'CE Marking', description: 'Issue DoC, affix CE mark', durationMin: 1, durationMax: 1, unit: 'weeks', dependsOn: ['Notified Body Type Examination'], optional: false, tips: ['Include NB identification number', 'Maintain post-market surveillance'] },
      ]
    },
  },
  'eye-protection': {
    'EU': {
      categoryId: 'eye-protection',
      marketCode: 'EU',
      totalMin: 3,
      totalMax: 6,
      phases: [
        { name: 'Technical File', description: 'Product specs, optical class, field of view', durationMin: 1, durationMax: 2, unit: 'weeks', optional: false, tips: ['Define optical class (1, 2, or 3)', 'Document lens material properties'] },
        { name: 'Testing (EN 166/EN 170/EN 172)', description: 'Impact resistance, optical quality, UV filtering', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Technical File'], optional: false, tips: ['Test for claimed protection levels', 'Include coating durability tests'] },
        { name: 'Notified Body Review', description: 'Category II certification', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Testing (EN 166/EN 170/EN 172)'], optional: false, tips: ['Most eyewear is Category II', 'Faster review than Category III'] },
      ]
    },
  },
}

const FALLBACK_TEMPLATE: TimelineTemplate = {
  categoryId: 'general',
  marketCode: 'EU',
  totalMin: 3,
  totalMax: 6,
  phases: [
    { name: 'Technical Documentation', description: 'Prepare product specifications, design files, and risk assessment', durationMin: 1, durationMax: 2, unit: 'weeks', optional: false, tips: ['Start early with complete product info', 'Include all variants and sizes'] },
    { name: 'Product Testing', description: 'Conduct required testing at accredited laboratory', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Technical Documentation'], optional: false, tips: ['Choose ISO 17025 accredited lab', 'Plan for potential re-testing'] },
    { name: 'Certification Review', description: 'Regulatory body reviews documentation and test results', durationMin: 2, durationMax: 4, unit: 'weeks', dependsOn: ['Product Testing'], optional: false, tips: ['Submit complete package', 'Respond promptly to queries'] },
    { name: 'Quality System Setup', description: 'Implement production quality control procedures', durationMin: 1, durationMax: 2, unit: 'weeks', dependsOn: ['Certification Review'], optional: false, tips: ['Prepare quality manual', 'Train production staff'] },
    { name: 'Final Certification', description: 'Receive certificate, issue DoC, affix marking', durationMin: 1, durationMax: 1, unit: 'weeks', dependsOn: ['Quality System Setup'], optional: false, tips: ['Verify all marking requirements', 'Maintain records for audit'] },
  ]
}

function formatDuration(min: number, max: number, unit: string): string {
  if (min === max) return `${min} ${unit}`
  return `${min}-${max} ${unit}`
}

function convertToMonths(min: number, max: number, unit: string): { min: number; max: number } {
  switch (unit) {
    case 'days': return { min: min / 30, max: max / 30 }
    case 'weeks': return { min: min / 4, max: max / 4 }
    case 'months': return { min, max }
    default: return { min, max }
  }
}

export default function TimelineEstimatorPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set())

  const template = selectedCategory && selectedMarket
    ? (TIMELINE_TEMPLATES[selectedCategory]?.[selectedMarket] || FALLBACK_TEMPLATE)
    : null

  const handleEstimate = () => {
    if (selectedCategory && selectedMarket) {
      setShowResult(true)
      setExpandedPhases(new Set())
    }
  }

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleExport = () => {
    if (!template) return
    const report = [
      `PPE Certification Timeline Estimate`,
      `Category: ${categories.find(c => c.id === selectedCategory)?.name}`,
      `Market: ${markets.find(m => m.code === selectedMarket)?.name}`,
      `Estimated Total: ${template.totalMin}-${template.totalMax} months`,
      ``,
      `Phase,Duration,Description,Tips`,
      ...template.phases.map(p =>
        `"${p.name}","${formatDuration(p.durationMin, p.durationMax, p.unit)}","${p.description}","${p.tips.join('; ')}"`
      ),
    ].join('\n')

    const blob = new Blob([report], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-estimate-${selectedCategory}-${selectedMarket}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
                <Clock className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Certification Timeline Estimator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get realistic timeline estimates for PPE certification across global markets
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Input Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setShowResult(false) }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-[#339999] bg-[#339999]/5'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PPEIcon categoryId={cat.id} size={20} />
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Market</label>
                <div className="grid grid-cols-2 gap-3">
                  {markets.map(market => (
                    <button
                      key={market.code}
                      onClick={() => { setSelectedMarket(market.code); setShowResult(false) }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMarket === market.code
                          ? 'border-[#339999] bg-[#339999]/5'
                          : 'border-gray-200 hover:border-[#339999]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{market.flag_emoji}</span>
                        <div>
                          <div className="font-medium text-sm">{market.name}</div>
                          <div className="text-xs text-gray-500">{market.regulation_name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleEstimate}
                disabled={!selectedCategory || !selectedMarket}
                className="px-10 py-4 bg-[#339999] text-white text-lg font-semibold rounded-xl hover:bg-[#2d8b8b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Get Timeline Estimate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <AnimatePresence>
        {showResult && template && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="py-12"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-2xl p-8 text-white mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Estimated Timeline</h2>
                    <p className="text-white/80">
                      {categories.find(c => c.id === selectedCategory)?.name} → {markets.find(m => m.code === selectedMarket)?.name}
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white/10 rounded-xl">
                    <div className="text-4xl font-bold">{template.totalMin}-{template.totalMax}</div>
                    <div className="text-sm text-white/80 mt-1">Months (Total)</div>
                  </div>
                  <div className="text-center p-4 bg-white/10 rounded-xl">
                    <div className="text-4xl font-bold">{template.phases.length}</div>
                    <div className="text-sm text-white/80 mt-1">Phases</div>
                  </div>
                  <div className="text-center p-4 bg-white/10 rounded-xl">
                    <div className="text-4xl font-bold">{template.phases.filter(p => !p.optional).length}</div>
                    <div className="text-sm text-white/80 mt-1">Required Phases</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Timeline</h3>
                <div className="space-y-4">
                  {template.phases.map((phase, idx) => {
                    const isExpanded = expandedPhases.has(idx)
                    const months = convertToMonths(phase.durationMin, phase.durationMax, phase.unit)
                    const widthPercent = ((months.max / template.totalMax) * 100)

                    return (
                      <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => togglePhase(idx)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-[#339999]">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{phase.name}</span>
                              {phase.optional && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Optional</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{phase.description}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-[#339999]">
                              {formatDuration(phase.durationMin, phase.durationMax, phase.unit)}
                            </div>
                            {phase.dependsOn && (
                              <div className="text-xs text-gray-400">After: {phase.dependsOn.join(', ')}</div>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-100"
                            >
                              <div className="p-4 bg-gray-50 space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-[#339999]" />
                                    Tips & Best Practices
                                  </h4>
                                  <ul className="space-y-1.5">
                                    {phase.tips.map((tip, tipIdx) => (
                                      <li key={tipIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {phase.dependsOn && (
                                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                                    <AlertTriangle className="w-4 h-4" />
                                    This phase depends on completing: {phase.dependsOn.join(', ')}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Note</p>
                    <p>These timelines are estimates based on typical scenarios. Actual timelines may vary depending on product complexity, testing lab availability, regulatory body workload, and completeness of submitted documentation. We recommend adding a 20-30% buffer for planning purposes.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
