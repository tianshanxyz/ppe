'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Stethoscope, 
  FileCheck, 
  Clock, 
  DollarSign, 
  Building2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Printer,
  Loader2
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

interface WizardStep {
  id: number
  title: string
  description: string
}

interface MarketAccessGuide {
  market: string
  marketCode: string
  regulator: string
  deviceType: string
  deviceClass: string
  riskLevel: string
  timeline: string
  estimatedCost: string
  steps: {
    phase: string
    items: {
      name: string
      required: boolean
      description: string
      estimatedDays?: number
    }[]
  }[]
  documents: {
    name: string
    format: string
    size: string
    description?: string
  }[]
  tips: string[]
}

const steps: WizardStep[] = [
  { id: 1, title: 'Select Target Market', description: 'Choose the country/region you want to enter' },
  { id: 2, title: 'Product Information', description: 'Describe your product type and classification' },
  { id: 3, title: 'Generate Checklist', description: 'Get a complete market access plan' }
]

const markets = [
  { 
    code: 'SG', 
    name: 'Singapore', 
    nameZh: '新加坡', 
    regulator: 'HSA',
    flag: '🇸🇬',
    popular: true
  },
  { 
    code: 'US', 
    name: 'United States', 
    nameZh: '美国', 
    regulator: 'FDA',
    flag: '🇺🇸',
    popular: true
  },
  { 
    code: 'EU', 
    name: 'European Union', 
    nameZh: '欧盟', 
    regulator: 'MDR',
    flag: '🇪🇺',
    popular: true
  },
  { 
    code: 'CN', 
    name: 'China', 
    nameZh: '中国', 
    regulator: 'NMPA',
    flag: '🇨🇳',
    popular: true
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    nameZh: '日本', 
    regulator: 'PMDA',
    flag: '🇯🇵',
    popular: false
  },
  { 
    code: 'AU', 
    name: 'Australia', 
    nameZh: '澳大利亚', 
    regulator: 'TGA',
    flag: '🇦🇺',
    popular: false
  },
  { 
    code: 'CA', 
    name: 'Canada', 
    nameZh: '加拿大', 
    regulator: 'Health Canada',
    flag: '🇨🇦',
    popular: false
  },
  { 
    code: 'UK', 
    name: 'United Kingdom', 
    nameZh: '英国', 
    regulator: 'MHRA',
    flag: '🇬🇧',
    popular: false
  }
]

const deviceTypes = [
  { 
    id: 'mask', 
    name: 'Surgical Mask', 
    nameZh: '外科口罩',
    category: 'Class I/II',
    riskLevel: 'low'
  },
  { 
    id: 'gloves', 
    name: 'Medical Gloves', 
    nameZh: '医用手套',
    category: 'Class I',
    riskLevel: 'low'
  },
  { 
    id: 'syringe', 
    name: 'Syringe', 
    nameZh: '注射器',
    category: 'Class II',
    riskLevel: 'medium'
  },
  { 
    id: 'catheter', 
    name: 'Catheter', 
    nameZh: '导管',
    category: 'Class II/III',
    riskLevel: 'medium'
  },
  { 
    id: 'pacemaker', 
    name: 'Pacemaker', 
    nameZh: '心脏起搏器',
    category: 'Class III',
    riskLevel: 'high'
  },
  { 
    id: 'imaging', 
    name: 'Medical Imaging', 
    nameZh: '医学影像设备',
    category: 'Class II',
    riskLevel: 'medium'
  },
  { 
    id: 'ivd', 
    name: 'IVD Device', 
    nameZh: '体外诊断设备',
    category: 'Class I/II/III',
    riskLevel: 'varies'
  },
  { 
    id: 'software', 
    name: 'Medical Software', 
    nameZh: '医疗软件',
    category: 'Class I/II',
    riskLevel: 'low-medium'
  }
]

// 从后端获取市场准入清单
async function fetchMarketAccessGuide(market: string, deviceType: string): Promise<MarketAccessGuide> {
  const response = await fetch(`/api/market-access?market=${market}&deviceType=${deviceType}`)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch market access guide')
  }
  
  return result.data
}

export function MarketAccessWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMarket, setSelectedMarket] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [checklist, setChecklist] = useState<MarketAccessGuide | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      // 生成清单
      setLoading(true)
      setError(null)
      try {
        const result = await fetchMarketAccessGuide(selectedMarket, selectedDevice)
        setChecklist(result)
        setShowResults(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate checklist')
        console.error('Failed to fetch guide:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedMarket('')
    setSelectedDevice('')
    setShowResults(false)
    setChecklist(null)
    setError(null)
  }

  if (showResults && checklist) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 结果头部 */}
        <div className="bg-gradient-to-r from-[#339999] to-[#2a7a7a] px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0">
                  {checklist.regulator}
                </Badge>
                <span className="text-white/80">{checklist.deviceClass}</span>
              </div>
              <h2 className="text-2xl font-bold">
                {checklist.market} Market Access Guide
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <Clock className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/70">Timeline</p>
              <p className="text-lg font-semibold">{checklist.timeline}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <DollarSign className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/70">Estimated Cost</p>
              <p className="text-lg font-semibold">{checklist.estimatedCost}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <FileCheck className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/70">Total Steps</p>
              <p className="text-lg font-semibold">
                {checklist.steps.reduce((acc, phase) => acc + phase.items.length, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 清单内容 */}
        <div className="p-8">
          {checklist.steps.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#339999] text-white flex items-center justify-center text-sm">
                  {phaseIndex + 1}
                </span>
                {phase.phase}
              </h3>
              <div className="space-y-3 ml-10">
                {phase.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`mt-0.5 ${item.required ? 'text-[#339999]' : 'text-gray-400'}`}>
                      {item.required ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.required && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                            Required
                          </Badge>
                        )}
                        {item.estimatedDays && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            ~{item.estimatedDays} days
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 文档下载 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklist.documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#339999] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#339999]/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-[#339999]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.format} • {doc.size}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 提示 */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pro Tips
            </h4>
            <ul className="space-y-1">
              {checklist.tips.map((tip, index) => (
                <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* 重新开始 */}
          <div className="mt-8 flex justify-center">
            <Button onClick={handleReset} variant="outline" className="px-8">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Start New Query
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 进度条 */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                ${currentStep > step.id ? 'bg-[#339999] text-white' : 
                  currentStep === step.id ? 'bg-[#339999] text-white' : 
                  'bg-gray-200 text-gray-500'}`}>
                {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 ${currentStep > step.id ? 'bg-[#339999]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 步骤内容 */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Target Market</h2>
              <p className="text-gray-600 mb-6">Choose the country or region where you want to sell your medical device</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {markets.map((market) => (
                  <button
                    key={market.code}
                    onClick={() => setSelectedMarket(market.code)}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${selectedMarket === market.code 
                        ? 'border-[#339999] bg-[#339999]/5' 
                        : 'border-gray-200 hover:border-[#339999]/50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{market.flag}</span>
                      {market.popular && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{market.name}</p>
                    <p className="text-xs text-gray-500">{market.regulator}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Device Type</h2>
              <p className="text-gray-600 mb-6">Choose the type of medical device you want to register</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {deviceTypes.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${selectedDevice === device.id 
                        ? 'border-[#339999] bg-[#339999]/5' 
                        : 'border-gray-200 hover:border-[#339999]/50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Stethoscope className={`w-5 h-5 ${selectedDevice === device.id ? 'text-[#339999]' : 'text-gray-400'}`} />
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          device.riskLevel === 'low' ? 'text-green-600 border-green-200' :
                          device.riskLevel === 'medium' ? 'text-yellow-600 border-yellow-200' :
                          device.riskLevel === 'high' ? 'text-red-600 border-red-200' :
                          'text-gray-600 border-gray-200'
                        }`}
                      >
                        {device.category}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{device.name}</p>
                    <p className="text-xs text-gray-500">{device.nameZh}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Selection</h2>
              <p className="text-gray-600 mb-6">Confirm your choices before generating the market access checklist</p>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#339999]" />
                    <span className="text-gray-600">Target Market</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {markets.find(m => m.code === selectedMarket)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#339999]" />
                    <span className="text-gray-600">Regulatory Authority</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {markets.find(m => m.code === selectedMarket)?.regulator}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-[#339999]" />
                    <span className="text-gray-600">Device Type</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {deviceTypes.find(d => d.id === selectedDevice)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#339999]" />
                    <span className="text-gray-600">Device Class</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {deviceTypes.find(d => d.id === selectedDevice)?.category}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 导航按钮 */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !selectedMarket) ||
              (currentStep === 2 && !selectedDevice) ||
              loading
            }
            className="bg-[#339999] hover:bg-[#2a7a7a]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {currentStep === 3 ? 'Generate Checklist' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
