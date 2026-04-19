'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database_connected: boolean
    redis_connected: boolean
    environment_valid: boolean
  }
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health?detailed=true')
        if (!response.ok) {
          throw new Error('Health check failed')
        }
        const data = await response.json()
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // 每 30 秒检查一次

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading status</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'unhealthy':
        return <AlertTriangle className="w-6 h-6 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time system health and performance metrics</p>
        </div>

        {/* Overall Status */}
        {health && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(health.status)}
                <div>
                  <h2 className="text-2xl font-semibold capitalize">{health.status.replace('_', ' ')}</h2>
                  <p className="text-gray-500 text-sm">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(health.status)}`}>
                v{health.version}
              </div>
            </div>
          </div>
        )}

        {/* Health Checks Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Database Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${health.checks.database_connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <h3 className="text-lg font-semibold">Database</h3>
              </div>
              <p className="text-gray-600">
                {health.checks.database_connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            {/* Redis Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${health.checks.redis_connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <h3 className="text-lg font-semibold">Redis Cache</h3>
              </div>
              <p className="text-gray-600">
                {health.checks.redis_connected ? 'Connected' : 'Not Configured'}
              </p>
            </div>

            {/* Environment Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${health.checks.environment_valid ? 'bg-green-500' : 'bg-red-500'}`} />
                <h3 className="text-lg font-semibold">Environment</h3>
              </div>
              <p className="text-gray-600">
                {health.checks.environment_valid ? 'Valid' : 'Invalid Configuration'}
              </p>
            </div>
          </div>
        )}

        {/* System Metrics */}
        {health && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-semibold">
                  {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Version</p>
                <p className="text-lg font-semibold">{health.version}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold capitalize">{health.status}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Last Check</p>
                <p className="text-lg font-semibold">{new Date(health.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sentry Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Error Monitoring (Sentry)</h3>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <p className="font-medium">Sentry Integration</p>
              <p className="text-gray-500 text-sm">Production error tracking is enabled</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>DSN:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured ✓' : 'Not configured ✗'}
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
