'use client'

import { Card, CardContent, CardHeader, Badge, Button, Skeleton } from '@/components/ui'
import { DataSourceBadge } from '@/components/medplum/DataSourceBadge'
import { LastUpdateTime } from '@/components/data/LastUpdateTime'
import { Building2, Package, Scale, MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from './EmptyState'

interface SearchResultItem {
  id: string
  name: string
  company_name?: string
  market?: string
  market_code?: string
  device_class?: string
  product_code?: string
  status?: string
  registration_number?: string
  regulation_number?: string
  country?: string
  website?: string
  title?: string
  title_zh?: string
  summary?: string
  summary_zh?: string
  issuing_authority?: string
  document_type?: string
  effective_date?: string
  category_id?: string
  created_at?: string
  updated_at?: string
  _resultType?: 'product' | 'company' | 'regulation'
  [key: string]: string | number | boolean | null | undefined
}

interface SearchResultsProps {
  results: SearchResultItem[]
  type?: 'all' | 'product' | 'company' | 'regulation'
}

function getResultType(result: SearchResultItem, propType?: string): 'product' | 'company' | 'regulation' {
  // Use the explicit _resultType marker first
  if (result._resultType) return result._resultType
  // Fallback: infer from prop type and data shape
  if (propType === 'regulation') return 'regulation'
  if (propType === 'company') return 'company'
  if (propType === 'product') return 'product'
  // For 'all' type, infer from data shape
  if (result.regulation_number || result.issuing_authority || result.document_type) return 'regulation'
  if (result.company_name) return 'product'
  return 'company'
}

function getDetailLink(result: SearchResultItem, resultType: 'product' | 'company' | 'regulation'): string {
  switch (resultType) {
    case 'product':
      return `/products/${result.id}`
    case 'company':
      return `/company/${result.id}`
    case 'regulation':
      return `/regulations/${result.id}`
  }
}

function getTypeIcon(resultType: 'product' | 'company' | 'regulation') {
  switch (resultType) {
    case 'product':
      return Package
    case 'company':
      return Building2
    case 'regulation':
      return Scale
  }
}

function getTypeLabel(resultType: 'product' | 'company' | 'regulation'): string {
  switch (resultType) {
    case 'product':
      return 'Product'
    case 'company':
      return 'Company'
    case 'regulation':
      return 'Regulation'
  }
}

export function SearchResults({ results, type = 'all' }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <EmptyState 
        type="no-results" 
        message="No results found. Try adjusting your search or filters."
      />
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const resultType = getResultType(result, type)
        const Icon = getTypeIcon(resultType)
        const detailLink = getDetailLink(result, resultType)
        const typeLabel = getTypeLabel(resultType)

        return (
          <Card key={`${resultType}-${result.id}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Link 
                      href={detailLink}
                      className="text-xl font-semibold hover:text-primary transition-colors truncate"
                    >
                      {resultType === 'regulation'
                        ? (result.title || result.name || result.regulation_number || 'Unknown Regulation')
                        : (result.name || result.company_name || 'Unknown')
                      }
                    </Link>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0 text-xs">
                      {typeLabel}
                    </Badge>
                  </div>
                  
                  {/* Product-specific fields */}
                  {resultType === 'product' && result.company_name && (
                    <p className="text-sm text-muted-foreground">
                      Manufacturer: {result.company_name}
                    </p>
                  )}

                  {/* Regulation-specific fields */}
                  {resultType === 'regulation' && (
                    <>
                      {result.title_zh && (
                        <p className="text-sm text-muted-foreground">
                          {result.title_zh}
                        </p>
                      )}
                      {result.issuing_authority && (
                        <p className="text-sm text-muted-foreground">
                          Authority: {result.issuing_authority}
                        </p>
                      )}
                      {result.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {result.summary}
                        </p>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {resultType === 'regulation' ? (
                      <>
                        {result.regulation_number && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {result.regulation_number}
                          </Badge>
                        )}
                        {result.market_code && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {result.market_code}
                          </Badge>
                        )}
                        {result.document_type && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {result.document_type}
                          </Badge>
                        )}
                        {result.status && (
                          <span className="flex items-center gap-1">
                            Status: {result.status}
                          </span>
                        )}
                        {result.effective_date && (
                          <span className="flex items-center gap-1">
                            Effective: {result.effective_date}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {(result.market || result.market_code) && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {result.market || result.market_code}
                          </Badge>
                        )}
                        {result.device_class && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {result.device_class}
                          </Badge>
                        )}
                        {result.status && (
                          <span className="flex items-center gap-1">
                            Status: {result.status}
                          </span>
                        )}
                        {result.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {result.country}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    {typeof result.data_source === 'string' && result.data_source && (
                      <DataSourceBadge source={result.data_source as any} />
                    )}
                    {result.last_updated_at && typeof result.last_updated_at === 'string' && (
                      <LastUpdateTime 
                        timestamp={result.last_updated_at}
                        showNextUpdate={false}
                      />
                    )}
                  </div>
                </div>
                
                <Link href={detailLink} className="flex-shrink-0 ml-4">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    More
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
