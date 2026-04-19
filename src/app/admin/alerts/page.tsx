'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  Filter,
  RefreshCw,
  Bell,
  AlertOctagon,
  Info
} from 'lucide-react'

interface Alert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  status: 'active' | 'resolved' | 'ignored'
  created_at: string
  resolved_at: string | null
  data_source_id: string
  metadata: Record<string, any>
}

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Critical'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Warning'
  },
  info: {
    icon: Info,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    label: 'Info'
  }
}

const alertTypeLabels: Record<string, string> = {
  stale_data: 'Stale Data',
  low_record_count: 'Low Record Count',
  sync_failure: 'Sync Failure',
  api_error: 'API Error',
  high_failure_rate: 'High Failure Rate'
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  useEffect(() => {
    fetchAlerts()
  }, [filter, severityFilter])

  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (severityFilter !== 'all') params.append('severity', severityFilter)
      
      const response = await fetch(`/api/alerts?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resolveAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      })
      
      if (response.ok) {
        setAlerts(alerts.map(a => 
          a.id === id ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a
        ))
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const ignoreAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' })
      })
      
      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Error ignoring alert:', error)
    }
  }

  const activeCount = alerts.filter(a => a.status === 'active').length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor data quality and system health
              </p>
            </div>
            <button
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
                  <p className="text-sm text-red-700">Critical Alerts</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-900">
                    {alerts.filter(a => a.severity === 'warning' && a.status === 'active').length}
                  </p>
                  <p className="text-sm text-amber-700">Warnings</p>
                </div>
              </div>
            </div>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold text-primary-900">{activeCount}</p>
                  <p className="text-sm text-primary-700">Total Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No alerts</h3>
            <p className="text-gray-500">All systems are operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity]
                const Icon = config.icon
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-white border rounded-lg p-6 ${config.borderColor} ${alert.status === 'resolved' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {alertTypeLabels[alert.alert_type] || alert.alert_type}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                            <p className="mt-1 text-gray-600">{alert.message}</p>
                            
                            {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(alert.metadata).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                              {alert.resolved_at && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Resolved {new Date(alert.resolved_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {alert.status === 'active' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                              </button>
                              <button
                                onClick={() => ignoreAlert(alert.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
