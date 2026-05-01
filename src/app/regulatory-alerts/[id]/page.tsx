'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, Globe, FileText, CheckCircle2, ExternalLink, Bell } from 'lucide-react'
import { REGULATORY_ALERTS } from '../page'

export default function RegulatoryAlertDetailPage() {
  const params = useParams()
  const alertId = params.id as string

  const alert = REGULATORY_ALERTS.find(a => a.id === alertId)

  if (!alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alert Not Found</h1>
          <p className="text-gray-500 mb-6">The regulatory alert you are looking for does not exist.</p>
          <Link href="/regulatory-alerts" className="text-[#339999] hover:underline">
            Back to Regulatory Alerts
          </Link>
        </div>
      </div>
    )
  }

  const relatedAlerts = REGULATORY_ALERTS.filter(
    a => a.market === alert.market && a.id !== alert.id
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200'
      case 'high': return 'bg-orange-50 border-orange-200'
      case 'medium': return 'bg-yellow-50 border-yellow-200'
      case 'low': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/regulatory-alerts" className="inline-flex items-center text-sm text-[#339999] hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Regulatory Alerts
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getSeverityColor(alert.severity)}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {alert.severity}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              <Globe className="w-3.5 h-3.5" />
              {alert.market}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              {alert.date}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{alert.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#339999]" />
            <h2 className="text-xl font-bold text-gray-900">Summary</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{alert.summary}</p>
        </div>

        {/* Full Text Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#339999]" />
            <h2 className="text-xl font-bold text-gray-900">Full Details</h2>
          </div>
          <div className="text-gray-700 leading-relaxed space-y-4">
            {alert.fullText.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Required Action Section */}
        <div className={`rounded-2xl shadow-lg border-l-4 p-8 ${getSeverityBg(alert.severity)}`}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#339999]" />
            <h2 className="text-xl font-bold text-gray-900">Required Action</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{alert.action}</p>
        </div>

        {/* Reference Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-[#339999]" />
            <h2 className="text-xl font-bold text-gray-900">Reference</h2>
          </div>
          <p className="text-gray-700">{alert.reference}</p>
          {alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-[#339999]/10 text-[#339999] rounded-lg hover:bg-[#339999]/20 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View Official Source
            </a>
          )}
        </div>

        {/* Related Alerts Section */}
        {relatedAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-[#339999]" />
              <h2 className="text-xl font-bold text-gray-900">Related Alerts in {alert.market}</h2>
            </div>
            <div className="space-y-4">
              {relatedAlerts.map(related => (
                <Link
                  key={related.id}
                  href={`/regulatory-alerts/${related.id}`}
                  className="block p-4 rounded-xl border border-gray-200 hover:border-[#339999] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getSeverityColor(related.severity)}`}>
                          {related.severity}
                        </span>
                        <span className="text-xs text-gray-400">{related.date}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{related.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{related.summary}</p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
