'use client'

import { useState, useEffect } from 'react'
import { Database, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, BarChart3, Globe, FileText, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { QualityReport } from '@/components/regulations/RegulationQualityComponents'
import {
  CompletenessIndicator,
  QualityScoreCard,
  MarketDistributionCard,
  TypeDistributionCard,
  CategoryDistributionCard,
  DuplicateRateCard,
  QualitySummaryCard
} from '@/components/regulations/RegulationQualityComponents'

export default function RegulationQualityPage() {
  const [report, setReport] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string>('')

  // 加载质量报告
  useEffect(() => {
    const loadQualityReport = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/regulations/quality')
        const data = await response.json()
        
        if (data.success) {
          setReport(data.qualityReport)
          setLastChecked(new Date().toLocaleString('zh-CN'))
        }
      } catch (error) {
        console.error('加载质量报告失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadQualityReport()
  }, [])

  // 手动触发检查
  const handleTriggerCheck = async () => {
    try {
      const response = await fetch('/api/regulations/quality', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`质量检查完成！评分: ${data.qualityReport.completeness.score}`)
        setReport(data.qualityReport)
        setLastChecked(new Date().toLocaleString('zh-CN'))
      }
    } catch (error) {
      console.error('触发检查失败:', error)
      alert('触发检查失败，请稍后重试')
    }
  }

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">正在加载质量报告...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">暂无质量报告</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">请先触发质量检查</p>
          <Button onClick={handleTriggerCheck}>
            <RefreshCw className="w-4 h-4 mr-2" />
            立即检查
          </Button>
        </div>
      </div>
    )
  }

  const { status, completeness, duplicateRate } = report
  const score = parseFloat(completeness.score)
  const rate = parseFloat(duplicateRate.rate)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">法规数据质量监控</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            实时监控法规数据质量，确保数据完整性和一致性
          </p>
        </div>
        <Button onClick={handleTriggerCheck} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '检查中...' : '重新检查'}
        </Button>
      </div>

      {/* 摘要卡片 */}
      <QualitySummaryCard report={report} />

      {/* 质量评分 */}
      <QualityScoreCard report={report} />

      {/* 质量指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              数据总量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.total.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">条法规记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              完整度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {score.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">必填字段覆盖率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className={`w-5 h-5 mr-2 ${rate < 0.05 ? 'text-green-600' : 'text-red-600'}`} />
              重复率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${rate < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
              {rate.toFixed(2)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">标题重复率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              最后更新
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {report.lastUpdate ? new Date(report.lastUpdate).toLocaleDateString('zh-CN') : '从未更新'}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">数据同步时间</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              完整度指标
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CompletenessIndicator
              label="标题完整"
              current={completeness.title_complete}
              total={completeness.total}
              passed={completeness.title_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label="市场完整"
              current={completeness.jurisdiction_complete}
              total={completeness.total}
              passed={completeness.jurisdiction_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label="生效日期完整"
              current={completeness.effective_date_complete}
              total={completeness.total}
              passed={completeness.effective_date_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label="内容完整"
              current={completeness.content_complete}
              total={completeness.total}
              passed={completeness.content_complete / completeness.total >= 0.9}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              数据分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MarketDistributionCard distribution={report.distribution} />
            <TypeDistributionCard distribution={report.distribution} />
            <CategoryDistributionCard distribution={report.distribution} />
          </CardContent>
        </Card>
      </div>

      {/* 重复率详情 */}
      <DuplicateRateCard duplicateRate={duplicateRate} />

      {/* 页脚 */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>最后检查: {lastChecked}</span>
          <span>数据来源: FDA, EU MDCG, NMPA, PMDA, HSA, TGA, Health Canada, MHRA</span>
        </div>
      </div>
    </div>
  )
}
