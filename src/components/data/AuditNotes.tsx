'use client'

import { useState, useEffect } from 'react'
import { History, RotateCcw, User } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface AuditLogEntry {
  id: string
  targetType: string
  targetId: string
  fieldName?: string
  oldValue: any
  newValue: any
  action: 'approved' | 'rolled_back'
  performedByName: string
  note?: string
  createdAt: string
}

interface AuditNotesProps {
  targetType: 'product' | 'company'
  targetId: string
}

export function AuditNotes({ targetType, targetId }: AuditNotesProps) {
  const locale = useLocale()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/audit-log?targetType=${targetType}&targetId=${targetId}`)
        const data = await res.json()
        setLogs(data.logs || [])
      } catch (e) {
        console.error('Failed to load audit logs:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [targetType, targetId])

  if (loading || logs.length === 0) {
    return null
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <History className="w-3 h-3" />
        <span>
          {locale === 'zh' ? `修改记录 (${logs.length})` : `Modification History (${logs.length})`}
        </span>
        <span className="text-gray-300">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-xs text-gray-400 py-1">
              {log.action === 'rolled_back' ? (
                <RotateCcw className="w-3 h-3 mt-0.5 text-orange-400 flex-shrink-0" />
              ) : (
                <User className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
              )}
              <span>
                {log.note || `${new Date(log.createdAt).toLocaleDateString('zh-CN')} ${log.performedByName} ${log.action === 'rolled_back' ? (locale === 'zh' ? '回滚了' : 'rolled back') : (locale === 'zh' ? '修改了' : 'modified')}"${log.fieldName}"`}
                {log.action === 'approved' && log.oldValue !== undefined && log.newValue !== undefined && (
                  <span className="text-gray-300 ml-1">
                    ({String(log.oldValue || '(empty)')} → {String(log.newValue)})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}