'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { BatchQueryUpload, BatchQueryItem, QueryType } from '@/components/batch'
import { Badge } from '@/components/ui/Badge'
import { useLocale } from '@/lib/i18n/LocaleProvider'

// 模拟批量查询处理
async function mockBatchProcess(
  file: File,
  type: QueryType,
  onProgress: (progress: number) => void
): Promise<BatchQueryItem[]> {
  // 模拟处理延迟
  const totalItems = 10
  const items: BatchQueryItem[] = []

  for (let i = 0; i < totalItems; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    onProgress(((i + 1) / totalItems) * 100)

    const mockNames = type === 'company'
      ? ['Medtronic Inc.', 'Johnson & Johnson', 'Abbott Laboratories', 'Boston Scientific', 'Stryker Corp']
      : ['Cardiac Pacemaker', 'Surgical Mesh', 'Orthopedic Implant', 'Diagnostic Kit', 'Infusion Pump']

    const mockName = mockNames[i % mockNames.length]
    const found = Math.random() > 0.3

    items.push({
      id: `item-${i}`,
      query: `${mockName} ${i + 1}`,
      type,
      status: 'completed',
      result: found ? {
        found: true,
        name: mockName,
        country: ['USA', 'EU', 'China'][Math.floor(Math.random() * 3)],
        registrationCount: Math.floor(Math.random() * 50) + 1,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      } : {
        found: false
      }
    })
  }

  return items
}

// 下载模板
function downloadTemplate(type: QueryType) {
  const headers = type === 'company'
    ? 'company_name,country\nExample Medical Inc.,USA\nAnother Device Co.,EU'
    : 'product_name,k_number\nCardiac Pacemaker,K123456\nSurgical Mesh,K789012'

  const blob = new Blob([headers], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `batch_query_template_${type}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function BatchQueryPage() {
  const locale = useLocale()
  const [items, setItems] = useState<BatchQueryItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  const handleUpload = useCallback(async (file: File, type: QueryType) => {
    setStatus('uploading')
    setProgress(0)
    setItems([])

    try {
      // 模拟上传
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus('processing')

      // 模拟处理
      const results = await mockBatchProcess(file, type, setProgress)
      setItems(results)
      setStatus('completed')
    } catch (error) {
      setStatus('error')
      console.error('Batch query error:', error)
    }
  }, [])

  const handleClear = useCallback(() => {
    setItems([])
    setStatus('idle')
    setProgress(0)
  }, [])

  const handleExport = useCallback(() => {
    const csv = [
      ['Query', 'Type', 'Status', 'Found', 'Name', 'Country', 'Registrations', 'Risk Level'].join(','),
      ...items.map(item => [
        item.query,
        item.type,
        item.status,
        item.result?.found ? 'Yes' : 'No',
        item.result?.name || '',
        item.result?.country || '',
        item.result?.registrationCount || '',
        item.result?.riskLevel || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch_query_results_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [items])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {locale === 'zh' ? '返回工具箱' : 'Back to Tools'}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{locale === 'zh' ? '批量查询' : 'Batch Query'}</h1>
              <p className="mt-1 text-gray-600">
                {locale === 'zh' ? '上传Excel文件批量查询企业或产品信息' : 'Upload Excel files to batch query company or product information'}
              </p>
            </div>
            <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">
              {locale === 'zh' ? '新增' : 'New'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <BatchQueryUpload
                onUpload={handleUpload}
                onDownloadTemplate={downloadTemplate}
                items={items}
                status={status}
                progress={progress}
                onClear={handleClear}
              />
            </div>

            {/* Results Summary */}
            {status === 'completed' && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white rounded-xl border border-gray-200 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-4">{locale === 'zh' ? '查询摘要' : 'Query Summary'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                    <p className="text-sm text-gray-500">{locale === 'zh' ? '总查询数' : 'Total Queries'}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {items.filter(i => i.result?.found).length}
                    </p>
                    <p className="text-sm text-gray-500">{locale === 'zh' ? '找到结果' : 'Found'}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {items.filter(i => !i.result?.found).length}
                    </p>
                    <p className="text-sm text-gray-500">{locale === 'zh' ? '未找到' : 'Not Found'}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {items.filter(i => i.result?.riskLevel === 'high').length}
                    </p>
                    <p className="text-sm text-gray-500">{locale === 'zh' ? '高风险' : 'High Risk'}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Instructions */}
          <div className="space-y-6">
            {/* 使用说明 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{locale === 'zh' ? '使用说明' : 'Instructions'}</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </span>
                  <span>{locale === 'zh' ? '选择查询类型（企业或产品）' : 'Select query type (company or product)'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </span>
                  <span>{locale === 'zh' ? '下载对应模板文件' : 'Download the template file'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </span>
                  <span>{locale === 'zh' ? '填写数据并保存为Excel或CSV' : 'Fill in data and save as Excel or CSV'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    4
                  </span>
                  <span>{locale === 'zh' ? '上传文件等待处理完成' : 'Upload file and wait for processing'}</span>
                </li>
              </ol>
            </div>

            {/* 支持的市场 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{locale === 'zh' ? '支持的市场' : 'Supported Markets'}</h3>
              <div className="space-y-2">
                {[
                  { flag: '🇺🇸', name: '美国 FDA', count: '150万+' },
                  { flag: '🇪🇺', name: '欧盟 CE', count: '80万+' },
                  { flag: '🇨🇳', name: '中国 NMPA', count: '30万+' },
                  { flag: '🇯🇵', name: '日本 PMDA', count: '20万+' },
                ].map((market) => (
                  <div
                    key={market.name}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{market.flag}</span>
                      <span className="text-sm text-gray-700">{market.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{market.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 注意事项 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1">{locale === 'zh' ? '注意事项' : 'Notes'}</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• {locale === 'zh' ? '单次最多支持1000条查询' : 'Maximum 1000 queries per batch'}</li>
                    <li>• {locale === 'zh' ? '文件大小不超过10MB' : 'File size limit: 10MB'}</li>
                    <li>• {locale === 'zh' ? '支持 .xlsx, .xls, .csv 格式' : 'Supports .xlsx, .xls, .csv formats'}</li>
                    <li>• {locale === 'zh' ? '查询结果保留7天' : 'Results retained for 7 days'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
