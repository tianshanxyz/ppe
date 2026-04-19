'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Database,
  FileText,
  Calendar,
  Download,
  ExternalLink
} from 'lucide-react'

interface AuditReport {
  id: string
  report_type: string
  status: 'passed' | 'warning' | 'failed'
  summary: string
  details: Record<string, any>
  created_at: string
  completed_at: string | null
}

interface DataSourceHealth {
  id: string
  name: string
  display_name: string
  status: string
  record_count: number
  last_sync_at: string | null
  health_score: number
  issues: string[]
}

const statusConfig = {
  passed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Passed'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Warning'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Failed'
  }
}

export default function AuditPage() {
  const [reports, setReports] = useState<AuditReport[]>([])
  const [dataSources, setDataSources] = useState<DataSourceHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningAudit, setIsRunningAudit] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch audit reports
      const reportsRes = await fetch('/api/audit')
      const reportsData = await reportsRes.json()
      
      if (reportsData.success) {
        setReports(reportsData.data)
      }
      
      // Fetch data source health
      const healthRes = await fetch('/api/data-sources/health')
      const healthData = await healthRes.json()
      
      if (healthData.success) {
        setDataSources(healthData.data)
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAudit = async () => {
    try {
      setIsRunningAudit(true)
      
      const response = await fetch('/api/audit/run', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error running audit:', error)
    } finally {
      setIsRunningAudit(false)
    }
  }

  const exportReport = (report: AuditReport) => {
    const reportData = {
      ...report,
      generated_at: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${report.report_type}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const overallHealth = dataSources.length > 0
    ? Math.round(dataSources.reduce((sum, ds) => sum + ds.health_score, 0) / dataSources.length)
    : 0

  const criticalIssues = dataSources.reduce((sum, ds) => 
    sum + ds.issues.filter(i => i.includes('critical') || i.includes('failed')).length, 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Audit</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor data quality and compliance
              </p>
            </div>
            <button
              onClick={runAudit}
              disabled={isRunningAudit}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
              {isRunningAudit ? 'Running Audit...' : 'Run Audit'}
            </button>
          </div>

          {/* Health Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallHealth >= 80 ? 'bg-green-100' : overallHealth >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
                  <Shield className={`w-6 h-6 ${overallHealth >= 80 ? 'text-green-600' : overallHealth >= 60 ? 'text-amber-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{overallHealth}%</p>
                  <p className="text-sm text-gray-500">Overall Health</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{dataSources.length}</p>
                  <p className="text-sm text-gray-500">Data Sources</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                  <p className="text-sm text-gray-500">Audit Reports</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-8 h-8 ${criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{criticalIssues}</p>
                  <p className="text-sm text-gray-500">Critical Issues</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Source Health */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Source Health</h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : dataSources.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No data sources configured</p>
                </div>
              ) : (
                dataSources.map((source) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{source.display_name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            source.health_score >= 80 ? 'bg-green-100 text-green-700' :
                            source.health_score >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {source.health_score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {source.record_count.toLocaleString()} records
                          {source.last_sync_at && (
                            <span className="ml-2">
                              · Last sync: {new Date(source.last_sync_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        
                        {source.issues.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {source.issues.map((issue, idx) => (
                              <p key={idx} className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {issue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        source.status === 'active' ? 'bg-green-100 text-green-700' :
                        source.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {source.status}
                      </div>
                    </div>
                    
                    {/* Health Bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            source.health_score >= 80 ? 'bg-green-500' :
                            source.health_score >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${source.health_score}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Audit Reports */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Audit Reports</h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No audit reports yet</p>
                  <button
                    onClick={runAudit}
                    className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Run your first audit
                  </button>
                </div>
              ) : (
                reports.map((report) => {
                  const config = statusConfig[report.status]
                  const Icon = config.icon
                  
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border rounded-lg p-4 ${config.borderColor}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 capitalize">
                              {report.report_type.replace('_', ' ')} Audit
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{report.summary}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(report.created_at).toLocaleString()}
                              </span>
                              {report.completed_at && (
                                <span>
                                  Duration: {Math.round((new Date(report.completed_at).getTime() - new Date(report.created_at).getTime()) / 1000)}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => exportReport(report)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {report.details && Object.keys(report.details).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(report.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
