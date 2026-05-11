'use client'

import { useState } from 'react'
import { PenTool, Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface EditContentButtonProps {
  targetType: 'product' | 'company'
  targetId: string
  targetName: string
  fieldName: string
  fieldLabel: string
  currentValue: any
  onSubmitted?: () => void
}

export function EditContentButton({
  targetType,
  targetId,
  targetName,
  fieldName,
  fieldLabel,
  currentValue,
  onSubmitted
}: EditContentButtonProps) {
  const locale = useLocale()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(currentValue || ''))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return ''
    try {
      return JSON.parse(stored)?.token || ''
    } catch { return '' }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const token = getToken()
      const res = await fetch('/api/content-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          targetName,
          fieldName,
          oldValue: currentValue,
          newValue: value
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(locale === 'zh' ? '修改已提交，等待管理员审核' : 'Change submitted for admin review')
        setEditing(false)
        onSubmitted?.()
      } else {
        setError(data.error || (locale === 'zh' ? '提交失败' : 'Submission failed'))
      }
    } catch {
      setError(locale === 'zh' ? '网络错误' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!getToken()) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-1">
      {!editing ? (
        <button
          onClick={() => {
            setEditing(true)
            setValue(String(currentValue || ''))
            setError('')
            setMessage('')
          }}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#339999] transition-colors"
          title={locale === 'zh' ? `编辑${fieldLabel}` : `Edit ${fieldLabel}`}
        >
          <PenTool className="w-3 h-3" />
        </button>
      ) : (
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-[#339999]"
            placeholder={fieldLabel}
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || value === String(currentValue)}
            className="text-green-600 hover:bg-green-50 p-1 rounded disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-red-400 hover:bg-red-50 p-1 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {message && <span className="text-xs text-green-600 ml-1">{message}</span>}
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  )
}