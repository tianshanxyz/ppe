'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Search, 
  FileText, 
  Globe, 
  AlertTriangle, 
  Sparkles,
  Zap,
  ArrowRight,
  BarChart3,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Tool {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  status: 'available' | 'coming_soon' | 'beta'
  category: 'query' | 'analysis' | 'compliance' | 'ai'
  badge?: string
}

const tools: Tool[] = [
  {
    id: 'batch-query',
    title: 'Batch Query',
    description: 'Upload Excel files to query company or product information in bulk. Supports FDA, CE, NMPA and other market data.',
    icon: Upload,
    href: '/tools/batch-query',
    status: 'available',
    category: 'query',
    badge: 'New'
  },
  {
    id: 'classification',
    title: 'Product Classification',
    description: 'Query FDA product codes and EU device classifications to understand regulatory requirements.',
    icon: Search,
    href: '/tools/classification',
    status: 'available',
    category: 'query'
  },
  {
    id: 'regulations',
    title: 'Regulations Library',
    description: 'Access official regulations, guidance documents and compliance resources from FDA, EU and other regulators.',
    icon: FileText,
    href: '/tools/regulations',
    status: 'available',
    category: 'query'
  },
  {
    id: 'market-comparison',
    title: 'Market Comparison',
    description: 'Compare company registration status across different markets including FDA, CE, NMPA, PMDA.',
    icon: Globe,
    href: '/tools/market-comparison',
    status: 'coming_soon',
    category: 'analysis',
    badge: 'Hot'
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description: 'AI-powered company risk analysis to identify potential compliance risks and market alerts.',
    icon: AlertTriangle,
    href: '/tools/risk-analysis',
    status: 'beta',
    category: 'analysis',
    badge: 'Beta'
  },
  {
    id: 'ai-extract',
    title: 'AI Document Extraction',
    description: 'Extract structured data from PDF documents using AI, automatically identifying company and product information.',
    icon: Sparkles,
    href: '/tools/ai-extract',
    status: 'beta',
    category: 'ai',
    badge: 'AI'
  }
]

const categories = {
  query: { label: 'Query Tools', icon: Search, color: 'bg-blue-50 text-blue-600' },
  analysis: { label: 'Analysis Tools', icon: BarChart3, color: 'bg-green-50 text-green-600' },
  compliance: { label: 'Compliance Tools', icon: Shield, color: 'bg-purple-50 text-purple-600' },
  ai: { label: 'AI Tools', icon: Sparkles, color: 'bg-primary-50 text-primary-600' }
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const isAvailable = tool.status === 'available' || tool.status === 'beta'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isAvailable ? { y: -4 } : undefined}
    >
      <Link
        href={tool.href}
        className={`group block h-full bg-white rounded-xl border border-gray-200 p-6 transition-all ${
          isAvailable
            ? 'hover:shadow-lg hover:border-primary-300' 
            : 'opacity-60 cursor-not-allowed'
        }`}
        onClick={(e) => !isAvailable && e.preventDefault()}
      >
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAvailable ? 'bg-primary-50' : 'bg-gray-100'
          }`}>
            <Icon className={`w-6 h-6 ${isAvailable ? 'text-primary-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex flex-col items-end gap-1">
            {tool.badge && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  tool.badge === 'New' ? 'border-green-200 text-green-600 bg-green-50' :
                  tool.badge === 'Hot' ? 'border-red-200 text-red-600 bg-red-50' :
                  tool.badge === 'Beta' ? 'border-yellow-200 text-yellow-600 bg-yellow-50' :
                  'border-primary-200 text-primary-600 bg-primary-50'
                }`}
              >
                {tool.badge}
              </Badge>
            )}
            {!isAvailable && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                Coming Soon
              </span>
            )}
          </div>
        </div>
        
        <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {tool.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{tool.description}</p>
        
        {isAvailable && (
          <div className="mt-4 flex items-center text-sm font-medium text-primary-600">
            Open Tool
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </Link>
    </motion.div>
  )
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-600" />
            </div>
            <Badge variant="outline" className="text-xs">v6.0</Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Tools</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Professional medical device regulatory compliance tools to help manufacturers, regulatory consultants, and healthcare professionals navigate complex regulatory requirements.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tools by Category */}
        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryTools = tools.filter(t => t.category === categoryKey)
          if (categoryTools.length === 0) return null
          
          const CategoryIcon = category.icon
          
          return (
            <div key={categoryKey} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                  <CategoryIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{category.label}</h2>
                <Badge variant="outline" className="text-xs">
                  {categoryTools.filter(t => t.status === 'available' || t.status === 'beta').length} Available
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Data</h3>
            <p className="text-sm text-gray-600">
              All tools connect to official data sources to ensure accuracy and timeliness.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Compliance Assurance</h3>
            <p className="text-sm text-gray-600">
              Developed based on official guidance documents from FDA, EU and other international regulators.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Powered</h3>
            <p className="text-sm text-gray-600">
              Integrated with advanced AI technology for intelligent analysis and automation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
