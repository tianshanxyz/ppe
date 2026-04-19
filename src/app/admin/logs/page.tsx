'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  Filter,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'

interface LogEntry {
  id: string
  data_source_id: string
  operation_type: string
  status: 'running' | 'completed' | 'failed' | 'partial'
  records_processed: number
  records_inserted: number
  records_updated: number
  records_failed: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  metadata: Record<string, any>
  data_sources: {
    name: string
    display_name: string
  }
}

const statusConfig = {
  running: {
    icon: RefreshCw,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    label: 'Running'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Completed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Failed'
  },
  partial: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Partial'
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      params.append('limit', '100')
      
      const response = await fetch(`/api/logs?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (started: string, completed: string | null) => {
    const start = new Date(started)
    const end = completed ? new Date(completed) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`
    }
    return `${diffSecs}s`
  }

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'Data Source', 'Operation', 'Status', 'Processed', 'Inserted', 'Updated', 'Failed', 'Started', 'Duration'].join(','),
      ...logs.map(log => [
        log.id,
        log.data_sources?.display_name || log.data_source_id,
        log.operation_type,
        log.status,
        log.records_processed,
        log.records_inserted,
        log.records_updated,
        log.records_failed,
        new Date(log.started_at).toISOString(),
        formatDuration(log.started_at, log.completed_at)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-sync-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalProcessed = logs.reduce((sum, log) => sum + log.records_processed, 0)
  const totalInserted = logs.reduce((sum, log) => sum + log.records_inserted, 0)
  const successRate = logs.length > 0 
    ? (logs.filter(l => l.status === 'completed').length / logs.length * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Sync Logs</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track data synchronization operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={fetchLogs}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalProcessed.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Records Processed</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalInserted.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Records Inserted</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                  <p className="text-sm text-gray-500">Total Operations</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(successRate) >= 90 ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <span className={`text-lg font-bold ${Number(successRate) >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                    {successRate}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Success Rate</p>
                  <p className="text-sm text-gray-500">Last 100 operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
            <p className="text-gray-500">No sync operations match your filters</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const config = statusConfig[log.status]
                  const Icon = config.icon
                  
                  return (
                    <>
                      <tr 
                        key={log.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.data_sources?.display_name || log.data_source_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {log.operation_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.records_processed.toLocaleString()}</span>
                            {log.records_failed > 0 && (
                              <span className="text-red-600">({log.records_failed} failed)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.started_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(log.started_at, log.completed_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {expandedLog === log.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 uppercase">Processed</p>
                                  <p className="text-lg font-semibold text-gray-900">{log.records_processed.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 uppercase">Inserted</p>
                                  <p className="text-lg font-semibold text-green-600">{log.records_inserted.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 uppercase">Updated</p>
                                  <p className="text-lg font-semibold text-primary-600">{log.records_updated.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 uppercase">Failed</p>
                                  <p className="text-lg font-semibold text-red-600">{log.records_failed.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              {log.error_message && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <p className="text-sm font-medium text-red-800">Error:</p>
                                  <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                                </div>
                              )}
                              
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <p className="text-sm font-medium text-gray-900 mb-2">Metadata:</p>
                                  <pre className="text-xs text-gray-600 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
