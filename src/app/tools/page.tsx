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
  FileCheck,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useLocale } from '@/lib/i18n/LocaleProvider'

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

function ToolCard({ tool, locale }: { tool: Tool; locale: string }) {
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
                {tool.badge === 'New' ? (locale === 'zh' ? '新' : 'New') :
                 tool.badge === 'Hot' ? (locale === 'zh' ? '热门' : 'Hot') :
                 tool.badge === 'Beta' ? 'Beta' :
                 tool.badge === 'Coming Soon' ? (locale === 'zh' ? '即将推出' : 'Coming Soon') :
                 tool.badge}
              </Badge>
            )}
            {!isAvailable && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                {locale === 'zh' ? '即将推出' : 'Coming Soon'}
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
            {locale === 'zh' ? '打开工具' : 'Open Tool'}
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </Link>
    </motion.div>
  )
}

export default function ToolsPage() {
  const locale = useLocale()

  const tools: Tool[] = [
    {
      id: 'batch-query',
      title: locale === 'zh' ? '批量查询' : 'Batch Query',
      description: locale === 'zh' ? '上传Excel文件批量查询企业或产品信息，支持FDA、CE、NMPA等市场数据。' : 'Upload Excel files to query company or product information in bulk. Supports FDA, CE, NMPA and other market data.',
      icon: Upload,
      href: '/tools/batch-query',
      status: 'available',
      category: 'query',
      badge: 'New'
    },
    {
      id: 'classification',
      title: locale === 'zh' ? '产品分类' : 'Product Classification',
      description: locale === 'zh' ? '查询FDA产品代码和欧盟器械分类，了解法规要求。' : 'Query FDA product codes and EU device classifications to understand regulatory requirements.',
      icon: Search,
      href: '/tools/classification',
      status: 'available',
      category: 'query'
    },
    {
      id: 'regulations',
      title: locale === 'zh' ? '法规库' : 'Regulations Library',
      description: locale === 'zh' ? '访问FDA、欧盟等监管机构的官方法规、指导文件和合规资源。' : 'Access official regulations, guidance documents and compliance resources from FDA, EU and other regulators.',
      icon: FileText,
      href: '/tools/regulations',
      status: 'available',
      category: 'query'
    },
    {
      id: 'market-comparison',
      title: locale === 'zh' ? '市场对比' : 'Market Comparison',
      description: locale === 'zh' ? '对比企业在FDA、CE、NMPA、PMDA等不同市场的注册状态。' : 'Compare company registration status across different markets including FDA, CE, NMPA, PMDA.',
      icon: Globe,
      href: '/tools/market-comparison',
      status: 'coming_soon',
      category: 'analysis',
      badge: 'Hot'
    },
    {
      id: 'risk-analysis',
      title: locale === 'zh' ? '风险分析' : 'Risk Analysis',
      description: locale === 'zh' ? 'AI驱动的企业风险分析，识别潜在合规风险和市场预警。' : 'AI-powered company risk analysis to identify potential compliance risks and market alerts.',
      icon: AlertTriangle,
      href: '/tools/risk-analysis',
      status: 'coming_soon',
      category: 'analysis',
      badge: 'Coming Soon'
    },
    {
      id: 'ai-extract',
      title: locale === 'zh' ? 'AI文档提取' : 'AI Document Extraction',
      description: locale === 'zh' ? '使用AI从PDF文档中提取结构化数据，自动识别企业和产品信息。' : 'Extract structured data from PDF documents using AI, automatically identifying company and product information.',
      icon: Sparkles,
      href: '/tools/ai-extract',
      status: 'coming_soon',
      category: 'ai',
      badge: 'Coming Soon'
    }
  ]

  const categories: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    query: { label: locale === 'zh' ? '查询工具' : 'Query Tools', icon: Search, color: 'bg-blue-50 text-blue-600' },
    analysis: { label: locale === 'zh' ? '分析工具' : 'Analysis Tools', icon: BarChart3, color: 'bg-green-50 text-green-600' },
    compliance: { label: locale === 'zh' ? '合规工具' : 'Compliance Tools', icon: FileCheck, color: 'bg-purple-50 text-purple-600' },
    ai: { label: locale === 'zh' ? 'AI工具' : 'AI Tools', icon: Sparkles, color: 'bg-primary-50 text-primary-600' }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">{locale === 'zh' ? '合规工具' : 'Compliance Tools'}</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            {locale === 'zh' ? '专业医疗器械法规合规工具，帮助制造商、法规顾问和医疗专业人员应对复杂的法规要求。' : 'Professional medical device regulatory compliance tools to help manufacturers, regulatory consultants, and healthcare professionals navigate complex regulatory requirements.'}
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
                  {categoryTools.filter(t => t.status === 'available' || t.status === 'beta').length} {locale === 'zh' ? '可用' : 'Available'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} locale={locale} />
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
            <h3 className="font-semibold text-gray-900 mb-2">{locale === 'zh' ? '实时数据' : 'Real-time Data'}</h3>
            <p className="text-sm text-gray-600">
              {locale === 'zh' ? '所有工具连接官方数据源，确保数据的准确性和时效性。' : 'All tools connect to official data sources to ensure accuracy and timeliness.'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{locale === 'zh' ? '合规保障' : 'Compliance Assurance'}</h3>
            <p className="text-sm text-gray-600">
              {locale === 'zh' ? '基于FDA、欧盟等国际监管机构的官方指导文件开发。' : 'Developed based on official guidance documents from FDA, EU and other international regulators.'}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{locale === 'zh' ? 'AI驱动' : 'AI Powered'}</h3>
            <p className="text-sm text-gray-600">
              {locale === 'zh' ? '集成先进AI技术，实现智能分析和自动化。' : 'Integrated with advanced AI technology for intelligent analysis and automation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
