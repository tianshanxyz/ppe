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
import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function RegulationQualityPage() {
  const locale = useLocale()
  const [report, setReport] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string>('')

  useEffect(() => {
    const loadQualityReport = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/regulations/quality')
        const data = await response.json()
        
        if (data.success) {
          setReport(data.qualityReport)
          setLastChecked(new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'))
        }
      } catch (error) {
        console.error(locale === 'zh' ? '加载质量报告失败:' : 'Failed to load quality report:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadQualityReport()
  }, [locale])

  const handleTriggerCheck = async () => {
    try {
      const response = await fetch('/api/regulations/quality', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(locale === 'zh' ? `质量检查完成！评分: ${data.qualityReport.completeness.score}` : `Quality check complete! Score: ${data.qualityReport.completeness.score}`)
        setReport(data.qualityReport)
        setLastChecked(new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'))
      }
    } catch (error) {
      console.error(locale === 'zh' ? '触发检查失败:' : 'Failed to trigger check:', error)
      alert(locale === 'zh' ? '触发检查失败，请稍后重试' : 'Failed to trigger check, please try again later')
    }
  }

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{locale === 'zh' ? '正在加载质量报告...' : 'Loading quality report...'}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{locale === 'zh' ? '暂无质量报告' : 'No Quality Report'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{locale === 'zh' ? '请先触发质量检查' : 'Please trigger a quality check first'}</p>
          <Button onClick={handleTriggerCheck}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {locale === 'zh' ? '立即检查' : 'Check Now'}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{locale === 'zh' ? '法规数据质量监控' : 'Regulation Data Quality Monitor'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {locale === 'zh' ? '实时监控法规数据质量，确保数据完整性和一致性' : 'Real-time monitoring of regulation data quality, ensuring data completeness and consistency'}
          </p>
        </div>
        <Button onClick={handleTriggerCheck} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? (locale === 'zh' ? '检查中...' : 'Checking...') : (locale === 'zh' ? '重新检查' : 'Re-check')}
        </Button>
      </div>

      <QualitySummaryCard report={report} />
      <QualityScoreCard report={report} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              {locale === 'zh' ? '数据总量' : 'Total Records'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.total.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '条法规记录' : 'regulation records'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {locale === 'zh' ? '完整度' : 'Completeness'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {score.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '必填字段覆盖率' : 'Required field coverage'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className={`w-5 h-5 mr-2 ${rate < 0.05 ? 'text-green-600' : 'text-red-600'}`} />
              {locale === 'zh' ? '重复率' : 'Duplicate Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${rate < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
              {rate.toFixed(2)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '标题重复率' : 'Title duplicate rate'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              {locale === 'zh' ? '最后更新' : 'Last Updated'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {report.lastUpdate ? new Date(report.lastUpdate).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US') : (locale === 'zh' ? '从未更新' : 'Never updated')}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '数据同步时间' : 'Data sync time'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {locale === 'zh' ? '完整度指标' : 'Completeness Metrics'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CompletenessIndicator
              label={locale === 'zh' ? '标题完整' : 'Title Complete'}
              current={completeness.title_complete}
              total={completeness.total}
              passed={completeness.title_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label={locale === 'zh' ? '市场完整' : 'Market Complete'}
              current={completeness.jurisdiction_complete}
              total={completeness.total}
              passed={completeness.jurisdiction_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label={locale === 'zh' ? '生效日期完整' : 'Effective Date Complete'}
              current={completeness.effective_date_complete}
              total={completeness.total}
              passed={completeness.effective_date_complete / completeness.total >= 0.9}
            />
            <CompletenessIndicator
              label={locale === 'zh' ? '内容完整' : 'Content Complete'}
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
              {locale === 'zh' ? '数据分布' : 'Data Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MarketDistributionCard distribution={report.distribution} />
            <TypeDistributionCard distribution={report.distribution} />
            <CategoryDistributionCard distribution={report.distribution} />
          </CardContent>
        </Card>
      </div>

      <DuplicateRateCard duplicateRate={duplicateRate} />

      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{locale === 'zh' ? '最后检查' : 'Last Checked'}: {lastChecked}</span>
          <span>{locale === 'zh' ? '数据来源' : 'Data Source'}: FDA, EU MDCG, NMPA, PMDA, HSA, TGA, Health Canada, MHRA</span>
        </div>
      </div>
    </div>
  )
}
