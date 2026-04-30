'use client'

import { useState, useEffect, use } from 'react'
import { useParams } from 'next/navigation'
import { CompanyDetail } from './CompanyDetail'
import { Loader2 } from 'lucide-react'

interface CompanyData {
  company: {
    id: string
    name: string
    name_zh?: string
    country?: string
    address?: string
    data_sources?: string[]
    market?: string
    source?: string
    created_at: string
    updated_at?: string
    trustScore?: {
      score: number
      level: 'HIGH' | 'MEDIUM' | 'LOW'
      factors: Array<{
        factor: string
        score: number
        weight: number
      }>
      lastUpdated: string
    }
    productCount?: number
    metadata?: Record<string, any>
  }
  products: Array<{
    id: string
    name: string
    product_code?: string
    device_class?: string
    data_source: string
    source_id?: string
    registration_date?: string
    status?: string
    market: string
    metadata?: Record<string, any>
  }>
  alerts: Array<{
    id: string
    entity_type: string
    entity_id: string
    risk_level: 'high' | 'medium' | 'low'
    risk_type: string
    description: string
    detected_at: string
  }>
  history: Array<{
    id: string
    entity_type: string
    entity_id: string
    change_type: string
    field_name?: string
    old_value?: string
    new_value?: string
    changed_at: string
    changed_by?: string
  }>
  sources: Array<{
    id: string
    entity_type: string
    entity_id: string
    source_name: string
    source_url?: string
    source_type: string
    last_verified_at?: string
  }>
}

export default function CompanyDetailPage() {
  const params = useParams()
  const id = (params as any).id as string

  const [data, setData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/companies/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Company not found')
          }
          throw new Error('Failed to fetch company data')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Failed to fetch company:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCompanyData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#339999] mx-auto mb-4" />
          <p className="text-gray-500">Loading company data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-gray-500">The requested company could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <CompanyDetail
      company={data.company}
      products={data.products}
      alerts={data.alerts}
      history={data.history}
      sources={data.sources}
    />
  )
}
