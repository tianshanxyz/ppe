'use client'

import { Card, CardContent } from '@/components/ui'
import { DataSourceBadge } from '@/components/data/DataSourceBadge'
import { Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface SearchResultItem {
  id?: string
  name?: string
  company_name?: string
  market?: string
  device_class?: string
  product_code?: string
  status?: string
  registration_number?: string
  country?: string
  website?: string
  type?: 'company' | 'product' | 'eudamed'
  [key: string]: string | number | boolean | null | undefined
}

interface SearchResult {
  companies: SearchResultItem[]
  products: SearchResultItem[]
  eudamed: SearchResultItem[]
  total: number
  breakdown: {
    companies: number
    products: number
    eudamed: number
  }
}

interface SearchResultsViewProps {
  results: SearchResult
  query: string
  page: number
  onPageChange: (page: number) => void
}

export function SearchResultsView({ results, page, onPageChange }: SearchResultsViewProps) {
  // Combine all results for display
  const allResults = [
    ...(results.companies || []).map((c) => ({ ...c, type: 'company' })),
    ...(results.products || []).map((p) => ({ ...p, type: 'product' })),
    ...(results.eudamed || []).map((e) => ({ ...e, type: 'eudamed' }))
  ]

  if (allResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No results found. Try adjusting your search or filters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {allResults.map((result, index) => (
        <Card key={`${result.id || index}-${result.type}`} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <Link 
                    href={`/company/${result.id}`}
                    className="text-xl font-semibold hover:text-primary-600 transition-colors"
                  >
                    {result.name || 'Unknown'}
                  </Link>
                </div>
                
                {/* Chinese name display removed - not available in current data structure */}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {result.country || result.market || 'Unknown'}
                  </span>
                </div>
                
                {/* Data source badge removed - not available in current data structure */}
              </div>
              
              <Link href={`/company/${result.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Pagination - Simple for now */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-gray-500">
          Page {page}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
